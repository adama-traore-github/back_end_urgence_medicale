const express = require('express');
const router = express.Router();

// 1. Importer le garde du corps
const authMiddleware = require('../middleware/authMiddleware');
// 2. Importer le cerveau
const { getProfil, updateProfil } = require('../controllers/profilController');

// 3. Définir les routes
// L'utilisateur doit d'abord passer le 'authMiddleware' (garde du corps)
// avant de pouvoir accéder à 'getProfil' ou 'updateProfil'.

// Route pour récupérer le profil
router.get('/', authMiddleware, getProfil);

// Route pour créer/mettre à jour le profil
router.post('/', authMiddleware, updateProfil);

module.exports = router;