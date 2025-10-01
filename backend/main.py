import functions_framework
import cv2
import numpy as np
import json
import base64
from datetime import datetime
import os
import firebase_admin
from firebase_admin import credentials, firestore

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
        
        # Save measurement to Firestore using the global db client
        measurement_data = {
            "median_sky_brightness_dn": float(median_value),
            "sky_quality_meter": float(sky_quality_meter),
            "instrumental_magnitude": float(instrumental_magnitude),
            "zero_point": float(zero_point),
            "exposure_time_s": float(exposure_time_s),
            "image_dimensions": {
                "height": int(light_frame.shape[0]),
                "width": int(light_frame.shape[1]),
                "channels": int(light_frame.shape[2]) if len(light_frame.shape) > 2 else 1
            },
            "metadata": metadata,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Add to 'measurements' collection
        doc_ref = db.collection('measurements').add(measurement_data)
        measurement_id = doc_ref[1].id
        
        # Prepare response with calculation results (no upload info)
        response = {
            "median_sky_brightness_dn": float(median_value),
            "sky_quality_meter": float(sky_quality_meter),
            "instrumental_magnitude": float(instrumental_magnitude),
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
