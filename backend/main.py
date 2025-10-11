import functions_framework
import cv2
import numpy as np
import json
import base64
from datetime import datetime, timezone
import os
import firebase_admin
from firebase_admin import credentials, firestore
from moon_calculations import calculate_moon_phase, calculate_moon_impact, adjust_sqm_for_moon, get_moon_impact_description

def sqm_to_bortle(sqm_value):
    """
    Convert SQM (Sky Quality Meter) value to Bortle Dark Sky Scale.
    
    Bortle Scale ranges from 1 (pristine dark sky) to 9+ (inner city).
    SQM values typically range from ~15 (bright city) to ~22+ (darkest skies).
    
    Based on commonly accepted conversions:
    - Bortle 1: SQM 21.7-22+ (Pristine dark sky)
    - Bortle 2: SQM 21.5-21.7 (Typical truly dark site)
    - Bortle 3: SQM 21.3-21.5 (Rural sky)
    - Bortle 4: SQM 20.4-21.3 (Rural/suburban transition)
    - Bortle 5: SQM 19.1-20.4 (Suburban sky)
    - Bortle 6: SQM 18.0-19.1 (Bright suburban sky)
    - Bortle 7: SQM 17.5-18.0 (Suburban/urban transition)
    - Bortle 8: SQM 16.5-17.5 (City sky)
    - Bortle 9: SQM <16.5 (Inner city sky)
    """
    if sqm_value >= 21.7:
        return 1, "Pristine Dark Sky"
    elif sqm_value >= 21.5:
        return 2, "Typical Dark Site"
    elif sqm_value >= 21.3:
        return 3, "Rural Sky"
    elif sqm_value >= 20.4:
        return 4, "Rural/Suburban Transition"
    elif sqm_value >= 19.1:
        return 5, "Suburban Sky"
    elif sqm_value >= 18.0:
        return 6, "Bright Suburban Sky"
    elif sqm_value >= 17.5:
        return 7, "Suburban/Urban Transition"
    elif sqm_value >= 16.5:
        return 8, "City Sky"
    else:
        return 9, "Inner City Sky"

def calculate_additional_measurements(sqm_value, median_brightness):
    """
    Calculate additional light level measurements from SQM value.
    
    Returns various scales and measurements commonly used in astronomy.
    """
    # Convert to other common measurements
    
    # Naked Eye Limiting Magnitude (NELM) - approximate relationship
    # NELM ≈ SQM - 5 (rough approximation, varies with conditions)
    nelm = max(1.0, sqm_value - 5.0)  # Clamp to reasonable minimum
    
    # Luminance in cd/m² (candela per square meter)
    # SQM = -2.5 * log10(L) + C, where C ≈ 12.6 for SQM in mag/arcsec²
    # L = 10^((C - SQM) / 2.5)
    luminance_cd_m2 = 10 ** ((12.6 - sqm_value) / 2.5)
    
    # Convert luminance to other units
    luminance_mcd_m2 = luminance_cd_m2 * 1000  # millicandela per m²
    
    # Artificial Light Level Index (rough scale)
    if sqm_value >= 21.5:
        light_pollution_level = "Minimal"
    elif sqm_value >= 20.0:
        light_pollution_level = "Low" 
    elif sqm_value >= 18.5:
        light_pollution_level = "Moderate"
    elif sqm_value >= 17.0:
        light_pollution_level = "High"
    else:
        light_pollution_level = "Severe"
    
    # Quality rating for astronomy
    if sqm_value >= 21.5:
        astronomy_quality = "Excellent"
    elif sqm_value >= 20.5:
        astronomy_quality = "Very Good"
    elif sqm_value >= 19.5:
        astronomy_quality = "Good"
    elif sqm_value >= 18.0:
        astronomy_quality = "Fair"
    else:
        astronomy_quality = "Poor"
    
    return {
        "naked_eye_limiting_magnitude": round(nelm, 1),
        "luminance_cd_m2": round(luminance_cd_m2, 6),
        "luminance_mcd_m2": round(luminance_mcd_m2, 3),
        "light_pollution_level": light_pollution_level,
        "astronomy_quality": astronomy_quality
    }

# Initialize Firebase Admin (only once)
if not firebase_admin._apps:
    # When deployed to Cloud Functions, uses Application Default Credentials
    firebase_admin.initialize_app(options={
        'projectId': 'popkorn-472305',
    })

# Get Firestore client
# Note: The database parameter is only supported in firebase-admin >= 6.5.0
# and may not work in all Cloud Functions environments
db = firestore.client()

