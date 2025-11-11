const express = require('express');
const router = express.Router();

// On importe les controllers qu'on vient de créer
const { registerUser, loginUser } = require('../controllers/authController');

// Route pour l'inscription
router.post('/register', registerUser);

// Route pour la connexion
router.post('/login', loginUser);

// On exporte le routeur
module.exports = router;