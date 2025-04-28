import os
import logging
import asyncio
import json
from typing import Optional, Callable
from livekit import rtc
from livekit.agents import (
    JobContext,
    JobRequest,
    Worker,
    WorkerOptions,
    stt,
    tts,
    llm,
    voice_assistant
)
from .ai_assistant import VehicleAIAssistant

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VoiceAI:
    """Voice AI integration using LiveKit for real-time speech interaction."""
    
    def __init__(self):
        # Initialize LiveKit worker
        self.worker = Worker(
            WorkerOptions(
                host=os.getenv("LIVEKIT_URL", "ws://localhost:7880"),
                api_key=os.getenv("LIVEKIT_API_KEY"),
                api_secret=os.getenv("LIVEKIT_API_SECRET"),
            )
        )
        
        # Initialize vehicle AI assistant
        self.vehicle_assistant = VehicleAIAssistant()
        
        # Initialize speech components
        self.stt = stt.StreamingSpeechToText()
        self.tts = tts.TextToSpeech()
        self.llm = llm.LanguageModel()
        
        # Set up event handlers
        self.worker.on("job_requested", self._handle_job_request)
        self.worker.on("job_ended", self._handle_job_end)
        
    async def start(self):
        """Start the LiveKit worker."""
        try:
            await self.worker.start()
            logger.info("Voice AI worker started successfully")
        except Exception as e:
            logger.error(f"Failed to start Voice AI worker: {str(e)}")
            raise
    
    async def stop(self):
        """Stop the LiveKit worker."""
        try:
            await self.worker.stop()
            logger.info("Voice AI worker stopped successfully")
        except Exception as e:
            logger.error(f"Failed to stop Voice AI worker: {str(e)}")
            raise
    
    async def _handle_job_request(self, request: JobRequest):
        """Handle incoming job requests."""
        try:
            context = await request.accept()
            logger.info(f"Accepted job request: {request.id}")
            
            # Set up voice assistant
            assistant = voice_assistant.VoiceAssistant(
                context=context,
                stt=self.stt,
                tts=self.tts,
                llm=self.llm,
                on_message=self._handle_ai_message
            )
            
            # Start the assistant
            await assistant.start()
            
        except Exception as e:
            logger.error(f"Error handling job request: {str(e)}")
            await context.reject(str(e))
    
    async def _handle_job_end(self, context: JobContext):
        """Handle job completion."""
        logger.info(f"Job ended: {context.job_id}")
    
    async def _handle_ai_message(self, message: str) -> str:
        """Process incoming messages and generate responses."""
        try:
            # Get response from vehicle AI assistant
            response = self.vehicle_assistant.generate_response(message)
            
            # Format response for voice output
            formatted_response = self._format_response_for_voice(response)
            
            return formatted_response
            
        except Exception as e:
            logger.error(f"Error processing AI message: {str(e)}")
            return "I'm sorry, I encountered an error processing your request."
    
    def _format_response_for_voice(self, response: str) -> str:
        """Format text response for natural voice output."""
        # Add pauses and emphasis for better speech synthesis
        formatted = response.replace(". ", ". <break time='500ms'/>")
        formatted = formatted.replace("!", "! <break time='700ms'/>")
        formatted = formatted.replace("?", "? <break time='700ms'/>")
        
        # Add emphasis to important numbers and dates
        formatted = formatted.replace(" km", " kilometers")
        formatted = formatted.replace(" kg", " kilograms")
        
        return formatted 