# Documentation Technique - Backend Urgence Médicale

Ce document présente l'architecture technique détaillée, les diagrammes de conception et les descriptions des fonctionnalités du backend de l'application d'urgence médicale.

## 🛠️ Comment visualiser les diagrammes ?
Les diagrammes ci-dessous sont écrits dans le langage **PlantUML**. Pour les visualiser graphiquement :
1.  Copiez le code du bloc (entre les \`\`\`).
2.  Allez sur le site **[Plantuml](https://www.plantuml.com/plantuml/uml/)** ou tout autre éditeur PlantUML en ligne.
3.  Collez le code dans la zone d'édition.
4.  Le diagramme s'affichera.

## 1. Diagramme de Cas d'Utilisation 

```
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome

' Déclaration des acteurs
actor "Utilisateur\n(accidenter/patient/temoin)" as User
actor "Administrateur" as Admin
actor "Système (Cron)" as Cron

' Rectangle principal
rectangle "Application Urgence Médicale" as App {
    usecase "S'inscrire" as Register
    usecase "Se connecter" as Login
    usecase "Gérer son Profil Médical" as ManageProfile
    usecase "Consulter les Établissements" as ViewEtab
    usecase "Envoyer une Alerte (SOS)" as SendAlert
    usecase "Consulter Historique Notifs" as ViewHistory
    usecase "Recevoir Notif Push" as ReceivePush
    usecase "Envoyer Notification Globale" as SendGlobal
    usecase "Gérer les Établissements\n(CRUD)" as ManageEtab
    usecase "Mettre à jour les Gardes\n(Inverser Statut)" as UpdateGarde
}

' Relations utilisateurs -> usecases
User --> Register
User --> Login
User --> ManageProfile
User --> ViewEtab
User --> SendAlert
User --> ViewHistory
User --> ReceivePush

Admin --> Login
Admin --> SendGlobal
Admin --> ManageEtab
Admin --> UpdateGarde

SendAlert --> Admin : Reçoit >
SendGlobal --> User : Reçoit >
Cron --> UpdateGarde : Déclenche >

' Inclusions
ManageProfile ..> Login : <<include>>
SendAlert ..> Login : <<include>>
ViewHistory ..> Login : <<include>>
SendGlobal ..> Login : <<include>>
ManageEtab ..> Login : <<include>>

note right of UpdateGarde
  Déclenché automatiquement par le Cron
  ou manuellement par l'Admin
end note

' ----------------------------
' Positionnement spécifique pour aligner Cron avec "Se connecter"
Login -[hidden]-> Cron

' Positionnement général
User -[hidden]-> App
Admin -[hidden]-> App

@enduml
```

## 2. Descriptions Textuelles des Cas d'Utilisation

### Cas d'Utilisation 1 : Envoyer une Alerte d'Urgence
**Acteur Principal :** Utilisateur Mobile
**Pré-conditions :** L'application est ouverte. L'utilisateur doit avoir un profil si il veut que le bouton switch "est pour moi" soit activé.

**Scénario Nominal :**
1. L'utilisateur sélectionne un établissement ou appuie sur SOS.
2. L'utilisateur définit si l'urgence est pour lui-même ou pour un tiers (Switch `estPourMoi`).
3. L'application capture la position GPS (`gps`).
4. L'application envoie l'événement `envoyer_alerte_hopital` au serveur.
    *   **Si `estPourMoi` = VRAI** : Le serveur récupère et joint le profil médical de l'utilisateur (données dynamiques stockées en base).
    *   **Si `estPourMoi` = FAUX** : Le serveur envoie l'alerte sans les données médicales personnelles.
5. Le serveur sauvegarde l'alerte dans `alertes_hopitaux`.
6. Le serveur renvoie un accusé de réception (`statut: reçue`).
7. Simulation : Le serveur envoie des événements de chat (`typing`, `message`) pour rassurer l'utilisateur.

### Cas d'Utilisation 2 : Mise à jour Automatique des Gardes
**Acteur Principal :** Système (Tâche Cron)
**Pré-conditions :** Le serveur doit être lancé.
**Déclencheur :** Temporel (Toutes les 5 minutes).

**Scénario Nominal :**
1. Le Cron Job s'active.
2. Le système parcourt tous les documents de la collection `etablissements`.
3. Pour chaque établissement, il inverse la valeur du champ `isDeGarde`.
4. Il met à jour le champ `lastUpdate`.
5. Il émet l'événement Socket `maj_etablissements` à tous les clients connectés pour rafraîchir l'interface.

## 3. Diagramme de Classes

```
@startuml

' --- 1. CONFIGURATION VISUELLE (Compacte) ---
skinparam classAttributeIconSize 0
' Réduction de l'espacement horizontal (était à 120)
skinparam nodesep 60
' Réduction de l'espacement vertical (était à 100)
skinparam ranksep 50
skinparam padding 2

' --- 2. DÉFINITION DES CLASSES ---

class Utilisateur {
    - String uid
    - String email
    - String password
    + sInscrire()
    + seConnecter()
    + envoyerAlerte()
    + consulterHistorique()
}

class Profil {
    - String nom
    - String prenom
    - String dateDeNaissance
    - String sexe
    - String contactNom
    - String contactTelephone
    - String groupeSanguin
    - String allergies
    - String maladies
    - String medicaments
    + getProfil()
    + updateProfil()
}

class Etablissement {
    - String id
    - String nom
    - String type
    - GeoPoint position
    - String telephone
    - Boolean isDeGarde
    - Timestamp lastUpdate
    + getEtablissements()
    + inverserGarde()
}

class Notification {
    - String id
    - String titre
    - String message
    - Timestamp dateEnvoi
    + envoyerNotificationGlobale()
    + recevoirNotification()
}

' --- 3. RELATIONS ---

' COMPOSITION
Utilisateur "1 " *-- "1 " Profil

' ASSOCIATION
Utilisateur "1 " ..> "1..* " Etablissement : Envoie alerte >

' NOTIFICATION
Notification "*" --> "*" Utilisateur : Est envoyée à >

@enduml
```

## 4. Diagramme de Base de Données Orienté Document

```

@startuml
' --- STYLE FIREBASE / NOSQL ---
skinparam packageStyle rectangle
skinparam roundCorner 10
skinparam linetype ortho
' Padding pour aérer le schéma
skinparam nodesep 60
skinparam ranksep 60
hide circle
hide methods

' Couleurs distinctes
skinparam class {
    BackgroundColor<<Collection>> LightBlue
    BorderColor<<Collection>> Blue
    BackgroundColor<<Document>> White
    BorderColor<<Document>> Black
    BackgroundColor<<Service>> LightYellow
}

title Modèle de Données Firestore (NoSQL) 

package "FirestoreDB" {

    ' --- COLLECTIONS ---
    ' Utilisation de CamelCase pour éviter les conflits de mots-clés
    
    class UsersCollection <<Collection>>
    note bottom of UsersCollection: Liste des patients
    
    class EtablissementsCollection <<Collection>>
    note bottom of EtablissementsCollection: Structures (Hopitaux/Pharma)
    
    class notifications_globalesCollection <<Collection>>
    note bottom of notifications_globalesCollection: Historique global
    
    class alertesHopitauxCollection <<Collection>>
    note bottom of alertesHopitauxCollection: Logs & Traçabilité
    
    ' --- DOCUMENTS ---
    
    class UserDocument <<Document>> {
        **Doc ID:** uid (géré par Auth)
        --
        String email
        String fcmToken (Pour le Push)
        Timestamp createdAt
        --
        **Map profile:** (Données embarquées)
           String nom
           String prenom
           String groupeSanguin
           String telephone
           Map medical
    }
    
    class EtablissementDocument <<Document>> {
        **Doc ID:** auto-generated
        --
        String nom
        String type
        GeoPoint position
        String telephone
        --
        **Boolean isDeGarde**
        Timestamp lastUpdate
    }
    
    class NotificationDocument <<Document>> {
        **Doc ID:** auto-generated
        --
        String titre
        String message
        Timestamp dateEnvoi
        --
        String cible (Ex: ALL, ZONE_SUD)
    }
    
    class AlerteDocument <<Document>> {
        **Doc ID:** auto-generated
        --
        String userId (Qui a lancé l'alerte)
        Timestamp dateAlerte (Quand)
        GeoPoint position (Où)
        --
        String etablissementId
        String status
    }

}

' --- SYSTÈME EXTERNE (CRON JOB) ---
class CronJob <<Service>> {
    Tâche planifiée
    --
    Logique d'Inversion :
    isDeGarde = !isDeGarde
}

' --- RELATIONS ---

UsersCollection "1" --> "0..*" UserDocument
EtablissementsCollection "1" --> "0..*" EtablissementDocument
notifications_globalesCollection "1" --> "0..*" NotificationDocument
alertesHopitauxCollection "1" --> "0..*" AlerteDocument

' Le Cron Job agit sur le document Etablissement
CronJob ..> EtablissementDocument : Met à jour isDeGarde

' Relation de consultation d'historique
UserDocument ..> NotificationDocument : Consulte l'historique

note right of UserDocument
  **Optimisation :**
  Le profil est fusionné dans l'user
  pour simplifier les lectures.
end note
@enduml

```