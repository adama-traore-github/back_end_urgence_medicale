require('dotenv').config();

// 1. Imports
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin'); 

// --- IMPORTATION DES GESTIONNAIRES ---
const authRoutes = require('./routes/auth');
const initializeSocket = require('./socket/socketHandler'); // <-- NOUVEAU

// 2. Initialisations
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json()); 

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = 3000;

// --- ROUTES API (REST) ---
app.get('/', (req, res) => res.send('Serveur Express est en ligne.'));
app.use('/api', authRoutes);

// --- GESTION DES SOCKETS (Temps Réel) ---
initializeSocket(io); // <-- ON DÉLÈGUE TOUT LE TRAVAIL

// --- DÉMARRAGE ---
server.listen(PORT, () => {
  console.log(`🚀 Le serveur écoute sur http://localhost:${PORT}`);
});