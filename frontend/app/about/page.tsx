import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card } from '@/components/ui/card'
import { BackButton } from '@/components/ui/back-button'
import { Heart, Shield, Users, Zap } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <BackButton href="/">Back to Home</BackButton>
          </div>
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About HealthAI
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              We're revolutionizing healthcare through AI-powered diagnostics, 
              making quality medical assistance accessible to everyone, everywhere.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Our Mission
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  To democratize healthcare by providing AI-powered diagnostic tools 
                  that help people understand their health better and connect with 
                  medical professionals when needed.
                </p>
                <p className="text-lg text-gray-600">
                  We believe that everyone deserves access to quality healthcare 
                  insights, regardless of their location or economic status.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-6 text-center">
                  <Heart className="w-12 h-12 text-health-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Care First</h3>
                  <p className="text-sm text-gray-600">
                    Patient wellbeing is our top priority
                  </p>
                </Card>
                <Card className="p-6 text-center">
                  <Shield className="w-12 h-12 text-health-secondary mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Privacy</h3>
                  <p className="text-sm text-gray-600">
                    HIPAA-compliant data protection
                  </p>
                </Card>
                <Card className="p-6 text-center">
                  <Users className="w-12 h-12 text-health-accent mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Accessible</h3>
                  <p className="text-sm text-gray-600">
                    Healthcare for everyone
                  </p>
                </Card>
                <Card className="p-6 text-center">
                  <Zap className="w-12 h-12 text-health-warning mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Innovation</h3>
                  <p className="text-sm text-gray-600">
                    Cutting-edge AI technology
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Powered by Advanced AI
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Gemini 2.5 Pro
                </h3>
                <p className="text-gray-600">
                  Advanced language model for symptom analysis and medical guidance
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Computer Vision
                </h3>
                <p className="text-gray-600">
                  TensorFlow-powered image analysis for health condition detection
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Real-time Data
                </h3>
                <p className="text-gray-600">
                  Wearable device integration for continuous health monitoring
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Built by Healthcare Innovators
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Our team combines expertise in artificial intelligence, healthcare, 
              and software engineering to create solutions that truly make a difference.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Medical Experts
                </h3>
                <p className="text-gray-600">
                  Licensed healthcare professionals guide our development
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  AI Engineers
                </h3>
                <p className="text-gray-600">
                  Machine learning specialists ensure accuracy and reliability
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Security Team
                </h3>
                <p className="text-gray-600">
                  Cybersecurity experts protect your sensitive health data
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Questions About Our Platform?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              We're here to help. Reach out to learn more about how HealthAI 
              can support your healthcare journey.
            </p>
            <div className="space-y-4">
              <p className="text-gray-600">
                <strong>Email:</strong> [email]
              </p>
              <p className="text-gray-600">
                <strong>Phone:</strong> [phone_number]
              </p>
              <p className="text-gray-600">
                <strong>Address:</strong> [address]
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}