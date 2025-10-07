'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Heart, 
  Activity, 
  Moon, 
  Thermometer,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from 'lucide-react'

interface HealthMetricsProps {
  healthData: any
}

export default function HealthMetrics({ healthData }: HealthMetricsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (healthData) {
      fetchAnalytics('heart_rate')
    }
  }, [healthData, selectedPeriod])

  const fetchAnalytics = async (dataType: string) => {
    setLoading(true)
    try {
      const { wearableAPI } = await import('@/lib/api')
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 1
      const response = await wearableAPI.getAnalytics(dataType, days)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (value: number, type: string) => {
    switch (type) {
      case 'heart_rate':
        if (value < 60 || value > 100) return 'text-orange-600'
        if (value < 50 || value > 120) return 'text-red-600'
        return 'text-green-600'
      case 'blood_pressure':
        // Assuming systolic value
        if (value > 140) return 'text-red-600'
        if (value > 130) return 'text-orange-600'
        return 'text-green-600'
      case 'oxygen_saturation':
        if (value < 95) return 'text-red-600'
        if (value < 98) return 'text-orange-600'
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const formatValue = (reading: any, type: string) => {
    if (!reading?.value) return '--'
    
    switch (type) {
      case 'heart_rate':
        return `${reading.value} BPM`
      case 'blood_pressure':
        return `${reading.value.systolic}/${reading.value.diastolic} mmHg`
      case 'steps':
        return reading.value.toLocaleString()
      case 'sleep':
        return `${(reading.value / 60).toFixed(1)}h`
      case 'temperature':
        return `${reading.value}°C`
      case 'oxygen_saturation':
        return `${reading.value}%`
      default:
        return reading.value
    }
  }

  const metrics = [
    {
      key: 'heart_rate',
      name: 'Heart Rate',
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      key: 'blood_pressure',
      name: 'Blood Pressure',
      icon: Droplets,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      key: 'steps',
      name: 'Steps',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      key: 'sleep',
      name: 'Sleep',
      icon: Moon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      key: 'temperature',
      name: 'Temperature',
      icon: Thermometer,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      key: 'oxygen_saturation',
      name: 'Oxygen Saturation',
      icon: Droplets,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100'
    }
  ]

  if (!healthData) {
    return (
      <Card className="p-12 text-center">
        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Health Data Available
        </h3>
        <p className="text-gray-600">
          Connect a wearable device to start tracking your health metrics
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Health Metrics</h2>
        <div className="flex space-x-2">
          {['1d', '7d', '30d'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period === '1d' ? 'Today' : period === '7d' ? '7 Days' : '30 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Latest Readings */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const reading = healthData.latestReadings?.[metric.key]
          const IconComponent = metric.icon
          
          return (
            <Card key={metric.key} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <IconComponent className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <h3 className="font-medium text-gray-900">{metric.name}</h3>
                </div>
                
                {reading && (
                  <Badge variant="outline" className="text-xs">
                    {new Date(reading.timestamp).toLocaleDateString()}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatValue(reading, metric.key)}
                  </span>
                  
                  {analytics?.trends && (
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(analytics.trends.trend)}
                      <span className="text-sm text-gray-600">
                        {analytics.trends.changePercent > 0 ? '+' : ''}
                        {analytics.trends.changePercent}%
                      </span>
                    </div>
                  )}
                </div>

                {reading && (
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      getStatusColor(
                        typeof reading.value === 'object' ? reading.value.systolic : reading.value,
                        metric.key
                      ).replace('text-', 'bg-')
                    }`}></div>
                    <span className="text-sm text-gray-600">
                      {reading.deviceType || 'Unknown device'}
                    </span>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchAnalytics(metric.key)}
                disabled={loading}
                className="w-full mt-4"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <TrendingUp className="w-4 h-4 mr-2" />
                )}
                View Trends
              </Button>
            </Card>
          )
        })}
      </div>

      {/* Analytics Chart Placeholder */}
      {analytics && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Trends Analysis
            </h3>
            <Badge variant="outline">
              {selectedPeriod === '1d' ? 'Today' : selectedPeriod === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </Badge>
          </div>

          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">
                Chart visualization would be implemented here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Showing {analytics.dataType} trends for {analytics.period}
              </p>
            </div>
          </div>

          {analytics.trends && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getTrendIcon(analytics.trends.trend)}
                  <span className="font-medium text-gray-900 capitalize">
                    {analytics.trends.trend}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  {analytics.trends.changePercent > 0 ? 'Increased' : 'Decreased'} by{' '}
                  <span className="font-medium">
                    {Math.abs(analytics.trends.changePercent)}%
                  </span>{' '}
                  compared to previous period
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}