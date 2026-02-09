import React, { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { exportToPDF, exportToExcel } from '../utils/exportUtils'
import { Users, CheckCircle2, XCircle, FileText, FileSpreadsheet, Plus, X } from 'lucide-react'
import './Employees.css'

const initialFormData = () => ({
  social_security_number: '',
  cnps_number: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  date_of_birth: '',
  place_of_birth: '',
  gender: '',
  nationality: '',
  marital_status: '',
  number_of_children: '',
  id_document_type: '',
  id_document_number: '',
  id_document_issue_date: '',
  date_of_hire: '',
  date_of_exit: '',
  position: '',
  qualification: '',
  salary: '',
  service: '',
  work_permit_title: '',
  work_permit_order_number: '',
  is_apprentice: false,
  is_professionalization_contract: false,
  is_cdd: false,
  is_part_time: false,
  contract_specific_other: ''
})

const Employees = () => {
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [services, setServices] = useState([])
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState(initialFormData())
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
        emp.social_security_number?.toLowerCase().includes(term) ||
        emp.cnps_number?.toLowerCase().includes(term) ||
        emp.email?.toLowerCase().includes(term) ||
        emp.phone?.toLowerCase().includes(term) ||
        emp.position?.toLowerCase().includes(term) ||
        emp.qualification?.toLowerCase().includes(term) ||
        emp.nationality?.toLowerCase().includes(term) ||
        emp.address?.toLowerCase().includes(term)
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
      { header: 'ID', key: 'employee_id', accessor: (emp) => emp.employee_id || '-' },
      { header: 'Nom', key: 'last_name', accessor: (emp) => emp.last_name || '-' },
      { header: 'Prénom', key: 'first_name', accessor: (emp) => emp.first_name || '-' },
      { header: 'N° sécurité sociale', key: 'social_security_number', accessor: (emp) => emp.social_security_number || '-' },
      { header: 'N° CNPS', key: 'cnps_number', accessor: (emp) => emp.cnps_number || '-' },
      { header: 'Date naissance', key: 'date_of_birth', accessor: (emp) => emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString('fr-FR') : '-' },
      { header: 'Sexe', key: 'gender', accessor: (emp) => emp.gender === 'M' ? 'M' : emp.gender === 'F' ? 'F' : '-' },
      { header: 'Nationalité', key: 'nationality', accessor: (emp) => emp.nationality || '-' },
      { header: 'Email', key: 'email', accessor: (emp) => emp.email || '-' },
      { header: 'Téléphone', key: 'phone', accessor: (emp) => emp.phone || '-' },
      { header: 'Adresse', key: 'address', accessor: (emp) => emp.address || '-' },
      { header: 'Emploi', key: 'position', accessor: (emp) => emp.position || '-' },
      { header: 'Qualification', key: 'qualification', accessor: (emp) => emp.qualification || '-' },
      { header: 'Service', key: 'service_name', accessor: (emp) => emp.service_name || '-' },
      { header: 'Date entrée', key: 'date_of_hire', accessor: (emp) => emp.date_of_hire ? new Date(emp.date_of_hire).toLocaleDateString('fr-FR') : '-' },
      { header: 'Date sortie', key: 'date_of_exit', accessor: (emp) => emp.date_of_exit ? new Date(emp.date_of_exit).toLocaleDateString('fr-FR') : '-' },
      { header: 'Salaire', key: 'salary', accessor: (emp) => emp.salary ? `${parseFloat(emp.salary).toLocaleString('fr-FR')} FCFA` : '-' },
      { header: 'Statut', key: 'is_active', accessor: (emp) => emp.is_active ? 'Actif' : 'Inactif' }
    ]
    exportToPDF(filteredEmployees, columns, 'Liste des Employés', 'employes')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'ID', key: 'employee_id', accessor: (emp) => emp.employee_id || '-' },
      { header: 'Nom', key: 'last_name', accessor: (emp) => emp.last_name || '-' },
      { header: 'Prénom', key: 'first_name', accessor: (emp) => emp.first_name || '-' },
      { header: 'N° sécurité sociale', key: 'social_security_number', accessor: (emp) => emp.social_security_number || '-' },
      { header: 'N° CNPS', key: 'cnps_number', accessor: (emp) => emp.cnps_number || '-' },
      { header: 'Date naissance', key: 'date_of_birth', accessor: (emp) => emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString('fr-FR') : '-' },
      { header: 'Sexe', key: 'gender', accessor: (emp) => emp.gender === 'M' ? 'M' : emp.gender === 'F' ? 'F' : '-' },
      { header: 'Nationalité', key: 'nationality', accessor: (emp) => emp.nationality || '-' },
      { header: 'Email', key: 'email', accessor: (emp) => emp.email || '-' },
      { header: 'Téléphone', key: 'phone', accessor: (emp) => emp.phone || '-' },
      { header: 'Adresse', key: 'address', accessor: (emp) => emp.address || '-' },
      { header: 'Emploi', key: 'position', accessor: (emp) => emp.position || '-' },
      { header: 'Qualification', key: 'qualification', accessor: (emp) => emp.qualification || '-' },
      { header: 'Service', key: 'service_name', accessor: (emp) => emp.service_name || '-' },
      { header: 'Date entrée', key: 'date_of_hire', accessor: (emp) => emp.date_of_hire ? new Date(emp.date_of_hire).toLocaleDateString('fr-FR') : '-' },
      { header: 'Date sortie', key: 'date_of_exit', accessor: (emp) => emp.date_of_exit ? new Date(emp.date_of_exit).toLocaleDateString('fr-FR') : '-' },
      { header: 'Salaire', key: 'salary', accessor: (emp) => emp.salary != null && emp.salary !== '' ? parseFloat(emp.salary) : '-' },
      { header: 'Statut', key: 'is_active', accessor: (emp) => emp.is_active ? 'Actif' : 'Inactif' }
    ]
    exportToExcel(filteredEmployees, columns, 'Employés', 'employes')
    showToast('Export Excel en cours...', 'success')
  }

  const openAddDialog = () => {
    setFormData(initialFormData())
    setShowDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSend = {
        social_security_number: formData.social_security_number || null,
        cnps_number: formData.cnps_number || null,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || '',
        date_of_birth: formData.date_of_birth || null,
        place_of_birth: formData.place_of_birth || '',
        gender: formData.gender || '',
        nationality: formData.nationality || '',
        marital_status: formData.marital_status || '',
        number_of_children: formData.number_of_children !== '' ? parseInt(formData.number_of_children) || 0 : 0,
        id_document_type: formData.id_document_type || '',
        id_document_number: formData.id_document_number || '',
        id_document_issue_date: formData.id_document_issue_date || null,
        date_of_hire: formData.date_of_hire,
        date_of_exit: formData.date_of_exit || null,
        position: formData.position,
        qualification: formData.qualification || '',
        salary: formData.salary ? parseFloat(formData.salary) : 0,
        service: formData.service && formData.service !== '' ? parseInt(formData.service) : null,
        work_permit_title: formData.work_permit_title || '',
        work_permit_order_number: formData.work_permit_order_number || '',
        is_apprentice: !!formData.is_apprentice,
        is_professionalization_contract: !!formData.is_professionalization_contract,
        is_cdd: !!formData.is_cdd,
        is_part_time: !!formData.is_part_time,
        contract_specific_other: formData.contract_specific_other || ''
      }

      await api.post('/ditech/employees/', dataToSend)
      showToast('Employé créé avec succès')
      setShowDialog(false)
      fetchEmployees()
    } catch (err) {
      console.error('Erreur:', err)
      const errorMessage = err.response?.data?.detail ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data) : 'Erreur lors de l\'opération')
      showToast(errorMessage, 'error')
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
            <Plus size={16} /> Ajoutez les employées
          </button>
        </div>
      </div>

      {/* Tableau - données du formulaire employé */}
      {currentEmployees.length > 0 ? (
        <div className="table-container">
          <table className="employees-table employees-table-registre">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>N° sécurité sociale</th>
                <th>N° CNPS</th>
                <th>Date naissance</th>
                <th>Sexe</th>
                <th>Nationalité</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Adresse</th>
                <th>Emploi</th>
                <th>Qualification</th>
                <th>Service</th>
                <th>Date entrée</th>
                <th>Date sortie</th>
                <th>Salaire</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {currentEmployees.map(employee => (
                <tr key={employee.id}>
                  <td>{employee.employee_id || '-'}</td>
                  <td>{employee.last_name || '-'}</td>
                  <td>{employee.first_name || '-'}</td>
                  <td>{employee.social_security_number || '-'}</td>
                  <td>{employee.cnps_number || '-'}</td>
                  <td>{employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>{employee.gender === 'M' ? 'M' : employee.gender === 'F' ? 'F' : '-'}</td>
                  <td>{employee.nationality || '-'}</td>
                  <td>{employee.email || '-'}</td>
                  <td>{employee.phone || '-'}</td>
                  <td title={employee.address || ''} className="cell-address">{employee.address ? (employee.address.length > 25 ? `${employee.address.slice(0, 25)}…` : employee.address) : '-'}</td>
                  <td>{employee.position || '-'}</td>
                  <td>{employee.qualification || '-'}</td>
                  <td>{employee.service_name || '-'}</td>
                  <td>{employee.date_of_hire ? new Date(employee.date_of_hire).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>{employee.date_of_exit ? new Date(employee.date_of_exit).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>{employee.salary != null && employee.salary !== '' ? `${Number(employee.salary).toLocaleString('fr-FR')} FCFA` : '-'}</td>
                  <td>
                    <span className={`status-badge ${employee.is_active ? 'active' : 'inactive'}`}>
                      {employee.is_active ? 'Actif' : 'Inactif'}
                    </span>
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

      {/* Dialog Ajout employé - Fiche de registre */}
      {showDialog && (
        <div className="dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="dialog dialog-registre" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Ajouter un employé</h2>
              <button className="btn-close" onClick={() => setShowDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="dialog-form dialog-form-registre">
              {/* 1. Identité / Noms et prénoms */}
              <fieldset className="form-section">
                <legend>Identité / Noms et prénoms</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom *</label>
                    <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Prénom *</label>
                    <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date de naissance</label>
                    <input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Lieu de naissance</label>
                    <input type="text" value={formData.place_of_birth} onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Sexe</label>
                    <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="">—</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nationalité</label>
                    <input type="text" value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Numéro de sécurité sociale</label>
                    <input type="text" value={formData.social_security_number} onChange={(e) => setFormData({ ...formData, social_security_number: e.target.value })} placeholder="N° de sécurité sociale" />
                  </div>
                  <div className="form-group">
                    <label>Numéro CNPS</label>
                    <input type="text" value={formData.cnps_number} onChange={(e) => setFormData({ ...formData, cnps_number: e.target.value })} placeholder="Numéro CNPS" />
                  </div>
                </div>
              </fieldset>

              {/* 2. Adresse et contact */}
              <fieldset className="form-section">
                <legend>Adresse et contact</legend>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Adresse</label>
                    <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                </div>
              </fieldset>

              {/* 3. Situation familiale */}
              <fieldset className="form-section">
                <legend>Situation familiale</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label>Situation familiale</label>
                    <select value={formData.marital_status} onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}>
                      <option value="">—</option>
                      <option value="SINGLE">Célibataire</option>
                      <option value="MARRIED">Marié(e)</option>
                      <option value="DIVORCED">Divorcé(e)</option>
                      <option value="WIDOWED">Veuf(ve)</option>
                      <option value="PACS">PACS</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nombre d'enfants</label>
                    <input type="number" min="0" value={formData.number_of_children} onChange={(e) => setFormData({ ...formData, number_of_children: e.target.value })} />
                  </div>
                </div>
              </fieldset>

              {/* 4. Pièce d'identité */}
              <fieldset className="form-section">
                <legend>Pièce d'identité</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type de pièce</label>
                    <select value={formData.id_document_type} onChange={(e) => setFormData({ ...formData, id_document_type: e.target.value })}>
                      <option value="">—</option>
                      <option value="CNI">Carte nationale d'identité</option>
                      <option value="PASSPORT">Passeport</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Numéro de pièce</label>
                    <input type="text" value={formData.id_document_number} onChange={(e) => setFormData({ ...formData, id_document_number: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date de délivrance</label>
                    <input type="date" value={formData.id_document_issue_date} onChange={(e) => setFormData({ ...formData, id_document_issue_date: e.target.value })} />
                  </div>
                </div>
              </fieldset>

              {/* 5. Emploi et qualification */}
              <fieldset className="form-section">
                <legend>Emploi et qualification</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label>Emploi / Poste *</label>
                    <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Qualification</label>
                    <input type="text" value={formData.qualification} onChange={(e) => setFormData({ ...formData, qualification: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Service</label>
                    <select value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })}>
                      <option value="">Sélectionner un service</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Salaire</label>
                    <input type="number" min="0" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} />
                  </div>
                </div>
              </fieldset>

              {/* 6. Dates (entrée / sortie) */}
              <fieldset className="form-section">
                <legend>Dates</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date d'entrée (embauche) *</label>
                    <input type="date" value={formData.date_of_hire} onChange={(e) => setFormData({ ...formData, date_of_hire: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Date de sortie</label>
                    <input type="date" value={formData.date_of_exit} onChange={(e) => setFormData({ ...formData, date_of_exit: e.target.value })} />
                  </div>
                </div>
              </fieldset>

              {/* 7. Travailleurs étrangers */}
              <fieldset className="form-section">
                <legend>Travailleurs étrangers (titre autorisant l'activité salariée)</legend>
                <div className="form-row">
                  <div className="form-group">
                    <label>Titre</label>
                    <input type="text" value={formData.work_permit_title} onChange={(e) => setFormData({ ...formData, work_permit_title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>N° d'ordre</label>
                    <input type="text" value={formData.work_permit_order_number} onChange={(e) => setFormData({ ...formData, work_permit_order_number: e.target.value })} />
                  </div>
                </div>
              </fieldset>

              {/* 8. Jeunes travailleurs */}
              <fieldset className="form-section">
                <legend>Jeunes travailleurs</legend>
                <div className="form-row form-row-checkboxes">
                  <div className="form-group form-group-checkbox">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={!!formData.is_apprentice} onChange={(e) => setFormData({ ...formData, is_apprentice: e.target.checked })} />
                      Apprentissage
                    </label>
                  </div>
                  <div className="form-group form-group-checkbox">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={!!formData.is_professionalization_contract} onChange={(e) => setFormData({ ...formData, is_professionalization_contract: e.target.checked })} />
                      Professionnalisation
                    </label>
                  </div>
                </div>
              </fieldset>

              {/* 9. Contrat spécifique */}
              <fieldset className="form-section">
                <legend>Contrat spécifique</legend>
                <div className="form-row form-row-checkboxes">
                  <div className="form-group form-group-checkbox">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={!!formData.is_cdd} onChange={(e) => setFormData({ ...formData, is_cdd: e.target.checked })} />
                      CDD
                    </label>
                  </div>
                  <div className="form-group form-group-checkbox">
                    <label className="checkbox-label">
                      <input type="checkbox" checked={!!formData.is_part_time} onChange={(e) => setFormData({ ...formData, is_part_time: e.target.checked })} />
                      Temps partiel
                    </label>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Autre</label>
                    <input type="text" value={formData.contract_specific_other} onChange={(e) => setFormData({ ...formData, contract_specific_other: e.target.value })} placeholder="Autre type de contrat" />
                  </div>
                </div>
              </fieldset>

              <div className="dialog-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDialog(false)}>Annuler</button>
                <button type="submit" className="btn-primary">Créer</button>
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

export default Employees
