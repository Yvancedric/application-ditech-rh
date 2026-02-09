import React, { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { exportToPDF, exportToExcel } from '../utils/exportUtils'
import { 
  FileText, FileSpreadsheet, Download, User, Calendar, DollarSign, 
  ChevronRight, Wallet, CheckCircle2, XCircle, Clock
} from 'lucide-react'
import './EmployeePayslips.css'

const EmployeePayslips = () => {
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [payslips, setPayslips] = useState([])
  const [filteredPayslips, setFilteredPayslips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Récupérer la liste des employés
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/ditech/employees/')
      setEmployees(response.data)
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération des employés:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Erreur lors de la récupération des employés'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Récupérer les bulletins de paie d'un employé
  const fetchEmployeePayslips = useCallback(async (employeeId) => {
    try {
      setLoading(true)
      const response = await api.get(`/ditech/payslips/employee_history/?employee=${employeeId}`)
      setPayslips(response.data.payslips || [])
      setFilteredPayslips(response.data.payslips || [])
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la récupération des bulletins:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          'Erreur lors de la récupération des bulletins'
      setError(errorMessage)
      setPayslips([])
      setFilteredPayslips([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  // Filtrer les bulletins
  useEffect(() => {
    let filtered = [...payslips]

    if (filterYear) {
      filtered = filtered.filter(p => p.year === parseInt(filterYear))
    }

    if (filterMonth) {
      filtered = filtered.filter(p => p.month === parseInt(filterMonth))
    }

    setFilteredPayslips(filtered)
  }, [filterYear, filterMonth, payslips])

  // Sélectionner un employé
  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee)
    fetchEmployeePayslips(employee.id)
    setFilterYear('')
    setFilterMonth('')
  }

  // Télécharger un bulletin en PDF
  const handleDownloadPDF = async (payslip) => {
    try {
      // D'abord générer le PDF s'il n'existe pas
      if (payslip.status !== 'GENERATED' && !payslip.pdf_file) {
        await api.post(`/ditech/payslips/${payslip.id}/generate_pdf/`)
        showToast('PDF généré avec succès', 'success')
        // Rafraîchir les données
        await fetchEmployeePayslips(selectedEmployee.id)
      }

      // Télécharger le PDF
      const response = await api.get(`/ditech/payslips/${payslip.id}/download_pdf/`, {
        responseType: 'blob'
      })

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
      const monthName = monthNames[payslip.month - 1] || `Mois${payslip.month}`
      link.setAttribute('download', `Bulletin_${selectedEmployee.first_name}_${selectedEmployee.last_name}_${monthName}_${payslip.year}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      showToast('Téléchargement du PDF réussi', 'success')
    } catch (err) {
      console.error('Erreur lors du téléchargement du PDF:', err)
      showToast('Erreur lors du téléchargement du PDF', 'error')
    }
  }

  // Exporter tous les bulletins d'un employé en Excel
  const handleExportExcel = () => {
    if (!selectedEmployee) {
      showToast('Veuillez sélectionner un employé', 'error')
      return
    }
    if (filteredPayslips.length === 0) {
      showToast('Aucun bulletin à exporter', 'error')
      return
    }

    const columns = [
      { header: 'Période', key: 'period', accessor: (p) => `${p.month}/${p.year}` },
      { header: 'Salaire de base', key: 'base_salary', accessor: (p) => parseFloat(p.base_salary || 0) },
      { header: 'Primes', key: 'bonuses', accessor: (p) => parseFloat(p.bonuses || 0) },
      { header: 'Heures supplémentaires', key: 'overtime_pay', accessor: (p) => parseFloat(p.overtime_pay || 0) },
      { header: 'Déductions', key: 'deductions', accessor: (p) => parseFloat(p.deductions || 0) },
      { header: 'Salaire brut', key: 'gross_salary', accessor: (p) => parseFloat(p.gross_salary || 0) },
      { header: 'Salaire net', key: 'net_salary', accessor: (p) => parseFloat(p.net_salary || 0) },
      { header: 'Statut', key: 'status', accessor: (p) => {
        const statusMap = { 'DRAFT': 'Brouillon', 'GENERATED': 'Généré', 'SENT': 'Envoyé', 'PAID': 'Payé' }
        return statusMap[p.status] || p.status || '-'
      }},
      { header: 'Date de paiement', key: 'payment_date', accessor: (p) => p.payment_date || '-' }
    ]

    exportToExcel(
      filteredPayslips, 
      columns, 
      `Bulletins_${selectedEmployee.first_name}_${selectedEmployee.last_name}`,
      `bulletins_${selectedEmployee.first_name}_${selectedEmployee.last_name}`
    )
    showToast('Export Excel en cours...', 'success')
  }

  // Exporter tous les bulletins d'un employé en PDF
  const handleExportAllPDF = () => {
    if (!selectedEmployee) {
      showToast('Veuillez sélectionner un employé', 'error')
      return
    }
    if (filteredPayslips.length === 0) {
      showToast('Aucun bulletin à exporter', 'error')
      return
    }

    const columns = [
      { header: 'Période', key: 'period', accessor: (p) => `${p.month}/${p.year}` },
      { header: 'Salaire de base', key: 'base_salary', accessor: (p) => `${parseFloat(p.base_salary || 0).toLocaleString('fr-FR')} FCFA` },
      { header: 'Primes', key: 'bonuses', accessor: (p) => `${parseFloat(p.bonuses || 0).toLocaleString('fr-FR')} FCFA` },
      { header: 'Heures supplémentaires', key: 'overtime_pay', accessor: (p) => `${parseFloat(p.overtime_pay || 0).toLocaleString('fr-FR')} FCFA` },
      { header: 'Déductions', key: 'deductions', accessor: (p) => `${parseFloat(p.deductions || 0).toLocaleString('fr-FR')} FCFA` },
      { header: 'Salaire brut', key: 'gross_salary', accessor: (p) => `${parseFloat(p.gross_salary || 0).toLocaleString('fr-FR')} FCFA` },
      { header: 'Salaire net', key: 'net_salary', accessor: (p) => `${parseFloat(p.net_salary || 0).toLocaleString('fr-FR')} FCFA` },
      { header: 'Statut', key: 'status', accessor: (p) => {
        const statusMap = { 'DRAFT': 'Brouillon', 'GENERATED': 'Généré', 'SENT': 'Envoyé', 'PAID': 'Payé' }
        return statusMap[p.status] || p.status || '-'
      }},
      { header: 'Date de paiement', key: 'payment_date', accessor: (p) => p.payment_date || '-' }
    ]

    exportToPDF(
      filteredPayslips,
      columns,
      `Bulletins de Paie - ${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
      `bulletins_${selectedEmployee.first_name}_${selectedEmployee.last_name}`
    )
    showToast('Export PDF en cours...', 'success')
  }

  // Filtrer les employés par recherche
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase()
    const employeeId = (emp.employee_id || '').toLowerCase()
    const search = searchTerm.toLowerCase()
    return fullName.includes(search) || employeeId.includes(search)
  })

  // Obtenir les années disponibles
  const availableYears = [...new Set(payslips.map(p => p.year))].sort((a, b) => b - a)

  if (loading && !selectedEmployee) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des employés...</p>
      </div>
    )
  }

  return (
    <div className="employee-payslips-page">
      <div className="page-header">
        <h1>Bulletins de Salaire des Employé</h1>
        <p>Gerez les bulletins de salaire</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="payslips-layout">
        {/* Liste des employés */}
        <div className="employees-sidebar">
          <div className="sidebar-header">
            <h2>Employés</h2>
          </div>

          <div className="employees-list">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(employee => (
                <div
                  key={employee.id}
                  className={`employee-item ${selectedEmployee?.id === employee.id ? 'active' : ''}`}
                  onClick={() => handleSelectEmployee(employee)}
                >
                  <div className="employee-avatar">
                    <User size={24} />
                  </div>
                  <div className="employee-info">
                    <div className="employee-name">
                      {employee.first_name} {employee.last_name}
                    </div>
                    <div className="employee-id">{employee.employee_id}</div>
                  </div>
                  <ChevronRight size={20} className="chevron-icon" />
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>Aucun employé trouvé</p>
              </div>
            )}
          </div>
        </div>

        {/* Zone de contenu - Bulletins */}
        <div className="payslips-content">
          <div className="search-container">
            <input
              type="text"
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          {selectedEmployee ? (
            <>
              <div className="content-header">
                <div className="employee-header-info">
                  <div className="employee-avatar-large">
                    <User size={32} />
                  </div>
                  <div>
                    <h2>{selectedEmployee.first_name} {selectedEmployee.last_name}</h2>
                    <p className="employee-id-large">{selectedEmployee.employee_id}</p>
                  </div>
                </div>
                <div className="content-actions">
                  <button 
                    className="btn-export btn-export-pdf" 
                    onClick={handleExportAllPDF}
                    title="Exporter tous les bulletins en PDF"
                  >
                    <FileText size={16} /> PDF
                  </button>
                  <button 
                    className="btn-export btn-export-excel" 
                    onClick={handleExportExcel}
                    title="Exporter tous les bulletins en Excel"
                  >
                    <FileSpreadsheet size={16} /> Excel
                  </button>
                </div>
              </div>

              {/* Filtres */}
              <div className="filters-section">
                <div className="filter-group">
                  <label>Année</label>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Toutes les années</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Mois</label>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
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
              </div>

              {/* Liste des bulletins */}
              {loading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Chargement des bulletins...</p>
                </div>
              ) : filteredPayslips.length > 0 ? (
                <div className="payslips-grid">
                  {filteredPayslips.map(payslip => (
                    <div key={payslip.id} className="payslip-card">
                      <div className="payslip-header">
                        <div className="payslip-period">
                          <Calendar size={18} />
                          <span>{payslip.month}/{payslip.year}</span>
                        </div>
                        <span className={`badge status-${payslip.status.toLowerCase()}`}>
                          {payslip.status === 'DRAFT' && 'Brouillon'}
                          {payslip.status === 'GENERATED' && 'Généré'}
                          {payslip.status === 'SENT' && 'Envoyé'}
                          {payslip.status === 'PAID' && 'Payé'}
                        </span>
                      </div>
                      <div className="payslip-body">
                        <div className="payslip-amount">
                          <div className="amount-label">Salaire net</div>
                          <div className="amount-value">
                            {parseFloat(payslip.net_salary || 0).toLocaleString('fr-FR')} FCFA
                          </div>
                        </div>
                        <div className="payslip-details">
                          <div className="detail-item">
                            <span className="detail-label">Salaire brut:</span>
                            <span className="detail-value">
                              {parseFloat(payslip.gross_salary || 0).toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Primes:</span>
                            <span className="detail-value">
                              {parseFloat(payslip.bonuses || 0).toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Déductions:</span>
                            <span className="detail-value">
                              {parseFloat(payslip.deductions || 0).toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="payslip-footer">
                        <button
                          className="btn-download"
                          onClick={() => handleDownloadPDF(payslip)}
                          title="Télécharger le bulletin en PDF"
                        >
                          <Download size={16} />
                          Télécharger PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Wallet size={48} />
                  <p>Aucun bulletin de paie trouvé pour cet employé</p>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state-large">
              <User size={64} />
              <h3>Sélectionnez un employé</h3>
              <p>Choisissez un employé dans la liste pour voir ses bulletins de paie</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default EmployeePayslips
