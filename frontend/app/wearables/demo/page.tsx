'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  Activity, 
  Droplets,
  Thermometer,
  Battery,
  AlertTriangle,
  CheckCircle,
  Play
} from 'lucide-react'

export default function WearableDemoPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedData, setGeneratedData] = useState([])

  const generateMockData = async () => {
    setIsGenerating(true)
    
    try {
      const { wearableAPI } = await import('@/lib/api')
      
      // Generate various types of health data
      const dataTypes = [
        {
          type: 'heart_rate',
          data: { heartRate: 75 + Math.floor(Math.random() * 30), context: 'resting' }
        },
        {
          type: 'blood_pressure',
          data: { 
            systolic: 120 + Math.floor(Math.random() * 20),
            diastolic: 80 + Math.floor(Math.random() * 10)
          }
        },
        {
          type: 'steps',
          data: { count: 5000 + Math.floor(Math.random() * 8000), distance: 3.2, calories: 250 }
        },
        {
          type: 'temperature',
          data: { temperature: 36.5 + Math.random() * 1.5 }
        },
        {
          type: 'oxygen_saturation',
          data: { spo2: 95 + Math.floor(Math.random() * 5) }
        }
      ]

      const results = []
      
      for (const dataType of dataTypes) {
        try {
          const response = await wearableAPI.submitHealthData({
            deviceId: 'demo_device_001',
            deviceType: 'custom',
            dataType: dataType.type,
            data: {
              ...dataType.data,
              timestamp: new Date().toISOString()
            }
          })
          
          results.push({
            type: dataType.type,
            success: true,
            data: dataType.data,
            alertsGenerated: response.data.alertsGenerated || 0
          })
        } catch (error) {
          results.push({
            type: dataType.type,
            success: false,
            error: error.message
          })
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      setGeneratedData(results)
    } catch (error) {
      console.error('Failed to generate demo data:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const getDataIcon = (type: string) => {
    switch (type) {
      case 'heart_rate':
        return <Heart className="w-5 h-5 text-red-500" />
      case 'blood_pressure':
        return <Droplets className="w-5 h-5 text-blue-500" />
      case 'steps':
        return <Activity className="w-5 h-5 text-green-500" />
      case 'temperature':
        return <Thermometer className="w-5 h-5 text-orange-500" />
      case 'oxygen_saturation':
        return <Battery className="w-5 h-5 text-purple-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const formatDataValue = (type: string, data: any) => {
    switch (type) {
      case 'heart_rate':
        return `${data.heartRate} BPM`
      case 'blood_pressure':
        return `${data.systolic}/${data.diastolic} mmHg`
      case 'steps':
        return `${data.count.toLocaleString()} steps`
      case 'temperature':
        return `${data.temperature.toFixed(1)}°C`
      case 'oxygen_saturation':
        return `${data.spo2}%`
      default:
        return 'N/A'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton href="/wearables">Back to Wearables</BackButton>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Wearable Demo Data Generator
            </h1>
            <p className="text-gray-600">
              Generate sample health data to test the wearable monitoring and alert system
            </p>
          </div>

          {/* Demo Controls */}
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Generate Sample Health Data
                </h2>
                <p className="text-gray-600">
                  This will create mock health readings from various sensors and may trigger alerts
                  based on your family group settings.
                </p>
              </div>
              
              <Button
                onClick={generateMockData}
                disabled={isGenerating}
                className="flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Generate Data</span>
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Generated Data Results */}
          {generatedData.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Generated Health Data
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedData.map((result, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getDataIcon(result.type)}
                        <h3 className="font-medium text-gray-900 capitalize">
                          {result.type.replace('_', ' ')}
                        </h3>
                      </div>
                      
                      {result.success ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </div>

                    {result.success ? (
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatDataValue(result.type, result.data)}
                        </div>
                        
                        {result.alertsGenerated > 0 && (
                          <div className="flex items-center space-x-2 text-sm text-orange-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{result.alertsGenerated} alert(s) generated</span>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-500">
                          Generated at {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">
                        Error: {result.error}
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {/* Instructions */}
              <Card className="p-6 bg-blue-50">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900 mb-2">
                      What happens next?
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Generated data is processed by the health monitoring system</li>
                      <li>• Alerts may be sent to family members if thresholds are exceeded</li>
                      <li>• Data appears in your health metrics dashboard</li>
                      <li>• Family members can view updates in real-time</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Demo Information */}
          <Card className="p-6 mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Demo Features
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Health Metrics</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Heart rate monitoring</li>
                  <li>• Blood pressure tracking</li>
                  <li>• Step counting and activity</li>
                  <li>• Body temperature</li>
                  <li>• Oxygen saturation levels</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Alert System</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Automatic threshold monitoring</li>
                  <li>• Family member notifications</li>
                  <li>• Emergency alert escalation</li>
                  <li>• Multi-channel delivery (SMS, email, push)</li>
                  <li>• Alert resolution tracking</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}