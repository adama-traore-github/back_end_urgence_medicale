const express = require('express');
const router = express.Router();

const { getAllEtablissements } = require('../controllers/etablissementController');

// On crée la route GET
router.get('/', getAllEtablissements);

module.exports = router;