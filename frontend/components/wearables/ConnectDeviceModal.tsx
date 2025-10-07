'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { 
  Watch, 
  Smartphone, 
  Activity, 
  Heart,
  Wifi,
  CheckCircle
} from 'lucide-react'

const deviceTypes = [
  {
    id: 'fitbit',
    name: 'Fitbit',
    icon: Activity,
    description: 'Charge, Versa, Sense series',
    color: 'bg-green-100 text-green-600'
  },
  {
    id: 'apple_watch',
    name: 'Apple Watch',
    icon: Watch,
    description: 'All series with HealthKit',
    color: 'bg-gray-100 text-gray-600'
  },
  {
    id: 'garmin',
    name: 'Garmin',
    icon: Activity,
    description: 'Forerunner, Vivosmart, Fenix',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    id: 'samsung_health',
    name: 'Samsung Health',
    icon: Heart,
    description: 'Galaxy Watch, Galaxy Fit',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi',
    icon: Activity,
    description: 'Mi Band, Amazfit series',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    id: 'huawei',
    name: 'Huawei',
    icon: Watch,
    description: 'Watch GT, Band series',
    color: 'bg-red-100 text-red-600'
  },
  {
    id: 'custom',
    name: 'Custom Device',
    icon: Smartphone,
    description: 'Other health monitoring devices',
    color: 'bg-indigo-100 text-indigo-600'
  }
]

interface ConnectDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (deviceData: any) => void
}

export default function ConnectDeviceModal({ isOpen, onClose, onConnect }: ConnectDeviceModalProps) {
  const [step, setStep] = useState(1)
  const [selectedDevice, setSelectedDevice] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [connecting, setConnecting] = useState(false)

  const handleDeviceSelect = (deviceType: string) => {
    setSelectedDevice(deviceType)
    setStep(2)
    
    // Auto-generate device ID
    const timestamp = Date.now()
    setDeviceId(`${deviceType}_${timestamp}`)
    
    // Set default device name
    const device = deviceTypes.find(d => d.id === deviceType)
    setDeviceName(device?.name || 'My Device')
  }

  const handleConnect = async () => {
    setConnecting(true)
    
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const deviceData = {
        deviceType: selectedDevice,
        deviceId,
        deviceName,
        // In real implementation, these would come from OAuth flow
        accessToken: `mock_token_${Date.now()}`,
        refreshToken: `mock_refresh_${Date.now()}`
      }
      
      onConnect(deviceData)
      
      // Reset form
      setStep(1)
      setSelectedDevice('')
      setDeviceName('')
      setDeviceId('')
    } catch (error) {
      console.error('Connection failed:', error)
    } finally {
      setConnecting(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setSelectedDevice('')
    setDeviceName('')
    setDeviceId('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect Wearable Device</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <p className="text-gray-600">
              Select your wearable device to start monitoring your health data
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {deviceTypes.map((device) => {
                const IconComponent = device.icon
                return (
                  <Card
                    key={device.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleDeviceSelect(device.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${device.color}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{device.name}</h3>
                        <p className="text-sm text-gray-600">{device.description}</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              {(() => {
                const device = deviceTypes.find(d => d.id === selectedDevice)
                const IconComponent = device?.icon || Watch
                return (
                  <>
                    <div className={`p-3 rounded-lg ${device?.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{device?.name}</h3>
                      <p className="text-sm text-gray-600">{device?.description}</p>
                    </div>
                  </>
                )
              })()}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="deviceName">Device Name</Label>
                <Input
                  id="deviceName"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Enter a name for your device"
                />
              </div>

              <div>
                <Label htmlFor="deviceId">Device ID</Label>
                <Input
                  id="deviceId"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="Unique device identifier"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This should be the unique identifier from your device
                </p>
              </div>
            </div>

            {selectedDevice !== 'custom' && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Wifi className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">OAuth Authentication</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      In a production environment, you would be redirected to {deviceTypes.find(d => d.id === selectedDevice)?.name} 
                      to authorize access to your health data. This demo uses mock authentication.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleConnect} 
                disabled={connecting || !deviceName || !deviceId}
                className="flex-1"
              >
                {connecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Connect Device
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}