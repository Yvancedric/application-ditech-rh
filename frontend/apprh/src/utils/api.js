import axios from 'axios'

// URL du backend - utilise la variable d'environnement ou localhost par défaut en développement
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Créer une instance axios avec configuration de base
const api = axios.create({
  baseURL: API_URL,
  timeout: 20000, // Timeout de 20 secondes par défaut pour éviter les chargements infinis
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      // Debug uniquement en développement (Vite)
      if (import.meta.env.MODE === 'development') {
        console.log('Token added to request:', config.url)
      }
    } else {
      // Avertir seulement si ce n'est pas une route publique
      const publicRoutes = ['/login', '/api/token/']
      const isPublicRoute = publicRoutes.some(route => config.url?.includes(route))
      if (!isPublicRoute && import.meta.env.MODE === 'development') {
        console.warn('No token found in localStorage for request:', config.url)
      }
    }
    
    // Si c'est un FormData, supprimer le Content-Type par défaut
    // Le navigateur le définira automatiquement avec le bon boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
      if (import.meta.env.MODE === 'development') {
        console.log('FormData détecté, Content-Type supprimé pour:', config.url)
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Logger les erreurs uniquement en développement ou pour les erreurs critiques
    if (import.meta.env.MODE === 'development' || !error.response || error.response?.status >= 500) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
    }
    
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      // Rediriger vers login si nécessaire
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    // Si c'est une erreur réseau (pas de réponse du serveur)
    if (!error.response) {
      const errorMessage = `Erreur réseau - Le serveur ne répond pas. URL du backend: ${API_URL}`
      if (import.meta.env.MODE === 'development') {
        console.error(errorMessage)
      }
    }
    
    return Promise.reject(error)
  }
)

export default api

