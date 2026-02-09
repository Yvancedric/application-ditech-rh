import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { Users, RefreshCw, Calendar, Wallet, CheckCircle2, AlertTriangle, Building2, TrendingUp, Bell, X, Scan } from 'lucide-react'
import './DashboardHome.css'

const DashboardHome = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAlertsModal, setShowAlertsModal] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get('/ditech/dashboard/stats/')
      
      if (response.data) {
        setStats(response.data)
      } else {
        setError('Aucune donnée reçue du serveur')
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err)
      
      // Messages d'erreur plus détaillés
      let errorMessage = 'Erreur lors de la récupération des statistiques du tableau de bord'
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'La requête a pris trop de temps (timeout après 20 secondes). Le serveur ne répond pas ou met trop de temps à traiter la requête. Vérifiez que le backend est démarré et accessible.'
      } else if (err.response) {
        // Le serveur a répondu avec un code d'erreur
        if (err.response.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.'
        } else if (err.response.status === 403) {
          errorMessage = 'Vous n\'avez pas les permissions nécessaires.'
        } else if (err.response.status === 404) {
          errorMessage = 'L\'endpoint des statistiques n\'a pas été trouvé.'
        } else if (err.response.status >= 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.'
        } else {
          errorMessage = err.response.data?.detail || err.response.data?.message || errorMessage
        }
      } else if (err.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        errorMessage = 'Le serveur ne répond pas. Vérifiez que le backend est démarré sur http://localhost:8000'
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        errorMessage = `Erreur de configuration: ${err.message}`
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    
    // Écouter les événements de mise à jour des contrats
    const handleContractsUpdated = () => {
      fetchStats()
    }
    
    window.addEventListener('contractsUpdated', handleContractsUpdated)
    
    return () => {
      window.removeEventListener('contractsUpdated', handleContractsUpdated)
    }
  }, [fetchStats])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0) + ' FCFA'
  }

  const formatNumber = (number) => {
    return new Intl.NumberFormat('fr-FR').format(number || 0)
  }

  const handleScanDocument = () => {
    // Rediriger vers la page dédiée à la numérisation de documents
    navigate('/dashboard/document-scanner')
  }

  if (loading) {
    return (
      <div className="dashboard-home">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement des statistiques du tableau de bord...</p>
          <button 
            className="btn-cancel-loading"
            onClick={() => {
              setLoading(false)
              setError('Chargement annulé par l\'utilisateur')
            }}
            title="Annuler le chargement"
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-home">
        <div className="error-container">
          <div className="error-message">
            <AlertTriangle size={24} />
            <div>
              <h3>Erreur de chargement</h3>
              <p>{error}</p>
            </div>
          </div>
          <button 
            className="btn-retry"
            onClick={fetchStats}
            title="Réessayer"
          >
            <RefreshCw size={18} />
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="dashboard-home">
        <div className="empty-state">
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-home">
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-text">
            <h1>Tableaux de bord RH</h1>
            <p>Vue d'ensemble des indicateurs clés de performance</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-refresh"
              onClick={fetchStats}
              title="Actualiser les données"
            >
              <RefreshCw size={20} />
              Actualiser
            </button>
            <button 
              className="scan-document-btn"
              onClick={handleScanDocument}
              title="Numériser un document"
            >
              <Scan size={20} />
              <span>Numériser un document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="stats-grid-main">
        {/* 1. Effectif total */}
        <div className="stat-card-main stat-primary">
          <div className="stat-icon-main"><Users size={40} /></div>
          <div className="stat-info-main">
            <div className="stat-label-main">Effectif Total</div>
            <div className="stat-value-main">{formatNumber(stats.effectif_total || stats.total_staff || 0)}</div>
            <div className="stat-description">Employés actifs</div>
          </div>
        </div>

        {/* 2. Renouvellement - couleur distincte des Congés en cours */}
        <div className="stat-card-main stat-renewal">
          <div className="stat-icon-main"><RefreshCw size={40} /></div>
          <div className="stat-info-main">
            <div className="stat-label-main">Renouvellement</div>
            <div className="stat-value-main">{formatNumber(stats.alertes_contrats_expirants?.total || stats.contract_alerts_count || 0)}</div>
            <div className="stat-description">
              Contrats à renouveler (sans auto-renouvellement)
            </div>
          </div>
        </div>

        {/* 3. Absences/Congés */}
        <div className="stat-card-main stat-warning">
          <div className="stat-icon-main"><Calendar size={40} /></div>
          <div className="stat-info-main">
            <div className="stat-label-main">Absences/Congés</div>
            <div className="stat-value-main">{formatNumber(stats.absences_conges?.total || stats.absences_leaves || 0)}</div>
            <div className="stat-description">
              {stats.nombre_conges_en_cours || stats.current_leaves || 0} en cours
            </div>
          </div>
        </div>

        {/* 4. Masse Salariale Mensuelle */}
        <div className="stat-card-main stat-success">
          <div className="stat-icon-main"><Wallet size={40} /></div>
          <div className="stat-info-main">
            <div className="stat-label-main">Masse Salariale Mensuelle</div>
            <div className="stat-value-main-small">{formatCurrency(stats.masse_salariale_mensuelle || stats.monthly_payroll || 0)}</div>
            <div className="stat-description">Salaire moyen: {formatCurrency(stats.salaire_moyen || stats.avg_salary || 0)}</div>
          </div>
        </div>

        {/* 5. Taux de présence */}
        <div className="stat-card-main stat-info">
          <div className="stat-icon-main"><CheckCircle2 size={40} /></div>
          <div className="stat-info-main">
            <div className="stat-label-main">Taux de Présence</div>
            <div className="stat-value-main">{stats.taux_presence || stats.presence_rate || 0}%</div>
            <div className="stat-description">
              {stats.presence_details?.present || 0} présents aujourd'hui
            </div>
          </div>
        </div>

        {/* 6. Nombre de congés en cours */}
        <div className="stat-card-main stat-purple">
          <div className="stat-icon-main"><Calendar size={40} /></div>
          <div className="stat-info-main">
            <div className="stat-label-main">Congés en Cours</div>
            <div className="stat-value-main">{formatNumber(stats.nombre_conges_en_cours || stats.current_leaves || 0)}</div>
            <div className="stat-description">
              {stats.absences_conges?.conges_en_attente || stats.pending_leaves || 0} en attente
            </div>
          </div>
        </div>

        {/* 7. Alertes contrats expirants */}
        <div className="stat-card-main stat-danger">
          <div className="stat-icon-main"><AlertTriangle size={40} /></div>
          <div className="stat-info-main">
            <div className="stat-label-main">Alertes Contrats Expirants</div>
            <div className="stat-value-main">{formatNumber(stats.alertes_contrats_expirants?.total || stats.contract_alerts_count || 0)}</div>
            <div className="stat-description">
              {stats.alertes_contrats_expirants?.critiques || 0} critiques
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques et statistiques */}
      <div className="charts-section">
        <h2 className="section-title">Graphiques et Statistiques</h2>

        <div className="charts-grid">
          {/* Graphique Masse Salariale Mensuelle */}
          <div className="chart-card">
            <h3 className="chart-title">Masse Salariale Mensuelle (12 derniers mois)</h3>
            <div className="chart-container">
              {stats.graphiques_statistiques?.masse_salariale_mensuelle_historique?.length > 0 ? (
                <BarChart
                  data={stats.graphiques_statistiques.masse_salariale_mensuelle_historique}
                  labels={stats.graphiques_statistiques.labels_mois || stats.months_labels || []}
                  color="#3b82f6"
                />
              ) : stats.monthly_payroll_history?.length > 0 ? (
                <BarChart
                  data={stats.monthly_payroll_history}
                  labels={stats.months_labels || []}
                  color="#3b82f6"
                />
              ) : (
                <div className="empty-chart">Aucune donnée disponible</div>
              )}
            </div>
          </div>

          {/* Graphique Taux de Présence */}
          <div className="chart-card">
            <h3 className="chart-title">Taux de Présence (12 derniers mois)</h3>
            <div className="chart-container">
              {stats.graphiques_statistiques?.taux_presence_historique?.length > 0 ? (
                <LineChart
                  data={stats.graphiques_statistiques.taux_presence_historique}
                  labels={stats.graphiques_statistiques.labels_mois || stats.months_labels || []}
                  color="#10b981"
                />
              ) : stats.presence_rate_history?.length > 0 ? (
                <LineChart
                  data={stats.presence_rate_history}
                  labels={stats.months_labels || []}
                  color="#10b981"
                />
              ) : (
                <div className="empty-chart">Aucune donnée disponible</div>
              )}
            </div>
          </div>

          {/* Graphique Effectif Total */}
          <div className="chart-card">
            <h3 className="chart-title">Effectif Total (12 derniers mois)</h3>
            <div className="chart-container">
              {stats.graphiques_statistiques?.effectif_historique?.length > 0 ? (
                <LineChart
                  data={stats.graphiques_statistiques.effectif_historique}
                  labels={stats.graphiques_statistiques.labels_mois || stats.months_labels || []}
                  color="#8b5cf6"
                />
              ) : stats.staff_count_history?.length > 0 ? (
                <LineChart
                  data={stats.staff_count_history}
                  labels={stats.months_labels || []}
                  color="#8b5cf6"
                />
              ) : (
                <div className="empty-chart">Aucune donnée disponible</div>
              )}
            </div>
          </div>

          {/* Graphique Nombre de Congés */}
          <div className="chart-card">
            <h3 className="chart-title">Nombre de Congés (12 derniers mois)</h3>
            <div className="chart-container">
              {stats.graphiques_statistiques?.conges_historique?.length > 0 ? (
                <BarChart
                  data={stats.graphiques_statistiques.conges_historique}
                  labels={stats.graphiques_statistiques.labels_mois || stats.months_labels || []}
                  color="#f59e0b"
                />
              ) : stats.leaves_count_history?.length > 0 ? (
                <BarChart
                  data={stats.leaves_count_history}
                  labels={stats.months_labels || []}
                  color="#f59e0b"
                />
              ) : (
                <div className="empty-chart">Aucune donnée disponible</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Détails des alertes contrats expirants */}
      <div className="alerts-section">
        <div className="section-header-with-icon">
          <h2 className="section-title">
            <AlertTriangle size={24} />
            Détails des Alertes Contrats Expirants
          </h2>
        </div>
        {((stats.alertes_contrats_expirants?.details?.length > 0) || (stats.contract_alerts?.length > 0)) ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Service</th>
                  <th>Type de Contrat</th>
                  <th>Date d'Expiration</th>
                  <th>Jours Restants</th>
                  <th>Niveau d'Alerte</th>
                </tr>
              </thead>
              <tbody>
                {(stats.alertes_contrats_expirants?.details || stats.contract_alerts || []).slice(0, 10).map((alert, index) => {
                  const alertLevel = alert.alert_level || (alert.days_left <= 30 ? 'critical' : alert.days_left <= 60 ? 'warning' : 'info')
                  return (
                    <tr key={alert.id || index}>
                      <td>
                        <div>
                          <strong>{alert.employee_name || '-'}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{alert.employee_id || '-'}</div>
                        </div>
                      </td>
                      <td>{alert.service_name || '-'}</td>
                      <td>{alert.contract_type || '-'}</td>
                      <td>{alert.end_date ? new Date(alert.end_date).toLocaleDateString('fr-FR') : '-'}</td>
                      <td>
                        <span className={`alert-badge alert-${alertLevel}`}>
                          {alert.days_left !== undefined ? alert.days_left : 0} jours
                        </span>
                      </td>
                      <td>
                        <span className={`badge alert-${alertLevel}`}>
                          {alertLevel === 'critical' ? 'Critique' : 
                           alertLevel === 'warning' ? 'Avertissement' : 'Information'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>Aucune alerte de contrat expirant pour le moment</p>
          </div>
        )}
      </div>

      {/* Statistiques par service */}
      {((stats.graphiques_statistiques?.statistiques_services?.length > 0) || (stats.service_stats?.length > 0) || (stats.staff_by_service?.length > 0)) && (
        <div className="service-stats-section">
          <h2 className="section-title">Effectif par Service</h2>
          <div className="service-stats-grid">
            {(stats.graphiques_statistiques?.statistiques_services || stats.service_stats || stats.staff_by_service || []).map((service, index) => (
              <div key={service.service_id || service.id || index} className="service-stat-card">
                <div className="service-stat-name">{service.service_name || service.name || '-'}</div>
                <div className="service-stat-value">{service.employee_count || 0}</div>
                <div className="service-stat-detail">
                  {service.presence_today || 0} présents aujourd'hui
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Icône flottante pour les alertes - Toujours visible */}
      <button 
        className={`floating-alerts-btn ${(stats.alertes_contrats_expirants?.total > 0 || stats.contract_alerts_count > 0) ? 'has-alerts' : 'no-alerts'}`}
        onClick={() => setShowAlertsModal(true)}
        aria-label="Voir les alertes"
        title="Voir les alertes de contrats expirants"
      >
        <Bell size={20} />
        {(stats.alertes_contrats_expirants?.total > 0 || stats.contract_alerts_count > 0) && (
          <span className="alerts-badge">
            {stats.alertes_contrats_expirants?.total || stats.contract_alerts_count || 0}
          </span>
        )}
      </button>

      {/* Modal des alertes */}
      {showAlertsModal && (
            <div className="alerts-modal-overlay" onClick={() => setShowAlertsModal(false)}>
              <div className="alerts-modal" onClick={(e) => e.stopPropagation()}>
                <div className="alerts-modal-header">
                  <h2>
                    <AlertTriangle size={24} />
                    Alertes Contrats Expirants
                  </h2>
                  <button 
                    className="close-modal-btn"
                    onClick={() => setShowAlertsModal(false)}
                    aria-label="Fermer"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="alerts-modal-content">
                  <div className="alerts-summary">
                    <div className="alert-summary-item critical">
                      <span className="summary-label">Critiques</span>
                      <span className="summary-value">
                        {stats.alertes_contrats_expirants?.critiques || 0}
                      </span>
                    </div>
                    <div className="alert-summary-item warning">
                      <span className="summary-label">Avertissements</span>
                      <span className="summary-value">
                        {stats.alertes_contrats_expirants?.avertissements || 0}
                      </span>
                    </div>
                    <div className="alert-summary-item info">
                      <span className="summary-label">Informations</span>
                      <span className="summary-value">
                        {stats.alertes_contrats_expirants?.informations || 0}
                      </span>
                    </div>
                  </div>
                  <div className="alerts-list">
                    {(stats.alertes_contrats_expirants?.details || stats.contract_alerts || []).length > 0 ? (
                      (stats.alertes_contrats_expirants?.details || stats.contract_alerts || []).map((alert, index) => {
                        const alertLevel = alert.alert_level || (alert.days_left <= 30 ? 'critical' : alert.days_left <= 60 ? 'warning' : 'info')
                        return (
                          <div key={alert.id || index} className={`alert-item alert-${alertLevel}`}>
                            <div className="alert-item-header">
                              <strong>{alert.employee_name || '-'}</strong>
                              <span className={`alert-badge alert-${alertLevel}`}>
                                {alertLevel === 'critical' ? 'Critique' : 
                                 alertLevel === 'warning' ? 'Avertissement' : 'Information'}
                              </span>
                            </div>
                            <div className="alert-item-details">
                              <div className="alert-detail-row">
                                <span className="detail-label">Service:</span>
                                <span className="detail-value">{alert.service_name || '-'}</span>
                              </div>
                              <div className="alert-detail-row">
                                <span className="detail-label">Type:</span>
                                <span className="detail-value">{alert.contract_type || '-'}</span>
                              </div>
                              <div className="alert-detail-row">
                                <span className="detail-label">Date d'expiration:</span>
                                <span className="detail-value">
                                  {alert.end_date ? new Date(alert.end_date).toLocaleDateString('fr-FR') : '-'}
                                </span>
                              </div>
                              <div className="alert-detail-row">
                                <span className="detail-label">Jours restants:</span>
                                <span className={`detail-value days-${alertLevel}`}>
                                  {alert.days_left !== undefined ? alert.days_left : 0} jours
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="empty-state" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                        <CheckCircle2 size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
                        <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
                          Aucune alerte de contrat expirant pour le moment.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  )
}

// Composant Graphique en Barres
const BarChart = ({ data, labels, color = '#3b82f6' }) => {
  if (!data || data.length === 0) {
    return <div className="empty-chart">Aucune donnée disponible</div>
  }

  const maxValue = Math.max(...data, 1)
  const chartHeight = 260

  const formatValue = (val) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M'
    } else if (val >= 1000) {
      return (val / 1000).toFixed(0) + 'K'
    }
    return val.toString()
  }

  const formatTooltip = (val) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val || 0) + ' FCFA'
  }

  return (
    <div className="bar-chart-container">
      <div className="chart-bars" style={{ height: `${chartHeight}px` }}>
        {data.map((value, index) => {
          const height = maxValue > 0 ? (value / maxValue) * chartHeight : 0
          return (
            <div key={index} className="chart-bar-wrapper">
              <div
                className="chart-bar"
                style={{
                  height: `${height}px`,
                  backgroundColor: color,
                  minHeight: value > 0 ? '4px' : '0'
                }}
                title={`${labels[index] || ''}: ${formatTooltip(value)}`}
              >
                {value > 0 && height > 30 && (
                  <span className="chart-bar-value">
                    {formatValue(value)}
                  </span>
                )}
              </div>
              <div className="chart-bar-label">{labels[index] ? labels[index].substring(0, 3) : ''}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Composant Graphique en Ligne
const LineChart = ({ data, labels, color = '#10b981' }) => {
  if (!data || data.length === 0) {
    return <div className="empty-chart">Aucune donnée disponible</div>
  }

  const maxValue = Math.max(...data, 100)
  const minValue = Math.min(...data, 0)
  const range = maxValue - minValue || 1
  const chartHeight = 260
  const chartWidth = 600

  // Calculer les points pour la ligne
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * chartWidth
    const y = chartHeight - ((value - minValue) / range) * chartHeight
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="line-chart-container">
      <svg className="line-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} preserveAspectRatio="xMidYMid meet">
        {/* Grille horizontale */}
        {[0, 25, 50, 75, 100].map((value) => {
          const y = chartHeight - ((value - minValue) / range) * chartHeight
          return (
            <g key={value}>
              <line
                x1="0"
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x="0"
                y={y + 5}
                fill="#6b7280"
                fontSize="12"
                textAnchor="start"
              >
                {value}%
              </text>
            </g>
          )
        })}
        {/* Ligne du graphique */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Points */}
        {data.map((value, index) => {
          const x = (index / (data.length - 1 || 1)) * chartWidth
          const y = chartHeight - ((value - minValue) / range) * chartHeight
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill={color}
              stroke="white"
              strokeWidth="2"
            >
              <title>{labels[index] || ''}: {value}%</title>
            </circle>
          )
        })}
        {/* Labels en bas */}
        {labels.map((label, index) => {
          const x = (index / (labels.length - 1 || 1)) * chartWidth
          return (
            <text
              key={index}
              x={x}
              y={chartHeight + 25}
              fill="#6b7280"
              fontSize="10"
              textAnchor="middle"
              transform={`rotate(-45 ${x} ${chartHeight + 25})`}
            >
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

export default DashboardHome
