// On importe le SDK Admin pour pouvoir parler à Firestore
const admin = require('firebase-admin');

function initializeSocket(io) {
  
  io.on('connection', (socket) => {
    
    console.log(`🔌 Client connecté (socket): ${socket.id}`);

    // Événement quand le client se déconnecte
    socket.on('disconnect', () => {
      console.log(`❌ Client déconnecté (socket): ${socket.id}`);
    });

    // --- C'EST LA NOUVELLE PARTIE ---
    // On écoute l'événement 'envoyer_alerte' qui viendra de Flutter
    socket.on('envoyer_alerte', async (data) => {
      try {
        console.log(`Alerte reçue du client (${socket.id}):`, data);

        // 1. (Optionnel) On pourrait récupérer l'UID de l'utilisateur
        // (on verra comment ajouter l'authentification aux sockets plus tard)
        
        // 2. On crée l'alerte dans la base de données Firestore
        // (Assure-toi d'avoir activé Firestore dans ta console Firebase)
        const db = admin.firestore();
        const alerteRef = await db.collection('alertes').add({
          statut: 'nouveau',
          gps: data.gps || null, // On prend le GPS envoyé par Flutter
          infos: data.infos || '', // Infos (ex: 'blessure saignement')
          createdAt: new Date(),
          clientId: socket.id
        });

        console.log(`Alerte créée dans Firestore avec l'ID: ${alerteRef.id}`);

        // 3. On informe le client que l'alerte est "reçue" (étape 1)
        socket.emit('statut_alerte_change', { statut: 'reçue', id: alerteRef.id });

        // 4. On SIMULE le travail du service d'urgence (attendre 5 secondes)
        setTimeout(async () => {
          try {
            // 5. On met à jour l'alerte dans Firestore
            await alerteRef.update({ statut: 'en_cours_de_traitement' });
            
            // 6. On envoie le nouveau statut au client
            console.log(`Alerte ${alerteRef.id} mise à jour: en_cours_de_traitement`);
            socket.emit('statut_alerte_change', { statut: 'en_cours_de_traitement', id: alerteRef.id });

          } catch (e) {
            console.error("Erreur (timeout simulation):", e);
          }
        }, 5000); // 5000ms = 5 secondes

      } catch (error) {
        console.error('Erreur lors de la création de l\'alerte:', error);
        // Informer le client que l'alerte a échoué
        socket.emit('erreur_alerte', { message: 'Impossible de créer l\'alerte' });
      }
    });



    socket.on('demander_historique_notifications', async () => {
      try {
        const db = admin.firestore();
        const snapshot = await db.collection('notifications_globales')
                                 .orderBy('timestamp', 'desc') // Les plus récentes en premier
                                 .limit(50) // On limite aux 50 dernières
                                 .get();

        // On transforme les documents en une liste propre
        const historique = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // On renvoie l'historique SEULEMENT à ce client
        socket.emit('historique_notifications', historique);
        console.log(`Historique envoyé au client ${socket.id}`);

      } catch (error) {
        console.error("Erreur envoi historique:", error);
        socket.emit('erreur_notification', { message: "Impossible de récupérer l'historique" });
      }
    });
    
  });
}

module.exports = initializeSocket;