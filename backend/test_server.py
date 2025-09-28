#!/usr/bin/env python3
"""
Test server for the sky brightness calculation function.
"""
import json
import sys
from main import calculate_sky_brightness

class MockRequest:
    """Mock request object for testing"""
    def __init__(self, json_data):
        self._json = json_data

    def get_json(self, silent=True):
        return self._json

def test_with_payload():
    """Test the calculate_sky_brightness function with payload.json"""
    try:
        # Load payload from file
        with open('payload.json', 'r') as f:
            payload = json.load(f)

        print("📊 Testing sky brightness calculation...")
        print(f"Payload keys: {list(payload.keys())}")
        print(f"Zero point: {payload.get('zero_point')}")
        print(f"Exposure time: {payload.get('exposure_time_s')}s")

        # Create mock request
        request = MockRequest(payload)

        # Test the function
        result, status_code = calculate_sky_brightness(request)

        print(f"\n✅ SUCCESS!")
        print(f"Status Code: {status_code}")
        print(f"Result: {result}")

        # Parse and display the result
        if status_code == 200:
            result_data = json.loads(result)
            print(f"\n📈 Sky Quality Results:")
            print(f"   Median Sky Brightness: {result_data['median_sky_brightness_dn']:.2f} DN")
            print(f"   Sky Quality Meter: {result_data['sky_quality_meter']:.2f} mag/arcsec²")

        return True

    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def start_local_server():
    """Start a local Flask server for testing"""
    from flask import Flask, request, jsonify

    app = Flask(__name__)

    @app.route('/calculate', methods=['POST'])
    def calculate():
        """HTTP endpoint for sky brightness calculation"""
        try:
            result, status_code = calculate_sky_brightness(request)
            return result, status_code
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/health', methods=['GET'])
    def health():
        """Health check endpoint"""
        return jsonify({"status": "healthy", "service": "sky-brightness-calculator"}), 200

    print("🚀 Starting local test server...")
    print("   Health check: http://localhost:5000/health")
    print("   Calculate endpoint: POST http://localhost:5000/calculate")
    print("   Use Ctrl+C to stop")

    app.run(host='0.0.0.0', port=5000, debug=True)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == 'server':
        start_local_server()
    else:
        test_with_payload()