import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Mic, MicOff, WifiOff } from 'lucide-react';

interface VoiceAgentProps {
  onMessage?: (message: string) => void;
  className?: string;
}

export function VoiceAgent({ onMessage, className = '' }: VoiceAgentProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [synthesis] = useState(() => window.speechSynthesis);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setRetryCount(0); // Reset retry count on successful start
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onMessage?.(transcript);
      };

      recognition.onerror = async (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);

        if (event.error === 'network' && retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          console.log(`Retrying... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
          
          // Wait a moment before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            recognition.start();
          } catch (e) {
            console.error('Retry failed:', e);
          }
        }
      };

      setRecognition(recognition);
    }
  }, [onMessage, retryCount]);

  useEffect(() => {
    initializeRecognition();
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [initializeRecognition]);

  const speak = useCallback((text: string) => {
    if (synthesis.speaking) {
      synthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    synthesis.speak(utterance);
  }, [synthesis]);

  const toggleListening = useCallback(() => {
    if (!recognition || !isOnline) return;

    try {
      if (isListening) {
        recognition.stop();
      } else {
        setRetryCount(0); // Reset retry count before new attempt
        recognition.start();
      }
    } catch (error) {
      console.error('Error toggling speech recognition:', error);
    }
  }, [recognition, isListening, isOnline]);

  if (!recognition) {
    return (
      <div className="text-center text-red-500">
        Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <Button
        variant={isListening ? "destructive" : isOnline ? "default" : "secondary"}
        size="icon"
        onClick={toggleListening}
        className="rounded-full w-12 h-12 relative"
        disabled={!isOnline}
        title={!isOnline ? "Check your internet connection" : "Click to start voice recognition"}
      >
        {!isOnline ? (
          <WifiOff className="h-6 w-6" />
        ) : isListening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
        {isListening && (
          <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </Button>
      
      {!isOnline && (
        <div className="text-sm text-yellow-500 text-center max-w-xs">
          Please check your internet connection
        </div>
      )}
      
      {isListening && isOnline && (
        <div className="text-sm text-green-500">
          Listening...
        </div>
      )}
      
      {retryCount > 0 && retryCount < MAX_RETRIES && (
        <div className="text-sm text-blue-500">
          Reconnecting... Attempt {retryCount} of {MAX_RETRIES}
        </div>
      )}
    </div>
  );
} 