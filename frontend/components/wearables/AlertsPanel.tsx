'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  AlertTriangle, 
  Heart, 
  Activity,
  Battery,
  Phone,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Thermometer,
  Droplets
} from 'lucide-react'

interface AlertsPanelProps {
  alerts: any[]
  onRefresh: () => void
}

export default function AlertsPanel({ alerts, onRefresh }: AlertsPanelProps) {
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolving, setResolving] = useState(false)
  const [filter, setFilter] = useState('all')

  const handleResolveAlert = async () => {
    if (!selectedAlert) return

    setResolving(true)
    try {
      const { familyAPI } = await import('@/lib/api')
      await familyAPI.resolveAlert(selectedAlert._id, {
        resolutionNotes
      })
      
      setShowResolveModal(false)
      setSelectedAlert(null)
      setResolutionNotes('')
      onRefresh()
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    } finally {
      setResolving(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'critical':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'high':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'heart_rate_high':
      case 'heart_rate_low':
        return <Heart className="w-5 h-5 text-red-600" />
      case 'blood_pressure_high':
      case 'blood_pressure_low':
        return <Droplets className="w-5 h-5 text-blue-600" />
      case 'fall_detection':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case 'emergency_button':
        return <Phone className="w-5 h-5 text-red-600" />
      case 'battery_low':
        return <Battery className="w-5 h-5 text-yellow-600" />
      case 'temperature_abnormal':
        return <Thermometer className="w-5 h-5 text-orange-600" />
      case 'inactivity':
        return <Activity className="w-5 h-5 text-purple-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const alertTime = new Date(timestamp)
    const diffMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return `${Math.floor(diffMinutes / 1440)}d ago`
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    if (filter === 'active') return !alert.isResolved
    if (filter === 'resolved') return alert.isResolved
    return alert.severity === filter
  })

  if (alerts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Health Alerts
        </h3>
        <p className="text-gray-600">
          All family members are healthy. Alerts will appear here when health thresholds are exceeded.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Health Alerts</h2>
        
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'emergency', label: 'Emergency' },
            { key: 'critical', label: 'Critical' },
            { key: 'resolved', label: 'Resolved' }
          ].map((filterOption) => (
            <Button
              key={filterOption.key}
              variant={filter === filterOption.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterOption.key)}
            >
              {filterOption.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <Card 
            key={alert._id} 
            className={`p-6 ${alert.severity === 'emergency' ? 'border-red-300 bg-red-50' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="mt-1">
                  {getAlertIcon(alert.alertType)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {alert.title}
                    </h3>
                    
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    
                    {alert.isResolved && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>

                  <p className="text-gray-700 mb-3">{alert.message}</p>

                  {/* Alert Details */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{alert.user?.firstName} {alert.user?.lastName}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{getTimeAgo(alert.createdAt)}</span>
                      </div>
                    </div>

                    {/* Health Data */}
                    {alert.healthData && (
                      <div className="space-y-2">
                        {alert.healthData.heartRate && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span>{alert.healthData.heartRate} BPM</span>
                          </div>
                        )}
                        
                        {alert.healthData.bloodPressure && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            <span>
                              {alert.healthData.bloodPressure.systolic}/
                              {alert.healthData.bloodPressure.diastolic} mmHg
                            </span>
                          </div>
                        )}
                        
                        {alert.healthData.temperature && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Thermometer className="w-4 h-4 text-orange-500" />
                            <span>{alert.healthData.temperature}°C</span>
                          </div>
                        )}
                        
                        {alert.healthData.location && (
                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <span>Location available</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Recommended Actions */}
                  {alert.actions && alert.actions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Recommended Actions:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        {alert.actions.map((action, index) => (
                          <li key={index}>{action.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Resolution Info */}
                  {alert.isResolved && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">
                          Resolved by {alert.resolvedBy?.firstName} {alert.resolvedBy?.lastName}
                        </span>
                      </div>
                      <p className="text-sm text-green-700">
                        {new Date(alert.resolvedAt).toLocaleString()}
                      </p>
                      {alert.resolutionNotes && (
                        <p className="text-sm text-green-700 mt-2">
                          Notes: {alert.resolutionNotes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!alert.isResolved && (
                <div className="flex flex-col space-y-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedAlert(alert)
                      setShowResolveModal(true)
                    }}
                  >
                    Resolve
                  </Button>
                  
                  {alert.severity === 'emergency' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Resolve Alert Modal */}
      <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Health Alert</DialogTitle>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  {getAlertIcon(selectedAlert.alertType)}
                  <h3 className="font-semibold text-gray-900">
                    {selectedAlert.title}
                  </h3>
                </div>
                <p className="text-gray-700">{selectedAlert.message}</p>
              </div>
              
              <div>
                <Label htmlFor="resolutionNotes">Resolution Notes (Optional)</Label>
                <Textarea
                  id="resolutionNotes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how this alert was resolved..."
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowResolveModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleResolveAlert}
                  disabled={resolving}
                  className="flex-1"
                >
                  {resolving ? 'Resolving...' : 'Mark as Resolved'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}