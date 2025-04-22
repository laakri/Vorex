import os
import json
import logging
import requests
from datetime import datetime
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class VehicleAIAssistant:
    """AI assistant for vehicle-related queries and analysis using Gemini API."""
    
    def __init__(self):
        # Get Gemini API key from environment variables
        self.api_key = os.environ.get('GEMINI_API_KEY')
        self.gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
        
        if not self.api_key:
            logger.warning("Gemini API key not found. Using mock responses.")
            self.use_mock = True
        else:
            self.use_mock = False
        
        # Load vehicle data
        self.vehicle_data = self._load_vehicle_data()
        
        # Initialize conversation history
        self.conversation_history = []
    
    def _load_vehicle_data(self):
        """Load vehicle data from JSON file."""
        try:
            with open('static/vehicle-data.json', 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading vehicle data: {str(e)}")
            return None
    
    def generate_response(self, user_message):
        """Generate AI response based on user message and vehicle data."""
        
        # If using mock responses (no API key)
        if self.use_mock:
            return self._generate_mock_response(user_message)
        
        try:
            # Format vehicle data
            vehicle_info = self._format_vehicle_data()
            
            # Update conversation history
            self.conversation_history.append({"role": "user", "content": user_message})
            
            # Create prompt with vehicle data context
            prompt = f"""You are a helpful vehicle assistant for Vorex drivers.
            
            You have access to the following vehicle information:
            
            {vehicle_info}
            
            Use this information to provide helpful, accurate responses about the vehicle.
            If the user asks about something not related to their vehicle, politely redirect them.
            If you're asked about maintenance schedules, insurance, or vehicle status, 
            use the provided data to give specific, personalized answers.
            
            Current date: {datetime.now().strftime('%Y-%m-%d')}
            
            User question: {user_message}"""
            
            # Prepare request for Gemini API
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            
            url = f"{self.gemini_url}?key={self.api_key}"
            headers = {"Content-Type": "application/json"}
            
            # Call Gemini API
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()  # Raise exception for HTTP errors
            
            response_data = response.json()
            
            # Extract text from response
            ai_response = response_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            if not ai_response:
                logger.error("Gemini API returned empty response")
                ai_response = "I'm sorry, I couldn't generate a response. Please try again."
            
            # Update conversation history with AI response
            self.conversation_history.append({"role": "assistant", "content": ai_response})
            
            return ai_response
            
        except Exception as e:
            logger.error(f"Error generating AI response: {str(e)}")
            # Fallback to mock response in case of error
            return self._generate_mock_response(user_message)
    
    def _format_vehicle_data(self):
        """Format vehicle data for inclusion in the prompt."""
        if not self.vehicle_data:
            return "No vehicle data available."
        
        try:
            vehicle = self.vehicle_data["vehicle"]
            driver = self.vehicle_data["driver"]
            
            # Format maintenance records
            maintenance_records = "\n".join([
                f"- {record['type']} ({record['date']}): {record['description']} (${record['cost']})"
                for record in vehicle["maintenanceRecords"]
            ])
            
            # Format current issues
            current_issues = "\n".join([
                f"- {issue['title']} ({issue['status']}): {issue['description']}"
                for issue in vehicle["issues"]
                if issue["status"] != "RESOLVED"
            ])
            
            # Format vehicle info
            formatted_data = f"""
            Vehicle Information:
            - Make/Model: {vehicle['make']} {vehicle['model']} ({vehicle['year']})
            - Plate Number: {vehicle['plateNumber']}
            - Type: {vehicle['type']}
            - Capacity: {vehicle['capacity']} kg
            - Max Weight: {vehicle['maxWeight']} kg
            - Current Status: {vehicle['currentStatus']}
            - Odometer: {vehicle['odometer']} km
            - Last Maintenance: {vehicle['lastMaintenance']}
            - Next Maintenance: {vehicle['nextMaintenance']}
            
            Insurance Information:
            - Provider: {vehicle['insurance']['provider']}
            - Policy Number: {vehicle['insurance']['policyNumber']}
            - Coverage: {vehicle['insurance']['coverage']}
            - Valid Until: {vehicle['insurance']['endDate']}
            
            Recent Maintenance Records:
            {maintenance_records}
            
            Current Issues:
            {current_issues}
            
            Driver Information:
            - Name: {driver['name']}
            - License Number: {driver['licenseNumber']}
            - License Type: {driver['licenseType']}
            - License Expiry: {driver['licenseExpiry']}
            - Rating: {driver['rating']}/5
            - Total Deliveries: {driver['totalDeliveries']}
            - Status: {driver['availabilityStatus']}
            """
            
            return formatted_data
            
        except Exception as e:
            logger.error(f"Error formatting vehicle data: {str(e)}")
            return "Error formatting vehicle data."
    
    def _generate_mock_response(self, user_message):
        """Generate mock responses when Gemini API is not available."""
        if not self.vehicle_data:
            return "I'm sorry, I don't have access to vehicle data at the moment."
        
        vehicle = self.vehicle_data["vehicle"]
        driver = self.vehicle_data["driver"]
        
        # Common queries and responses
        if "insurance" in user_message.lower():
            return f"Your insurance with {vehicle['insurance']['provider']} (Policy: {vehicle['insurance']['policyNumber']}) is valid until {vehicle['insurance']['endDate']}. The coverage includes {vehicle['insurance']['coverage']}."
        
        elif "maintenance" in user_message.lower() or "service" in user_message.lower():
            next_maintenance = vehicle['nextMaintenance']
            last_maintenance = vehicle['lastMaintenance']
            return f"Your last maintenance was on {last_maintenance} and the next scheduled maintenance is on {next_maintenance}. Recent maintenance includes: " + \
                   ", ".join([f"{record['type']} on {record['date']}" for record in vehicle['maintenanceRecords'][:3]])
        
        elif "issues" in user_message.lower() or "problems" in user_message.lower():
            current_issues = [issue for issue in vehicle['issues'] if issue['status'] != 'RESOLVED']
            if current_issues:
                return "Current vehicle issues:\n" + "\n".join([
                    f"- {issue['title']} ({issue['priority']} priority): {issue['description']}"
                    for issue in current_issues
                ])
            return "There are no current issues with your vehicle."
        
        elif "status" in user_message.lower():
            return f"Your {vehicle['make']} {vehicle['model']} is currently {vehicle['currentStatus']}. The odometer reading is {vehicle['odometer']} km."
        
        elif "driver" in user_message.lower():
            return f"Driver Information:\n" + \
                   f"Name: {driver['name']}\n" + \
                   f"License: {driver['licenseNumber']} (Type {driver['licenseType']})\n" + \
                   f"Rating: {driver['rating']}/5 from {driver['totalDeliveries']} deliveries\n" + \
                   f"Current Status: {driver['availabilityStatus']}"
        
        else:
            return f"I'm your vehicle assistant for your {vehicle['make']} {vehicle['model']}. I can help with information about your vehicle's insurance, maintenance, current issues, and status. What would you like to know?" 