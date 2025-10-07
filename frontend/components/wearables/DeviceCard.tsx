'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Watch, 
  Activity, 
  Heart, 
  Smartphone,
  Battery,
  Wifi,
  WifiOff,
  Settings,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const deviceIcons = {
  fitbit: Activity,
  apple_watch: Watch,
  garmin: Activity,
  samsung_health: Heart,
  xiaomi: Activity,
  huawei: Watch,
  custom: Smartphone
}

const deviceColors = {
  fitbit: 'bg-green-100 text-green-600',
  apple_watch: 'bg-gray-100 text-gray-600',
  garmin: 'bg-blue-100 text-blue-600',
  samsung_health: 'bg-purple-100 text-purple-600',
  xiaomi: 'bg-orange-100 text-orange-600',
  huawei: 'bg-red-100 text-red-600',
  custom: 'bg-indigo-100 text-indigo-600'
}

interface DeviceCardProps {
  device: {
    deviceId: string
    deviceType: string
    deviceName?: string
    isActive: boolean
    lastSync?: string
    batteryLevel?: number
    firmwareVersion?: string
    connectedAt: string
  }
  onDisconnect: (deviceId: string) => void
}

export default function DeviceCard({ device, onDisconnect }: DeviceCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const IconComponent = deviceIcons[device.deviceType] || Smartphone
  const colorClass = deviceColors[device.deviceType] || 'bg-gray-100 text-gray-600'

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await onDisconnect(device.deviceId)
    } catch (error) {
      console.error('Failed to disconnect device:', error)
    } finally {
      setDisconnecting(false)
    }
  }

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-600'
    if (level > 20) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getLastSyncText = (lastSync: string) => {
    if (!lastSync) return 'Never synced'
    
    const syncDate = new Date(lastSync)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return `${Math.floor(diffMinutes / 1440)}d ago`
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${colorClass}`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {device.deviceName || device.deviceType}
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              {device.deviceType.replace('_', ' ')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {device.isActive ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              <AlertCircle className="w-3 h-3 mr-1" />
              Inactive
            </Badge>
          )}
        </div>
      </div>

      {/* Device Status */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Last Sync</span>
          <div className="flex items-center space-x-2">
            {device.isActive ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className="text-gray-900">
              {getLastSyncText(device.lastSync)}
            </span>
          </div>
        </div>

        {device.batteryLevel !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Battery</span>
            <div className="flex items-center space-x-2">
              <Battery className={`w-4 h-4 ${getBatteryColor(device.batteryLevel)}`} />
              <span className="text-gray-900">{device.batteryLevel}%</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Connected</span>
          <span className="text-gray-900">
            {new Date(device.connectedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="border-t pt-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Device ID</span>
            <span className="text-gray-900 font-mono text-xs">
              {device.deviceId}
            </span>
          </div>
          
          {device.firmwareVersion && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Firmware</span>
              <span className="text-gray-900">{device.firmwareVersion}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1"
        >
          <Settings className="w-4 h-4 mr-2" />
          {showDetails ? 'Hide' : 'Details'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {disconnecting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </Card>
  )
}