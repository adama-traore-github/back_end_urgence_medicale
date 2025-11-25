const admin = require('firebase-admin');

function initializeSocket(io) {
  
  io.on('connection', (socket) => {
    
    // On vérifie si 'socket.user' existe avant d'essayer de lire 'uid'
    console.log(` Client connecté (socket): ${socket.id} (Utilisateur: ${socket.user ? socket.user.uid : 'Anonyme'})`);

    socket.on('disconnect', () => {
      console.log(` Client déconnecté (socket): ${socket.id} (Utilisateur: ${socket.user ? socket.user.uid : 'Anonyme'})`);
    });

    
    // --- ÉVÉNEMENT 1: DEMANDE D'HISTORIQUE (Inchangé) ---
    socket.on('demander_historique_notifications', async () => {
      try {
        const db = admin.firestore();
        const snapshot = await db.collection('notifications_globales')
                                 .orderBy('timestamp', 'desc') 
                                 .limit(50)
                                 .get();

        const historique = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        socket.emit('historique_notifications', historique);
        console.log(`Historique envoyé au client ${socket.id}`);

      } catch (error) {
        console.error("Erreur envoi historique:", error);
        socket.emit('erreur_notification', { message: "Impossible de récupérer l'historique" });
      }
    });


    // --- ÉVÉNEMENT 2: ALERTE CIBLÉE (Inchangé) ---
    socket.on('envoyer_alerte_hopital', async (data) => {
      try {
        const db = admin.firestore();
        let profilData = {}; 
        let utilisateurInfo = { uid: null, email: 'anonyme' }; 

        // On vérifie si l'utilisateur est connecté
        if (socket.user) {
          console.log(`Alerte reçue de l'utilisateur: ${socket.user.uid}`);
          utilisateurInfo = { uid: socket.user.uid, email: socket.user.email };

          // On vérifie le "boolean" (Ton idée)
          if (data.estPourMoi === true) {
            console.log("-> L'alerte concerne l'utilisateur, on cherche son profil...");
            const profilRef = db.collection('profils').doc(socket.user.uid);
            const profilDoc = await profilRef.get();
            if (profilDoc.exists) {
              profilData = profilDoc.data();
            }
          } else {
            console.log("-> L'alerte concerne un témoin (utilisateur authentifié).");
          }
        } else {
          console.log(`Alerte reçue d'un utilisateur anonyme: ${socket.id}`);
        }
        
        // ... (Le reste du code est inchangé et correct) ...
        const alerteComplete = {
          utilisateur: { 
            ...utilisateurInfo, 
            ...profilData      
          },
          alerte: {
            hopitalId: data.hopitalId, 
            hopitalNom: data.hopitalNom,
            messageUtilisateur: data.message,
            gpsUtilisateur: data.gps,
          },
          statut: 'reçue',
          timestamp: new Date(),
        };

        const alerteRef = await db.collection('alertes_hopitaux').add(alerteComplete);
        console.log(`Alerte sauvegardée dans Firestore: ${alerteRef.id}`);

        // Simulation de chat
        socket.emit('statut_alerte_hopital', { type: 'statut', message: 'reçue' });
        
        setTimeout(() => { 
          console.log(`Alerte ${alerteRef.id} -> Hôpital en train d'écrire`);
          // On utilise des guillemets doubles pour l'apostrophe
          socket.emit('statut_alerte_hopital', { type: 'typing', message: "Hôpital en train d'écrire..." });
         }, 5000);
         
        setTimeout(() => { 
          const messageRassurant = "Ne bougez pas de l'endroit où vous êtes. Suivez les guides de premiers soins sur l'accueil si possible. Une équipe est en route. Ne paniquez pas.";
          console.log(`Alerte ${alerteRef.id} -> Message envoyé`);
          socket.emit('statut_alerte_hopital', { type: 'message', message: messageRassurant });
         }, 10000);

      } catch (error) {
        console.error("Erreur lors de l'alerte hôpital:", error);
        socket.emit('erreur_alerte_hopital', { message: "Votre alerte n'a pas pu être envoyée." });
      }
    });



    // --- ÉVÉNEMENT 3: DEMANDE LISTE ÉTABLISSEMENTS  ---


    socket.on('demander_etablissements', async () => {
      try {
        console.log(`Demande d'établissements reçue de ${socket.id}`);
        const db = admin.firestore();
        
        // On récupère toute la collection
        const snapshot = await db.collection('etablissements').get();
        
        // On formate en liste JSON
        const liste = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // On renvoie la liste au téléphone
        socket.emit('reception_etablissements', liste);
        console.log(`Liste de ${liste.length} établissements envoyée via Socket.`);

      } catch (error) {
        console.error("Erreur envoi établissements:", error);
      }
    });

  });
}

module.exports = initializeSocket;