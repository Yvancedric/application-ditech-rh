# Dépendances pour la numérisation de documents

## Packages Python requis

Pour utiliser la fonctionnalité de numérisation de documents PDF, installez les packages suivants :

### Packages obligatoires (extraction de texte)
```bash
pip install PyPDF2
```

### Packages optionnels (OCR - reconnaissance de caractères)
Pour l'OCR avancé (requis pour traiter les images), installez également :
```bash
pip install Pillow pdf2image pytesseract
```

**Note importante pour l'OCR :**
- `pytesseract` nécessite que Tesseract OCR soit installé sur le système
- `Pillow` (PIL) est nécessaire pour traiter les images (JPG, PNG, etc.)
- `pdf2image` est nécessaire uniquement pour l'OCR sur les PDFs scannés
- **Windows** : Télécharger Tesseract depuis https://github.com/UB-Mannheim/tesseract/wiki
- **Linux** : `sudo apt-get install tesseract-ocr tesseract-ocr-fra`
- **macOS** : `brew install tesseract tesseract-lang`

## Fonctionnalités

### Sans OCR (PyPDF2 uniquement)
- ✅ Extraction de texte depuis les PDFs
- ✅ Extraction des métadonnées (titre, auteur, dates, etc.)
- ✅ Comptage des pages
- ❌ Les images nécessitent l'OCR pour extraire le texte

### Avec OCR (pytesseract + pdf2image + Pillow)
- ✅ Toutes les fonctionnalités ci-dessus
- ✅ Reconnaissance optique de caractères pour les PDFs scannés
- ✅ Extraction de texte depuis les images dans les PDFs
- ✅ **Traitement direct des images (JPG, PNG, etc.) avec OCR**
- ✅ Support multilingue (français + anglais)
- ✅ Détection automatique du type de document (passeport, carte d'identité, formulaire de changement d'adresse, etc.)
- ✅ Extraction de données structurées (emails, téléphones, dates, adresses, etc.)

## Configuration

La fonctionnalité fonctionne même si les packages OCR ne sont pas installés. 
L'extraction de texte se fera uniquement avec PyPDF2 dans ce cas.

## Endpoint API

**POST** `/ditech/documents/scan/`

**Body (FormData):**
- `file`: fichier PDF ou image (JPG, PNG, GIF, BMP, TIFF, WEBP) - max 10 MB
- `document_type`: type de document (optionnel, défaut: 'employee_document')

**Formats supportés:**
- **PDF** : Extraction de texte avec PyPDF2, OCR optionnel si peu de texte
- **Images** : OCR direct avec pytesseract (JPG, PNG, GIF, BMP, TIFF, WEBP)

**Réponse:**
```json
{
  "document_info": {
    "filename": "document.pdf",
    "document_type": "employee_document",
    "file_type": "pdf",
    "file_size": 123456,
    "pages": 1,
    "image_width": null,
    "image_height": null,
    "image_format": null,
    "scanned_at": "2025-01-25T13:44:00Z",
    "scanned_by": "username",
    "ocr_used": false,
    "text_extraction_method": "PyPDF2"
  },
  "extracted_text": "Texte extrait du document...",
  "structured_data": {
    "type": "employee_document",
    "extracted_fields": {
      "emails": ["email@example.com"],
      "telephones": ["+33 1 23 45 67 89"],
      "dates": ["25/01/2025"]
    },
    "statistics": {
      "total_characters": 1000,
      "total_words": 150,
      "total_lines": 20,
      "has_email": true,
      "has_phone": true,
      "has_dates": true
    }
  },
  "metadata": {
    "title": "Titre du document",
    "author": "Auteur",
    "creation_date": "..."
  }
}
```
