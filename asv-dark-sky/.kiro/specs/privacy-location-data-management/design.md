# Design Document: Privacy & Location Data Management

## Overview

This design implements privacy-preserving location obfuscation and user data management for the Sky Quality Meter (SQM) mobile application. The system will protect user privacy by obfuscating GPS coordinates before sharing measurements publicly, while maintaining precise coordinates locally for the user's personal history. Users will be able to manage their contributions through a device-based identifier system that requires no account creation.

The design integrates with the existing React Native/Expo application architecture and extends the current storage utilities, camera workflow, and backend API communication patterns.

## Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Camera     │  │   History    │  │   Storage    │      │
│  │   Screen     │  │   Screen     │  │   Utils      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │  Privacy Layer  │                        │
│                   │  - Obfuscation  │                        │
│                   │  - Device ID    │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Backend API   │
                    │  - Calculate    │
                    │  - Store        │
                    │  - Delete       │
                    └─────────────────┘
```

### Design Decisions

1. **Client-Side Obfuscation**: Location obfuscation occurs on the device before sending data to the backend. This ensures precise coordinates never leave the device, providing defense-in-depth privacy protection.

2. **Device Identifier Strategy**: Using a UUID stored in AsyncStorage provides persistent identity without requiring user accounts. This balances data management capabilities with user privacy and simplicity.

3. **Dual Storage Model**: Measurements are stored with precise coordinates locally and obfuscated coordinates remotely. This allows users to maintain accurate personal records while contributing anonymized data to the community.

4. **Graceful Degradation**: Delete operations remove local data immediately and attempt backend deletion. If the backend is unreachable, users are notified but local deletion proceeds, preventing data from being "stuck" on the device.

## Components and Interfaces

### 1. Location Obfuscation Module

**File**: `utils/locationObfuscation.ts`

**Purpose**: Provides deterministic, testable location obfuscation algorithms.

**Interface**:

```typescript
interface ObfuscatedCoordinates {
  latitude: number;
  longitude: number;
}

interface PreciseCoordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
}

/**
 * Obfuscates GPS coordinates by reducing precision and adding random offset
 * @param coords - Precise GPS coordinates
 * @param fuzzingRadius - Radius in meters for random offset (default: 500)
 * @returns Obfuscated coordinates
 */
function obfuscateLocation(
  coords: PreciseCoordinates,
  fuzzingRadius?: number
): ObfuscatedCoordinates;

/**
 * Reduces coordinate precision to 2 decimal places (~1.1km precision)
 * @param value - Coordinate value (latitude or longitude)
 * @returns Rounded coordinate
 */
function reducePrecision(value: number): number;

/**
 * Adds random offset within fuzzing radius using uniform distribution
 * @param lat - Latitude
 * @param lon - Longitude
 * @param radiusMeters - Fuzzing radius in meters
 * @returns Coordinates with random offset applied
 */
function addRandomOffset(
  lat: number,
  lon: number,
  radiusMeters: number
): ObfuscatedCoordinates;

/**
 * Ensures coordinates remain within valid GPS ranges
 * @param lat - Latitude (-90 to 90)
 * @param lon - Longitude (-180 to 180)
 * @returns Clamped coordinates
 */
function clampCoordinates(lat: number, lon: number): ObfuscatedCoordinates;
```

**Algorithm Details**:

- Precision reduction: Round to 2 decimal places (≈1.1km at equator)
- Random offset: Uniform distribution within 500m radius
- Coordinate conversion: Use Haversine-based offset calculation to account for Earth's curvature
- Validation: Clamp latitude to [-90, 90] and longitude to [-180, 180]

### 2. Device Identifier Module

**File**: `utils/deviceIdentifier.ts`

**Purpose**: Manages persistent device identification for measurement ownership.

**Interface**:

```typescript
/**
 * Retrieves or generates device identifier
 * @returns Device identifier UUID
 */
async function getDeviceId(): Promise<string>;

/**
 * Generates a new cryptographically secure UUID
 * @returns New UUID string
 */
function generateDeviceId(): string;

/**
 * Stores device identifier in AsyncStorage
 * @param deviceId - UUID to store
 */
