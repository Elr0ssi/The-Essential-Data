# The-Essential-Data

Projet web statique affichant une carte interactive du monde avec Leaflet.

## Fonctionnalités

- Carte mondiale interactive.
- Menu déroulant pour choisir une catégorie : **économie**, **politique**, **environnement**.
- Coloration des pays selon le score de la catégorie sélectionnée.
- Clic sur un pays pour afficher un panneau de détails dynamique.
- Données de démonstration dans `data/countryData.json`.

## Structure

- `index.html` : page principale.
- `style.css` : styles de l'interface.
- `script.js` : logique de la carte et interactions.
- `data/countryData.json` : données par pays/catégorie.
- `vercel.json` : configuration de déploiement Vercel.

## Lancer en local

Option simple avec Python :

```bash
python -m http.server 8080
```

Puis ouvrir `http://localhost:8080`.

## Déploiement Vercel

Ce projet est 100% statique et compatible avec Vercel :

1. Importer le dépôt GitHub dans Vercel.
2. Framework preset : **Other**.
3. Build command : vide.
4. Output directory : racine du projet.

Vercel servira directement `index.html`.
