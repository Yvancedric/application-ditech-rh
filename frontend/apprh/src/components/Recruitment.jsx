import React, { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { exportToPDF, exportToExcel } from '../utils/exportUtils'
import { Megaphone, Users, Briefcase, CheckCircle2, FileText, FileSpreadsheet, Plus, Pencil, Trash2, X, XCircle, Star, RefreshCw, ClipboardList, Target, PartyPopper, Search, Calendar, MessageSquare, Ban, Mail, Lock } from 'lucide-react'
import './Recruitment.css'

const Recruitment = ({ tab = 'offers' }) => {
  console.log('Recruitment component mounted')
  const [activeTab, setActiveTab] = useState(tab) // offers, candidates, interviews, selection

  // Mettre à jour l'onglet actif si la prop tab change
  React.useEffect(() => {
    setActiveTab(tab)
  }, [tab])

  // Si on a une prop tab spécifique, on affiche seulement cet onglet sans les tabs de navigation
  const showOnlyTab = tab && tab !== 'all'

  return (
    <div className="recruitment-page">
      {!showOnlyTab && (
        <>
          <div className="page-header">
            <h1>Recrutement</h1>
            <p>Publication des offres - Suivi des candidats - Entretiens - Sélection</p>
          </div>

          {/* Onglets */}
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'offers' ? 'active' : ''}`}
              onClick={() => setActiveTab('offers')}
            >
              <Megaphone size={18} /> Publication des offres
            </button>
            <button
              className={`tab-button ${activeTab === 'candidates' ? 'active' : ''}`}
              onClick={() => setActiveTab('candidates')}
            >
              <Users size={18} /> Suivi des candidats
            </button>
            <button
              className={`tab-button ${activeTab === 'interviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('interviews')}
            >
              <Briefcase size={18} /> Entretiens
            </button>
            <button
              className={`tab-button ${activeTab === 'selection' ? 'active' : ''}`}
              onClick={() => setActiveTab('selection')}
            >
              <CheckCircle2 size={18} /> Sélection
            </button>
          </div>
        </>
      )}

      {/* Contenu des onglets */}
      <div className="tab-content">
        {activeTab === 'offers' && <JobOffersTab />}
        {activeTab === 'candidates' && <CandidatesTab />}
        {activeTab === 'interviews' && <InterviewsTab />}
        {activeTab === 'selection' && <SelectionTab />}
      </div>
    </div>
  )
}

// Composant Onglet Publication des offres
const JobOffersTab = () => {
  console.log('JobOffersTab component mounted')
  const [offers, setOffers] = useState([])
  const [filteredOffers, setFilteredOffers] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    position: '',
    contract_type: 'CDI',
    location: '',
    salary_min: '',
    salary_max: '',
    department: '',
    status: 'DRAFT',
    closing_date: '',
    max_applications: ''
  })
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterContractType, setFilterContractType] = useState('')

  const stats = {
    total: (offers || []).length,
    draft: (offers || []).filter(o => o.status === 'DRAFT').length,
    published: (offers || []).filter(o => o.status === 'PUBLISHED').length,
    closed: (offers || []).filter(o => o.status === 'CLOSED').length,
    totalApplications: (offers || []).reduce((sum, o) => sum + (o.application_count || 0), 0)
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/job-offers/')
      setOffers(response.data)
      setFilteredOffers(response.data)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération des offres:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la récupération des offres'
      setError(errorMessage)
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

  const filterOffers = useCallback(() => {
    let filtered = [...offers]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(offer =>
        offer.title?.toLowerCase().includes(term) ||
        offer.position?.toLowerCase().includes(term) ||
        offer.description?.toLowerCase().includes(term) ||
        offer.department_name?.toLowerCase().includes(term)
      )
    }

    if (filterStatus) {
      filtered = filtered.filter(offer => offer.status === filterStatus)
    }

    if (filterDepartment) {
      filtered = filtered.filter(offer => offer.department === parseInt(filterDepartment))
    }

    if (filterContractType) {
      filtered = filtered.filter(offer => offer.contract_type === filterContractType)
    }

    setFilteredOffers(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterDepartment, filterContractType, offers])

  useEffect(() => {
    fetchOffers()
    fetchServices()
  }, [fetchOffers, fetchServices])

  useEffect(() => {
    if (!loading) {
      filterOffers()
    }
  }, [filterOffers, loading])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleStatusChange = (e) => {
    setFilterStatus(e.target.value)
  }

  const handleDepartmentChange = (e) => {
    setFilterDepartment(e.target.value)
  }

  const handleContractTypeChange = (e) => {
    setFilterContractType(e.target.value)
  }

  const openAddDialog = () => {
    setFormData({
      title: '',
      description: '',
      requirements: '',
      position: '',
      contract_type: 'CDI',
      location: '',
      salary_min: '',
      salary_max: '',
      department: '',
      status: 'DRAFT',
      closing_date: '',
      max_applications: ''
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSend = {
        ...formData,
        department: formData.department ? parseInt(formData.department) : null,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        max_applications: formData.max_applications ? parseInt(formData.max_applications) : null
      }

      await api.post('/ditech/job-offers/', dataToSend)
      showToast('Offre créée avec succès', 'success')
      setShowDialog(false)
      fetchOffers()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Erreur lors de la sauvegarde de l\'offre'
      showToast(errorMessage, 'error')
    }
  }

  const handleDelete = async (offer) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'offre "${offer.title}" ?`)) {
      try {
        await api.delete(`/ditech/job-offers/${offer.id}/`)
        showToast('Offre supprimée avec succès', 'success')
        fetchOffers()
      } catch (err) {
        console.error('Erreur lors de la suppression:', err)
        const errorMessage = err.response?.data?.detail || 
                            err.response?.data?.message || 
                            'Erreur lors de la suppression'
        showToast(errorMessage, 'error')
      }
    }
  }

  const handlePublish = async (offer) => {
    try {
      await api.post(`/ditech/job-offers/${offer.id}/publish/`)
      showToast('Offre publiée avec succès', 'success')
      fetchOffers()
    } catch (err) {
      console.error('Erreur lors de la publication:', err)
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Erreur lors de la publication'
      showToast(errorMessage, 'error')
    }
  }

  const handleClose = async (offer) => {
    try {
      await api.post(`/ditech/job-offers/${offer.id}/close/`)
      showToast('Offre fermée avec succès', 'success')
      fetchOffers()
    } catch (err) {
      console.error('Erreur lors de la fermeture:', err)
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Erreur lors de la fermeture'
      showToast(errorMessage, 'error')
    }
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Titre', key: 'title', accessor: (o) => o.title || '-' },
      { header: 'Poste', key: 'position', accessor: (o) => o.position || '-' },
      { header: 'Type de contrat', key: 'contract_type', accessor: (o) => {
        const typeMap = { 'CDI': 'CDI', 'CDD': 'CDD', 'STAGE': 'Stage', 'INTERIM': 'Intérim', 'FREELANCE': 'Freelance' }
        return typeMap[o.contract_type] || o.contract_type || '-'
      }},
      { header: 'Service', key: 'department_name', accessor: (o) => o.department_name || o.department || '-' },
      { header: 'Localisation', key: 'location', accessor: (o) => o.location || '-' },
      { header: 'Salaire min', key: 'salary_min', accessor: (o) => o.salary_min ? `${parseFloat(o.salary_min).toLocaleString('fr-FR')} FCFA` : '-' },
      { header: 'Salaire max', key: 'salary_max', accessor: (o) => o.salary_max ? `${parseFloat(o.salary_max).toLocaleString('fr-FR')} FCFA` : '-' },
      { header: 'Statut', key: 'status', accessor: (o) => {
        const statusMap = { 'DRAFT': 'Brouillon', 'PUBLISHED': 'Publiée', 'CLOSED': 'Fermée', 'CANCELLED': 'Annulée' }
        return statusMap[o.status] || o.status || '-'
      }},
      { header: 'Date de clôture', key: 'closing_date', accessor: (o) => o.closing_date || '-' },
      { header: 'Candidatures', key: 'application_count', accessor: (o) => o.application_count || 0 }
    ]
    exportToPDF(filteredOffers, columns, 'Liste des Offres d\'Emploi', 'offres_emploi')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Titre', key: 'title', accessor: (o) => o.title || '-' },
      { header: 'Poste', key: 'position', accessor: (o) => o.position || '-' },
      { header: 'Type de contrat', key: 'contract_type', accessor: (o) => {
        const typeMap = { 'CDI': 'CDI', 'CDD': 'CDD', 'STAGE': 'Stage', 'INTERIM': 'Intérim', 'FREELANCE': 'Freelance' }
        return typeMap[o.contract_type] || o.contract_type || '-'
      }},
      { header: 'Service', key: 'department_name', accessor: (o) => o.department_name || o.department || '-' },
      { header: 'Localisation', key: 'location', accessor: (o) => o.location || '-' },
      { header: 'Salaire min', key: 'salary_min', accessor: (o) => o.salary_min ? parseFloat(o.salary_min) : 0 },
      { header: 'Salaire max', key: 'salary_max', accessor: (o) => o.salary_max ? parseFloat(o.salary_max) : 0 },
      { header: 'Statut', key: 'status', accessor: (o) => {
        const statusMap = { 'DRAFT': 'Brouillon', 'PUBLISHED': 'Publiée', 'CLOSED': 'Fermée', 'CANCELLED': 'Annulée' }
        return statusMap[o.status] || o.status || '-'
      }},
      { header: 'Date de clôture', key: 'closing_date', accessor: (o) => o.closing_date || '-' },
      { header: 'Candidatures', key: 'application_count', accessor: (o) => o.application_count || 0 }
    ]
    exportToExcel(filteredOffers, columns, 'Offres d\'Emploi', 'offres_emploi')
    showToast('Export Excel en cours...', 'success')
  }

  const indexOfLastOffer = currentPage * rowsPerPage
  const indexOfFirstOffer = indexOfLastOffer - rowsPerPage
  const currentOffers = filteredOffers.slice(indexOfFirstOffer, indexOfLastOffer)
  const totalPages = Math.ceil(filteredOffers.length / rowsPerPage)

  if (loading) {
    return (
          <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des offres d'emploi...</p>
      </div>
    )
  }

  return (
    <div className="job-offers-tab">
      <div className="page-header">
        <h1>Publication des offres</h1>
        <p>Gestion des offres d'emploi</p>
      </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon"><Megaphone size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Offres</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card stat-draft">
          <div className="stat-icon"><FileText size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Brouillons</div>
            <div className="stat-value">{stats.draft}</div>
          </div>
        </div>
        <div className="stat-card stat-generated">
          <div className="stat-icon"><FileText size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Publiées</div>
            <div className="stat-value">{stats.published}</div>
          </div>
        </div>
        <div className="stat-card stat-paid">
          <div className="stat-icon"><Lock size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Fermées</div>
            <div className="stat-value">{stats.closed}</div>
          </div>
            </div>
        <div className="stat-card stat-gross">
          <div className="stat-icon"><Users size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Candidatures</div>
            <div className="stat-value">{stats.totalApplications}</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Rechercher par titre, poste, description..."
              value={searchTerm}
              onChange={handleSearch}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={filterStatus}
              onChange={handleStatusChange}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publiée</option>
              <option value="CLOSED">Fermée</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterDepartment}
              onChange={handleDepartmentChange}
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
          <div className="filter-group">
            <select
              value={filterContractType}
              onChange={handleContractTypeChange}
              className="filter-select"
            >
              <option value="">Tous les types</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="STAGE">Stage</option>
              <option value="INTERIM">Intérim</option>
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
            <Plus size={16} /> Nouvelle Offre
          </button>
        </div>
      </div>

      {/* Tableau */}
      {currentOffers.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Poste</th>
                <th>Type Contrat</th>
                <th>Service</th>
                <th>Statut</th>
                <th>Candidatures</th>
                <th>Date Publication</th>
              </tr>
            </thead>
            <tbody>
              {currentOffers.map(offer => (
                <tr key={offer.id}>
                  <td>{offer.title}</td>
                  <td>{offer.position}</td>
                  <td>
                    <span className="badge contract-type-badge">
                      {offer.contract_type_display || offer.contract_type}
                    </span>
                  </td>
                  <td>{offer.department_name || '-'}</td>
                  <td>
                    <span className={`badge status-${offer.status?.toLowerCase()}`}>
                      {offer.status_display || offer.status}
                    </span>
                  </td>
                  <td>{offer.application_count || 0}</td>
                  <td>
                    {offer.published_date 
                      ? new Date(offer.published_date).toLocaleDateString('fr-FR') 
                      : offer.published_at 
                        ? new Date(offer.published_at).toLocaleDateString('fr-FR')
                        : offer.created_at && offer.status === 'PUBLISHED'
                          ? new Date(offer.created_at).toLocaleDateString('fr-FR')
                          : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucune offre trouvée</p>
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

      {/* Dialog Formulaire */}
      {showDialog && (
        <div className="dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="dialog dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Nouvelle Offre d'Emploi</h2>
              <button className="btn-close" onClick={() => setShowDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="dialog-form">
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Titre *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                    placeholder="Titre de l'offre"
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
                    placeholder="Poste recherché"
                  />
                </div>
                <div className="form-group">
                  <label>Type de Contrat *</label>
                  <select
                    value={formData.contract_type}
                    onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                required
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="STAGE">Stage</option>
                    <option value="INTERIM">Intérim</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Service</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
              <div className="form-row">
                <div className="form-group">
                  <label>Lieu</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Lieu de travail"
                  />
                </div>
                <div className="form-group">
                  <label>Salaire Min (FCFA)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salary_min}
                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                    placeholder="0"
              />
            </div>
                <div className="form-group">
                  <label>Salaire Max (FCFA)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salary_max}
                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                    placeholder="0"
              />
            </div>
          </div>
              <div className="form-group full-width">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows="4"
                  placeholder="Description détaillée du poste..."
                />
              </div>
              <div className="form-group full-width">
                <label>Exigences *</label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              required
                  rows="4"
                  placeholder="Compétences et exigences requises..."
            />
          </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date de Clôture</label>
                  <input
                    type="date"
                    value={formData.closing_date}
                    onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
            />
          </div>
                <div className="form-group">
                  <label>Max Candidatures</label>
                  <input
                    type="number"
                    value={formData.max_applications}
                    onChange={(e) => setFormData({ ...formData, max_applications: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Statut *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="PUBLISHED">Publiée</option>
                    <option value="CLOSED">Fermée</option>
                  </select>
                </div>
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

// Composant Onglet Suivi des candidats
const CandidatesTab = () => {
  const [candidates, setCandidates] = useState([])
  const [filteredCandidates, setFilteredCandidates] = useState([])
  const [jobOffers, setJobOffers] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showHireDialog, setShowHireDialog] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [formData, setFormData] = useState({
    job_offer: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    status: 'NEW',
    source: '',
    expected_salary: '',
    availability_date: '',
    notes: '',
    rating: 0
  })
  const [hireFormData, setHireFormData] = useState({
    service_id: '',
    salary: '',
    date_of_hire: new Date().toISOString().split('T')[0]
  })
  const [toast, setToast] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterJobOffer, setFilterJobOffer] = useState('')
  const [filterPosition, setFilterPosition] = useState('')

  const stats = {
    total: (candidates || []).length,
    new: (candidates || []).filter(c => c.status === 'NEW').length,
    screening: (candidates || []).filter(c => c.status === 'SCREENING').length,
    interview: (candidates || []).filter(c => c.status === 'INTERVIEW' || c.status === 'SECOND_INTERVIEW').length,
    finalReview: (candidates || []).filter(c => c.status === 'FINAL_REVIEW').length,
    hired: (candidates || []).filter(c => c.status === 'HIRED').length,
    rejected: (candidates || []).filter(c => c.status === 'REJECTED').length
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/candidates/')
      setCandidates(response.data)
      setFilteredCandidates(response.data)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération des candidats:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la récupération des candidats'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchJobOffers = useCallback(async () => {
    try {
      const response = await api.get('/ditech/job-offers/')
      setJobOffers(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des offres:', err)
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

  const filterCandidates = useCallback(() => {
    let filtered = [...candidates]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(candidate =>
        candidate.full_name?.toLowerCase().includes(term) ||
        candidate.email?.toLowerCase().includes(term) ||
        candidate.position?.toLowerCase().includes(term) ||
        candidate.job_offer_detail?.title?.toLowerCase().includes(term)
      )
    }

    if (filterStatus) {
      filtered = filtered.filter(candidate => candidate.status === filterStatus)
    }

    if (filterJobOffer) {
      filtered = filtered.filter(candidate => candidate.job_offer === parseInt(filterJobOffer))
    }

    if (filterPosition) {
      filtered = filtered.filter(candidate => candidate.position?.toLowerCase().includes(filterPosition.toLowerCase()))
    }

    setFilteredCandidates(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterJobOffer, filterPosition, candidates])

  useEffect(() => {
    fetchCandidates()
    fetchJobOffers()
    fetchServices()
  }, [fetchCandidates, fetchJobOffers, fetchServices])

  useEffect(() => {
    if (!loading) {
      filterCandidates()
    }
  }, [filterCandidates, loading])

  const openAddDialog = () => {
    setFormData({
      job_offer: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      position: '',
      status: 'NEW',
      source: '',
      expected_salary: '',
      availability_date: '',
      notes: '',
      rating: 0
    })
    setShowDialog(true)
  }

  const openHireDialog = (candidate) => {
    setSelectedCandidate(candidate)
    setHireFormData({
      service_id: '',
      salary: candidate.expected_salary || '',
      date_of_hire: new Date().toISOString().split('T')[0]
    })
    setShowHireDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSend = {
        ...formData,
        job_offer: formData.job_offer ? parseInt(formData.job_offer) : null,
        expected_salary: formData.expected_salary ? parseFloat(formData.expected_salary) : null,
        rating: parseInt(formData.rating) || 0,
        availability_date: formData.availability_date || null
      }

      await api.post('/ditech/candidates/', dataToSend)
      showToast('Candidat créé avec succès', 'success')
      setShowDialog(false)
      fetchCandidates()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Erreur lors de la sauvegarde du candidat'
      showToast(errorMessage, 'error')
    }
  }

  const handleHire = async (e) => {
    e.preventDefault()
    if (!selectedCandidate) return

    try {
      await api.post(`/ditech/candidates/${selectedCandidate.id}/hire/`, {
        service_id: parseInt(hireFormData.service_id),
        salary: parseFloat(hireFormData.salary) || 0,
        date_of_hire: hireFormData.date_of_hire
      })
      showToast('Candidat embauché avec succès', 'success')
      setShowHireDialog(false)
      fetchCandidates()
    } catch (err) {
      console.error('Erreur lors de l\'embauche:', err)
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Erreur lors de l\'embauche'
      showToast(errorMessage, 'error')
    }
  }

  const handleStatusUpdate = async (candidate, newStatus) => {
    try {
      await api.post(`/ditech/candidates/${candidate.id}/update_status/`, { status: newStatus })
      showToast('Statut mis à jour avec succès', 'success')
      fetchCandidates()
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err)
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Erreur lors de la mise à jour du statut'
      showToast(errorMessage, 'error')
    }
  }

  const handleDeleteClick = (candidate) => {
    setDeleteConfirm(candidate)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    
    try {
      await api.delete(`/ditech/candidates/${deleteConfirm.id}/`)
      showToast('Candidat supprimé avec succès', 'success')
      setDeleteConfirm(null)
      fetchCandidates()
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Erreur lors de la suppression'
      showToast(errorMessage, 'error')
      setDeleteConfirm(null)
    }
  }

  const getStatusDisplay = (status) => {
    const statusMap = {
      'NEW': 'Nouveau',
      'SCREENING': 'Présélection',
      'INTERVIEW': 'Entretien',
      'SECOND_INTERVIEW': 'Second entretien',
      'FINAL_REVIEW': 'Évaluation finale',
      'OFFER_SENT': 'Offre envoyée',
      'OFFER_ACCEPTED': 'Offre acceptée',
      'OFFER_REJECTED': 'Offre refusée',
      'HIRED': 'Embauché',
      'REJECTED': 'Rejeté',
      'WITHDRAWN': 'Retiré'
    }
    return statusMap[status] || status
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'NEW': return 'status-new'
      case 'SCREENING': return 'status-screening'
      case 'INTERVIEW':
      case 'SECOND_INTERVIEW': return 'status-interview'
      case 'FINAL_REVIEW': return 'status-review'
      case 'OFFER_SENT':
      case 'OFFER_ACCEPTED': return 'status-offer'
      case 'HIRED': return 'status-hired'
      case 'REJECTED':
      case 'OFFER_REJECTED': return 'status-rejected'
      case 'WITHDRAWN': return 'status-withdrawn'
      default: return ''
    }
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Nom complet', key: 'full_name', accessor: (c) => c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || '-' },
      { header: 'Email', key: 'email', accessor: (c) => c.email || '-' },
      { header: 'Téléphone', key: 'phone', accessor: (c) => c.phone || '-' },
      { header: 'Poste', key: 'position', accessor: (c) => c.position || '-' },
      { header: 'Offre d\'emploi', key: 'job_offer_title', accessor: (c) => c.job_offer_title || c.job_offer || '-' },
      { header: 'Statut', key: 'status', accessor: (c) => c.status_display || getStatusDisplay(c.status) || '-' },
      { header: 'Source', key: 'source', accessor: (c) => c.source || '-' },
      { header: 'Note', key: 'rating', accessor: (c) => c.rating || c.overall_rating || 0 },
      { header: 'Date de candidature', key: 'application_date', accessor: (c) => c.application_date || '-' }
    ]
    exportToPDF(filteredCandidates, columns, 'Liste des Candidats', 'candidats')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Nom complet', key: 'full_name', accessor: (c) => c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || '-' },
      { header: 'Email', key: 'email', accessor: (c) => c.email || '-' },
      { header: 'Téléphone', key: 'phone', accessor: (c) => c.phone || '-' },
      { header: 'Poste', key: 'position', accessor: (c) => c.position || '-' },
      { header: 'Offre d\'emploi', key: 'job_offer_title', accessor: (c) => c.job_offer_title || c.job_offer || '-' },
      { header: 'Statut', key: 'status', accessor: (c) => c.status_display || getStatusDisplay(c.status) || '-' },
      { header: 'Source', key: 'source', accessor: (c) => c.source || '-' },
      { header: 'Note', key: 'rating', accessor: (c) => c.rating || c.overall_rating || 0 },
      { header: 'Date de candidature', key: 'application_date', accessor: (c) => c.application_date || '-' }
    ]
    exportToExcel(filteredCandidates, columns, 'Candidats', 'candidats')
    showToast('Export Excel en cours...', 'success')
  }

  const indexOfLastCandidate = currentPage * rowsPerPage
  const indexOfFirstCandidate = indexOfLastCandidate - rowsPerPage
  const currentCandidates = filteredCandidates.slice(indexOfFirstCandidate, indexOfLastCandidate)
  const totalPages = Math.ceil(filteredCandidates.length / rowsPerPage)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des candidats...</p>
      </div>
    )
  }

  return (
    <div className="candidates-tab">
      <div className="page-header">
        <h1>Suivi des candidats</h1>
        <p>Gestion et suivi des candidats</p>
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
            <div className="stat-label">Total Candidats</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card stat-new">
          <div className="stat-icon">🆕</div>
          <div className="stat-info">
            <div className="stat-label">Nouveaux</div>
            <div className="stat-value">{stats.new}</div>
          </div>
        </div>
        <div className="stat-card stat-screening">
          <div className="stat-icon"><Search size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Présélection</div>
            <div className="stat-value">{stats.screening}</div>
          </div>
        </div>
        <div className="stat-card stat-interview">
          <div className="stat-icon"><Briefcase size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Entretiens</div>
            <div className="stat-value">{stats.interview}</div>
          </div>
        </div>
        <div className="stat-card stat-hired">
          <div className="stat-icon"><CheckCircle2 size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Embauchés</div>
            <div className="stat-value">{stats.hired}</div>
          </div>
        </div>
        <div className="stat-card stat-rejected">
          <div className="stat-icon"><XCircle size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Rejetés</div>
            <div className="stat-value">{stats.rejected}</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Rechercher par nom, email, poste..."
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
              <option value="NEW">Nouveau</option>
              <option value="SCREENING">Présélection</option>
              <option value="INTERVIEW">Entretien</option>
              <option value="SECOND_INTERVIEW">Second entretien</option>
              <option value="FINAL_REVIEW">Évaluation finale</option>
              <option value="OFFER_SENT">Offre envoyée</option>
              <option value="OFFER_ACCEPTED">Offre acceptée</option>
              <option value="HIRED">Embauché</option>
              <option value="REJECTED">Rejeté</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterJobOffer}
              onChange={(e) => setFilterJobOffer(e.target.value)}
              className="filter-select"
            >
              <option value="">Toutes les offres</option>
              {jobOffers.map(offer => (
                <option key={offer.id} value={offer.id}>
                  {offer.title}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <input
              type="text"
              placeholder="Poste recherché..."
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
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
          <button className="btn-primary" onClick={openAddDialog}>
            <Plus size={16} /> Nouveau Candidat
          </button>
        </div>
      </div>

      {/* Tableau */}
      {currentCandidates.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Poste</th>
                <th>Offre</th>
                <th>Statut</th>
                <th>Note</th>
                <th>Date Candidature</th>
              </tr>
            </thead>
            <tbody>
              {currentCandidates.map(candidate => (
                <tr key={candidate.id}>
                  <td>{candidate.full_name || `${candidate.first_name} ${candidate.last_name}`}</td>
                  <td>{candidate.email}</td>
                  <td>{candidate.position}</td>
                  <td>{candidate.job_offer_detail?.title || '-'}</td>
                  <td>
                    <span className={`badge status-${getStatusClass(candidate.status)}`}>
                      {getStatusDisplay(candidate.status)}
                    </span>
                  </td>
                  <td>
                    <span className="rating-badge">
                      <Star size={14} /> {candidate.rating || 0}/10
                    </span>
                  </td>
                  <td>{candidate.application_date ? new Date(candidate.application_date).toLocaleDateString('fr-FR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucun candidat trouvé</p>
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

      {/* Dialog Formulaire Candidat */}
      {showDialog && (
        <div className="dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="dialog dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Nouveau Candidat</h2>
              <button className="btn-close" onClick={() => setShowDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="dialog-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                    placeholder="Prénom"
                  />
                </div>
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                    placeholder="Nom"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="email@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder="Téléphone"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Poste recherché *</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    required
                    placeholder="Poste recherché"
                  />
                </div>
                <div className="form-group">
                  <label>Offre d'emploi</label>
                  <select
                    value={formData.job_offer}
                    onChange={(e) => setFormData({ ...formData, job_offer: e.target.value })}
                  >
                    <option value="">Sélectionner une offre</option>
                    {jobOffers.map(offer => (
                      <option key={offer.id} value={offer.id}>
                        {offer.title} - {offer.position}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Statut *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="NEW">Nouveau</option>
                    <option value="SCREENING">Présélection</option>
                    <option value="INTERVIEW">Entretien</option>
                    <option value="SECOND_INTERVIEW">Second entretien</option>
                    <option value="FINAL_REVIEW">Évaluation finale</option>
                    <option value="OFFER_SENT">Offre envoyée</option>
                    <option value="OFFER_ACCEPTED">Offre acceptée</option>
                    <option value="HIRED">Embauché</option>
                    <option value="REJECTED">Rejeté</option>
                    <option value="WITHDRAWN">Retiré</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Source</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="LinkedIn, site web, etc."
                  />
                </div>
                <div className="form-group">
                  <label>Salaire attendu (FCFA)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.expected_salary}
                    onChange={(e) => setFormData({ ...formData, expected_salary: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Note (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date de disponibilité</label>
                  <input
                    type="date"
                    value={formData.availability_date}
                    onChange={(e) => setFormData({ ...formData, availability_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="4"
                  placeholder="Notes sur le candidat..."
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

      {/* Dialog Embaucher */}
      {showHireDialog && selectedCandidate && (
        <div className="dialog-overlay" onClick={() => setShowHireDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Embaucher le Candidat</h2>
              <button className="btn-close" onClick={() => setShowHireDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleHire} className="dialog-form">
              <div className="approval-info">
                <p><strong>Candidat:</strong> {selectedCandidate.full_name || `${selectedCandidate.first_name} ${selectedCandidate.last_name}`}</p>
                <p><strong>Poste:</strong> {selectedCandidate.position}</p>
                <p><strong>Email:</strong> {selectedCandidate.email}</p>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Service *</label>
                  <select
                    value={hireFormData.service_id}
                    onChange={(e) => setHireFormData({ ...hireFormData, service_id: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner un service</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Salaire (FCFA) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={hireFormData.salary}
                    onChange={(e) => setHireFormData({ ...hireFormData, salary: e.target.value })}
                    required
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Date d'embauche *</label>
                  <input
                    type="date"
                    value={hireFormData.date_of_hire}
                    onChange={(e) => setHireFormData({ ...hireFormData, date_of_hire: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowHireDialog(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Embaucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Confirmation Suppression */}
      {deleteConfirm && (
        <div className="dialog-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="dialog-content delete-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Confirmer la suppression</h2>
            <p>
              Êtes-vous sûr de vouloir supprimer le candidat{' '}
              <strong>{deleteConfirm.full_name || `${deleteConfirm.first_name} ${deleteConfirm.last_name}`}</strong> ?
            </p>
            <p className="warning-text">
              <strong>Attention :</strong> Cette action est irréversible. Le candidat et toutes ses données seront définitivement supprimés.
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
                Supprimer
              </button>
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
    </div>
  )
}

// Composant Onglet Entretiens
const InterviewsTab = () => {
  const [interviews, setInterviews] = useState([])
  const [filteredInterviews, setFilteredInterviews] = useState([])
  const [candidates, setCandidates] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [selectedInterview, setSelectedInterview] = useState(null)
  const [formData, setFormData] = useState({
    candidate: '',
    interviewer: '',
    scheduled_date: '',
    scheduled_time: '',
    interview_type: 'ONSITE',
    location: '',
    meeting_link: '',
    duration_minutes: '',
    notes: ''
  })
  const [completeFormData, setCompleteFormData] = useState({
    rating: 0,
    feedback: '',
    strengths: '',
    weaknesses: '',
    recommendation: '',
    duration_minutes: ''
  })
  const [rescheduleFormData, setRescheduleFormData] = useState({
    new_date: '',
    new_time: ''
  })
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCandidate, setFilterCandidate] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const stats = {
    total: (interviews || []).length,
    scheduled: (interviews || []).filter(i => i.status === 'SCHEDULED' || i.status === 'RESCHEDULED').length,
    inProgress: (interviews || []).filter(i => i.status === 'IN_PROGRESS').length,
    completed: (interviews || []).filter(i => i.status === 'COMPLETED').length,
    cancelled: (interviews || []).filter(i => i.status === 'CANCELLED').length
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/interviews/')
      // Log temporaire pour déboguer
      if (import.meta.env.MODE === 'development') {
        console.log('Entretiens récupérés:', response.data)
        response.data.forEach(interview => {
          console.log(`Entretien ID: ${interview.id}, Intervieweur: ${interview.interviewer_name}, Interviewer ID: ${interview.interviewer}`)
        })
      }
      setInterviews(response.data)
      setFilteredInterviews(response.data)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération des entretiens:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la récupération des entretiens'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCandidates = useCallback(async () => {
    try {
      const response = await api.get('/ditech/candidates/')
      setCandidates(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des candidats:', err)
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      // Récupérer les employés qui peuvent être intervieweurs
      const response = await api.get('/ditech/employees/')
      // Mapper les employés vers un format utilisable
      // L'intervieweur est un User, donc on doit utiliser emp.user (l'ID de l'utilisateur associé)
      const employees = response.data || []
      const usersList = employees
        .filter(emp => emp.user) // Filtrer uniquement les employés qui ont un utilisateur associé
        .map(emp => {
          // S'assurer que user est un ID numérique, pas un objet
          const userId = typeof emp.user === 'object' ? emp.user?.id : emp.user
          return {
            id: userId ? parseInt(userId) : null, // Convertir en nombre
            username: emp.email?.split('@')[0] || emp.user_detail?.username || '',
            first_name: emp.first_name,
            last_name: emp.last_name,
            email: emp.email,
            full_name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
          }
        })
        .filter(user => user.id !== null && !isNaN(user.id)) // Filtrer les IDs invalides
      setUsers(usersList)
      
      // Log pour déboguer
      if (import.meta.env.MODE === 'development') {
        console.log('Users list:', usersList)
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err)
      setUsers([])
    }
  }, [])

  const filterInterviews = useCallback(() => {
    let filtered = [...interviews]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(interview =>
        interview.candidate_detail?.full_name?.toLowerCase().includes(term) ||
        interview.interviewer_name?.toLowerCase().includes(term) ||
        interview.interview_type_display?.toLowerCase().includes(term) ||
        interview.location?.toLowerCase().includes(term)
      )
    }

    if (filterStatus) {
      filtered = filtered.filter(interview => interview.status === filterStatus)
    }

    if (filterCandidate) {
      filtered = filtered.filter(interview => interview.candidate === parseInt(filterCandidate))
    }

    if (filterType) {
      filtered = filtered.filter(interview => interview.interview_type === filterType)
    }

    if (filterDate) {
      filtered = filtered.filter(interview => {
        const interviewDate = new Date(interview.scheduled_date).toISOString().split('T')[0]
        return interviewDate === filterDate
      })
    }

    setFilteredInterviews(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterCandidate, filterType, filterDate, interviews])

  useEffect(() => {
    fetchInterviews()
    fetchCandidates()
    fetchUsers()
  }, [fetchInterviews, fetchCandidates, fetchUsers])

  useEffect(() => {
    if (!loading) {
      filterInterviews()
    }
  }, [filterInterviews, loading])

  const openAddDialog = () => {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().slice(0, 5)
    setFormData({
      candidate: '',
      interviewer: '',
      scheduled_date: dateStr,
      scheduled_time: timeStr,
      interview_type: 'ONSITE',
      location: '',
      meeting_link: '',
      duration_minutes: '60',
      notes: ''
    })
    setShowDialog(true)
  }

  const openCompleteDialog = (interview) => {
    setSelectedInterview(interview)
    setCompleteFormData({
      rating: interview.rating || 0,
      feedback: interview.feedback || '',
      strengths: interview.strengths || '',
      weaknesses: interview.weaknesses || '',
      recommendation: interview.recommendation || '',
      duration_minutes: interview.duration_minutes?.toString() || ''
    })
    setShowCompleteDialog(true)
  }

  const openRescheduleDialog = (interview) => {
    setSelectedInterview(interview)
    const scheduledDate = new Date(interview.scheduled_date)
    const dateStr = scheduledDate.toISOString().split('T')[0]
    const timeStr = scheduledDate.toTimeString().slice(0, 5)
    setRescheduleFormData({
      new_date: dateStr,
      new_time: timeStr
    })
    setShowRescheduleDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const scheduledDateTime = `${formData.scheduled_date}T${formData.scheduled_time}:00`
      // Convertir interviewer en nombre ou null
      let interviewerId = null
      if (formData.interviewer && formData.interviewer !== '') {
        let interviewerValue = formData.interviewer
        
        // Si c'est un objet, extraire l'ID (vérifier plusieurs propriétés possibles)
        if (typeof interviewerValue === 'object' && interviewerValue !== null) {
          interviewerValue = interviewerValue.id || interviewerValue.pk || interviewerValue.user_id || null
        }
        
        // Si interviewerValue est toujours un objet après extraction, essayer de le convertir directement
        if (typeof interviewerValue === 'object' && interviewerValue !== null) {
          // Si c'est encore un objet, essayer de trouver une valeur numérique
          const numericKeys = Object.values(interviewerValue).find(v => typeof v === 'number' && v > 0)
          interviewerValue = numericKeys || null
        }
        
        // Convertir en nombre uniquement si c'est une valeur valide
        if (interviewerValue !== null && interviewerValue !== undefined && interviewerValue !== '') {
          const parsed = parseInt(String(interviewerValue), 10)
          if (!isNaN(parsed) && parsed > 0) {
            interviewerId = parsed
          }
        }
      }
      
      const dataToSend = {
        candidate: parseInt(formData.candidate),
        interviewer: interviewerId,
        scheduled_date: scheduledDateTime,
        interview_type: formData.interview_type,
        location: formData.location || '',
        meeting_link: formData.meeting_link || '',
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        notes: formData.notes || '',
        status: 'SCHEDULED'
      }
      
      // Log pour déboguer
      if (import.meta.env.MODE === 'development') {
        console.log('formData.interviewer:', formData.interviewer, 'type:', typeof formData.interviewer)
        console.log('interviewerId après conversion:', interviewerId)
        console.log('Données envoyées au backend:', dataToSend)
      }

      await api.post('/ditech/interviews/', dataToSend)
      showToast('Entretien créé avec succès', 'success')
      setShowDialog(false)
      fetchInterviews()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Erreur lors de la sauvegarde de l\'entretien'
      showToast(errorMessage, 'error')
    }
  }

  const handleComplete = async (e) => {
    e.preventDefault()
    if (!selectedInterview) return

    try {
      await api.post(`/ditech/interviews/${selectedInterview.id}/complete/`, {
        rating: parseInt(completeFormData.rating) || 0,
        feedback: completeFormData.feedback || '',
        strengths: completeFormData.strengths || '',
        weaknesses: completeFormData.weaknesses || '',
        recommendation: completeFormData.recommendation || '',
        duration_minutes: completeFormData.duration_minutes ? parseInt(completeFormData.duration_minutes) : null
      })
      showToast('Entretien marqué comme terminé', 'success')
      setShowCompleteDialog(false)
      fetchInterviews()
      fetchCandidates() // Mettre à jour les notes des candidats
    } catch (err) {
      console.error('Erreur lors de la complétion:', err)
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Erreur lors de la complétion de l\'entretien'
      showToast(errorMessage, 'error')
    }
  }

  const handleReschedule = async (e) => {
    e.preventDefault()
    if (!selectedInterview) return

    try {
      const newDateTime = `${rescheduleFormData.new_date}T${rescheduleFormData.new_time}:00`
      await api.post(`/ditech/interviews/${selectedInterview.id}/reschedule/`, {
        new_date: newDateTime
      })
      showToast('Entretien reprogrammé avec succès', 'success')
      setShowRescheduleDialog(false)
      fetchInterviews()
    } catch (err) {
      console.error('Erreur lors de la reprogrammation:', err)
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Erreur lors de la reprogrammation'
      showToast(errorMessage, 'error')
    }
  }

  const handleCancel = async (interview) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cet entretien ?')) {
      return
    }

    try {
      await api.put(`/ditech/interviews/${interview.id}/`, { ...interview, status: 'CANCELLED' })
      showToast('Entretien annulé avec succès', 'success')
      fetchInterviews()
    } catch (err) {
      console.error('Erreur lors de l\'annulation:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Erreur lors de l\'annulation'
      showToast(errorMessage, 'error')
    }
  }

  const handleDeleteClick = (interview) => {
    setDeleteConfirm(interview)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await api.delete(`/ditech/interviews/${deleteConfirm.id}/`)
      showToast('Entretien supprimé avec succès', 'success')
      setDeleteConfirm(null)
      fetchInterviews()
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Erreur lors de la suppression'
      showToast(errorMessage, 'error')
      setDeleteConfirm(null)
    }
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Candidat', key: 'candidate_name', accessor: (i) => i.candidate_detail?.full_name || i.candidate_name || '-' },
      { header: 'Interviewer', key: 'interviewer_name', accessor: (i) => getInterviewerName(i) },
      { header: 'Date et heure', key: 'scheduled_date', accessor: (i) => i.scheduled_date ? formatDateTime(i.scheduled_date) : '-' },
      { header: 'Type', key: 'interview_type', accessor: (i) => {
        const typeMap = { 'ONSITE': 'Sur site', 'ONLINE': 'En ligne', 'PHONE': 'Téléphone' }
        return typeMap[i.interview_type] || i.interview_type || '-'
      }},
      { header: 'Statut', key: 'status', accessor: (i) => i.status_display || getStatusDisplay(i.status) || '-' },
      { header: 'Note', key: 'rating', accessor: (i) => i.rating || 0 },
      { header: 'Durée (min)', key: 'duration_minutes', accessor: (i) => i.duration_minutes ? `${i.duration_minutes} min` : '-' },
      { header: 'Recommandation', key: 'recommendation', accessor: (i) => i.recommendation || '-' }
    ]
    exportToPDF(filteredInterviews, columns, 'Liste des Entretiens', 'entretiens')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Candidat', key: 'candidate_name', accessor: (i) => i.candidate_detail?.full_name || i.candidate_name || '-' },
      { header: 'Interviewer', key: 'interviewer_name', accessor: (i) => getInterviewerName(i) },
      { header: 'Date et heure', key: 'scheduled_date', accessor: (i) => i.scheduled_date || '-' },
      { header: 'Type', key: 'interview_type', accessor: (i) => {
        const typeMap = { 'ONSITE': 'Sur site', 'ONLINE': 'En ligne', 'PHONE': 'Téléphone' }
        return typeMap[i.interview_type] || i.interview_type || '-'
      }},
      { header: 'Statut', key: 'status', accessor: (i) => i.status_display || getStatusDisplay(i.status) || '-' },
      { header: 'Note', key: 'rating', accessor: (i) => i.rating || 0 },
      { header: 'Durée (min)', key: 'duration_minutes', accessor: (i) => i.duration_minutes || 0 },
      { header: 'Recommandation', key: 'recommendation', accessor: (i) => i.recommendation || '-' }
    ]
    exportToExcel(filteredInterviews, columns, 'Entretiens', 'entretiens')
    showToast('Export Excel en cours...', 'success')
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

  const getStatusDisplay = (status) => {
    const statusMap = {
      'SCHEDULED': 'Planifié',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé',
      'RESCHEDULED': 'Reprogrammé'
    }
    return statusMap[status] || status
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'SCHEDULED':
      case 'RESCHEDULED': return 'status-scheduled'
      case 'IN_PROGRESS': return 'status-in-progress'
      case 'COMPLETED': return 'status-completed'
      case 'CANCELLED': return 'status-cancelled'
      default: return ''
    }
  }

  // Fonction helper pour obtenir le nom de l'interviewer
  const getInterviewerName = (interview) => {
    // Essayer d'abord avec les données fournies par le backend
    if (interview.interviewer_name) {
      return interview.interviewer_name
    }
    if (interview.interviewer_detail?.first_name && interview.interviewer_detail?.last_name) {
      return `${interview.interviewer_detail.first_name} ${interview.interviewer_detail.last_name}`.trim()
    }
    if (interview.interviewer_detail?.username) {
      return interview.interviewer_detail.username
    }
    
    // Si le backend ne fournit pas les données, chercher dans la liste des users
    if (interview.interviewer) {
      let interviewerId = null
      if (typeof interview.interviewer === 'object' && interview.interviewer !== null) {
        interviewerId = interview.interviewer?.id || interview.interviewer?.pk || interview.interviewer?.user_id
      } else if (interview.interviewer !== '' && interview.interviewer !== null) {
        interviewerId = interview.interviewer
      }
      
      if (interviewerId !== null && interviewerId !== undefined && interviewerId !== '') {
        const parsedId = parseInt(String(interviewerId))
        if (!isNaN(parsedId) && parsedId > 0) {
          const interviewer = users.find(user => user.id === parsedId)
          if (interviewer) {
            return interviewer.full_name || interviewer.username || `${interviewer.first_name || ''} ${interviewer.last_name || ''}`.trim() || '-'
          }
        }
      }
    }
    
    return '-'
  }

  const getTypeDisplay = (type) => {
    const typeMap = {
      'PHONE': 'Téléphonique',
      'VIDEO': 'Vidéoconférence',
      'ONSITE': 'Sur site',
      'TECHNICAL': 'Technique',
      'HR': 'RH',
      'MANAGER': 'Manager',
      'FINAL': 'Final'
    }
    return typeMap[type] || type
  }

  const indexOfLastInterview = currentPage * rowsPerPage
  const indexOfFirstInterview = indexOfLastInterview - rowsPerPage
  const currentInterviews = filteredInterviews.slice(indexOfFirstInterview, indexOfLastInterview)
  const totalPages = Math.ceil(filteredInterviews.length / rowsPerPage)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des entretiens...</p>
      </div>
    )
  }

  return (
    <div className="interviews-tab">
      <div className="page-header">
        <h1>Entretiens</h1>
        <p>Gestion des entretiens de recrutement</p>
      </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon"><Briefcase size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Entretiens</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card stat-scheduled">
          <div className="stat-icon"><Calendar size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Planifiés</div>
            <div className="stat-value">{stats.scheduled}</div>
          </div>
        </div>
        <div className="stat-card stat-in-progress">
          <div className="stat-icon"><RefreshCw size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">En cours</div>
            <div className="stat-value">{stats.inProgress}</div>
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
              placeholder="Rechercher par candidat, intervieweur..."
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
              <option value="SCHEDULED">Planifié</option>
              <option value="RESCHEDULED">Reprogrammé</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="COMPLETED">Terminé</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterCandidate}
              onChange={(e) => setFilterCandidate(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les candidats</option>
              {candidates.map(candidate => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.full_name || `${candidate.first_name} ${candidate.last_name}`}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous les types</option>
              <option value="PHONE">Téléphonique</option>
              <option value="VIDEO">Vidéoconférence</option>
              <option value="ONSITE">Sur site</option>
              <option value="TECHNICAL">Technique</option>
              <option value="HR">RH</option>
              <option value="MANAGER">Manager</option>
              <option value="FINAL">Final</option>
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
          <button className="btn-primary" onClick={openAddDialog}>
            <Plus size={16} /> Nouvel Entretien
          </button>
        </div>
      </div>

      {/* Tableau */}
      {currentInterviews.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidat</th>
                <th>Intervieweur</th>
                <th>Date/Heure</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Note</th>
                <th>Recommandation</th>
              </tr>
            </thead>
            <tbody>
              {currentInterviews.map(interview => (
                <tr key={interview.id}>
                  <td>{interview.candidate_detail?.full_name || interview.candidate_name || '-'}</td>
                  <td>{getInterviewerName(interview)}</td>
                  <td>{formatDateTime(interview.scheduled_date)}</td>
                  <td>{getTypeDisplay(interview.interview_type)}</td>
                  <td>
                    <span className={`badge status-${getStatusClass(interview.status)}`}>
                      {getStatusDisplay(interview.status)}
                    </span>
                  </td>
                  <td>
                    {interview.rating > 0 ? (
                      <span className="rating-badge">
                        <Star size={14} /> {interview.rating}/10
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    {interview.recommendation ? (
                      <span className={`badge recommendation-${interview.recommendation.toLowerCase()}`}>
                        {interview.recommendation_display || interview.recommendation}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucun entretien trouvé</p>
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

      {/* Dialog Formulaire Entretien */}
      {showDialog && (
        <div className="dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="dialog dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Nouvel Entretien</h2>
              <button className="btn-close" onClick={() => setShowDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="dialog-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Candidat *</label>
                  <select
                    value={formData.candidate}
                    onChange={(e) => setFormData({ ...formData, candidate: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner un candidat</option>
                    {candidates.map(candidate => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.full_name || `${candidate.first_name} ${candidate.last_name}`} - {candidate.position}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Intervieweur</label>
                  <select
                    value={typeof formData.interviewer === 'object' ? (formData.interviewer?.id || '') : (formData.interviewer || '')}
                    onChange={(e) => {
                      const selectedValue = e.target.value
                      setFormData({ ...formData, interviewer: selectedValue || '' })
                    }}
                  >
                    <option value="">Sélectionner un intervieweur</option>
                    {users.length > 0 ? (
                      users.map(user => (
                        <option key={user.id} value={String(user.id)}>
                          {user.full_name || `${user.first_name} ${user.last_name}`.trim()} {user.username ? `(${user.username})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Aucun intervieweur disponible</option>
                    )}
                  </select>
                  {users.length === 0 && (
                    <small style={{ color: '#ef4444', display: 'block', marginTop: '0.25rem' }}>
                      Aucun employé avec compte utilisateur disponible. Veuillez d'abord créer des employés.
                    </small>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Heure *</label>
                  <input
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={formData.interview_type}
                    onChange={(e) => setFormData({ ...formData, interview_type: e.target.value })}
                    required
                  >
                    <option value="PHONE">Téléphonique</option>
                    <option value="VIDEO">Vidéoconférence</option>
                    <option value="ONSITE">Sur site</option>
                    <option value="TECHNICAL">Technique</option>
                    <option value="HR">RH</option>
                    <option value="MANAGER">Manager</option>
                    <option value="FINAL">Final</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Durée (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    placeholder="60"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Lieu</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Lieu de l'entretien"
                    disabled={formData.interview_type === 'VIDEO' || formData.interview_type === 'PHONE'}
                  />
                </div>
                <div className="form-group">
                  <label>Lien de réunion (vidéo)</label>
                  <input
                    type="url"
                    value={formData.meeting_link}
                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                    placeholder="https://..."
                    disabled={formData.interview_type !== 'VIDEO'}
                  />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  placeholder="Notes sur l'entretien..."
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

      {/* Dialog Compléter Entretien */}
      {showCompleteDialog && selectedInterview && (
        <div className="dialog-overlay" onClick={() => setShowCompleteDialog(false)}>
          <div className="dialog dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Compléter l'Entretien</h2>
              <button className="btn-close" onClick={() => setShowCompleteDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleComplete} className="dialog-form">
              <div className="approval-info">
                <p><strong>Candidat:</strong> {selectedInterview.candidate_detail?.full_name || '-'}</p>
                <p><strong>Type:</strong> {getTypeDisplay(selectedInterview.interview_type)}</p>
                <p><strong>Date:</strong> {formatDateTime(selectedInterview.scheduled_date)}</p>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Note (0-10) *</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={completeFormData.rating}
                    onChange={(e) => setCompleteFormData({ ...completeFormData, rating: e.target.value })}
                    required
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Durée réelle (minutes)</label>
                  <input
                    type="number"
                    value={completeFormData.duration_minutes}
                    onChange={(e) => setCompleteFormData({ ...completeFormData, duration_minutes: e.target.value })}
                    placeholder="60"
                  />
                </div>
                <div className="form-group">
                  <label>Recommandation</label>
                  <select
                    value={completeFormData.recommendation}
                    onChange={(e) => setCompleteFormData({ ...completeFormData, recommendation: e.target.value })}
                  >
                    <option value="">Sélectionner</option>
                    <option value="STRONG_YES">Fortement recommandé</option>
                    <option value="YES">Recommandé</option>
                    <option value="MAYBE">Peut-être</option>
                    <option value="NO">Non recommandé</option>
                  </select>
                </div>
              </div>
              <div className="form-group full-width">
                <label>Feedback</label>
                <textarea
                  value={completeFormData.feedback}
                  onChange={(e) => setCompleteFormData({ ...completeFormData, feedback: e.target.value })}
                  rows="4"
                  placeholder="Feedback sur l'entretien..."
                />
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Points forts</label>
                  <textarea
                    value={completeFormData.strengths}
                    onChange={(e) => setCompleteFormData({ ...completeFormData, strengths: e.target.value })}
                    rows="3"
                    placeholder="Points forts du candidat..."
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Points à améliorer</label>
                  <textarea
                    value={completeFormData.weaknesses}
                    onChange={(e) => setCompleteFormData({ ...completeFormData, weaknesses: e.target.value })}
                    rows="3"
                    placeholder="Points à améliorer..."
                  />
                </div>
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCompleteDialog(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Terminer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Reprogrammer */}
      {showRescheduleDialog && selectedInterview && (
        <div className="dialog-overlay" onClick={() => setShowRescheduleDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Reprogrammer l'Entretien</h2>
              <button className="btn-close" onClick={() => setShowRescheduleDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleReschedule} className="dialog-form">
              <div className="approval-info">
                <p><strong>Candidat:</strong> {selectedInterview.candidate_detail?.full_name || '-'}</p>
                <p><strong>Date actuelle:</strong> {formatDateTime(selectedInterview.scheduled_date)}</p>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Nouvelle Date *</label>
                  <input
                    type="date"
                    value={rescheduleFormData.new_date}
                    onChange={(e) => setRescheduleFormData({ ...rescheduleFormData, new_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nouvelle Heure *</label>
                  <input
                    type="time"
                    value={rescheduleFormData.new_time}
                    onChange={(e) => setRescheduleFormData({ ...rescheduleFormData, new_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowRescheduleDialog(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Reprogrammer
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
            <h2>Confirmer la suppression</h2>
            <p>
              Êtes-vous sûr de vouloir supprimer l'entretien avec{' '}
              <strong>{deleteConfirm.candidate_detail?.full_name || deleteConfirm.candidate_name || 'ce candidat'}</strong> ?
            </p>
            <p className="warning-text">
              <strong>Attention :</strong> Cette action est irréversible et supprimera toutes les données associées à cet entretien.
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
                Supprimer
              </button>
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
    </div>
  )
}

// Composant Onglet Sélection
const SelectionTab = () => {
  const [candidates, setCandidates] = useState([])
  const [filteredCandidates, setFilteredCandidates] = useState([])
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterRating, setFilterRating] = useState('')

  const stats = {
    totalInProcess: (candidates || []).filter(c => 
      ['SCREENING', 'INTERVIEW', 'SECOND_INTERVIEW', 'FINAL_REVIEW', 'OFFER_SENT'].includes(c.status)
    ).length,
    finalReview: (candidates || []).filter(c => c.status === 'FINAL_REVIEW').length,
    offerSent: (candidates || []).filter(c => c.status === 'OFFER_SENT').length,
    offerAccepted: (candidates || []).filter(c => c.status === 'OFFER_ACCEPTED').length,
    hired: (candidates || []).filter(c => c.status === 'HIRED').length,
    rejected: (candidates || []).filter(c => c.status === 'REJECTED').length
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/candidates/')
      setCandidates(response.data)
      setFilteredCandidates(response.data)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération des candidats:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la récupération des candidats'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchInterviews = useCallback(async () => {
    try {
      const response = await api.get('/ditech/interviews/')
      setInterviews(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des entretiens:', err)
    }
  }, [])

  const filterCandidates = useCallback(() => {
    let filtered = [...candidates]

    // Filtrer uniquement les candidats en processus de sélection
    filtered = filtered.filter(candidate =>
      ['SCREENING', 'INTERVIEW', 'SECOND_INTERVIEW', 'FINAL_REVIEW', 'OFFER_SENT', 'OFFER_ACCEPTED', 'HIRED', 'REJECTED'].includes(candidate.status)
    )

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(candidate =>
        candidate.full_name?.toLowerCase().includes(term) ||
        candidate.email?.toLowerCase().includes(term) ||
        candidate.position?.toLowerCase().includes(term)
      )
    }

    if (filterStage) {
      if (filterStage === 'IN_PROCESS') {
        filtered = filtered.filter(c => ['SCREENING', 'INTERVIEW', 'SECOND_INTERVIEW', 'FINAL_REVIEW'].includes(c.status))
      } else if (filterStage === 'OFFER_STAGE') {
        filtered = filtered.filter(c => ['OFFER_SENT', 'OFFER_ACCEPTED'].includes(c.status))
      } else {
        filtered = filtered.filter(c => c.status === filterStage)
      }
    }

    if (filterRating) {
      if (filterRating === 'high') {
        filtered = filtered.filter(c => (c.rating || 0) >= 8)
      } else if (filterRating === 'medium') {
        filtered = filtered.filter(c => (c.rating || 0) >= 5 && (c.rating || 0) < 8)
      } else if (filterRating === 'low') {
        filtered = filtered.filter(c => (c.rating || 0) < 5)
      }
    }

    // Trier par note décroissante, puis par date de candidature
    filtered.sort((a, b) => {
      if ((b.rating || 0) !== (a.rating || 0)) {
        return (b.rating || 0) - (a.rating || 0)
      }
      return new Date(b.application_date) - new Date(a.application_date)
    })

    setFilteredCandidates(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterStage, filterRating, candidates])

  useEffect(() => {
    fetchCandidates()
    fetchInterviews()
  }, [fetchCandidates, fetchInterviews])

  useEffect(() => {
    if (!loading) {
      filterCandidates()
    }
  }, [filterCandidates, loading])

  const handleStatusUpdate = async (candidate, newStatus) => {
    try {
      await api.post(`/ditech/candidates/${candidate.id}/update_status/`, { status: newStatus })
      showToast('Statut mis à jour avec succès', 'success')
      fetchCandidates()
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err)
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          'Erreur lors de la mise à jour du statut'
      showToast(errorMessage, 'error')
    }
  }

  const getCandidateInterviews = (candidateId) => {
    return interviews.filter(i => i.candidate === candidateId || i.candidate_detail?.id === candidateId)
  }

  const getAverageInterviewRating = (candidateId) => {
    const candidateInterviews = getCandidateInterviews(candidateId)
    const completedInterviews = candidateInterviews.filter(i => i.status === 'COMPLETED' && i.rating > 0)
    if (completedInterviews.length === 0) return null
    const sum = completedInterviews.reduce((acc, i) => acc + (i.rating || 0), 0)
    return (sum / completedInterviews.length).toFixed(1)
  }

  const getStatusDisplay = (status) => {
    const statusMap = {
      'SCREENING': 'Présélection',
      'INTERVIEW': 'Entretien',
      'SECOND_INTERVIEW': 'Second entretien',
      'FINAL_REVIEW': 'Évaluation finale',
      'OFFER_SENT': 'Offre envoyée',
      'OFFER_ACCEPTED': 'Offre acceptée',
      'HIRED': 'Embauché',
      'REJECTED': 'Rejeté'
    }
    return statusMap[status] || status
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'SCREENING': return 'status-screening'
      case 'INTERVIEW':
      case 'SECOND_INTERVIEW': return 'status-interview'
      case 'FINAL_REVIEW': return 'status-review'
      case 'OFFER_SENT':
      case 'OFFER_ACCEPTED': return 'status-offer'
      case 'HIRED': return 'status-hired'
      case 'REJECTED': return 'status-rejected'
      default: return ''
    }
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Candidat', key: 'full_name', accessor: (c) => c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || '-' },
      { header: 'Email', key: 'email', accessor: (c) => c.email || '-' },
      { header: 'Poste', key: 'position', accessor: (c) => c.position || '-' },
      { header: 'Note globale', key: 'rating', accessor: (c) => c.rating || c.overall_rating || 0 },
      { header: 'Note entretiens', key: 'avg_rating', accessor: (c) => getAverageInterviewRating(c.id) || '-' },
      { header: 'Nb entretiens', key: 'interview_count', accessor: (c) => getCandidateInterviews(c.id).length || 0 },
      { header: 'Étape', key: 'status', accessor: (c) => c.status_display || getStatusDisplay(c.status) || '-' },
      { header: 'Date candidature', key: 'application_date', accessor: (c) => c.application_date || '-' }
    ]
    exportToPDF(filteredCandidates, columns, 'Liste de la Sélection des Candidats', 'selection_candidats')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Candidat', key: 'full_name', accessor: (c) => c.full_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || '-' },
      { header: 'Email', key: 'email', accessor: (c) => c.email || '-' },
      { header: 'Poste', key: 'position', accessor: (c) => c.position || '-' },
      { header: 'Note globale', key: 'rating', accessor: (c) => c.rating || c.overall_rating || 0 },
      { header: 'Note entretiens', key: 'avg_rating', accessor: (c) => getAverageInterviewRating(c.id) || 0 },
      { header: 'Nb entretiens', key: 'interview_count', accessor: (c) => getCandidateInterviews(c.id).length || 0 },
      { header: 'Étape', key: 'status', accessor: (c) => c.status_display || getStatusDisplay(c.status) || '-' },
      { header: 'Date candidature', key: 'application_date', accessor: (c) => c.application_date || '-' }
    ]
    exportToExcel(filteredCandidates, columns, 'Sélection Candidats', 'selection_candidats')
    showToast('Export Excel en cours...', 'success')
  }

  const indexOfLastCandidate = currentPage * rowsPerPage
  const indexOfFirstCandidate = indexOfLastCandidate - rowsPerPage
  const currentCandidates = filteredCandidates.slice(indexOfFirstCandidate, indexOfLastCandidate)
  const totalPages = Math.ceil(filteredCandidates.length / rowsPerPage)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des candidats en sélection...</p>
      </div>
    )
  }

  return (
    <div className="selection-tab">
      <div className="page-header">
        <h1>Sélection</h1>
        <p>Processus de sélection des candidats</p>
      </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon"><RefreshCw size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">En Cours</div>
            <div className="stat-value">{stats.totalInProcess}</div>
          </div>
        </div>
        <div className="stat-card stat-review">
          <div className="stat-icon"><ClipboardList size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Évaluation Finale</div>
            <div className="stat-value">{stats.finalReview}</div>
          </div>
        </div>
        <div className="stat-card stat-offer">
          <div className="stat-icon"><Mail size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Offres Envoyées</div>
            <div className="stat-value">{stats.offerSent}</div>
          </div>
        </div>
        <div className="stat-card stat-accepted">
          <div className="stat-icon"><CheckCircle2 size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Offres Acceptées</div>
            <div className="stat-value">{stats.offerAccepted}</div>
          </div>
        </div>
        <div className="stat-card stat-hired">
          <div className="stat-icon"><PartyPopper size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Embauchés</div>
            <div className="stat-value">{stats.hired}</div>
          </div>
        </div>
        <div className="stat-card stat-rejected">
          <div className="stat-icon"><XCircle size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Rejetés</div>
            <div className="stat-value">{stats.rejected}</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Rechercher par nom, email, poste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="filter-select"
            >
              <option value="">Toutes les étapes</option>
              <option value="IN_PROCESS">En processus</option>
              <option value="SCREENING">Présélection</option>
              <option value="INTERVIEW">Entretien</option>
              <option value="SECOND_INTERVIEW">Second entretien</option>
              <option value="FINAL_REVIEW">Évaluation finale</option>
              <option value="OFFER_STAGE">Stage offre</option>
              <option value="OFFER_SENT">Offre envoyée</option>
              <option value="OFFER_ACCEPTED">Offre acceptée</option>
              <option value="HIRED">Embauché</option>
              <option value="REJECTED">Rejeté</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="filter-select"
            >
              <option value="">Toutes les notes</option>
              <option value="high">Note élevée (≥8)</option>
              <option value="medium">Note moyenne (5-7)</option>
              <option value="low">Note faible (&lt;5)</option>
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
      {currentCandidates.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidat</th>
                <th>Poste</th>
                <th>Note Globale</th>
                <th>Note Entretiens</th>
                <th>Nb Entretiens</th>
                <th>Étape</th>
                <th>Dernière Mise à Jour</th>
              </tr>
            </thead>
            <tbody>
              {currentCandidates.map(candidate => {
                const avgInterviewRating = getAverageInterviewRating(candidate.id)
                const candidateInterviews = getCandidateInterviews(candidate.id)
                return (
                  <tr key={candidate.id}>
                    <td>
                      <div>
                        <strong>{candidate.full_name || `${candidate.first_name} ${candidate.last_name}`}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{candidate.email}</div>
                      </div>
                    </td>
                    <td>{candidate.position}</td>
                    <td>
                      {candidate.rating > 0 ? (
                        <span className="rating-badge">
                          <Star size={14} /> {candidate.rating}/10
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {avgInterviewRating ? (
                        <span className="rating-badge">
                          <Briefcase size={14} /> {avgInterviewRating}/10
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      <span className="badge">
                        {candidateInterviews.length} entretien{candidateInterviews.length > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <span className={`badge status-${getStatusClass(candidate.status)}`}>
                        {getStatusDisplay(candidate.status)}
                      </span>
                    </td>
                    <td>{candidate.updated_at ? new Date(candidate.updated_at).toLocaleDateString('fr-FR') : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucun candidat en processus de sélection</p>
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

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default Recruitment