async function storeDeviceId(deviceId: string): Promise<void>;
```

**Storage Key**: `@sqm_device_identifier`

**Implementation Notes**:

- Use `expo-crypto` for cryptographically secure random UUID generation
- Check AsyncStorage on first call; generate and store if not present
- Cache in memory after first retrieval to avoid repeated AsyncStorage reads

### 3. Enhanced Storage Module

**File**: `utils/storage.ts` (modifications)

**Purpose**: Extend existing storage to include measurement identifiers and device IDs.

**Updated Interface**:

```typescript
interface SQMMeasurement {
  id: string; // Local ID (timestamp-based)
  measurementId?: string; // Backend measurement ID (for deletion)
  deviceId: string; // Device identifier
  timestamp: string;
  location: {
    latitude: number; // Precise coordinates (local only)
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
  } | null;
  obfuscatedLocation?: {
    // For reference/debugging
    latitude: number;
    longitude: number;
  };
  sqm: number;
  median_brightness: number;
  moon_data?: {
    phase: string;
    illumination: number;
    altitude: number | null;
    impact_magnitude: number;
    impact_description: string;
  };
  sqm_moon_adjusted?: number;
}

/**
 * Save measurement with device ID and measurement ID
 */
async function saveMeasurement(
  location: SQMMeasurement["location"],
  obfuscatedLocation: ObfuscatedCoordinates,
  sqm: number,
  median_brightness: number,
  measurementId: string,
  deviceId: string,
  moon_data?: SQMMeasurement["moon_data"],
  sqm_moon_adjusted?: number
): Promise<void>;

/**
 * Delete measurement locally and from backend
 * @param id - Local measurement ID
 * @returns Success status and any error messages
 */
async function deleteMeasurementWithBackend(
  id: string
): Promise<{ success: boolean; backendDeleted: boolean; error?: string }>;

/**
 * Clear all measurements locally and from backend
 * @param deviceId - Device identifier
 * @returns Count of deleted records and any errors
 */
async function clearAllMeasurementsWithBackend(
  deviceId: string
): Promise<{ localCount: number; backendCount?: number; error?: string }>;
```

### 4. Backend API Client

**File**: `utils/apiClient.ts` (new)

**Purpose**: Centralized API communication with privacy-aware request handling.

**Interface**:

```typescript
interface CalculationRequest {
  light_image: string; // Base64 data URI
  dark_image: string; // Base64 data URI
  zero_point: number;
  exposure_time_s: number;
  metadata: {
    location: ObfuscatedCoordinates; // Obfuscated coordinates
    timestamp: string;
    deviceId: string; // Device identifier
  };
}

interface CalculationResponse {
  measurementId: string; // Unique ID for this measurement
  median_sky_brightness_dn: number;
  sky_quality_meter: number;
  sky_quality_meter_moon_adjusted?: number;
  bortle_class: number;
  bortle_description: string;
  additional_measurements: {
    naked_eye_limiting_magnitude: number;
    luminance_cd_m2: number;
    luminance_mcd_m2: number;
    light_pollution_level: string;
    astronomy_quality: string;
  };
  moon_data?: {
    phase: string;
    illumination: number;
    altitude: number | null;
    impact_magnitude: number;
    impact_description: string;
  };
}

interface DeleteRequest {
  measurementId: string;
  deviceId: string;
}

interface BulkDeleteRequest {
  deviceId: string;
}

interface DeleteResponse {
  success: boolean;
  deletedCount?: number;
  error?: string;
}

/**
 * Send images and obfuscated location for calculation
 */
async function calculateSkyBrightness(
  request: CalculationRequest
): Promise<CalculationResponse>;

/**
 * Delete single measurement from backend
 */
async function deleteMeasurement(
  measurementId: string,
  deviceId: string
): Promise<DeleteResponse>;

/**
 * Delete all measurements for device from backend
 */
