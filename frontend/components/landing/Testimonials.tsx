'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Working Mother',
    content: 'HealthAI helped me identify a skin condition early. The AI analysis was spot-on and connected me with a dermatologist immediately. Saved me weeks of worry!',
    rating: 5,
    avatar: '/avatars/sarah.jpg'
  },
  {
    name: 'Dr. Michael Chen',
    role: 'Family Physician',
    content: 'As a doctor, I\'m impressed by the accuracy of the AI analysis. It helps my patients come prepared with detailed symptom information, making consultations more efficient.',
    rating: 5,
    avatar: '/avatars/michael.jpg'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Fitness Enthusiast',
    content: 'The wearable integration is seamless. I love how it tracks my health metrics and provides personalized recommendations. The emergency alert feature gives me peace of mind.',
    rating: 5,
    avatar: '/avatars/emily.jpg'
  },
  {
    name: 'James Wilson',
    role: 'Senior Citizen',
    content: 'The virtual assistant is like having a nurse available 24/7. It answers my health questions patiently and knows when to recommend I see my doctor.',
    rating: 5,
    avatar: '/avatars/james.jpg'
  },
  {
    name: 'Lisa Thompson',
    role: 'Busy Professional',
    content: 'Quick symptom analysis saved me an unnecessary ER visit. The AI correctly identified my symptoms as non-urgent and provided helpful self-care tips.',
    rating: 5,
    avatar: '/avatars/lisa.jpg'
  },
  {
    name: 'Robert Kim',
    role: 'Parent',
    content: 'Managing my family\'s health records in one place is incredibly convenient. The platform helps me track everyone\'s health and schedule appointments efficiently.',
    rating: 5,
    avatar: '/avatars/robert.jpg'
  }
]

export function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4"
          >
            Trusted by Thousands
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            See what our users and healthcare professionals are saying about HealthAI
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <Quote className="w-8 h-8 text-health-primary/20 mr-2" />
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-health-primary to-health-secondary rounded-full flex items-center justify-center text-white font-semibold mr-4">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center space-x-8 text-gray-500">
            <div className="text-center">
              <div className="text-3xl font-bold text-health-primary">50K+</div>
              <div className="text-sm">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-health-primary">1M+</div>
              <div className="text-sm">Analyses Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-health-primary">99.9%</div>
              <div className="text-sm">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-health-primary">24/7</div>
              <div className="text-sm">Support</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}