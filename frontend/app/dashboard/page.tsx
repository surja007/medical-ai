'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/ui/back-button'
import { Heart, Activity, Camera, MessageSquare, Users, Zap } from 'lucide-react'
import SearchHistory from '@/components/search/SearchHistory'
import SearchAnalytics from '@/components/search/SearchAnalytics'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { authAPI } = await import('@/lib/api')
        const response = await authAPI.getProfile()
        setUser(response.data.user)
      } catch (error) {
        console.error('Failed to fetch user:', error)
        // Redirect to login if not authenticated
        window.location.href = '/auth/login'
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-health-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton href="/">Back to Home</BackButton>
          
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-gray-600">
              Here's your health dashboard overview
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/symptoms">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-health-primary/10 rounded-lg">
                    <Activity className="w-6 h-6 text-health-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Symptom Analysis</h3>
                    <p className="text-sm text-gray-600">Analyze symptoms</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/images">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-health-secondary/10 rounded-lg">
                    <Camera className="w-6 h-6 text-health-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Image Analysis</h3>
                    <p className="text-sm text-gray-600">Upload health images</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/wearables">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Wearable Devices</h3>
                    <p className="text-sm text-gray-600">Monitor health data</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/assistant">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-health-accent/10 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-health-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                    <p className="text-sm text-gray-600">Chat with AI</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Secondary Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Link href="/doctors">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-health-warning/10 rounded-lg">
                    <Users className="w-6 h-6 text-health-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Find Doctors</h3>
                    <p className="text-sm text-gray-600">Connect with healthcare providers</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/family">
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Family Monitoring</h3>
                    <p className="text-sm text-gray-600">Connect with family for health sharing</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Health Overview */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Search History */}
              <SearchHistory 
                type="all" 
                limit={5} 
                showHeader={true}
                onSearchSelect={(search) => {
                  // Navigate to the appropriate page based on search type
                  const routes = {
                    symptoms: '/symptoms',
                    images: '/images',
                    doctors: '/doctors',
                    assistant: '/assistant'
                  }
                  window.location.href = routes[search.type] || '/dashboard'
                }}
              />
              
              {/* Search Analytics */}
              <SearchAnalytics />
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Health Score
                </h3>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-health-primary to-health-secondary rounded-full mb-4">
                    <span className="text-2xl font-bold text-white">--</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Complete your profile to get your health score
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Tips
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-health-primary mt-0.5" />
                    <p className="text-sm text-gray-600">
                      Upload a health image for instant AI analysis
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Heart className="w-5 h-5 text-health-accent mt-0.5" />
                    <p className="text-sm text-gray-600">
                      Connect wearable devices for continuous monitoring
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}