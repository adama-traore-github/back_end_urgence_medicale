const admin = require('firebase-admin');

/**
 * Fonction qui INVERSE les statuts de garde
 * true → false
 * false → true
 */
async function inverseGarde(io) {
  console.log(" [INVERSION] Début de l'inversion des statuts de garde...");

  try {
    const db = admin.firestore();

    // Récupérer toutes les pharmacies
    const snapshot = await db.collection('etablissements')
      .where('type', '==', 'pharmacy')
      .get();

    if (snapshot.empty) {
      console.log("Aucune pharmacie trouvée.");
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
    console.log(`Maintenant en garde : ${countTrue}`);
    console.log(`Maintenant NON garde : ${countFalse}`);
    console.log("------------------------------------------------");

    // Notifier les mobiles
    if (io) {
      io.emit('maj_etablissements', {
        message: "Inversion des statuts de garde effectuée.",
        timestamp: new Date()
      });

      console.log(" Événement envoyé via Socket.io");
    }

  } catch (error) {
    console.error("Erreur inversion:", error);
  }
}

module.exports = { inverseGarde };
