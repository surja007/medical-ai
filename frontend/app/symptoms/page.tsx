'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, X, AlertTriangle, Clock, User } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'
import SearchHistory from '@/components/search/SearchHistory'

interface Symptom {
  id: string
  name: string
  severity: number
  duration: string
  description: string
  bodyPart: string
}

export default function SymptomsPage() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [currentSymptom, setCurrentSymptom] = useState({
    name: '',
    severity: 5,
    duration: '',
    description: '',
    bodyPart: ''
  })
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const addSymptom = () => {
    if (currentSymptom.name.trim()) {
      const newSymptom: Symptom = {
        id: Date.now().toString(),
        ...currentSymptom
      }
      setSymptoms([...symptoms, newSymptom])
      setCurrentSymptom({
        name: '',
        severity: 5,
        duration: '',
        description: '',
        bodyPart: ''
      })
    }
  }

  const removeSymptom = (id: string) => {
    setSymptoms(symptoms.filter(s => s.id !== id))
  }

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) return

    setLoading(true)
    try {
      const { symptomsAPI } = await import('@/lib/api')
      const response = await symptomsAPI.analyze({
        symptoms,
        userInfo: {
          age: 30, // This would come from user profile
          gender: 'not specified'
        }
      })
      
      console.log('Analysis response:', response.data)
      setAnalysis(response.data.analysis)
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Failed to analyze symptoms. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <BackButton href="/dashboard">Back to Dashboard</BackButton>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Symptom Analysis
            </h1>
            <p className="text-gray-600">
              Describe your symptoms and get AI-powered health insights
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Symptom Input */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Add Symptoms
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Symptom Name
                    </label>
                    <input
                      type="text"
                      value={currentSymptom.name}
                      onChange={(e) => setCurrentSymptom({...currentSymptom, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-health-primary"
                      placeholder="e.g., Headache, Fever, Cough"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Severity (1-10)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={currentSymptom.severity}
                        onChange={(e) => setCurrentSymptom({...currentSymptom, severity: parseInt(e.target.value)})}
                        className="w-full"
                      />
                      <div className="text-center text-sm text-gray-600 mt-1">
                        {currentSymptom.severity}/10
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration
                      </label>
                      <select
                        value={currentSymptom.duration}
                        onChange={(e) => setCurrentSymptom({...currentSymptom, duration: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-health-primary"
                      >
                        <option value="">Select duration</option>
                        <option value="less than 1 hour">Less than 1 hour</option>
                        <option value="1-6 hours">1-6 hours</option>
                        <option value="6-24 hours">6-24 hours</option>
                        <option value="1-3 days">1-3 days</option>
                        <option value="3-7 days">3-7 days</option>
                        <option value="1-4 weeks">1-4 weeks</option>
                        <option value="more than 1 month">More than 1 month</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Body Part (Optional)
                    </label>
                    <input
                      type="text"
                      value={currentSymptom.bodyPart}
                      onChange={(e) => setCurrentSymptom({...currentSymptom, bodyPart: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-health-primary"
                      placeholder="e.g., Head, Chest, Abdomen"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={currentSymptom.description}
                      onChange={(e) => setCurrentSymptom({...currentSymptom, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-health-primary"
                      rows={3}
                      placeholder="Additional details about the symptom"
                    />
                  </div>

                  <Button onClick={addSymptom} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Symptom
                  </Button>
                </div>
              </Card>

              {/* Recent Searches */}
              {symptoms.length === 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Symptom Searches
                  </h3>
                  <SearchHistory 
                    type="symptoms" 
                    limit={3} 
                    showHeader={false}
                    onSearchSelect={(search) => {
                      // Pre-populate symptoms from search history
                      if (search.symptoms) {
                        const symptomNames = search.symptoms.split(', ')
                        // This would need to be implemented to restore the full symptom data
                        console.log('Selected previous search:', search)
                      }
                    }}
                  />
                </Card>
              )}

              {/* Current Symptoms */}
              {symptoms.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Current Symptoms ({symptoms.length})
                  </h3>
                  <div className="space-y-3">
                    {symptoms.map((symptom) => (
                      <div key={symptom.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{symptom.name}</div>
                          <div className="text-sm text-gray-600">
                            Severity: {symptom.severity}/10 • Duration: {symptom.duration}
                            {symptom.bodyPart && ` • ${symptom.bodyPart}`}
                          </div>
                        </div>
                        <button
                          onClick={() => removeSymptom(symptom.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={analyzeSymptoms} 
                    disabled={loading}
                    className="w-full mt-4"
                  >
                    {loading ? 'Analyzing...' : 'Analyze Symptoms with AI'}
                  </Button>
                </Card>
              )}
            </div>

            {/* Analysis Results */}
            <div>
              {analysis && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      AI Analysis Results
                    </h2>
                    {analysis.fallback && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Fallback Analysis
                      </span>
                    )}
                  </div>
                  
                  {analysis.fallback && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> AI service is currently unavailable. This analysis is based on symptom patterns and general medical knowledge. Please consult a healthcare provider for accurate diagnosis.
                      </p>
                    </div>
                  )}


                  
                  {/* Urgency Level */}
                  <div className={`p-4 rounded-lg border mb-6 ${getUrgencyColor(analysis.aiAnalysis?.urgencyLevel || analysis.urgencyLevel || 'moderate')}`}>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-semibold">
                        Urgency Level: {(analysis.aiAnalysis?.urgencyLevel || analysis.urgencyLevel || 'MODERATE').toUpperCase()}
                      </span>
                    </div>
                    {(analysis.aiAnalysis?.estimatedTimeToSeekCare || analysis.estimatedTimeToSeekCare) && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          Recommended timeframe: {analysis.aiAnalysis?.estimatedTimeToSeekCare || analysis.estimatedTimeToSeekCare}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Possible Conditions */}
                  {(analysis.aiAnalysis?.possibleConditions || analysis.possibleConditions) && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Possible Conditions</h3>
                      <div className="space-y-3">
                        {(analysis.aiAnalysis?.possibleConditions || analysis.possibleConditions || []).map((condition: any, index: number) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{condition.condition}</h4>
                              <span className="text-sm text-gray-600">
                                {Math.round(condition.probability * 100)}% probability
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{condition.description}</p>
                            {condition.recommendations && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Recommendations:</p>
                                <ul className="text-sm text-gray-600 list-disc list-inside">
                                  {condition.recommendations.map((rec: string, i: number) => (
                                    <li key={i}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {(analysis.aiAnalysis?.recommendedActions || analysis.recommendedActions) && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Recommended Actions</h3>
                      <ul className="space-y-2">
                        {(analysis.aiAnalysis?.recommendedActions || analysis.recommendedActions || []).map((action: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-health-primary rounded-full mt-2"></div>
                            <span className="text-gray-700">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warning Flags */}
                  {(analysis.aiAnalysis?.warningFlags || analysis.warningFlags) && (analysis.aiAnalysis?.warningFlags || analysis.warningFlags || []).length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="font-semibold text-red-800 mb-2">⚠️ Warning Flags</h3>
                      <ul className="text-sm text-red-700 space-y-1">
                        {(analysis.aiAnalysis?.warningFlags || analysis.warningFlags || []).map((flag: string, index: number) => (
                          <li key={index}>• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Disclaimer:</strong> This AI analysis is for informational purposes only and should not replace professional medical advice. Always consult with a healthcare provider for proper diagnosis and treatment.
                    </p>
                  </div>
                </Card>
              )}

              {!analysis && symptoms.length === 0 && (
                <Card className="p-6 text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Symptoms Added
                  </h3>
                  <p className="text-gray-600">
                    Add your symptoms to get started with AI-powered analysis
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}