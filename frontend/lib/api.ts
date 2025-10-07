import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get('accessToken')
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = Cookies.get('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken
          })
          
          const { accessToken } = response.data
          Cookies.set('accessToken', accessToken, { expires: 1/96, secure: true, sameSite: 'strict' })
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove('accessToken')
        Cookies.remove('refreshToken')
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }

    if (error.response?.status === 401) {
      // Token refresh failed or no refresh token
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
      window.location.href = '/auth/login'
    }

    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: any) =>
    api.post('/auth/register', userData),
  
  getProfile: () =>
    api.get('/auth/me'),
  
  logout: () =>
    api.post('/auth/logout'),
}

export const symptomsAPI = {
  analyze: (data: any) =>
    api.post('/symptoms/analyze', data),
  
  getHistory: (params?: any) =>
    api.get('/symptoms/history', { params }),
  
  getAnalysis: (id: string) =>
    api.get(`/symptoms/${id}`),
}

export const imagesAPI = {
  analyze: (formData: FormData) =>
    api.post('/images/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60 seconds for image analysis
    }),
  
  getHistory: (params?: any) =>
    api.get('/images/history', { params }),
  
  getAnalysis: (id: string) =>
    api.get(`/images/${id}`),
}

export const wearableAPI = {
  connectDevice: (deviceData: any) =>
    api.post('/wearables/connect', deviceData),
  
  getDevices: () =>
    api.get('/wearables/devices'),
  
  getHealthData: (params?: any) =>
    api.get('/wearables/health-data', { params }),
  
  submitHealthData: (data: any) =>
    api.post('/wearables/data', data),
  
  getAnalytics: (dataType: string, days: number) =>
    api.get('/wearables/analytics', { params: { dataType, days } }),
  
  disconnectDevice: (deviceId: string) =>
    api.delete(`/wearables/devices/${deviceId}`),
}

export const assistantAPI = {
  chat: (message: string, context?: any) =>
    api.post('/assistant/chat', { message, context }),
  
  getChatHistory: (params?: any) =>
    api.get('/assistant/history', { params }),
}

export const communicationAPI = {
  getDoctors: (params?: any) =>
    api.get('/communication/doctors', { params }),
  
  searchDoctorsByLocation: (latitude: number, longitude: number, params?: any) =>
    api.get('/communication/doctors', { 
      params: { 
        latitude, 
        longitude, 
        ...params 
      } 
    }),
  
  requestConsultation: (data: any) =>
    api.post('/communication/consultation', data),
  
  getConsultations: (params?: any) =>
    api.get('/communication/consultations', { params }),
  
  sendEmergencyAlert: (data: any) =>
    api.post('/communication/emergency', data),
}

export const familyAPI = {
  createFamilyGroup: (data: any) =>
    api.post('/family/groups', data),
  
  getFamilyGroups: () =>
    api.get('/family/groups'),
  
  getFamilyGroup: (groupId: string) =>
    api.get(`/family/groups/${groupId}`),
  
  inviteFamilyMember: (groupId: string, data: any) =>
    api.post(`/family/groups/${groupId}/invite`, data),
  
  respondToInvitation: (invitationId: string, response: 'accept' | 'decline') =>
    api.post(`/family/invitations/${invitationId}/respond`, { response }),
  
  getFamilyHealthOverview: (groupId: string, days?: number) =>
    api.get(`/family/groups/${groupId}/health-overview`, { params: { days } }),
  
  getAlerts: (groupId?: string, params?: any) =>
    groupId 
      ? api.get(`/family/groups/${groupId}/alerts`, { params })
      : api.get('/family/alerts', { params }),
  
  resolveAlert: (alertId: string, data: any) =>
    api.put(`/family/alerts/${alertId}/resolve`, data),
  
  updateGroupSettings: (groupId: string, settings: any) =>
    api.put(`/family/groups/${groupId}/settings`, settings),
  
  updateMemberPermissions: (groupId: string, memberId: string, permissions: any) =>
    api.put(`/family/groups/${groupId}/members/${memberId}/permissions`, { permissions }),
  
  removeFamilyMember: (groupId: string, memberId: string) =>
    api.delete(`/family/groups/${groupId}/members/${memberId}`),
}

export const searchHistoryAPI = {
  saveSearch: (data: any) =>
    api.post('/search-history', data),
  
  getHistory: (params?: any) =>
    api.get('/search-history', { params }),
  
  getAnalytics: (params?: any) =>
    api.get('/search-history/analytics', { params }),
  
  getRecentByType: (type: string, params?: any) =>
    api.get(`/search-history/recent/${type}`, { params }),
  
  deleteSearch: (id: string) =>
    api.delete(`/search-history/${id}`),
  
  clearHistory: (type?: string) =>
    api.delete('/search-history', { params: type ? { type } : {} }),
}