import functions_framework
from google.cloud import storage
import cv2
import numpy as np
import json
import os
import uuid
from datetime import datetime, timezone
import base64

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
    try:
        # Get data from the JSON request body
        request_json = request.get_json(silent=True)
        if not request_json:
            return json.dumps({"error": "No JSON payload found. Please provide images and parameters."}), 400

        # Extract required parameters
        light_image_b64 = request_json.get("light_image")
        dark_image_b64 = request_json.get("dark_image")
        zero_point = request_json.get("zero_point", 20.0)
        exposure_time_s = request_json.get("exposure_time_s", 3)
        metadata = request_json.get("metadata", {})

        if not light_image_b64 or not dark_image_b64:
            return json.dumps({"error": "Both light_image and dark_image are required as base64 encoded data"}), 400

        # Initialize Google Cloud Storage client
        bucket_name = "asvgeelong-sqm"
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)

        # Generate unique filenames with timestamp
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        session_id = str(uuid.uuid4())[:8]
        
        light_filename = f"uploads/{timestamp}_{session_id}_light.jpg"
        dark_filename = f"uploads/{timestamp}_{session_id}_dark.jpg"

        # Helper function to decode, validate and upload image
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
                
                # Upload to GCS
                blob = bucket.blob(description)
                blob.upload_from_string(image_bytes, content_type='image/jpeg')
                
                return img, blob.public_url
                
            except Exception as e:
                raise ValueError(f"Error processing image {description}: {str(e)}")

        # Upload both images and get the decoded image data
        light_frame, light_url = decode_image_from_base64(light_image_b64, light_filename)
        dark_frame, dark_url = decode_image_from_base64(dark_image_b64, dark_filename)

        # Ensure images are the same size
        if light_frame.shape != dark_frame.shape:
            return json.dumps({
                "error": "Images must have the same dimensions.",
                "light_shape": light_frame.shape,
                "dark_shape": dark_frame.shape
            }), 400

        # Perform the dark frame subtraction
        subtracted_image = cv2.subtract(light_frame.astype(np.int16), dark_frame.astype(np.int16))

        # Calculate the median pixel value
        median_value = np.median(subtracted_image)
        
        # Calculate instrumental magnitude and SQM score
        if median_value <= 0:
            return json.dumps({
                "error": "Median pixel value is non-positive, cannot calculate calibrated magnitude.",
                "median_value": float(median_value)
            }), 400

        instrumental_magnitude = -2.5 * np.log10(median_value / exposure_time_s)
        sky_quality_meter = instrumental_magnitude + zero_point
        
        # Prepare response with upload info and calculation results
        response = {
            "median_sky_brightness_dn": float(median_value),
            "sky_quality_meter": float(sky_quality_meter),
            "instrumental_magnitude": float(instrumental_magnitude),
            "uploaded_files": {
                "light_frame": {
                    "filename": light_filename,
                    "url": light_url
                },
                "dark_frame": {
                    "filename": dark_filename,
                    "url": dark_url
                }
            },
            "processing_info": {
                "zero_point": float(zero_point),
                "exposure_time_s": float(exposure_time_s),
                "image_dimensions": light_frame.shape,
                "timestamp": timestamp,
                "session_id": session_id
            },
            "metadata": metadata
        }
        
        return json.dumps(response), 200

    except ValueError as ve:
        return json.dumps({"error": str(ve)}), 400
    except Exception as e:
        return json.dumps({"error": f"An unexpected error occurred: {str(e)}"}), 500
