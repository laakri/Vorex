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
        
        # Initialize conversation history
        self.conversation_history = []
    
    def generate_response(self, user_message, vehicle_data):
        """Generate AI response based on user message and vehicle data."""
        
        # If using mock responses (no API key)
        if self.use_mock:
            return self._generate_mock_response(user_message, vehicle_data)
        
        try:
            # Format vehicle data
            vehicle_info = self._format_vehicle_data(vehicle_data)
            
            # Update conversation history
            self.conversation_history.append({"role": "user", "content": user_message})
            
            # Create prompt with vehicle data context
            prompt = f"""You are a helpful vehicle assistant for Vorex drivers.
            
            You have access to the following vehicle information:
            
            {vehicle_info}
            
            Use this information to provide helpful, accurate responses about the vehicle.
            If the user asks about something not related to their vehicle, politely redirect them.
            If you're asked about maintenance schedules, insurance, registration deadlines, or vehicle status, 
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
            return self._generate_mock_response(user_message, vehicle_data)
    
    def _format_vehicle_data(self, vehicle_data):
        """Format vehicle data for inclusion in the prompt."""
        try:
            vehicles = vehicle_data.get("vehicles", [])
            if not vehicles:
                return "No vehicle data available."
            
            formatted_data = []
            for vehicle in vehicles:
                # Format dates for better readability
                reg_expiry = vehicle.get('registrationExpiry')
                if reg_expiry:
                    reg_expiry = reg_expiry[:10] if isinstance(reg_expiry, str) else str(reg_expiry)
                
                ins_expiry = vehicle.get('insuranceExpiry')
                if ins_expiry:
                    ins_expiry = ins_expiry[:10] if isinstance(ins_expiry, str) else str(ins_expiry)
                
                # Format vehicle info
                vehicle_info = f"""
                Vehicle: {vehicle.get('year', 'N/A')} {vehicle.get('make', 'N/A')} {vehicle.get('model', 'N/A')}
                License Plate: {vehicle.get('licensePlate', 'N/A')}
                Registration Expires: {reg_expiry}
                Insurance Expires: {ins_expiry}
                Status: {vehicle.get('status', 'N/A')}
                """
                formatted_data.append(vehicle_info)
            
            return "\n".join(formatted_data)
            
        except Exception as e:
            logger.error(f"Error formatting vehicle data: {str(e)}")
            return "Error formatting vehicle data."
    
    def _generate_mock_response(self, user_message, vehicle_data):
        """Generate mock responses when Gemini API is not available."""
        
        # Get vehicle info if available
        vehicle_info = ""
        vehicles = vehicle_data.get("vehicles", [])
        if vehicles:
            vehicle = vehicles[0]  # Take first vehicle
            vehicle_info = f"{vehicle.get('year', '')} {vehicle.get('make', '')} {vehicle.get('model', '')}"
        
        # Common queries and responses
        if "insurance" in user_message.lower():
            return f"Your insurance for the {vehicle_info} expires on {vehicles[0].get('insuranceExpiry', 'not specified')}. Make sure to renew it before the expiration date to maintain coverage."
        
        elif "registration" in user_message.lower():
            return f"The registration for your {vehicle_info} expires on {vehicles[0].get('registrationExpiry', 'not specified')}. Remember to renew it on time to avoid penalties."
        
        elif "maintenance" in user_message.lower() or "service" in user_message.lower():
            return f"Based on standard maintenance schedules for a {vehicle_info}, you should have regular oil changes every 5,000-7,500 miles, rotate tires every 6,000-8,000 miles, and check brakes every 10,000-12,000 miles."
        
        elif "status" in user_message.lower():
            return f"Your {vehicle_info} is currently {vehicles[0].get('status', 'in an unknown status')}."
        
        else:
            return f"I'm your vehicle assistant for your {vehicle_info}. I can help with information about your vehicle's registration, insurance, maintenance schedule, and status. What would you like to know?" 