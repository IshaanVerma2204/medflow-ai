'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { parseJwtRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HeartPulse, CheckCircle2 } from 'lucide-react'
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
      toast.success('Logged in successfully')
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
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div>
          <div className="flex items-center gap-3 text-2xl font-bold">
            <HeartPulse className="h-8 w-8" />
            MedFlow AI
          </div>
          <h1 className="mt-12 text-4xl font-bold leading-tight">
            Your intelligent healthcare<br />workflow assistant
          </h1>
          <p className="mt-6 text-lg text-primary-foreground/80">
            Streamline patient care with AI-powered insights, automated document processing, and organized medical records.
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
            <span className="text-lg">Organized Medical Records</span>
          </div>
          <div className="flex items-center gap-4">
            <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
            <span className="text-lg">AI-Powered Insights</span>
          </div>
          <div className="flex items-center gap-4">
            <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
            <span className="text-lg">Secure & Private</span>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full flex-col justify-center p-8 lg:w-1/2 lg:p-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-2 text-2xl font-bold text-primary">
              <HeartPulse className="h-8 w-8" />
              MedFlow AI
            </div>
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please enter your details to sign in.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>

          <p className="mt-12 text-center text-xs text-muted-foreground">
            MedFlow AI provides information and workflow assistance.<br />
            It does not replace professional medical judgment.
          </p>
        </div>
      </div>
    </div>
  )
}
