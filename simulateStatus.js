const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function simulate() {
  console.log("Démarrage de la SIMULATION (Règle 60% Ouvert / 40% Fermé)...");

  try {
    const snapshot = await db.collection('etablissements').get();

    if (snapshot.empty) {
      console.log("Aucun établissement trouvé.");
      return;
    }

    let count = 0;
    let openCount = 0;
    let closedCount = 0;
    
    const batch = db.batch(); 

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      
     
      // Math.random() génère un chiffre entre 0.0 et 1.0
      // Si < 0.6 (60% de chance), c'est OUVERT.
      // Sinon (40% de chance), c'est FERMÉ.
      const isOpen = Math.random() < 0.6; 

      // On prépare la mise à jour
      const ref = db.collection('etablissements').doc(doc.id);
      batch.update(ref, { 
        isDeGarde: isOpen,
        lastUpdate: new Date()
      });

      if (isOpen) openCount++;
      else closedCount++;
      
      count++;
    });

    // On envoie tout à la base de données
    await batch.commit();

    console.log(`------------------------------------------------`);
    console.log(` SIMULATION TERMINÉE !`);
    console.log(` Total traité : ${count}`);
    console.log(` OUVERTS (60%) : ${openCount}`);
    console.log(` FERMÉS (40%)  : ${closedCount}`);
    console.log(`------------------------------------------------`);

  } catch (error) {
    console.error("Erreur:", error);
  }
}

simulate();

module.exports = { simulate };