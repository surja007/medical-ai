import { useState, useCallback } from 'react'

interface Location {
  latitude: number
  longitude: number
  address?: string
}

interface LocationError {
  code: number
  message: string
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<LocationError | null>(null)

  const getCurrentLocation = useCallback(async (): Promise<Location | null> => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser'
      })
      return null
    }

    setLoading(true)
    setError(null)

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          try {
            // Try to get address using reverse geocoding
            let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            
            if (process.env.NEXT_PUBLIC_OPENCAGE_API_KEY) {
              const response = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY}`
              )
              const data = await response.json()
              if (data.results && data.results[0]) {
                address = data.results[0].formatted
              }
            }
            
            const locationData = { latitude, longitude, address }
            setLocation(locationData)
            setLoading(false)
            resolve(locationData)
          } catch (geocodeError) {
            console.warn('Reverse geocoding failed:', geocodeError)
            const locationData = { latitude, longitude, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }
            setLocation(locationData)
            setLoading(false)
            resolve(locationData)
          }
        },
        (error) => {
          setLoading(false)
          let message = 'An unknown error occurred'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied. Please enable location services.'
              break
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable.'
              break
            case error.TIMEOUT:
              message = 'Location request timed out.'
              break
          }
          
          const locationError = { code: error.code, message }
          setError(locationError)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    })
  }, [])

  const clearLocation = useCallback(() => {
    setLocation(null)
    setError(null)
  }, [])

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    clearLocation
  }
}