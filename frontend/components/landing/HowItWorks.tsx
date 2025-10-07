'use client'

import { motion } from 'framer-motion'
import { Upload, Brain, MessageSquare, UserCheck } from 'lucide-react'

const steps = [
  {
    icon: Upload,
    title: 'Input Your Symptoms',
    description: 'Describe your symptoms or upload health images through our secure platform.',
    step: '01'
  },
  {
    icon: Brain,
    title: 'AI Analysis',
    description: 'Our advanced AI powered by Gemini 2.5 Pro analyzes your data and provides insights.',
    step: '02'
  },
  {
    icon: MessageSquare,
    title: 'Get Recommendations',
    description: 'Receive personalized health recommendations and guidance from our virtual assistant.',
    step: '03'
  },
  {
    icon: UserCheck,
    title: 'Connect with Doctors',
    description: 'If needed, connect with licensed healthcare professionals for expert consultation.',
    step: '04'
  }
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Get started with your health journey in just four simple steps
          </motion.p>
        </div>

        <div className="relative">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative text-center"
              >
                {/* Step number */}
                <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 bg-white border-4 border-health-primary rounded-full mb-6 mx-auto">
                  <span className="text-health-primary font-bold text-lg">{step.step}</span>
                </div>
                
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-12 h-12 bg-health-primary/10 rounded-lg mb-4">
                  <step.icon className="w-6 h-6 text-health-primary" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}