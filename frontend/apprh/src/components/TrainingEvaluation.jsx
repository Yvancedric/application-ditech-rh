import React, { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { exportToPDF, exportToExcel } from '../utils/exportUtils'
import { Book, Star, MessageSquare, ClipboardList, RefreshCw, CheckCircle2, XCircle, FileText, FileSpreadsheet, Plus, Pencil, Trash2, X, BarChart3, AlertTriangle, CheckCircle, ThumbsUp, Eye } from 'lucide-react'
import './TrainingEvaluation.css'

const TrainingEvaluation = ({ tab = 'plans' }) => {
  const [activeTab, setActiveTab] = useState(tab)

  React.useEffect(() => {
    setActiveTab(tab)
  }, [tab])

  const showOnlyTab = tab && tab !== 'all'

  return (
    <div className="training-evaluation-page">
      {!showOnlyTab && (
        <>
          <div className="page-header">
            <h1>Formation & Évaluation</h1>
            <p>Plan de formation - Évaluations annuelles - Feedback managers</p>
          </div>

          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'plans' ? 'active' : ''}`}
              onClick={() => setActiveTab('plans')}
            >
              <Book size={18} /> Plan de formation
            </button>
            <button
              className={`tab-button ${activeTab === 'evaluations' ? 'active' : ''}`}
              onClick={() => setActiveTab('evaluations')}
            >
              <Star size={18} /> Évaluations annuelles
            </button>
            <button
              className={`tab-button ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedback')}
            >
              <MessageSquare size={18} /> Feedback managers
            </button>
          </div>
        </>
      )}

      <div className="tab-content">
        {activeTab === 'plans' && <TrainingPlansTab />}
        {activeTab === 'evaluations' && <EvaluationsTab />}
        {activeTab === 'feedback' && <ManagerFeedbackTab />}
      </div>
    </div>
  )
}

