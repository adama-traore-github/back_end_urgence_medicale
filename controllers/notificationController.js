const admin = require('firebase-admin');

/**
 * [POST] /api/notifications/send-global
 * Envoie un message à tous les utilisateurs abonnés au topic 'global_alerts'
 */
const sendGlobalNotification = async (req, res) => {
  try {
    // 1. On récupère le titre et le message du corps de la requête
    // (Dans un vrai projet, seul un admin pourrait appeler ça)
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).send({ error: 'Le "title" et le "body" sont requis.' });
    }

    // 2. On définit le "payload" (le message)
    const message = {
      notification: {
        title: title, // ex: "Alerte Sanitaire"
        body: body,   // ex: "Restez chez vous, épidémie..."
      },
      // 3. On définit la "cible" :
      // C'est le concept clé. On n'envoie pas à chaque téléphone un par un.
      // On envoie au "Topic" (sujet) 'global_alerts'.
      // (Notre app Flutter s'abonnera à ce topic).
      topic: 'global_alerts' 
    };

    // 4. On envoie le message via le SDK Admin
    const response = await admin.messaging().send(message);
    console.log('Notification envoyée avec succès:', response);
    
    res.status(200).send({ success: true, messageId: response });

  } catch (error) {
    console.error('Erreur envoi notification:', error);
    res.status(500).send({ error: 'Erreur interne du serveur.' });
  }
};

module.exports = {
  sendGlobalNotification
};