async function bulkDeleteMeasurements(
  deviceId: string
): Promise<DeleteResponse>;
```

**Endpoints**:

- `POST /calculate_sky_brightness` - Calculate and store measurement
- `DELETE /measurement/:id` - Delete single measurement
- `DELETE /measurements/bulk` - Delete all measurements for device

### 5. Camera Screen Integration

**File**: `screens/CameraScreen.tsx` (modifications)

**Changes**:

1. Import obfuscation and device ID utilities
2. Obfuscate location before sending to backend
3. Include device ID in API request
4. Store measurement ID from response
5. Save both precise and obfuscated coordinates locally

**Modified Flow**:

```
User captures images
  ↓
Get device ID
  ↓
Obfuscate current location
  ↓
Send images + obfuscated location + device ID to backend
  ↓
Receive calculation result + measurement ID
  ↓
Save to local storage:
  - Precise location (for user)
  - Obfuscated location (for reference)
  - Measurement ID (for deletion)
  - Device ID (for ownership)
```

### 6. History Screen Integration

**File**: `screens/HistoryScreen.tsx` (modifications)

**Changes**:

1. Add delete confirmation dialogs
2. Implement single measurement deletion with backend sync
3. Implement bulk deletion with backend sync
4. Display user feedback for network errors
5. Show obfuscated vs precise location toggle (optional)

**UI Additions**:

- Delete button on each measurement row (already exists, enhance with backend sync)
- "Clear All" button with confirmation dialog
- Toast/alert notifications for deletion status
- Network error handling messages

## Data Models

### Local Storage Schema

```typescript
// AsyncStorage keys
const STORAGE_KEYS = {
  HISTORY: "@sqm_measurement_history",
  DEVICE_ID: "@sqm_device_identifier",
};

// Measurement with privacy fields
interface SQMMeasurement {
  // Identification
  id: string; // Local timestamp-based ID
  measurementId?: string; // Backend UUID
  deviceId: string; // Device UUID

  // Temporal
  timestamp: string; // ISO 8601

  // Spatial (precise - local only)
  location: {
    latitude: number; // Full precision
    longitude: number; // Full precision
    altitude: number | null;
    accuracy: number | null;
  } | null;

  // Spatial (obfuscated - for reference)
  obfuscatedLocation?: {
    latitude: number; // 2 decimal places + offset
    longitude: number; // 2 decimal places + offset
  };

  // Measurement data
  sqm: number;
  median_brightness: number;
  sqm_moon_adjusted?: number;

