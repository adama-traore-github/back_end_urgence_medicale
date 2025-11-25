const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); 

// 1. Initialisation de Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const COLLECTION_NAME = 'etablissements'; 

async function seedPhones() {
  try {
    console.log(' Récupération des documents...');
    
    // On récupère tous les établissements
    const snapshot = await db.collection(COLLECTION_NAME).get();

    if (snapshot.empty) {
      console.log(' Aucune donnée trouvée dans la collection.');
      return;
    }

    console.log(` Analyse de ${snapshot.size} documents...`);

    
    let updatedCount = 0;
    let ignoredCount = 0;
    let preservedCount = 0;

    const updates = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const phone = data.telephone; 

      if (phone && phone !== '' && phone !== '00000000') {
        preservedCount++;
        return; 
      }

      
      if (Math.random() < 0.1) {
        const updatePromise = doc.ref.update({ telephone: '00000000' });
        updates.push(updatePromise);
        updatedCount++;
      } else {
        
        ignoredCount++;
      }
    });

    console.log(`⏳ Écriture de ${updates.length} mises à jour...`);
    await Promise.all(updates);

    console.log('-----------------------------------');
    console.log(' TERMINÉ ! Résultat du script :');
    console.log(` ${updatedCount} établissements ont reçu "00000000".`);
    console.log(` ${ignoredCount} établissements laissés sans numéro .`);
    console.log(` ${preservedCount} vrais numéros préservés .`);
    console.log('-----------------------------------');

  } catch (error) {
    console.error(' Erreur :', error);
  } finally {
    
  }
}

seedPhones();