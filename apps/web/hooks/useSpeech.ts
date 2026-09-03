'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export function useSpeech() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recog = new SpeechRecognition()
        recog.continuous = false // Better stability for single phrases
        recog.interimResults = true
        recog.lang = 'en-US'
        recognitionRef.current = recog
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const startListening = useCallback((onResult: (text: string, isFinal: boolean) => void) => {
    if (!recognitionRef.current) {
      alert("Your browser does not support Speech Recognition. Please use Google Chrome or Microsoft Edge.")
      return
    }

    let finalTranscript = ''

    recognitionRef.current.onstart = () => {
      console.log('🎤 Microphone is active and listening...')
      setIsListening(true)
    }

    recognitionRef.current.onspeechstart = () => {
      console.log('🗣️ Speech detected!')
    }

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' '
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }
      const combined = (finalTranscript + interimTranscript).trim()
      console.log('📝 Transcript updated:', combined)
      onResult(combined, false)
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        alert("Microphone access was denied! Please click the lock icon in your browser's address bar and allow microphone access.")
      }
      setIsListening(false)
    }

    recognitionRef.current.onend = () => {
      console.log('🛑 Microphone stopped listening.')
      setIsListening(false)
    }

    try {
      recognitionRef.current.start()
    } catch (e) {
      console.error('❌ Speech recognition error on start:', e)
      setIsListening(false)
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
    setIsListening(false)
  }, [])

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === 'undefined') return

    const win = window as Window & typeof globalThis

    // cancel any ongoing speech
    win.speechSynthesis.cancel()

    // strip markdown and extra symbols for cleaner speech
    const cleanText = text.replace(/[*#_\[\]()]/g, '').trim()
    if (!cleanText) return

    const utterance = new SpeechSynthesisUtterance(cleanText)

    // Attempt to find a natural sounding English female voice
    const voices = win.speechSynthesis.getVoices()
    const preferredVoices = voices.filter(v =>
      v.lang.startsWith('en') &&
      (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google UK English Female') || v.name.includes('Zira'))
    )

    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0]
    }

    utterance.rate = 1.05
    utterance.pitch = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    win.speechSynthesis.speak(utterance)
  }, [voiceEnabled])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return {
    isListening,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSpeaking,
    voiceEnabled,
    setVoiceEnabled
  }
}
