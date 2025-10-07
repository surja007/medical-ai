'use client'

import { useState, useEffect } from 'react'
import { MapPin, Search, Star, Clock, Phone, MessageCircle, Navigation, Map } from 'lucide-react'
import { communicationAPI } from '@/lib/api'
import { useLocation } from '@/hooks/useLocation'
import { GoogleMap } from '@/components/maps/GoogleMap'
import { FallbackMap } from '@/components/maps/FallbackMap'
import { MapUtils } from '@/lib/mapUtils'
import SearchHistory from '@/components/search/SearchHistory'

interface Doctor {
  id: string
  name: string
  specialty: string
  rating: number
  experience: number
  distance: number
  availability: string
  phone: string
  address: string
  image: string
  type: 'hospital' | 'private'
  consultationFee: number
}

export default function DoctorsPage() {
  const { location, loading: locationLoading, error: locationError, getCurrentLocation } = useLocation()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchRadius, setSearchRadius] = useState(10)
  const [specialty, setSpecialty] = useState('')
  const [sortBy, setSortBy] = useState('distance')
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [showMap, setShowMap] = useState(true)

  const specialties = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Gynecology',
    'Ophthalmology',
    'ENT'
  ]

  const requestLocation = async () => {
    const locationData = await getCurrentLocation()
    if (locationData) {
      searchDoctors(locationData.latitude, locationData.longitude)
    }
  }

  const searchDoctors = async (lat: number, lng: number) => {
    setSearchLoading(true)
    try {
      const response = await communicationAPI.searchDoctorsByLocation(lat, lng, {
        radius: searchRadius,
        specialty: specialty || undefined,
        sortBy
      })
      
      setDoctors(response.data.doctors || [])
      
      if (response.data.doctors.length === 0) {
        console.log('No doctors found in the specified area')
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      setDoctors([])
      
      // Show user-friendly error message
      alert('Unable to fetch doctors from your location. Please check your internet connection and try again.')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearch = () => {
    if (location) {
      searchDoctors(location.latitude, location.longitude)
    }
  }

  const requestConsultation = async (doctorId: string) => {
    try {
      await communicationAPI.requestConsultation({
        doctorId,
        type: 'online',
        preferredTime: new Date().toISOString()
      })
      alert('Consultation request sent successfully!')
    } catch (error) {
      console.error('Error requesting consultation:', error)
      alert('Failed to send consultation request')
    }
  }

  const openDirections = (doctor: Doctor) => {
    MapUtils.openNativeMap(doctor.location, doctor.name)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Find Doctors & Hospitals Near You
          </h1>
          <p className="text-lg text-gray-600">
            Discover qualified healthcare professionals in your area
          </p>
        </div>

        {/* Location Request */}
        {!location && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-center">
            <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Enable Location Access</h2>
            <p className="text-gray-600 mb-4">
              We need your location to find nearby doctors and hospitals
            </p>
            <button
              onClick={requestLocation}
              disabled={locationLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 flex items-center mx-auto"
            >
              <Navigation className="h-5 w-5 mr-2" />
              {locationLoading ? 'Getting Location...' : 'Share My Location'}
            </button>
            {locationError && (
              <p className="text-red-500 mt-4">{locationError.message}</p>
            )}
          </div>
        )}

        {/* Search Filters */}
        {location && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">
                Current Location: {location.address}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialty
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Specialties</option>
                  {specialties.map((spec) => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Radius
                </label>
                <select
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="distance">Distance</option>
                  <option value="rating">Rating</option>
                  <option value="availability">Availability</option>
                  <option value="experience">Experience</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center"
                >
                  <Search className="h-5 w-5 mr-2" />
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
                <button
                  onClick={() => {
                    if (location) {
                      MapUtils.openGoogleMaps(location, 'hospitals near me')
                    }
                  }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center text-sm"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Google Maps
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {location && (
          <div className="space-y-6">
            {searchLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Finding doctors near you...</p>
              </div>
            ) : doctors.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {doctors.length} Healthcare Providers Found Near You
                    </h2>
                    <p className="text-sm text-gray-600">
                      Within {searchRadius} km radius • Data from OpenStreetMap & local registries
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Map className="h-4 w-4 mr-2" />
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </button>
                </div>

                {/* Map Section */}
                {showMap && location && (
                  <div className="mb-8">
                    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                      <GoogleMap
                        doctors={doctors}
                        userLocation={location}
                        selectedDoctor={selectedDoctor}
                        onDoctorSelect={setSelectedDoctor}
                      />
                    ) : (
                      <FallbackMap
                        doctors={doctors}
                        userLocation={location}
                        selectedDoctor={selectedDoctor}
                        onDoctorSelect={setSelectedDoctor}
                      />
                    )}
                  </div>
                )}
                
                <div className="grid gap-6">
                  {doctors.map((doctor) => (
                    <div 
                      key={doctor.id} 
                      className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all ${
                        selectedDoctor?.id === doctor.id 
                          ? 'ring-2 ring-blue-500 shadow-lg' 
                          : ''
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
                        <img
                          src={doctor.image}
                          alt={doctor.name}
                          className="w-24 h-24 rounded-full object-cover mx-auto md:mx-0"
                        />
                        
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">{doctor.name}</h3>
                              <p className="text-blue-600 font-medium">{doctor.specialty}</p>
                              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                  <span>{doctor.rating}</span>
                                </div>
                                <span>{doctor.experience} years experience</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  doctor.type === 'hospital' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {doctor.type === 'hospital' ? 'Hospital' : 'Private Practice'}
                                </span>
                                {doctor.source && (
                                  <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                    {doctor.source}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-2">{doctor.address}</p>
                              <p className="text-sm text-gray-600">Distance: {doctor.distance} km</p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-lg font-semibold text-gray-900">₹{doctor.consultationFee}</p>
                              <p className="text-sm text-gray-600">Consultation Fee</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                            <div className="flex items-center text-sm">
                              <Clock className="h-4 w-4 text-gray-400 mr-2" />
                              <span className={`${
                                doctor.availability.includes('Available Today') 
                                  ? 'text-green-600' 
                                  : 'text-orange-600'
                              }`}>
                                {doctor.availability}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-3">
                              <a
                                href={`tel:${doctor.phone}`}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </a>
                              <button
                                onClick={() => openDirections(doctor)}
                                className="flex items-center px-4 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors"
                              >
                                <Navigation className="h-4 w-4 mr-2" />
                                Directions
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDoctor(doctor)
                                  if (!showMap) setShowMap(true)
                                }}
                                className="flex items-center px-4 py-2 border border-green-300 rounded-lg text-green-700 hover:bg-green-50 transition-colors"
                              >
                                <MapPin className="h-4 w-4 mr-2" />
                                Show on Map
                              </button>
                              <button
                                onClick={() => requestConsultation(doctor.id)}
                                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Request Consultation
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or increasing the search radius.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}