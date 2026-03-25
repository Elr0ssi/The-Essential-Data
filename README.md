# The-Essential-Data

Projet web statique affichant un **globe 3D interactif** avec Globe.gl.

## Fonctionnalités

- Globe 3D du monde avec ambiance "espace".
- Menu déroulant pour choisir une catégorie : **économie**, **politique**, **environnement**.
- Coloration complète des pays selon le score de la catégorie sélectionnée.
- Au clic sur un pays :
  - le pays est mis en évidence entièrement,
  - la caméra se recentre,
  - des informations détaillées sont affichées dans le panneau latéral,
  - une info courte reste visible en surimpression.
- Données de démonstration dans `data/countryData.json`.

## Structure

- `index.html` : page principale.
- `style.css` : styles de l'interface.
- `script.js` : logique du globe et interactions.
- `data/countryData.json` : données par pays/catégorie.
- `vercel.json` : configuration de déploiement Vercel.

## Lancer en local

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
