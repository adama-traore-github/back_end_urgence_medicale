const admin = require('firebase-admin');

/**
 * [GET] /api/etablissements
 * Récupère la liste de tous les établissements (hôpitaux, pharmacies, etc.)
 */
const getAllEtablissements = async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('etablissements').get();

    if (snapshot.empty) {
      return res.status(200).send([]); // Renvoie une liste vide
    }

    // On transforme les documents en une liste propre
    const etablissements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).send(etablissements);

  } catch (error) {
    console.error('Erreur récupération établissements:', error);
    res.status(500).send({ error: 'Erreur interne du serveur.' });
  }
};

module.exports = {
  getAllEtablissements
};