"use client"

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import api from '@/services/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Bell, CheckCircle, Trash2, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Notification {
  id: string
  recipientId: string
  recipientEmail: string
  title: string
  message: string
  isRead: boolean
  status: string
  createdAt: number
}

export default function NotificationsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (user?.id) {
      fetchNotifications()
    }
  }, [isAuthenticated, user?.id, filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      if (!user?.id) return

      let res
      if (filter === 'unread') {
        res = await api.get(`/notifications/user/${user.id}/unread`)
      } else {
        res = await api.get(`/notifications/user/${user.id}`)
      }
      setNotifications(res.data)
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ))
      toast.success('Marked as read')
    } catch (err: any) {
      toast.error('Failed to update notification')
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`)
      setNotifications(notifications.filter(n => n.id !== notificationId))
      toast.success('Notification deleted')
    } catch (err: any) {
      toast.error('Failed to delete notification')
    }
  }

  if (!isAuthenticated) return null

  const filteredNotifications = filter === 'read' 
    ? notifications.filter(n => n.isRead)
    : notifications.filter(n => !n.isRead)

  const displayNotifications = filter === 'all' ? notifications : filteredNotifications

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'read'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Read
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-slate-500">Loading notifications...</p>
          </div>
        ) : displayNotifications.length > 0 ? (
          <div className="space-y-3">
            {displayNotifications.map(notification => (
              <Card 
                key={notification.id} 
                className={`border ${
                  notification.isRead 
                    ? 'border-slate-200 bg-white' 
                    : 'border-blue-200 bg-blue-50'
                } shadow-sm hover:shadow-md transition-shadow`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                      notification.status === 'SENT' 
                        ? 'bg-green-100'
                        : notification.status === 'FAILED'
                        ? 'bg-red-100'
                        : 'bg-yellow-100'
                    }`}>
                      <Bell className={`h-5 w-5 ${
                        notification.status === 'SENT'
                          ? 'text-green-600'
                          : notification.status === 'FAILED'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className={`font-semibold ${
                          notification.isRead 
                            ? 'text-slate-600' 
                            : 'text-slate-900'
                        }`}>
                          {notification.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          notification.status === 'SENT'
                            ? 'bg-green-100 text-green-700'
                            : notification.status === 'FAILED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {notification.status}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        notification.isRead 
                          ? 'text-slate-500' 
                          : 'text-slate-700'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle className="h-5 w-5 text-slate-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="h-5 w-5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-slate-200 bg-white shadow-sm text-center py-12">
            <div className="flex justify-center mb-4">
              <Bell className="h-12 w-12 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-lg">No notifications yet</p>
            <p className="text-sm text-slate-400 mt-1">
              {filter === 'unread' 
                ? 'You are all caught up!' 
                : 'When you receive notifications, they will appear here'}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}