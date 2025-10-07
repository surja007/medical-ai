interface Location {
  latitude: number
  longitude: number
}

interface Doctor {
  id: string
  name: string
  location: Location
  address: string
}

export class MapUtils {
  // Open directions in Google Maps
  static openGoogleDirections(destination: Location, placeName?: string) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}${
      placeName ? `&destination_place_id=${encodeURIComponent(placeName)}` : ''
    }`
    window.open(url, '_blank')
  }

  // Open location in Google Maps
  static openGoogleMaps(location: Location, query?: string) {
    const searchQuery = query ? encodeURIComponent(query) : 'hospitals'
    const url = `https://www.google.com/maps/search/${searchQuery}/@${location.latitude},${location.longitude},13z`
    window.open(url, '_blank')
  }

  // Open in Apple Maps (for iOS devices)
  static openAppleMaps(destination: Location, placeName?: string) {
    const url = `http://maps.apple.com/?daddr=${destination.latitude},${destination.longitude}${
      placeName ? `&q=${encodeURIComponent(placeName)}` : ''
    }`
    window.open(url, '_blank')
  }

  // Open in Waze
  static openWaze(destination: Location) {
    const url = `https://waze.com/ul?ll=${destination.latitude},${destination.longitude}&navigate=yes`
    window.open(url, '_blank')
  }

  // Detect user's platform and open appropriate map app
  static openNativeMap(destination: Location, placeName?: string) {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      // iOS device - try Apple Maps first
      this.openAppleMaps(destination, placeName)
    } else if (userAgent.includes('android')) {
      // Android device - Google Maps
      this.openGoogleDirections(destination, placeName)
    } else {
      // Desktop - Google Maps
      this.openGoogleDirections(destination, placeName)
    }
  }

  // Calculate distance between two points (Haversine formula)
  static calculateDistance(point1: Location, point2: Location): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.deg2rad(point2.latitude - point1.latitude)
    const dLon = this.deg2rad(point2.longitude - point1.longitude)
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(point1.latitude)) * Math.cos(this.deg2rad(point2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180)
  }

  // Generate a shareable location link
  static generateShareableLink(location: Location, placeName?: string): string {
    return `https://www.google.com/maps/place/${placeName || 'Location'}/@${location.latitude},${location.longitude},15z`
  }

  // Open multiple locations on map (for showing all doctors)
  static openMultipleLocations(userLocation: Location, doctors: Doctor[]) {
    if (doctors.length === 0) {
      this.openGoogleMaps(userLocation, 'hospitals near me')
      return
    }

    // Create a URL with multiple waypoints (limited to first 8 for URL length)
    const waypoints = doctors.slice(0, 8).map(d => `${d.location.latitude},${d.location.longitude}`).join('|')
    const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${waypoints}`
    window.open(url, '_blank')
  }

  // Check if geolocation is supported
  static isGeolocationSupported(): boolean {
    return 'geolocation' in navigator
  }

  // Get user's current position with better error handling
  static async getCurrentPosition(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!this.isGeolocationSupported()) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          let message = 'Unable to get location'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied'
              break
            case error.POSITION_UNAVAILABLE:
              message = 'Location unavailable'
              break
            case error.TIMEOUT:
              message = 'Location request timeout'
              break
          }
          reject(new Error(message))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    })
  }
}