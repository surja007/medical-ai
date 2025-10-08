'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Watch, 
  Smartphone, 
  Activity, 
  Heart,
  Wifi,
  CheckCircle,
  Bluetooth,
  BluetoothConnected,
  AlertCircle,
  Info
} from 'lucide-react'
import BluetoothService from '@/lib/bluetooth/BluetoothService'

const deviceTypes = [
  {
    id: 'bluetooth_fitness',
    name: 'Bluetooth Fitness Tracker',
    icon: Bluetooth,
    description: 'Direct Bluetooth connection',
    color: 'bg-blue-100 text-blue-600',
    connectionType: 'bluetooth',
    supported: true
  },
  {
    id: 'bluetooth_heart_rate',
    name: 'Heart Rate Monitor',
    icon: Heart,
    description: 'BLE heart rate sensors',
    color: 'bg-red-100 text-red-600',
    connectionType: 'bluetooth',
    supported: true
  },
  {
    id: 'fitbit',
    name: 'Fitbit (API)',
    icon: Activity,
    description: 'Charge, Versa, Sense series',
    color: 'bg-green-100 text-green-600',
    connectionType: 'api',
    supported: false
  },
  {
    id: 'apple_watch',
    name: 'Apple Watch (API)',
    icon: Watch,
    description: 'All series with HealthKit',
    color: 'bg-gray-100 text-gray-600',
    connectionType: 'api',
    supported: false
  },
  {
    id: 'garmin',
    name: 'Garmin (API)',
    icon: Activity,
    description: 'Forerunner, Vivosmart, Fenix',
    color: 'bg-blue-100 text-blue-600',
    connectionType: 'api',
    supported: false
  },
  {
    id: 'samsung_health',
    name: 'Samsung Health (API)',
    icon: Heart,
    description: 'Galaxy Watch, Galaxy Fit',
    color: 'bg-purple-100 text-purple-600',
    connectionType: 'api',
    supported: false
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
  const [bluetoothSupported, setBluetoothSupported] = useState(false)
  const [connectedBluetoothDevice, setConnectedBluetoothDevice] = useState<any>(null)
  const [error, setError] = useState('')
  const [realTimeData, setRealTimeData] = useState<any>({})
  
  const bluetoothService = useRef<BluetoothService | null>(null)

  useEffect(() => {
    // Initialize Bluetooth service
    bluetoothService.current = new BluetoothService()
    setBluetoothSupported(bluetoothService.current.isBluetoothSupported())

    // Setup data listeners
    if (bluetoothService.current) {
      bluetoothService.current.onData((data) => {
        setRealTimeData(prev => ({
          ...prev,
          [data.type]: data,
          lastUpdate: new Date().toLocaleTimeString()
        }))
        
        // Send data to backend immediately
        sendDataToBackend(data)
      })
    }

    return () => {
      if (bluetoothService.current && connectedBluetoothDevice) {
        bluetoothService.current.disconnect()
      }
    }
  }, [])

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

  const sendDataToBackend = async (data: any) => {
    if (!connectedBluetoothDevice) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/wearables/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          deviceId: connectedBluetoothDevice.id,
          deviceType: selectedDevice,
          dataType: data.type,
          data: data,
          connectionType: 'bluetooth'
        })
      })

      if (!response.ok) {
        console.error('Failed to send data to backend:', response.statusText)
      }
    } catch (error) {
      console.error('Error sending data to backend:', error)
    }
  }

  const handleBluetoothConnect = async () => {
    if (!bluetoothService.current) return

    setConnecting(true)
    setError('')

    try {
      const deviceType = selectedDevice === 'bluetooth_fitness' ? 'fitness' : 'heart_rate'
      const result = await bluetoothService.current.scanAndConnect(deviceType)
      
      if (result.success) {
        const deviceInfo = await bluetoothService.current.getDeviceInfo()
        
        setConnectedBluetoothDevice(result.device)
        setDeviceName(result.device.name || 'Bluetooth Device')
        setDeviceId(result.device.id)
        
        // Register device with backend
        const token = localStorage.getItem('token')
        await fetch('/api/wearables/bluetooth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            deviceId: result.device.id,
            name: result.device.name,
            manufacturer: deviceInfo.manufacturer,
            services: deviceInfo.services,
            characteristics: deviceInfo.characteristics
          })
        })

        setStep(3) // Move to success step
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConnecting(false)
    }
  }

  const handleApiConnect = async () => {
    setConnecting(true)
    
    try {
      // Simulate API connection process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const deviceData = {
        deviceType: selectedDevice,
        deviceId,
        deviceName,
        connectionType: 'api',
        // In real implementation, these would come from OAuth flow
        accessToken: `mock_token_${Date.now()}`,
        refreshToken: `mock_refresh_${Date.now()}`
      }
      
      onConnect(deviceData)
      handleClose()
    } catch (error) {
      console.error('Connection failed:', error)
      setError('Failed to connect device')
    } finally {
      setConnecting(false)
    }
  }

  const handleFinalizeConnection = () => {
    const deviceData = {
      deviceType: selectedDevice,
      deviceId,
      deviceName,
      connectionType: 'bluetooth',
      bluetoothInfo: connectedBluetoothDevice
    }
    
    onConnect(deviceData)
    handleClose()
  }

  const handleClose = () => {
    setStep(1)
    setSelectedDevice('')
    setDeviceName('')
    setDeviceId('')
    setError('')
    setConnectedBluetoothDevice(null)
    setRealTimeData({})
    
    // Disconnect Bluetooth if connected
    if (bluetoothService.current && connectedBluetoothDevice) {
      bluetoothService.current.disconnect()
    }
    
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
            {!bluetoothSupported && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera for Bluetooth connectivity.
                </AlertDescription>
              </Alert>
            )}
            
            <p className="text-gray-600">
              Select your wearable device to start monitoring your health data
            </p>
            
            <div className="grid md:grid-cols-1 gap-4">
              {deviceTypes.map((device) => {
                const IconComponent = device.icon
                const isBluetoothDevice = device.connectionType === 'bluetooth'
                const isDisabled = (isBluetoothDevice && !bluetoothSupported) || !device.supported
                
                return (
                  <Card
                    key={device.id}
                    className={`p-4 transition-shadow ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:shadow-md'
                    }`}
                    onClick={() => !isDisabled && handleDeviceSelect(device.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${device.color}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{device.name}</h3>
                            {isBluetoothDevice && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                <Bluetooth className="w-3 h-3 mr-1" />
                                Bluetooth
                              </Badge>
                            )}
                            {device.connectionType === 'api' && (
                              <Badge variant="outline">API</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{device.description}</p>
                        </div>
                      </div>
                      
                      {device.supported ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="text-xs text-gray-500">Coming Soon</div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Bluetooth devices</strong> connect directly through your browser for real-time data. 
                <strong>API devices</strong> require manufacturer authentication (coming soon).
              </AlertDescription>
            </Alert>
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

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {selectedDevice.startsWith('bluetooth_') ? (
              <div className="space-y-4">
                <Alert>
                  <Bluetooth className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Bluetooth Connection:</strong> Make sure your device is in pairing mode and close to your computer.
                    You'll see a browser popup to select your device.
                  </AlertDescription>
                </Alert>

                <div className="text-center py-6">
                  <Button 
                    onClick={handleBluetoothConnect}
                    disabled={connecting}
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    {connecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Scanning for devices...
                      </>
                    ) : (
                      <>
                        <Bluetooth className="w-5 h-5" />
                        Scan & Connect Bluetooth Device
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
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
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Wifi className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">API Authentication</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        API-based connections require manufacturer authentication. This feature is coming soon.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              {!selectedDevice.startsWith('bluetooth_') && (
                <Button 
                  onClick={handleApiConnect} 
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
              )}
            </div>
          </div>
        )}

        {step === 3 && connectedBluetoothDevice && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BluetoothConnected className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Device Connected!</h3>
              <p className="text-gray-600">
                Your {deviceName} is now connected and streaming real-time health data.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Device Name:</span>
                  <span className="text-sm">{deviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Device ID:</span>
                  <span className="text-sm font-mono">{deviceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Connection:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <BluetoothConnected className="w-3 h-3 mr-1" />
                    Bluetooth Connected
                  </Badge>
                </div>
              </div>
            </div>

            {Object.keys(realTimeData).length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Live Data Stream:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {realTimeData.heart_rate && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium">Heart Rate</span>
                      </div>
                      <p className="text-lg font-bold text-red-600">
                        {realTimeData.heart_rate.bpm} BPM
                      </p>
                    </div>
                  )}
                  
                  {realTimeData.battery && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">Battery</span>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        {realTimeData.battery.level}%
                      </p>
                    </div>
                  )}
                </div>
                
                {realTimeData.lastUpdate && (
                  <p className="text-xs text-gray-500 text-center">
                    Last update: {realTimeData.lastUpdate}
                  </p>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Keep Connecting
              </Button>
              <Button onClick={handleFinalizeConnection} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Add to Dashboard
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}