import React, { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { exportToPDF, exportToExcel } from '../utils/exportUtils'
import { Clock, Calendar, AlertTriangle, ClipboardList, CheckCircle2, XCircle, FileText, FileSpreadsheet, Plus, Pencil, Wallet, TrendingUp, X, BarChart3, Hourglass, UserCircle, Zap, FolderOpen, CheckCircle, Trash2 } from 'lucide-react'
import './PresenceAbsence.css'

const PresenceAbsence = ({ tab = 'pointage' }) => {
  const [activeTab, setActiveTab] = useState(tab) // pointage, conges, retards

  // Mettre à jour l'onglet actif si la prop tab change
  React.useEffect(() => {
    setActiveTab(tab)
  }, [tab])

  // Si on a une prop tab spécifique, on affiche seulement cet onglet sans les tabs de navigation
  const showOnlyTab = tab && tab !== 'all'

  return (
    <div className="presence-absence-page">
      {!showOnlyTab && (
        <>
          <div className="page-header">
            <h1>Présences & Absences</h1>
            <p>Voir le pointage des employés</p>
          </div>

          {/* Onglets */}
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'pointage' ? 'active' : ''}`}
              onClick={() => setActiveTab('pointage')}
            >
              <Clock size={18} /> Pointage
            </button>
            <button
              className={`tab-button ${activeTab === 'conges' ? 'active' : ''}`}
              onClick={() => setActiveTab('conges')}
            >
              <Calendar size={18} /> Congés
            </button>
            <button
              className={`tab-button ${activeTab === 'retards' ? 'active' : ''}`}
              onClick={() => setActiveTab('retards')}
            >
              <AlertTriangle size={18} /> Retards / Heures supp.
            </button>
          </div>
        </>
      )}

      {/* Contenu des onglets */}
      <div className="tab-content">
        {activeTab === 'pointage' && <PointageTab />}
        {activeTab === 'conges' && <CongesTab />}
        {activeTab === 'retards' && <RetardsTab />}
      </div>
    </div>
  )
}

// Composant Onglet Pointage
const PointageTab = () => {
  const [trackings, setTrackings] = useState([])
  const [filteredTrackings, setFilteredTrackings] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [, setError] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingTracking, setEditingTracking] = useState(null)
  const [formData, setFormData] = useState({
    employee: '',
    date: '',
    check_in_time: '',
    check_out_time: '',
    check_in_method: 'MANUAL',
    badge_id: '',
    expected_check_in: '09:00',
    expected_check_out: '18:00',
    notes: ''
  })
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const rowsPerPage = 10

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const stats = {
    total: (trackings || []).length,
    present: (trackings || []).filter(t => t.status === 'PRESENT').length,
    absent: (trackings || []).filter(t => t.status === 'ABSENT').length,
    late: (trackings || []).filter(t => t.is_late || t.status === 'LATE').length,
    onLeave: (trackings || []).filter(t => t.status === 'ON_LEAVE').length
  }

  const fetchTrackings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/presence-tracking/')
      setTrackings(response.data)
      setFilteredTrackings(response.data)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération des pointages:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la récupération des pointages'
      setError(errorMessage)
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

  const filterTrackings = useCallback(() => {
    let filtered = [...trackings]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(tracking =>
        tracking.employee_name?.toLowerCase().includes(term) ||
        tracking.status_display?.toLowerCase().includes(term) ||
        tracking.check_in_method?.toLowerCase().includes(term)
      )
    }

    if (filterEmployee) {
      filtered = filtered.filter(tracking => tracking.employee?.id === parseInt(filterEmployee))
    }

    if (filterStatus) {
      filtered = filtered.filter(tracking => tracking.status === filterStatus)
    }

    if (filterDate) {
      filtered = filtered.filter(tracking => tracking.date === filterDate)
    }

    setFilteredTrackings(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterEmployee, filterStatus, filterDate, trackings])

  useEffect(() => {
    fetchTrackings()
    fetchEmployees()
  }, [fetchTrackings, fetchEmployees])

  useEffect(() => {
    if (!loading) {
      filterTrackings()
    }
  }, [filterTrackings, loading])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const openAddDialog = () => {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toTimeString().slice(0, 5)
    setEditingTracking(null)
    setFormData({
      employee: '',
      date: today,
      check_in_time: now,
      check_out_time: '',
      check_in_method: 'MANUAL',
      badge_id: '',
      expected_check_in: '09:00',
      expected_check_out: '18:00',
      notes: ''
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSend = {
        employee: parseInt(formData.employee),
        date: formData.date,
        check_in_method: formData.check_in_method,
        badge_id: formData.badge_id || null,
        expected_check_in: formData.expected_check_in,
        expected_check_out: formData.expected_check_out,
        notes: formData.notes || ''
      }

      // Construire les datetime complets pour check_in et check_out
      if (formData.check_in_time) {
        dataToSend.check_in_time = `${formData.date}T${formData.check_in_time}:00`
      }
      if (formData.check_out_time) {
        dataToSend.check_out_time = `${formData.date}T${formData.check_out_time}:00`
      }

      await api.post('/ditech/presence-tracking/', dataToSend)
      showToast('Pointage créé avec succès')
      setShowDialog(false)
      fetchTrackings()
    } catch (err) {
      console.error('Erreur:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error || 
                          (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : 'Erreur lors de l\'opération')
      showToast(errorMessage, 'error')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR')
  }

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-'
    const date = new Date(dateTimeString)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'PRESENT': return 'status-present'
      case 'ABSENT': return 'status-absent'
      case 'LATE': return 'status-late'
      case 'ON_LEAVE': return 'status-leave'
      case 'EARLY_LEAVE': return 'status-early'
      default: return ''
    }
  }

  const getMethodDisplay = (method) => {
    switch (method) {
      case 'MANUAL': return 'Manuel'
      case 'BADGE': return 'Badge'
      case 'MOBILE': return 'Mobile'
      case 'WEB': return 'Web'
      default: return method
    }
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (t) => t.employee_name || '-' },
      { header: 'Date', key: 'date', accessor: (t) => formatDate(t.date) || '-' },
      { header: 'Heure d\'arrivée', key: 'check_in_time', accessor: (t) => t.check_in_time ? formatDateTime(t.check_in_time).split(' ')[1] : '-' },
      { header: 'Heure de départ', key: 'check_out_time', accessor: (t) => t.check_out_time ? formatDateTime(t.check_out_time).split(' ')[1] : '-' },
      { header: 'Méthode', key: 'check_in_method', accessor: (t) => getMethodDisplay(t.check_in_method) || '-' },
      { header: 'Statut', key: 'status', accessor: (t) => {
        if (t.status === 'PRESENT') return 'Présent'
        if (t.status === 'ABSENT') return 'Absent'
        if (t.status === 'LATE') return 'En retard'
        if (t.status === 'ON_LEAVE') return 'En congé'
        return t.status || '-'
      }},
      { header: 'En retard', key: 'is_late', accessor: (t) => t.is_late ? 'Oui' : 'Non' },
      { header: 'Heures supplémentaires', key: 'overtime_hours', accessor: (t) => t.overtime_hours ? `${t.overtime_hours}h` : '-' }
    ]
    exportToPDF(filteredTrackings, columns, 'Liste des Pointages', 'pointages')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (t) => t.employee_name || '-' },
      { header: 'Date', key: 'date', accessor: (t) => t.date || '-' },
      { header: 'Heure d\'arrivée', key: 'check_in_time', accessor: (t) => t.check_in_time || '-' },
      { header: 'Heure de départ', key: 'check_out_time', accessor: (t) => t.check_out_time || '-' },
      { header: 'Méthode', key: 'check_in_method', accessor: (t) => getMethodDisplay(t.check_in_method) || '-' },
      { header: 'Statut', key: 'status', accessor: (t) => {
        if (t.status === 'PRESENT') return 'Présent'
        if (t.status === 'ABSENT') return 'Absent'
        if (t.status === 'LATE') return 'En retard'
        if (t.status === 'ON_LEAVE') return 'En congé'
        return t.status || '-'
      }},
      { header: 'En retard', key: 'is_late', accessor: (t) => t.is_late ? 'Oui' : 'Non' },
      { header: 'Heures supplémentaires', key: 'overtime_hours', accessor: (t) => t.overtime_hours || 0 }
    ]
    exportToExcel(filteredTrackings, columns, 'Pointages', 'pointages')
    showToast('Export Excel en cours...', 'success')
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    
    try {
      await api.delete(`/ditech/presence-tracking/${deleteConfirm.id}/`)
      showToast('Pointage supprimé avec succès', 'success')
      setDeleteConfirm(null)
      fetchTrackings()
    } catch (err) {
      console.error('Erreur lors de la suppression du pointage:', err)
      showToast(err.response?.data?.detail || 'Erreur lors de la suppression du pointage', 'error')
      setDeleteConfirm(null)
    }
  }

  const totalPages = Math.ceil((filteredTrackings?.length || 0) / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentTrackings = (filteredTrackings || []).slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des pointages...</p>
      </div>
    )
  }

  return (
    <div className="tab-panel">
      <div className="page-header">
        <h1>Pointage</h1>
        <p>Voir les pointages</p>
      </div>
      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><ClipboardList size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Pointages</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><CheckCircle2 size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.present}</div>
            <div className="stat-label">Présents</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><XCircle size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.absent}</div>
            <div className="stat-label">Absents</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Clock size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.late}</div>
            <div className="stat-label">En Retard</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Calendar size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.onLeave}</div>
            <div className="stat-label">En Congé</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Rechercher par employé, statut..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
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
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              <option value="PRESENT">Présent</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">En retard</option>
              <option value="ON_LEAVE">En congé</option>
              <option value="EARLY_LEAVE">Départ anticipé</option>
            </select>
          </div>
          <div className="filter-group">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="filter-input"
            />
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
          <button type="button" className="btn-primary" onClick={openAddDialog}>
            <Plus size={16} /> Nouveau Pointage
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Date</th>
              <th>Heure Arrivée</th>
              <th>Heure Départ</th>
              <th>Méthode</th>
              <th>Statut</th>
              <th>Retard</th>
              <th>Heures Travaillées</th>
              <th>Heures Supp.</th>
            </tr>
          </thead>
          <tbody>
            {currentTrackings.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">Aucun pointage trouvé</td>
              </tr>
            ) : (
              currentTrackings.map(tracking => (
                <tr key={tracking.id}>
                  <td>{tracking.employee_name || '-'}</td>
                  <td>{formatDate(tracking.date)}</td>
                  <td>{formatDateTime(tracking.check_in_time)}</td>
                  <td>{formatDateTime(tracking.check_out_time)}</td>
                  <td>{getMethodDisplay(tracking.check_in_method)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(tracking.status)}`}>
                      {tracking.status_display || tracking.status}
                    </span>
                  </td>
                  <td>
                    {tracking.is_late ? (
                      <span className="late-badge">
                        <Clock size={14} /> {tracking.late_minutes} min
                      </span>
                    ) : '-'}
                  </td>
                  <td>{tracking.worked_hours ? `${tracking.worked_hours}h` : '-'}</td>
                  <td>
                    {tracking.overtime_hours > 0 ? (
                      <span className="overtime-badge">
                        <Zap size={14} /> {tracking.overtime_hours}h
                      </span>
                    ) : '-'}
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
              <h2>Nouveau Pointage</h2>
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
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Heure d'arrivée</label>
                  <input
                    type="time"
                    value={formData.check_in_time}
                    onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Heure de départ</label>
                  <input
                    type="time"
                    value={formData.check_out_time}
                    onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Méthode de pointage *</label>
                  <select
                    value={formData.check_in_method}
                    onChange={(e) => setFormData({ ...formData, check_in_method: e.target.value })}
                    required
                  >
                    <option value="MANUAL">Manuel</option>
                    <option value="BADGE">Badge</option>
                    <option value="MOBILE">Application mobile</option>
                    <option value="WEB">Interface web</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ID Badge (si méthode Badge)</label>
                  <input
                    type="text"
                    value={formData.badge_id}
                    onChange={(e) => setFormData({ ...formData, badge_id: e.target.value })}
                    disabled={formData.check_in_method !== 'BADGE'}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Heure d'arrivée attendue</label>
                  <input
                    type="time"
                    value={formData.expected_check_in}
                    onChange={(e) => setFormData({ ...formData, expected_check_in: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Heure de départ attendue</label>
                  <input
                    type="time"
                    value={formData.expected_check_out}
                    onChange={(e) => setFormData({ ...formData, expected_check_out: e.target.value })}
                  />
                </div>
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
                  {editingTracking ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Confirmation Suppression */}
      {deleteConfirm && (
        <div className="dialog-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="dialog dialog-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer le pointage de <strong>{deleteConfirm.employee_name}</strong> du <strong>{formatDate(deleteConfirm.date)}</strong> ?</p>
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
          {toast.message}
        </div>
      )}
    </div>
  )
}

// Composant Onglet Congés
const CongesTab = () => {
  const [leaveRequests, setLeaveRequests] = useState([])
  const [filteredRequests, setFilteredRequests] = useState([])
  const [leaveBalances, setLeaveBalances] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [, setError] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showBalanceDialog, setShowBalanceDialog] = useState(false)
  const [showAllBalancesDialog, setShowAllBalancesDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [selectedBalance, _setSelectedBalance] = useState(null)
  const [approvalAction, setApprovalAction] = useState('') // 'manager_approve', 'manager_reject', 'rh_approve', 'rh_reject'
  const [formData, setFormData] = useState({
    employee: '',
    leave_type: 'ANNUAL',
    start_date: '',
    end_date: '',
    days: '',
    reason: ''
  })
  const [approvalFormData, setApprovalFormData] = useState({
    rejection_reason: ''
  })
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const rowsPerPage = 10

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')

  const stats = {
    total: (leaveRequests || []).length,
    pending: (leaveRequests || []).filter(r => r.status === 'PENDING').length,
    managerApproved: (leaveRequests || []).filter(r => r.status === 'MANAGER_APPROVED').length,
    rhApproved: (leaveRequests || []).filter(r => r.status === 'RH_APPROVED').length,
    rejected: (leaveRequests || []).filter(r => r.status === 'REJECTED').length,
    cancelled: (leaveRequests || []).filter(r => r.status === 'CANCELLED').length
  }

  const fetchLeaveRequests = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/leave-requests/')
      setLeaveRequests(response.data)
      setFilteredRequests(response.data)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération des congés:', err)
      setError('Erreur lors de la récupération des congés')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLeaveBalances = useCallback(async () => {
    try {
      const response = await api.get('/ditech/leave-balances/')
      setLeaveBalances(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des soldes:', err)
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

  const filterRequests = useCallback(() => {
    let filtered = [...leaveRequests]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(req =>
        req.employee_name?.toLowerCase().includes(term) ||
        req.leave_type_display?.toLowerCase().includes(term) ||
        req.status_display?.toLowerCase().includes(term)
      )
    }

    if (filterEmployee) {
      filtered = filtered.filter(req => req.employee?.id === parseInt(filterEmployee))
    }

    if (filterStatus) {
      filtered = filtered.filter(req => req.status === filterStatus)
    }

    if (filterType) {
      filtered = filtered.filter(req => req.leave_type === filterType)
    }

    setFilteredRequests(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterEmployee, filterStatus, filterType, leaveRequests])

  useEffect(() => {
    fetchLeaveRequests()
    fetchLeaveBalances()
    fetchEmployees()
  }, [fetchLeaveRequests, fetchLeaveBalances, fetchEmployees])

  useEffect(() => {
    if (!loading) {
      filterRequests()
    }
  }, [filterRequests, loading])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const openAddDialog = () => {
    const today = new Date().toISOString().split('T')[0]
    setFormData({
      employee: '',
      leave_type: 'ANNUAL',
      start_date: today,
      end_date: today,
      days: '',
      reason: ''
    })
    setShowDialog(true)
  }

  const _openApprovalDialog = (request, action) => {
    setSelectedRequest(request)
    setApprovalAction(action)
    setApprovalFormData({ rejection_reason: '' })
    setShowApprovalDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Calculer le nombre de jours si non fourni
      let days = formData.days ? parseInt(formData.days) : null
      if (!days && formData.start_date && formData.end_date) {
        const start = new Date(formData.start_date)
        const end = new Date(formData.end_date)
        const diffTime = Math.abs(end - start)
        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 pour inclure le jour de fin
      }
      
      const dataToSend = {
        employee: parseInt(formData.employee),
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days: days || 1, // Au minimum 1 jour
        reason: formData.reason,
        status: 'PENDING'
      }

      await api.post('/ditech/leave-requests/', dataToSend)
      showToast('Demande de congé créée avec succès')
      setShowDialog(false)
      fetchLeaveRequests()
      fetchLeaveBalances()
    } catch (err) {
      console.error('Erreur:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error || 
                          (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : 'Erreur lors de l\'opération')
      showToast(errorMessage, 'error')
    }
  }

  const handleApproval = async () => {
    if (!selectedRequest) return

    try {
      let endpoint = ''
      if (approvalAction === 'manager_approve') {
        endpoint = `/ditech/leave-requests/${selectedRequest.id}/approve_manager/`
      } else if (approvalAction === 'manager_reject') {
        endpoint = `/ditech/leave-requests/${selectedRequest.id}/reject_manager/`
      } else if (approvalAction === 'rh_approve') {
        endpoint = `/ditech/leave-requests/${selectedRequest.id}/approve_rh/`
      } else if (approvalAction === 'rh_reject') {
        endpoint = `/ditech/leave-requests/${selectedRequest.id}/reject_rh/`
      }

      const data = approvalAction.includes('reject') ? { rejection_reason: approvalFormData.rejection_reason } : {}
      await api.post(endpoint, data)

      const actionNames = {
        'manager_approve': 'approuvée par le manager',
        'manager_reject': 'rejetée par le manager',
        'rh_approve': 'approuvée par RH',
        'rh_reject': 'rejetée par RH'
      }
      showToast(`Demande ${actionNames[approvalAction]}`)
      setShowApprovalDialog(false)
      fetchLeaveRequests()
      fetchLeaveBalances()
    } catch (err) {
      console.error('Erreur:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error || 
                          'Erreur lors de l\'approbation'
      showToast(errorMessage, 'error')
    }
  }

  const _handleCancelRequest = async (request) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette demande de congé ?')) {
      return
    }

    try {
      await api.post(`/ditech/leave-requests/${request.id}/cancel/`)
      showToast('Demande annulée avec succès')
      fetchLeaveRequests()
      fetchLeaveBalances()
    } catch (err) {
      console.error('Erreur:', err)
      showToast(err.response?.data?.error || 'Erreur lors de l\'annulation', 'error')
    }
  }

  const handleDeleteLeave = async () => {
    if (!deleteConfirm) return
    
    try {
      await api.delete(`/ditech/leave-requests/${deleteConfirm.id}/`)
      showToast('Demande de congé supprimée avec succès', 'success')
      setDeleteConfirm(null)
      fetchLeaveRequests()
      fetchLeaveBalances()
    } catch (err) {
      console.error('Erreur lors de la suppression de la demande de congé:', err)
      showToast(err.response?.data?.detail || 'Erreur lors de la suppression de la demande de congé', 'error')
      setDeleteConfirm(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR')
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING': return 'status-pending'
      case 'MANAGER_APPROVED': return 'status-manager-approved'
      case 'RH_APPROVED': return 'status-approved'
      case 'REJECTED': return 'status-rejected'
      case 'CANCELLED': return 'status-cancelled'
      default: return ''
    }
  }

  const getTypeDisplay = (type) => {
    switch (type) {
      case 'ANNUAL': return 'Congé annuel'
      case 'SICK': return 'Congé maladie'
      case 'PERSONAL': return 'Congé personnel'
      case 'MATERNITY': return 'Congé maternité'
      case 'PATERNITY': return 'Congé paternité'
      case 'UNPAID': return 'Congé sans solde'
      default: return type
    }
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'PENDING': return 'En attente'
      case 'MANAGER_APPROVED': return 'Approuvé manager'
      case 'RH_APPROVED': return 'Approuvé RH'
      case 'REJECTED': return 'Rejeté'
      case 'CANCELLED': return 'Annulé'
      default: return status
    }
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (r) => r.employee_name || '-' },
      { header: 'Type de congé', key: 'leave_type_display', accessor: (r) => r.leave_type_display || getTypeDisplay(r.leave_type) || '-' },
      { header: 'Date de début', key: 'start_date', accessor: (r) => formatDate(r.start_date) || '-' },
      { header: 'Date de fin', key: 'end_date', accessor: (r) => formatDate(r.end_date) || '-' },
      { header: 'Nombre de jours', key: 'days', accessor: (r) => r.days || 0 },
      { header: 'Statut', key: 'status_display', accessor: (r) => r.status_display || getStatusDisplay(r.status) || '-' },
      { header: 'Raison', key: 'reason', accessor: (r) => r.reason || '-' },
      { header: 'Date de demande', key: 'request_date', accessor: (r) => formatDate(r.request_date) || '-' }
    ]
    exportToPDF(filteredRequests, columns, 'Liste des Congés', 'conges')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (r) => r.employee_name || '-' },
      { header: 'Type de congé', key: 'leave_type_display', accessor: (r) => r.leave_type_display || getTypeDisplay(r.leave_type) || '-' },
      { header: 'Date de début', key: 'start_date', accessor: (r) => r.start_date || '-' },
      { header: 'Date de fin', key: 'end_date', accessor: (r) => r.end_date || '-' },
      { header: 'Nombre de jours', key: 'days', accessor: (r) => r.days || 0 },
      { header: 'Statut', key: 'status_display', accessor: (r) => r.status_display || getStatusDisplay(r.status) || '-' },
      { header: 'Raison', key: 'reason', accessor: (r) => r.reason || '-' },
      { header: 'Date de demande', key: 'request_date', accessor: (r) => r.request_date || '-' }
    ]
    exportToExcel(filteredRequests, columns, 'Congés', 'conges')
    showToast('Export Excel en cours...', 'success')
  }

  const _getEmployeeBalance = (employeeId) => {
    const balance = leaveBalances.find(b => b.employee === employeeId || b.employee?.id === employeeId)
    return balance || null
  }

  const totalPages = Math.ceil((filteredRequests?.length || 0) / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentRequests = (filteredRequests || []).slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des congés...</p>
      </div>
    )
  }

  return (
    <div className="tab-panel">
      <div className="page-header">
        <h1>Congés</h1>
        <p>Voir les congés</p>
      </div>
      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><ClipboardList size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Demandes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Hourglass size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">En Attente</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><CheckCircle2 size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.rhApproved}</div>
            <div className="stat-label">Approuvés RH</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><UserCircle size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.managerApproved}</div>
            <div className="stat-label">Approuvés Manager</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><XCircle size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.rejected}</div>
            <div className="stat-label">Rejetés</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Rechercher par employé, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
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
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="MANAGER_APPROVED">Approuvé manager</option>
              <option value="RH_APPROVED">Approuvé RH</option>
              <option value="REJECTED">Rejeté</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les types</option>
              <option value="ANNUAL">Congé annuel</option>
              <option value="SICK">Congé maladie</option>
              <option value="PERSONAL">Congé personnel</option>
              <option value="MATERNITY">Congé maternité</option>
              <option value="PATERNITY">Congé paternité</option>
              <option value="UNPAID">Congé sans solde</option>
            </select>
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
            <Plus size={16} /> Nouvelle Demande
          </button>
          <button className="btn-secondary" onClick={async () => {
            await fetchLeaveBalances()
            setShowAllBalancesDialog(true)
          }}>
            <Wallet size={16} /> Voir Soldes
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
              <th>Date début</th>
              <th>Date fin</th>
              <th>Jours</th>
              <th>Statut</th>
              <th>Workflow</th>
            </tr>
          </thead>
          <tbody>
            {currentRequests.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">Aucune demande de congé trouvée</td>
              </tr>
            ) : (
              currentRequests.map(request => (
                <tr key={request.id}>
                  <td>{request.employee_name || '-'}</td>
                  <td>{getTypeDisplay(request.leave_type)}</td>
                  <td>{formatDate(request.start_date)}</td>
                  <td>{formatDate(request.end_date)}</td>
                  <td>{request.days} jour(s)</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(request.status)}`}>
                      {getStatusDisplay(request.status)}
                    </span>
                  </td>
                  <td>
                    <div className="workflow-indicator">
                      {request.status === 'PENDING' && (
                        <span className="workflow-step active">📝 Demande</span>
                      )}
                      {request.status === 'MANAGER_APPROVED' && (
                        <>
                          <span className="workflow-step completed"><CheckCircle2 size={14} /> Manager</span>
                          <span className="workflow-arrow">→</span>
                          <span className="workflow-step active"><Hourglass size={14} /> RH</span>
                        </>
                      )}
                      {request.status === 'RH_APPROVED' && (
                        <>
                          <span className="workflow-step completed"><CheckCircle2 size={14} /> Manager</span>
                          <span className="workflow-arrow">→</span>
                          <span className="workflow-step completed"><CheckCircle2 size={14} /> RH</span>
                          <span className="workflow-arrow">→</span>
                          <span className="workflow-step completed"><Wallet size={14} /> Solde</span>
                        </>
                      )}
                      {request.status === 'REJECTED' && (
                        <span className="workflow-step rejected"><XCircle size={14} /> Rejeté</span>
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
              <h2>Nouvelle Demande de Congé</h2>
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
                  <label>Type de congé *</label>
                  <select
                    value={formData.leave_type}
                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                    required
                  >
                    <option value="ANNUAL">Congé annuel</option>
                    <option value="SICK">Congé maladie</option>
                    <option value="PERSONAL">Congé personnel</option>
                    <option value="MATERNITY">Congé maternité</option>
                    <option value="PATERNITY">Congé paternité</option>
                    <option value="UNPAID">Congé sans solde</option>
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
                  <label>Date de fin *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    min={formData.start_date}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Nombre de jours</label>
                <input
                  type="number"
                  value={formData.days}
                  onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                  min="1"
                  placeholder="Calculé automatiquement si vide"
                />
              </div>
              <div className="form-group">
                <label>Raison *</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows="3"
                  required
                  placeholder="Raison de la demande de congé"
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

      {/* Dialog Approbation/Rejet */}
      {showApprovalDialog && selectedRequest && (
        <div className="dialog-overlay" onClick={() => setShowApprovalDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>
                {approvalAction.includes('approve') ? 'Approuver' : 'Rejeter'} la Demande
              </h2>
              <button className="btn-close" onClick={() => setShowApprovalDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="dialog-form">
              <div className="approval-info">
                <p><strong>Employé:</strong> {selectedRequest.employee_name}</p>
                <p><strong>Type:</strong> {getTypeDisplay(selectedRequest.leave_type)}</p>
                <p><strong>Période:</strong> {formatDate(selectedRequest.start_date)} - {formatDate(selectedRequest.end_date)}</p>
                <p><strong>Jours:</strong> {selectedRequest.days}</p>
              </div>
              {approvalAction.includes('reject') && (
                <div className="form-group">
                  <label>Raison du rejet *</label>
                  <textarea
                    value={approvalFormData.rejection_reason}
                    onChange={(e) => setApprovalFormData({ rejection_reason: e.target.value })}
                    rows="3"
                    required
                    placeholder="Expliquez la raison du rejet"
                  />
                </div>
              )}
              <div className="dialog-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowApprovalDialog(false)}>
                  Annuler
                </button>
                <button
                  type="button"
                  className={approvalAction.includes('approve') ? 'btn-primary' : 'btn-danger'}
                  onClick={handleApproval}
                  disabled={approvalAction.includes('reject') && !approvalFormData.rejection_reason}
                >
                  {approvalAction.includes('approve') ? 'Approuver' : 'Rejeter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Solde */}
      {showBalanceDialog && selectedBalance && (
        <div className="dialog-overlay" onClick={() => setShowBalanceDialog(false)}>
          <div className="dialog dialog-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Solde de Congés</h2>
              <button className="btn-close" onClick={() => setShowBalanceDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="balance-display">
              <div className="balance-item">
                <span className="balance-label">Congés annuels alloués:</span>
                <span className="balance-value">{selectedBalance.annual_leave || 0} jours</span>
              </div>
              <div className="balance-item">
                <span className="balance-label">Congés annuels utilisés:</span>
                <span className="balance-value">{selectedBalance.used_annual || 0} jours</span>
              </div>
              <div className="balance-item balance-remaining">
                <span className="balance-label">Congés annuels restants:</span>
                <span className="balance-value">{selectedBalance.remaining_annual || 0} jours</span>
              </div>
              <div className="balance-item">
                <span className="balance-label">Congés maladie alloués:</span>
                <span className="balance-value">{selectedBalance.sick_leave || 0} jours</span>
              </div>
              <div className="balance-item">
                <span className="balance-label">Congés maladie utilisés:</span>
                <span className="balance-value">{selectedBalance.used_sick || 0} jours</span>
              </div>
              <div className="balance-item balance-remaining">
                <span className="balance-label">Congés maladie restants:</span>
                <span className="balance-value">{selectedBalance.remaining_sick || 0} jours</span>
              </div>
            </div>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setShowBalanceDialog(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Tous les Soldes */}
      {showAllBalancesDialog && (
        <div className="dialog-overlay" onClick={() => setShowAllBalancesDialog(false)}>
          <div className="dialog dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Soldes de Congés - Tous les Employés</h2>
              <button className="btn-close" onClick={() => setShowAllBalancesDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="balance-list-container">
              {leaveBalances && leaveBalances.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employé</th>
                        <th>Congés Annuels Alloués</th>
                        <th>Congés Annuels Utilisés</th>
                        <th>Congés Annuels Restants</th>
                        <th>Congés Maladie Alloués</th>
                        <th>Congés Maladie Utilisés</th>
                        <th>Congés Maladie Restants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveBalances.map((balance, index) => {
                        const employee = employees.find(emp => 
                          emp.id === (typeof balance.employee === 'object' ? balance.employee?.id : balance.employee) ||
                          emp.id === balance.employee_id
                        )
                        const employeeName = employee 
                          ? `${employee.first_name} ${employee.last_name}` 
                          : (balance.employee_name || `Employé #${index + 1}`)
                        
                        return (
                          <tr key={balance.id || index}>
                            <td>{employeeName}</td>
                            <td>{balance.annual_leave || 0} jours</td>
                            <td>{balance.used_annual || 0} jours</td>
                            <td><strong>{balance.remaining_annual || 0} jours</strong></td>
                            <td>{balance.sick_leave || 0} jours</td>
                            <td>{balance.used_sick || 0} jours</td>
                            <td><strong>{balance.remaining_sick || 0} jours</strong></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">Aucun solde de congé trouvé</p>
              )}
            </div>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setShowAllBalancesDialog(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Confirmation Suppression */}
      {deleteConfirm && (
        <div className="dialog-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="dialog dialog-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmer la suppression</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer la demande de congé de{' '}
              <strong>{deleteConfirm.employee_name}</strong> du{' '}
              <strong>{formatDate(deleteConfirm.start_date)}</strong> au{' '}
              <strong>{formatDate(deleteConfirm.end_date)}</strong> ?
            </p>
            <p className="warning-text">
              <strong>Attention :</strong> Cette action est irréversible.
            </p>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Annuler
              </button>
              <button className="btn-danger" onClick={handleDeleteLeave}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

// Composant Onglet Retards / Heures supp.
const RetardsTab = () => {
  const [lateEmployees, setLateEmployees] = useState([])
  const [overtimeStats, setOvertimeStats] = useState(null)
  const [trackings, setTrackings] = useState([])
  const [filteredTrackings, setFilteredTrackings] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Filtres
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [filterEmployee, setFilterEmployee] = useState('')
  const [showOnlyLate, setShowOnlyLate] = useState(false)
  const [showOnlyOvertime, setShowOnlyOvertime] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const stats = {
    totalLate: (trackings || []).filter(t => t.is_late || t.status === 'LATE').length,
    totalOvertime: (trackings || []).reduce((sum, t) => sum + (parseFloat(t.overtime_hours) || 0), 0).toFixed(2),
    totalLateMinutes: (trackings || []).reduce((sum, t) => sum + (parseInt(t.late_minutes) || 0), 0),
    avgLateMinutes: (trackings || []).filter(t => t.is_late).length > 0
      ? Math.round((trackings || []).filter(t => t.is_late).reduce((sum, t) => sum + (parseInt(t.late_minutes) || 0), 0) / (trackings || []).filter(t => t.is_late).length)
      : 0
  }

  const fetchTrackings = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterDate) params.date = filterDate
      if (filterEmployee) params.employee = filterEmployee
      
      const response = await api.get('/ditech/presence-tracking/', { params })
      setTrackings(response.data)
      setFilteredTrackings(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des pointages:', err)
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterEmployee])

  const fetchLateEmployees = useCallback(async () => {
    try {
      const params = filterDate ? { date: filterDate } : {}
      const response = await api.get('/ditech/presence-tracking/late_employees/', { params })
      setLateEmployees(response.data.employees || [])
    } catch (err) {
      console.error('Erreur lors de la récupération des retards:', err)
    }
  }, [filterDate])

  const fetchOvertimeStats = useCallback(async () => {
    try {
      const today = new Date()
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      const endDate = today.toISOString().split('T')[0]
      
      const response = await api.get('/ditech/presence-tracking/overtime_stats/', {
        params: { start_date: startDate, end_date: endDate }
      })
      setOvertimeStats(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err)
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

  const filterTrackings = useCallback(() => {
    let filtered = [...trackings]

    if (filterEmployee) {
      filtered = filtered.filter(t => t.employee?.id === parseInt(filterEmployee))
    }

    if (showOnlyLate) {
      filtered = filtered.filter(t => t.is_late || t.status === 'LATE')
    }

    if (showOnlyOvertime) {
      filtered = filtered.filter(t => parseFloat(t.overtime_hours) > 0)
    }

    setFilteredTrackings(filtered)
    setCurrentPage(1)
  }, [filterEmployee, showOnlyLate, showOnlyOvertime, trackings])

  useEffect(() => {
    fetchTrackings()
  }, [fetchTrackings])

  useEffect(() => {
    fetchLateEmployees()
  }, [fetchLateEmployees])

  useEffect(() => {
    fetchOvertimeStats()
  }, [fetchOvertimeStats])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  useEffect(() => {
    if (!loading) {
      filterTrackings()
    }
  }, [filterTrackings, loading])

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR')
  }

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-'
    const date = new Date(dateTimeString)
    return date.toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return '-'
    return timeString.slice(0, 5)
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (t) => t.employee_name || t.employee?.name || '-' },
      { header: 'Date', key: 'date', accessor: (t) => formatDate(t.date) || '-' },
      { header: 'Heure d\'arrivée', key: 'check_in_time', accessor: (t) => t.check_in_time ? formatDateTime(t.check_in_time).split(' ')[1] : '-' },
      { header: 'Heure attendue', key: 'expected_check_in', accessor: (t) => formatTime(t.expected_check_in) || '-' },
      { header: 'En retard', key: 'is_late', accessor: (t) => t.is_late ? 'Oui' : 'Non' },
      { header: 'Minutes de retard', key: 'late_minutes', accessor: (t) => t.late_minutes ? `${t.late_minutes} min` : '-' },
      { header: 'Heures supplémentaires', key: 'overtime_hours', accessor: (t) => t.overtime_hours ? `${t.overtime_hours}h` : '-' },
      { header: 'Statut', key: 'status', accessor: (t) => {
        if (t.status === 'LATE') return 'En retard'
        if (t.status === 'PRESENT') return 'Présent'
        return t.status || '-'
      }}
    ]
    exportToPDF(filteredTrackings, columns, 'Liste des Retards et Heures Supplémentaires', 'retards_heures_sup')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (t) => t.employee_name || t.employee?.name || '-' },
      { header: 'Date', key: 'date', accessor: (t) => t.date || '-' },
      { header: 'Heure d\'arrivée', key: 'check_in_time', accessor: (t) => t.check_in_time || '-' },
      { header: 'Heure attendue', key: 'expected_check_in', accessor: (t) => t.expected_check_in || '-' },
      { header: 'En retard', key: 'is_late', accessor: (t) => t.is_late ? 'Oui' : 'Non' },
      { header: 'Minutes de retard', key: 'late_minutes', accessor: (t) => t.late_minutes || 0 },
      { header: 'Heures supplémentaires', key: 'overtime_hours', accessor: (t) => t.overtime_hours || 0 },
      { header: 'Statut', key: 'status', accessor: (t) => {
        if (t.status === 'LATE') return 'En retard'
        if (t.status === 'PRESENT') return 'Présent'
        return t.status || '-'
      }}
    ]
    exportToExcel(filteredTrackings, columns, 'Retards et Heures Supp', 'retards_heures_sup')
    showToast('Export Excel en cours...', 'success')
  }

  const totalPages = Math.ceil((filteredTrackings?.length || 0) / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = startIndex + rowsPerPage
  const currentTrackings = (filteredTrackings || []).slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des données...</p>
      </div>
    )
  }

  return (
    <div className="tab-panel">
      <div className="page-header">
        <h1>Retards / Heures supp.</h1>
        <p>Retards et heures supplémentaires</p>
      </div>
      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><AlertTriangle size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalLate}</div>
            <div className="stat-label">Total Retards</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Clock size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalLateMinutes}</div>
            <div className="stat-label">Minutes de Retard</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><BarChart3 size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.avgLateMinutes}</div>
            <div className="stat-label">Retard Moyen (min)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Zap size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalOvertime}</div>
            <div className="stat-label">Heures Supp. Total</div>
          </div>
        </div>
        {overtimeStats && (
          <div className="stat-card">
            <div className="stat-icon"><TrendingUp size={32} /></div>
            <div className="stat-content">
              <div className="stat-value">{overtimeStats.summary?.total_days_with_overtime || 0}</div>
              <div className="stat-label">Jours avec H. Supp.</div>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques Heures Supp. détaillées */}
      {overtimeStats && overtimeStats.summary && (
        <div className="overtime-summary">
          <h3>Résumé des Heures Supplémentaires (mois en cours)</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total heures supp.:</span>
              <span className="summary-value">{parseFloat(overtimeStats.summary.total_overtime_hours || 0).toFixed(2)}h</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Moyenne par jour:</span>
              <span className="summary-value">{parseFloat(overtimeStats.summary.average_overtime_per_day || 0).toFixed(2)}h</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Jours avec heures supp.:</span>
              <span className="summary-value">{overtimeStats.summary.total_days_with_overtime || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value)
                fetchTrackings()
                fetchLateEmployees()
              }}
              className="filter-input"
            />
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
                checked={showOnlyLate}
                onChange={(e) => setShowOnlyLate(e.target.checked)}
              />
              <span>Retards uniquement</span>
            </label>
          </div>
          <div className="filter-group">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={showOnlyOvertime}
                onChange={(e) => setShowOnlyOvertime(e.target.checked)}
              />
              <span>Heures supp. uniquement</span>
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
        </div>
      </div>

      {/* Liste des Retards */}
      {(showOnlyLate || filterDate === new Date().toISOString().split('T')[0]) && lateEmployees.length > 0 && (
        <div className="section-title">
          <h3>Employés en Retard - {formatDate(filterDate)}</h3>
        </div>
      )}
      
      {lateEmployees.length > 0 && (
        <div className="late-employees-list">
          {lateEmployees.map((item, index) => (
            <div key={index} className="late-employee-card">
              <div className="late-employee-info">
                <span className="late-employee-name">{item.employee?.name || item.name}</span>
                <span className="late-employee-id">({item.employee?.employee_id || item.employee_id})</span>
              </div>
              <div className="late-employee-details">
                <span className="late-time">
                  Arrivée: {formatTime(item.expected_check_in)} → {formatDateTime(item.check_in_time)}
                </span>
                <span className="late-minutes">Retard: {item.late_minutes} min</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tableau Retards et Heures Supp. */}
      <div className="section-title">
        <h3>Détails des Pointages</h3>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Date</th>
              <th>Heure Arrivée</th>
              <th>Heure Attendue</th>
              <th>Retard (min)</th>
              <th>Heures Travaillées</th>
              <th>Heures Supp.</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {currentTrackings.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">Aucun pointage trouvé</td>
              </tr>
            ) : (
              currentTrackings.map(tracking => (
                <tr key={tracking.id} className={tracking.is_late ? 'late-row' : ''}>
                  <td>{tracking.employee_name || '-'}</td>
                  <td>{formatDate(tracking.date)}</td>
                  <td>{formatDateTime(tracking.check_in_time)}</td>
                  <td>{formatTime(tracking.expected_check_in)}</td>
                  <td>
                    {tracking.is_late ? (
                      <span className="late-badge"><Clock size={14} /> {tracking.late_minutes} min</span>
                    ) : (
                      <span className="no-late"><CheckCircle2 size={14} /> À l'heure</span>
                    )}
                  </td>
                  <td>{tracking.worked_hours ? `${tracking.worked_hours}h` : '-'}</td>
                  <td>
                    {parseFloat(tracking.overtime_hours) > 0 ? (
                      <span className="overtime-badge"><Zap size={14} /> {tracking.overtime_hours}h</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${tracking.is_late ? 'status-late' : 'status-present'}`}>
                      {tracking.is_late ? 'En retard' : 'Présent'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Statistiques par Employé (Heures Supp.) */}
      {overtimeStats && overtimeStats.by_employee && overtimeStats.by_employee.length > 0 && (
        <>
          <div className="section-title">
            <h3>Heures Supplémentaires par Employé</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Total Heures Supp.</th>
                  <th>Jours avec H. Supp.</th>
                  <th>Moyenne par jour</th>
                </tr>
              </thead>
              <tbody>
                {overtimeStats.by_employee.map((item, index) => (
                  <tr key={index}>
                    <td>{item.employee?.name || '-'}</td>
                    <td>
                      <span className="overtime-badge"><Zap size={14} /> {parseFloat(item.total_overtime).toFixed(2)}h</span>
                    </td>
                    <td>{item.days_with_overtime || 0} jours</td>
                    <td>{item.days_with_overtime > 0 ? (parseFloat(item.total_overtime) / item.days_with_overtime).toFixed(2) : 0}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

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

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default PresenceAbsence
