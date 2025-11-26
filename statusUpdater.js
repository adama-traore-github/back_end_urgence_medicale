const admin = require('firebase-admin');
const { envoyerNotificationMiseAJour } = require('./socket/socketHandler');

/**
 * Fonction qui INVERSE les statuts de garde
 * true → false
 * false → true
 * Pour TOUS les types d'établissements
 */
async function inverseGarde(io) {
  console.log(" [INVERSION] Début de l'inversion des statuts de garde pour TOUS les établissements...");

  try {
    const db = admin.firestore();

    // Récupérer TOUS les établissements (sans filtre de type)
    const snapshot = await db.collection('etablissements').get();

    if (snapshot.empty) {
      console.log("Aucun établissement trouvé.");
      return;
    }

    const batch = db.batch();
    let countTrue = 0;
    let countFalse = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      let current = data.isDeGarde;

      // Si le champ n'existe pas encore
      if (current === undefined) current = false;

      const newValue = !current; // inversion

      if (newValue) countTrue++;
      else countFalse++;

      const ref = db.collection('etablissements').doc(doc.id);
      batch.update(ref, {
        isDeGarde: newValue,
        lastUpdate: new Date()
      });
    });

    // Appliquer les changements
    await batch.commit();

    console.log("------------------------------------------------");
    console.log(" Inversion terminée !");
    console.log(`Établissements maintenant en garde : ${countTrue}`);
    console.log(`Établissements maintenant NON en garde : ${countFalse}`);
    console.log("------------------------------------------------");

    // Notifier les mobiles via la fonction dédiée du socketHandler
    envoyerNotificationMiseAJour(io);

  } catch (error) {
    console.error("Erreur lors de l'inversion des statuts :", error);
    throw error; // Important pour gérer les erreurs en amont
  }
}

// Point d'entrée si le fichier est exécuté directement
if (require.main === module) {
  const serviceAccount = require('./chemin/vers/votre/clef-firebase.json'); // Ajustez le chemin

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  inverseGarde()
    .then(() => process.exit(0))
    .catch(error => {
      console.error("Erreur critique :", error);
      process.exit(1);
    });
}

module.exports = { inverseGarde };