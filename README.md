
# Backend Urgence Médicale

Ce projet constitue le serveur backend de l’application de gestion des urgences médicales.
Il fournit une API REST pour les différentes opérations et utilise des WebSockets pour la communication en temps réel : affichage des établissements (hôpitaux, cliniques et pharmacies), mise à jour des gardes, envoi d’alertes à un établissement.

## 🚀 Fonctionnalités Principales

* **API RESTful** : Gestion des utilisateurs, des établissements, des profils et des notifications via Express.js.
* **Temps Réel (WebSocket)** : Communication bidirectionnelle instantanée avec les clients mobiles via Socket.IO.
* **Authentification Sécurisée** : Vérification des tokens via Firebase Admin SDK.
* **Automatisation (Le “Chef d’Orchestre”)** : Un Cron Job agit comme un administrateur virtuel. Il gère automatiquement l'état des établissements (ouverture/fermeture) et notifie les clients, assurant ainsi le fonctionnement autonome du système.
* **Architecture Modulaire** : Organisation du projet avec séparation claire entre contrôleurs, routes et services.

## 🛠️ Prérequis

Avant de commencer, assurez-vous d’avoir installé :

* [Node.js](https://nodejs.org/) (v14 ou supérieur recommandé)
* [npm](https://www.npmjs.com/) (inclus avec Node.js)

## 📦 Installation

1. **Cloner le dépôt** :

   ```bash
   git clone <votre-url-du-repo>
   cd backendurgencemedical
   ```

2. **Installer les dépendances** :

   ```bash
   npm install
   ```

## ⚙️ Configuration

Certaines configurations sensibles sont nécessaires pour le bon fonctionnement du serveur.

### 1. Variables d’Environnement (.env)

Créer un fichier `.env` à la racine du projet :

```env
FIREBASE_WEB_API_KEY="Ajoutez ici d'autres clés API ou secrets"
```

### 2. Firebase Admin SDK

Le serveur utilise Firebase Admin pour l’authentification.

* Placez votre fichier de clé privée Firebase à la racine du projet.
* Renommez-le en `serviceAccountKey.json`, ou mettez à jour le chemin dans `server.js`.

> ⚠️ **Important** : Ne JAMAIS committer `serviceAccountKey.json` ou `.env` dans un dépôt public.

## ⚠️ Attention : Quota Firebase

Le Cron Job (dans `server.js`) s’exécute toutes les **5 minutes** pour simuler l’inversion des gardes.
Avec **745 établissements**, cette opération génère beaucoup d’écritures et peut rapidement épuiser le **quota gratuit (Spark Plan)** de Firebase.

### Recommandation

Avant de lancer le serveur en développement, **commentez** le Cron Job dans `server.js` (lignes 84–88) :

```javascript
// cron.schedule('*/5 * * * *', () => {
//   console.log('CRON 5min: Lancement de l\'inversion des gardes...');
//   inverseGarde(io);
// });
```

Décommentez seulement si vous devez tester la mise à jour automatique.

## ▶️ Démarrage

```bash
npm start
```

Le serveur démarre par défaut sur : `http://localhost:3000`.

## 📂 Structure du Projet

```
backendurgencemedical/
├── controllers/      # Logique métier des endpoints API
├── middleware/       # Middlewares Express (auth, etc.)
├── routes/           # Définitions des routes API
├── socket/           # Gestion des événements Socket.IO
├── server.js         # Point d’entrée du serveur
├── statusUpdater.js  # Logique du Cron Job
├── seed_firebase.js  # Ajout de numéros manquants
├── uploadData.js     # Importation des données initiales
├── simulateStatus.js # Simulation des gardes
├── data.json         # Données brutes (hôpitaux/pharmacies)
└── package.json      # Dépendances et scripts
```

## 🛠️ Scripts Utilitaires

Étant donné que certaines données ne sont pas accessibles gratuitement (API payantes), plusieurs scripts facilitent la préparation de la base.

### `uploadData.js`

* Données **réelles**, extraites via **Overpass Turbo** (OpenStreetMap).
* Peuple Firebase avec les établissements authentiques.

```bash
node uploadData.js
```

### `simulateStatus.js`

* Simule les statuts “De Garde” (Ouvert/Fermé) faute d’une API officielle disponible.

```bash
node simulateStatus.js
```

### `seed_firebase.js`

* Ajoute un numéro par défaut (`00000000`) aux établissements qui n’en ont pas.

```bash
node seed_firebase.js
```

### `statusUpdater.js`

* Utilisé par le Cron Job.
* Met à jour Firebase et déclenche un événement WebSocket (`maj_etablissements`).

## 🔌 API Endpoints

Préfixe : `/api`

* **Auth** : `/api/auth`
* **Établissements** : `/api/etablissements`
* **Profil** : `/api/profil`
* **Notifications** : `/api/notifications`

## 📡 WebSocket (Socket.IO)

* **Authentification** : Token Firebase dans `auth.token`.
* **Événement principal** :

  * `maj_etablissements` : Émis après chaque mise à jour automatique des gardes.

## 🔔 Notifications

### 1. Dans l’application (In-App)

Affichage via une cloche 🔔 permettant de consulter les notifications en direct.

### 2. En arrière-plan (Push)

Envoi via FCM lorsque l’app est fermée.

### Tester l’envoi d’une notification globale

```bash
curl -X POST http://localhost:3000/api/notifications/send-global \
-H "Content-Type: application/json" \
-d '{
    "title": "ALERTE DE CRISE (TEST)",
    "body": "Ceci est un test de notification."
}'
```

## 📝 Auteur

Projet développé par **Adama TRAORE**.

