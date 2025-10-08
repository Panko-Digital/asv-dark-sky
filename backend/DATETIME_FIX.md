# DateTime Timezone Fix for Moon Calculations

## Issue
**Error:** "An unexpected error occurred: can't subtract offset-naive and offset-aware datetimes."

This error occurred when processing SQM measurements because of a mismatch between timezone-aware and timezone-naive datetime objects.

## Root Cause

1. **Frontend sends timezone-aware timestamps:**
   - Frontend sends ISO format timestamps like `2025-10-08T12:34:56.789Z` or `2025-10-08T12:34:56.789+00:00`
   - When parsed with `datetime.fromisoformat()`, these become timezone-aware datetime objects

2. **Backend used timezone-naive datetimes:**
   - `moon_calculations.py` had: `datetime(2000, 1, 6, 18, 14)` (no timezone)
   - `main.py` used: `datetime.utcnow()` (deprecated, timezone-naive)
   - When trying to calculate `date - known_new_moon`, Python raised an error

## Solution

### 1. Updated `moon_calculations.py`

```python
# Before:
from datetime import datetime

known_new_moon = datetime(2000, 1, 6, 18, 14)  # Timezone-naive
time_diff = date - known_new_moon

# After:
from datetime import datetime, timezone

known_new_moon = datetime(2000, 1, 6, 18, 14, tzinfo=timezone.utc)  # Timezone-aware

# Ensure incoming date is timezone-aware
if date.tzinfo is None:
    date = date.replace(tzinfo=timezone.utc)

time_diff = date - known_new_moon
```

**Changes:**
- Added `timezone` import
- Made `known_new_moon` timezone-aware with `tzinfo=timezone.utc`
- Added check to convert naive datetimes to UTC if needed

### 2. Updated `main.py`

```python
# Before:
from datetime import datetime

measurement_date = datetime.fromisoformat(measurement_timestamp.replace('Z', '+00:00'))
# or
measurement_date = datetime.utcnow()  # Deprecated
created_at = datetime.utcnow().isoformat()

# After:
from datetime import datetime, timezone

# Parse timestamp and ensure timezone-aware
measurement_date = datetime.fromisoformat(measurement_timestamp.replace('Z', '+00:00'))
if measurement_date.tzinfo is None:
    measurement_date = measurement_date.replace(tzinfo=timezone.utc)
# or
measurement_date = datetime.now(timezone.utc)  # Modern approach

created_at = datetime.now(timezone.utc).isoformat()
```

**Changes:**
- Added `timezone` import
- Replaced deprecated `datetime.utcnow()` with `datetime.now(timezone.utc)`
- Added explicit timezone-aware check after parsing ISO format
- Better error handling with logging

## Benefits

1. **Eliminates the error:** All datetime operations now work with consistent timezone information
2. **More robust:** Handles both timezone-aware and timezone-naive input gracefully
3. **Modern Python:** Uses `datetime.now(timezone.utc)` instead of deprecated `datetime.utcnow()`
4. **Better debugging:** Added error logging for timestamp parsing

## Testing

After deploying these changes, test with:

1. **Normal measurement:** Take a photo and verify SQM calculation completes
2. **Check moon data:** Verify moon phase, illumination, and impact are calculated
3. **Verify storage:** Check that measurements are saved to Firestore with correct timestamps

## Deployment

To deploy the backend fix:

```bash
cd backend

# Deploy the updated functions
gcloud functions deploy calculate_sky_brightness \
  --gen2 \
  --runtime=python312 \
  --region=australia-southeast2 \
  --source=. \
  --entry-point=calculate_sky_brightness \
  --trigger-http \
  --allow-unauthenticated
```

## Python Datetime Best Practices

### ✅ DO:
- Always use `datetime.now(timezone.utc)` for current UTC time
- Make datetimes timezone-aware: `datetime(..., tzinfo=timezone.utc)`
- Check and handle timezone-naive datetimes explicitly

### ❌ DON'T:
- Use deprecated `datetime.utcnow()` (removed in Python 3.12+)
- Mix timezone-aware and timezone-naive datetimes
- Assume all datetimes have timezone information

## References

- [Python datetime documentation](https://docs.python.org/3/library/datetime.html)
- [PEP 615 - Timezone support](https://peps.python.org/pep-0615/)
- [datetime.utcnow() deprecation](https://docs.python.org/3/library/datetime.html#datetime.datetime.utcnow)
