'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Smartphone, Monitor, Tablet, MapPin, Clock, LogOut } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime } from '@/lib/utils'

interface Session {
  sessionId: string
  deviceInfo: {
    deviceType: string
    browser: string
    os: string
    userAgent: string
    ipAddress: string
  }
  lastActivity: string
  createdAt: string
  location?: {
    country?: string
    city?: string
  }
  loginMethod: string
}

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const { logoutAll } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await api.get('/auth/sessions')
      setSessions(response.data.sessions)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      toast({
        title: 'Error',
        description: 'Failed to load active sessions',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogoutAll = async () => {
    try {
      await logoutAll()
      toast({
        title: 'Success',
        description: 'Logged out from all devices successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout from all devices',
        variant: 'destructive'
      })
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getDeviceTypeColor = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return 'bg-blue-100 text-blue-800'
      case 'tablet':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Loading your active sessions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>
              Manage your active login sessions across different devices
            </CardDescription>
          </div>
          {sessions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutAll}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active sessions found</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <div
                key={session.sessionId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getDeviceIcon(session.deviceInfo.deviceType)}
                    <Badge className={getDeviceTypeColor(session.deviceInfo.deviceType)}>
                      {session.deviceInfo.deviceType}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {session.deviceInfo.browser} on {session.deviceInfo.os}
                      </span>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Last active: {formatDateTime(session.lastActivity)}</span>
                      </div>
                      
                      {session.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {session.location.city}, {session.location.country}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <span>IP: {session.deviceInfo.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge variant="outline" className="mb-2">
                    {session.loginMethod}
                  </Badge>
                  <div className="text-xs text-gray-500">
                    Started: {formatDateTime(session.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}