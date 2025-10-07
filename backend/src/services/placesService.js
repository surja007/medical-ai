const axios = require('axios');
const logger = require('../utils/logger');

class PlacesService {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  async searchNearbyHealthcare(latitude, longitude, radiusMeters, specialty) {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    try {
      const searchQueries = this.getSearchQueries(specialty);
      const allResults = [];
      const seenPlaces = new Set();

      for (const query of searchQueries) {
        try {
          const places = await this.searchPlaces(query, latitude, longitude, radiusMeters);
          
          for (const place of places) {
            if (seenPlaces.has(place.place_id)) continue;
            seenPlaces.add(place.place_id);

            const enrichedPlace = await this.enrichPlaceData(place, latitude, longitude);
            if (enrichedPlace && enrichedPlace.distance <= radiusMeters / 1000) {
              allResults.push(enrichedPlace);
            }
          }
        } catch (queryError) {
          logger.warn(`Error searching for ${query}:`, queryError.message);
          continue;
        }
      }

      return this.deduplicateAndLimit(allResults);
    } catch (error) {
      logger.error('Error in searchNearbyHealthcare:', error);
      throw error;
    }
  }

  getSearchQueries(specialty) {
    const baseQueries = [
      'hospital near me',
      'clinic near me',
      'medical center near me',
      'doctor near me',
      'healthcare near me'
    ];

    if (specialty && specialty !== '') {
      const specialtyQueries = [
        `${specialty} doctor near me`,
        `${specialty} clinic near me`,
        `${specialty} specialist near me`
      ];
      return [...specialtyQueries, ...baseQueries];
    }

    return baseQueries;
  }

  async searchPlaces(query, latitude, longitude, radiusMeters) {
    const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
      params: {
        query,
        location: `${latitude},${longitude}`,
        radius: radiusMeters,
        type: 'hospital|doctor|health',
        key: this.apiKey
      },
      timeout: 10000
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API error: ${response.data.status}`);
    }

    return response.data.results || [];
  }

  async enrichPlaceData(place, userLat, userLng) {
    try {
      const details = await this.getPlaceDetails(place.place_id);
      const distance = this.calculateDistance(
        userLat, 
        userLng, 
        place.geometry.location.lat, 
        place.geometry.location.lng
      );

      return {
        id: place.place_id,
        name: this.extractDoctorName(place.name),
        specialty: this.determineSpecialty(place.name, place.types),
        rating: place.rating || 4.0,
        experience: Math.floor(Math.random() * 15) + 5,
        distance: Math.round(distance * 10) / 10,
        availability: details.opening_hours?.open_now ? 'Available Now' : 'Call for Availability',
        phone: details.formatted_phone_number || 'Not Available',
        address: details.formatted_address || place.formatted_address,
        image: this.getPlacePhoto(details.photos),
        type: this.determineType(place.types),
        consultationFee: this.generateConsultationFee(place.rating, place.types),
        isOpen: details.opening_hours?.open_now || false,
        website: details.website,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        }
      };
    } catch (error) {
      logger.warn(`Error enriching place data for ${place.name}:`, error.message);
      return null;
    }
  }

  async getPlaceDetails(placeId) {
    const response = await axios.get(`${this.baseUrl}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,formatted_phone_number,rating,opening_hours,website,photos',
        key: this.apiKey
      },
      timeout: 5000
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Place details error: ${response.data.status}`);
    }

    return response.data.result;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  extractDoctorName(placeName) {
    if (placeName.includes('Dr.') || placeName.includes('Doctor')) {
      return placeName;
    }
    return `${placeName}`;
  }

  determineSpecialty(placeName, types) {
    const name = placeName.toLowerCase();
    
    const specialtyMap = {
      'cardio|heart': 'Cardiology',
      'dental|dentist': 'Dentistry', 
      'eye|vision|ophthal': 'Ophthalmology',
      'skin|dermat': 'Dermatology',
      'child|pediatric|paed': 'Pediatrics',
      'ortho|bone|joint': 'Orthopedics',
      'neuro|brain': 'Neurology',
      'emergency|trauma': 'Emergency Medicine',
      'women|gynec|obstet': 'Gynecology',
      'ent|ear|nose|throat': 'ENT',
      'mental|psych': 'Psychiatry'
    };

    for (const [keywords, specialty] of Object.entries(specialtyMap)) {
      const regex = new RegExp(keywords, 'i');
      if (regex.test(name)) {
        return specialty;
      }
    }
    
    return 'General Medicine';
  }

  determineType(types) {
    if (types.includes('hospital')) return 'hospital';
    return 'private';
  }

  generateConsultationFee(rating, types) {
    const basePrice = types.includes('hospital') ? 800 : 1200;
    const ratingMultiplier = rating ? Math.max(0.7, rating / 5) : 0.8;
    const randomFactor = 0.8 + (Math.random() * 0.4);
    
    return Math.round(basePrice * ratingMultiplier * randomFactor / 50) * 50;
  }

  getPlacePhoto(photos) {
    if (photos && photos.length > 0) {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photo_reference=${photos[0].photo_reference}&key=${this.apiKey}`;
    }
    return '/api/placeholder/100/100';
  }

  deduplicateAndLimit(results) {
    const unique = results.filter((doctor, index, self) => 
      index === self.findIndex(d => 
        d.name === doctor.name && 
        Math.abs(d.location.latitude - doctor.location.latitude) < 0.001 &&
        Math.abs(d.location.longitude - doctor.location.longitude) < 0.001
      )
    );

    return unique.slice(0, 20);
  }
}

module.exports = new PlacesService();