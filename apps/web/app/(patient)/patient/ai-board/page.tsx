'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Users, Activity, ShieldAlert, HeartPulse, BrainCircuit, Pill, CheckCircle2 } from 'lucide-react'

// Define the AI Agent Personas
const AGENTS = {
  coordinator: {
    id: 'coordinator',
    name: 'System Orchestrator',
    role: 'Case Manager',
    icon: BrainCircuit,
    color: 'bg-slate-500 text-white',
  },
  endo: {
    id: 'endo',
    name: 'Dr. Lovelace (AI)',
    role: 'Endocrinology Agent',
    icon: Activity,
    color: 'bg-amber-500 text-white',
  },
  cardio: {
    id: 'cardio',
    name: 'Dr. Turing (AI)',
    role: 'Cardiology Agent',
    icon: HeartPulse,
    color: 'bg-rose-500 text-white',
  },
  pharma: {
    id: 'pharma',
    name: 'Dr. Hopper (AI)',
    role: 'Pharmacology Agent',
    icon: Pill,
    color: 'bg-indigo-500 text-white',
  }
}

// Hardcoded Script for the portfolio demo based on the Metformin Database Discrepancy
const SCRIPT = [
  {
    agentId: 'coordinator',
    text: 'Initiating Multi-Agent Case Review for patient Alex Thompson (ID: #4092). Trigger: Detected conflicting medication dosages across recent documents.',
    delay: 1500
  },
  {
    agentId: 'endo',
    text: 'I have reviewed the patient\'s recent lab results. His HbA1c is 7.2%, which is dangerously elevated. However, I noticed a severe discrepancy in his chart. His clinic notes state he is taking Metformin 1000mg twice daily, but the hospital discharge PDF from last week lists Metformin 500mg.',
    delay: 3500
  },
  {
    agentId: 'cardio',
    text: 'Adding to that, his Blood Pressure is currently 138/88 mmHg. He is on Lisinopril 10mg. Given the hypertension and diabetes comorbidity, tight glycemic control is absolutely critical to prevent renal strain.',
    delay: 3000
  },
  {
    agentId: 'endo',
    text: 'Exactly. The 500mg hospital dosage is likely a transcription error upon admission that was carried over to discharge. We need to restore the 1000mg baseline immediately to bring the HbA1c down.',
    delay: 3500
  },
  {
    agentId: 'pharma',
    text: 'Hold on. I have run a clash check on the proposed intervention. Lisinopril and Metformin 1000mg are generally safe together, but given his slight renal strain indicators, increasing the Metformin dosage back to 1000mg carries a minor risk of lactic acidosis. We must verify his eGFR (kidney function) before approving the dose increase.',
    delay: 4500
  },
  {
    agentId: 'cardio',
    text: 'Dr. Hopper makes a valid safety point. I recommend we order a Comprehensive Metabolic Panel (CMP) stat to check the eGFR.',
    delay: 2500
  },
  {
    agentId: 'endo',
    text: 'Agreed. I am updating the case plan: Flagging the 500mg dosage as a transcription error, pending restoration to 1000mg upon clearance of the CMP results.',
    delay: 3000
  },
  {
    agentId: 'coordinator',
    text: 'Consensus reached. Generating clinical recommendations and scheduling CMP lab order. Awaiting human physician final sign-off.',
    delay: 2000
  }
]

