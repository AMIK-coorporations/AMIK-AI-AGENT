
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BrainCircuit, Mic, Power, Wifi } from 'lucide-react';
import AudioVisualizer from '@/components/audio-visualizer';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { recognizeUrduWakeWord } from '@/ai/flows/urdu-wake-word';
import { liveDataSearch } from '@/ai/flows/live-data-search';
import { urduVoiceResponse } from '@/ai/flows/urdu-voice-response';
import { urduResponse } from '@/ai/flows/urdu-response';

type Status = 'idle' | 'listening' | 'processing' | 'speaking';

const WAKE_WORD = 'مصنوئی ذھانت';
const SEARCH_KEYWORD_UR = "تلاش کرو";
const SEARCH_KEYWORD_EN = "search";
const INITIAL_MESSAGE = "شروع کرنے کے لیے پاور بٹن پر کلک کریں";
const WELCOME_MESSAGE = "خوش آمدید! میں ہوں AMIK، آپ کا ذاتی اے آئی اسسٹنٹ۔";


export default function AmikClient() {
  const [status, setStatus] = useState<Status>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [statusText, setStatusText] = useState(WELCOME_MESSAGE);
  const [isClient, setIsClient] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const wakeWordDetectedRef = useRef(false);

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    if (status === 'idle' && statusText === WELCOME_MESSAGE) {
      const timer = setTimeout(() => {
          setStatusText(INITIAL_MESSAGE);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [status, statusText]);


  const setupAudio = useCallback(async () => {
    if (audioContextRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      const source = context.createMediaStreamSource(stream);

      audioContextRef.current = context;
      analyserNodeRef.current = analyser;
      micSourceNodeRef.current = source;
      
      source.connect(analyser);

      const audioPlayer = new Audio();
      audioPlayer.crossOrigin = 'anonymous';
      audioPlayerRef.current = audioPlayer;
      const audioSource = context.createMediaElementSource(audioPlayer);
      audioSourceNodeRef.current = audioSource;

      audioPlayer.onplay = () => {
        setStatus('speaking');
        if (micSourceNodeRef.current) micSourceNodeRef.current.disconnect();
        if (audioSourceNodeRef.current && analyserNodeRef.current) {
            audioSourceNodeRef.current.connect(analyserNodeRef.current);
            if(context.state !== 'running') context.resume();
            analyserNodeRef.current.connect(context.destination);
        }
      };
      
      // Default onended behavior
      audioPlayer.onended = () => {
        setStatus('listening');
        setStatusText('اب اپنا سوال پوچھیں');
        if (audioSourceNodeRef.current) audioSourceNodeRef.current.disconnect();
        if (micSourceNodeRef.current && analyserNodeRef.current) {
          micSourceNodeRef.current.connect(analyserNodeRef.current);
        }
        wakeWordDetectedRef.current = true;
        startListening();
      };

    } catch (err) {
      console.error('Mic access denied', err);
      toast({
        title: 'مائیک کی اجازت درکار ہے',
        description: 'ایپ کو استعمال کرنے کے لئے براہ کرم مائیک تک رسائی کی اجازت دیں۔',
        variant: 'destructive',
      });
      setStatusText('مائیک کی اجازت درکار ہے');
    }
  }, [toast]);

  const speak = useCallback(async (text: string, onEndedCallback?: () => void) => {
    setAiResponseText(text);
    setStatusText('آواز بنائی جا رہی ہے...');
    try {
      const voiceResult = await urduVoiceResponse(text);
      if (audioPlayerRef.current) {
        // Set the specific onended callback if provided, otherwise the default one will run.
        if (onEndedCallback) {
            audioPlayerRef.current.onended = onEndedCallback;
        } else {
            // Restore default onended if no specific callback is provided
            audioPlayerRef.current.onended = () => {
                setStatus('listening');
                setStatusText('اب اپنا سوال پوچھیں');
                if (audioSourceNodeRef.current) audioSourceNodeRef.current.disconnect();
                if (micSourceNodeRef.current && analyserNodeRef.current) {
                    micSourceNodeRef.current.connect(analyserNodeRef.current);
                }
                wakeWordDetectedRef.current = true;
                startListening();
            };
        }
        audioPlayerRef.current.src = voiceResult.audioDataUri;
        audioPlayerRef.current.play();
      }
    } catch (error) {
      console.error('AI Voice error', error);
      toast({ title: 'آواز کی خرابی', description: 'آواز پیدا کرنے میں ناکام۔', variant: 'destructive' });
      setAiResponseText(text); // Show text as fallback
      // Fallback to idle listening state
      setStatus('listening');
      setStatusText('اب اپنا سوال پوچھیں...');
      wakeWordDetectedRef.current = true;
      startListening();
    }
  }, [toast]);


  const processText = useCallback(async (text: string) => {
    if (!text) {
        setStatus('idle');
        return;
    };
    setUserTranscript(text);
    setStatus('processing');
    
    try {
      let aiTextResponse = '';
      if (text.toLowerCase().includes(SEARCH_KEYWORD_EN) || text.includes(SEARCH_KEYWORD_UR)) {
        setStatusText('براہ راست ڈیٹا کی تلاش...');
        const query = text.replace(SEARCH_KEYWORD_UR, "").replace(SEARCH_KEYWORD_EN, "").trim();
        const searchResult = await liveDataSearch({ query });
        
        const combinedQuery = `ان نتائج کی بنیاد پر اس سوال کا جواب دیں: '${query}'. نتائج یہ ہیں: ${searchResult.results}`;
        const finalResponse = await urduResponse({ query: combinedQuery });
        aiTextResponse = finalResponse.response;
      } else {
        setStatusText('جواب تیار کیا جا رہا ہے...');
        const result = await urduResponse({ query: text });
        aiTextResponse = result.response;
      }
      
      speak(aiTextResponse);

    } catch (error) {
      console.error('AI Flow error', error);
      setStatus('idle');
      setStatusText('کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں');
      toast({ title: 'AI Error', description: 'Failed to process request.', variant: 'destructive' });
    }
  }, [speak, toast]);

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  
  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: (transcript) => {
      stopListening();
      if (wakeWordDetectedRef.current) {
        processText(transcript);
      } else {
        (async () => {
          const { wakeWordDetected } = await recognizeUrduWakeWord({ text: transcript });
          if (wakeWordDetected) {
            handleGreeting();
          } else {
            setStatus('idle');
            setStatusText(INITIAL_MESSAGE);
          }
        })();
      }
    },
    onEnd: () => {
      if (statusRef.current === 'listening') {
        startListening();
      }
    },
    onError: (error) => {
      if (error !== 'no-speech' && error !== 'aborted') {
        toast({ title: 'آواز کی شناخت میں خرابی', description: 'ہم آپ کی آواز نہیں سن سکے۔', variant: 'destructive' });
      }
      if (statusRef.current !== 'processing' && statusRef.current !== 'speaking') {
         setStatus('idle');
         setStatusText(INITIAL_MESSAGE);
      }
    }
  });


  const handleGreeting = useCallback(() => {
    setStatus('processing');
    const greetingText = "خوش آمدید! میں اے-ایم-آئی-کے AI ایجنٹ ہوں، آپ کا ذاتی اے آئی اسسٹنٹ۔ میں آپ کی کیا مدد کر سکتا ہوں؟";
    
    speak(greetingText, () => {
        setStatus('listening');
        setStatusText('اب اپنا سوال پوچھیں...');
        setUserTranscript('');
        setAiResponseText(''); // Clear previous response text
        if (audioSourceNodeRef.current) audioSourceNodeRef.current.disconnect();
        if (micSourceNodeRef.current && analyserNodeRef.current) {
          micSourceNodeRef.current.connect(analyserNodeRef.current);
        }
        wakeWordDetectedRef.current = true;
        startListening();
    });

  }, [speak, startListening]);

  const handleMicClick = async () => {
    await setupAudio();
    if (!audioContextRef.current) return;
    if(audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (status !== 'idle') {
      stopListening();
      wakeWordDetectedRef.current = false;
      setStatus('idle');
      setStatusText(INITIAL_MESSAGE);
      if(audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      }
    } else {
      handleGreeting();
    }
  };

  const Icon = status === 'processing' ? BrainCircuit : status === 'speaking' ? Wifi : status === 'listening' ? Mic : Power;
  const iconAnimation = status === 'processing' || status === 'listening' ? 'animate-pulse' : '';

  return (
    <div className="flex flex-col items-center justify-between text-center gap-8 w-full h-full p-4 md:p-8">
      <header className="w-full flex justify-between items-center z-20">
        <h1 className="text-2xl font-display text-glow uppercase">AMIK AI AGENT</h1>
      </header>
      
      <main className="flex flex-col items-center justify-center gap-8 w-full max-w-4xl">
        <div className="relative h-64 w-64 md:h-80 md:w-80">
          {isClient && <AudioVisualizer analyserNode={analyserNodeRef.current} status={status} />}
          <Button
            onClick={handleMicClick}
            size="icon"
            className={cn(
              "absolute inset-0 m-auto w-28 h-28 md:w-32 md:h-32 rounded-full text-primary-foreground transition-all duration-300 z-10 animate-glow border-4 border-primary/50",
              status === 'idle' ? 'bg-primary/20 hover:bg-primary/40' : '',
              status === 'listening' ? 'bg-accent/80' : 'bg-primary/80',
              status === 'speaking' ? 'bg-primary/50' : '',
              status === 'processing' ? 'bg-transparent' : ''
            )}
          >
            <Icon className={cn("w-10 h-10 md:w-12 md:h-12", iconAnimation)} />
          </Button>
        </div>

        <div className="min-h-[2rem] text-muted-foreground text-lg md:text-xl font-display tracking-wider uppercase">
          <p>{statusText}</p>
        </div>
      </main>

      <footer className="w-full flex justify-center pb-4 z-20">
         <div dir="ltr" className="w-full max-w-4xl min-h-[100px] glass-card rounded-xl p-4 font-code text-lg text-right flex flex-col justify-end shadow-lg">
          {userTranscript && <p className="text-muted-foreground"><span className='text-accent/80'>&gt; </span>{userTranscript}</p>}
          {aiResponseText && <p className="text-foreground mt-2">{aiResponseText}</p>}
        </div>
      </footer>

    </div>
  );
}
