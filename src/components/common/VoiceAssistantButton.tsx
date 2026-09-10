'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceAssistantButtonProps {
  onCommand?: (command: string) => void;
  className?: string;
}

export function VoiceAssistantButton({ onCommand, className }: VoiceAssistantButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(true);

  const presetQueries = [
    'What is my fair market price today?',
    'Simulate 40% rain damage shock',
    'Should I sell now or store in cold chain?',
    'Show top paying buyers with farm pickup',
    'Check reefer truck cold chain risk',
  ];

  const handleSelectQuery = (query: string) => {
    setTranscript(query);
    if (onCommand) onCommand(query);
    setTimeout(() => {
      setModalOpen(false);
    }, 400);
  };

  const toggleListening = () => {
    if (!isListening) {
      setModalOpen(true);
      if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        try {
          const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRec();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-IN';

          recognition.onstart = () => setIsListening(true);
          recognition.onresult = (event: any) => {
            const speechResult = event.results[0][0].transcript;
            setTranscript(speechResult);
            if (onCommand) onCommand(speechResult);
            setIsListening(false);
          };
          recognition.onerror = () => setIsListening(false);
          recognition.onend = () => setIsListening(false);

          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setSupported(false);
      }
    } else {
      setIsListening(false);
    }
  };

  return (
    <>
      <button
        type='button'
        onClick={toggleListening}
        className={cn(
          'p-2.5 rounded-xl border flex items-center gap-2 transition-all shadow-sm',
          isListening 
            ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
          className
        )}
        title='AgriFlow Voice Assistant (Kisan Saathi)'
      >
        <Mic className='w-4 h-4' />
        <span className='text-xs font-bold hidden sm:inline'>Kisan Voice</span>
      </button>

      {modalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in'>
          <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2.5'>
                <div className='w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center'>
                  <Sparkles className='w-5 h-5' />
                </div>
                <div>
                  <h3 className='text-base font-bold text-slate-900 dark:text-white'>Kisan Voice Assistant</h3>
                  <p className='text-xs text-slate-500 dark:text-slate-400'>Speak or tap a common agricultural query</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className='p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            <div className='p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-2'>
              <div className='w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center'>
                {isListening ? <Mic className='w-6 h-6 animate-bounce' /> : <Volume2 className='w-6 h-6' />}
              </div>
              <p className='text-xs font-semibold text-slate-700 dark:text-slate-300'>
                {isListening ? 'Listening for your voice...' : transcript ? “” : 'Tap a query below or speak into your microphone'}
              </p>
            </div>

            <div className='space-y-2'>
              <span className='text-[11px] font-bold text-slate-400 uppercase tracking-wider block'>Quick Voice Prompts</span>
              <div className='flex flex-wrap gap-1.5'>
                {presetQueries.map((q, idx) => (
                  <button
                    key={idx}
                    type='button'
                    onClick={() => handleSelectQuery(q)}
                    className='text-left text-xs bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition'
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
