import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './PrivateRoute.css'

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth()

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Vérification de l'authentification...</p>
      </div>
    )
  }

  // Si pas authentifié, rediriger vers login
  if (!isAuthenticated) {
    console.log('Non authentifié, redirection vers /login')
    return <Navigate to="/login" replace />
  }

  // Si authentifié mais pas de user, attendre un peu
  if (isAuthenticated && !user) {
    return (
      <div className="auth-loading">
        <div className="spinner"></div>
        <p>Veuillez patientez...</p>
      </div>
    )
  }

  // Tout est bon, afficher le contenu
  return children
}

export default PrivateRoute
