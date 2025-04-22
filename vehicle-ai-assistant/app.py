from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from api.database import init_db, get_vehicle_data, get_vehicle_issues
from api.ai_assistant import VehicleAIAssistant

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize AI assistant
ai_assistant = VehicleAIAssistant()

@app.route('/')
def home():
    """Render the home page."""
    return render_template('index.html')

@app.route('/api/vehicle-data/<driver_id>')
def get_driver_vehicle_data(driver_id):
    """Get vehicle data for a specific driver."""
    try:
        data = get_vehicle_data(driver_id)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/vehicle-issues/<vehicle_id>')
def get_vehicle_issue_data(vehicle_id):
    """Get issues for a specific vehicle."""
    try:
        issues = get_vehicle_issues(vehicle_id)
        return jsonify({"issues": issues})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/assistant/chat', methods=['POST'])
def chat_with_assistant():
    """Handle chat messages with the AI assistant."""
    try:
        data = request.json
        driver_id = data.get('driver_id')
        message = data.get('message')
        
        if not driver_id or not message:
            return jsonify({"error": "Missing driver_id or message"}), 400
        
        # Get vehicle data for the driver
        vehicle_data = get_vehicle_data(driver_id)
        
        # Get AI response
        response = ai_assistant.generate_response(message, vehicle_data)
        
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/assistant/health-check')
def health_check():
    """Check if the AI service is running properly."""
    return jsonify({"status": "healthy", "using_mock": ai_assistant.use_mock})

if __name__ == '__main__':
    # Initialize database connection
    try:
        init_db()
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        print("The application will start but may not be able to access vehicle data.")
    
    # Get port from environment variable or use 5000 as default
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True) 