'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BrainCircuit, Mic, Wifi } from 'lucide-react';
import AudioVisualizer from '@/components/audio-visualizer';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { recognizeUrduWakeWord } from '@/ai/flows/urdu-wake-word';
import { urduResponse } from '@/ai/flows/urdu-response';
import { liveDataSearch } from '@/ai/flows/live-data-search';
import { urduVoiceResponse } from '@/ai/flows/urdu-voice-response';

type Status = 'idle' | 'listening' | 'processing' | 'speaking';

const WAKE_WORD = 'مصنوئی ذھانت';
const SEARCH_KEYWORD_UR = "تلاش کرو";
const SEARCH_KEYWORD_EN = "search";

export default function AmikClient() {
  const [status, setStatus] = useState<Status>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiResponseText, setAiResponseText] = useState('');
  const [statusText, setStatusText] = useState('شروع کرنے کے لیے مائیک پر کلک کریں');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const wakeWordDetectedRef = useRef(false);

  const { toast } = useToast();

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
      
      audioPlayer.onended = () => {
        setStatus('idle');
        setStatusText('دوبارہ پوچھنے کے لیے کلک کریں');
        if (audioSourceNodeRef.current) audioSourceNodeRef.current.disconnect();
        if (micSourceNodeRef.current && analyserNodeRef.current) {
          micSourceNodeRef.current.connect(analyserNodeRef.current);
        }
        wakeWordDetectedRef.current = false;
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
        setAiResponseText(aiTextResponse);
      } else {
        setStatusText('جواب تیار کیا جا رہا ہے...');
        const result = await urduResponse({ query: text });
        aiTextResponse = result.response;
        setAiResponseText(aiTextResponse);
      }
      
      setStatusText('آواز بنائی جا رہی ہے...');
      const voiceResult = await urduVoiceResponse(aiTextResponse);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = voiceResult.audioDataUri;
        audioPlayerRef.current.play();
      }
    } catch (error) {
      console.error('AI Flow error', error);
      setStatus('idle');
      setStatusText('کچھ غلط ہو گیا۔ براہ کرم دوبارہ کوشش کریں');
      toast({ title: 'AI Error', description: 'Failed to process request.', variant: 'destructive' });
    }
  }, [toast]);

  const handleSpeechResult = useCallback(async (transcript: string) => {
    stopListening();
    if (wakeWordDetectedRef.current) {
      processText(transcript);
    } else {
      const { wakeWordDetected } = await recognizeUrduWakeWord({ text: transcript });
      if (wakeWordDetected) {
        wakeWordDetectedRef.current = true;
        setUserTranscript(transcript);
        setAiResponseText('');
        setStatusText('اب اپنا سوال پوچھیں...');
        startListening();
      } else {
        setStatus('idle');
        setStatusText('شروع کرنے کے لیے مائیک پر کلک کریں');
      }
    }
  }, [processText]);
  
  const { isListening, startListening, stopListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onEnd: () => {
      if (statusRef.current === 'listening' && !wakeWordDetectedRef.current) {
        setStatus('idle');
        setStatusText('شروع کرنے کے لیے مائیک پر کلک کریں');
      }
    },
    onError: (error) => {
      if (error !== 'no-speech') {
        toast({ title: 'آواز کی شناخت میں خرابی', description: 'ہم آپ کی آواز نہیں سن سکے۔', variant: 'destructive' });
      }
      setStatus('idle');
      setStatusText('شروع کرنے کے لیے مائیک پر کلک کریں');
      wakeWordDetectedRef.current = false;
    }
  });

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const handleMicClick = async () => {
    await setupAudio();
    if (!audioContextRef.current) return;
    if(audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (isListening) {
      stopListening();
    } else {
      wakeWordDetectedRef.current = false;
      startListening();
      setStatus('listening');
      setStatusText(`'${WAKE_WORD}' بولیں`);
      setUserTranscript('');
      setAiResponseText('');
    }
  };

  const Icon = status === 'processing' ? BrainCircuit : status === 'speaking' ? Wifi : Mic;
  const iconAnimation = status === 'processing' || status === 'listening' ? 'animate-pulse' : '';

  return (
    <div className="flex flex-col items-center justify-center text-center gap-8 w-full max-w-2xl">
      <div className="fixed top-5 left-5 text-accent font-code text-lg z-20">آمِک AI</div>
      
      <div dir="ltr" className="w-full min-h-[100px] bg-card/50 rounded-lg p-4 border border-border/50 font-code text-lg text-right flex flex-col justify-end shadow-lg">
        {userTranscript && <p className="text-muted-foreground"><span className='text-accent/80'>&gt; </span>{userTranscript}</p>}
        {aiResponseText && <p className="text-foreground mt-2">{aiResponseText}</p>}
      </div>

      <div className="relative h-64 w-64">
        <AudioVisualizer analyserNode={analyserNodeRef.current} isSpeaking={status === 'speaking'} />
        <Button
          onClick={handleMicClick}
          size="icon"
          className={cn(
            "absolute inset-0 m-auto w-24 h-24 rounded-full text-primary-foreground transition-all duration-300 z-10 animate-glow",
            status === 'listening' ? 'bg-accent/80' : 'bg-primary',
            status === 'speaking' ? 'bg-primary/50' : ''
          )}
          disabled={status === 'processing' || status === 'speaking'}
        >
          <Icon className={cn("w-10 h-10", iconAnimation)} />
        </Button>
      </div>

      <div className="min-h-[2rem] text-muted-foreground text-xl font-headline tracking-wider">
        <p>{statusText}</p>
      </div>
    </div>
  );
}