export default function AIBoardPage() {
  const [messages, setMessages] = useState<typeof SCRIPT>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [activeAgent, setActiveAgent] = useState<string | null>(null)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  // Orchestrate the chat sequence
  useEffect(() => {
    if (currentIndex >= SCRIPT.length) {
      setIsTyping(false)
      setActiveAgent(null)
      return
    }

    const nextMsg = SCRIPT[currentIndex]
    
    // Start typing
    setActiveAgent(nextMsg.agentId)
    setIsTyping(true)

    // Wait for the delay, then post message
    const timer = setTimeout(() => {
      setMessages(prev => [...prev, nextMsg])
      setCurrentIndex(prev => prev + 1)
    }, nextMsg.delay)

    return () => clearTimeout(timer)
  }, [currentIndex])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col max-w-5xl mx-auto animate-page-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" /> AI Medical Board
          </h1>
          <p className="text-muted-foreground mt-1">Autonomous multi-agent clinical case review and debate.</p>
        </div>
        
        {currentIndex >= SCRIPT.length && (
          <Badge className="bg-emerald-500 flex items-center gap-1.5 px-3 py-1 text-sm">
            <CheckCircle2 className="h-4 w-4" /> Consensus Reached
          </Badge>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left: Chat Interface */}
        <Card className="flex-[2] flex flex-col border-0 shadow-lg bg-card/60 backdrop-blur-sm overflow-hidden relative">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          
          <CardHeader className="border-b bg-background/50 relative z-10">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" /> Case #4092: Medication Discrepancy
            </CardTitle>
            <CardDescription>Patient: Alex Thompson (DOB: 1978-05-12)</CardDescription>
          </CardHeader>

          <CardContent 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 scroll-smooth"
          >
            {messages.map((msg, idx) => {
              const agent = AGENTS[msg.agentId as keyof typeof AGENTS]
              const isSystem = msg.agentId === 'coordinator'

              return (
                <div key={idx} className={cn("flex gap-4 animate-bubble-left", isSystem && "justify-center")}>
                  {!isSystem && (
                    <div className={cn("h-10 w-10 shrink-0 rounded-full flex items-center justify-center shadow-md", agent.color)}>
                      {React.createElement(agent.icon, { className: 'h-5 w-5' })}
                    </div>
                  )}
                  
                  <div className={cn(
                    "flex flex-col",
                    isSystem ? "items-center max-w-[80%]" : "max-w-[85%]"
                  )}>
                    {!isSystem && (
                      <div className="flex items-baseline gap-2 mb-1.5">
                        <span className="font-semibold text-sm">{agent.name}</span>
                        <span className="text-xs text-muted-foreground">{agent.role}</span>
                      </div>
                    )}
                    
                    <div className={cn(
                      "p-4 shadow-sm text-sm leading-relaxed",
                      isSystem 
                        ? "bg-slate-500/10 border border-slate-500/20 text-slate-500 dark:text-slate-400 rounded-xl text-center italic" 
                        : "bg-background border rounded-2xl rounded-tl-sm"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Typing Indicator */}
            {isTyping && activeAgent && (
              <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeAgent !== 'coordinator' && (
                  <div className={cn("h-10 w-10 shrink-0 rounded-full flex items-center justify-center shadow-md", AGENTS[activeAgent as keyof typeof AGENTS].color)}>
                    {React.createElement(AGENTS[activeAgent as keyof typeof AGENTS].icon, { className: 'h-5 w-5' })}
                  </div>
                )}
                <div className="flex flex-col justify-center">
                  {!activeAgent.includes('coordinator') && (
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="font-semibold text-sm">{AGENTS[activeAgent as keyof typeof AGENTS].name}</span>
                      <span className="text-xs text-muted-foreground">is analyzing...</span>
                    </div>
                  )}
                  <div className={cn(
                    "px-4 py-3 border rounded-2xl rounded-tl-sm w-fit flex items-center gap-1",
                    activeAgent === 'coordinator' ? "bg-slate-500/10 border-slate-500/20" : "bg-background"
                  )}>
                    <div className="h-2 w-2 bg-primary/60 rounded-full dot-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-primary/60 rounded-full dot-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-primary/60 rounded-full dot-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Active Agents Panel */}
        <Card className="flex-[1] flex flex-col border-0 shadow-lg bg-card/60 backdrop-blur-sm overflow-hidden h-fit">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Board Members</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {Object.values(AGENTS).map(agent => {
              if (agent.id === 'coordinator') return null; // Hide orchestrator from the member list
              
              const isCurrentlySpeaking = activeAgent === agent.id;
              
              return (
                <div 
                  key={agent.id} 
                  className={cn(
                    "flex items-center gap-3 p-4 border-b last:border-b-0 transition-colors",
                    isCurrentlySpeaking ? "bg-primary/5" : ""
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-all",
                    agent.color,
                    isCurrentlySpeaking ? "shadow-[0_0_15px_rgba(var(--primary),0.5)] scale-110" : ""
                  )}>
                    {React.createElement(agent.icon, { className: 'h-5 w-5' })}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                  
                  {isCurrentlySpeaking && (
                    <div className="ml-auto">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
