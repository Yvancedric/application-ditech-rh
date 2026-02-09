import React, { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, Users, User, Building2, FolderOpen, History, File, ClipboardList,
  Clock, Timer, Calendar, Wallet, DollarSign, Gift, Minus, Megaphone, CheckCircle2,
  Briefcase, Target, BookOpen, Book, Star, MessageSquare, Menu, ChevronLeft,
  ChevronRight, ChevronDown, X, LogOut, Scan
} from 'lucide-react'
import DashboardHome from '../components/DashboardHome'
import Employees from '../components/Employees'
import Services from '../components/Services'
import EmployeeDossiers from '../components/EmployeeDossiers'
import EmployeeHistory from '../components/EmployeeHistory'
import Contracts from '../components/Contracts'
import PresenceAbsence from '../components/PresenceAbsence'
import Payroll from '../components/Payroll'
import EmployeePayslips from '../components/EmployeePayslips'
import Recruitment from '../components/Recruitment'
import TrainingEvaluation from '../components/TrainingEvaluation'
import DocumentScanner from '../components/DocumentScanner'
import './Dashboard.css'

const Dashboard = () => {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState({})

  // Fonction pour mapper les emojis aux composants d'icônes Lucide React
  const getIcon = (iconName) => {
    const iconMap = {
      'LayoutDashboard': LayoutDashboard,
      'Users': Users,
      'User': User,
      'Building2': Building2,
      'FolderOpen': FolderOpen,
      'History': History,
      'File': File,
      'ClipboardList': ClipboardList,
      'Clock': Clock,
      'Timer': Timer,
      'Calendar': Calendar,
      'Wallet': Wallet,
      'DollarSign': DollarSign,
      'Gift': Gift,
      'Minus': Minus,
      'Megaphone': Megaphone,
      'CheckCircle2': CheckCircle2,
      'Briefcase': Briefcase,
      'Target': Target,
      'BookOpen': BookOpen,
      'Book': Book,
      'Star': Star,
      'MessageSquare': MessageSquare,
      'Scan': Scan
    }
    return iconMap[iconName] || LayoutDashboard
  }

  const toggleMenu = (section) => {
    setMenuOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const menuItems = [
    {
      label: 'Tableau de bord',
      icon: 'LayoutDashboard',
      path: '/dashboard',
      section: 'G'
    },
    {
      label: 'Gestion du personnel',
      icon: 'Users',
      section: 'A',
      items: [
        {
          label: 'Employés',
          icon: 'User',
          path: '/dashboard/employees',
          description: 'Création / modification / suppression d\'employés'
        },
        {
          label: 'Services',
          icon: 'Building2',
          path: '/dashboard/services',
          description: 'Gestion des services'
        },
        {
          label: 'Dossiers employés',
          icon: 'FolderOpen',
          path: '/dashboard/employee-dossiers',
          description: 'Informations personnelles, contrat, poste, documents'
        },
        {
          label: 'Historique des changements',
          icon: 'History',
          path: '/dashboard/employee-history',
          description: 'Poste, salaire, service'
        },
        {
          label: 'Numérisation de documents',
          icon: 'Scan',
          path: '/dashboard/document-scanner',
          description: 'Uploader et numériser des documents PDF (OCR et extraction de données)'
        }
      ]
    },
    {
      label: 'Gestion des contrats',
      icon: 'File',
      section: 'B',
      items: [
        {
          label: 'Contrats',
          icon: 'ClipboardList',
          path: '/dashboard/contracts',
          description: 'Type de contrat : CDI, CDD, stage, intérim - Dates : début / fin - Renouvellement automatique - Alertes d\'expiration'
        }
      ]
    },
    {
      label: 'Présence & Absence',
      icon: 'Clock',
      section: 'C',
      items: [
        {
          label: 'Pointage',
          icon: 'Timer',
          path: '/dashboard/pointage',
          description: 'Pointage (manuel ou avec badge)'
        },
        {
          label: 'Congés',
          icon: 'Calendar',
          path: '/dashboard/conges',
          description: 'Congés (demande → validation RH / manager → solde)'
        },
        {
          label: 'Retards / Heures supp.',
          icon: 'Clock',
          path: '/dashboard/retards-heures-supp',
          description: 'Retards / heures supplémentaires'
        }
      ]
    },
    {
      label: 'Paie',
      icon: 'Wallet',
      section: 'D',
      items: [
        {
          label: 'Fiches de paie',
          icon: 'DollarSign',
          path: '/dashboard/fiches-paie',
          description: 'Fiches de paie'
        },
        {
          label: 'Bulletins par employé',
          icon: 'User',
          path: '/dashboard/bulletins-employe',
          description: 'Consulter et télécharger les bulletins de paie de chaque employé'
        },
        {
          label: 'Primes',
          icon: 'Gift',
          path: '/dashboard/primes',
          description: 'Primes'
        },
        {
          label: 'Retenues',
          icon: 'ClipboardList',
          path: '/dashboard/retenues',
          description: 'Retenues'
        },
        {
          label: 'Déductions',
          icon: 'Minus',
          path: '/dashboard/deductions',
          description: 'Déductions'
        },
        {
          label: 'Historique des paiements',
          icon: 'History',
          path: '/dashboard/historique-paiements',
          description: 'Historique des paiements'
        }
      ]
    },
    {
      label: 'Recrutement',
      icon: 'Target',
      section: 'E',
      items: [
        {
          label: 'Publication des offres',
          icon: 'Megaphone',
          path: '/dashboard/offres-emploi',
          description: 'Publication des offres'
        },
        {
          label: 'Suivi des candidats',
          icon: 'Users',
          path: '/dashboard/candidats',
          description: 'Suivi des candidats'
        },
        {
          label: 'Entretiens',
          icon: 'Briefcase',
          path: '/dashboard/entretiens',
          description: 'Entretiens'
        },
        {
          label: 'Sélection',
          icon: 'CheckCircle2',
          path: '/dashboard/selection',
          description: 'Sélection'
        }
      ]
    },
    {
      label: 'Formation & Évaluation',
      icon: 'BookOpen',
      section: 'F',
      items: [
        {
          label: 'Plan de formation',
          icon: 'Book',
          path: '/dashboard/plans-formation',
          description: 'Plan de formation'
        },
        {
          label: 'Évaluations annuelles',
          icon: 'Star',
          path: '/dashboard/evaluations',
          description: 'Évaluations annuelles'
        },
        {
          label: 'Feedback managers',
          icon: 'MessageSquare',
          path: '/dashboard/feedback-managers',
          description: 'Feedback managers'
        }
      ]
    }
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/'
    }
    return location.pathname === path
  }

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false)
  }

  const handleNavigation = (path) => {
    if (path) {
      navigate(path)
      setMobileMenuOpen(false)
    }
  }

  return (
    <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Mobile Menu Button (Hamburger) */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <Menu className="hamburger-icon" size={24} />
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={handleMobileMenuClose}
          aria-label="Close menu"
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container logo-text-container">
            {(sidebarOpen || mobileMenuOpen) ? (
              <>
                <span className="sidebar-brand-top">DIGITAL TECHNOLOGIES</span>
                <span className="sidebar-company-name">GRH</span>
              </>
            ) : (
              <>
                <span className="sidebar-brand-top short">DT</span>
                <span className="sidebar-company-name short">GRH</span>
              </>
            )}
          </div>
          <div className="sidebar-toggle-group">
            <button 
              className="sidebar-toggle desktop-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
            <button 
              className="sidebar-toggle mobile-close"
              onClick={handleMobileMenuClose}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const hasSubmenu = item.items && item.items.length > 0
            const isOpen = menuOpen[item.section]

            return (
              <div key={item.section || item.path} className="menu-section">
                {hasSubmenu ? (
                  <>
                    <button
                      className={`menu-item ${isOpen ? 'open' : ''}`}
                      onClick={() => toggleMenu(item.section)}
                    >
                      <span className="menu-icon">
                        {React.createElement(getIcon(item.icon), { size: 20 })}
                      </span>
                      {(sidebarOpen || mobileMenuOpen) && <span className="menu-label">{item.label}</span>}
                      {(sidebarOpen || mobileMenuOpen) && (
                        <span className="menu-arrow">
                          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                      )}
                    </button>
                    {(sidebarOpen || mobileMenuOpen) && isOpen && (
                      <div className="submenu">
                        {item.items.map((subItem) => (
                          <button
                            key={subItem.path}
                            className={`submenu-item ${isActive(subItem.path) ? 'active' : ''}`}
                            onClick={() => handleNavigation(subItem.path)}
                            title={subItem.description}
                          >
                            <span className="submenu-icon">
                              {React.createElement(getIcon(subItem.icon), { size: 18 })}
                            </span>
                            <span className="submenu-label">{subItem.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                    <button
                      className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <span className="menu-icon">
                        {React.createElement(getIcon(item.icon), { size: 20 })}
                      </span>
                      {(sidebarOpen || mobileMenuOpen) && <span className="menu-label">{item.label}</span>}
                    </button>
                )}
              </div>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            {(sidebarOpen || mobileMenuOpen) && (
              <>
                <span className="user-name">{user?.username || 'Utilisateur'}</span>
                <span className="user-role">{user?.role || 'Employé'}</span>
              </>
            )}
          </div>
          <button className="logout-btn" onClick={() => {
            handleLogout()
            setMobileMenuOpen(false)
          }}>
            <LogOut size={20} />
            {(sidebarOpen || mobileMenuOpen) && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/services" element={<Services />} />
          <Route path="/employee-dossiers" element={<EmployeeDossiers />} />
          <Route path="/employee-history" element={<EmployeeHistory />} />
          <Route path="/document-scanner" element={<DocumentScanner />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/pointage" element={<PresenceAbsence tab="pointage" />} />
          <Route path="/conges" element={<PresenceAbsence tab="conges" />} />
          <Route path="/retards-heures-supp" element={<PresenceAbsence tab="retards" />} />
          <Route path="/fiches-paie" element={<Payroll tab="payslips" />} />
          <Route path="/bulletins-employe" element={<EmployeePayslips />} />
          <Route path="/primes" element={<Payroll tab="bonuses" />} />
          <Route path="/retenues" element={<Payroll tab="retentions" />} />
          <Route path="/deductions" element={<Payroll tab="deductions" />} />
          <Route path="/historique-paiements" element={<Payroll tab="history" />} />
          <Route path="/offres-emploi" element={<Recruitment tab="offers" />} />
          <Route path="/candidats" element={<Recruitment tab="candidates" />} />
          <Route path="/entretiens" element={<Recruitment tab="interviews" />} />
          <Route path="/selection" element={<Recruitment tab="selection" />} />
          <Route path="/plans-formation" element={<TrainingEvaluation tab="plans" />} />
          <Route path="/evaluations" element={<TrainingEvaluation tab="evaluations" />} />
          <Route path="/feedback-managers" element={<TrainingEvaluation tab="feedback" />} />
        </Routes>
              </main>
    </div>
  )
}

export default Dashboard
