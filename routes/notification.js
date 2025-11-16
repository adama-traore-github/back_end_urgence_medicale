const express = require('express');
const router = express.Router();

// On importe notre nouveau contrôleur
const { sendGlobalNotification } = require('../controllers/notificationController');


router.post('/send-global', sendGlobalNotification);

module.exports = router;