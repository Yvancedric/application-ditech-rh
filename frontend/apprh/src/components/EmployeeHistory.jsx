import React, { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { History, Search, Users } from 'lucide-react'
import './EmployeeHistory.css'

const EmployeeHistory = () => {
  const [history, setHistory] = useState([])
  const [filteredHistory, setFilteredHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedChangeType, setSelectedChangeType] = useState('')
  const [employees, setEmployees] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  const changeTypes = [
    { value: '', label: 'Tous les types' },
    { value: 'POSITION', label: 'Changement de poste' },
    { value: 'SALARY', label: 'Changement de salaire' },
    { value: 'SERVICE', label: 'Changement de service' },
    { value: 'CONTRACT', label: 'Changement de contrat' },
    { value: 'STATUS', label: 'Changement de statut' },
    { value: 'INFO', label: 'Modification d\'information' },
    { value: 'OTHER', label: 'Autre' }
  ]

  const stats = {
    total: history.length,
    filtered: filteredHistory.length,
    employees: new Set(history.map(h => h.employee_id)).size
  }

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/employee-history/')
      setHistory(response.data)
      setFilteredHistory(response.data)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la récupération de l\'historique'
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

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/ditech/employees/')
      setEmployees(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des employés:', err)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
    fetchEmployees()
  }, [fetchHistory, fetchEmployees])

  const filterHistory = useCallback(() => {
    let filtered = history

    if (selectedEmployee) {
      filtered = filtered.filter(item => 
        item.employee === parseInt(selectedEmployee)
      )
    }

    if (selectedChangeType) {
      filtered = filtered.filter(item => 
        item.change_type === selectedChangeType
      )
    }

    setFilteredHistory(filtered)
    setCurrentPage(1)
  }, [history, selectedEmployee, selectedChangeType])

  useEffect(() => {
    filterHistory()
  }, [filterHistory])

  const handleEmployeeChange = (e) => {
    setSelectedEmployee(e.target.value)
  }

  const handleChangeTypeChange = (e) => {
    setSelectedChangeType(e.target.value)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getChangeTypeLabel = (type) => {
    const typeObj = changeTypes.find(t => t.value === type)
    return typeObj ? typeObj.label : type
  }

  const getChangeTypeColor = (type) => {
    const colors = {
      'POSITION': '#3b82f6',
      'SALARY': '#10b981',
      'SERVICE': '#f59e0b',
      'CONTRACT': '#8b5cf6',
      'STATUS': '#ef4444',
      'INFO': '#6b7280',
      'OTHER': '#9ca3af'
    }
    return colors[type] || '#6b7280'
  }

  const totalPages = Math.ceil(filteredHistory.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentHistory = filteredHistory.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="history-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="history-page">
      <div className="page-header">
        <h1>Historique des Changements</h1>
        <p>Suivi de tous les changements</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon"><History size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Changements</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon"><Search size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Résultats Filtrés</div>
            <div className="stat-value">{stats.filtered}</div>
          </div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon"><Users size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Employés Concernés</div>
            <div className="stat-value">{stats.employees}</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filters-left">
          <select
            value={selectedEmployee}
            onChange={handleEmployeeChange}
            className="filter-select"
          >
            <option value="">Tous les employés</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {`${emp.first_name} ${emp.last_name} (${emp.employee_id})`}
              </option>
            ))}
          </select>
          <select
            value={selectedChangeType}
            onChange={handleChangeTypeChange}
            className="filter-select"
          >
            {changeTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau */}
      {currentHistory.length > 0 ? (
        <div className="table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employé</th>
                <th>Type</th>
                <th>Champ</th>
                <th>Ancien</th>
                <th>Nouveau</th>
                <th>Description</th>
                <th>Modifié par</th>
              </tr>
            </thead>
            <tbody>
              {currentHistory.map(item => (
                <tr key={item.id}>
                  <td>{formatDate(item.changed_at)}</td>
                  <td>
                    <div className="employee-info">
                      <span className="employee-name">{item.employee_name || '-'}</span>
                      {item.employee_id && (
                        <span className="employee-id">({item.employee_id})</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span 
                      className="change-type-badge"
                      style={{ 
                        backgroundColor: `${getChangeTypeColor(item.change_type)}20`,
                        color: getChangeTypeColor(item.change_type),
                        borderColor: getChangeTypeColor(item.change_type)
                      }}
                    >
                      {getChangeTypeLabel(item.change_type)}
                    </span>
                  </td>
                  <td>{item.field_name || '-'}</td>
                  <td>
                    <span className="old-value">{item.old_value || '-'}</span>
                  </td>
                  <td>
                    <span className="new-value">{item.new_value || '-'}</span>
                  </td>
                  <td>
                    <span className="description">{item.description || '-'}</span>
                  </td>
                  <td>{item.changed_by_name || item.changed_by || '-'}</td>
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
          <p>Aucun historique trouvé</p>
        </div>
      )}
    </div>
  )
}

export default EmployeeHistory
