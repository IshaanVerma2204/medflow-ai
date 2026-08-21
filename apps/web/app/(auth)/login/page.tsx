'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HeartPulse, CheckCircle2, ArrowRight, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const user = await login(email, password)
      toast.success('Welcome back!')
      if (user.role === 'clinician') {
        router.push('/clinician/dashboard')
      } else if (user.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/patient/dashboard')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to login. Please check your credentials.')
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-primary via-sky-500 to-blue-700 p-12 text-white lg:flex relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 -left-16 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-1/4 -right-16 h-80 w-80 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-2xl font-bold">
            <HeartPulse className="h-8 w-8 animate-heartbeat" />
            MedFlow AI
          </div>
          <h1 className="mt-12 text-4xl font-bold leading-tight">
            Your intelligent<br />healthcare assistant
          </h1>
          <p className="mt-4 text-lg text-white/80 leading-relaxed">
            Streamline patient care with AI-powered insights, automated document processing, and organized medical records.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            'Organized Medical Records',
            'AI-Powered Insights',
            'Secure & HIPAA Compliant',
          ].map((feature, i) => (
            <div
              key={feature}
              className="flex items-center gap-3 animate-card-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-base font-medium">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2 lg:p-16">
        <div className="w-full max-w-sm space-y-8 animate-page-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 text-2xl font-bold text-primary lg:hidden">
            <HeartPulse className="h-7 w-7 animate-heartbeat" />
            MedFlow AI
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">Sign in to your MedFlow account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-xl transition-shadow duration-200 focus-visible:ring-primary/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 rounded-xl transition-shadow duration-200 focus-visible:ring-primary/50"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl h-11 font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.01] group"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline underline-offset-4 transition-colors">
              Sign up
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground/70 leading-relaxed">
            MedFlow AI provides information and workflow assistance.<br />
            It does not replace professional medical judgment.
          </p>
        </div>
      </div>
    </div>
  )
}
