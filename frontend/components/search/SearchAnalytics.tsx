'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { BarChart3, TrendingUp, Activity, Camera, Users, MessageCircle } from 'lucide-react'

interface SearchAnalytics {
  totalSearches: number
  byType: Array<{
    _id: string
    count: number
    lastSearch: string
  }>
  period: string
}

export function SearchAnalytics() {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const { searchHistoryAPI } = await import('@/lib/api')
      const response = await searchHistoryAPI.getAnalytics({ days: period })
      setAnalytics(response.data.analytics)
    } catch (error) {
      console.error('Failed to fetch search analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'symptoms': return <Activity className="w-5 h-5 text-blue-500" />
      case 'images': return <Camera className="w-5 h-5 text-green-500" />
      case 'doctors': return <Users className="w-5 h-5 text-purple-500" />
      case 'assistant': return <MessageCircle className="w-5 h-5 text-orange-500" />
      default: return <BarChart3 className="w-5 h-5 text-gray-500" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'symptoms': return 'Symptom Analysis'
      case 'images': return 'Image Analysis'
      case 'doctors': return 'Doctor Search'
      case 'assistant': return 'AI Assistant'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'symptoms': return 'bg-blue-500'
      case 'images': return 'bg-green-500'
      case 'doctors': return 'bg-purple-500'
      case 'assistant': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </Card>
    )
  }

  const maxCount = Math.max(...analytics.byType.map(item => item.count))

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Search Analytics</h3>
        </div>
        
        <select
          value={period}
          onChange={(e) => setPeriod(parseInt(e.target.value))}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-3xl font-bold text-gray-900">{analytics.totalSearches}</div>
          <div className="text-sm text-gray-600">Total Searches ({analytics.period})</div>
        </div>
      </div>

      {analytics.byType.length === 0 ? (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No search activity in the selected period</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Search Activity by Type</h4>
          
          {analytics.byType.map((item) => {
            const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0
            
            return (
              <div key={item._id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(item._id)}
                    <span className="text-sm font-medium text-gray-900">
                      {getTypeLabel(item._id)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.count} search{item.count !== 1 ? 'es' : ''}
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getTypeColor(item._id)}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Last search: {new Date(item.lastSearch).toLocaleDateString()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default SearchAnalytics