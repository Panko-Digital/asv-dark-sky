# Implementation Plan

- [-] 1. Set up location obfuscation module

  - Create `utils/locationObfuscation.ts` with core obfuscation functions
  - Implement precision reduction to 2 decimal places
  - Implement random offset generation within 500m radius using Haversine formula
  - Implement coordinate clamping to valid GPS ranges
  - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]\* 1.1 Write property test for precision reduction

  - **Property 19: Coordinates are rounded to 2 decimal places**
  - **Validates: Requirements 6.1**

- [ ]\* 1.2 Write property test for obfuscation distance

  - **Property 2: Obfuscation produces coordinates within expected radius**
  - **Validates: Requirements 1.2**

- [ ]\* 1.3 Write property test for obfuscation randomness

  - **Property 3: Obfuscation adds randomness**
  - **Validates: Requirements 1.3**

- [ ]\* 1.4 Write property test for coordinate clamping

  - **Property 21: Obfuscated coordinates remain within valid GPS ranges**
  - **Validates: Requirements 6.4**

- [ ]\* 1.5 Write property test for algorithm consistency

  - **Property 22: Obfuscation algorithm is consistent**
  - **Validates: Requirements 6.5**

- [ ] 2. Set up device identifier module

  - Create `utils/deviceIdentifier.ts` with device ID management
  - Implement UUID v4 generation using expo-crypto
  - Implement AsyncStorage persistence with key `@sqm_device_identifier`
  - Implement in-memory caching for performance
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ]\* 2.1 Write property test for device ID persistence

  - **Property 9: Device identifier persists across app restarts**
  - **Validates: Requirements 3.2**

- [ ]\* 2.2 Write property test for UUID format validation

  - **Property 10: Device identifier uses cryptographically secure generation**
  - **Validates: Requirements 3.3**

- [ ] 3. Create backend API client module

  - Create `utils/apiClient.ts` with typed API interfaces
  - Implement `calculateSkyBrightness` function with obfuscated location and device ID
  - Implement `deleteMeasurement` function with measurement ID and device ID
  - Implement `bulkDeleteMeasurements` function with device ID
  - Add 30-second timeout configuration
  - Add error response parsing and type guards
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.2, 5.3, 7.1, 7.4, 7.5_

- [ ]\* 3.1 Write property test for API request format

  - **Property 5: Device identifier is included in all API requests**
  - **Validates: Requirements 2.2, 3.4**

- [ ]\* 3.2 Write property test for API response parsing

  - **Property 7: API responses include measurement identifier**
  - **Validates: Requirements 2.4**

- [ ] 4. Update storage module with privacy fields

  - Modify `utils/storage.ts` to add `deviceId`, `measurementId`, and `obfuscatedLocation` fields to `SQMMeasurement` interface
  - Update `saveMeasurement` function signature to accept device ID, measurement ID, and obfuscated location
  - Implement `deleteMeasurementWithBackend` function that deletes locally and calls API
  - Implement `clearAllMeasurementsWithBackend` function that clears locally and calls bulk delete API
  - Add error handling for network failures with user-friendly messages
  - _Requirements: 1.5, 2.5, 4.1, 4.2, 4.6, 5.2, 5.3, 5.6_

- [ ]\* 4.1 Write property test for local storage precision preservation

  - **Property 4: Local storage preserves precise coordinates**
  - **Validates: Requirements 1.5**

- [ ]\* 4.2 Write property test for measurement ID storage

  - **Property 8: Local storage includes measurement ID after API response**
  - **Validates: Requirements 2.5**

- [ ]\* 4.3 Write property test for single measurement deletion

  - **Property 11: Single measurement deletion removes from local storage**
  - **Validates: Requirements 4.1**

- [ ]\* 4.4 Write property test for bulk deletion

  - **Property 15: Bulk deletion removes all local measurements**
  - **Validates: Requirements 5.2**

- [ ] 5. Integrate privacy features into CameraScreen

  - Import obfuscation, device ID, and API client utilities
  - Get device ID on component mount
  - Obfuscate location before sending to backend in `sendToServer` function
  - Update API request to include obfuscated location and device ID
  - Extract measurement ID from API response
  - Update `saveMeasurement` call to include all new fields (device ID, measurement ID, obfuscated location)
  - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.4, 2.5_

- [ ]\* 5.1 Write property test for obfuscation before backend storage

  - **Property 1: Obfuscation is always applied before backend storage**
  - **Validates: Requirements 1.1, 2.1**

- [ ] 6. Enhance HistoryScreen with deletion features

  - Update delete button handler to use `deleteMeasurementWithBackend`
  - Add confirmation dialog for single measurement deletion
  - Update "Clear All" button to use `clearAllMeasurementsWithBackend`
  - Add confirmation dialog for bulk deletion with warning text
  - Add toast/alert notifications for deletion success and errors
  - Display network error messages when backend is unreachable
  - Show deletion count after bulk delete completes
  - _Requirements: 4.1, 4.2, 4.6, 5.1, 5.2, 5.3, 5.5, 5.6_

- [ ] 7. Implement data migration for existing measurements

  - Create `utils/migration.ts` with migration logic
  - Detect old measurement format (missing deviceId field)
  - Backfill device ID into existing measurements
  - Run migration on app launch (one-time check)
  - Show one-time notice about old measurements not being deletable from backend
  - _Requirements: 3.1, 3.2_

- [ ] 8. Add expo-crypto dependency

  - Install `expo-crypto` package for UUID generation
  - Update imports in device identifier module
  - _Requirements: 3.3_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
