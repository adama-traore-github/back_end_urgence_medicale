# Backend Urgence Médicale

Ce projet constitue le serveur backend pour l'application de gestion des urgences médicales. Il fournit une API REST pour les opérations CRUD et utilise des WebSockets pour la communication en temps réel (mises à jour des gardes, notifications).

## 🚀 Fonctionnalités Principales

*   **API RESTful** : Gestion des utilisateurs, des établissements, des profils et des notifications via Express.js.
*   **Temps Réel (WebSocket)** : Communication bidirectionnelle instantanée avec les clients mobiles via Socket.IO.
*   **Authentification Sécurisée** : Vérification des tokens via Firebase Admin SDK.
*   **Automatisation (Le "Chef d'Orchestre")** : Un Cron Job agit comme un administrateur système virtuel. Il gère de manière autonome l'état des données (ouverture/fermeture des établissements) et notifie les clients, assurant que l'application vit sans intervention humaine constante.
*   **Architecture Modulaire** : Séparation claire des contrôleurs, routes et services.

## 🛠️ Prérequis

Avant de commencer, assurez-vous d'avoir installé :

*   [Node.js](https://nodejs.org/) (v14 ou supérieur recommandé)
*   [npm](https://www.npmjs.com/) (généralement inclus avec Node.js)

## 📦 Installation

1.  **Cloner le dépôt** :
    ```bash
    git clone <votre-url-du-repo>
    cd backendurgencemedical
    ```

2.  **Installer les dépendances** :
    ```bash
    npm install
    ```

## ⚙️ Configuration

Le projet nécessite certaines configurations sensibles pour fonctionner correctement.

### 1. Variables d'Environnement (.env)
Créez un fichier `.env` à la racine du projet et ajoutez-y   :
```env
FIREBASE_WEB_API_KEY="Ajoutez ici d'autres clés API ou secrets"

```

### 2. Firebase Admin SDK
Le serveur utilise Firebase Admin pour l'authentification.
*   Placez votre fichier de clé privée Firebase (téléchargé depuis la console Firebase) à la racine du projet.
*   Renommez-le en `serviceAccountKey.json` ou assurez-vous que le chemin dans `server.js` correspond à votre fichier.

> **⚠️ Important** : Ne jamais commiter le fichier `serviceAccountKey.json` ou le fichier `.env` dans un dépôt public.

## ▶️ Démarrage

Pour lancer le serveur en mode développement (avec redémarrage automatique via nodemon) :
```bash
npm start
```
Le serveur démarrera par défaut sur `http://localhost:3000`.

## 📂 Structure du Projet

```
backendurgencemedical/
├── controllers/      # Logique métier des endpoints API
├── middleware/       # Middlewares Express (ex: auth)
├── routes/           # Définitions des routes API
├── socket/           # Gestionnaires d'événements Socket.IO
├── server.js         # Point d'entrée de l'application
├── statusUpdater.js  # Logique de mise à jour des gardes (utilisé par le Cron Job)
├── seed_firebase.js  # Script pour ajouter des faux numéros
├── uploadData.js     # Script d'import des données initiales
├── simulateStatus.js # Script de simulation des gardes
├── data.json         # Données brutes (Hôpitaux/Pharmacies)
├── serviceAccountKey.json # Clé Firebase (NON INCLUS)
└── package.json      # Dépendances et scripts
```

## 🛠️ Scripts Utilitaires

Le projet contient plusieurs scripts pour gérer les données, car l'accès aux données réelles (horaires précis, contacts) nécessitait des API payantes non accessibles pour ce projet.

*   **`uploadData.js`** ("Diplôme Data") :
    *   **Source des Données** : Les données contenues dans `data.json` sont **RÉELLES**. Elles ont été extraites via **[Overpass Turbo](https://overpass-turbo.eu/)** (OpenStreetMap) et recensent les vrais hôpitaux, cliniques et pharmacies sur tout le territoire du Burkina Faso.
    *   Ce script peuple la base de données Firebase avec ces établissements authentiques (noms, positions géographiques).
    ```bash
    node uploadData.js
    ```

*   **`simulateStatus.js`** ("Simuler Statut") :
    *   Bien que les établissements soient réels, nous n'avons pas accès à leurs horaires d'ouverture en temps réel via une API publique.
    *   Ce script **simule** donc uniquement le statut "De Garde" (Ouvert/Fermé) de manière aléatoire pour démontrer la fonctionnalité de filtrage et d'affichage dynamique de l'application.
    ```bash
    node simulateStatus.js
    ```

*   **`seed_firebase.js`** :
    *   De même, certains numéros de téléphone n'étaient pas disponibles dans les données OpenStreetMap.
    *   Ce script comble ces lacunes en attribuant un numéro par défaut (`00000000`) uniquement aux établissements qui n'en ont pas, garantissant une interface utilisateur cohérente sans altérer les vrais numéros existants.
    ```bash
    node seed_firebase.js
    ```

*   **`statusUpdater.js`** :
    *   C'est le script exécuté par le **Cron Job**. Il agit comme l'administrateur du système.
    *   Il met à jour périodiquement la base de données et déclenche l'événement WebSocket pour informer tous les utilisateurs connectés des changements, simulant une activité en temps réel.
    ```bash
    node statusUpdater.js
    ```

## 🔌 API Endpoints

Les routes principales sont préfixées par `/api` :

*   **Auth** : `/api/auth` (Inscription, Connexion, etc.)
*   **Établissements** : `/api/etablissements` (hôpitaux/pharmacies/cliniques)
*   **Profil** : `/api/profil` (Gestion du profil utilisateur)
*   **Notifications** : `/api/notifications` (Envoi et récupération)

## 📡 WebSocket (Socket.IO)

Le serveur écoute les connexions Socket.IO pour le temps réel.
*   **Authentification** : Le client doit envoyer un token Firebase dans `auth.token` lors de la connexion.
*   **Events** : Le serveur émet et écoute divers événements pour synchroniser l'état de l'application.
    *   `maj_etablissements` : Émis automatiquement lorsque le Cron Job met à jour les statuts de garde dans la base de données. Le payload contient un message et un timestamp.

## 🔔 Notifications

Le système gère les notifications de deux manières pour assurer que l'utilisateur est toujours informé :

1.  **Dans l'application (In-App)** :
    *   Sur la page d'accueil (`Home`), une icône de cloche 🔔 s'affiche.
    *   Elle permet à l'utilisateur de voir rapidement les nouvelles notifications reçues pendant qu'il utilise l'application.

2.  **En arrière-plan (Push Notifications)** :
    *   Si l'utilisateur n'est pas dans l'application, il reçoit une notification push sur son appareil.
    *   En cliquant sur cette notification, il est redirigé directement vers la section des notifications de l'application.

### Tester les Notifications

Pour envoyer une notification globale à tous les utilisateurs (test), vous pouvez utiliser la commande suivante :

```bash
curl -X POST http://localhost:3000/api/notifications/send-global \
-H "Content-Type: application/json" \
-d '{
    "title": "ALERTE DE CRISE (TEST)",
    "body": "Ceci est un test de notification."
}'
```

## 📝 Auteur

Projet développé par Adama TRAORE.
