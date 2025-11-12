require('dotenv').config();

// 1. Imports
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin'); 

// --- IMPORTATION DES GESTIONNAIRES ---
const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notification'); // C'est bon
const initializeSocket = require('./socket/socketHandler'); 

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

// --- LE PONT (MIDDLEWARE) : C'EST L'AJOUT IMPORTANT ---
// On injecte 'io' dans toutes les requêtes pour
// que nos contrôleurs puissent l'utiliser.
app.use((req, res, next) => {
  req.io = io; // 'io' est maintenant disponible dans req.io
  next(); // Passe à la route suivante
});
// --- FIN DE L'AJOUT ---


// --- ROUTES API (REST) ---
// On les place APRÈS le middleware
app.get('/', (req, res) => res.send('Serveur Express est en ligne.'));
app.use('/api', authRoutes);
app.use('/api/notifications', notificationRoutes); // C'est bon

// --- GESTION DES SOCKETS (Temps Réel) ---
initializeSocket(io); // On délègue toujours le travail

// --- DÉMARRAGE ---
server.listen(PORT, () => {
  console.log(`🚀 Le serveur écoute sur http://localhost:${PORT}`);
});