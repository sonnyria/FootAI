
# 🛠 Guide de résolution : FootAI sur GitHub

Si vous avez renommé votre projet ou supprimé votre dépôt et voyez l'erreur **"Échec du chargement des différences"**, suivez ces étapes précises dans votre terminal pour tout remettre à plat.

## 1. Procédure de Synchronisation (Renommage FootAI)
Cette méthode efface l'historique local qui fait référence à "FootAi-Predictor" et crée le nouveau dépôt "FootAI".

```bash
# 1. Supprimer l'ancienne configuration Git locale
rm -rf .git

# 2. Réinitialiser proprement
git init

# 3. Ajouter tous les fichiers (ils ont été mis à jour avec le nom FootAI)
git add .

# 4. Créer le premier commit du nouveau nom
git commit -m "Renommage officiel en FootAI"

# 5. Créer le NOUVEAU dépôt sur GitHub sous le nom FootAI
# Si vous avez déjà créé 'FootAI' manuellement sur le site, passez à l'étape 5 bis.
gh repo create FootAI --public --source=. --remote=origin

# 5 bis. SI LE DÉPÔT EXISTE DÉJÀ SUR GITHUB :
# git remote add origin https://github.com/VOTRE_PSEUDO/FootAI.git

# 6. Envoyer le code sur la branche principale
git push -u origin main --force
```

## 2. Pourquoi l'erreur "Diff" s'affichait ?
L'interface Comet essaie de comparer vos fichiers actuels avec la branche `main` de l'ancien dépôt (FootAi-Predictor). Comme vous l'avez supprimé, il n'y a plus de point de comparaison. En faisant `rm -rf .git`, vous repartez de zéro et Comet pourra à nouveau calculer les différences sur le nouveau dépôt.

## 3. Déploiement
Une fois le push réussi :
1. Sur GitHub, allez dans **Settings > Pages**.
2. Source : **GitHub Actions**.
3. Le site sera disponible sous `https://VOTRE_PSEUDO.github.io/FootAI/`.

---
*Note : Pour changer le nom du dossier sur votre ordinateur, fermez l'éditeur et renommez simplement le dossier racine en 'FootAI'.*