  // Moon data
  moon_data?: {
    phase: string;
    illumination: number;
    altitude: number | null;
    impact_magnitude: number;
    impact_description: string;
  };
}
```

### Backend API Schema

```typescript
// POST /calculate_sky_brightness
interface BackendMeasurement {
  measurementId: string; // UUID generated by backend
  deviceId: string; // Device UUID
  timestamp: string; // ISO 8601
  location: {
    latitude: number; // Obfuscated (2 decimals + offset)
    longitude: number; // Obfuscated (2 decimals + offset)
  };
  sqm: number;
  median_brightness: number;
  sqm_moon_adjusted?: number;
  moon_data?: {
    phase: string;
    illumination: number;
    altitude: number | null;
    impact_magnitude: number;
    impact_description: string;
  };
  // Additional calculation results...
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, several redundancies were identified:

- **Property 3.4 is redundant with 2.2**: Both test that device identifier is included in API requests
- **Property 7.2 is redundant with 4.3**: Both test device identifier verification for single measurement deletion
- **Property 7.3 is redundant with 5.4**: Both test bulk deletion by device identifier

These redundant properties will be consolidated into single, comprehensive properties.

### Core Properties

**Property 1: Obfuscation is always applied before backend storage**
_For any_ SQM reading with precise coordinates, when sent to the backend, the coordinates in the API request must be obfuscated versions of the original coordinates.
**Validates: Requirements 1.1, 2.1**

**Property 2: Obfuscation produces coordinates within expected radius**
_For any_ precise GPS coordinates, when obfuscation is applied, the distance between original and obfuscated coordinates must be approximately 1 kilometer or less.
**Validates: Requirements 1.2**

**Property 3: Obfuscation adds randomness**
_For any_ precise GPS coordinates, when obfuscated multiple times, the results should differ (with high probability), preventing clustering at grid points.
**Validates: Requirements 1.3**

**Property 4: Local storage preserves precise coordinates**
_For any_ measurement stored locally, the coordinates in local storage must exactly match the original precise coordinates captured by the device.
**Validates: Requirements 1.5**

**Property 5: Device identifier is included in all API requests**
_For any_ API request to the backend, the request metadata must include a valid device identifier.
**Validates: Requirements 2.2, 3.4**

**Property 6: Backend stores obfuscated coordinates with device identifier**
_For any_ measurement stored in the backend database, it must contain obfuscated coordinates and the device identifier from the request.
**Validates: Requirements 2.3**

**Property 7: API responses include measurement identifier**
_For any_ successful calculation response from the backend, the response must include both the calculated SQM value and a unique measurement identifier.
**Validates: Requirements 2.4**

**Property 8: Local storage includes measurement ID after API response**
_For any_ measurement saved after receiving a backend response, the local storage entry must contain both precise coordinates and the measurement identifier.
**Validates: Requirements 2.5**

**Property 9: Device identifier persists across app restarts**
_For any_ device identifier generated and stored, retrieving it after app restart must return the same identifier.
**Validates: Requirements 3.2**

**Property 10: Device identifier uses cryptographically secure generation**
_For any_ newly generated device identifier, it must be a valid UUID v4 generated using cryptographically secure random methods.
**Validates: Requirements 3.3**

**Property 11: Single measurement deletion removes from local storage**
_For any_ measurement in local storage, when deleted, it must no longer appear in subsequent local storage queries.
**Validates: Requirements 4.1**

**Property 12: Single measurement deletion sends correct API request**
_For any_ measurement deletion, the API request must include both the measurement identifier and the device identifier.
**Validates: Requirements 4.2**

**Property 13: Backend verifies device ownership before deletion**
_For any_ delete request, the backend must verify the device identifier matches the stored measurement before allowing deletion.
**Validates: Requirements 4.3, 7.2**

**Property 14: Backend deletes measurement when device identifier matches**
_For any_ delete request with matching device identifier, the measurement must be removed from the public database.
**Validates: Requirements 4.4**

**Property 15: Bulk deletion removes all local measurements**
_For any_ device with multiple measurements, when bulk delete is executed, local storage must be empty afterward.
**Validates: Requirements 5.2**

**Property 16: Bulk deletion sends device identifier to backend**
_For any_ bulk delete operation, the API request must include the device identifier.
**Validates: Requirements 5.3**

**Property 17: Backend removes all measurements for device identifier**
_For any_ bulk delete request, all measurements in the public database associated with that device identifier must be removed.
**Validates: Requirements 5.4, 7.3**

**Property 18: Bulk delete response includes deletion count**
_For any_ successful bulk delete operation, the API response must include the count of deleted records.
**Validates: Requirements 5.5**

**Property 19: Coordinates are rounded to 2 decimal places**
_For any_ coordinates with high precision, when obfuscation is applied, the resulting latitude and longitude must have at most 2 decimal places.
**Validates: Requirements 6.1**

**Property 20: Random offset uses uniform distribution**
_For any_ large sample of obfuscated coordinates from the same source, the offsets must follow a uniform distribution within the fuzzing radius.
**Validates: Requirements 6.2**

**Property 21: Obfuscated coordinates remain within valid GPS ranges**
_For any_ coordinates including edge cases near poles and meridians, obfuscated results must have latitude in [-90, 90] and longitude in [-180, 180].
**Validates: Requirements 6.4**

**Property 22: Obfuscation algorithm is consistent**
_For any_ two measurements, the same obfuscation function must be applied regardless of the location being obfuscated.
**Validates: Requirements 6.5**

**Property 23: Backend validates required fields**
_For any_ API request missing required fields (including device identifier), the backend must reject the request with appropriate error status.
**Validates: Requirements 7.1**

**Property 24: Backend returns appropriate HTTP status codes**
_For any_ API request, the response must use standard HTTP status codes (200 for success, 400 for bad request, 401 for unauthorized, 500 for server error).
**Validates: Requirements 7.4**

**Property 25: Backend error responses include descriptive messages**
_For any_ error response from the backend, the response body must include a descriptive error message.
**Validates: Requirements 7.5**

## Error Handling

### Client-Side Error Handling

**Network Failures**:

- Timeout: 30 seconds for API requests
- Retry strategy: No automatic retries (user can manually retry)
- Offline behavior: Local deletion proceeds, user notified about potential backend inconsistency
- Error messages: Clear, actionable feedback (e.g., "Unable to reach server. Your measurement was deleted locally, but may still appear on the public map.")

**Storage Failures**:

- AsyncStorage errors: Log error, show user-friendly message
- Quota exceeded: Notify user, suggest clearing old measurements
- Corruption: Attempt recovery, fallback to empty state if necessary

**Location Errors**:

- No GPS permission: Prompt user to grant permission
- GPS unavailable: Allow measurement without location (location field null)
- Invalid coordinates: Validate and clamp before obfuscation

**Validation Errors**:

- Invalid device ID format: Regenerate device ID
- Missing measurement ID: Prevent deletion, show error
- Malformed API response: Log error, show generic failure message

### Backend Error Handling

**Authentication/Authorization**:

- Missing device ID: Return 400 Bad Request
- Device ID mismatch on delete: Return 401 Unauthorized with message "You can only delete your own measurements"

**Validation Errors**:

- Missing required fields: Return 400 Bad Request with field names
- Invalid coordinate ranges: Return 400 Bad Request with validation details
- Malformed image data: Return 400 Bad Request

**Database Errors**:

- Connection failures: Return 503 Service Unavailable
- Query timeouts: Return 504 Gateway Timeout
- Constraint violations: Return 409 Conflict

**Processing Errors**:

- Image processing failures: Return 422 Unprocessable Entity with details
- Calculation errors: Return 500 Internal Server Error, log for investigation

## Testing Strategy

### Unit Testing

**Framework**: Jest with React Native Testing Library

**Unit Test Coverage**:

1. **Location Obfuscation Module**:

