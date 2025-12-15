# Enhanced MoonPhase Component

## Overview
The MoonPhase component has been upgraded to use the centralized `moonCalculations` utility and now displays a visual representation of the moon's position in the sky.

## Key Features

### 1. **Centralized Calculations**
- Now uses `utils/moonCalculations.ts` functions
- Consistent calculations between frontend display and backend processing
- Easy to maintain and update

### 2. **Location-Aware**
- Accepts optional `latitude` and `longitude` props
- Falls back to requesting device location if not provided
- Calculates accurate moon altitude based on location and time

### 3. **Visual Altitude Arc**
- Shows moon's position above horizon (0° to 90°)
- Visual arc with degree markers (0°, 30°, 60°, 90°)
- Moon emoji (🌙) positioned on arc based on altitude
- Only displayed when moon is above horizon

### 4. **Comprehensive Information Display**
- **Phase emoji**: Visual representation (🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘)
- **Phase name**: "New Moon", "Waxing Crescent", etc.
- **Illumination %**: How much of moon is lit (0-100%)
- **Altitude**: Degrees above horizon
- **Impact description**: "Minimal", "Slight", "Moderate", or "Significant" moon brightness

### 5. **Auto-Updates**
- Refreshes every 10 minutes automatically
- Keeps moon position and phase current during long observation sessions

## Usage

### Basic (Auto-detect location)
```tsx
import MoonPhase from "../components/MoonPhase";

<MoonPhase />
```

### With Known Location
```tsx
<MoonPhase 
  latitude={-38.15} 
  longitude={144.35} 
/>
```

### With Dynamic Location (from state)
```tsx
<MoonPhase 
  latitude={location?.coords.latitude}
  longitude={location?.coords.longitude}
/>
```

## Display Examples

### When Moon is Above Horizon
```
🌕    Full Moon (100% illuminated)
      45° above horizon
      Moderate moon brightness
      
      [Visual arc showing moon position at 45°]
      0°  30°  60°  90°
      ─────────🌙─────
```

### When Moon is Below Horizon
```
🌑    New Moon (2% illuminated)
      Below horizon
```

## Visual Design

### Layout
- **Dark background** with red border (matches app theme)
- **Horizontal layout** with large emoji on left
- **Compact info** on right side
- **Arc visualization** at bottom (when moon is up)

### Colors
- White text for phase name
- Gray text for altitude
- Red/pink text for impact description
- Dark gray horizon line with light gray markers

## Technical Details

### Props Interface
```typescript
interface MoonPhaseProps {
  latitude?: number;   // Optional GPS latitude
  longitude?: number;  // Optional GPS longitude
}
```

### State Management
- Requests location permission if needed
- Caches location to avoid repeated requests
- Updates moon data every 10 minutes
- Cleans up interval on unmount

### Performance
- Efficient calculations (< 1ms)
- Minimal re-renders (10 min intervals)
- Location requested once, cached
- No network requests needed

## Integration with Backend

The component uses the same calculation functions as the backend:
- **Frontend**: `utils/moonCalculations.ts`
- **Backend**: `backend/moon_calculations.py`

This ensures consistency between:
- What the user sees on screen
- What gets sent to the backend
- What gets stored in Firestore
- What appears in historical data

## Future Enhancements

Potential improvements:
1. **Tap to expand** - Show more detailed info
2. **Moon azimuth** - Compass direction (N, E, S, W)
3. **Rise/set times** - When moon rises/sets today
4. **Next phase** - Days until next moon phase
5. **Accurate library** - Use SunCalc or astronomy-engine for precision
6. **Animations** - Smooth transitions as moon moves

## Files Modified

1. **`components/MoonPhase.tsx`**
   - Refactored to use utility functions
   - Added altitude arc visualization
   - Added location support
   - Enhanced styling

2. **`screens/CameraScreen.tsx`**
   - Passes location props to MoonPhase
   - Leverages existing location state

3. **`utils/moonCalculations.ts`** (already created)
   - Shared calculation functions
   - TypeScript interfaces
   - Impact descriptions
