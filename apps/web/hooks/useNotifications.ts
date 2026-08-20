import { useState, useEffect } from 'react'
import { Notification } from '@/types'
import axios from 'axios'
import { getToken } from '@/lib/auth'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const token = getToken()
      if (!token) return
      
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(res.data)
    } catch (error) {
      console.error('Failed to fetch notifications', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (id: string) => {
    try {
      const token = getToken()
      await axios.post(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark notification as read', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return {
    notifications,
    unreadCount,
    markAsRead,
    isLoading
  }
}
