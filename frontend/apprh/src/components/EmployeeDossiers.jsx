import React, { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { exportToPDF, exportToExcel } from '../utils/exportUtils'
import { Users, FileText, FileSpreadsheet, X, File, CheckCircle2, XCircle, FolderOpen, Eye, Trash2 } from 'lucide-react'
import './EmployeeDossiers.css'

const EmployeeDossiers = () => {
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [services, setServices] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [dossierData, setDossierData] = useState(null)
  const [loadingDossier, setLoadingDossier] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [allDocuments, setAllDocuments] = useState([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [showAllDocuments, setShowAllDocuments] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteDocumentConfirm, setDeleteDocumentConfirm] = useState(null)
  const rowsPerPage = 10

  const stats = {
    total: employees.length,
    active: employees.filter(emp => emp.is_active).length,
    inactive: employees.filter(emp => !emp.is_active).length,
    withContracts: employees.filter(emp => emp.contracts && emp.contracts.length > 0).length,
    withDocuments: employees.filter(emp => emp.documents && emp.documents.length > 0).length
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

  const fetchAllDocuments = useCallback(async () => {
    try {
      setLoadingDocuments(true)
      const response = await api.get('/ditech/documents/')
      setAllDocuments(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des documents:', err)
      showToast('Erreur lors de la récupération des documents', 'error')
    } finally {
      setLoadingDocuments(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
    fetchServices()
    fetchAllDocuments()
  }, [fetchEmployees, fetchServices, fetchAllDocuments])

  const filterEmployees = useCallback(() => {
    let filtered = employees

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(emp =>
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(term) ||
        emp.employee_id?.toLowerCase().includes(term) ||
        emp.email?.toLowerCase().includes(term)
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
      { header: 'Poste', key: 'position', accessor: (emp) => emp.position || '-' },
      { header: 'Service', key: 'service_name', accessor: (emp) => emp.service_name || '-' },
      { header: 'Statut', key: 'is_active', accessor: (emp) => emp.is_active ? 'Actif' : 'Inactif' }
    ]
    exportToPDF(filteredEmployees, columns, 'Liste des Dossiers Employés', 'dossiers_employes')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'ID Employé', key: 'employee_id', accessor: (emp) => emp.employee_id || '-' },
      { header: 'Nom', key: 'first_name', accessor: (emp) => emp.first_name || '-' },
      { header: 'Prénom', key: 'last_name', accessor: (emp) => emp.last_name || '-' },
      { header: 'Email', key: 'email', accessor: (emp) => emp.email || '-' },
      { header: 'Poste', key: 'position', accessor: (emp) => emp.position || '-' },
      { header: 'Service', key: 'service_name', accessor: (emp) => emp.service_name || '-' },
      { header: 'Statut', key: 'is_active', accessor: (emp) => emp.is_active ? 'Actif' : 'Inactif' }
    ]
    exportToExcel(filteredEmployees, columns, 'Dossiers Employés', 'dossiers_employes')
    showToast('Export Excel en cours...', 'success')
  }

  const fetchDossier = async (employee) => {
    try {
      setLoadingDossier(true)
      setSelectedEmployee(employee)
      setActiveTab('info')
      const response = await api.get(`/ditech/employees/${employee.id}/dossier/`)
      const dossierInfo = response.data
      
      // Récupérer les documents de l'employé depuis allDocuments ou faire un appel API
      let employeeDocuments = []
      
      // D'abord, essayer d'utiliser allDocuments si disponible
      if (allDocuments && allDocuments.length > 0) {
        employeeDocuments = allDocuments.filter(doc => {
          const docEmployeeId = typeof doc.employee === 'object' ? doc.employee?.id : doc.employee
          return docEmployeeId === employee.id || 
                 doc.employee_id === employee.id || 
                 (doc.employee_detail && doc.employee_detail.id === employee.id)
        })
      }
      
      // Si aucun document trouvé dans allDocuments, essayer un appel API avec filtre
      if (employeeDocuments.length === 0) {
        try {
          const documentsResponse = await api.get('/ditech/documents/')
          if (documentsResponse.data && Array.isArray(documentsResponse.data)) {
            employeeDocuments = documentsResponse.data.filter(doc => {
              const docEmployeeId = typeof doc.employee === 'object' ? doc.employee?.id : doc.employee
              return docEmployeeId === employee.id || 
                     doc.employee_id === employee.id || 
                     (doc.employee_detail && doc.employee_detail.id === employee.id)
            })
          }
        } catch (docErr) {
          console.warn('Erreur lors de la récupération des documents:', docErr)
        }
      }
      
      // Utiliser les documents récupérés ou ceux du backend s'ils existent
      dossierInfo.documents = employeeDocuments.length > 0 ? employeeDocuments : (dossierInfo.documents || [])
      
      setDossierData(dossierInfo)
    } catch (err) {
      console.error('Erreur lors de la récupération du dossier:', err)
      showToast('Erreur lors de la récupération du dossier', 'error')
    } finally {
      setLoadingDossier(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/ditech/employees/${deleteConfirm.id}/`)
      showToast('Employé supprimé définitivement avec succès')
      setDeleteConfirm(null)
      fetchEmployees() // Recharger la liste après suppression
    } catch (err) {
      console.error('Erreur:', err)
      showToast(err.response?.data?.detail || 'Erreur lors de la suppression', 'error')
    }
  }

  const handleDeleteDocument = async () => {
    if (!deleteDocumentConfirm) return
    
    try {
      await api.delete(`/ditech/documents/${deleteDocumentConfirm.id}/`)
      showToast('Document supprimé avec succès', 'success')
      setDeleteDocumentConfirm(null)
      fetchAllDocuments() // Recharger la liste après suppression
      // Recharger aussi le dossier si un employé est sélectionné
      if (selectedEmployee) {
        fetchDossier(selectedEmployee)
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du document:', err)
      showToast(err.response?.data?.detail || 'Erreur lors de la suppression du document', 'error')
      setDeleteDocumentConfirm(null)
    }
  }

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="dossiers-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des dossiers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dossiers-page">
      <div className="page-header">
        <h1>Dossiers Employés</h1>
        <p>Voir les dossiers de chaques employés</p>
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
        <div className="stat-card stat-documents">
          <div className="stat-icon"><FolderOpen size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Avec Documents</div>
            <div className="stat-value">{stats.withDocuments}</div>
          </div>
        </div>
        <div className="stat-card stat-all-docs" onClick={() => setShowAllDocuments(!showAllDocuments)} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><File size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Tous les Documents</div>
            <div className="stat-value">{allDocuments.length}</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
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
            onClick={handleExportPDF}
            title="Exporter en PDF"
          >
            <FileText size={16} /> PDF
          </button>
          <button 
            className="btn-export btn-export-excel" 
            onClick={handleExportExcel}
            title="Exporter en Excel"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
        </div>
      </div>

      {/* Tableau */}
      {currentEmployees.length > 0 ? (
        <div className="table-container">
          <table className="dossiers-table">
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
                        className="btn-icon btn-view-icon"
                        onClick={() => fetchDossier(employee)}
                        title="Voir le dossier"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="btn-icon btn-delete-icon"
                        onClick={() => setDeleteConfirm(employee)}
                        title="Supprimer définitivement l'employé"
                      >
                        <Trash2 size={18} />
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

      {/* Dialog Dossier */}
      {selectedEmployee && (
        <div className="dialog-overlay" onClick={() => setSelectedEmployee(null)}>
          <div className="dialog-content dossier-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Dossier de {selectedEmployee?.first_name} {selectedEmployee?.last_name}</h2>
              <button className="btn-close" onClick={() => setSelectedEmployee(null)}>
                <X size={20} />
              </button>
            </div>

            {loadingDossier ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Chargement du dossier...</p>
              </div>
            ) : dossierData ? (
              <>
                {/* Tabs */}
                <div className="dossier-tabs">
                  <button
                    className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                  >
                    Informations
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'contract' ? 'active' : ''}`}
                    onClick={() => setActiveTab('contract')}
                  >
                    Contrat {dossierData.all_contracts?.length > 0 && `(${dossierData.all_contracts.length})`}
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
                    onClick={() => setActiveTab('documents')}
                  >
                    Documents {dossierData.documents?.length > 0 && `(${dossierData.documents.length})`}
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                  >
                    Historique {dossierData.history?.length > 0 && `(${dossierData.history.length})`}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="dossier-content">
                  {activeTab === 'info' && dossierData.employee && (
                    <div className="info-section">
                      <h3>Informations Personnelles</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <label>ID Employé:</label>
                          <span>{dossierData.employee.employee_id || '-'}</span>
                        </div>
                        <div className="info-item">
                          <label>ID Badge:</label>
                          <span>{dossierData.employee.badge_id || '-'}</span>
                        </div>
                        <div className="info-item">
                          <label>Nom complet:</label>
                          <span>{`${dossierData.employee.first_name || ''} ${dossierData.employee.last_name || ''}`}</span>
                        </div>
                        <div className="info-item">
                          <label>Email:</label>
                          <span>{dossierData.employee.email || '-'}</span>
                        </div>
                        <div className="info-item">
                          <label>Téléphone:</label>
                          <span>{dossierData.employee.phone || '-'}</span>
                        </div>
                        <div className="info-item">
                          <label>Adresse:</label>
                          <span>{dossierData.employee.address || '-'}</span>
                        </div>
                        <div className="info-item">
                          <label>Date de naissance:</label>
                          <span>{formatDate(dossierData.employee.date_of_birth)}</span>
                        </div>
                        <div className="info-item">
                          <label>Date d'embauche:</label>
                          <span>{formatDate(dossierData.employee.date_of_hire)}</span>
                        </div>
                        <div className="info-item">
                          <label>Poste:</label>
                          <span>{dossierData.employee.position || '-'}</span>
                        </div>
                        <div className="info-item">
                          <label>Salaire:</label>
                          <span>{formatCurrency(dossierData.employee.salary)}</span>
                        </div>
                        <div className="info-item">
                          <label>Service:</label>
                          <span>{dossierData.employee.service_name || '-'}</span>
                        </div>
                        <div className="info-item">
                          <label>Statut:</label>
                          <span className={`status-badge ${dossierData.employee.is_active ? 'active' : 'inactive'}`}>
                            {dossierData.employee.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'contract' && (
                    <div className="contract-section">
                      <h3>Contrats</h3>
                      {dossierData.active_contract && (
                        <div className="contract-card active">
                          <h4>Contrat Actif</h4>
                          <div className="contract-info">
                            <div className="info-item">
                              <label>Type:</label>
                              <span>{dossierData.active_contract.contract_type || '-'}</span>
                            </div>
                            <div className="info-item">
                              <label>Date de début:</label>
                              <span>{formatDate(dossierData.active_contract.start_date)}</span>
                            </div>
                            <div className="info-item">
                              <label>Date de fin:</label>
                              <span>{formatDate(dossierData.active_contract.end_date) || 'CDI'}</span>
                            </div>
                            <div className="info-item">
                              <label>Statut:</label>
                              <span>{dossierData.active_contract.status || '-'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {dossierData.all_contracts && dossierData.all_contracts.length > 0 && (
                        <div className="contracts-list">
                          <h4>Historique des Contrats</h4>
                          <div className="contracts-grid">
                            {dossierData.all_contracts.map((contract, index) => (
                              <div key={index} className="contract-card">
                                <div className="contract-info">
                                  <div className="info-item">
                                    <label>Type:</label>
                                    <span>{contract.contract_type || '-'}</span>
                                  </div>
                                  <div className="info-item">
                                    <label>Début:</label>
                                    <span>{formatDate(contract.start_date)}</span>
                                  </div>
                                  <div className="info-item">
                                    <label>Fin:</label>
                                    <span>{formatDate(contract.end_date) || 'CDI'}</span>
                                  </div>
                                  <div className="info-item">
                                    <label>Statut:</label>
                                    <span>{contract.status || '-'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {(!dossierData.active_contract && (!dossierData.all_contracts || dossierData.all_contracts.length === 0)) && (
                        <p className="no-data">Aucun contrat trouvé</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'documents' && (
                    <div className="documents-section">
                      <h3>Documents</h3>
                      {dossierData.documents && dossierData.documents.length > 0 ? (
                        <div className="documents-list">
                          {dossierData.documents.map((doc, index) => (
                            <div key={doc.id || index} className="document-card">
                              <div className="document-info">
                                <div className="document-icon"><File size={24} /></div>
                                <div className="document-details">
                                  <div className="document-name">
                                    {doc.document?.name || doc.document_url?.split('/').pop() || doc.description || 'Document sans nom'}
                                  </div>
                                  <div className="document-meta">
                                    <span>{doc.document_type_display || doc.document_type || 'Type inconnu'}</span>
                                    {doc.created_at && (
                                      <span>• {formatDate(doc.created_at)}</span>
                                    )}
                                    {doc.uploaded_by_username && (
                                      <span>• Par: {doc.uploaded_by_username}</span>
                                    )}
                                  </div>
                                  {doc.description && (
                                    <div className="document-description">{doc.description}</div>
                                  )}
                                </div>
                              </div>
                              <div className="document-actions">
                                {(doc.document_url || doc.document) && (
                                  <a
                                    href={doc.document_url || doc.document}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-download"
                                  >
                                    Télécharger
                                  </a>
                                )}
                                <button
                                  className="btn-icon btn-delete-icon"
                                  onClick={() => setDeleteDocumentConfirm(doc)}
                                  title="Supprimer le document"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-data">Aucun document trouvé pour cet employé</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="history-section">
                      <h3>Historique des Changements</h3>
                      {dossierData.history && dossierData.history.length > 0 ? (
                        <div className="history-list">
                          {dossierData.history.map((item, index) => (
                            <div key={index} className="history-item">
                              <div className="history-date">{formatDate(item.changed_at)}</div>
                              <div className="history-content">
                                <div className="history-type">{item.change_type_display || item.change_type}</div>
                                <div className="history-description">{item.description || '-'}</div>
                                <div className="history-details">
                                  {item.field_name && (
                                    <span><strong>Champ:</strong> {item.field_name}</span>
                                  )}
                                  {item.old_value && (
                                    <span><strong>Ancien:</strong> {item.old_value}</span>
                                  )}
                                  {item.new_value && (
                                    <span><strong>Nouveau:</strong> {item.new_value}</span>
                                  )}
                                </div>
                                {item.changed_by_name && (
                                  <div className="history-author">
                                    Par: {item.changed_by_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-data">Aucun historique trouvé</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="error-message">Erreur lors du chargement du dossier</p>
            )}
          </div>
        </div>
      )}

      {/* Section pour voir tous les documents */}
      {showAllDocuments && (
        <div className="all-documents-section">
          <div className="section-header">
            <h2>Tous les Documents</h2>
            <button className="btn-close" onClick={() => setShowAllDocuments(false)}>
              <X size={20} />
            </button>
          </div>
          {loadingDocuments ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Chargement des documents...</p>
            </div>
          ) : allDocuments.length > 0 ? (
            <div className="documents-list">
              {allDocuments.map((doc) => (
                <div key={doc.id} className="document-card">
                  <div className="document-info">
                    <div className="document-icon"><File size={24} /></div>
                    <div className="document-details">
                      <div className="document-name">
                        {doc.document?.name || doc.document_url?.split('/').pop() || doc.description || 'Document sans nom'}
                      </div>
                      <div className="document-meta">
                        <span>{doc.document_type_display || doc.document_type || 'Type inconnu'}</span>
                        {doc.created_at && (
                          <span>• {formatDate(doc.created_at)}</span>
                        )}
                        {doc.employee_full_name && (
                          <span>• Employé: {doc.employee_full_name}</span>
                        )}
                        {doc.uploaded_by_username && (
                          <span>• Par: {doc.uploaded_by_username}</span>
                        )}
                      </div>
                      {doc.description && (
                        <div className="document-description">{doc.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="document-actions">
                    {(doc.document_url || doc.document) && (
                      <a
                        href={doc.document_url || doc.document}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-download"
                      >
                        Télécharger
                      </a>
                    )}
                    <button
                      className="btn-icon btn-delete-icon"
                      onClick={() => setDeleteDocumentConfirm(doc)}
                      title="Supprimer le document"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">Aucun document trouvé</p>
          )}
        </div>
      )}

      {/* Dialog Confirmation Suppression Document */}
      {deleteDocumentConfirm && (
        <div className="dialog-overlay" onClick={() => setDeleteDocumentConfirm(null)}>
          <div className="dialog-content delete-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Confirmer la suppression</h2>
            <p>
              Êtes-vous sûr de vouloir supprimer le document{' '}
              <strong>
                {deleteDocumentConfirm.document?.name || 
                 deleteDocumentConfirm.document_url?.split('/').pop() || 
                 deleteDocumentConfirm.description || 
                 'Document'}
              </strong> ?
            </p>
            <p className="warning-text">
              <strong className="attention-text">Attention :</strong> Cette action est irréversible. Le document sera définitivement supprimé.
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteDocumentConfirm(null)}
              >
                Annuler
              </button>
              <button type="button" className="btn-danger" onClick={handleDeleteDocument}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Confirmation Suppression */}
      {deleteConfirm && (
        <div className="dialog-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="dialog-content delete-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Confirmer la suppression définitive</h2>
            <p>
              Êtes-vous sûr de vouloir supprimer définitivement l'employé{' '}
              <strong>{`${deleteConfirm.first_name} ${deleteConfirm.last_name}`}</strong> ?
            </p>
            <p className="warning-text">
              <strong>Attention :</strong> Cette action est irréversible. L'employé et toutes ses données (contrats, documents, historique, etc.) seront définitivement supprimés de la base de données. Cette action ne peut pas être annulée.
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
                Supprimer définitivement
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

export default EmployeeDossiers
