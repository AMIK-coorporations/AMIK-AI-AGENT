
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({ onResult, onEnd, onError }: SpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech Recognition API not supported in this browser.');
      onError?.('not-supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'ur-PK';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      onEnd?.();
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('Speech recognition error', event.error);
      }
      setIsListening(false);
      onError?.(event.error);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      onResult(transcript);
    };
    
    recognitionRef.current = recognition;

    return () => {
      if(recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onResult, onEnd, onError]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isListening,
    startListening,
    stopListening,
  };
}
