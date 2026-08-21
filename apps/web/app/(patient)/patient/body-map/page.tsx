'use client'

import React, { useState, useMemo } from 'react'
import { usePatientData } from '@/context/PatientDataContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  HeartPulse,
  Activity,
  Brain,
  Bone,
  ArrowRight,
  Wind,
  Settings2,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

type SystemId = 'cardiovascular' | 'endocrine' | 'respiratory' | 'neurological' | 'musculoskeletal'

interface BodySystem {
  id: SystemId
  name: string
  icon: React.ElementType
  keywords: string[]
  cx: number
  cy: number
}

const SYSTEM_MAP: Record<SystemId, BodySystem> = {
  cardiovascular: {
    id: 'cardiovascular',
    name: 'Cardiovascular System',
    icon: HeartPulse,
    keywords: ['hypertension', 'blood pressure', 'lisinopril', 'heart', 'cardiac', 'cardiovascular'],
    cx: 58, cy: 85,
  },
  endocrine: {
    id: 'endocrine',
    name: 'Endocrine System',
    icon: Activity,
    keywords: ['diabetes', 'hba1c', 'glucose', 'metformin', 'thyroid', 'pancreas', 'hyperglycemia'],
    cx: 50, cy: 120,
  },
  respiratory: {
    id: 'respiratory',
    name: 'Respiratory System',
    icon: Wind,
    keywords: ['asthma', 'copd', 'lungs', 'breathing', 'oxygen', 'respiratory'],
    cx: 50, cy: 70,
  },
  neurological: {
    id: 'neurological',
    name: 'Neurological System',
    icon: Brain,
    keywords: ['migraine', 'neuropathy', 'brain', 'nerve', 'neurological', 'headache'],
    cx: 50, cy: 30,
  },
  musculoskeletal: {
    id: 'musculoskeletal',
    name: 'Musculoskeletal',
    icon: Bone,
    keywords: ['arthritis', 'fracture', 'joint', 'bone', 'muscle', 'pain'],
    cx: 41, cy: 200,
  },
}