   - Test precision reduction to 2 decimals
   - Test coordinate clamping at boundaries
   - Test fuzzing radius constant value
   - Test edge cases (poles, meridian crossings)

2. **Device Identifier Module**:

   - Test UUID format validation
   - Test storage and retrieval
   - Test first-time generation
   - Test persistence across calls

3. **Storage Module**:

   - Test measurement CRUD operations
   - Test data structure integrity
   - Test error handling for storage failures

4. **API Client Module**:
   - Test request payload formatting
   - Test response parsing
   - Test error response handling
   - Test timeout behavior

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Property Test Coverage**:

Each property-based test must be tagged with a comment referencing the design document property:

```typescript
// Feature: privacy-location-data-management, Property 1: Obfuscation is always applied before backend storage
```

**Key Property Tests**:

1. **Obfuscation Properties** (Properties 1-3, 19-22):

   - Generate random valid coordinates
   - Verify obfuscation produces valid results within expected ranges
   - Verify randomness and distribution
   - Verify consistency of algorithm

2. **Storage Properties** (Properties 4, 8, 11, 15):

   - Generate random measurements
   - Verify precise coordinates are preserved locally
   - Verify deletion removes correct items
   - Verify bulk operations affect all items

3. **API Contract Properties** (Properties 5-7, 12, 16, 23-25):

   - Generate random API requests
   - Verify required fields are present
   - Verify response formats are correct
   - Verify error handling is consistent

4. **Device Identifier Properties** (Properties 9-10):

   - Generate multiple device IDs
   - Verify UUID format and uniqueness
   - Verify persistence behavior

5. **Authorization Properties** (Properties 13-14, 17):
   - Generate random device IDs and measurement IDs
   - Verify ownership checks work correctly
   - Verify unauthorized deletions are rejected

### Integration Testing

**Scope**: End-to-end flows combining multiple components

**Test Scenarios**:

1. **Complete Measurement Flow**:

   - Capture images → Obfuscate location → Send to backend → Store locally with measurement ID
   - Verify precise coordinates stay local, obfuscated coordinates go to backend

2. **Single Measurement Deletion Flow**:

