const express = require('express');
const router = express.Router();

// 1. Importer le garde du corps
const authMiddleware = require('../middleware/authMiddleware');
const { getProfil, updateProfil } = require('../controllers/profilController');


router.get('/', authMiddleware, getProfil);

router.post('/', authMiddleware, updateProfil);

module.exports = router;