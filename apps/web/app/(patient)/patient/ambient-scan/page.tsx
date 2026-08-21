'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Activity, Heart, Wind, Zap, ScanFace, Lock, AlertCircle, RefreshCw } from 'lucide-react'

export default function AmbientScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [permissionError, setPermissionError] = useState(false)
  const [scanState, setScanState] = useState<'initializing' | 'scanning' | 'locked'>('initializing')
  const [metrics, setMetrics] = useState({ hr: 0, rr: 0, hrv: 0, stress: 'Low' })

  // Initialize webcam
  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 } })
      .then((mediaStream) => {
        if (!mounted) return;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        // Start scanning sequence
        setTimeout(() => setScanState('scanning'), 1500)
        setTimeout(() => setScanState('locked'), 5000)
      })
      .catch((err) => {
        console.error("Camera access denied", err);
        if (mounted) setPermissionError(true);
      })

    return () => {
      mounted = false;
      if (stream) stream.getTracks().forEach(track => track.stop());
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Simulate live vital fluctuations when locked
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scanState === 'locked') {
      const startTime = Date.now();
      
      interval = setInterval(() => {
        const t = (Date.now() - startTime) / 1000; // time in seconds
        
        // Biological Simulation: Respiratory Sinus Arrhythmia (RSA)
        // Heart rate naturally speeds up on inhale and slows on exhale.
        // Assuming ~14 breaths per minute, a breath cycle is ~4.2 seconds.
        const breathCycle = Math.sin(t * (2 * Math.PI / 4.2));
        const baselineHR = 72;
        const simulatedHR = Math.round(baselineHR + (breathCycle * 3.5) + (Math.random() * 0.8));
        
        // Respiratory rate drifts very slowly
        const simulatedRR = Math.round(14 + (Math.sin(t / 10) * 0.8));
        
        // HRV naturally fluctuates with breathing and stress
        const simulatedHRV = Math.round(65 + (Math.sin(t / 5) * 4) + (Math.random() * 2));
        
        setMetrics({
          hr: simulatedHR,
          rr: simulatedRR,
          hrv: simulatedHRV,
          stress: simulatedHR > 78 ? 'Elevated' : 'Optimal'
        })
      }, 800)
    }
    return () => clearInterval(interval)
  }, [scanState])

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6 max-w-5xl mx-auto animate-page-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ScanFace className="h-8 w-8 text-primary" /> Ambient Vitals
          </h1>
          <p className="text-muted-foreground mt-1">Computer vision extraction of physiological biomarkers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={scanState === 'locked' ? 'default' : 'secondary'} className={cn("px-3 py-1", scanState === 'scanning' && "animate-pulse")}>
            {scanState === 'initializing' && "Initializing Engine..."}
            {scanState === 'scanning' && "Scanning Micro-Tremors..."}
            {scanState === 'locked' && "Biometrics Locked"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left: The "Scanner" */}
        <Card className="flex-[2] overflow-hidden relative border-0 shadow-2xl bg-black flex items-center justify-center rounded-2xl ring-1 ring-white/10">
          
          {permissionError ? (
            <div className="flex flex-col items-center justify-center text-center p-8 text-destructive">
              <AlertCircle className="h-16 w-16 mb-4 opacity-80" />
              <h2 className="text-xl font-bold">Camera Access Denied</h2>
              <p className="text-sm opacity-80 mt-2 max-w-sm">
                Please allow camera access in your browser to use the Ambient Vitals scanner. We process everything locally in the browser.
              </p>
            </div>
          ) : (
            <>
              {/* Webcam Feed */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={cn(
                  "absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-all duration-1000",
                  scanState === 'initializing' ? 'opacity-0 blur-xl' : 'opacity-100',
                  scanState === 'scanning' ? 'blur-[2px] grayscale-[50%]' : 'blur-0 grayscale-0'
                )}
              />

              {/* Sci-Fi Overlays */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]" />
                
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] [transform:perspective(500px)_rotateX(60deg)] opacity-50 origin-bottom" />

                {/* Face Targeting Brackets (Only visible when scanning/locked) */}
                {(scanState === 'scanning' || scanState === 'locked') && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[300px]">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 transition-all duration-300" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 transition-all duration-300" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 transition-all duration-300" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400 transition-all duration-300" />
                    
                    {/* Scanning Laser Line */}
                    {scanState === 'scanning' && (
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400/80 shadow-[0_0_15px_rgba(34,211,238,1)] animate-[scan_2s_ease-in-out_infinite]" />
                    )}
                    
                    {/* Lock Indicator */}
                    {scanState === 'locked' && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs font-bold text-cyan-400 bg-cyan-950/50 px-3 py-1 rounded-full border border-cyan-400/30 backdrop-blur-sm animate-pulse">
                        <Lock className="h-3 w-3" /> TRACKING
                      </div>
                    )}
                  </div>
                )}

                {/* Live Data Overlay HUD */}
                {scanState === 'locked' && (
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-lg p-3 text-cyan-400 w-48 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4" /> <span className="text-xs font-bold tracking-widest uppercase">rPPG Signal</span>
                      </div>
                      <div className="h-8 w-full flex items-end gap-1 opacity-70">
                        {/* Fake ECG waveform bars */}
                        {[...Array(20)].map((_, i) => (
                          <div 
                            key={i} 
                            className="w-1.5 bg-cyan-400 rounded-t-sm"
                            style={{ 
                              height: `${Math.random() * 100}%`,
                              transition: 'height 0.2s ease'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>

        {/* Right: Metrics Panel */}
        <Card className="flex-[1] flex flex-col border-0 shadow-lg bg-card/60 backdrop-blur-sm overflow-hidden">
          <div className="p-6 border-b bg-muted/30">
            <h2 className="text-xl font-bold tracking-tight">Live Biomarkers</h2>
            <p className="text-xs text-muted-foreground mt-1">Extracted via remote photoplethysmography.</p>
          </div>
          
          <CardContent className="p-6 flex-1 flex flex-col justify-center space-y-6">
            
            {scanState !== 'locked' ? (
              <div className="flex flex-col items-center justify-center text-center opacity-50 py-12">
                <RefreshCw className="h-8 w-8 mb-4 animate-spin" />
                <p className="text-sm font-medium">Calibrating extraction model...</p>
                <p className="text-xs mt-2 max-w-[200px]">Keep your face within the frame and hold relatively still.</p>
              </div>
            ) : (
              <>
                {/* Heart Rate */}
                <div className="flex items-center justify-between p-4 rounded-xl border bg-background/50 relative overflow-hidden group">
                  <div className="absolute left-0 top-0 w-1 h-full bg-rose-500" />
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-500/10 rounded-lg text-rose-500">
                      <Heart className="h-6 w-6 animate-pulse" style={{ animationDuration: `${60/metrics.hr}s` }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">{metrics.hr}</span>
                        <span className="text-xs font-bold text-muted-foreground">BPM</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Respiratory Rate */}
                <div className="flex items-center justify-between p-4 rounded-xl border bg-background/50 relative overflow-hidden group">
                  <div className="absolute left-0 top-0 w-1 h-full bg-sky-500" />
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-sky-500/10 rounded-lg text-sky-500">
                      <Wind className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Resp. Rate</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">{metrics.rr}</span>
                        <span className="text-xs font-bold text-muted-foreground">RPM</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Heart Rate Variability & Stress */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border bg-background/50 text-center">
                    <p className="text-xs font-medium text-muted-foreground mb-2">HRV (SDNN)</p>
                    <div className="text-2xl font-bold">{metrics.hrv}<span className="text-[10px] ml-1 opacity-50">ms</span></div>
                  </div>
                  <div className="p-4 rounded-xl border bg-background/50 text-center">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Stress Index</p>
                    <div className={cn(
                      "text-xl font-bold",
                      metrics.stress === 'Low' ? 'text-emerald-500' : 'text-amber-500'
                    )}>
                      {metrics.stress}
                    </div>
                  </div>
                </div>
              </>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  )
}
