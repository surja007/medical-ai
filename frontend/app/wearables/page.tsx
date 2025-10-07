'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Watch, 
  Heart, 
  Activity, 
  Battery, 
  Wifi, 
  Plus,
  Settings,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import ConnectDeviceModal from '@/components/wearables/ConnectDeviceModal'
import DeviceCard from '@/components/wearables/DeviceCard'
import HealthMetrics from '@/components/wearables/HealthMetrics'
import FamilyMonitoring from '@/components/wearables/FamilyMonitoring'
import AlertsPanel from '@/components/wearables/AlertsPanel'

export default function WearablesPage() {
  const [devices, setDevices] = useState([])
  const [healthData, setHealthData] = useState(null)
  const [familyGroups, setFamilyGroups] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [activeTab, setActiveTab] = useState('devices')

  useEffect(() => {
    // Check URL parameters for tab
    const urlParams = new URLSearchParams(window.location.search)
    const tabParam = urlParams.get('tab')
    if (tabParam && ['devices', 'health', 'family', 'alerts'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
    
    fetchWearableData()
  }, [])

  const fetchWearableData = async () => {
    try {
      const { wearableAPI, familyAPI } = await import('@/lib/api')
      
      // Fetch connected devices
      const devicesResponse = await wearableAPI.getDevices()
      setDevices(devicesResponse.data.devices || [])

      // Fetch health data
      const healthResponse = await wearableAPI.getHealthData()
      setHealthData(healthResponse.data)

      // Fetch family groups
      try {
        const familyResponse = await familyAPI.getFamilyGroups()
        setFamilyGroups(familyResponse.data.familyGroups || [])
      } catch (error) {
        console.log('No family groups found')
      }

      // Fetch alerts
      try {
        const alertsResponse = await familyAPI.getAlerts()
        setAlerts(alertsResponse.data.alerts || [])
      } catch (error) {
        console.log('No alerts found')
      }

    } catch (error) {
      console.error('Failed to fetch wearable data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeviceConnect = async (deviceData) => {
    try {
      const { wearableAPI } = await import('@/lib/api')
      await wearableAPI.connectDevice(deviceData)
      setShowConnectModal(false)
      fetchWearableData() // Refresh data
    } catch (error) {
      console.error('Failed to connect device:', error)
    }
  }

  const handleDeviceDisconnect = async (deviceId) => {
    try {
      const { wearableAPI } = await import('@/lib/api')
      await wearableAPI.disconnectDevice(deviceId)
      fetchWearableData() // Refresh data
    } catch (error) {
      console.error('Failed to disconnect device:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-health-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wearable devices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton href="/dashboard">Back to Dashboard</BackButton>
          
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Wearable Devices
              </h1>
              <p className="text-gray-600">
                Monitor your health with connected devices and family sharing
              </p>
            </div>
            <Button 
              onClick={() => setShowConnectModal(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Connect Device</span>
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Watch className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Connected Devices</p>
                  <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Latest Heart Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {healthData?.latestReadings?.heart_rate?.value || '--'} BPM
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Family Groups</p>
                  <p className="text-2xl font-bold text-gray-900">{familyGroups.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {alerts.filter(alert => !alert.isResolved).length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="devices">My Devices</TabsTrigger>
              <TabsTrigger value="health">Health Data</TabsTrigger>
              <TabsTrigger value="family">Family Monitoring</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="devices" className="space-y-6">
              {devices.length === 0 ? (
                <Card className="p-12 text-center">
                  <Watch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Devices Connected
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Connect your fitness tracker or smartwatch to start monitoring your health
                  </p>
                  <Button onClick={() => setShowConnectModal(true)}>
                    Connect Your First Device
                  </Button>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {devices.map((device) => (
                    <DeviceCard
                      key={device.deviceId}
                      device={device}
                      onDisconnect={handleDeviceDisconnect}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="health" className="space-y-6">
              <HealthMetrics healthData={healthData} />
            </TabsContent>

            <TabsContent value="family" className="space-y-6">
              <FamilyMonitoring 
                familyGroups={familyGroups}
                onRefresh={fetchWearableData}
              />
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <AlertsPanel 
                alerts={alerts}
                onRefresh={fetchWearableData}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Connect Device Modal */}
      <ConnectDeviceModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnect={handleDeviceConnect}
      />
    </div>
  )
}