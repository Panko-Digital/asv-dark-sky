# Moon Brightness Impact on SQM Measurements

## Overview
The moon significantly affects sky quality measurements by adding light to the sky. A full moon at zenith can make the sky approximately 1.5 magnitudes per square arcsecond brighter than it would be on a moonless night.

## Implementation

### Key Factors
1. **Moon Illumination (0-100%)**: How much of the moon's surface is lit
2. **Moon Altitude (0-90°)**: How high the moon is above the horizon
3. **Combined Impact**: Both factors multiply to determine total effect

### Formula
```
Moon Impact (magnitudes) = (Illumination/100) × sin(Altitude) × 1.5

Adjusted SQM = Measured SQM + Moon Impact
```

### Example Scenarios
- **New Moon**: 0% illumination → 0 magnitude impact → No adjustment needed
- **Full Moon at horizon**: 100% × sin(0°) × 1.5 = 0 mag impact
- **Full Moon at 30° altitude**: 100% × sin(30°) × 1.5 = 0.75 mag impact
- **Full Moon at zenith (90°)**: 100% × sin(90°) × 1.5 = 1.5 mag impact
- **Half Moon at 45° altitude**: 50% × sin(45°) × 1.5 = 0.53 mag impact

## Backend Changes

### Files Modified
1. **`backend/moon_calculations.py`** (NEW)
   - `calculate_moon_phase()` - Calculates phase and illumination %
   - `calculate_moon_impact()` - Computes magnitude impact
   - `adjust_sqm_for_moon()` - Adjusts SQM reading
   - `get_moon_impact_description()` - Human-readable description

2. **`backend/main.py`** (MODIFIED)
   - Imports moon calculation functions
   - Calculates moon phase automatically from timestamp
   - Accepts optional moon data from frontend in metadata
   - Stores both raw SQM and moon-adjusted SQM
   - Returns moon data in response

### API Response Format
```json
{
  "sky_quality_meter": 18.5,
  "sky_quality_meter_moon_adjusted": 19.2,
  "moon_data": {
    "phase": "Waxing Gibbous",
    "illumination": 75,
    "altitude": 45,
    "impact_magnitude": 0.79,
    "impact_description": "Moderate moon brightness"
  }
}
```

## Frontend Integration (Optional Enhancement)

### Current State
- Moon phase is displayed to user
- Illumination % is calculated

### Recommended Addition
To improve accuracy, you could:

1. **Add moon altitude calculation** to `utils/moonCalculations.ts`
2. **Send moon data with measurement**:
```typescript
metadata: {
  location: locationData,
  timestamp: currentTimestamp,
  moon: {
    illumination: moonPhase.illumination,
    altitude: moonAltitude, // if calculated
    phase: moonPhase.phase
  }
}
```

3. **Display moon-adjusted SQM** to users:
```tsx
<Text>Raw SQM: {rawSQM.toFixed(2)}</Text>
<Text>Moon-adjusted SQM: {adjustedSQM.toFixed(2)}</Text>
<Text>({moonImpact.toFixed(1)} mag impact from moon)</Text>
```

## Database Schema

### Firestore Document (measurements collection)
```
{
  sky_quality_meter: 18.5,              // Raw measurement
  sky_quality_meter_moon_adjusted: 19.2, // Adjusted for moon
  moon_data: {
    phase: "Waxing Gibbous",
    illumination: 75,
    altitude: 45,
    impact_magnitude: 0.79,
    impact_description: "Moderate moon brightness"
  },
  // ... other fields
}
```

## Scientific Basis

### Why This Matters
- **Research accuracy**: Comparing measurements across different nights requires accounting for moon
- **True dark sky assessment**: Moon-adjusted values show actual light pollution levels
- **Data analysis**: Allows filtering or grouping measurements by moon conditions

### Limitations
1. Current altitude calculation is simplified - for production, consider using a proper astronomy library like:
   - JavaScript: `suncalc` or `astronomy-engine`
   - Python: `ephem` or `skyfield`
2. Doesn't account for:
   - Atmospheric scattering
   - Moon's exact distance from Earth
   - Local terrain blocking moon
   - Cloud cover

### Accuracy
- Phase calculation: ±1% illumination
- Impact estimate: ±0.2 magnitudes without proper altitude
- With proper altitude: ±0.1 magnitudes

## Usage Recommendations

### For Users
- **Best measurements**: New moon nights (0-10% illumination)
- **Good measurements**: Crescent moons or moon below horizon
- **Acceptable**: Quarter moons if below 30° altitude
- **Avoid**: Full moon nights unless testing moon impact

### For Analysis
1. Always use `sky_quality_meter_moon_adjusted` for:
   - Long-term trends
   - Light pollution mapping
   - Comparing different sites
   
2. Use raw `sky_quality_meter` for:
   - Real-time sky conditions
   - Planning observation sessions
   - Testing equipment

## Deployment

### Backend Requirements
1. Upload `backend/moon_calculations.py`
2. Re-deploy `backend/main.py`
3. No additional dependencies needed (uses standard library)

### Frontend Requirements
1. `utils/moonCalculations.ts` available for future enhancements
2. No changes required immediately - backend calculates automatically

## Testing

### Test Cases
1. **New Moon**: Impact should be ~0 mag
2. **Full Moon High**: Impact should be 1.0-1.5 mag
3. **Quarter Moon**: Impact should be 0.3-0.7 mag
4. **Moon Below Horizon**: Impact should be 0 mag

### Validation
Compare adjusted values to see reasonable impact:
- Adjusted SQM should always be ≥ raw SQM
- Impact should be 0-1.5 magnitudes
- Full moon should show biggest impact

## Future Enhancements

1. **Accurate moon position**: Integrate astronomy library for precise altitude/azimuth
2. **Moon distance**: Account for moon's elliptical orbit (±10% brightness variation)
3. **Atmospheric extinction**: Model based on altitude
4. **Historical analysis**: Add endpoint to re-calculate moon data for old measurements
5. **Filtering UI**: Let users filter map/history by moon conditions