   - Create measurement → Delete → Verify local and backend removal
   - Test with network failure scenarios

3. **Bulk Deletion Flow**:

   - Create multiple measurements → Clear all → Verify complete removal
   - Test with network failure scenarios

4. **Device Identifier Lifecycle**:
   - First launch → Generate ID → Restart → Verify same ID
   - Reinstall → Verify new ID

### Manual Testing Checklist

- [ ] Verify obfuscated locations on map are ~1km from actual location
- [ ] Verify precise locations in history screen match actual capture location
- [ ] Test deletion with airplane mode (graceful degradation)
- [ ] Test with GPS disabled (measurements without location)
- [ ] Verify device ID persists across app restarts
- [ ] Verify device ID changes after reinstall
- [ ] Test bulk delete with large number of measurements (performance)
- [ ] Verify error messages are user-friendly and actionable

## Security Considerations

### Privacy Protection

1. **Defense in Depth**: Obfuscation happens client-side before network transmission, ensuring precise coordinates never leave the device even if network is compromised.

2. **No Reversibility**: The obfuscation algorithm uses random offsets, making it computationally infeasible to reverse-engineer precise locations from obfuscated ones.

3. **Grid Clustering Prevention**: Random offsets prevent measurements from clustering at grid points, which could reveal the obfuscation algorithm.

### Data Ownership

1. **Device-Based Identity**: Using device identifiers instead of user accounts provides privacy while enabling data management.

2. **Ownership Verification**: Backend verifies device ID matches before allowing deletions, preventing unauthorized data manipulation.

3. **No Cross-Device Access**: Users cannot access or delete measurements from other devices, even their own previous devices.

### Attack Mitigation

1. **Replay Attacks**: Not applicable - measurements are one-time submissions with unique timestamps.

2. **Denial of Service**: Backend should implement rate limiting on deletion endpoints (not in scope for mobile app).

3. **Data Injection**: Backend validates all input fields and coordinate ranges.

4. **Device ID Spoofing**: Device IDs are UUIDs with high entropy, making guessing infeasible. Backend should log suspicious deletion patterns.

## Performance Considerations

### Client-Side Performance

**Obfuscation**: O(1) operation, negligible impact (<1ms)

**Storage Operations**:

- Read history: O(n) where n = number of measurements
- Write measurement: O(n) due to JSON serialization
- Delete measurement: O(n) due to array filtering
- Optimization: Consider pagination for large histories (>1000 measurements)

**Memory Usage**:

- Device ID: Cached in memory after first retrieval
- Measurements: Loaded on-demand in History screen
- Images: Not stored locally (only sent to backend)

### Network Performance

**API Request Size**:

- Images: ~2-5 MB per request (base64 encoded)
- Metadata: <1 KB
- Total: ~2-5 MB per measurement

**API Response Size**:

- Calculation result: <2 KB
- Minimal impact on data usage

**Optimization Opportunities**:

- Image compression before base64 encoding
- Batch deletion API (already implemented)
- Background sync for deletions (future enhancement)

## Migration Strategy

### Existing Data Migration

**Challenge**: Existing measurements in local storage lack device IDs and measurement IDs.

**Solution**:

1. On first launch after update, detect old measurement format
2. Generate device ID if not present
3. Backfill device ID into existing measurements
4. Measurement IDs remain null for old measurements (cannot be deleted from backend)
5. Show one-time notice: "Previous measurements cannot be removed from the public map. New measurements can be managed."

**Migration Code**:

```typescript
async function migrateExistingMeasurements(): Promise<void> {
  const deviceId = await getDeviceId();
  const history = await loadHistory();

  let needsMigration = false;
  const migratedHistory = history.map((measurement) => {
    if (!measurement.deviceId) {
      needsMigration = true;
      return { ...measurement, deviceId };
    }
    return measurement;
  });

  if (needsMigration) {
    await AsyncStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(migratedHistory)
    );
  }
}
```

### Backend Migration

**Challenge**: Existing measurements in backend lack device IDs.

**Solution**:

1. Add nullable `deviceId` column to measurements table
2. Existing measurements have `deviceId = null`
3. Deletion endpoints reject requests for measurements with `deviceId = null`
4. Over time, old measurements age out or are manually cleaned

### Rollout Plan

**Phase 1**: Deploy backend changes

- Add device ID field (nullable)
- Add deletion endpoints
- Deploy to production

**Phase 2**: Deploy mobile app update

- Implement obfuscation
- Implement device ID generation
- Implement deletion features
- Release to app stores

**Phase 3**: Monitor and iterate

- Track deletion API usage
- Monitor error rates
- Gather user feedback
- Iterate on UX

## Future Enhancements

### Potential Improvements

1. **Configurable Privacy Levels**:

