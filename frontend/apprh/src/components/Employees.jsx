import React, { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { exportToPDF, exportToExcel } from '../utils/exportUtils'
import { Users, CheckCircle2, XCircle, FileText, FileSpreadsheet, Plus, Pencil, Trash2, X } from 'lucide-react'
import './Employees.css'

const Employees = () => {
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [services, setServices] = useState([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formData, setFormData] = useState({
    badge_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    date_of_hire: '',
    position: '',
    salary: '',
    service: ''
  })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  const stats = {
    total: employees.length,
    active: employees.filter(emp => emp.is_active).length,
    inactive: employees.filter(emp => !emp.is_active).length,
    withContracts: employees.filter(emp => emp.contracts && emp.contracts.length > 0).length
  }

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/employees/')
      setEmployees(response.data)
      setFilteredEmployees(response.data)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération des employés:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la récupération des employés'
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

  const fetchServices = useCallback(async () => {
    try {
      const response = await api.get('/ditech/services/')
      setServices(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des services:', err)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
    fetchServices()
  }, [fetchEmployees, fetchServices])

  const filterEmployees = useCallback(() => {
    // Filtrer par défaut pour ne montrer que les employés actifs
    let filtered = employees.filter(emp => emp.is_active === true)

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(emp =>
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(term) ||
        emp.employee_id?.toLowerCase().includes(term) ||
        emp.email?.toLowerCase().includes(term) ||
        emp.position?.toLowerCase().includes(term)
      )
    }

    if (selectedService) {
      filtered = filtered.filter(emp => 
        emp.service === parseInt(selectedService)
      )
    }

    setFilteredEmployees(filtered)
    setCurrentPage(1)
  }, [employees, searchTerm, selectedService])

  useEffect(() => {
    filterEmployees()
  }, [filterEmployees])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleServiceChange = (e) => {
    setSelectedService(e.target.value)
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'ID Employé', key: 'employee_id', accessor: (emp) => emp.employee_id || '-' },
      { header: 'Nom', key: 'first_name', accessor: (emp) => emp.first_name || '-' },
      { header: 'Prénom', key: 'last_name', accessor: (emp) => emp.last_name || '-' },
      { header: 'Email', key: 'email', accessor: (emp) => emp.email || '-' },
      { header: 'Téléphone', key: 'phone', accessor: (emp) => emp.phone || '-' },
      { header: 'Poste', key: 'position', accessor: (emp) => emp.position || '-' },
      { header: 'Service', key: 'service_name', accessor: (emp) => emp.service_name || '-' },
      { header: 'Salaire', key: 'salary', accessor: (emp) => emp.salary ? `${parseFloat(emp.salary).toLocaleString('fr-FR')} FCFA` : '-' },
      { header: 'Date embauche', key: 'date_of_hire', accessor: (emp) => emp.date_of_hire || '-' },
      { header: 'Statut', key: 'is_active', accessor: (emp) => emp.is_active ? 'Actif' : 'Inactif' }
    ]
    exportToPDF(filteredEmployees, columns, 'Liste des Employés', 'employes')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'ID Employé', key: 'employee_id', accessor: (emp) => emp.employee_id || '-' },
      { header: 'Nom', key: 'first_name', accessor: (emp) => emp.first_name || '-' },
      { header: 'Prénom', key: 'last_name', accessor: (emp) => emp.last_name || '-' },
      { header: 'Email', key: 'email', accessor: (emp) => emp.email || '-' },
      { header: 'Téléphone', key: 'phone', accessor: (emp) => emp.phone || '-' },
      { header: 'Poste', key: 'position', accessor: (emp) => emp.position || '-' },
      { header: 'Service', key: 'service_name', accessor: (emp) => emp.service_name || '-' },
      { header: 'Salaire', key: 'salary', accessor: (emp) => emp.salary ? parseFloat(emp.salary) : '-' },
      { header: 'Date embauche', key: 'date_of_hire', accessor: (emp) => emp.date_of_hire || '-' },
      { header: 'Statut', key: 'is_active', accessor: (emp) => emp.is_active ? 'Actif' : 'Inactif' }
    ]
    exportToExcel(filteredEmployees, columns, 'Employés', 'employes')
    showToast('Export Excel en cours...', 'success')
  }

  const openAddDialog = () => {
    setEditingEmployee(null)
    setFormData({
      badge_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      date_of_birth: '',
      date_of_hire: '',
      position: '',
      salary: '',
      service: ''
    })
    setShowDialog(true)
  }

  const openEditDialog = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      badge_id: employee.badge_id || '',
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      date_of_birth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '',
      date_of_hire: employee.date_of_hire ? employee.date_of_hire.split('T')[0] : '',
      position: employee.position || '',
      salary: employee.salary || '',
      service: employee.service?.id || employee.service || ''
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Préparer les données à envoyer
      const dataToSend = {
        badge_id: formData.badge_id || null,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || '',
        date_of_birth: formData.date_of_birth || null,
        date_of_hire: formData.date_of_hire,
        position: formData.position,
        salary: formData.salary ? parseFloat(formData.salary) : 0,
        service: formData.service && formData.service !== '' ? parseInt(formData.service) : null
      }

      if (editingEmployee) {
        await api.put(`/ditech/employees/${editingEmployee.id}/`, dataToSend)
        showToast('Employé modifié avec succès')
      } else {
        await api.post('/ditech/employees/', dataToSend)
        showToast('Employé créé avec succès')
      }
      setShowDialog(false)
      fetchEmployees()
    } catch (err) {
      console.error('Erreur:', err)
      console.error('Réponse erreur:', err.response?.data)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error || 
                          (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : 'Erreur lors de l\'opération')
      showToast(errorMessage, 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/ditech/employees/${deleteConfirm.id}/`)
      showToast('Employé désactivé avec succès')
      setDeleteConfirm(null)
      fetchEmployees()
    } catch (err) {
      console.error('Erreur:', err)
      showToast(err.response?.data?.detail || 'Erreur lors de la désactivation', 'error')
    }
  }

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="employees-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des employés...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="employees-page">
      <div className="page-header">
        <h1>Gestion des Employés</h1>
        <p>Gerez les employés</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon"><Users size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Employés</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-icon"><CheckCircle2 size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Actifs</div>
            <div className="stat-value">{stats.active}</div>
          </div>
        </div>
        <div className="stat-card stat-inactive">
          <div className="stat-icon"><XCircle size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Inactifs</div>
            <div className="stat-value">{stats.inactive}</div>
          </div>
        </div>
        <div className="stat-card stat-contracts">
          <div className="stat-icon"><FileText size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Avec Contrats</div>
            <div className="stat-value">{stats.withContracts}</div>
          </div>
        </div>
      </div>

      {/* Filtres et Actions */}
      <div className="filters-section">
        <div className="filters-left">
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={searchTerm}
            onChange={handleSearch}
            className="filter-input"
          />
          <select
            value={selectedService}
            onChange={handleServiceChange}
            className="filter-select"
          >
            <option value="">Tous les services</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filters-actions">
          <button 
            className="btn-export btn-export-pdf" 
            onClick={() => handleExportPDF()}
            title="Exporter en PDF"
          >
            <FileText size={16} /> PDF
          </button>
          <button 
            className="btn-export btn-export-excel" 
            onClick={() => handleExportExcel()}
            title="Exporter en Excel"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button className="btn-primary" onClick={openAddDialog}>
            <Plus size={16} /> Ajouter un employé
          </button>
        </div>
      </div>

      {/* Tableau */}
      {currentEmployees.length > 0 ? (
        <div className="table-container">
          <table className="employees-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom complet</th>
                <th>Email</th>
                <th>Poste</th>
                <th>Service</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentEmployees.map(employee => (
                <tr key={employee.id}>
                  <td>{employee.employee_id}</td>
                  <td>{`${employee.first_name} ${employee.last_name}`}</td>
                  <td>{employee.email}</td>
                  <td>{employee.position}</td>
                  <td>{employee.service_name || '-'}</td>
                  <td>
                    <span className={`status-badge ${employee.is_active ? 'active' : 'inactive'}`}>
                      {employee.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-edit"
                        onClick={() => openEditDialog(employee)}
                        title="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                                  <button
                        className="btn-delete"
                        onClick={() => setDeleteConfirm(employee)}
                        title="Désactiver l'employé"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
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
          <p>Aucun employé trouvé</p>
        </div>
      )}

      {/* Dialog Ajout/Modification */}
      {showDialog && (
        <div className="dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="dialog dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>{editingEmployee ? 'Modifier l\'employé' : 'Ajouter un employé'}</h2>
              <button className="btn-close" onClick={() => setShowDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="dialog-form">
              <div className="form-row">
                <div className="form-group">
                  <label>ID Badge</label>
                  <input
                    type="text"
                    value={formData.badge_id}
                    onChange={(e) => setFormData({ ...formData, badge_id: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Prénom *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Adresse</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date de naissance</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Date d'embauche</label>
                  <input
                    type="date"
                    value={formData.date_of_hire}
                    onChange={(e) => setFormData({ ...formData, date_of_hire: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Poste *</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Salaire</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Service</label>
                  <select
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  >
                    <option value="">Sélectionner un service</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDialog(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {editingEmployee ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Confirmation Suppression */}
      {deleteConfirm && (
        <div className="dialog-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="dialog delete-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Confirmer la désactivation</h2>
            <p>
              Êtes-vous sûr de vouloir désactiver l'employé{' '}
              <strong>{`${deleteConfirm.first_name} ${deleteConfirm.last_name}`}</strong> ?
            </p>
            <p className="warning-text">
              L'employé sera marqué comme inactif et ne sera plus visible dans la liste principale, mais ses données seront conservées.
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Annuler
              </button>
              <button type="button" className="btn-danger" onClick={handleDelete}>
                Désactiver
              </button>
            </div>
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

export default Employees
