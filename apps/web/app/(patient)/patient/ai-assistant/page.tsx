'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, HeartPulse, FileText, AlertTriangle, Sparkles } from 'lucide-react'
import { ChatMessage, SourceRef } from '@/types'
import { apiService } from '@/lib/api'
import { EvidenceDrawer } from '@/components/ai/EvidenceDrawer'
import { cn } from '@/lib/utils'
import { usePatientData } from '@/context/PatientDataContext'
import { useSpeech } from '@/hooks/useSpeech'
import { Volume2, VolumeX, Mic, MicOff, Square } from 'lucide-react'

const QUICK_QUESTIONS = [
  'What medications am I taking?',
  'Summarize my last visit',
  'What are my allergies?',
  'What are my diagnoses?',
  'Show my lab results',
  'Who is my doctor?',
]

export default function AIAssistantPage() {
  const { user } = useAuth()
  const { patientId } = usePatientData()
  const { isListening, startListening, stopListening, speak, stopSpeaking, isSpeaking, voiceEnabled, setVoiceEnabled } = useSpeech()
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: `Hello ${user?.full_name?.split(' ')[0] || 'there'}! I'm your MedFlow AI Assistant. I can answer questions based on your medical records and uploaded documents. What would you like to know?`
  }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeSources, setActiveSources] = useState<SourceRef[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Optional: Read the welcome message out loud on load if voice is enabled
  // useEffect(() => {
  //   speak(messages[0].content)
  // }, [speak])

  const handleSend = async (text?: string) => {
    const userMsg = (text || input).trim()
    if (!userMsg || isLoading) return

    if (isListening) stopListening()
    if (isSpeaking) stopSpeaking()

    setInput('')
    const history = messages.map(m => ({ role: m.role, content: m.content }))
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsLoading(true)

    try {
      const res = await apiService.ai.chat(userMsg, patientId ?? '', history)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.response,
        sources: res.sources,
      }])
      // Speak the AI's response
      speak(res.response)
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      stopSpeaking()
      startListening((text) => {
        setInput(text)
      })
    }
  }

  const handleSourceClick = (sources: SourceRef[]) => {
    setActiveSources(sources)
    setDrawerOpen(true)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 max-w-4xl mx-auto animate-page-in">
      {/* Disclaimer */}
      <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 p-3 rounded-xl flex items-start gap-3 text-sm border border-blue-200 dark:border-blue-900">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Responses are AI-generated from your uploaded documents.{' '}
          <strong>This does not replace professional medical judgment.</strong>
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-sm">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b px-4 py-3 bg-card">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">MedFlow AI Assistant</p>
            <p className="text-xs text-muted-foreground">Powered by your medical records</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (isSpeaking) stopSpeaking()
                setVoiceEnabled(!voiceEnabled)
              }}
              className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
              title={voiceEnabled ? "Voice Output Enabled" : "Voice Output Disabled"}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end animate-bubble-right' : 'justify-start animate-bubble-left'
                )}
                style={{ animationDelay: `${Math.min(i * 30, 200)}ms` }}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mr-2 mt-1 relative">
                    <HeartPulse className="h-3.5 w-3.5 text-primary" />
                    {isSpeaking && i === messages.length - 1 && (
                      <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 bg-primary rounded-full animate-pulse border-2 border-background" />
                    )}
                  </div>
                )}
                <div className={cn(
                  'max-w-[78%] rounded-2xl px-4 py-3 shadow-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted/80 dark:bg-muted/50 border border-border/50 rounded-bl-sm'
                )}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-semibold text-primary uppercase tracking-wide">MedFlow AI</p>
                      {isSpeaking && i === messages.length - 1 && (
                        <div className="flex gap-0.5 items-center">
                          <span className="w-1 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-3 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-border/40 flex flex-wrap gap-1.5">
                      {msg.sources.map((src, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors duration-150 text-[10px]"
                          onClick={() => handleSourceClick([src])}
                        >
                          <FileText className="h-2.5 w-2.5 mr-1" />
                          {src.document_name} {src.page ? `(Pg ${src.page})` : ''}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start animate-bubble-left">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mr-2 mt-1">
                  <HeartPulse className="h-3.5 w-3.5 text-primary animate-heartbeat" />
                </div>
                <div className="bg-muted/80 border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary/50 dot-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="p-4 border-t bg-card/80">
          {/* Quick questions */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                disabled={isLoading || isListening}
                className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent hover:border-primary/30 transition-all duration-150 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Message input */}
          <div className="flex gap-2 relative">
            <Input
              ref={inputRef}
              placeholder={isListening ? "Listening..." : "Ask about your medical records..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              className={cn(
                "flex-1 rounded-xl border-border/70 bg-background transition-all duration-200 pl-11",
                isListening ? "border-primary/50 ring-1 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.15)]" : "focus-visible:ring-primary/50"
              )}
              disabled={isLoading}
            />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleListening}
              className={cn(
                "absolute left-1 top-1 h-8 w-8 rounded-lg transition-all duration-300",
                isListening 
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive animate-pulse" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              {isListening ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
            </Button>

            <Button
              onClick={() => handleSend()}
              disabled={isLoading || (!input.trim() && !isListening)}
              size="icon"
              className={cn(
                "rounded-xl h-10 w-10 shrink-0 transition-all duration-200 disabled:scale-100",
                input.trim() ? "hover:scale-105" : ""
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <EvidenceDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sources={activeSources}
      />
    </div>
  )
}
