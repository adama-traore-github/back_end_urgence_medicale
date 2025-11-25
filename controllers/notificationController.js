const admin = require('firebase-admin');

const sendGlobalNotification = async (req, res) => {
  try {
    const io = req.io;
    const db = admin.firestore();
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).send({ error: 'Le "title" et le "body" sont requis.' });
    }

    const notificationData = {
      title: title,
      body: body,
      timestamp: new Date(), 
    };

    // --- ACTION 1 (Sauvegarder) ---
    const docRef = await db.collection('notifications_globales').add(notificationData);
    console.log('Notification sauvegardée dans Firestore:', docRef.id);

    // --- ACTION 2 (Émettre sur Socket.io) ---
    
    const finalNotificationData = {
      id: docRef.id,
      ...notificationData
    };
    
    // Et on émet ce nouvel objet (qui a l'ID)
    io.emit('nouvelle_notification', finalNotificationData);
    console.log('Événement Socket.io "nouvelle_notification" émis.');

    // --- ACTION 3 (Envoyer le Push FCM) ---
    const message = {
      notification: { title: title, body: body },
      topic: 'global_alerts'
    };
    const fcmResponse = await admin.messaging().send(message);
    console.log('Notification Push (FCM) envoyée:', fcmResponse);
    
    res.status(200).send({ 
      success: true, 
      messageId: fcmResponse,
      firestoreId: docRef.id 
    });

  } catch (error) {
    console.error('Erreur envoi notification (globale):', error);
    res.status(500).send({ error: 'Erreur interne du serveur.' });
  }
};

module.exports = {
  sendGlobalNotification
};