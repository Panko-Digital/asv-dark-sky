# Map Marker Clustering Implementation

## Problem
When zoomed out on the MapScreen, multiple measurement markers at nearby locations would overlap, making the map cluttered and difficult to read.

## Solution
Implemented dynamic marker filtering based on zoom level that automatically hides overlapping markers when zoomed out and reveals them when zooming in.

## How It Works

### 1. Zoom Level Tracking
- Added `currentZoom` state to track the map's current `latitudeDelta` and `longitudeDelta`
- `onRegionChangeComplete` handler updates the zoom state whenever the user pans or zooms

### 2. Distance Calculation
- `getDistance()` function calculates the real-world distance between two GPS coordinates using the Haversine formula
- Returns distance in kilometers

### 3. Dynamic Minimum Distance Thresholds
The `getMinDistance()` function sets appropriate spacing based on zoom level:

| Zoom Level (latitudeDelta) | Min Distance | Description |
|----------------------------|--------------|-------------|
| > 1.0 | 5 km | Very zoomed out - show only widely spaced markers |
| 0.5 - 1.0 | 2 km | Zoomed out - moderate spacing |
| 0.1 - 0.5 | 500 m | Medium zoom - closer spacing |
| 0.05 - 0.1 | 200 m | Zoomed in - tight spacing |
| < 0.05 | 50 m | Very zoomed in - show almost all markers |

### 4. Marker Filtering Algorithm
`getVisibleMarkers()` implements smart filtering:

1. **Sort by Quality**: Measurements are sorted by SQM value (highest first)
   - This ensures better quality readings are preferentially shown
   
2. **Proximity Check**: For each measurement:
   - Check distance to all already-visible markers
   - If too close to any visible marker (within min distance), skip it
   - Otherwise, add it to the visible list

3. **Result**: Returns filtered list that respects minimum spacing at current zoom level

## Benefits

✅ **No Overlapping**: Markers never overlap at any zoom level  
✅ **Progressive Detail**: More markers appear as you zoom in  
✅ **Quality Priority**: Better SQM readings shown preferentially  
✅ **Performance**: Efficient filtering with sorted data  
✅ **User Experience**: Cleaner, more readable map at all zoom levels  

## Customization

To adjust clustering behavior, modify the thresholds in `getMinDistance()`:
- Increase distances for more aggressive clustering (fewer markers)
- Decrease distances for less clustering (more markers visible)

## Technical Details

- **Distance Formula**: Haversine formula for accurate GPS distance calculation
- **Re-render Trigger**: Map region changes trigger marker recalculation
- **Marker Priority**: Sorted by `sky_quality_meter` (descending)
- **Zero Performance Impact**: Filtering is done on already-loaded data

## Example Behavior

**Zoomed Out (viewing entire Geelong region)**
- Only shows ~5-10 markers spaced at least 5km apart
- Shows the best SQM readings in the region

**Medium Zoom (viewing neighborhood)**
- Shows ~20-30 markers spaced at least 500m apart
- More detail revealed

**Zoomed In (viewing street level)**
- Shows ~50+ markers with minimal spacing
- Nearly all measurements visible

