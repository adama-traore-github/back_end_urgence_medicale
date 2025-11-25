

const admin = require('firebase-admin');
const fs = require('fs'); 

// 1. Initialiser Firebase Admin (comme dans server.js)
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 2. Récupérer la base de données
const db = admin.firestore();

// 3. Lire notre fichier data.json
const rawData = fs.readFileSync('data.json');
const data = JSON.parse(rawData);

const collectionRef = db.collection('etablissements');

/**
 * Fonction principale pour uploader les données
 */
async function upload() {
  console.log(`Lecture de ${data.elements.length} éléments depuis data.json...`);

  // On utilise un "Batch" pour tout envoyer d'un coup (beaucoup plus rapide)
  let batch = db.batch();
  let count = 0;

  for (const element of data.elements) {
    if (element.type === 'node' && element.tags) {
      // 4. On récupère les données qui nous intéressent
      const type = element.tags.amenity; // "pharmacy", "hospital", "clinic"
      const nom = element.tags.name;
      const lat = element.lat;
      const lon = element.lon;

      // 5. On vérifie que c'est bien ce qu'on cherche
      if ((type === 'pharmacy' || type === 'hospital' || type === 'clinic') && nom) {
        
        // 6. On prépare le document pour Firestore
        const docRef = collectionRef.doc(); // Crée un nouvel ID auto
        
        const documentData = {
          nom: nom,
          type: type,
          // On utilise le type Geopoint de Firestore
          position: new admin.firestore.GeoPoint(lat, lon), 
          // On ajoute le 'telephone' s'il existe (bonus)
          telephone: element.tags.phone || null 
        };

        // 7. On ajoute l'opération au "batch"
        batch.set(docRef, documentData);
        count++;

        // Un batch ne peut contenir que 500 opérations.
        // On envoie le batch tous les 400 documents.
        if (count > 0 && count % 400 === 0) {
          console.log(`Envoi du batch de ${count} documents...`);
          await batch.commit();
          // On crée un nouveau batch
          batch = db.batch();
        }
      }
    }
  }

  // 8. On envoie le dernier batch (ce qui reste)
  if (count % 400 !== 0) {
    console.log(`Envoi du batch final de ${count % 400} documents...`);
    await batch.commit();
  }

  console.log(`Terminé ! ${count} établissements ont été uploadés dans Firestore.`);
}

// 9. On lance le script
upload().catch(console.error);