export default function BodyMapPage() {
  const { diagnoses, medications, labResults, isLoading } = usePatientData()
  const [activeSystemId, setActiveSystemId] = useState<SystemId | null>(null)

  // Simulation States
  const [simYears, setSimYears] = useState(0)
  const [interventions, setInterventions] = useState({
    stopMeds: false,
    strictDiet: false,
    dailyExercise: false
  })

  // Digital Twin Simulation Engine
  const simulatedVitals = useMemo(() => {
    let sys = 138; let dia = 88; let a1c = 7.2;

    if (interventions.stopMeds) {
      sys += 15 + (simYears * 3);
      dia += 10 + (simYears * 2);
      a1c += 1.5 + (simYears * 0.4);
    } else {
      sys += (simYears * 1.5);
      dia += (simYears * 0.8);
      a1c += (simYears * 0.1);
    }

    if (interventions.strictDiet) {
      sys -= 8 + (simYears * 1);
      dia -= 5 + (simYears * 0.5);
      a1c -= 0.8 + (simYears * 0.15);
    }
    
    if (interventions.dailyExercise) {
      sys -= 5 + (simYears * 0.5);
      dia -= 3 + (simYears * 0.3);
      a1c -= 0.5 + (simYears * 0.1);
    }

    sys = Math.max(105, sys);
    dia = Math.max(65, dia);
    a1c = Math.max(5.2, a1c);

    return { bpSys: Math.round(sys), bpDia: Math.round(dia), hba1c: Number(a1c.toFixed(1)) }
  }, [simYears, interventions])

  const systemData = useMemo(() => {
    const isSimulating = simYears > 0 || interventions.stopMeds || interventions.strictDiet || interventions.dailyExercise;

    return Object.values(SYSTEM_MAP).map((sys) => {
      const re = new RegExp(sys.keywords.join('|'), 'i')
      let relatedDiags = diagnoses.filter(d => re.test(d.name) || re.test(d.source_text || ''))
      let relatedMeds = medications.filter(m => re.test(m.name) || re.test(m.source_text || ''))
      let relatedLabs = labResults.filter(l => re.test(l.test_name) || re.test(l.source_text || ''))

      if (isSimulating) {
        if (sys.id === 'cardiovascular') {
          relatedLabs = [
            { id: 'sim-bp', test_name: 'Blood Pressure (Projected)', value: `${simulatedVitals.bpSys}/${simulatedVitals.bpDia}`, unit: 'mmHg', reference_range: '<130/80', is_abnormal: simulatedVitals.bpSys > 140 || simulatedVitals.bpDia > 90 } as any,
            ...relatedLabs.filter(l => !l.test_name.includes('Blood Pressure'))
          ]
        }
        if (sys.id === 'endocrine') {
          relatedLabs = [
            { id: 'sim-a1c', test_name: 'HbA1c (Projected)', value: simulatedVitals.hba1c.toString(), unit: '%', reference_range: '<7.0', is_abnormal: simulatedVitals.hba1c > 7.0 } as any,
            ...relatedLabs.filter(l => !l.test_name.includes('HbA1c'))
          ]
        }
      }

      const isActive = relatedDiags.length > 0 || relatedMeds.length > 0 || relatedLabs.length > 0
      
      let severityState = 'normal';
      if (sys.id === 'cardiovascular') {
        if (simulatedVitals.bpSys > 150) severityState = 'critical'
        else if (simulatedVitals.bpSys > 135) severityState = 'warning'
        else if (simulatedVitals.bpSys < 120) severityState = 'optimal'
      } else if (sys.id === 'endocrine') {
        if (simulatedVitals.hba1c > 8.5) severityState = 'critical'
        else if (simulatedVitals.hba1c > 7.0) severityState = 'warning'
        else if (simulatedVitals.hba1c < 6.0) severityState = 'optimal'
      } else {
        severityState = relatedLabs.some(l => l.is_abnormal) ? 'warning' : 'normal'
      }

      const styles = {
        normal: { bg: 'bg-slate-500', color: 'text-slate-500', glow: 'shadow-[0_0_15px_rgba(100,116,139,0.5)]' },
        warning: { bg: 'bg-amber-500', color: 'text-amber-500', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.6)]' },
        critical: { bg: 'bg-red-600', color: 'text-red-600', glow: 'shadow-[0_0_25px_rgba(220,38,38,0.8)]' },
        optimal: { bg: 'bg-emerald-500', color: 'text-emerald-500', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.6)]' }
      }[isActive ? severityState : 'normal']

      return { ...sys, relatedDiags, relatedMeds, relatedLabs, isActive, severityState, ...styles }
    })
  }, [diagnoses, medications, labResults, simYears, interventions, simulatedVitals])

  const activeSystem = systemData.find(s => s.id === activeSystemId) ?? systemData.find(s => s.isActive) ?? null

  const toggleIntervention = (key: keyof typeof interventions) => setInterventions(prev => ({ ...prev, [key]: !prev[key] }))

  if (isLoading) return <div className="flex h-[calc(100vh-8rem)] items-center justify-center"><div className="text-muted-foreground animate-pulse">Loading body map…</div></div>

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6 max-w-6xl mx-auto animate-page-in">
      
      {/* ── Top Section: Body & Details ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left: Silhouette */}
        <Card className="flex-1 overflow-hidden relative border-0 shadow-lg bg-slate-900/5 dark:bg-slate-950/40 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          
          <div className="relative w-full max-w-[180px]" style={{ aspectRatio: '100/250' }}>
            {/* Sleek Ultra-Modern Abstract Human Geometry */}
            <svg viewBox="0 0 100 250" className="w-full h-full text-slate-400/40 dark:text-slate-600/50 drop-shadow-lg transition-all duration-700">
              {/* Head */}
              <circle cx="50" cy="30" r="16" fill="currentColor" opacity="0.9"/>
              {/* Torso */}
              <rect x="32" y="55" width="36" height="95" rx="18" fill="currentColor" opacity="0.75"/>
              {/* Left Arm */}
              <rect x="12" y="60" width="14" height="75" rx="7" fill="currentColor" opacity="0.5"/>
              {/* Right Arm */}
              <rect x="74" y="60" width="14" height="75" rx="7" fill="currentColor" opacity="0.5"/>
              {/* Left Leg */}
              <rect x="34" y="160" width="14" height="85" rx="7" fill="currentColor" opacity="0.5"/>
              {/* Right Leg */}
              <rect x="52" y="160" width="14" height="85" rx="7" fill="currentColor" opacity="0.5"/>
            </svg>

            {systemData.map((sys) => {
              const Icon = sys.icon
              const isSelected = activeSystemId === sys.id
              const isDimmed = activeSystemId !== null && !isSelected

              return (
                <button
                  key={sys.id}
                  onClick={() => setActiveSystemId(prev => prev === sys.id ? null : sys.id)}
                  className={cn(
                    'absolute flex items-center justify-center transition-all duration-500 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer',
                    sys.isActive ? 'scale-100 hover:scale-125' : 'scale-75 opacity-40 hover:opacity-100 hover:scale-100',
                    isDimmed && 'opacity-20 blur-[1px]',
                    sys.severityState === 'critical' && 'scale-110 z-20'
                  )}
                  style={{ left: `${(sys.cx / 100) * 100}%`, top: `${(sys.cy / 250) * 100}%` }}
                >
                  {sys.isActive && (
                    <span className={cn(
                      'absolute inset-0 rounded-full opacity-40 transition-colors duration-1000', 
                      sys.bg,
                      (sys.severityState === 'warning' || sys.severityState === 'critical') && 'animate-ping'
                    )} />
                  )}
                  <span className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-background shadow-lg transition-colors duration-1000',
                    sys.isActive ? sys.bg : 'bg-slate-400 dark:bg-slate-600',
                    sys.isActive && sys.glow,
                    sys.severityState === 'critical' && 'animate-pulse scale-110'
                  )}>
                    <Icon className="h-4 w-4 text-white" />
                  </span>
                </button>
              )
            })}
          </div>
          <div className="absolute left-0 w-full h-[2px] bg-primary/30 shadow-[0_0_12px_rgba(var(--primary),0.5)] animate-scan pointer-events-none" />
        </Card>

        {/* Right: Details Panel */}
        <Card className="flex-[1.5] flex flex-col border-0 shadow-lg bg-card/60 backdrop-blur-sm overflow-hidden">
          {activeSystem ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b flex items-start gap-4">
                <div className={cn('p-3 rounded-2xl text-white transition-colors duration-1000', activeSystem.bg, activeSystem.glow)}>
                  {React.createElement(activeSystem.icon, { className: 'h-6 w-6' })}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold tracking-tight">{activeSystem.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {activeSystem.severityState === 'optimal' && <Badge className="bg-emerald-500 hover:bg-emerald-600">Optimal Health</Badge>}
                    {activeSystem.severityState === 'normal' && <Badge variant="secondary">Active Monitoring</Badge>}
                    {activeSystem.severityState === 'warning' && <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600">Warning</Badge>}
                    {activeSystem.severityState === 'critical' && <Badge variant="destructive" className="animate-pulse">Critical Alert</Badge>}
                  </div>
                </div>
              </div>

              <CardContent className="p-6 flex-1 overflow-y-auto space-y-6">
                {!activeSystem.isActive ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm text-center">
                    {React.createElement(activeSystem.icon, { className: 'h-10 w-10 opacity-20 mb-3' })}
                    <p>No active conditions for this system.</p>
                  </div>
                ) : (
                  <>
                    {activeSystem.relatedLabs.length > 0 && (
                      <section className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <Activity className="h-3 w-3" /> Lab Results & Projections
                        </h3>
                        {activeSystem.relatedLabs.map((l: any) => {
                          const isSimulated = l.test_name.includes('Projected');
                          return (
                            <div key={l.id} className={cn(
                              'p-3 rounded-lg border flex justify-between items-center transition-all duration-1000',
                              l.is_abnormal ? 'border-destructive/50 bg-destructive/5' : 'bg-background/50',
                              isSimulated && 'ring-1 ring-primary/30 border-primary/30 shadow-[inset_0_0_10px_rgba(var(--primary),0.1)]'
                            )}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{l.test_name}</span>
                                {isSimulated && <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary text-primary animate-pulse">SIMULATED</Badge>}
                              </div>
                              <div className="text-right">
                                <p className={cn('font-bold text-sm transition-colors', l.is_abnormal ? 'text-destructive' : (isSimulated ? 'text-primary' : ''))}>
                                  {l.value} {l.unit}
                                </p>
                                <p className="text-[10px] text-muted-foreground">Ref: {l.reference_range}</p>
                              </div>
                            </div>
                          )
                        })}
                      </section>
                    )}

                    {activeSystem.relatedMeds.length > 0 && (
                      <section className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <Settings2 className="h-3 w-3" /> Interventions
                        </h3>
                        {activeSystem.relatedMeds.map((m: any) => (
                          <div key={m.id} className={cn(
                            "p-3 rounded-lg border transition-all duration-500",
                            interventions.stopMeds ? "bg-muted/50 opacity-50 line-through" : "bg-background/50"
                          )}>
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-sm">{m.name}</span>
                              <span className="text-xs text-muted-foreground">{m.dosage}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{m.frequency}</p>
                          </div>
                        ))}
                      </section>
                    )}
                  </>
                )}
              </CardContent>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
              <ArrowRight className="h-12 w-12 opacity-20 mb-4 hidden md:block rotate-180" />
              <h3 className="text-lg font-medium mb-2">Select a Node</h3>
              <p className="text-sm">Explore real and simulated data.</p>
            </div>
          )}
        </Card>
      </div>

      {/* ── Bottom Section: Digital Twin Simulation Engine ───────────────────────────────── */}
      <Card className="border-primary/20 shadow-lg bg-card/80 backdrop-blur-md overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-purple-600" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            
            {/* Time Slider */}
            <div className="flex-1 w-full">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" /> Digital Twin Simulator
                  </h3>
                  <p className="text-xs text-muted-foreground">Predictive physiological modeling based on clinical trajectories.</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-primary">
                    {simYears === 0 ? "Present Day" : `+${simYears} Years`}
                  </div>
                  <div className="text-xs text-muted-foreground">Projected Date: {new Date().getFullYear() + simYears}</div>
                </div>
              </div>
              
              <div className="relative pt-2">
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="1"
                  value={simYears}
                  onChange={(e) => setSimYears(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium">
                  <span>Now</span>
                  <span>5 Yrs</span>
                  <span>10 Yrs</span>
                </div>
              </div>
            </div>

            {/* Interventions */}
            <div className="w-full md:w-auto flex flex-col gap-2 border-l border-border pl-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Simulate Interventions</span>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => toggleIntervention('strictDiet')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all",
                    interventions.strictDiet ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400" : "bg-background hover:bg-muted"
                  )}
                >
                  <TrendingDown className="h-3 w-3" /> Strict Diet
                </button>
                <button 
                  onClick={() => toggleIntervention('dailyExercise')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all",
                    interventions.dailyExercise ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400" : "bg-background hover:bg-muted"
                  )}
                >
                  <Activity className="h-3 w-3" /> Daily Exercise
                </button>
                <button 
                  onClick={() => toggleIntervention('stopMeds')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all",
                    interventions.stopMeds ? "bg-destructive/10 border-destructive/50 text-destructive" : "bg-background hover:bg-muted"
                  )}
                >
                  <AlertTriangle className="h-3 w-3" /> Discontinue Meds
                </button>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
      
    </div>
  )
}
