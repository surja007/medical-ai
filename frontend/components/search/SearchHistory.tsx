'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Search, Trash2, Filter, Activity, Camera, Users, MessageCircle } from 'lucide-react'

interface SearchHistoryItem {
  id: string
  type: 'symptoms' | 'images' | 'doctors' | 'assistant'
  query: string
  date: string
  resultsCount?: number
  symptoms?: string
  location?: string
  specialty?: string
  bodyPart?: string
  message?: string
}

interface SearchHistoryProps {
  type?: 'symptoms' | 'images' | 'doctors' | 'assistant' | 'all'
  limit?: number
  showHeader?: boolean
  onSearchSelect?: (search: SearchHistoryItem) => void
}

export function SearchHistory({ 
  type = 'all', 
  limit = 10, 
  showHeader = true,
  onSearchSelect 
}: SearchHistoryProps) {
  const [searches, setSearches] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>(type === 'all' ? '' : type)

  useEffect(() => {
    fetchSearchHistory()
  }, [filter, limit])

  const fetchSearchHistory = async () => {
    try {
      setLoading(true)
      const { searchHistoryAPI } = await import('@/lib/api')
      
      const params: any = { limit }
      if (filter && filter !== 'all') {
        params.type = filter
      }

      const response = await searchHistoryAPI.getHistory(params)
      setSearches(response.data.searches || [])
    } catch (error) {
      console.error('Failed to fetch search history:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteSearch = async (id: string) => {
    try {
      const { searchHistoryAPI } = await import('@/lib/api')
      await searchHistoryAPI.deleteSearch(id)
      setSearches(searches.filter(s => s.id !== id))
    } catch (error) {
      console.error('Failed to delete search:', error)
    }
  }

  const clearAllHistory = async () => {
    if (!confirm('Are you sure you want to clear all search history?')) return
    
    try {
      const { searchHistoryAPI } = await import('@/lib/api')
      await searchHistoryAPI.clearHistory(filter || undefined)
      setSearches([])
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  const getSearchIcon = (searchType: string) => {
    switch (searchType) {
      case 'symptoms': return <Activity className="w-4 h-4 text-blue-500" />
      case 'images': return <Camera className="w-4 h-4 text-green-500" />
      case 'doctors': return <Users className="w-4 h-4 text-purple-500" />
      case 'assistant': return <MessageCircle className="w-4 h-4 text-orange-500" />
      default: return <Search className="w-4 h-4 text-gray-500" />
    }
  }

  const getSearchTypeLabel = (searchType: string) => {
    switch (searchType) {
      case 'symptoms': return 'Symptom Analysis'
      case 'images': return 'Image Analysis'
      case 'doctors': return 'Doctor Search'
      case 'assistant': return 'AI Assistant'
      default: return 'Search'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Search History</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            {type === 'all' && (
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All Types</option>
                <option value="symptoms">Symptoms</option>
                <option value="images">Images</option>
                <option value="doctors">Doctors</option>
                <option value="assistant">Assistant</option>
              </select>
            )}
            
            {searches.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllHistory}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      )}

      {searches.length === 0 ? (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Search History</h4>
          <p className="text-gray-600">
            Your recent searches will appear here to help you quickly access previous results.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((search) => (
            <div
              key={search.id}
              className={`flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors ${
                onSearchSelect ? 'cursor-pointer' : ''
              }`}
              onClick={() => onSearchSelect?.(search)}
            >
              <div className="flex items-center space-x-3 flex-1">
                {getSearchIcon(search.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {getSearchTypeLabel(search.type)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(search.date)}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {search.query}
                  </p>
                  
                  {/* Type-specific details */}
                  {search.symptoms && (
                    <p className="text-xs text-gray-600 truncate">
                      Symptoms: {search.symptoms}
                    </p>
                  )}
                  
                  {search.location && (
                    <p className="text-xs text-gray-600 truncate">
                      Location: {search.location}
                    </p>
                  )}
                  
                  {search.specialty && (
                    <p className="text-xs text-gray-600 truncate">
                      Specialty: {search.specialty}
                    </p>
                  )}
                  
                  {search.bodyPart && (
                    <p className="text-xs text-gray-600 truncate">
                      Body Part: {search.bodyPart}
                    </p>
                  )}
                  
                  {search.resultsCount !== undefined && (
                    <p className="text-xs text-gray-500">
                      {search.resultsCount} result{search.resultsCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSearch(search.id)
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default SearchHistory