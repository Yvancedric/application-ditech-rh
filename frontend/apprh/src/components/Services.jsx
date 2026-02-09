import React, { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { Building2, Plus, X } from 'lucide-react'
import './Services.css'

const Services = () => {
  const [services, setServices] = useState([])
  const [filteredServices, setFilteredServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: ''
  })
  const [users, setUsers] = useState([])
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/services/')
      // Log temporaire pour déboguer
      if (import.meta.env.MODE === 'development') {
        console.log('Services récupérés:', response.data)
        response.data.forEach(service => {
          console.log(`Service: ${service.name}, Manager ID: ${service.manager}, Manager Name: ${service.manager_name}`)
        })
      }
      setServices(response.data)
      setFilteredServices(response.data)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération des services:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la récupération des services'
      setError(errorMessage)
      console.error('Détails de l\'erreur:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      // Récupérer les employés pour avoir leurs utilisateurs associés
      const response = await api.get('/ditech/employees/')
      const employees = response.data || []
      
      // Extraire les utilisateurs uniques
      const uniqueUsers = []
      const userIds = new Set()
      
      employees.forEach(emp => {
        if (emp.user && emp.user.id && !userIds.has(emp.user.id)) {
          userIds.add(emp.user.id)
          uniqueUsers.push({
            id: emp.user.id,
            username: emp.user.username || '',
            first_name: emp.user.first_name || '',
            last_name: emp.user.last_name || '',
            email: emp.user.email || ''
          })
        }
      })
      
      setUsers(uniqueUsers)
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err)
      setUsers([])
    }
  }, [])

  useEffect(() => {
    fetchServices()
    fetchUsers()
  }, [fetchServices, fetchUsers])

  const filterServices = useCallback(() => {
    let filtered = services

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(service =>
        service.name?.toLowerCase().includes(term) ||
        service.description?.toLowerCase().includes(term) ||
        service.manager_name?.toLowerCase().includes(term)
      )
    }

    setFilteredServices(filtered)
    setCurrentPage(1)
  }, [services, searchTerm])

  useEffect(() => {
    filterServices()
  }, [filterServices])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const openAddDialog = () => {
    setFormData({
      name: '',
      description: '',
      manager: ''
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSend = {
        name: formData.name,
        description: formData.description || ''
      }
      if (formData.manager && formData.manager !== '') {
        const managerId = parseInt(formData.manager)
        if (!isNaN(managerId)) {
          dataToSend.manager = managerId
        }
      }
      await api.post('/ditech/services/', dataToSend)
      showToast('Service créé avec succès')
      setShowDialog(false)
      fetchServices()
    } catch (err) {
      console.error('Erreur:', err)
      const errorMessage = err.response?.data?.detail ||
        err.response?.data?.message ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : 'Erreur lors de l\'opération')
      showToast(errorMessage, 'error')
    }
  }

  const totalPages = Math.ceil(filteredServices.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentServices = filteredServices.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="services-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des services...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="services-page">
      <div className="page-header">
        <h1>Gestion des Services</h1>
        <p>Gerez les services</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistique */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon"><Building2 size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Services</div>
            <div className="stat-value">{services.length}</div>
          </div>
        </div>
      </div>

      {/* Filtres et Actions */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="Rechercher un service..."
          value={searchTerm}
          onChange={handleSearch}
          className="filter-input"
        />
        <button className="btn-primary" onClick={openAddDialog}>
          <Plus size={16} /> Ajouter un service
        </button>
      </div>

      {/* Tableau */}
      {currentServices.length > 0 ? (
        <div className="table-container">
          <table className="services-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Manager</th>
                <th>Nombre d'employés</th>
              </tr>
            </thead>
            <tbody>
              {currentServices.map(service => (
                <tr key={service.id}>
                  <td>{service.name}</td>
                  <td>{service.description || '-'}</td>
                  <td>{service.manager_name && service.manager_name.trim() !== '' ? service.manager_name : '-'}</td>
                  <td>{service.employee_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                ««
              </button>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                «
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                »
              </button>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                »»
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucun service trouvé</p>
        </div>
      )}

      {/* Dialog Ajout/Modification */}
      {showDialog && (
        <div className="dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="dialog dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Ajouter un service</h2>
              <button className="btn-close" onClick={() => setShowDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="dialog-form">
              <div className="form-group">
                <label>Nom du service *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>Manager</label>
                <select
                  value={formData.manager || ''}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                >
                  <option value="">-- Aucun manager --</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}` 
                        : user.username || user.email || `User ${user.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDialog(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default Services
