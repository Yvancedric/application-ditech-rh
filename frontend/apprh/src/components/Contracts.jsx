import React, { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { exportToPDF, exportToExcel } from '../utils/exportUtils'
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, Briefcase, FileText as FileIcon, GraduationCap, Hourglass, FileText, FileSpreadsheet, Plus, Pencil, Trash2, X, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import './Contracts.css'

const Contracts = () => {
  const [contracts, setContracts] = useState([])
  const [filteredContracts, setFilteredContracts] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    employee: '',
    contract_type: 'CDI',
    start_date: '',
    end_date: '',
    salary: '',
    position: '',
    status: 'DRAFT',
    auto_renewal: false,
    renewal_notice_days: 30,
    notes: ''
  })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterContractType, setFilterContractType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [showExpiringOnly, setShowExpiringOnly] = useState(false)

  // Calcul des statistiques - doit être recalculé à chaque changement de contracts
  const stats = React.useMemo(() => {
    if (!contracts || contracts.length === 0) {
      return {
        total: 0,
        active: 0,
        expiring: 0,
        expired: 0,
        cdi: 0,
        cdd: 0,
        stage: 0,
        interim: 0
      }
    }
    
    const expiringCount = contracts.filter(c => {
      const isExpiring = (c.is_expiring_soon || c.needs_renewal) && !c.auto_renewal
      if (import.meta.env.MODE === 'development' && isExpiring) {
        console.log('Contrat à renouveler trouvé:', {
          employee: c.employee_name,
          type: c.contract_type,
          end_date: c.end_date,
          is_expiring_soon: c.is_expiring_soon,
          needs_renewal: c.needs_renewal,
          auto_renewal: c.auto_renewal
        })
      }
      return isExpiring
    }).length
    
    return {
      total: contracts.length,
      active: contracts.filter(c => c.status === 'SIGNED').length,
      expiring: expiringCount,
      expired: contracts.filter(c => c.is_expired || c.status === 'EXPIRED').length,
      cdi: contracts.filter(c => c.contract_type === 'CDI').length,
      cdd: contracts.filter(c => c.contract_type === 'CDD').length,
      stage: contracts.filter(c => c.contract_type === 'STAGE').length,
      interim: contracts.filter(c => c.contract_type === 'INTERIM').length
    }
  }, [contracts])

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/contracts/')
      const contractsData = response.data || []
      setContracts(contractsData)
      setFilteredContracts(contractsData)
      setError(null)
      
      if (import.meta.env.MODE === 'development') {
        console.log('Contrats récupérés:', contractsData.length)
        const expiringContracts = contractsData.filter(c => (c.is_expiring_soon || c.needs_renewal) && !c.auto_renewal)
        console.log('Contrats à renouveler (sans auto_renewal):', expiringContracts.length)
        if (expiringContracts.length > 0) {
          console.log('Détails des contrats à renouveler:', expiringContracts.map(c => ({
            employee: c.employee_name,
            type: c.contract_type,
            end_date: c.end_date,
            is_expiring_soon: c.is_expiring_soon,
            needs_renewal: c.needs_renewal,
            auto_renewal: c.auto_renewal
          })))
        }
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des contrats:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la récupération des contrats'
      setError(errorMessage)
      setContracts([])
      setFilteredContracts([])
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

  const filterContracts = useCallback(() => {
    let filtered = [...contracts]

    // Filtre de recherche globale
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(contract =>
        contract.employee_name?.toLowerCase().includes(term) ||
        contract.position?.toLowerCase().includes(term) ||
        contract.contract_type_display?.toLowerCase().includes(term) ||
        contract.status_display?.toLowerCase().includes(term)
      )
    }

    // Filtre par type de contrat
    if (filterContractType) {
      filtered = filtered.filter(contract => contract.contract_type === filterContractType)
    }

    // Filtre par statut
    if (filterStatus) {
      filtered = filtered.filter(contract => contract.status === filterStatus)
    }

    // Filtre par employé
    if (filterEmployee) {
      filtered = filtered.filter(contract => contract.employee?.id === parseInt(filterEmployee))
    }

    // Filtre expirant bientôt
    if (showExpiringOnly) {
      filtered = filtered.filter(contract => contract.is_expiring_soon || contract.needs_renewal)
    }

    setFilteredContracts(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterContractType, filterStatus, filterEmployee, showExpiringOnly, contracts])

  useEffect(() => {
    console.log('Contracts component mounted')
    fetchContracts()
    fetchEmployees()
  }, [fetchContracts, fetchEmployees])

  useEffect(() => {
    if (!loading) {
      filterContracts()
    }
  }, [filterContracts, loading])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (c) => c.employee_name || '-' },
      { header: 'Type de Contrat', key: 'contract_type_display', accessor: (c) => c.contract_type_display || c.contract_type || '-' },
      { header: 'Poste', key: 'position', accessor: (c) => c.position || '-' },
      { header: 'Date de Début', key: 'start_date', accessor: (c) => c.start_date || '-' },
      { header: 'Date de Fin', key: 'end_date', accessor: (c) => c.end_date || '-' },
      { header: 'Salaire', key: 'salary', accessor: (c) => c.salary ? `${parseFloat(c.salary).toLocaleString('fr-FR')} FCFA` : '-' },
      { header: 'Statut', key: 'status_display', accessor: (c) => c.status_display || c.status || '-' },
      { header: 'Expire bientôt', key: 'is_expiring_soon', accessor: (c) => c.is_expiring_soon ? 'Oui' : 'Non' },
      { header: 'Renouvellement auto', key: 'auto_renewal', accessor: (c) => c.auto_renewal ? 'Oui' : 'Non' }
    ]
    exportToPDF(filteredContracts, columns, 'Liste des Contrats', 'contrats')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (c) => c.employee_name || '-' },
      { header: 'Type de Contrat', key: 'contract_type_display', accessor: (c) => c.contract_type_display || c.contract_type || '-' },
      { header: 'Poste', key: 'position', accessor: (c) => c.position || '-' },
      { header: 'Date de Début', key: 'start_date', accessor: (c) => c.start_date || '-' },
      { header: 'Date de Fin', key: 'end_date', accessor: (c) => c.end_date || '-' },
      { header: 'Salaire', key: 'salary', accessor: (c) => c.salary ? parseFloat(c.salary) : '-' },
      { header: 'Statut', key: 'status_display', accessor: (c) => c.status_display || c.status || '-' },
      { header: 'Expire bientôt', key: 'is_expiring_soon', accessor: (c) => c.is_expiring_soon ? 'Oui' : 'Non' },
      { header: 'Renouvellement auto', key: 'auto_renewal', accessor: (c) => c.auto_renewal ? 'Oui' : 'Non' }
    ]
    exportToExcel(filteredContracts, columns, 'Contrats', 'contrats')
    showToast('Export Excel en cours...', 'success')
  }

  const openAddDialog = () => {
    setFormData({
      employee: '',
      contract_type: 'CDI',
      start_date: '',
      end_date: '',
      salary: '',
      position: '',
      status: 'DRAFT',
      auto_renewal: false,
      renewal_notice_days: 30,
      notes: ''
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSend = {
        employee: parseInt(formData.employee),
        contract_type: formData.contract_type,
        start_date: formData.start_date,
        end_date: formData.contract_type === 'CDI' ? null : (formData.end_date || null),
        salary: formData.salary ? parseFloat(formData.salary) : 0,
        position: formData.position,
        status: formData.status,
        auto_renewal: formData.auto_renewal,
        renewal_notice_days: parseInt(formData.renewal_notice_days) || 30,
        notes: formData.notes || ''
      }

      await api.post('/ditech/contracts/', dataToSend)
      showToast('Contrat créé avec succès')
      setShowDialog(false)
      await fetchContracts()
      // Déclencher un événement personnalisé pour mettre à jour les stats du dashboard
      window.dispatchEvent(new CustomEvent('contractsUpdated'))
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
      await api.delete(`/ditech/contracts/${deleteConfirm.id}/`)
      showToast('Contrat supprimé avec succès')
      setDeleteConfirm(null)
      fetchContracts()
    } catch (err) {
      console.error('Erreur:', err)
      showToast(err.response?.data?.detail || 'Erreur lors de la suppression', 'error')
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'SIGNED': return 'status-signed'
      case 'PENDING': return 'status-pending'
      case 'EXPIRED': return 'status-expired'
      case 'DRAFT': return 'status-draft'
      default: return ''
    }
  }

  const getContractTypeClass = (type) => {
    switch (type) {
      case 'CDI': return 'type-cdi'
      case 'CDD': return 'type-cdd'
      case 'STAGE': return 'type-stage'
      case 'INTERIM': return 'type-interim'
      default: return ''
    }
  }

  const getAlertClass = (contract) => {
    if (contract.is_expired || contract.status === 'EXPIRED') return 'alert-critical'
    if (contract.alert_level === 'critical') return 'alert-critical'
    if (contract.alert_level === 'warning') return 'alert-warning'
    if (contract.alert_level === 'info') return 'alert-info'
    return ''
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR')
  }

  const formatCurrency = (amount) => {
    if (!amount) return '0 FCFA'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const totalPages = Math.ceil((filteredContracts?.length || 0) / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentContracts = (filteredContracts || []).slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="contracts-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des contrats...</p>
        </div>
      </div>
    )
  }

  // Protection contre les erreurs de rendu
  if (!contracts && !loading) {
    return (
      <div className="contracts-page">
        <div className="error-message">
          Erreur lors du chargement des contrats. Veuillez rafraîchir la page.
        </div>
      </div>
    )
  }

  return (
    <div className="contracts-page">
      <div className="page-header">
        <h1>Gestion des Contrats</h1>
        <p>Gerez les contrats</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><ClipboardList size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Contrats</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><CheckCircle2 size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Actifs</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Clock size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.expiring}</div>
            <div className="stat-label">À Renouveler</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><AlertTriangle size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.expired}</div>
            <div className="stat-label">Expirés</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Briefcase size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.cdi}</div>
            <div className="stat-label">CDI</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FileIcon size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.cdd}</div>
            <div className="stat-label">CDD</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><GraduationCap size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.stage}</div>
            <div className="stat-label">Stages</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Hourglass size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.interim}</div>
            <div className="stat-label">Intérim</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Rechercher par employé, poste, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={filterContractType}
              onChange={(e) => setFilterContractType(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les types</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="STAGE">Stage</option>
              <option value="INTERIM">Intérim</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="PENDING">En attente</option>
              <option value="SIGNED">Signé</option>
              <option value="EXPIRED">Expiré</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les employés</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={showExpiringOnly}
                onChange={(e) => setShowExpiringOnly(e.target.checked)}
              />
              <span>Expirant bientôt</span>
            </label>
          </div>
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
          <button className="btn-primary" onClick={openAddDialog}>
            <Plus size={16} /> Ajouter un Contrat
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Type</th>
              <th>Poste</th>
              <th>Date début</th>
              <th>Date fin</th>
              <th>Salaire</th>
              <th>Statut</th>
              <th>Renouvellement</th>
            </tr>
          </thead>
          <tbody>
            {currentContracts.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">Aucun contrat trouvé</td>
              </tr>
            ) : (
              currentContracts.map(contract => (
                <tr key={contract.id} className={getAlertClass(contract)}>
                  <td>{contract.employee_name || '-'}</td>
                  <td>
                    <span className={`contract-type-badge ${getContractTypeClass(contract.contract_type)}`}>
                      {contract.contract_type_display || contract.contract_type}
                    </span>
                  </td>
                  <td>{contract.position || '-'}</td>
                  <td>{formatDate(contract.start_date)}</td>
                  <td>
                    {contract.contract_type === 'CDI' ? (
                      <span className="indefinite">Indéterminé</span>
                    ) : (
                      formatDate(contract.end_date)
                    )}
                  </td>
                  <td>{formatCurrency(contract.salary)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(contract.status)}`}>
                      {contract.status_display || contract.status}
                    </span>
                  </td>
                  <td>
                    <div className="renewal-info">
                      {contract.auto_renewal && (
                        <span className="auto-renewal-badge" title="Renouvellement automatique activé">
                          <RefreshCw size={14} /> Auto
                        </span>
                      )}
                      {contract.is_expiring_soon && contract.days_until_expiry !== null && (
                        <span className="expiring-badge" title={`Expire dans ${contract.days_until_expiry} jours`}>
                          <Clock size={14} /> {contract.days_until_expiry}j
                        </span>
                      )}
                      {contract.is_expired && (
                        <span className="expired-badge"><AlertTriangle size={14} /> Expiré</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            ← Précédent
          </button>
          <span className="pagination-info">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant →
          </button>
        </div>
      )}

      {/* Dialog Création/Modification */}
      {showDialog && (
        <div className="dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="dialog dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Nouveau Contrat</h2>
              <button className="btn-close" onClick={() => setShowDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="dialog-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Employé *</label>
                  <select
                    value={formData.employee}
                    onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner un employé</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Type de contrat *</label>
                  <select
                    value={formData.contract_type}
                    onChange={(e) => {
                      const newType = e.target.value
                      setFormData({
                        ...formData,
                        contract_type: newType,
                        end_date: newType === 'CDI' ? '' : (formData.end_date || '')
                      })
                    }}
                    required
                  >
                    <option value="CDI">CDI - Contrat à Durée Indéterminée</option>
                    <option value="CDD">CDD - Contrat à Durée Déterminée</option>
                    <option value="STAGE">Stage</option>
                    <option value="INTERIM">Intérim</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date de début *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date de fin {formData.contract_type !== 'CDI' && '*'}</label>
                  <input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required={formData.contract_type !== 'CDI'}
                    min={formData.start_date || undefined}
                  />
                  {formData.contract_type === 'CDI' && (
                    <small style={{ color: '#6b7280', display: 'block', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      (Optionnel pour CDI - les contrats CDI n'ont généralement pas de date de fin)
                    </small>
                  )}
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
                  <label>Salaire *</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Statut *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="PENDING">En attente de signature</option>
                    <option value="SIGNED">Signé</option>
                    <option value="EXPIRED">Expiré</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Jours d'alerte avant expiration</label>
                  <input
                    type="number"
                    value={formData.renewal_notice_days}
                    onChange={(e) => setFormData({ ...formData, renewal_notice_days: e.target.value })}
                    min="1"
                    max="365"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.auto_renewal}
                    onChange={(e) => setFormData({ ...formData, auto_renewal: e.target.checked })}
                  />
                  <span>Renouvellement automatique</span>
                </label>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                />
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

      {/* Confirmation de suppression */}
      {deleteConfirm && (
        <div className="dialog-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="dialog dialog-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer le contrat de <strong>{deleteConfirm.employee_name}</strong> ?</p>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Annuler
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}

export default Contracts
