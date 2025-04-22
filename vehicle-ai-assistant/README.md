# Vorex Vehicle AI Assistant

This is a standalone AI assistant service for Vorex drivers, providing intelligent vehicle-related information and recommendations based on their vehicle data.

## Features

- Connects to the existing Vorex PostgreSQL database
- Provides an AI assistant that can answer questions about vehicle information
- Handles queries about maintenance schedules, insurance, registration, and more
- Works with both the OpenAI API or provides mock responses for development
- Simple web interface for testing

## Setup

### Prerequisites

- Python 3.8 or higher
- Access to the Vorex PostgreSQL database
- OpenAI API key (optional but recommended)

### Installation

1. Clone the repository
2. Create a virtual environment:

```bash
cd vorex/vehicle-ai-assistant
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file based on the `.env.example` template:

```
# Database configuration
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vorex

# Alternative: Full database URL
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vorex

# Flask configuration
PORT=5000
FLASK_ENV=development

# OpenAI configuration
OPENAI_API_KEY=your_openai_api_key_here

# Allowed origins for CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

5. Start the server:

```bash
python app.py
```

The application will be available at `http://localhost:5000`.

## API Endpoints

### Vehicle Data

- `GET /api/vehicle-data/<driver_id>` - Get vehicle data for a specific driver

### AI Assistant

- `POST /api/assistant/chat` - Chat with the AI assistant
  - Payload: `{ "driver_id": "driver-id-here", "message": "Your message here" }`
- `GET /api/assistant/health-check` - Check if the AI service is running

## Integration

This service is designed to be integrated with the main Vorex application. There are several ways to integrate:

1. **API Integration**: Call the assistant API endpoints from the main application
2. **Iframe Integration**: Embed the assistant UI in an iframe
3. **Component Integration**: Use the HTML/CSS/JavaScript from the templates to build a similar interface in the main application

## Development

### Testing

Run tests with:

```bash
pytest
```

### Mock Mode

If no OpenAI API key is provided, the service will run in "mock mode," providing predefined responses to common queries. This is useful for development and testing without consuming API credits.

## Future Enhancements

- Voice interface using LiveKit or similar technology
- Mobile integration
- Proactive notifications about upcoming maintenance or expiring registrations/insurance
- Integration with maintenance service providers
- More detailed analytics and recommendations based on vehicle usage 