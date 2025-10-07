'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, ExternalLink } from 'lucide-react'

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

interface GoogleMapProps {
  doctors: Doctor[]
  userLocation: {
    latitude: number
    longitude: number
  }
  selectedDoctor?: Doctor | null
  onDoctorSelect?: (doctor: Doctor) => void
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export function GoogleMap({ doctors, userLocation, selectedDoctor, onDoctorSelect }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string>('')
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    loadGoogleMaps()
  }, [])

  useEffect(() => {
    if (map && isLoaded) {
      updateMapMarkers()
    }
  }, [doctors, map, isLoaded, selectedDoctor])

  const loadGoogleMaps = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      setError('Google Maps API key not configured')
      return
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap()
      return
    }

    // Load Google Maps script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`
    script.async = true
    script.defer = true
    
    window.initMap = initializeMap
    script.onload = () => {
      setIsLoaded(true)
    }
    
    script.onerror = () => {
      setError('Failed to load Google Maps')
    }

    document.head.appendChild(script)
  }

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: userLocation.latitude, lng: userLocation.longitude },
      zoom: 13,
      styles: [
        {
          featureType: 'poi.medical',
          elementType: 'geometry',
          stylers: [{ color: '#ffeaa7' }]
        }
      ]
    })

    setMap(mapInstance)
    setIsLoaded(true)
  }

  const updateMapMarkers = () => {
    if (!map || !window.google) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Add user location marker
    const userMarker = new window.google.maps.Marker({
      position: { lat: userLocation.latitude, lng: userLocation.longitude },
      map: map,
      title: 'Your Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(24, 24),
        anchor: new window.google.maps.Point(12, 12)
      }
    })

    markersRef.current.push(userMarker)

    // Add doctor markers
    doctors.forEach((doctor, index) => {
      const isSelected = selectedDoctor?.id === doctor.id
      
      const marker = new window.google.maps.Marker({
        position: { lat: doctor.location.latitude, lng: doctor.location.longitude },
        map: map,
        title: doctor.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2C11.6 2 8 5.6 8 10c0 7.5 8 18 8 18s8-10.5 8-18c0-4.4-3.6-8-8-8z" fill="${isSelected ? '#EF4444' : doctor.type === 'hospital' ? '#10B981' : '#3B82F6'}" stroke="#ffffff" stroke-width="2"/>
              <circle cx="16" cy="10" r="3" fill="#ffffff"/>
              <path d="M16 7v6M13 10h6" stroke="${isSelected ? '#EF4444' : doctor.type === 'hospital' ? '#10B981' : '#3B82F6'}" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32)
        }
      })

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoWindowContent(doctor)
      })

      // Add click listener
      marker.addListener('click', () => {
        // Close all other info windows
        markersRef.current.forEach(m => {
          if (m.infoWindow) {
            m.infoWindow.close()
          }
        })
        
        infoWindow.open(map, marker)
        onDoctorSelect?.(doctor)
      })

      marker.infoWindow = infoWindow
      markersRef.current.push(marker)
    })

    // Adjust map bounds to show all markers
    if (doctors.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      bounds.extend({ lat: userLocation.latitude, lng: userLocation.longitude })
      
      doctors.forEach(doctor => {
        bounds.extend({ lat: doctor.location.latitude, lng: doctor.location.longitude })
      })
      
      map.fitBounds(bounds)
      
      // Ensure minimum zoom level
      const listener = window.google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() > 15) map.setZoom(15)
        window.google.maps.event.removeListener(listener)
      })
    }
  }

  const createInfoWindowContent = (doctor: Doctor) => {
    return `
      <div style="padding: 8px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">
          ${doctor.name}
        </h3>
        <p style="margin: 0 0 4px 0; color: #3b82f6; font-weight: 500;">
          ${doctor.specialty}
        </p>
        <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">
          ⭐ ${doctor.rating} • ${doctor.distance} km away
        </p>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
          ₹${doctor.consultationFee} consultation
        </p>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button onclick="openDirections(${doctor.location.latitude}, ${doctor.location.longitude}, '${doctor.name.replace(/'/g, "\\'")}')" 
                  style="background: #3b82f6; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">
            Directions
          </button>
          <button onclick="window.open('tel:${doctor.phone}', '_self')" 
                  style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">
            Call
          </button>
        </div>
      </div>
    `
  }

  // Add global function for directions
  useEffect(() => {
    window.openDirections = (lat: number, lng: number, name: string) => {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}`
      window.open(url, '_blank')
    }
  }, [])

  const openInGoogleMaps = () => {
    const doctorLocations = doctors.map(d => `${d.location.latitude},${d.location.longitude}`).join('|')
    const url = `https://www.google.com/maps/search/hospitals/@${userLocation.latitude},${userLocation.longitude},13z`
    window.open(url, '_blank')
  }

  if (error) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={openInGoogleMaps}
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in Google Maps
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border border-gray-200"
        style={{ minHeight: '400px' }}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={openInGoogleMaps}
          className="bg-white shadow-lg rounded-lg p-2 hover:bg-gray-50 transition-colors"
          title="Open in Google Maps"
        >
          <ExternalLink className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Hospitals</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>Private Clinics</span>
          </div>
        </div>
        <span>{doctors.length} locations shown</span>
      </div>
    </div>
  )
}