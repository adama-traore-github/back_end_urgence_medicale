const express = require('express');
const router = express.Router();

// On importe notre nouveau contrôleur
const { sendGlobalNotification } = require('../controllers/notificationController');

// On crée la route POST
// (Plus tard, on ajoutera un middleware de sécurité ici pour la protéger)
router.post('/send-global', sendGlobalNotification);

module.exports = router;