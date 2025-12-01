# Guide de contribution

Merci de votre intérêt pour contribuer à OpenChemFacts ! Ce guide vous aidera à comprendre comment contribuer efficacement au projet.

## 📋 Table des matières

- [Code de conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Workflow Git](#workflow-git)
- [Standards de code](#standards-de-code)
- [Processus de review](#processus-de-review)
- [Proposer une nouvelle fonctionnalité](#proposer-une-nouvelle-fonctionnalité)
- [Rapporter un bug](#rapporter-un-bug)
- [Ressources](#ressources)

## Code de conduite

En participant à ce projet, vous acceptez de respecter un environnement respectueux et accueillant pour tous les contributeurs.

## Comment contribuer

### 1. Préparer votre environnement

Suivez le guide d'installation dans le [README.md](./README.md) :

```bash
# Cloner le repository
git clone <REPOSITORY_URL>
cd openchemfacts_frontend

# Installer les dépendances (mode sécurisé)
npm ci --ignore-scripts

# Lancer le serveur de développement
npm run dev
```

**Important** : Utilisez toujours `npm ci --ignore-scripts` pour installer les dépendances (mesure de sécurité post Shai-Hulud 2.0).

### 2. Choisir une tâche

- Consultez les [issues ouvertes](https://github.com/your-repo/issues) pour trouver des tâches
- Ou proposez une nouvelle fonctionnalité (voir section [Proposer une nouvelle fonctionnalité](#proposer-une-nouvelle-fonctionnalité))

### 3. Créer une branche

Créez une branche pour votre travail :

```bash
git checkout -b feature/nom-de-la-fonctionnalite
# ou
git checkout -b fix/nom-du-bug
```

**Conventions de nommage des branches** :
- `feature/` pour les nouvelles fonctionnalités
- `fix/` pour les corrections de bugs
- `docs/` pour la documentation
- `refactor/` pour les refactorisations

### 4. Développer

- Suivez les [standards de code](#standards-de-code)
- Consultez le [guide d'ajout de fonctionnalités](./Documentation/AJOUTER_FONCTIONNALITE.md) pour des exemples concrets
- Testez votre code localement avec `npm run dev`
- Vérifiez le linting avec `npm run lint`

### 5. Commiter

Créez des commits clairs et descriptifs :

```bash
git add .
git commit -m "feat: ajout de la fonctionnalité X"
```

**Conventions de messages de commit** :
- `feat:` pour une nouvelle fonctionnalité
- `fix:` pour une correction de bug
- `docs:` pour la documentation
- `style:` pour le formatage (pas de changement de code)
- `refactor:` pour une refactorisation
- `test:` pour les tests
- `chore:` pour les tâches de maintenance

### 6. Pousser et créer une Pull Request

```bash
git push origin feature/nom-de-la-fonctionnalite
```

Créez ensuite une Pull Request sur GitHub avec :
- Une description claire de ce qui a été fait
- Des captures d'écran si applicable
- Une référence aux issues liées (ex: "Fixes #123")

## Workflow Git

### Structure des branches

- `main` : Branche principale, code stable et déployé
- `feature/*` : Branches de fonctionnalités
- `fix/*` : Branches de corrections

### Processus

1. **Créer une branche** depuis `main`
2. **Développer** votre fonctionnalité/correction
3. **Tester** localement
4. **Pousser** votre branche
5. **Créer une Pull Request**
6. **Attendre la review** et répondre aux commentaires
7. **Merger** après approbation

### Synchroniser avec main

Si `main` a évolué pendant votre développement :

```bash
git checkout main
git pull origin main
git checkout feature/votre-branche
git merge main
# Résoudre les conflits si nécessaire
git push origin feature/votre-branche
```

## Standards de code

### TypeScript

- Utilisez TypeScript pour tout le nouveau code
- Évitez `any` autant que possible
- Utilisez les types centralisés depuis `src/lib/api-types.ts`
- Documentez les types complexes avec des commentaires JSDoc

### React

- Utilisez des composants fonctionnels avec des hooks
- Suivez les conventions de nommage : PascalCase pour les composants
- Utilisez les hooks API centralisés depuis `src/hooks/api-hooks.ts`
- Ne créez pas d'appels API directs dans les composants

### Structure des composants

```typescript
// 1. Imports (groupés par type)
import { useState } from "react";
import { useCasInfo } from "@/hooks/api-hooks";
import { Card } from "@/components/ui/card";

// 2. Types/Interfaces
interface MyComponentProps {
  cas: string;
}

// 3. Composant
export const MyComponent = ({ cas }: MyComponentProps) => {
  // 4. Hooks
  const { data, isLoading } = useCasInfo(cas);
  
  // 5. Logique
  // ...
  
  // 6. Render
  return (
    <Card>
      {/* ... */}
    </Card>
  );
};
```

### Nommage

- **Composants** : PascalCase (`ChemicalInfo.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useCasInfo.ts`)
- **Utilitaires** : camelCase (`cas-utils.ts`)
- **Types** : PascalCase (`CasInfoResponse`)
- **Constantes** : UPPER_SNAKE_CASE (`API_BASE_URL`)

### Styling

- Utilisez Tailwind CSS pour le styling
- Utilisez les composants shadcn/ui disponibles dans `src/components/ui/`
- Suivez le système de design existant

### Architecture

- **Toujours utiliser les hooks API centralisés** (`src/hooks/api-hooks.ts`)
- **Utiliser les types centralisés** (`src/lib/api-types.ts`)
- **Utiliser les query keys centralisées** (`src/lib/query-keys.ts`)
- Ne pas créer de nouveaux appels API directs dans les composants

Pour plus de détails, consultez le [guide de style](./Documentation/STYLE_GUIDE.md) (à venir).

## Processus de review

### Avant de soumettre une PR

- [ ] Le code fonctionne localement
- [ ] Le linting passe (`npm run lint`)
- [ ] Le build de production fonctionne (`npm run build`)
- [ ] Les conventions de code sont respectées
- [ ] La documentation est à jour si nécessaire

### Pendant la review

- Répondez aux commentaires de manière constructive
- Faites les modifications demandées
- Posez des questions si quelque chose n'est pas clair

### Après approbation

Votre PR sera mergée dans `main` et déployée automatiquement sur Lovable.

## Proposer une nouvelle fonctionnalité

### 1. Vérifier si elle existe déjà

- Consultez les issues ouvertes
- Vérifiez la documentation existante

### 2. Créer une issue

Créez une issue sur GitHub avec :
- **Titre** : Description claire de la fonctionnalité
- **Description** : Contexte, cas d'usage, bénéfices
- **Exemples** : Si possible, des exemples d'utilisation

### 3. Discuter

Attendez les retours de la communauté et des mainteneurs avant de commencer à coder.

### 4. Implémenter

Une fois approuvée, suivez le [guide d'ajout de fonctionnalités](./Documentation/AJOUTER_FONCTIONNALITE.md) pour l'implémentation.

## Rapporter un bug

### Avant de créer une issue

1. Vérifiez que le bug n'a pas déjà été rapporté
2. Vérifiez la [documentation de dépannage](./Documentation/TROUBLESHOOTING.md)
3. Testez avec la dernière version de `main`

### Créer une issue de bug

Incluez :
- **Description** : Ce qui se passe vs ce qui devrait se passer
- **Étapes pour reproduire** : Comment reproduire le bug
- **Comportement attendu** : Ce qui devrait se passer
- **Environnement** : OS, navigateur, version Node.js
- **Captures d'écran** : Si applicable
- **Logs** : Erreurs de la console (F12)

## Ressources

### Documentation

- [README.md](./README.md) - Vue d'ensemble et installation
- [Documentation/DEVELOPPEMENT_LOCAL.md](./Documentation/DEVELOPPEMENT_LOCAL.md) - Guide de développement local
- [Documentation/ARCHITECTURE.md](./Documentation/ARCHITECTURE.md) - Architecture du projet
- [Documentation/AJOUTER_FONCTIONNALITE.md](./Documentation/AJOUTER_FONCTIONNALITE.md) - Guide d'ajout de fonctionnalités
- [Documentation/TROUBLESHOOTING.md](./Documentation/TROUBLESHOOTING.md) - Solutions aux problèmes courants

### Liens utiles

- **API Backend** : https://api.openchemfacts.com/api
- **Documentation API** : https://api.openchemfacts.com/docs
- **Lovable Project** : https://lovable.dev/projects/bc0fb7ab-da1c-46a7-a7c8-ed95175e1b2b

### Support

Si vous avez des questions :
- Consultez la documentation
- Créez une issue sur GitHub
- Contactez les mainteneurs

## Questions fréquentes

### Puis-je utiliser `npm install` ?

Non. Pour des raisons de sécurité (post Shai-Hulud 2.0), utilisez toujours `npm ci --ignore-scripts`.

### Comment ajouter un nouvel endpoint API ?

Consultez le [guide d'ajout de fonctionnalités](./Documentation/AJOUTER_FONCTIONNALITE.md#ajouter-un-nouvel-endpoint-api).

### Puis-je créer un appel API direct dans un composant ?

Non. Utilisez toujours les hooks API centralisés depuis `src/hooks/api-hooks.ts`. Si un hook n'existe pas, créez-en un nouveau.

### Comment tester mon code ?

Lancez `npm run dev` et testez manuellement dans le navigateur. Pour l'instant, il n'y a pas de tests automatisés, mais c'est prévu pour l'avenir.

---

Merci de contribuer à OpenChemFacts ! 🎉

