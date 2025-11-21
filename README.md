# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/bc0fb7ab-da1c-46a7-a7c8-ed95175e1b2b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/bc0fb7ab-da1c-46a7-a7c8-ed95175e1b2b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Configuration de l'API

### Configuration du backend

L'application utilise une seule API de production :

**Backend Production** : `https://api.openchemfacts.com/api`

Toutes les requêtes API sont dirigées vers ce endpoint unique. Aucune configuration supplémentaire n'est nécessaire.

### Dépannage

Si vous rencontrez l'erreur "Impossible de se connecter au serveur" :

1. **Vérifiez votre connexion internet** : assurez-vous d'avoir accès à `https://api.openchemfacts.com/api`
2. **Vérifiez la configuration CORS** : le backend doit autoriser les requêtes depuis votre origine frontend
3. **Consultez la console du navigateur** : en mode développement, des logs détaillés sont affichés

Les logs de débogage en développement affichent :
- L'URL de base de l'API utilisée (`https://api.openchemfacts.com/api`)
- Chaque requête effectuée
- Les erreurs détaillées en cas d'échec

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/bc0fb7ab-da1c-46a7-a7c8-ed95175e1b2b) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
