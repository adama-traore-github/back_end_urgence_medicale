const admin = require('firebase-admin');
const axios = require('axios');

// Récupère la clé API depuis les variables d'environnement
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY;

/**
 * [POST] /api/register
 * Crée un nouvel utilisateur
 */
const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

    console.log('Utilisateur créé:', userRecord.uid);
    res.status(201).send({ uid: userRecord.uid, email: userRecord.email });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(400).send({ error: error.message });
  }
};

/**
 * [POST] /api/login
 * Connecte un utilisateur
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`,
      {
        email: email,
        password: password,
        returnSecureToken: true
      }
    );

    const { idToken, localId } = response.data; // idToken = JWT
    console.log('Utilisateur connecté:', localId);
    res.status(200).send({ uid: localId, token: idToken });

  } catch (error) {
    console.error('Erreur connexion:', error.response?.data?.error || error.message);
    res.status(401).send({ error: "Email ou mot de passe invalide" });
  }
};

// On exporte les fonctions pour les utiliser dans les routes
module.exports = {
  registerUser,
  loginUser
};