@functions_framework.http
def calculate_sky_brightness(request):
    """
    HTTP Cloud Function that accepts two images (light and dark frames) as base64 data,
    and performs sky brightness calculation.
    
    Expected JSON payload:
    {
        "light_image": "base64_encoded_image_data",
        "dark_image": "base64_encoded_image_data", 
        "zero_point": 20.0,
        "exposure_time_s": n,
        "metadata": {
            "location": "optional_location_info",
            "timestamp": "optional_timestamp"
        }
    }
    
    Returns:
        JSON response with upload paths and calculation results
    """
    # Set CORS headers for all responses
    if request.method == 'OPTIONS':
        # Preflight request
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # Set CORS headers for main request
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        # Get data from the JSON request body
        request_json = request.get_json(silent=True)
        if not request_json:
            return (json.dumps({"error": "No JSON payload found. Please provide images and parameters."}), 400, headers)

        # Extract required parameters
        light_image_b64 = request_json.get("light_image")
        dark_image_b64 = request_json.get("dark_image")
        zero_point = request_json.get("zero_point", 20.0)
        exposure_time_s = request_json.get("exposure_time_s", 3)
        metadata = request_json.get("metadata", {})

        if not light_image_b64 or not dark_image_b64:
            return (json.dumps({"error": "Both light_image and dark_image are required as base64 encoded data"}), 400, headers)

        # Helper function to decode and validate image without uploading
        def decode_image_from_base64(base64_data, description):
            try:
                # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
                if ',' in base64_data:
                    base64_data = base64_data.split(',')[1]
                
                # Decode base64 data
                image_bytes = base64.b64decode(base64_data)
                
                # Validate image by attempting to decode with OpenCV
                img_array = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(img_array, cv2.IMREAD_UNCHANGED)
                if img is None:
                    raise ValueError(f"Could not decode image data for {description}")
                
                return img
                
            except Exception as e:
                raise ValueError(f"Error processing image {description}: {str(e)}")

        # Decode both images (no storage upload)
        light_frame = decode_image_from_base64(light_image_b64, "light frame")
        dark_frame = decode_image_from_base64(dark_image_b64, "dark frame")

        # Ensure images are the same size
        if light_frame.shape != dark_frame.shape:
            return (json.dumps({
                "error": "Images must have the same dimensions.",
                "light_shape": light_frame.shape,
                "dark_shape": dark_frame.shape
            }), 400, headers)

        # Perform the dark frame subtraction
        subtracted_image = cv2.subtract(light_frame.astype(np.int16), dark_frame.astype(np.int16))

        # Calculate the median pixel value
        median_value = np.median(subtracted_image)
        
        # Calculate instrumental magnitude and SQM score
        if median_value <= 0:
            return (json.dumps({
                "error": "Median pixel value is non-positive, cannot calculate calibrated magnitude.",
                "median_value": float(median_value)
            }), 400, headers)

        instrumental_magnitude = -2.5 * np.log10(median_value / exposure_time_s)
        sky_quality_meter = instrumental_magnitude + zero_point
        
        # Calculate Bortle scale and additional measurements
        bortle_class, bortle_description = sqm_to_bortle(sky_quality_meter)
        additional_measurements = calculate_additional_measurements(sky_quality_meter, median_value)
        
        # Calculate moon phase and impact
        measurement_timestamp = metadata.get('timestamp')
        if measurement_timestamp:
            try:
                # Parse ISO format timestamp (handles both Z and +00:00)
                measurement_date = datetime.fromisoformat(measurement_timestamp.replace('Z', '+00:00'))
                # Ensure timezone-aware (should already be from fromisoformat)
                if measurement_date.tzinfo is None:
                    measurement_date = measurement_date.replace(tzinfo=timezone.utc)
            except Exception as e:
                print(f"Error parsing timestamp: {e}")
                measurement_date = datetime.now(timezone.utc)
        else:
            measurement_date = datetime.now(timezone.utc)
        
        moon_phase_data = calculate_moon_phase(measurement_date)
        
        # Get moon illumination from metadata if provided by frontend
        moon_illumination = moon_phase_data['illumination']
        moon_altitude = None
        
        if 'moon' in metadata:
            moon_illumination = metadata['moon'].get('illumination', moon_illumination)
            moon_altitude = metadata['moon'].get('altitude')
        
        # Calculate moon impact on sky brightness
        moon_impact = calculate_moon_impact(moon_illumination, moon_altitude)
        moon_adjusted_sqm = adjust_sqm_for_moon(sky_quality_meter, moon_impact)
        moon_impact_desc = get_moon_impact_description(moon_impact)
        
        # Save measurement to Firestore using the global db client
        measurement_data = {
            "median_sky_brightness_dn": float(median_value),
            "sky_quality_meter": float(sky_quality_meter),
            "sky_quality_meter_moon_adjusted": float(moon_adjusted_sqm),
            "instrumental_magnitude": float(instrumental_magnitude),
            "zero_point": float(zero_point),
            "exposure_time_s": float(exposure_time_s),
            "bortle_class": int(bortle_class),
            "bortle_description": bortle_description,
            "additional_measurements": additional_measurements,
            "moon_data": {
                "phase": moon_phase_data['phase'],
                "illumination": moon_illumination,
                "altitude": moon_altitude,
                "impact_magnitude": float(moon_impact),
                "impact_description": moon_impact_desc
            },
            "image_dimensions": {
                "height": int(light_frame.shape[0]),
                "width": int(light_frame.shape[1]),
                "channels": int(light_frame.shape[2]) if len(light_frame.shape) > 2 else 1
            },
            "metadata": metadata,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Add to 'measurements' collection
        doc_ref = db.collection('measurements').add(measurement_data)
        measurement_id = doc_ref[1].id
        
        # Prepare response with calculation results (no upload info)
        response = {
            "median_sky_brightness_dn": float(median_value),
            "sky_quality_meter": float(sky_quality_meter),
            "sky_quality_meter_moon_adjusted": float(moon_adjusted_sqm),
            "instrumental_magnitude": float(instrumental_magnitude),
            "bortle_class": int(bortle_class),
            "bortle_description": bortle_description,
            "additional_measurements": additional_measurements,
            "moon_data": {
                "phase": moon_phase_data['phase'],
                "illumination": moon_illumination,
                "altitude": moon_altitude,
                "impact_magnitude": float(moon_impact),
                "impact_description": moon_impact_desc
            },
            "processing_info": {
                "zero_point": float(zero_point),
                "exposure_time_s": float(exposure_time_s),
                "image_dimensions": light_frame.shape
            },
            "metadata": metadata,
            "firestore_id": measurement_id
        }
        
        return (json.dumps(response), 200, headers)

    except ValueError as ve:
        return (json.dumps({"error": str(ve)}), 400, headers)
    except Exception as e:
        return (json.dumps({"error": f"An unexpected error occurred: {str(e)}"}), 500, headers)


@functions_framework.http
def get_measurements(request):
    """
    HTTP Cloud Function to retrieve all measurements from Firestore.
    
    Supports optional query parameters:
    - limit: Maximum number of measurements to return (default: 100)
    - order: Sort order, either 'asc' or 'desc' (default: 'desc')
    
    Returns:
        JSON array of measurements with GPS coordinates
    """
    # Set CORS headers for all responses
    if request.method == 'OPTIONS':
        # Preflight request
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # Set CORS headers for main request
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        # Get query parameters
        limit = int(request.args.get('limit', 100))
        order = request.args.get('order', 'desc')
        
        # Query Firestore measurements collection
        measurements_ref = db.collection('measurements')
        
        # Order by created_at timestamp
        if order == 'asc':
            query = measurements_ref.order_by('created_at', direction=firestore.Query.ASCENDING).limit(limit)
        else:
            query = measurements_ref.order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
        
        # Execute query
        docs = query.stream()
        
        # Build response array
        measurements = []
        for doc in docs:
            data = doc.to_dict()
            
            # Extract GPS coordinates from metadata if available
            location = None
            if 'metadata' in data and 'location' in data['metadata']:
                loc = data['metadata']['location']
                if isinstance(loc, dict) and 'latitude' in loc and 'longitude' in loc:
                    location = {
                        'latitude': loc['latitude'],
                        'longitude': loc['longitude']
                    }
            
            measurement = {
                'id': doc.id,
                'sky_quality_meter': data.get('sky_quality_meter'),
                'median_sky_brightness_dn': data.get('median_sky_brightness_dn'),
                'instrumental_magnitude': data.get('instrumental_magnitude'),
                'zero_point': data.get('zero_point'),
                'exposure_time_s': data.get('exposure_time_s'),
                'location': location,
                'created_at': data.get('created_at'),
                'timestamp': str(data.get('timestamp')) if data.get('timestamp') else None
            }
            
            measurements.append(measurement)
        
        response = {
            'count': len(measurements),
            'measurements': measurements
        }
        
        return (json.dumps(response), 200, headers)
        
    except Exception as e:
        return (json.dumps({"error": f"An error occurred: {str(e)}"}), 500, headers)
