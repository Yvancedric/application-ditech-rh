import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { 
  Upload, FileText, Scan, CheckCircle2, XCircle, Loader2, 
  Download, File, AlertCircle, X, Eye, FolderOpen, ExternalLink, FileImage
} from 'lucide-react'
import './DocumentScanner.css'

const DocumentScanner = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  // const [preview, setPreview] = useState(null) // Prévisualisation optionnelle pour plus tard
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Vérifier que c'est un PDF ou une image
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']
    const isPDF = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')
    const isImage = selectedFile.type?.startsWith('image/') || 
                    validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext))
    
    if (!isPDF && !isImage) {
      showToast('Veuillez sélectionner un fichier PDF ou une image (JPG, PNG, etc.)', 'error')
      return
    }

    // Vérifier la taille (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      showToast('Le fichier ne doit pas dépasser 10 MB', 'error')
      return
    }

    setFile(selectedFile)
    setError(null)
    setScanResult(null)

    // Note: Prévisualisation optionnelle peut être ajoutée plus tard si nécessaire
    // const reader = new FileReader()
    // reader.onload = (e) => {
    //   setPreview(e.target.result)
    // }
    // reader.readAsDataURL(selectedFile)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const event = {
        target: {
          files: [droppedFile]
        }
      }
      handleFileChange(event)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleScan = async () => {
    if (!file) {
      showToast('Veuillez sélectionner un fichier PDF', 'error')
      return
    }

    setScanning(true)
    setError(null)
    setScanResult(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', 'employee_document') // Type par défaut

      // Envoyer le fichier au backend pour numérisation
      const response = await api.post('/ditech/documents/scan/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setUploadProgress(progress)
        },
      })

      setScanResult(response.data)
      showToast('Document numérisé avec succès !', 'success')
    } catch (err) {
      console.error('Erreur lors de la numérisation:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Erreur lors de la numérisation du document'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setScanning(false)
      setUploadProgress(0)
    }
  }

  const handleReset = () => {
    setFile(null)
    // setPreview(null) // Prévisualisation optionnelle
    setScanResult(null)
    setError(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownloadResult = () => {
    if (!scanResult) return

    const dataStr = JSON.stringify(scanResult, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `scan_result_${new Date().getTime()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast('Résultat téléchargé avec succès', 'success')
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="scanner-page">
      <div className="page-header">
        <h1>Numérisation de Documents</h1>
        <p>Uploader et numériser des documents PDF (OCR et extraction de données)</p>
      </div>

      <div className="scanner-container">
        {/* Zone d'upload */}
        <div className="upload-section">
          <div
            className={`upload-zone ${file ? 'has-file' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,image/*"
              onChange={handleFileChange}
              className="file-input"
              style={{ display: 'none' }}
            />
            
            {!file ? (
              <div className="upload-placeholder">
                <Upload size={48} className="upload-icon" />
                <p className="upload-text">
                  Glissez-déposez un fichier PDF ici<br />
                  ou cliquez pour sélectionner
                </p>
                <p className="upload-hint">Formats acceptés: PDF, JPG, PNG (max 10 MB)</p>
              </div>
            ) : (
              <div className="file-preview">
                <FileText size={48} className="file-icon" />
                <div className="file-info">
                  <p className="file-name">{file.name}</p>
                  <p className="file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  className="btn-remove-file"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReset()
                  }}
                  title="Supprimer le fichier"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {file && (
            <div className="upload-actions">
              <button
                className="btn-scan"
                onClick={handleScan}
                disabled={scanning}
              >
                {scanning ? (
                  <>
                    <Loader2 className="spinner-icon" size={20} />
                    Numérisation en cours... {uploadProgress > 0 && `${uploadProgress}%`}
                  </>
                ) : (
                  <>
                    <Scan size={20} />
                    Numériser le document
                  </>
                )}
              </button>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="error-alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Résultat de la numérisation */}
        {scanResult && (
          <div className="scan-result-section">
            <div className="result-header">
              <h2>
                <CheckCircle2 size={24} className="success-icon" />
                Résultat de la numérisation
              </h2>
              <div className="result-actions">
                <button
                  className="btn-download-result"
                  onClick={handleDownloadResult}
                  title="Télécharger le résultat en JSON"
                >
                  <Download size={18} />
                  Télécharger JSON
                </button>
                <button
                  className="btn-reset"
                  onClick={handleReset}
                  title="Numériser un nouveau document"
                >
                  <X size={18} />
                  Nouveau scan
                </button>
              </div>
            </div>

            <div className="result-content">
              {/* Informations du document */}
              {scanResult.document_info && (
                <div className="result-card">
                  <h3>Informations du Document</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Nom du fichier:</label>
                      <span>{scanResult.document_info.filename || file.name}</span>
                    </div>
                        <div className="info-item">
                          <label>Type:</label>
                          <span>{scanResult.document_info.document_type || '-'}</span>
                        </div>
                        <div className="info-item">
                          <label>Type de fichier:</label>
                          <span>{scanResult.document_info.file_type ? 
                            (scanResult.document_info.file_type === 'pdf' ? '📄 PDF' : 
                             scanResult.document_info.file_type === 'image' ? `🖼️ Image (${scanResult.document_info.image_format || ''})` : 
                             scanResult.document_info.file_type) : '-'}</span>
                        </div>
                        {scanResult.document_info.image_width && scanResult.document_info.image_height && (
                          <div className="info-item">
                            <label>Dimensions:</label>
                            <span>{scanResult.document_info.image_width} × {scanResult.document_info.image_height} px</span>
                          </div>
                        )}
                        <div className="info-item">
                          <label>Date de numérisation:</label>
                          <span>{formatDate(scanResult.document_info.scanned_at || scanResult.scanned_at)}</span>
                        </div>
                        <div className="info-item">
                          <label>Nombre de pages:</label>
                          <span>{scanResult.document_info.pages || scanResult.pages || (scanResult.document_info.file_type === 'image' ? '1' : '-')}</span>
                        </div>
                        {scanResult.document_info.text_extraction_method && (
                          <div className="info-item">
                            <label>Méthode d'extraction:</label>
                            <span>{scanResult.document_info.text_extraction_method}</span>
                          </div>
                        )}
                  </div>
                </div>
              )}

              {/* Texte extrait */}
              {scanResult.extracted_text && (
                <div className="result-card">
                  <h3>Texte Extrait (OCR)</h3>
                  <div className="extracted-text">
                    {scanResult.extracted_text}
                  </div>
                </div>
              )}

              {/* Données structurées */}
              {scanResult.structured_data && (
                <div className="result-card">
                  <h3>
                    Données Structurées
                    {scanResult.structured_data.document_type_detected && (
                      <span className="document-type-badge">
                        {scanResult.structured_data.document_type_detected === 'passport' && '📘 Passeport'}
                        {scanResult.structured_data.document_type_detected === 'id_card' && '🆔 Carte d\'identité'}
                        {scanResult.structured_data.document_type_detected === 'address_change_form' && '📮 Changement d\'adresse'}
                        {scanResult.structured_data.document_type_detected === 'form' && '📝 Formulaire'}
                      </span>
                    )}
                  </h3>
                  
                  {/* Informations spécifiques aux passeports/documents d'identité */}
                  {scanResult.structured_data.document_specific && 
                   Object.keys(scanResult.structured_data.document_specific).length > 0 && (
                    <div className="document-specific-info">
                      <h4>Informations du Document</h4>
                      <div className="info-grid">
                        {Object.entries(scanResult.structured_data.document_specific).map(([key, value]) => (
                          <div key={key} className="info-item">
                            <label>
                              {key === 'passport_number' && 'Numéro de passeport'}
                              {key === 'id_number' && 'Numéro de carte d\'identité'}
                              {key === 'mrz' && 'MRZ (Machine Readable Zone)'}
                              {key === 'nationality' && 'Nationalité'}
                              {key === 'birth_date' && 'Date de naissance'}
                              {key === 'expiry_date' && 'Date d\'expiration'}
                              {key === 'birth_place' && 'Lieu de naissance'}
                              {key === 'old_address' && 'Ancienne adresse'}
                              {key === 'new_address' && 'Nouvelle adresse'}
                              {key === 'change_date' && 'Date de changement'}
                              {key === 'reason' && 'Raison du changement'}
                              {!['passport_number', 'id_number', 'mrz', 'nationality', 'birth_date', 'expiry_date', 'birth_place', 'old_address', 'new_address', 'change_date', 'reason'].includes(key) && key}
                            </label>
                            <span>
                              {Array.isArray(value) ? (
                                <ul className="value-list">
                                  {value.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                  ))}
                                </ul>
                              ) : (
                                String(value)
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Champs extraits généraux */}
                  {scanResult.structured_data.extracted_fields && 
                   Object.keys(scanResult.structured_data.extracted_fields).length > 0 && (
                    <div className="extracted-fields-info">
                      <h4>Champs Extraits</h4>
                      <div className="info-grid">
                        {Object.entries(scanResult.structured_data.extracted_fields).map(([key, value]) => (
                          <div key={key} className="info-item">
                            <label>
                              {key === 'emails' && '📧 Emails'}
                              {key === 'telephones' && '📞 Téléphones'}
                              {key === 'dates' && '📅 Dates'}
                              {key === 'potential_names' && '👤 Noms potentiels'}
                              {key === 'addresses' && '📍 Adresses'}
                              {!['emails', 'telephones', 'dates', 'potential_names', 'addresses'].includes(key) && key}
                            </label>
                            <span>
                              {Array.isArray(value) ? (
                                <ul className="value-list">
                                  {value.map((item, idx) => (
                                    <li key={idx}>{String(item)}</li>
                                  ))}
                                </ul>
                              ) : (
                                String(value)
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Statistiques */}
                  {scanResult.structured_data.statistics && (
                    <div className="statistics-info">
                      <h4>Statistiques</h4>
                      <div className="stats-grid-mini">
                        <div className="stat-item">
                          <span className="stat-label">Caractères:</span>
                          <span className="stat-value">{scanResult.structured_data.statistics.total_characters || 0}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Mots:</span>
                          <span className="stat-value">{scanResult.structured_data.statistics.total_words || 0}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Lignes:</span>
                          <span className="stat-value">{scanResult.structured_data.statistics.total_lines || 0}</span>
                        </div>
                        {scanResult.structured_data.statistics.document_category && (
                          <div className="stat-item">
                            <span className="stat-label">Catégorie:</span>
                            <span className="stat-value">{scanResult.structured_data.statistics.document_category}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Affichage JSON brut (optionnel, collapsible) */}
                  <details className="raw-json-details">
                    <summary>Voir les données JSON brutes</summary>
                    <div className="structured-data">
                      <pre>{JSON.stringify(scanResult.structured_data, null, 2)}</pre>
                    </div>
                  </details>
                </div>
              )}

              {/* Métadonnées */}
              {scanResult.metadata && (
                <div className="result-card">
                  <h3>Métadonnées</h3>
                  <div className="metadata-grid">
                    {Object.entries(scanResult.metadata).map(([key, value]) => (
                      <div key={key} className="metadata-item">
                        <label>{key}:</label>
                        <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Résultat brut */}
              {!scanResult.extracted_text && !scanResult.structured_data && (
                <div className="result-card">
                  <h3>Résultat Complet</h3>
                  <div className="raw-result">
                    <pre>{JSON.stringify(scanResult, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Informations de sauvegarde */}
              {scanResult.document_info?.saved && scanResult.document_id && (
                <div className="result-card saved-document-info">
                  <h3>
                    <CheckCircle2 size={20} className="success-icon" />
                    Document sauvegardé avec succès
                  </h3>
                  <div className="saved-document-details">
                    <div className="info-item">
                      <label>ID du document:</label>
                      <span className="document-id">{scanResult.document_id}</span>
                    </div>
                    {scanResult.document_info?.linked_to_employee && (
                      <div className="info-item">
                        <label>Lié à l'employé:</label>
                        <span>
                          {scanResult.document_info.linked_to_employee.name} 
                          ({scanResult.document_info.linked_to_employee.employee_id})
                        </span>
                      </div>
                    )}
                    {scanResult.document_info?.saved_at && (
                      <div className="info-item">
                        <label>Sauvegardé le:</label>
                        <span>{new Date(scanResult.document_info.saved_at).toLocaleString('fr-FR')}</span>
                      </div>
                    )}
                    <div className="document-actions-info">
                      <p className="info-message">
                        <FolderOpen size={18} />
                        Ce document a été sauvegardé dans le système. Vous pouvez le consulter dans :
                      </p>
                      <div className="action-buttons">
                        <button
                          className="btn-view-documents"
                          onClick={() => navigate('/dashboard/employee-dossiers')}
                          title="Voir tous les documents"
                        >
                          <FolderOpen size={18} />
                          <span>Voir les dossiers employés</span>
                        </button>
                        {scanResult.document_info?.linked_to_employee && (
                          <button
                            className="btn-view-employee"
                            onClick={() => navigate(`/dashboard/employee-dossiers?employee=${scanResult.document_info.linked_to_employee.id}`)}
                            title="Voir le dossier de l'employé"
                          >
                            <ExternalLink size={18} />
                            <span>Dossier de l'employé</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {scanResult.document_info?.saved === false && (
                <div className="result-card warning-info">
                  <h3>
                    <AlertCircle size={20} className="warning-icon" />
                    Document non sauvegardé
                  </h3>
                  <p className="warning-message">
                    Le document a été numérisé avec succès, mais n'a pas pu être sauvegardé dans la base de données.
                    {scanResult.document_info?.save_error && (
                      <span className="error-detail"> Erreur: {scanResult.document_info.save_error}</span>
                    )}
                  </p>
                  <p className="info-text">
                    Les résultats de la numérisation sont toujours disponibles ci-dessus. Vous pouvez télécharger le résultat JSON pour sauvegarder les informations.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={20} />
          ) : (
            <XCircle size={20} />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}

export default DocumentScanner
