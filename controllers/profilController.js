const admin = require('firebase-admin');

/**
 * [GET] /api/profil
 * Récupère le profil de l'utilisateur connecté
 */
const getProfil = async (req, res) => {
  try {
    // 1. On récupère l'UID (fourni par le middleware)
    const uid = req.user.uid;
    const db = admin.firestore();

    // 2. Le document du profil a le MÊME ID que l'utilisateur
    const docRef = db.collection('profils').doc(uid);
    const doc = await docRef.get();

    if (!doc.exists) {
      // C'est normal, l'utilisateur n'a juste pas encore créé son profil
      return res.status(200).send({ message: 'Aucun profil trouvé.' });
    }

    // 4. On renvoie les données du profil
    res.status(200).send(doc.data());

  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).send({ error: 'Erreur interne du serveur.' });
  }
};

/**
 * [POST] /api/profil
 * Crée ou Met à jour le profil (nos 10 champs) de l'utilisateur connecté
 */
const updateProfil = async (req, res) => {
  try {
    // 1. On récupère l'UID (fourni par le middleware)
    const uid = req.user.uid;
    // 2. On récupère les 10 champs (ou moins) envoyés par Flutter
    const data = req.body;
    const db = admin.firestore();

    // 3. On crée la référence au document (profils/mon-uid)
    const docRef = db.collection('profils').doc(uid);

    // 4. On écrit les données.
    // { merge: true } est CRUCIAL :
    // Si l'utilisateur n'envoie que son "nom", on ne supprime pas
    // son "groupeSanguin". On "fusionne" les données.
    await docRef.set(data, { merge: true });

    console.log('Profil mis à jour pour:', uid);
    res.status(200).send({ success: true, message: 'Profil mis à jour' });

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).send({ error: 'Erreur interne du serveur.' });
  }
};

module.exports = {
  getProfil,
  updateProfil
};