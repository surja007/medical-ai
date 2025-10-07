'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Heart, Shield, Zap } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

export function Hero() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50 pt-20 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Your AI-Powered
              <span className="text-health-primary"> Health </span>
              Companion
            </h1>
            
            <p className="mt-6 text-xl text-gray-600 leading-relaxed">
              Get instant symptom analysis, image-based diagnostics, and 24/7 health guidance 
              powered by advanced AI. Connect with doctors and emergency responders when you need them most.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="health-gradient text-white" disabled={isLoading}>
                <Link href={isAuthenticated ? "/dashboard" : "/auth/register"}>
                  {isAuthenticated ? "Go to Dashboard" : "Start Your Health Journey"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg">
                <Link href="/demo">
                  Watch Demo
                </Link>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-health-primary/10 rounded-lg mb-3">
                  <Zap className="h-6 w-6 text-health-primary" />
                </div>
                <p className="text-sm font-medium text-gray-900">Instant Analysis</p>
                <p className="text-xs text-gray-600">AI-powered results in seconds</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-health-secondary/10 rounded-lg mb-3">
                  <Shield className="h-6 w-6 text-health-secondary" />
                </div>
                <p className="text-sm font-medium text-gray-900">HIPAA Compliant</p>
                <p className="text-xs text-gray-600">Your data is secure</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-health-accent/10 rounded-lg mb-3">
                  <Heart className="h-6 w-6 text-health-accent" />
                </div>
                <p className="text-sm font-medium text-gray-900">24/7 Support</p>
                <p className="text-xs text-gray-600">Always here for you</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-health-primary/10 rounded-full"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-health-secondary/10 rounded-full"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Health Dashboard</h3>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">Symptom Analysis</span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Complete</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-900">Wearable Sync</span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-900">AI Assistant</span>
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">Online</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-health-primary to-health-secondary rounded-lg text-white">
                  <p className="text-sm font-medium">Health Score</p>
                  <p className="text-2xl font-bold">92/100</p>
                  <p className="text-xs opacity-90">Excellent health status</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}