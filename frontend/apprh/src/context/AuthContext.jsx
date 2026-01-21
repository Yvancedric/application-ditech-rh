import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import api from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token')) // Changé de 'access_token' à 'token'

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token')
      
      if (storedToken) {
        // Vérifier si le token est valide en faisant une requête test
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
          
          // Récupérer les données utilisateur depuis localStorage
          const userData = localStorage.getItem('user')
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData)
              setUser(parsedUser)
              setToken(storedToken)
            } catch (e) {
              console.error('Erreur parsing user:', e)
              // Si erreur de parsing, nettoyer et rediriger vers login
              localStorage.removeItem('token')
              localStorage.removeItem('refresh_token')
              localStorage.removeItem('user')
              setToken(null)
              setUser(null)
            }
          } else {
            // Si pas de userData, décoder le token
            try {
              const tokenParts = storedToken.split('.')
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]))
                const decodedUser = {
                  username: payload.username || '',
                  email: payload.email || '',
                  role: payload.role || 'employe',
                  user_id: payload.user_id
                }
                localStorage.setItem('user', JSON.stringify(decodedUser))
                setUser(decodedUser)
                setToken(storedToken)
              }
            } catch (decodeError) {
              console.error('Erreur décodage token:', decodeError)
              localStorage.removeItem('token')
              localStorage.removeItem('refresh_token')
              localStorage.removeItem('user')
              setToken(null)
              setUser(null)
            }
          }
        } catch (error) {
          console.error('Erreur initialisation auth:', error)
          // En cas d'erreur, nettoyer et considérer comme non authentifié
          localStorage.removeItem('token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')
          delete axios.defaults.headers.common['Authorization']
          setToken(null)
          setUser(null)
        }
      } else {
        // Pas de token, s'assurer que tout est nettoyé
        delete axios.defaults.headers.common['Authorization']
        setToken(null)
        setUser(null)
      }
      
      setLoading(false)
    }
    
    initializeAuth()
  }, [])

  const login = async (username, password) => {
    try {
      // Utiliser l'endpoint /ditech/login/ qui retourne access, refresh et user
      const response = await api.post('/ditech/login/', {
        username,
        password,
      })
      
      const { access, refresh, user: userData } = response.data
      
      if (!access) {
        throw new Error('Token non reçu du serveur')
      }
      
      // Stocker les tokens
      localStorage.setItem('token', access)
      localStorage.setItem('refresh_token', refresh)
      
      // Si userData est fourni directement par le backend, l'utiliser
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
      } else {
        // Sinon, décoder le JWT pour obtenir les infos utilisateur
        try {
          const tokenParts = access.split('.')
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            const decodedUser = {
              username: payload.username || username,
              email: payload.email || '',
              role: payload.role || 'employe',
              user_id: payload.user_id || payload.user_id
            }
            localStorage.setItem('user', JSON.stringify(decodedUser))
            setUser(decodedUser)
          }
        } catch (decodeError) {
          console.warn('Erreur décodage JWT:', decodeError)
          // Fallback : créer un user minimal
          const fallbackUser = {
            username: username,
            email: '',
            role: 'employe'
          }
          localStorage.setItem('user', JSON.stringify(fallbackUser))
          setUser(fallbackUser)
        }
      }
      
      // Configurer l'header axios pour les prochaines requêtes
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`
      setToken(access)
      
      return { success: true }
    } catch (error) {
      console.error('Erreur de connexion:', error)
      return {
        success: false,
        error: error.response?.data?.error || 
               error.response?.data?.detail || 
               error.message || 
               'Erreur de connexion',
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token') // Changé de 'access_token' à 'token'
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!token, // Changé de !!user à !!token (plus fiable)
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}