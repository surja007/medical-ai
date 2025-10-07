'use client'

import { motion } from 'framer-motion'
import { 
  Brain, 
  Camera, 
  Watch, 
  MessageCircle, 
  Phone, 
  Shield,
  Zap,
  Heart,
  Users
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI Symptom Analysis',
    description: 'Advanced AI powered by Gemini 2.5 Pro analyzes your symptoms and provides instant health insights.',
    color: 'text-blue-600 bg-blue-100'
  },
  {
    icon: Camera,
    title: 'Image Diagnostics',
    description: 'Upload photos of skin conditions, wounds, or other health concerns for AI-powered visual analysis.',
    color: 'text-green-600 bg-green-100'
  },
  {
    icon: Watch,
    title: 'Wearable Integration',
    description: 'Connect your fitness trackers and smartwatches for continuous health monitoring and alerts.',
    color: 'text-purple-600 bg-purple-100'
  },
  {
    icon: MessageCircle,
    title: 'Virtual Health Assistant',
    description: '24/7 AI assistant provides personalized health guidance and answers your medical questions.',
    color: 'text-orange-600 bg-orange-100'
  },
  {
    icon: Phone,
    title: 'Doctor Communication',
    description: 'Secure video calls and messaging with licensed healthcare professionals when you need expert care.',
    color: 'text-red-600 bg-red-100'
  },
  {
    icon: Shield,
    title: 'Privacy & Security',
    description: 'HIPAA-compliant platform with end-to-end encryption ensures your health data stays private.',
    color: 'text-indigo-600 bg-indigo-100'
  },
  {
    icon: Zap,
    title: 'Emergency Alerts',
    description: 'Automatic emergency detection and instant alerts to emergency responders and your contacts.',
    color: 'text-yellow-600 bg-yellow-100'
  },
  {
    icon: Heart,
    title: 'Preventive Care',
    description: 'Personalized health recommendations and preventive care alerts based on your health data.',
    color: 'text-pink-600 bg-pink-100'
  },
  {
    icon: Users,
    title: 'Family Health',
    description: 'Manage health records for your entire family with shared access and coordinated care.',
    color: 'text-teal-600 bg-teal-100'
  }
]

export function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            Comprehensive Health Platform
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Everything you need to monitor, understand, and improve your health in one intelligent platform
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group p-6 rounded-xl border border-gray-200 hover:border-health-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-health-primary transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}