// Composant Onglet Plan de formation
const TrainingPlansTab = () => {
  const [plans, setPlans] = useState([])
  const [filteredPlans, setFilteredPlans] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    employee: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    objectives: '',
    budget: '',
    status: 'DRAFT'
  })
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')

  const stats = {
    total: (plans || []).length,
    draft: (plans || []).filter(p => p.status === 'DRAFT').length,
    active: (plans || []).filter(p => p.status === 'ACTIVE').length,
    completed: (plans || []).filter(p => p.status === 'COMPLETED').length,
    cancelled: (plans || []).filter(p => p.status === 'CANCELLED').length
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/training-plans/')
      setPlans(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des plans de formation:', err)
      setError('Erreur lors de la récupération des plans de formation')
      showToast('Erreur lors de la récupération des plans de formation', 'error')
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
    fetchPlans()
    fetchEmployees()
  }, [fetchPlans, fetchEmployees])

  const filterPlans = useCallback(() => {
    let filtered = [...plans]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(plan =>
        plan.title?.toLowerCase().includes(term) ||
        plan.employee_name?.toLowerCase().includes(term) ||
        plan.description?.toLowerCase().includes(term)
      )
    }

    if (filterStatus) {
      filtered = filtered.filter(plan => plan.status === filterStatus)
    }

    if (filterEmployee) {
      filtered = filtered.filter(plan => plan.employee === parseInt(filterEmployee))
    }

    setFilteredPlans(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterEmployee, plans])

  useEffect(() => {
    if (!loading) {
      filterPlans()
    }
  }, [filterPlans, loading])

  const openAddDialog = () => {
    setFormData({
      employee: '',
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      objectives: '',
      budget: '',
      status: 'DRAFT'
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        employee: parseInt(formData.employee)
      }

      await api.post('/ditech/training-plans/', data)
      showToast('Plan de formation créé avec succès', 'success')
      setShowDialog(false)
      fetchPlans()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          'Erreur lors de la sauvegarde du plan de formation'
      showToast(errorMessage, 'error')
    }
  }

  const _handleDeletePlan = async (plan) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le plan "${plan.title}" ?`)) {
      return
    }
    try {
      await api.delete(`/ditech/training-plans/${plan.id}/`)
      showToast('Plan de formation supprimé avec succès', 'success')
      fetchPlans()
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      showToast('Erreur lors de la suppression du plan de formation', 'error')
    }
  }

  const _handleStatusChange = async (plan, action) => {
    try {
      if (action === 'activate') {
        await api.post(`/ditech/training-plans/${plan.id}/activate/`)
        showToast('Plan de formation activé', 'success')
      } else if (action === 'complete') {
        await api.post(`/ditech/training-plans/${plan.id}/complete/`)
        showToast('Plan de formation terminé', 'success')
      }
      fetchPlans()
    } catch (err) {
      console.error('Erreur lors du changement de statut:', err)
      showToast('Erreur lors du changement de statut', 'error')
    }
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (p) => p.employee_name || '-' },
      { header: 'Titre', key: 'title', accessor: (p) => p.title || '-' },
      { header: 'Date de début', key: 'start_date', accessor: (p) => p.start_date || '-' },
      { header: 'Date de fin', key: 'end_date', accessor: (p) => p.end_date || '-' },
      { header: 'Taux de complétion', key: 'completion_rate', accessor: (p) => p.completion_rate ? `${p.completion_rate}%` : '0%' },
      { header: 'Budget', key: 'budget', accessor: (p) => p.budget ? `${parseFloat(p.budget).toLocaleString('fr-FR')} FCFA` : '-' },
      { header: 'Statut', key: 'status', accessor: (p) => {
        const statusMap = { 'DRAFT': 'Brouillon', 'ACTIVE': 'Actif', 'COMPLETED': 'Terminé', 'CANCELLED': 'Annulé' }
        return statusMap[p.status] || p.status || '-'
      }}
    ]
    exportToPDF(filteredPlans, columns, 'Liste des Plans de Formation', 'plans_formation')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (p) => p.employee_name || '-' },
      { header: 'Titre', key: 'title', accessor: (p) => p.title || '-' },
      { header: 'Date de début', key: 'start_date', accessor: (p) => p.start_date || '-' },
      { header: 'Date de fin', key: 'end_date', accessor: (p) => p.end_date || '-' },
      { header: 'Taux de complétion', key: 'completion_rate', accessor: (p) => p.completion_rate || 0 },
      { header: 'Budget', key: 'budget', accessor: (p) => p.budget ? parseFloat(p.budget) : 0 },
      { header: 'Statut', key: 'status', accessor: (p) => {
        const statusMap = { 'DRAFT': 'Brouillon', 'ACTIVE': 'Actif', 'COMPLETED': 'Terminé', 'CANCELLED': 'Annulé' }
        return statusMap[p.status] || p.status || '-'
      }}
    ]
    exportToExcel(filteredPlans, columns, 'Plans de Formation', 'plans_formation')
    showToast('Export Excel en cours...', 'success')
  }

  const getStatusDisplay = (status) => {
    const statusMap = {
      'DRAFT': 'Brouillon',
      'ACTIVE': 'Actif',
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé'
    }
    return statusMap[status] || status
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'DRAFT': return 'status-draft'
      case 'ACTIVE': return 'status-active'
      case 'COMPLETED': return 'status-completed'
      case 'CANCELLED': return 'status-cancelled'
      default: return ''
    }
  }

  const indexOfLastPlan = currentPage * rowsPerPage
  const indexOfFirstPlan = indexOfLastPlan - rowsPerPage
  const currentPlans = filteredPlans.slice(indexOfFirstPlan, indexOfLastPlan)
  const totalPages = Math.ceil(filteredPlans.length / rowsPerPage)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des plans de formation...</p>
      </div>
    )
  }

  return (
    <div className="training-plans-tab">
      <div className="page-header">
        <h1>Plan de formation</h1>
        <p>Gestion des plans de formation des employés</p>
      </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon"><ClipboardList size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card stat-draft">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <div className="stat-label">Brouillons</div>
            <div className="stat-value">{stats.draft}</div>
          </div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-icon"><RefreshCw size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Actifs</div>
            <div className="stat-value">{stats.active}</div>
          </div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-icon"><CheckCircle2 size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Terminés</div>
            <div className="stat-value">{stats.completed}</div>
          </div>
        </div>
        <div className="stat-card stat-cancelled">
          <div className="stat-icon"><XCircle size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Annulés</div>
            <div className="stat-value">{stats.cancelled}</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Rechercher par titre, employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="ACTIVE">Actif</option>
              <option value="COMPLETED">Terminé</option>
              <option value="CANCELLED">Annulé</option>
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
                  {emp.user?.first_name} {emp.user?.last_name} - {emp.employee_id}
                </option>
              ))}
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
            <Plus size={16} /> Nouveau Plan
          </button>
        </div>
      </div>

      {/* Tableau */}
      {currentPlans.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Titre</th>
                <th>Date début</th>
                <th>Date fin</th>
                <th>Taux complétion</th>
                <th>Budget</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {currentPlans.map(plan => (
                <tr key={plan.id}>
                  <td>
                    <div>
                      <strong>{plan.employee_name || '-'}</strong>
                    </div>
                  </td>
                  <td>{plan.title}</td>
                  <td>{plan.start_date ? new Date(plan.start_date).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>{plan.end_date ? new Date(plan.end_date).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>
                    <span className="progress-badge">
                      {plan.completion_rate?.toFixed(1) || 0}%
                    </span>
                  </td>
                  <td>{plan.budget ? `${parseFloat(plan.budget).toFixed(2)} FCFA` : '-'}</td>
                  <td>
                    <span className={`badge status-${getStatusClass(plan.status)}`}>
                      {plan.status_display || getStatusDisplay(plan.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucun plan de formation trouvé</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </button>
          <span className="pagination-info">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Dialog Formulaire Plan */}
      {showDialog && (
        <div className="dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="dialog dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Nouveau Plan de Formation</h2>
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
                        {emp.user?.first_name} {emp.user?.last_name} - {emp.employee_id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="ACTIVE">Actif</option>
                    <option value="COMPLETED">Terminé</option>
                    <option value="CANCELLED">Annulé</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Titre *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Titre du plan de formation"
                  />
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
                  <label>Date de fin</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Budget (FCFA)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="Description du plan de formation..."
                />
              </div>
              <div className="form-group full-width">
                <label>Objectifs *</label>
                <textarea
                  value={formData.objectives}
                  onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                  rows="4"
                  required
                  placeholder="Objectifs du plan de formation..."
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

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

// Composant Onglet Évaluations annuelles
const EvaluationsTab = () => {
  const [evaluations, setEvaluations] = useState([])
  const [filteredEvaluations, setFilteredEvaluations] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingEvaluation, setEditingEvaluation] = useState(null)
  const [formData, setFormData] = useState({
    employee: '',
    evaluation_date: '',
    evaluation_type: 'ANNUAL',
    status: 'DRAFT',
    performance_score: '',
    quality_score: '',
    productivity_score: '',
    teamwork_score: '',
    communication_score: '',
    initiative_score: '',
    comments: '',
    strengths: '',
    areas_for_improvement: '',
    goals: ''
  })
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')

  const stats = {
    total: (evaluations || []).length,
    draft: (evaluations || []).filter(e => e.status === 'DRAFT').length,
    inProgress: (evaluations || []).filter(e => e.status === 'IN_PROGRESS').length,
    completed: (evaluations || []).filter(e => e.status === 'COMPLETED').length,
    approved: (evaluations || []).filter(e => e.status === 'APPROVED').length
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchEvaluations = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/evaluations/')
      setEvaluations(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des évaluations:', err)
      setError('Erreur lors de la récupération des évaluations')
      showToast('Erreur lors de la récupération des évaluations', 'error')
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
    fetchEvaluations()
    fetchEmployees()
  }, [fetchEvaluations, fetchEmployees])

  const filterEvaluations = useCallback(() => {
    let filtered = [...evaluations]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(evaluation =>
        evaluation.employee_name?.toLowerCase().includes(term) ||
        evaluation.evaluation_type_display?.toLowerCase().includes(term) ||
        evaluation.comments?.toLowerCase().includes(term)
      )
    }

    if (filterStatus) {
      filtered = filtered.filter(evaluation => evaluation.status === filterStatus)
    }

    if (filterType) {
      filtered = filtered.filter(evaluation => evaluation.evaluation_type === filterType)
    }

    if (filterEmployee) {
      filtered = filtered.filter(evaluation => evaluation.employee === parseInt(filterEmployee))
    }

    setFilteredEvaluations(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterType, filterEmployee, evaluations])

  useEffect(() => {
    if (!loading) {
      filterEvaluations()
    }
  }, [filterEvaluations, loading])

  const openAddDialog = () => {
    setEditingEvaluation(null)
    setFormData({
      employee: '',
      evaluation_date: new Date().toISOString().split('T')[0],
      evaluation_type: 'ANNUAL',
      status: 'DRAFT',
      performance_score: '',
      quality_score: '',
      productivity_score: '',
      teamwork_score: '',
      communication_score: '',
      initiative_score: '',
      comments: '',
      strengths: '',
      areas_for_improvement: '',
      goals: ''
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        employee: parseInt(formData.employee),
        performance_score: formData.performance_score ? parseFloat(formData.performance_score) : null,
        quality_score: formData.quality_score ? parseFloat(formData.quality_score) : null,
        productivity_score: formData.productivity_score ? parseFloat(formData.productivity_score) : null,
        teamwork_score: formData.teamwork_score ? parseFloat(formData.teamwork_score) : null,
        communication_score: formData.communication_score ? parseFloat(formData.communication_score) : null,
        initiative_score: formData.initiative_score ? parseFloat(formData.initiative_score) : null
      }

      await api.post('/ditech/evaluations/', data)
      showToast('Évaluation créée avec succès', 'success')
      setShowDialog(false)
      fetchEvaluations()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          'Erreur lors de la sauvegarde de l\'évaluation'
      showToast(errorMessage, 'error')
    }
  }

  const _handleDeleteEvaluation = async (evaluation) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'évaluation de "${evaluation.employee_name}" ?`)) {
      return
    }
    try {
      await api.delete(`/ditech/evaluations/${evaluation.id}/`)
      showToast('Évaluation supprimée avec succès', 'success')
      fetchEvaluations()
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      showToast('Erreur lors de la suppression de l\'évaluation', 'error')
    }
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (e) => e.employee_name || '-' },
      { header: 'Type', key: 'evaluation_type', accessor: (e) => e.evaluation_type_display || getTypeDisplay(e.evaluation_type) || '-' },
      { header: 'Date', key: 'evaluation_date', accessor: (e) => e.evaluation_date || '-' },
      { header: 'Note performance', key: 'performance_score', accessor: (e) => e.performance_score || 0 },
      { header: 'Note qualité', key: 'quality_score', accessor: (e) => e.quality_score || 0 },
      { header: 'Note productivité', key: 'productivity_score', accessor: (e) => e.productivity_score || 0 },
      { header: 'Note travail d\'équipe', key: 'teamwork_score', accessor: (e) => e.teamwork_score || 0 },
      { header: 'Note communication', key: 'communication_score', accessor: (e) => e.communication_score || 0 },
      { header: 'Note initiative', key: 'initiative_score', accessor: (e) => e.initiative_score || 0 },
      { header: 'Note globale', key: 'overall_score', accessor: (e) => e.overall_score || 0 },
      { header: 'Statut', key: 'status', accessor: (e) => e.status_display || getStatusDisplay(e.status) || '-' }
    ]
    exportToPDF(filteredEvaluations, columns, 'Liste des Évaluations Annuelles', 'evaluations_annuelles')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (e) => e.employee_name || '-' },
      { header: 'Type', key: 'evaluation_type', accessor: (e) => e.evaluation_type_display || getTypeDisplay(e.evaluation_type) || '-' },
      { header: 'Date', key: 'evaluation_date', accessor: (e) => e.evaluation_date || '-' },
      { header: 'Note performance', key: 'performance_score', accessor: (e) => e.performance_score || 0 },
      { header: 'Note qualité', key: 'quality_score', accessor: (e) => e.quality_score || 0 },
      { header: 'Note productivité', key: 'productivity_score', accessor: (e) => e.productivity_score || 0 },
      { header: 'Note travail d\'équipe', key: 'teamwork_score', accessor: (e) => e.teamwork_score || 0 },
      { header: 'Note communication', key: 'communication_score', accessor: (e) => e.communication_score || 0 },
      { header: 'Note initiative', key: 'initiative_score', accessor: (e) => e.initiative_score || 0 },
      { header: 'Note globale', key: 'overall_score', accessor: (e) => e.overall_score || 0 },
      { header: 'Statut', key: 'status', accessor: (e) => e.status_display || getStatusDisplay(e.status) || '-' }
    ]
    exportToExcel(filteredEvaluations, columns, 'Évaluations Annuelles', 'evaluations_annuelles')
    showToast('Export Excel en cours...', 'success')
  }

  const getStatusDisplay = (status) => {
    const statusMap = {
      'DRAFT': 'Brouillon',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Terminée',
      'APPROVED': 'Approuvée'
    }
    return statusMap[status] || status
  }

  const getTypeDisplay = (type) => {
    const typeMap = {
      'ANNUAL': 'Annuelle',
      'SEMESTRIAL': 'Semestrielle',
      'QUARTERLY': 'Trimestrielle',
      'MONTHLY': 'Mensuelle',
      'PROJECT': 'Projet',
      'PROMOTION': 'Promotion'
    }
    return typeMap[type] || type
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'DRAFT': return 'status-draft'
      case 'IN_PROGRESS': return 'status-active'
      case 'COMPLETED': return 'status-completed'
      case 'APPROVED': return 'status-completed'
      default: return ''
    }
  }

  const indexOfLastEvaluation = currentPage * rowsPerPage
  const indexOfFirstEvaluation = indexOfLastEvaluation - rowsPerPage
  const currentEvaluations = filteredEvaluations.slice(indexOfFirstEvaluation, indexOfLastEvaluation)
  const totalPages = Math.ceil(filteredEvaluations.length / rowsPerPage)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des évaluations...</p>
      </div>
    )
  }

  return (
    <div className="evaluations-tab">
      <div className="page-header">
        <h1>Évaluations annuelles</h1>
        <p>Gestion des évaluations annuelles des employés</p>
      </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon"><Star size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card stat-draft">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <div className="stat-label">Brouillons</div>
            <div className="stat-value">{stats.draft}</div>
          </div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-icon"><RefreshCw size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">En cours</div>
            <div className="stat-value">{stats.inProgress}</div>
          </div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-icon"><CheckCircle2 size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Terminées</div>
            <div className="stat-value">{stats.completed}</div>
          </div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-icon"><ThumbsUp size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Approuvées</div>
            <div className="stat-value">{stats.approved}</div>
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="COMPLETED">Terminée</option>
              <option value="APPROVED">Approuvée</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les types</option>
              <option value="ANNUAL">Annuelle</option>
              <option value="SEMESTRIAL">Semestrielle</option>
              <option value="QUARTERLY">Trimestrielle</option>
              <option value="MONTHLY">Mensuelle</option>
              <option value="PROJECT">Projet</option>
              <option value="PROMOTION">Promotion</option>
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
                  {emp.user?.first_name} {emp.user?.last_name} - {emp.employee_id}
                </option>
              ))}
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
          <button type="button" className="btn-primary" onClick={openAddDialog}>
            <Plus size={16} /> Nouvelle Évaluation
          </button>
        </div>
      </div>

      {/* Tableau */}
      {currentEvaluations.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Date</th>
                <th>Type</th>
                <th>Note Globale</th>
                <th>Moyenne</th>
                <th>Statut</th>
                <th>Évalué par</th>
              </tr>
            </thead>
            <tbody>
              {currentEvaluations.map(evaluation => (
                <tr key={evaluation.id}>
                  <td>
                    <div>
                      <strong>{evaluation.employee_name || '-'}</strong>
                    </div>
                  </td>
                  <td>{evaluation.evaluation_date ? new Date(evaluation.evaluation_date).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>{getTypeDisplay(evaluation.evaluation_type)}</td>
                  <td>
                    {evaluation.performance_score ? (
                      <span className="rating-badge">
                        <Star size={14} /> {evaluation.performance_score}/5
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    {evaluation.average_score ? (
                      <span className="rating-badge">
                        <BarChart3 size={14} /> {evaluation.average_score.toFixed(2)}/5
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    <span className={`badge status-${getStatusClass(evaluation.status)}`}>
                      {evaluation.status_display || getStatusDisplay(evaluation.status)}
                    </span>
                  </td>
                  <td>{evaluation.evaluated_by_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucune évaluation trouvée</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </button>
          <span className="pagination-info">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Dialog Formulaire Évaluation */}
      {showDialog && (
        <div className="dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="dialog dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>{editingEvaluation ? 'Modifier l\'Évaluation' : 'Nouvelle Évaluation'}</h2>
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
                        {emp.user?.first_name} {emp.user?.last_name} - {emp.employee_id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date d'évaluation *</label>
                  <input
                    type="date"
                    value={formData.evaluation_date}
                    onChange={(e) => setFormData({ ...formData, evaluation_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={formData.evaluation_type}
                    onChange={(e) => setFormData({ ...formData, evaluation_type: e.target.value })}
                    required
                  >
                    <option value="ANNUAL">Annuelle</option>
                    <option value="SEMESTRIAL">Semestrielle</option>
                    <option value="QUARTERLY">Trimestrielle</option>
                    <option value="MONTHLY">Mensuelle</option>
                    <option value="PROJECT">Projet</option>
                    <option value="PROMOTION">Promotion</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="COMPLETED">Terminée</option>
                    <option value="APPROVED">Approuvée</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Note globale (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.performance_score}
                    onChange={(e) => setFormData({ ...formData, performance_score: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div className="form-group">
                  <label>Qualité (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.quality_score}
                    onChange={(e) => setFormData({ ...formData, quality_score: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div className="form-group">
                  <label>Productivité (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.productivity_score}
                    onChange={(e) => setFormData({ ...formData, productivity_score: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div className="form-group">
                  <label>Travail d'équipe (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.teamwork_score}
                    onChange={(e) => setFormData({ ...formData, teamwork_score: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Communication (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.communication_score}
                    onChange={(e) => setFormData({ ...formData, communication_score: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div className="form-group">
                  <label>Initiative (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.initiative_score}
                    onChange={(e) => setFormData({ ...formData, initiative_score: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Commentaires généraux</label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  rows="3"
                  placeholder="Commentaires généraux sur l'évaluation..."
                />
              </div>
              <div className="form-group full-width">
                <label>Points forts</label>
                <textarea
                  value={formData.strengths}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  rows="3"
                  placeholder="Points forts de l'employé..."
                />
              </div>
              <div className="form-group full-width">
                <label>Axes d'amélioration</label>
                <textarea
                  value={formData.areas_for_improvement}
                  onChange={(e) => setFormData({ ...formData, areas_for_improvement: e.target.value })}
                  rows="3"
                  placeholder="Axes d'amélioration..."
                />
              </div>
              <div className="form-group full-width">
                <label>Objectifs</label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  rows="3"
                  placeholder="Objectifs pour la prochaine période..."
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

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

// Composant Onglet Feedback managers
const ManagerFeedbackTab = () => {
  const [evaluations, setEvaluations] = useState([])
  const [filteredEvaluations, setFilteredEvaluations] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedEvaluation, setSelectedEvaluation] = useState(null)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [showViewFeedbackDialog, setShowViewFeedbackDialog] = useState(false)
  const [feedbackFormData, setFeedbackFormData] = useState({
    manager_feedback: '',
    manager_recommendations: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10
  const [confirmDialog, setConfirmDialog] = useState(null)

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterStatus, setFilterStatus] = useState('COMPLETED')

  const stats = {
    total: (evaluations || []).filter(e => e.status === 'COMPLETED' || e.status === 'APPROVED').length,
    withFeedback: (evaluations || []).filter(e => e.manager_feedback && (e.status === 'COMPLETED' || e.status === 'APPROVED')).length,
    withoutFeedback: (evaluations || []).filter(e => !e.manager_feedback && (e.status === 'COMPLETED' || e.status === 'APPROVED')).length,
    approved: (evaluations || []).filter(e => e.status === 'APPROVED').length
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchEvaluations = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/evaluations/')
      // Filtrer pour n'afficher que les évaluations terminées ou approuvées
      const completedEvaluations = response.data.filter(e => 
        e.status === 'COMPLETED' || e.status === 'APPROVED'
      )
      setEvaluations(completedEvaluations)
    } catch (err) {
      console.error('Erreur lors de la récupération des évaluations:', err)
      setError('Erreur lors de la récupération des évaluations')
      showToast('Erreur lors de la récupération des évaluations', 'error')
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
    fetchEvaluations()
    fetchEmployees()
  }, [fetchEvaluations, fetchEmployees])

  const filterEvaluations = useCallback(() => {
    let filtered = [...evaluations]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(evaluation =>
        evaluation.employee_name?.toLowerCase().includes(term) ||
        evaluation.manager_feedback?.toLowerCase().includes(term) ||
        evaluation.manager_recommendations?.toLowerCase().includes(term)
      )
    }

    if (filterEmployee) {
      filtered = filtered.filter(evaluation => evaluation.employee === parseInt(filterEmployee))
    }

    if (filterStatus && filterStatus !== 'ALL') {
      filtered = filtered.filter(evaluation => evaluation.status === filterStatus)
    }

    setFilteredEvaluations(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterEmployee, filterStatus, evaluations])

  useEffect(() => {
    if (!loading) {
      filterEvaluations()
    }
  }, [filterEvaluations, loading])

  const openFeedbackDialog = (evaluation) => {
    setSelectedEvaluation(evaluation)
    setFeedbackFormData({
      manager_feedback: evaluation.manager_feedback || '',
      manager_recommendations: evaluation.manager_recommendations || ''
    })
    setShowFeedbackDialog(true)
  }

  const _openViewFeedbackDialog = (evaluation) => {
    setSelectedEvaluation(evaluation)
    setShowViewFeedbackDialog(true)
  }

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/ditech/evaluations/${selectedEvaluation.id}/add_manager_feedback/`, feedbackFormData)
      showToast('Feedback manager ajouté avec succès', 'success')
      setShowFeedbackDialog(false)
      fetchEvaluations()
    } catch (err) {
      console.error('Erreur lors de l\'ajout du feedback:', err)
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          'Erreur lors de l\'ajout du feedback manager'
      showToast(errorMessage, 'error')
    }
  }

  const _handleApprove = async (evaluation) => {
    setConfirmDialog({
      message: `Approuver l'évaluation de "${evaluation.employee_name}" ?`,
      onConfirm: async () => {
        try {
          await api.post(`/ditech/evaluations/${evaluation.id}/approve/`)
          showToast('Évaluation approuvée avec succès', 'success')
          fetchEvaluations()
          setConfirmDialog(null)
        } catch (err) {
          console.error('Erreur lors de l\'approbation:', err)
          showToast('Erreur lors de l\'approbation de l\'évaluation', 'error')
          setConfirmDialog(null)
        }
      },
      onCancel: () => setConfirmDialog(null)
    })
  }

  const getStatusDisplay = (status) => {
    const statusMap = {
      'COMPLETED': 'Terminée',
      'APPROVED': 'Approuvé par la RH'
    }
    return statusMap[status] || status
  }

  const getTypeDisplay = (type) => {
    const typeMap = {
      'ANNUAL': 'Annuelle',
      'SEMESTRIAL': 'Semestrielle',
      'QUARTERLY': 'Trimestrielle',
      'MONTHLY': 'Mensuelle',
      'PROJECT': 'Projet',
      'PROMOTION': 'Promotion'
    }
    return typeMap[type] || type
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (e) => e.employee_name || '-' },
      { header: 'Type', key: 'evaluation_type', accessor: (e) => e.evaluation_type_display || getTypeDisplay(e.evaluation_type) || '-' },
      { header: 'Date', key: 'evaluation_date', accessor: (e) => e.evaluation_date || '-' },
      { header: 'Note globale', key: 'overall_score', accessor: (e) => e.overall_score || e.average_score || 0 },
      { header: 'Feedback manager', key: 'manager_feedback', accessor: (e) => e.manager_feedback || '-' },
      { header: 'Recommandations', key: 'manager_recommendations', accessor: (e) => e.manager_recommendations || '-' },
      { header: 'Statut', key: 'status', accessor: (e) => e.status_display || getStatusDisplay(e.status) || '-' }
    ]
    exportToPDF(filteredEvaluations, columns, 'Liste des Feedback Managers', 'feedback_managers')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (e) => e.employee_name || '-' },
      { header: 'Type', key: 'evaluation_type', accessor: (e) => e.evaluation_type_display || getTypeDisplay(e.evaluation_type) || '-' },
      { header: 'Date', key: 'evaluation_date', accessor: (e) => e.evaluation_date || '-' },
      { header: 'Note globale', key: 'overall_score', accessor: (e) => e.overall_score || e.average_score || 0 },
      { header: 'Feedback manager', key: 'manager_feedback', accessor: (e) => e.manager_feedback || '-' },
      { header: 'Recommandations', key: 'manager_recommendations', accessor: (e) => e.manager_recommendations || '-' },
      { header: 'Statut', key: 'status', accessor: (e) => e.status_display || getStatusDisplay(e.status) || '-' }
    ]
    exportToExcel(filteredEvaluations, columns, 'Feedback Managers', 'feedback_managers')
    showToast('Export Excel en cours...', 'success')
  }

  const indexOfLastEvaluation = currentPage * rowsPerPage
  const indexOfFirstEvaluation = indexOfLastEvaluation - rowsPerPage
  const currentEvaluations = filteredEvaluations.slice(indexOfFirstEvaluation, indexOfLastEvaluation)
  const totalPages = Math.ceil(filteredEvaluations.length / rowsPerPage)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des feedbacks managers...</p>
      </div>
    )
  }

  return (
    <div className="manager-feedback-tab">
      <div className="page-header">
        <h1>Feedback managers</h1>
        <p>Gestion du feedback des managers sur les évaluations</p>
      </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon"><BarChart3 size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Évaluations</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-icon"><MessageSquare size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Avec Feedback</div>
            <div className="stat-value">{stats.withFeedback}</div>
          </div>
        </div>
        <div className="stat-card stat-draft">
          <div className="stat-icon"><AlertTriangle size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Sans Feedback</div>
            <div className="stat-value">{stats.withoutFeedback}</div>
          </div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-icon"><ThumbsUp size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Approuvées</div>
            <div className="stat-value">{stats.approved}</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Rechercher par employé, feedback..."
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
                  {emp.user?.first_name} {emp.user?.last_name} - {emp.employee_id}
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
              <option value="ALL">Tous les statuts</option>
              <option value="COMPLETED">Terminées</option>
              <option value="APPROVED">Approuvées</option>
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
        </div>
      </div>

      {/* Tableau */}
      {currentEvaluations.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Date</th>
                <th>Type</th>
                <th>Note Moyenne</th>
                <th>Statut</th>
                <th>Feedback Manager</th>
              </tr>
            </thead>
            <tbody>
              {currentEvaluations.map(evaluation => (
                <tr key={evaluation.id}>
                  <td>
                    <div>
                      <strong>{evaluation.employee_name || '-'}</strong>
                    </div>
                  </td>
                  <td>{evaluation.evaluation_date ? new Date(evaluation.evaluation_date).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>{getTypeDisplay(evaluation.evaluation_type)}</td>
                  <td>
                    {evaluation.average_score ? (
                      <span className="rating-badge">
                        <BarChart3 size={14} /> {evaluation.average_score.toFixed(2)}/5
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    <span className={`badge status-${evaluation.status === 'APPROVED' ? 'completed' : 'active'}`}>
                      {getStatusDisplay(evaluation.status)}
                    </span>
                  </td>
                  <td>
                    {evaluation.manager_feedback ? (
                      <span className="badge status-completed" title={evaluation.manager_feedback.substring(0, 100)}>
                        <CheckCircle size={14} /> Disponible
                      </span>
                    ) : (
                      <span className="badge status-draft">
                        <AlertTriangle size={14} /> Manquant
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucune évaluation terminée trouvée</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </button>
          <span className="pagination-info">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Dialog Feedback Manager */}
      {showFeedbackDialog && selectedEvaluation && (
        <div className="dialog-overlay" onClick={() => setShowFeedbackDialog(false)}>
          <div className="dialog dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Feedback Manager - {selectedEvaluation.employee_name}</h2>
              <button className="btn-close" onClick={() => setShowFeedbackDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="dialog-form">
              <div className="approval-info">
                <p><strong>Date d'évaluation:</strong> {selectedEvaluation.evaluation_date ? new Date(selectedEvaluation.evaluation_date).toLocaleDateString('fr-FR') : '-'}</p>
                <p><strong>Type:</strong> {getTypeDisplay(selectedEvaluation.evaluation_type)}</p>
                <p><strong>Note moyenne:</strong> {selectedEvaluation.average_score ? `${selectedEvaluation.average_score.toFixed(2)}/5` : '-'}</p>
              </div>
              <div className="form-group full-width">
                <label>Feedback du manager *</label>
                <textarea
                  value={feedbackFormData.manager_feedback}
                  onChange={(e) => setFeedbackFormData({ ...feedbackFormData, manager_feedback: e.target.value })}
                  rows="6"
                  required
                  placeholder="Votre feedback sur l'évaluation de cet employé..."
                />
              </div>
              <div className="form-group full-width">
                <label>Recommandations du manager</label>
                <textarea
                  value={feedbackFormData.manager_recommendations}
                  onChange={(e) => setFeedbackFormData({ ...feedbackFormData, manager_recommendations: e.target.value })}
                  rows="4"
                  placeholder="Vos recommandations pour cet employé..."
                />
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowFeedbackDialog(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Feedback Dialog */}
      {showViewFeedbackDialog && selectedEvaluation && (
        <div className="dialog-overlay" onClick={() => setShowViewFeedbackDialog(false)}>
          <div className="dialog dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Feedback Manager - {selectedEvaluation.employee_name}</h2>
              <button className="btn-close" onClick={() => setShowViewFeedbackDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="dialog-body">
              <div className="approval-info">
                <p><strong>Date d'évaluation:</strong> {selectedEvaluation.evaluation_date ? new Date(selectedEvaluation.evaluation_date).toLocaleDateString('fr-FR') : '-'}</p>
                <p><strong>Type:</strong> {getTypeDisplay(selectedEvaluation.evaluation_type)}</p>
                <p><strong>Note moyenne:</strong> {selectedEvaluation.average_score ? `${selectedEvaluation.average_score.toFixed(2)}/5` : '-'}</p>
                <p><strong>Statut:</strong> {getStatusDisplay(selectedEvaluation.status)}</p>
              </div>
              
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.75rem', color: '#374151', fontSize: '1rem', fontWeight: 600 }}>Feedback du manager</h3>
                <div style={{ 
                  background: '#f9fafb', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.5rem', 
                  padding: '1rem',
                  minHeight: '100px',
                  whiteSpace: 'pre-wrap',
                  color: '#374151',
                  lineHeight: '1.6'
                }}>
                  {selectedEvaluation.manager_feedback || 'Aucun feedback disponible'}
                </div>
              </div>

              {selectedEvaluation.manager_recommendations && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ marginBottom: '0.75rem', color: '#374151', fontSize: '1rem', fontWeight: 600 }}>Recommandations du manager</h3>
                  <div style={{ 
                    background: '#f9fafb', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.5rem', 
                    padding: '1rem',
                    minHeight: '80px',
                    whiteSpace: 'pre-wrap',
                    color: '#374151',
                    lineHeight: '1.6'
                  }}>
                    {selectedEvaluation.manager_recommendations}
                  </div>
                </div>
              )}

              <div className="dialog-actions" style={{ marginTop: '2rem' }}>
                <button className="btn-secondary" onClick={() => setShowViewFeedbackDialog(false)}>
                  Fermer
                </button>
                <button className="btn-primary" onClick={() => {
                  setShowViewFeedbackDialog(false)
                  openFeedbackDialog(selectedEvaluation)
                }}>
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="dialog-overlay" onClick={confirmDialog.onCancel}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Confirmation</h2>
            </div>
            <div className="dialog-body">
              <p>{confirmDialog.message}</p>
            </div>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={confirmDialog.onCancel}>
                Annuler
              </button>
              <button className="btn-primary" onClick={confirmDialog.onConfirm}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrainingEvaluation
