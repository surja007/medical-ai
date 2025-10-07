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
  Users, 
  Heart, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Plus,
  Settings,
  Shield,
  Crown
} from 'lucide-react'
import FamilyMonitoring from '@/components/wearables/FamilyMonitoring'
import AlertsPanel from '@/components/wearables/AlertsPanel'

export default function FamilyPage() {
  const [familyGroups, setFamilyGroups] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('groups')

  useEffect(() => {
    fetchFamilyData()
  }, [])

  const fetchFamilyData = async () => {
    try {
      const { familyAPI } = await import('@/lib/api')
      
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
      console.error('Failed to fetch family data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-health-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading family data...</p>
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
                Family Health Monitoring
              </h1>
              <p className="text-gray-600">
                Connect with family members to share health data and receive alerts
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Family Groups</p>
                  <p className="text-2xl font-bold text-gray-900">{familyGroups.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {familyGroups.reduce((total, group) => total + (group.activeMembersCount || 0), 0)}
                  </p>
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

            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Health Status</p>
                  <p className="text-2xl font-bold text-green-600">Good</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="groups">Family Groups</TabsTrigger>
              <TabsTrigger value="alerts">Health Alerts</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="groups" className="space-y-6">
              <FamilyMonitoring 
                familyGroups={familyGroups}
                onRefresh={fetchFamilyData}
              />
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <AlertsPanel 
                alerts={alerts}
                onRefresh={fetchFamilyData}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Family Monitoring Settings
                </h2>
                
                <div className="space-y-6">
                  {/* Notification Preferences */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Notification Preferences</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Real-time Alerts</p>
                          <p className="text-sm text-gray-600">Receive immediate notifications for health alerts</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Daily Summary</p>
                          <p className="text-sm text-gray-600">Get daily health summary for family members</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Emergency Alerts</p>
                          <p className="text-sm text-gray-600">Critical health alerts via phone call</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                    </div>
                  </div>

                  {/* Privacy Settings */}
                  <div className="border-t pt-6">
                    <h3 className="font-medium text-gray-900 mb-3">Privacy Settings</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Share Health Trends</p>
                          <p className="text-sm text-gray-600">Allow family to see your health trends</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Emergency Override</p>
                          <p className="text-sm text-gray-600">Allow emergency access to your health data</p>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                    </div>
                  </div>

                  {/* Alert Thresholds */}
                  <div className="border-t pt-6">
                    <h3 className="font-medium text-gray-900 mb-3">Alert Thresholds</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Heart Rate (BPM)
                        </label>
                        <div className="flex space-x-2">
                          <input 
                            type="number" 
                            placeholder="Min (50)" 
                            className="flex-1 p-2 border border-gray-300 rounded-md"
                          />
                          <input 
                            type="number" 
                            placeholder="Max (120)" 
                            className="flex-1 p-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Blood Pressure (mmHg)
                        </label>
                        <div className="flex space-x-2">
                          <input 
                            type="number" 
                            placeholder="Systolic (140)" 
                            className="flex-1 p-2 border border-gray-300 rounded-md"
                          />
                          <input 
                            type="number" 
                            placeholder="Diastolic (90)" 
                            className="flex-1 p-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t">
                    <Button>Save Settings</Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}