   - Allow users to choose obfuscation radius (500m, 1km, 5km)
   - Option to disable location sharing entirely

2. **Account-Based Identity**:

   - Optional user accounts for cross-device access
   - Sync measurements across devices
   - Recover data after device loss

3. **Batch Operations**:

   - Select multiple measurements for deletion
   - Export measurements to file
   - Import measurements from file

4. **Privacy Dashboard**:

   - Show map of obfuscated vs precise locations
   - Statistics on shared measurements
   - Privacy score/rating

5. **Offline Queue**:

   - Queue deletion requests when offline
   - Sync when connection restored
   - Show pending operations status

6. **Backend Enhancements**:
   - Rate limiting on deletion endpoints
   - Audit log for deletion operations
   - Bulk export API for users

## Dependencies

### Mobile App Dependencies

**New Dependencies**:

- `expo-crypto`: For cryptographically secure UUID generation
- `fast-check`: For property-based testing (dev dependency)

**Existing Dependencies** (no changes):

- `@react-native-async-storage/async-storage`: Local storage
- `expo-location`: GPS coordinates
- `react-native`: Core framework

### Backend Dependencies

**Required Backend Changes**:

- Add `deviceId` field to measurements table (string, nullable, indexed)
- Add `measurementId` field (UUID, primary key)
- Implement DELETE `/measurement/:id` endpoint
- Implement DELETE `/measurements/bulk` endpoint
- Add device ID validation middleware

**Database Schema Changes**:

```sql
ALTER TABLE measurements
ADD COLUMN device_id VARCHAR(36),
ADD COLUMN measurement_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
ADD INDEX idx_device_id (device_id);
```

## Appendix

### Coordinate Precision Reference

| Decimal Places | Precision | Distance |
| -------------- | --------- | -------- |
| 0              | 1°        | ~111 km  |
| 1              | 0.1°      | ~11 km   |
| 2              | 0.01°     | ~1.1 km  |
| 3              | 0.001°    | ~110 m   |
| 4              | 0.0001°   | ~11 m    |
| 5              | 0.00001°  | ~1.1 m   |
| 6              | 0.000001° | ~0.11 m  |

**Design Decision**: 2 decimal places provides ~1.1km precision, which balances privacy (prevents exact address identification) with utility (maintains neighborhood-level accuracy for light pollution mapping).

### Haversine Distance Formula

Used for calculating distance between coordinates and generating random offsets:

```typescript
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
```

### UUID v4 Format

Device identifiers follow UUID v4 format:

- 128-bit identifier
- Hexadecimal representation: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Version 4 (random): 4th character of 3rd group is always '4'
- Variant: First character of 4th group is always 8, 9, A, or B
- Example: `550e8400-e29b-41d4-a716-446655440000`

### Error Code Reference

| Code | Meaning              | Client Action                             |
| ---- | -------------------- | ----------------------------------------- |
| 200  | Success              | Process response                          |
| 400  | Bad Request          | Show error message, don't retry           |
| 401  | Unauthorized         | Show "Cannot delete others' measurements" |
| 404  | Not Found            | Show "Measurement not found"              |
| 422  | Unprocessable Entity | Show error details                        |
| 500  | Server Error         | Show "Server error, try again later"      |
| 503  | Service Unavailable  | Show "Service temporarily unavailable"    |
| 504  | Timeout              | Show "Request timed out, try again"       |
