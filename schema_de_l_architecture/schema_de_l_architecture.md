@startuml
title Architecture Globale du Backend Urgence Médicale
skinparam componentStyle rectangle
skinparam linetype ortho
skinparam monochrome false
scale 1.5

' --- 1. COMPOSANTS EXTERNES ---
package "Services\nExternes" #lightblue {
  [Firebase Auth] as Auth
  [Firebase\nFirestore] as Firestore
  [Firebase Cloud\nMessaging] as FCM
}

package "Client\nMobile\n(Flutter)" #lightgreen {
  [Application] as Client
}

' --- 2. SERVEUR BACKEND ---
package "Serveur\nNode.js/Express" as Server #lightyellow {
  
  component "Server.js\nPoint d'entrée" as MainServer {
    [Middlewares]
    [Configuration]
    [Port 3000]
  }
  
  component "Routes\n(/routes)" as Routes {
    file "auth.js"
    file "profil.js"
    file "etablissement.js"
    file "notification.js"
  }
  
  component "Contrôleurs\n(/controllers)" as Controllers {
    file "authController.js"
    file "profilController.js"
    file "etablissementController.js"
    file "notificationController.js"
  }
  
  component "Socket.io\n(/socket)" as SocketIO {
    file "socketHandler.js"
    [WebSocket Server]
  }
  
  component "Cron Jobs\n(/cron)" as Cron {
    file "gardeUpdater.js\n(5 min)"
    [node-cron]
  }
  
  component "Services\nCouche" as Services {
    [Firebase Service]
    [Socket Service]
    [Validation Service]
  }
}

' --- 3. OUTILS DÉVELOPPEMENT ---
package "Scripts Utilitaires" #lightpink {
  [uploadData.js\n(batch OSM)]
  [seed_firebase.js\n(peuplement)]
  [simulateStatus.js\n(test manuel)]
}

' --- 4. CONNECTIONS ET FLUX ---

' Flux Client -> Serveur
Client --> MainServer : "HTTP/HTTPS\nAPI REST"
Client --> SocketIO : "WebSocket\nÉvénements"

' Flux Interne Serveur
MainServer --> Routes
Routes --> Controllers
Controllers --> Services

' Flux Socket
SocketIO --> Controllers : "Événements"
SocketIO --> Services : "Broadcast"

' Flux Cron
Cron --> Controllers : "Programmé"
Cron --> SocketIO : "maj_etablissements"

' Flux vers Services Externes
Services --> Auth : "Vérification Token"
Services --> Firestore : "CRUD\nusers/etablissements..."
Services --> FCM : "Notifications Push"

' Flux Retour
FCM --> Client : "Notifications"
SocketIO --> Client : "Événements Temps Réel"

' Flux Scripts
Scripts --> Firestore : "Données OSM\nPeuplement\nTests"

' --- 5. NOTES DÉTAILLÉES ---
note top of Server
  <b>Architecture MVC</b>
  ------------------------
  • Routes : Aiguillage (/api/auth...)
  • Contrôleurs : Logique métier
  • Services : Abstraction tiers
  • Socket.io : Bidirectionnel
  • Cron : Automatisation (5 min)
end note

note right of SocketIO
  <b>Événements Socket.io</b>
  -------------------------
  <b>Client -> Serveur :</b>
  • envoyer_alerte_hopital
  • demander_etablissements
  • demander_historique_notifications
  
  <b>Serveur -> Client :</b>
  • statut_alerte_hopital
  • reception_etablissements
  • maj_etablissements
end note

note right of Cron
  <b>Cron Job (5 min)</b>
  ------------------------
  1. Parcourt établissements
  2. Inverse isDeGarde
  3. Met à jour lastUpdate
  4. Émet maj_etablissements
  5. Refresh interface clients
end note

note right of Scripts
  <b>Scripts Utilitaires</b>
  -------------------------
  • uploadData.js : Import OSM
  • seed_firebase.js : Peuplement
  • simulateStatus.js : Test manuel
  (Exécution ligne de commande)
end note

note bottom of Firestore
  <b>Collections Firestore</b>
  -------------------------
  • users
  • etablissements
  • alertes_hopitaux
  • notifications_globales
end note

@enduml