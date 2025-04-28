import asyncio
import logging
from dotenv import load_dotenv
from api.voice_ai import VoiceAI

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def main():
    """Main function to run the voice AI assistant."""
    try:
        # Initialize voice AI
        voice_ai = VoiceAI()
        
        # Start the assistant
        logger.info("Starting Voice AI assistant...")
        await voice_ai.start()
        
        # Keep the script running
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("Shutting down Voice AI assistant...")
        await voice_ai.stop()
    except Exception as e:
        logger.error(f"Error running Voice AI assistant: {str(e)}")
        await voice_ai.stop()

if __name__ == "__main__":
    asyncio.run(main()) 