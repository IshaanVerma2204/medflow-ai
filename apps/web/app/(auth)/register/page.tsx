'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HeartPulse, CheckCircle2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient'
  })
  
  const { register: registerUser, isLoading } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      await registerUser({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      })
      toast.success('Registration successful! Please login.')
      router.push('/login')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to register.')
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
            Join the future of<br />healthcare management
          </h1>
          <p className="mt-6 text-lg text-primary-foreground/80">
            Create an account to start managing your health journey or assisting your patients more effectively.
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

      {/* Right side - Register Form */}
      <div className="flex w-full flex-col justify-center p-8 lg:w-1/2 lg:p-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-2 text-2xl font-bold text-primary">
              <HeartPulse className="h-8 w-8" />
              MedFlow AI
            </div>
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Create an account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your details below to create your account.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" required value={formData.full_name} onChange={handleChange} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={formData.email} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">I am a...</Label>
              <Select 
                value={formData.role} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, role: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="clinician">Healthcare Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={formData.password} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} />
              </div>
            </div>

            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
