import React, { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../utils/api'
import { exportToPDF, exportToExcel } from '../utils/exportUtils'
import { Wallet, Gift, ClipboardList, Minus, History, FileText, FileSpreadsheet, Plus, Pencil, Trash2, X, CheckCircle2, XCircle, DollarSign, Clock, BarChart3, TrendingUp, FolderOpen, Calendar } from 'lucide-react'
import './Payroll.css'

const Payroll = ({ tab = 'payslips' }) => {
  console.log('Payroll component mounted')
  const [activeTab, setActiveTab] = useState(tab) // payslips, bonuses, retentions, deductions, history

  // Mettre à jour l'onglet actif si la prop tab change
  React.useEffect(() => {
    setActiveTab(tab)
  }, [tab])

  // Si on a une prop tab spécifique, on affiche seulement cet onglet sans les tabs de navigation
  const showOnlyTab = tab && tab !== 'all'

  return (
    <div className="payroll-page">
      {!showOnlyTab && (
        <>
          <div className="page-header">
            <h1>Gestion de la Paie</h1>
            <p>Fiches de paie - Primes - Retenues - Déductions - Historique des paiements</p>
          </div>

          {/* Onglets */}
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'payslips' ? 'active' : ''}`}
              onClick={() => setActiveTab('payslips')}
            >
              <Wallet size={18} /> Fiches de paie
            </button>
            <button
              className={`tab-button ${activeTab === 'bonuses' ? 'active' : ''}`}
              onClick={() => setActiveTab('bonuses')}
            >
              <Gift size={18} /> Primes
            </button>
            <button
              className={`tab-button ${activeTab === 'retentions' ? 'active' : ''}`}
              onClick={() => setActiveTab('retentions')}
            >
              <ClipboardList size={18} /> Retenues
            </button>
            <button
              className={`tab-button ${activeTab === 'deductions' ? 'active' : ''}`}
              onClick={() => setActiveTab('deductions')}
            >
              <Minus size={18} /> Déductions
            </button>
            <button
              className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={18} /> Historique des paiements
            </button>
          </div>
        </>
      )}

      {/* Contenu des onglets */}
      <div className="tab-content">
        {activeTab === 'payslips' && <PayslipsTab />}
        {activeTab === 'bonuses' && <BonusesTab />}
        {activeTab === 'retentions' && <RetentionsTab />}
        {activeTab === 'deductions' && <DeductionsTab />}
        {activeTab === 'history' && <PaymentHistoryTab />}
      </div>
    </div>
  )
}

// Composant Onglet Fiches de paie
const PayslipsTab = () => {
  console.log('PayslipsTab component mounted')
  const [payslips, setPayslips] = useState([])
  const [filteredPayslips, setFilteredPayslips] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    employee: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    base_salary: '',
    bonuses: 0,
    deductions: 0,
    overtime_pay: 0,
    payment_date: '',
    payment_method: '',
    status: 'DRAFT',
    notes: ''
  })
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')

  const stats = {
    total: (payslips || []).length,
    draft: (payslips || []).filter(p => p.status === 'DRAFT').length,
    generated: (payslips || []).filter(p => p.status === 'GENERATED').length,
    sent: (payslips || []).filter(p => p.status === 'SENT').length,
    paid: (payslips || []).filter(p => p.status === 'PAID').length,
    totalGross: (payslips || []).reduce((sum, p) => sum + parseFloat(p.gross_salary || 0), 0),
    totalNet: (payslips || []).reduce((sum, p) => sum + parseFloat(p.net_salary || 0), 0)
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchPayslips = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/payslips/')
      setPayslips(response.data)
      setFilteredPayslips(response.data)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération des fiches de paie:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la récupération des fiches de paie'
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

  const filterPayslips = useCallback(() => {
    let filtered = [...payslips]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(payslip =>
        payslip.employee_name?.toLowerCase().includes(term) ||
        payslip.status_display?.toLowerCase().includes(term)
      )
    }

    if (filterEmployee) {
      filtered = filtered.filter(payslip => payslip.employee === parseInt(filterEmployee))
    }

    if (filterStatus) {
      filtered = filtered.filter(payslip => payslip.status === filterStatus)
    }

    if (filterMonth) {
      filtered = filtered.filter(payslip => payslip.month === parseInt(filterMonth))
    }

    if (filterYear) {
      filtered = filtered.filter(payslip => payslip.year === parseInt(filterYear))
    }

    setFilteredPayslips(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterEmployee, filterStatus, filterMonth, filterYear, payslips])

  useEffect(() => {
    fetchPayslips()
    fetchEmployees()
  }, [fetchPayslips, fetchEmployees])

  useEffect(() => {
    if (!loading) {
      filterPayslips()
    }
  }, [filterPayslips, loading])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleEmployeeChange = (e) => {
    setFilterEmployee(e.target.value)
  }

  const handleStatusChange = (e) => {
    setFilterStatus(e.target.value)
  }

  const handleMonthChange = (e) => {
    setFilterMonth(e.target.value)
  }

  const handleYearChange = (e) => {
    setFilterYear(e.target.value)
  }

  const openAddDialog = () => {
    setFormData({
      employee: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      base_salary: '',
      bonuses: 0,
      deductions: 0,
      overtime_pay: 0,
      payment_date: '',
      payment_method: '',
      status: 'DRAFT',
      notes: ''
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSend = {
        ...formData,
        employee: parseInt(formData.employee),
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        base_salary: parseFloat(formData.base_salary),
        bonuses: parseFloat(formData.bonuses || 0),
        deductions: parseFloat(formData.deductions || 0),
        overtime_pay: parseFloat(formData.overtime_pay || 0)
      }

      await api.post('/ditech/payslips/', dataToSend)
      showToast('Fiche de paie créée avec succès', 'success')
      setShowDialog(false)
      fetchPayslips()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Erreur lors de la sauvegarde de la fiche de paie'
      showToast(errorMessage, 'error')
    }
  }

  const _handleDeletePayslip = async (payslip) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la fiche de paie de ${payslip.employee_name} pour ${payslip.month}/${payslip.year} ?`)) {
      try {
        await api.delete(`/ditech/payslips/${payslip.id}/`)
        showToast('Fiche de paie supprimée avec succès', 'success')
        fetchPayslips()
      } catch (err) {
        console.error('Erreur lors de la suppression:', err)
        const errorMessage = err.response?.data?.detail || 
                            err.response?.data?.message || 
                            'Erreur lors de la suppression'
        showToast(errorMessage, 'error')
      }
    }
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (p) => p.employee_name || '-' },
      { header: 'Mois', key: 'month', accessor: (p) => p.month || '-' },
      { header: 'Année', key: 'year', accessor: (p) => p.year || '-' },
      { header: 'Salaire de base', key: 'base_salary', accessor: (p) => p.base_salary ? `${parseFloat(p.base_salary).toLocaleString('fr-FR')} FCFA` : '-' },
      { header: 'Primes', key: 'bonuses', accessor: (p) => p.bonuses ? `${parseFloat(p.bonuses).toLocaleString('fr-FR')} FCFA` : '0 FCFA' },
      { header: 'Déductions', key: 'deductions', accessor: (p) => p.deductions ? `${parseFloat(p.deductions).toLocaleString('fr-FR')} FCFA` : '0 FCFA' },
      { header: 'Heures supp.', key: 'overtime_pay', accessor: (p) => p.overtime_pay ? `${parseFloat(p.overtime_pay).toLocaleString('fr-FR')} FCFA` : '0 FCFA' },
      { header: 'Salaire brut', key: 'gross_salary', accessor: (p) => p.gross_salary ? `${parseFloat(p.gross_salary).toLocaleString('fr-FR')} FCFA` : '-' },
      { header: 'Salaire net', key: 'net_salary', accessor: (p) => p.net_salary ? `${parseFloat(p.net_salary).toLocaleString('fr-FR')} FCFA` : '-' },
      { header: 'Statut', key: 'status', accessor: (p) => {
        const statusMap = { 'DRAFT': 'Brouillon', 'GENERATED': 'Générée', 'SENT': 'Envoyée', 'PAID': 'Payée' }
        return statusMap[p.status] || p.status || '-'
      }},
      { header: 'Date de paiement', key: 'payment_date', accessor: (p) => p.payment_date || '-' }
    ]
    exportToPDF(filteredPayslips, columns, 'Liste des Fiches de Paie', 'fiches_paie')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Employé', key: 'employee_name', accessor: (p) => p.employee_name || '-' },
      { header: 'Mois', key: 'month', accessor: (p) => p.month || '-' },
      { header: 'Année', key: 'year', accessor: (p) => p.year || '-' },
      { header: 'Salaire de base', key: 'base_salary', accessor: (p) => p.base_salary ? parseFloat(p.base_salary) : 0 },
      { header: 'Primes', key: 'bonuses', accessor: (p) => p.bonuses ? parseFloat(p.bonuses) : 0 },
      { header: 'Déductions', key: 'deductions', accessor: (p) => p.deductions ? parseFloat(p.deductions) : 0 },
      { header: 'Heures supp.', key: 'overtime_pay', accessor: (p) => p.overtime_pay ? parseFloat(p.overtime_pay) : 0 },
      { header: 'Salaire brut', key: 'gross_salary', accessor: (p) => p.gross_salary ? parseFloat(p.gross_salary) : 0 },
      { header: 'Salaire net', key: 'net_salary', accessor: (p) => p.net_salary ? parseFloat(p.net_salary) : 0 },
      { header: 'Statut', key: 'status', accessor: (p) => {
        const statusMap = { 'DRAFT': 'Brouillon', 'GENERATED': 'Générée', 'SENT': 'Envoyée', 'PAID': 'Payée' }
        return statusMap[p.status] || p.status || '-'
      }},
      { header: 'Date de paiement', key: 'payment_date', accessor: (p) => p.payment_date || '-' }
    ]
    exportToExcel(filteredPayslips, columns, 'Fiches de Paie', 'fiches_paie')
    showToast('Export Excel en cours...', 'success')
  }

  const indexOfLastPayslip = currentPage * rowsPerPage
  const indexOfFirstPayslip = indexOfLastPayslip - rowsPerPage
  const currentPayslips = filteredPayslips.slice(indexOfFirstPayslip, indexOfLastPayslip)
  const totalPages = Math.ceil(filteredPayslips.length / rowsPerPage)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des fiches de paie...</p>
      </div>
    )
  }

  return (
    <div className="payslips-tab">
      <div className="page-header">
        <h1>Fiches de paie</h1>
        <p>Gestion des fiches de paie</p>
      </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon"><Wallet size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Fiches</div>
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
        <div className="stat-card stat-generated">
          <div className="stat-icon"><FileText size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Générées</div>
            <div className="stat-value">{stats.generated}</div>
          </div>
        </div>
        <div className="stat-card stat-sent">
          <div className="stat-icon">📧</div>
          <div className="stat-info">
            <div className="stat-label">Envoyées</div>
            <div className="stat-value">{stats.sent}</div>
          </div>
        </div>
        <div className="stat-card stat-paid">
          <div className="stat-icon"><CheckCircle2 size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Payées</div>
            <div className="stat-value">{stats.paid}</div>
          </div>
        </div>
        <div className="stat-card stat-gross">
          <div className="stat-icon"><DollarSign size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Brut</div>
            <div className="stat-value">{stats.totalGross.toFixed(2)} FCFA</div>
          </div>
        </div>
        <div className="stat-card stat-net">
          <div className="stat-icon">💶</div>
          <div className="stat-info">
            <div className="stat-label">Total Net</div>
            <div className="stat-value">{stats.totalNet.toFixed(2)} FCFA</div>
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
              onChange={handleSearch}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={filterEmployee}
              onChange={handleEmployeeChange}
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
              onChange={handleStatusChange}
              className="filter-select"
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="GENERATED">Généré</option>
              <option value="SENT">Envoyé</option>
              <option value="PAID">Payé</option>
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterMonth}
              onChange={handleMonthChange}
              className="filter-select"
            >
              <option value="">Tous les mois</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleString('fr-FR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterYear}
              onChange={handleYearChange}
              className="filter-select"
            >
              <option value="">Toutes les années</option>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>
                  {year}
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
            <Plus size={16} /> Nouvelle Fiche de Paie
          </button>
        </div>
      </div>

      {/* Tableau */}
      {currentPayslips.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Période</th>
                <th>Salaire Brut</th>
                <th>Salaire Net</th>
                <th>Statut</th>
                <th>Date Paiement</th>
              </tr>
            </thead>
            <tbody>
              {currentPayslips.map(payslip => (
                <tr key={payslip.id}>
                  <td>{payslip.employee_name || '-'}</td>
                  <td>{payslip.month}/{payslip.year}</td>
                  <td>{parseFloat(payslip.gross_salary || 0).toFixed(2)} FCFA</td>
                  <td>{parseFloat(payslip.net_salary || 0).toFixed(2)} FCFA</td>
                  <td>
                    <span className={`badge status-${payslip.status.toLowerCase()}`}>
                      {payslip.status_display}
                    </span>
                  </td>
                  <td>{payslip.payment_date || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucune fiche de paie trouvée</p>
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
              <h2>Nouvelle Fiche de Paie</h2>
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
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Mois *</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Année *</label>
                  <input
                    type="number"
                    min="2020"
                    max="2100"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Salaire de base *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Primes</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.bonuses}
                    onChange={(e) => setFormData({ ...formData, bonuses: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Heures supplémentaires</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.overtime_pay}
                    onChange={(e) => setFormData({ ...formData, overtime_pay: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Déductions</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="DRAFT">Brouillon</option>
                    <option value="GENERATED">Généré</option>
                    <option value="SENT">Envoyé</option>
                    <option value="PAID">Payé</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date de paiement</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Méthode de paiement</label>
                  <input
                    type="text"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    placeholder="Virement, Chèque, Espèces..."
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

// Composant Onglet Primes
const BonusesTab = () => {
  const [bonuses, setBonuses] = useState([])
  const [filteredBonuses, setFilteredBonuses] = useState([])
  const [payslips, setPayslips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [_editingBonus, setEditingBonus] = useState(null)
  const [formData, setFormData] = useState({
    payslip: '',
    bonus_type: 'PERFORMANCE',
    description: '',
    amount: ''
  })
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPayslip, setFilterPayslip] = useState('')
  const [filterType, setFilterType] = useState('')

  const stats = {
    total: (bonuses || []).length,
    totalAmount: (bonuses || []).reduce((sum, b) => sum + parseFloat(b.amount || 0), 0),
    performance: (bonuses || []).filter(b => b.bonus_type === 'PERFORMANCE').length,
    project: (bonuses || []).filter(b => b.bonus_type === 'PROJECT').length,
    overtime: (bonuses || []).filter(b => b.bonus_type === 'OVERTIME').length,
    other: (bonuses || []).filter(b => b.bonus_type === 'OTHER' || b.bonus_type === 'BONUS' || b.bonus_type === 'COMMISSION' || b.bonus_type === 'ALLOWANCE').length
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchBonuses = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/payslip-bonuses/')
      setBonuses(response.data)
      setFilteredBonuses(response.data)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération des primes:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la récupération des primes'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPayslips = useCallback(async () => {
    try {
      const response = await api.get('/ditech/payslips/')
      setPayslips(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des fiches de paie:', err)
    }
  }, [])

  const filterBonuses = useCallback(() => {
    let filtered = [...bonuses]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(bonus =>
        bonus.description?.toLowerCase().includes(term) ||
        bonus.bonus_type_display?.toLowerCase().includes(term) ||
        bonus.payslip_detail?.employee_name?.toLowerCase().includes(term)
      )
    }

    if (filterPayslip) {
      filtered = filtered.filter(bonus => bonus.payslip === parseInt(filterPayslip))
    }

    if (filterType) {
      filtered = filtered.filter(bonus => bonus.bonus_type === filterType)
    }

    setFilteredBonuses(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterPayslip, filterType, bonuses])

  useEffect(() => {
    fetchBonuses()
    fetchPayslips()
  }, [fetchBonuses, fetchPayslips])

  useEffect(() => {
    if (!loading) {
      filterBonuses()
    }
  }, [filterBonuses, loading])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handlePayslipChange = (e) => {
    setFilterPayslip(e.target.value)
  }

  const handleTypeChange = (e) => {
    setFilterType(e.target.value)
  }

  const openAddDialog = () => {
    setEditingBonus(null)
    setFormData({
      payslip: '',
      bonus_type: 'PERFORMANCE',
      description: '',
      amount: ''
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSend = {
        ...formData,
        payslip: parseInt(formData.payslip),
        amount: parseFloat(formData.amount)
      }

      await api.post('/ditech/payslip-bonuses/', dataToSend)
      showToast('Prime ajoutée avec succès', 'success')
      setShowDialog(false)
      fetchBonuses()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Erreur lors de la sauvegarde de la prime'
      showToast(errorMessage, 'error')
    }
  }

  const _handleDeleteBonus = async (bonus) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette prime ?`)) {
      try {
        await api.delete(`/ditech/payslip-bonuses/${bonus.id}/`)
        showToast('Prime supprimée avec succès', 'success')
        fetchBonuses()
      } catch (err) {
        console.error('Erreur lors de la suppression:', err)
        const errorMessage = err.response?.data?.detail || 
                            err.response?.data?.message || 
                            'Erreur lors de la suppression'
        showToast(errorMessage, 'error')
      }
    }
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Fiche de Paie', key: 'payslip_id', accessor: (b) => b.payslip_id || `#${b.payslip || '-'}` },
      { header: 'Employé', key: 'employee_name', accessor: (b) => b.employee_name || b.payslip_employee_name || '-' },
      { header: 'Type de prime', key: 'bonus_type', accessor: (b) => {
        const typeMap = { 'PERFORMANCE': 'Performance', 'PROJECT': 'Projet', 'OVERTIME': 'Heures supp.', 'OTHER': 'Autre', 'BONUS': 'Prime', 'COMMISSION': 'Commission', 'ALLOWANCE': 'Allocation' }
        return typeMap[b.bonus_type] || b.bonus_type || '-'
      }},
      { header: 'Description', key: 'description', accessor: (b) => b.description || '-' },
      { header: 'Montant', key: 'amount', accessor: (b) => b.amount ? `${parseFloat(b.amount).toLocaleString('fr-FR')} FCFA` : '0 FCFA' }
    ]
    exportToPDF(filteredBonuses, columns, 'Liste des Primes', 'primes')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Fiche de Paie', key: 'payslip_id', accessor: (b) => b.payslip_id || b.payslip || '-' },
      { header: 'Employé', key: 'employee_name', accessor: (b) => b.employee_name || b.payslip_employee_name || '-' },
      { header: 'Type de prime', key: 'bonus_type', accessor: (b) => {
        const typeMap = { 'PERFORMANCE': 'Performance', 'PROJECT': 'Projet', 'OVERTIME': 'Heures supp.', 'OTHER': 'Autre', 'BONUS': 'Prime', 'COMMISSION': 'Commission', 'ALLOWANCE': 'Allocation' }
        return typeMap[b.bonus_type] || b.bonus_type || '-'
      }},
      { header: 'Description', key: 'description', accessor: (b) => b.description || '-' },
      { header: 'Montant', key: 'amount', accessor: (b) => b.amount ? parseFloat(b.amount) : 0 }
    ]
    exportToExcel(filteredBonuses, columns, 'Primes', 'primes')
    showToast('Export Excel en cours...', 'success')
  }

  const indexOfLastBonus = currentPage * rowsPerPage
  const indexOfFirstBonus = indexOfLastBonus - rowsPerPage
  const currentBonuses = filteredBonuses.slice(indexOfFirstBonus, indexOfLastBonus)
  const totalPages = Math.ceil(filteredBonuses.length / rowsPerPage)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des primes...</p>
      </div>
    )
  }

  return (
    <div className="bonuses-tab">
      <div className="page-header">
        <h1>Primes</h1>
        <p>Gestion des primes</p>
      </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon"><Gift size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Primes</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card stat-gross">
          <div className="stat-icon"><Wallet size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Montant</div>
            <div className="stat-value">{stats.totalAmount.toFixed(2)} FCFA</div>
          </div>
        </div>
        <div className="stat-card stat-paid">
          <div className="stat-icon"><BarChart3 size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Performance</div>
            <div className="stat-value">{stats.performance}</div>
          </div>
        </div>
        <div className="stat-card stat-sent">
          <div className="stat-icon"><FolderOpen size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Projet</div>
            <div className="stat-value">{stats.project}</div>
          </div>
        </div>
        <div className="stat-card stat-generated">
          <div className="stat-icon"><Clock size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Heures Supp.</div>
            <div className="stat-value">{stats.overtime}</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Rechercher par description, type..."
              value={searchTerm}
              onChange={handleSearch}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={filterPayslip}
              onChange={handlePayslipChange}
              className="filter-select"
            >
              <option value="">Toutes les fiches de paie</option>
              {payslips.map(payslip => (
                <option key={payslip.id} value={payslip.id}>
                  {payslip.employee_name} - {payslip.month}/{payslip.year}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterType}
              onChange={handleTypeChange}
              className="filter-select"
            >
              <option value="">Tous les types</option>
              <option value="PERFORMANCE">Prime de performance</option>
              <option value="PROJECT">Prime de projet</option>
              <option value="OVERTIME">Heures supplémentaires</option>
              <option value="BONUS">Bonus</option>
              <option value="COMMISSION">Commission</option>
              <option value="ALLOWANCE">Indemnité</option>
              <option value="OTHER">Autre</option>
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
            <Plus size={16} /> Ajouter une Prime
          </button>
        </div>
      </div>

      {/* Tableau */}
      {currentBonuses.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fiche de Paie</th>
                <th>Type</th>
                <th>Description</th>
                <th>Montant</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentBonuses.map(bonus => (
                <tr key={bonus.id}>
                  <td>{bonus.payslip_detail?.employee_name || '-'} - {bonus.payslip_detail?.month}/{bonus.payslip_detail?.year}</td>
                  <td>
                    <span className="badge status-generated">
                      {bonus.bonus_type_display || bonus.bonus_type}
                    </span>
                  </td>
                  <td>{bonus.description || '-'}</td>
                  <td>{parseFloat(bonus.amount || 0).toFixed(2)} FCFA</td>
                  <td>{bonus.created_at ? new Date(bonus.created_at).toLocaleDateString('fr-FR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucune prime trouvée</p>
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
              <h2>Nouvelle Prime</h2>
              <button className="btn-close" onClick={() => setShowDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="dialog-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Fiche de Paie *</label>
                  <select
                    value={formData.payslip}
                    onChange={(e) => setFormData({ ...formData, payslip: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner une fiche de paie</option>
                    {payslips.map(payslip => (
                      <option key={payslip.id} value={payslip.id}>
                        {payslip.employee_name} - {payslip.month}/{payslip.year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Type de Prime *</label>
                  <select
                    value={formData.bonus_type}
                    onChange={(e) => setFormData({ ...formData, bonus_type: e.target.value })}
                    required
                  >
                    <option value="PERFORMANCE">Prime de performance</option>
                    <option value="PROJECT">Prime de projet</option>
                    <option value="OVERTIME">Heures supplémentaires</option>
                    <option value="BONUS">Bonus</option>
                    <option value="COMMISSION">Commission</option>
                    <option value="ALLOWANCE">Indemnité</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Description *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="Description de la prime"
                  />
                </div>
                <div className="form-group">
                  <label>Montant *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDialog(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Ajouter
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

// Types de retenues
const RETENTION_TYPES = ['LOAN', 'ADVANCE', 'ABSENCE', 'LATE']

// Composant Onglet Retenues
const RetentionsTab = () => {
  const [retentions, setRetentions] = useState([])
  const [filteredRetentions, setFilteredRetentions] = useState([])
  const [payslips, setPayslips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [_editingRetention, setEditingRetention] = useState(null)
  const [formData, setFormData] = useState({
    payslip: '',
    deduction_type: 'LOAN',
    description: '',
    amount: ''
  })
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPayslip, setFilterPayslip] = useState('')
  const [filterType, setFilterType] = useState('')
  
  const allRetentions = (retentions || []).filter(r => RETENTION_TYPES.includes(r.deduction_type))

  const stats = {
    total: allRetentions.length,
    totalAmount: allRetentions.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0),
    loan: allRetentions.filter(r => r.deduction_type === 'LOAN').length,
    advance: allRetentions.filter(r => r.deduction_type === 'ADVANCE').length,
    absence: allRetentions.filter(r => r.deduction_type === 'ABSENCE').length,
    late: allRetentions.filter(r => r.deduction_type === 'LATE').length
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchRetentions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/payslip-deductions/')
      // Filtrer uniquement les retenues
      const retentionData = response.data.filter(d => RETENTION_TYPES.includes(d.deduction_type))
      setRetentions(retentionData)
      setFilteredRetentions(retentionData)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération des retenues:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la récupération des retenues'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPayslips = useCallback(async () => {
    try {
      const response = await api.get('/ditech/payslips/')
      setPayslips(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des fiches de paie:', err)
    }
  }, [])

  const filterRetentions = useCallback(() => {
    let filtered = [...retentions]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(retention =>
        retention.description?.toLowerCase().includes(term) ||
        retention.deduction_type_display?.toLowerCase().includes(term) ||
        retention.payslip_detail?.employee_name?.toLowerCase().includes(term)
      )
    }

    if (filterPayslip) {
      filtered = filtered.filter(retention => retention.payslip === parseInt(filterPayslip))
    }

    if (filterType) {
      filtered = filtered.filter(retention => retention.deduction_type === filterType)
    }

    setFilteredRetentions(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterPayslip, filterType, retentions])

  useEffect(() => {
    fetchRetentions()
    fetchPayslips()
  }, [fetchRetentions, fetchPayslips])

  useEffect(() => {
    if (!loading) {
      filterRetentions()
    }
  }, [filterRetentions, loading])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handlePayslipChange = (e) => {
    setFilterPayslip(e.target.value)
  }

  const handleTypeChange = (e) => {
    setFilterType(e.target.value)
  }

  const openAddDialog = () => {
    setEditingRetention(null)
    setFormData({
      payslip: '',
      deduction_type: 'LOAN',
      description: '',
      amount: ''
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSend = {
        ...formData,
        payslip: parseInt(formData.payslip),
        amount: parseFloat(formData.amount)
      }

      await api.post('/ditech/payslip-deductions/', dataToSend)
      showToast('Retenue ajoutée avec succès', 'success')
      setShowDialog(false)
      fetchRetentions()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Erreur lors de la sauvegarde de la retenue'
      showToast(errorMessage, 'error')
    }
  }

  const _handleDeleteRetention = async (retention) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette retenue ?`)) {
      try {
        await api.delete(`/ditech/payslip-deductions/${retention.id}/`)
        showToast('Retenue supprimée avec succès', 'success')
        fetchRetentions()
      } catch (err) {
        console.error('Erreur lors de la suppression:', err)
        const errorMessage = err.response?.data?.detail || 
                            err.response?.data?.message || 
                            'Erreur lors de la suppression'
        showToast(errorMessage, 'error')
      }
    }
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Fiche de Paie', key: 'payslip_id', accessor: (r) => r.payslip_detail ? `${r.payslip_detail.employee_name} - ${r.payslip_detail.month}/${r.payslip_detail.year}` : `#${r.payslip || '-'}` },
      { header: 'Type', key: 'deduction_type', accessor: (r) => {
        const typeMap = { 'LOAN': 'Prêt', 'ADVANCE': 'Avance', 'ABSENCE': 'Absence', 'LATE': 'Retard' }
        return typeMap[r.deduction_type] || r.deduction_type || '-'
      }},
      { header: 'Description', key: 'description', accessor: (r) => r.description || '-' },
      { header: 'Montant', key: 'amount', accessor: (r) => r.amount ? `${parseFloat(r.amount).toLocaleString('fr-FR')} FCFA` : '0 FCFA' },
      { header: 'Date', key: 'date', accessor: (r) => r.date || '-' }
    ]
    exportToPDF(filteredRetentions, columns, 'Liste des Retenues', 'retenues')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Fiche de Paie', key: 'payslip_id', accessor: (r) => r.payslip_detail ? `${r.payslip_detail.employee_name} - ${r.payslip_detail.month}/${r.payslip_detail.year}` : `#${r.payslip || '-'}` },
      { header: 'Type', key: 'deduction_type', accessor: (r) => {
        const typeMap = { 'LOAN': 'Prêt', 'ADVANCE': 'Avance', 'ABSENCE': 'Absence', 'LATE': 'Retard' }
        return typeMap[r.deduction_type] || r.deduction_type || '-'
      }},
      { header: 'Description', key: 'description', accessor: (r) => r.description || '-' },
      { header: 'Montant', key: 'amount', accessor: (r) => r.amount ? parseFloat(r.amount) : 0 },
      { header: 'Date', key: 'date', accessor: (r) => r.date || '-' }
    ]
    exportToExcel(filteredRetentions, columns, 'Retenues', 'retenues')
    showToast('Export Excel en cours...', 'success')
  }

  const indexOfLastRetention = currentPage * rowsPerPage
  const indexOfFirstRetention = indexOfLastRetention - rowsPerPage
  const currentRetentions = filteredRetentions.slice(indexOfFirstRetention, indexOfLastRetention)
  const totalPages = Math.ceil(filteredRetentions.length / rowsPerPage)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des retenues...</p>
      </div>
    )
  }

  return (
    <div className="retentions-tab">
      <div className="page-header">
        <h1>Retenues</h1>
        <p>Gestion des retenues (Prêt, Avance, Absence, Retard)</p>
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
            <div className="stat-label">Total Retenues</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card stat-draft">
          <div className="stat-icon"><Wallet size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Montant</div>
            <div className="stat-value">{stats.totalAmount.toFixed(2)} FCFA</div>
          </div>
        </div>
        <div className="stat-card stat-paid">
          <div className="stat-icon">💳</div>
          <div className="stat-info">
            <div className="stat-label">Prêts</div>
            <div className="stat-value">{stats.loan}</div>
          </div>
        </div>
        <div className="stat-card stat-sent">
          <div className="stat-icon"><DollarSign size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Avances</div>
            <div className="stat-value">{stats.advance}</div>
          </div>
        </div>
        <div className="stat-card stat-generated">
          <div className="stat-icon"><XCircle size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Absences</div>
            <div className="stat-value">{stats.absence}</div>
          </div>
        </div>
        <div className="stat-card stat-gross">
          <div className="stat-icon"><Clock size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Retards</div>
            <div className="stat-value">{stats.late}</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Rechercher par description, type..."
              value={searchTerm}
              onChange={handleSearch}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={filterPayslip}
              onChange={handlePayslipChange}
              className="filter-select"
            >
              <option value="">Toutes les fiches de paie</option>
              {payslips.map(payslip => (
                <option key={payslip.id} value={payslip.id}>
                  {payslip.employee_name} - {payslip.month}/{payslip.year}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterType}
              onChange={handleTypeChange}
              className="filter-select"
            >
              <option value="">Tous les types</option>
              <option value="LOAN">Prêt</option>
              <option value="ADVANCE">Avance</option>
              <option value="ABSENCE">Absence</option>
              <option value="LATE">Retard</option>
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
            <Plus size={16} /> Ajouter une Retenue
          </button>
        </div>
      </div>

      {/* Tableau */}
      {currentRetentions.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fiche de Paie</th>
                <th>Type</th>
                <th>Description</th>
                <th>Montant</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentRetentions.map(retention => (
                <tr key={retention.id}>
                  <td>{retention.payslip_detail?.employee_name || '-'} - {retention.payslip_detail?.month}/{retention.payslip_detail?.year}</td>
                  <td>
                    <span className="badge status-draft">
                      {retention.deduction_type_display || retention.deduction_type}
                    </span>
                  </td>
                  <td>{retention.description || '-'}</td>
                  <td>{parseFloat(retention.amount || 0).toFixed(2)} FCFA</td>
                  <td>{retention.created_at ? new Date(retention.created_at).toLocaleDateString('fr-FR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucune retenue trouvée</p>
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
              <h2>Nouvelle Retenue</h2>
              <button className="btn-close" onClick={() => setShowDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="dialog-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Fiche de Paie *</label>
                  <select
                    value={formData.payslip}
                    onChange={(e) => setFormData({ ...formData, payslip: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner une fiche de paie</option>
                    {payslips.map(payslip => (
                      <option key={payslip.id} value={payslip.id}>
                        {payslip.employee_name} - {payslip.month}/{payslip.year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Type de Retenue *</label>
                  <select
                    value={formData.deduction_type}
                    onChange={(e) => setFormData({ ...formData, deduction_type: e.target.value })}
                    required
                  >
                    <option value="LOAN">Prêt</option>
                    <option value="ADVANCE">Avance</option>
                    <option value="ABSENCE">Absence</option>
                    <option value="LATE">Retard</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Description *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="Description de la retenue"
                  />
                </div>
                <div className="form-group">
                  <label>Montant *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDialog(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Ajouter
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

// Types de déductions
const DEDUCTION_TYPES = ['TAX', 'SOCIAL_SECURITY', 'INSURANCE', 'RETIREMENT', 'OTHER']

// Composant Onglet Déductions
const DeductionsTab = () => {
  const [deductions, setDeductions] = useState([])
  const [filteredDeductions, setFilteredDeductions] = useState([])
  const [payslips, setPayslips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [_editingDeduction, setEditingDeduction] = useState(null)
  const [formData, setFormData] = useState({
    payslip: '',
    deduction_type: 'TAX',
    description: '',
    amount: ''
  })
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPayslip, setFilterPayslip] = useState('')
  const [filterType, setFilterType] = useState('')
  
  const allDeductions = (deductions || []).filter(d => DEDUCTION_TYPES.includes(d.deduction_type))

  const stats = {
    total: allDeductions.length,
    totalAmount: allDeductions.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0),
    tax: allDeductions.filter(d => d.deduction_type === 'TAX').length,
    social: allDeductions.filter(d => d.deduction_type === 'SOCIAL_SECURITY').length,
    insurance: allDeductions.filter(d => d.deduction_type === 'INSURANCE').length,
    retirement: allDeductions.filter(d => d.deduction_type === 'RETIREMENT').length,
    other: allDeductions.filter(d => d.deduction_type === 'OTHER').length
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchDeductions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/payslip-deductions/')
      // Filtrer uniquement les déductions (pas les retenues)
      const deductionData = response.data.filter(d => DEDUCTION_TYPES.includes(d.deduction_type))
      setDeductions(deductionData)
      setFilteredDeductions(deductionData)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération des déductions:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la récupération des déductions'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPayslips = useCallback(async () => {
    try {
      const response = await api.get('/ditech/payslips/')
      setPayslips(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des fiches de paie:', err)
    }
  }, [])

  const filterDeductions = useCallback(() => {
    let filtered = [...deductions]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(deduction =>
        deduction.description?.toLowerCase().includes(term) ||
        deduction.deduction_type_display?.toLowerCase().includes(term) ||
        deduction.payslip_detail?.employee_name?.toLowerCase().includes(term)
      )
    }

    if (filterPayslip) {
      filtered = filtered.filter(deduction => deduction.payslip === parseInt(filterPayslip))
    }

    if (filterType) {
      filtered = filtered.filter(deduction => deduction.deduction_type === filterType)
    }

    setFilteredDeductions(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterPayslip, filterType, deductions])

  useEffect(() => {
    fetchDeductions()
    fetchPayslips()
  }, [fetchDeductions, fetchPayslips])

  useEffect(() => {
    if (!loading) {
      filterDeductions()
    }
  }, [filterDeductions, loading])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handlePayslipChange = (e) => {
    setFilterPayslip(e.target.value)
  }

  const handleTypeChange = (e) => {
    setFilterType(e.target.value)
  }

  const openAddDialog = () => {
    setEditingDeduction(null)
    setFormData({
      payslip: '',
      deduction_type: 'TAX',
      description: '',
      amount: ''
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataToSend = {
        ...formData,
        payslip: parseInt(formData.payslip),
        amount: parseFloat(formData.amount)
      }

      await api.post('/ditech/payslip-deductions/', dataToSend)
      showToast('Déduction ajoutée avec succès', 'success')
      setShowDialog(false)
      fetchDeductions()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Erreur lors de la sauvegarde de la déduction'
      showToast(errorMessage, 'error')
    }
  }

  const _handleDeleteDeduction = async (deduction) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette déduction ?`)) {
      try {
        await api.delete(`/ditech/payslip-deductions/${deduction.id}/`)
        showToast('Déduction supprimée avec succès', 'success')
        fetchDeductions()
      } catch (err) {
        console.error('Erreur lors de la suppression:', err)
        const errorMessage = err.response?.data?.detail || 
                            err.response?.data?.message || 
                            'Erreur lors de la suppression'
        showToast(errorMessage, 'error')
      }
    }
  }

  const handleExportPDF = () => {
    const columns = [
      { header: 'Fiche de Paie', key: 'payslip_id', accessor: (d) => d.payslip_detail ? `${d.payslip_detail.employee_name} - ${d.payslip_detail.month}/${d.payslip_detail.year}` : `#${d.payslip || '-'}` },
      { header: 'Type', key: 'deduction_type', accessor: (d) => {
        const typeMap = { 'TAX': 'Impôt', 'SOCIAL': 'Sécurité sociale', 'INSURANCE': 'Assurance', 'RETIREMENT': 'Retraite', 'OTHER': 'Autre' }
        return typeMap[d.deduction_type] || d.deduction_type || '-'
      }},
      { header: 'Description', key: 'description', accessor: (d) => d.description || '-' },
      { header: 'Montant', key: 'amount', accessor: (d) => d.amount ? `${parseFloat(d.amount).toLocaleString('fr-FR')} FCFA` : '0 FCFA' }
    ]
    exportToPDF(filteredDeductions, columns, 'Liste des Déductions', 'deductions')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Fiche de Paie', key: 'payslip_id', accessor: (d) => d.payslip_detail ? `${d.payslip_detail.employee_name} - ${d.payslip_detail.month}/${d.payslip_detail.year}` : `#${d.payslip || '-'}` },
      { header: 'Type', key: 'deduction_type', accessor: (d) => {
        const typeMap = { 'TAX': 'Impôt', 'SOCIAL': 'Sécurité sociale', 'INSURANCE': 'Assurance', 'RETIREMENT': 'Retraite', 'OTHER': 'Autre' }
        return typeMap[d.deduction_type] || d.deduction_type || '-'
      }},
      { header: 'Description', key: 'description', accessor: (d) => d.description || '-' },
      { header: 'Montant', key: 'amount', accessor: (d) => d.amount ? parseFloat(d.amount) : 0 }
    ]
    exportToExcel(filteredDeductions, columns, 'Déductions', 'deductions')
    showToast('Export Excel en cours...', 'success')
  }

  const indexOfLastDeduction = currentPage * rowsPerPage
  const indexOfFirstDeduction = indexOfLastDeduction - rowsPerPage
  const currentDeductions = filteredDeductions.slice(indexOfFirstDeduction, indexOfLastDeduction)
  const totalPages = Math.ceil(filteredDeductions.length / rowsPerPage)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des déductions...</p>
      </div>
    )
  }

  return (
    <div className="deductions-tab">
      <div className="page-header">
        <h1>Déductions</h1>
        <p>Gestion des déductions (Impôt, Sécurité sociale, Assurance, Retraite, Autre)</p>
      </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon"><Minus size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Déductions</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card stat-draft">
          <div className="stat-icon"><Wallet size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Montant</div>
            <div className="stat-value">{stats.totalAmount.toFixed(2)} FCFA</div>
          </div>
        </div>
        <div className="stat-card stat-paid">
          <div className="stat-icon"><BarChart3 size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Impôts</div>
            <div className="stat-value">{stats.tax}</div>
          </div>
        </div>
        <div className="stat-card stat-sent">
          <div className="stat-icon">🛡️</div>
          <div className="stat-info">
            <div className="stat-label">Sécurité Sociale</div>
            <div className="stat-value">{stats.social}</div>
          </div>
        </div>
        <div className="stat-card stat-generated">
          <div className="stat-icon">🏥</div>
          <div className="stat-info">
            <div className="stat-label">Assurance</div>
            <div className="stat-value">{stats.insurance}</div>
          </div>
        </div>
        <div className="stat-card stat-gross">
          <div className="stat-icon">🏦</div>
          <div className="stat-info">
            <div className="stat-label">Retraite</div>
            <div className="stat-value">{stats.retirement}</div>
          </div>
        </div>
        <div className="stat-card stat-net">
          <div className="stat-icon"><ClipboardList size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Autres</div>
            <div className="stat-value">{stats.other}</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Rechercher par description, type..."
              value={searchTerm}
              onChange={handleSearch}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={filterPayslip}
              onChange={handlePayslipChange}
              className="filter-select"
            >
              <option value="">Toutes les fiches de paie</option>
              {payslips.map(payslip => (
                <option key={payslip.id} value={payslip.id}>
                  {payslip.employee_name} - {payslip.month}/{payslip.year}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select
              value={filterType}
              onChange={handleTypeChange}
              className="filter-select"
            >
              <option value="">Tous les types</option>
              <option value="TAX">Impôt</option>
              <option value="SOCIAL_SECURITY">Sécurité sociale</option>
              <option value="INSURANCE">Assurance</option>
              <option value="RETIREMENT">Retraite</option>
              <option value="OTHER">Autre</option>
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
            <Plus size={16} /> Ajouter une Déduction
          </button>
        </div>
      </div>

      {/* Tableau */}
      {currentDeductions.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fiche de Paie</th>
                <th>Type</th>
                <th>Description</th>
                <th>Montant</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentDeductions.map(deduction => (
                <tr key={deduction.id}>
                  <td>{deduction.payslip_detail?.employee_name || '-'} - {deduction.payslip_detail?.month}/{deduction.payslip_detail?.year}</td>
                  <td>
                    <span className="badge status-draft">
                      {deduction.deduction_type_display || deduction.deduction_type}
                    </span>
                  </td>
                  <td>{deduction.description || '-'}</td>
                  <td>{parseFloat(deduction.amount || 0).toFixed(2)} FCFA</td>
                  <td>{deduction.created_at ? new Date(deduction.created_at).toLocaleDateString('fr-FR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucune déduction trouvée</p>
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
              <h2>Nouvelle Déduction</h2>
              <button className="btn-close" onClick={() => setShowDialog(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="dialog-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Fiche de Paie *</label>
                  <select
                    value={formData.payslip}
                    onChange={(e) => setFormData({ ...formData, payslip: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner une fiche de paie</option>
                    {payslips.map(payslip => (
                      <option key={payslip.id} value={payslip.id}>
                        {payslip.employee_name} - {payslip.month}/{payslip.year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Type de Déduction *</label>
                  <select
                    value={formData.deduction_type}
                    onChange={(e) => setFormData({ ...formData, deduction_type: e.target.value })}
                    required
                  >
                    <option value="TAX">Impôt</option>
                    <option value="SOCIAL_SECURITY">Sécurité sociale</option>
                    <option value="INSURANCE">Assurance</option>
                    <option value="RETIREMENT">Retraite</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Description *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="Description de la déduction"
                  />
                </div>
                <div className="form-group">
                  <label>Montant *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowDialog(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Ajouter
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

// Composant Onglet Historique des Paiements
const PaymentHistoryTab = () => {
  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [payslips, setPayslips] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPayslip, setFilterPayslip] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterMethod, setFilterMethod] = useState('')

  // Calculer les statistiques à partir de filteredPayments pour inclure les fiches de paie payées
  const stats = useMemo(() => {
    const allPayments = filteredPayments.length > 0 ? filteredPayments : payments
    
    return {
      total: (allPayments || []).length,
      totalAmount: (allPayments || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
      thisMonth: (allPayments || []).filter(p => {
        if (!p.payment_date) return false
        const paymentDate = new Date(p.payment_date)
        if (isNaN(paymentDate.getTime())) return false
        const now = new Date()
        return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
      }).length,
      thisMonthAmount: (allPayments || []).filter(p => {
        if (!p.payment_date) return false
        const paymentDate = new Date(p.payment_date)
        if (isNaN(paymentDate.getTime())) return false
        const now = new Date()
        return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
      }).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
    }
  }, [filteredPayments, payments])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/payment-history/')
      
      // Log pour déboguer
      if (import.meta.env.MODE === 'development') {
        console.log('Payment history response:', response.data)
        console.log('Number of payments:', response.data?.length || 0)
      }
      
      setPayments(response.data || [])
      setFilteredPayments(response.data || [])
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique:', err)
      console.error('Error details:', err.response?.data)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la récupération de l\'historique'
      setError(errorMessage)
      // En cas d'erreur, initialiser avec un tableau vide
      setPayments([])
      setFilteredPayments([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPayslips = useCallback(async () => {
    try {
      const response = await api.get('/ditech/payslips/')
      setPayslips(response.data)
    } catch (err) {
      console.error('Erreur lors de la récupération des fiches de paie:', err)
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

  const filterPayments = useCallback(() => {
    let filtered = [...payments]
    
    // Si aucun paiement n'est trouvé mais qu'il y a des fiches de paie payées,
    // utiliser les fiches de paie payées comme source de données
    if (filtered.length === 0 && payslips && payslips.length > 0) {
      const paidPayslips = payslips.filter(p => p.status === 'PAID' && p.payment_date)
      // Convertir les fiches de paie payées en format paiement
      filtered = paidPayslips.map(payslip => ({
        id: payslip.id,
        payslip: payslip.id,
        payslip_detail: {
          employee_name: payslip.employee_name,
          month: payslip.month,
          year: payslip.year,
          employee: payslip.employee
        },
        payment_date: payslip.payment_date,
        amount: payslip.net_salary || payslip.gross_salary || 0,
        payment_method: payslip.payment_method || 'N/A',
        reference: `PAY-${payslip.id}`,
        notes: payslip.notes || '',
        created_by_name: payslip.created_by_name || ''
      }))
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(payment =>
        payment.payslip_detail?.employee_name?.toLowerCase().includes(term) ||
        payment.payment_method?.toLowerCase().includes(term) ||
        payment.reference?.toLowerCase().includes(term) ||
        payment.notes?.toLowerCase().includes(term)
      )
    }

    if (filterPayslip) {
      filtered = filtered.filter(payment => payment.payslip === parseInt(filterPayslip))
    }

    if (filterEmployee) {
      filtered = filtered.filter(payment => {
        const payslipEmployeeId = payment.payslip_detail?.employee || payment.payslip_detail?.employee_detail?.id
        return payslipEmployeeId === parseInt(filterEmployee)
      })
    }

    if (filterDate) {
      filtered = filtered.filter(payment => {
        const paymentDate = payment.payment_date?.split('T')[0] || payment.payment_date
        return paymentDate === filterDate
      })
    }

    if (filterMethod) {
      filtered = filtered.filter(payment => payment.payment_method?.toLowerCase().includes(filterMethod.toLowerCase()))
    }

    setFilteredPayments(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterPayslip, filterEmployee, filterDate, filterMethod, payments, payslips])

  useEffect(() => {
    fetchPayments()
    fetchPayslips()
    fetchEmployees()
  }, [fetchPayments, fetchPayslips, fetchEmployees])

  useEffect(() => {
    if (!loading) {
      filterPayments()
    }
  }, [filterPayments, loading])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handlePayslipChange = (e) => {
    setFilterPayslip(e.target.value)
  }

  const handleEmployeeChange = (e) => {
    setFilterEmployee(e.target.value)
  }

  const handleDateChange = (e) => {
    setFilterDate(e.target.value)
  }

  const handleMethodChange = (e) => {
    setFilterMethod(e.target.value)
  }


  const handleExportPDF = () => {
    const columns = [
      { header: 'Fiche de Paie', key: 'payslip_id', accessor: (p) => p.payslip_detail ? `${p.payslip_detail.employee_name} - ${p.payslip_detail.month}/${p.payslip_detail.year}` : `#${p.payslip || '-'}` },
      { header: 'Employé', key: 'employee_name', accessor: (p) => p.payslip_detail?.employee_name || p.employee_name || '-' },
      { header: 'Date de paiement', key: 'payment_date', accessor: (p) => p.payment_date || '-' },
      { header: 'Montant', key: 'amount', accessor: (p) => p.amount ? `${parseFloat(p.amount).toLocaleString('fr-FR')} FCFA` : '0 FCFA' },
      { header: 'Méthode de paiement', key: 'payment_method', accessor: (p) => p.payment_method || '-' },
      { header: 'Référence', key: 'reference', accessor: (p) => p.reference || '-' },
      { header: 'Notes', key: 'notes', accessor: (p) => p.notes || '-' }
    ]
    exportToPDF(filteredPayments, columns, 'Liste de l\'Historique des Paiements', 'historique_paiements')
    showToast('Export PDF en cours...', 'success')
  }

  const handleExportExcel = () => {
    const columns = [
      { header: 'Fiche de Paie', key: 'payslip_id', accessor: (p) => p.payslip_detail ? `${p.payslip_detail.employee_name} - ${p.payslip_detail.month}/${p.payslip_detail.year}` : `#${p.payslip || '-'}` },
      { header: 'Employé', key: 'employee_name', accessor: (p) => p.payslip_detail?.employee_name || p.employee_name || '-' },
      { header: 'Date de paiement', key: 'payment_date', accessor: (p) => p.payment_date || '-' },
      { header: 'Montant', key: 'amount', accessor: (p) => p.amount ? parseFloat(p.amount) : 0 },
      { header: 'Méthode de paiement', key: 'payment_method', accessor: (p) => p.payment_method || '-' },
      { header: 'Référence', key: 'reference', accessor: (p) => p.reference || '-' },
      { header: 'Notes', key: 'notes', accessor: (p) => p.notes || '-' }
    ]
    exportToExcel(filteredPayments, columns, 'Historique des Paiements', 'historique_paiements')
    showToast('Export Excel en cours...', 'success')
  }

  const indexOfLastPayment = currentPage * rowsPerPage
  const indexOfFirstPayment = indexOfLastPayment - rowsPerPage
  const currentPayments = filteredPayments.slice(indexOfFirstPayment, indexOfLastPayment)
  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement de l'historique des paiements...</p>
      </div>
    )
  }

  return (
    <div className="payment-history-tab">
      <div className="page-header">
        <h1>Historique des paiements</h1>
        <p>Historique des paiements effectués</p>
      </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon"><History size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Paiements</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card stat-gross">
          <div className="stat-icon"><Wallet size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Payé</div>
            <div className="stat-value">{stats.totalAmount.toFixed(2)} FCFA</div>
          </div>
        </div>
        <div className="stat-card stat-paid">
          <div className="stat-icon"><Calendar size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Ce Mois</div>
            <div className="stat-value">{stats.thisMonth}</div>
          </div>
        </div>
        <div className="stat-card stat-net">
          <div className="stat-icon"><DollarSign size={32} /></div>
          <div className="stat-info">
            <div className="stat-label">Montant Ce Mois</div>
            <div className="stat-value">{stats.thisMonthAmount.toFixed(2)} FCFA</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Rechercher par employé, méthode, référence..."
              value={searchTerm}
              onChange={handleSearch}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={filterEmployee}
              onChange={handleEmployeeChange}
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
              value={filterPayslip}
              onChange={handlePayslipChange}
              className="filter-select"
            >
              <option value="">Toutes les fiches de paie</option>
              {payslips.map(payslip => (
                <option key={payslip.id} value={payslip.id}>
                  {payslip.employee_name} - {payslip.month}/{payslip.year}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <input
              type="date"
              value={filterDate}
              onChange={handleDateChange}
              className="filter-input"
              placeholder="Date de paiement"
            />
          </div>
          <div className="filter-group">
            <input
              type="text"
              value={filterMethod}
              onChange={handleMethodChange}
              className="filter-input"
              placeholder="Méthode de paiement"
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
        </div>
      </div>

      {/* Tableau */}
      {currentPayments.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fiche de Paie</th>
                <th>Employé</th>
                <th>Date Paiement</th>
                <th>Montant</th>
                <th>Méthode</th>
                <th>Référence</th>
                <th>Créé par</th>
              </tr>
            </thead>
            <tbody>
              {currentPayments.map(payment => (
                <tr key={payment.id}>
                  <td>{payment.payslip_detail?.month}/{payment.payslip_detail?.year}</td>
                  <td>{payment.payslip_detail?.employee_name || '-'}</td>
                  <td>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>{parseFloat(payment.amount || 0).toFixed(2)} FCFA</td>
                  <td>{payment.payment_method || '-'}</td>
                  <td>{payment.reference || '-'}</td>
                  <td>{payment.created_by_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>Aucun paiement trouvé</p>
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

export default Payroll
