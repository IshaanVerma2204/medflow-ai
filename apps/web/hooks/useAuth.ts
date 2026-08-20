import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiService } from '@/lib/api'
import { saveToken, removeToken, getToken } from '@/lib/auth'
import { User } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      if (getToken()) {
        try {
          const userData = await apiService.auth.me()
          setUser(userData)
        } catch (error) {
          removeToken()
        }
      }
      setIsLoading(false)
    }
    fetchUser()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { access_token } = await apiService.auth.login(email, password)
      saveToken(access_token)
      const userData = await apiService.auth.me()
      setUser(userData)
      return userData
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: any) => {
    setIsLoading(true)
    try {
      const userData = await apiService.auth.register(data)
      return userData
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    removeToken()
    setUser(null)
    router.push('/login')
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register
  }
}
