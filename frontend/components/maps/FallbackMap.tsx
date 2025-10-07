'use client'

import { MapPin, ExternalLink, Navigation } from 'lucide-react'

interface Doctor {
  id: string
  name: string
  specialty: string
  rating: number
  distance: number
  address: string
  phone: string
  consultationFee: number
  type: 'hospital' | 'private'
  location: {
    latitude: number
    longitude: number
  }
}

interface FallbackMapProps {
  doctors: Doctor[]
  userLocation: {
    latitude: number
    longitude: number
  }
  selectedDoctor?: Doctor | null
  onDoctorSelect?: (doctor: Doctor) => void
}

export function FallbackMap({ doctors, userLocation, selectedDoctor, onDoctorSelect }: FallbackMapProps) {
  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/hospitals/@${userLocation.latitude},${userLocation.longitude},13z`
    window.open(url, '_blank')
  }

  const openDirections = (doctor: Doctor) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${doctor.location.latitude},${doctor.location.longitude}`
    window.open(url, '_blank')
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6">
      <div className="text-center mb-6">
        <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Healthcare Locations Near You
        </h3>
        <p className="text-gray-600 mb-4">
          {doctors.length} healthcare providers within {Math.max(...doctors.map(d => d.distance)).toFixed(1)} km
        </p>
        <button
          onClick={openInGoogleMaps}
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View All on Google Maps
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.slice(0, 6).map((doctor) => (
          <div
            key={doctor.id}
            className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${
              selectedDoctor?.id === doctor.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => onDoctorSelect?.(doctor)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                  {doctor.name}
                </h4>
                <p className="text-xs text-blue-600 mb-1">{doctor.specialty}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <span className="mr-2">⭐ {doctor.rating}</span>
                  <span>{doctor.distance} km</span>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                doctor.type === 'hospital' ? 'bg-green-500' : 'bg-blue-500'
              }`} />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                ₹{doctor.consultationFee}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openDirections(doctor)
                }}
                className="flex items-center text-xs text-blue-600 hover:text-blue-800"
              >
                <Navigation className="h-3 w-3 mr-1" />
                Directions
              </button>
            </div>
          </div>
        ))}
      </div>

      {doctors.length > 6 && (
        <div className="text-center mt-4">
          <button
            onClick={openInGoogleMaps}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View all {doctors.length} locations on Google Maps →
          </button>
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Hospitals</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Private Clinics</span>
        </div>
      </div>
    </div>
  )
}