#!/bin/bash
# Script de build pour Render

set -e  # Arrêter en cas d'erreur

echo "=== Début du build ==="
echo "Répertoire actuel: $(pwd)"
echo "Contenu du répertoire:"
ls -la

# Vérifier si nous sommes dans le bon répertoire
if [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    echo "Erreur: Les dossiers frontend ou backend n'existent pas dans le répertoire actuel"
    echo "Vérifiez que le Root Directory dans Render est configuré correctement"
    exit 1
fi

# Build du frontend
if [ -d "frontend/apprh" ]; then
    echo "=== Build du frontend ==="
    cd frontend/apprh
    echo "Installation des dépendances..."
    npm install
    echo "Build de l'application..."
    npm run build
    echo "Build du frontend terminé"
    cd ../..
else
    echo "Avertissement: Le dossier frontend/apprh n'existe pas"
fi

# Build du backend (si nécessaire)
if [ -d "backend" ]; then
    echo "=== Build du backend ==="
    cd backend
    if [ -f "requirements.txt" ]; then
        echo "Installation des dépendances Python..."
        pip install -r requirements.txt
        echo "Collecte des fichiers statiques..."
        python projectditech/manage.py collectstatic --noinput
        echo "Exécution des migrations..."
        python projectditech/manage.py migrate --noinput
    else
        echo "Erreur: requirements.txt introuvable dans backend/"
        exit 1
    fi
    echo "Build du backend terminé"
    cd ..
else
    echo "Avertissement: Le dossier backend n'existe pas"
fi

echo "=== Build terminé avec succès ==="
