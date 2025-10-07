'use client'

import { useState, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Camera, X, AlertTriangle, Eye, FileImage } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'

export default function ImagesPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [bodyPart, setBodyPart] = useState('')
  const [imageType, setImageType] = useState('other')
  const [currentSymptom, setCurrentSymptom] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addSymptom = () => {
    if (currentSymptom.trim() && !symptoms.includes(currentSymptom.trim())) {
      setSymptoms([...symptoms, currentSymptom.trim()])
      setCurrentSymptom('')
    }
  }

  const removeSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter(s => s !== symptom))
  }

  const analyzeImage = async () => {
    if (!selectedImage) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', selectedImage)
      
      // Append symptoms as individual array items
      symptoms.forEach((symptom, index) => {
        formData.append(`symptoms[${index}]`, symptom)
      })
      
      formData.append('bodyPart', bodyPart || 'other')
      formData.append('imageType', imageType)

      // Debug logging
      console.log('Sending image analysis request with:', {
        imageType,
        bodyPart: bodyPart || 'other',
        symptoms,
        imageSize: selectedImage.size,
        imageType: selectedImage.type
      })

      const { imagesAPI, searchHistoryAPI } = await import('@/lib/api')
      const response = await imagesAPI.analyze(formData)
      
      console.log('Analysis response:', response.data)
      console.log('AI Analysis structure:', response.data.analysis?.aiAnalysis)
      
      setAnalysis(response.data)

      // Save to search history
      try {
        await searchHistoryAPI.saveSearch({
          searchType: 'images',
          query: `Image analysis - ${bodyPart || 'General'}`,
          searchData: {
            imageInfo: {
              type: imageType,
              bodyPart,
              symptoms
            }
          }
        })
      } catch (historyError) {
        console.warn('Failed to save search history:', historyError)
      }
    } catch (error: any) {
      console.error('Analysis error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to analyze image. Please try again.'
      alert(errorMessage)
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <BackButton href="/dashboard">Back to Dashboard</BackButton>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Health Image Analysis
            </h1>
            <p className="text-gray-600">
              Upload health images for AI-powered visual analysis
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Image Upload Section */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Upload Image
                </h2>
                
                {!imagePreview ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-health-primary transition-colors"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Click to upload an image</p>
                    <p className="text-sm text-gray-500">
                      Supported formats: JPG, PNG, WebP (Max 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Selected image" 
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setSelectedImage(null)
                        setImagePreview(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </Card>

              {/* Additional Information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Additional Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image Type
                    </label>
                    <select
                      value={imageType}
                      onChange={(e) => setImageType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-health-primary"
                    >
                      <option value="other">Other</option>
                      <option value="skin_condition">Skin Condition</option>
                      <option value="wound">Wound</option>
                      <option value="rash">Rash</option>
                      <option value="mole">Mole</option>
                      <option value="eye_condition">Eye Condition</option>
                      <option value="x_ray">X-Ray</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Body Part
                    </label>
                    <select
                      value={bodyPart}
                      onChange={(e) => setBodyPart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-health-primary"
                    >
                      <option value="">Select body part</option>
                      <option value="head">Head</option>
                      <option value="face">Face</option>
                      <option value="neck">Neck</option>
                      <option value="chest">Chest</option>
                      <option value="back">Back</option>
                      <option value="arms">Arms</option>
                      <option value="hands">Hands</option>
                      <option value="abdomen">Abdomen</option>
                      <option value="legs">Legs</option>
                      <option value="feet">Feet</option>
                      <option value="skin">Skin (general)</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Related Symptoms
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={currentSymptom}
                        onChange={(e) => setCurrentSymptom(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-health-primary"
                        placeholder="e.g., Pain, Swelling, Redness"
                      />
                      <Button onClick={addSymptom} size="sm">
                        Add
                      </Button>
                    </div>
                    
                    {symptoms.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {symptoms.map((symptom, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-health-primary/10 text-health-primary rounded-full text-sm"
                          >
                            {symptom}
                            <button
                              onClick={() => removeSymptom(symptom)}
                              className="ml-2 text-health-primary hover:text-health-primary/70"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={analyzeImage} 
                  disabled={!selectedImage || loading}
                  className="w-full mt-6"
                >
                  {loading ? 'Analyzing...' : 'Analyze Image with AI'}
                </Button>
              </Card>
            </div>

            {/* Analysis Results */}
            <div>
              {analysis && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    AI Analysis Results
                  </h2>
                  
                  {/* Image Quality */}
                  {analysis.analysis?.aiAnalysis?.imageQuality && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Image Quality</span>
                        <span className="text-sm text-gray-600">
                          {Math.round(analysis.analysis.aiAnalysis.imageQuality.score * 100)}%
                        </span>
                      </div>
                      {analysis.analysis.aiAnalysis.imageQuality.issues?.length > 0 && (
                        <div className="text-sm text-gray-600">
                          Issues: {analysis.analysis.aiAnalysis.imageQuality.issues.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Urgency Level */}
                  <div className={`p-4 rounded-lg border mb-6 ${getUrgencyColor(analysis.analysis?.aiAnalysis?.urgencyLevel)}`}>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-semibold">
                        Urgency Level: {analysis.analysis?.aiAnalysis?.urgencyLevel?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Detected Conditions */}
                  {analysis.analysis?.aiAnalysis?.detectedConditions && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Detected Conditions</h3>
                      <div className="space-y-3">
                        {analysis.analysis.aiAnalysis.detectedConditions.map((condition: any, index: number) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{condition.condition}</h4>
                              <span className="text-sm text-gray-600">
                                {Math.round(condition.confidence * 100)}% confidence
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

                  {/* Textual Description */}
                  {analysis.analysis?.aiAnalysis?.textualDescription && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Visual Description</h3>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                        {analysis.analysis.aiAnalysis.textualDescription}
                      </p>
                    </div>
                  )}

                  {/* Medical Insights */}
                  {analysis.analysis?.aiAnalysis?.medicalInsights && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Medical Insights</h3>
                      <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        {analysis.analysis.aiAnalysis.medicalInsights}
                      </p>
                    </div>
                  )}

                  {/* Recommended Actions */}
                  {analysis.analysis?.aiAnalysis?.recommendedActions && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Recommended Actions</h3>
                      <ul className="space-y-2">
                        {analysis.analysis.aiAnalysis.recommendedActions.map((action: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-health-primary rounded-full mt-2"></div>
                            <span className="text-gray-700">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.analysis?.aiAnalysis?.requiresProfessionalReview && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-5 h-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-800">
                          Professional Review Recommended
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        This image should be reviewed by a healthcare professional for proper diagnosis.
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Disclaimer:</strong> This AI analysis is for informational purposes only and should not replace professional medical advice. Always consult with a healthcare provider for proper diagnosis and treatment.
                    </p>
                  </div>
                </Card>
              )}

              {!analysis && !selectedImage && (
                <Card className="p-6 text-center">
                  <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Image Selected
                  </h3>
                  <p className="text-gray-600">
                    Upload a health image to get started with AI-powered visual analysis
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