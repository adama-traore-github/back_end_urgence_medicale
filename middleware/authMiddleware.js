const admin = require('firebase-admin');

/**
 * Middleware de sécurité (le "garde du corps").
 * Il vérifie le Token (JWT) envoyé par Flutter.
 * S'il est valide, il attache l'UID de l'utilisateur à 'req.user'
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Vérifier si le header "Authorization" existe
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ error: 'Accès non autorisé. Token manquant.' });
  }

  // 2. Extraire le token
  const idToken = authHeader.split(' ')[1];

  try {
    // 3. Vérifier le token auprès de Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // 4. Le token est valide ! On attache l'UID au 'req'
    req.user = decodedToken; // On attache les infos (surtout req.user.uid)
    
    // 5. On passe au contrôleur (getProfil / updateProfil)
    next();

  } catch (error) {
    // 6. Le token est invalide
    console.error('Erreur de vérification du token:', error);
    return res.status(401).send({ error: 'Accès non autorisé. Token invalide.' });
  }
};

module.exports = authMiddleware;