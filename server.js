require('dotenv').config();

// 1. Imports
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin'); 
const cron = require('node-cron'); 

// --- IMPORTATION DES GESTIONNAIRES ---
const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notification');
const etablissementRoutes = require('./routes/etablissement');
const profilRoutes = require('./routes/profil');
const initializeSocket = require('./socket/socketHandler'); 

// --- IMPORTATION DU SERVICE DE MISE À JOUR (Le Robot) ---
const { inverseGarde } = require('./statusUpdater'); 

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

// --- LE PONT (MIDDLEWARE REST) ---
// Injecte 'io' dans les requêtes API (pour les contrôleurs)
app.use((req, res, next) => {
  req.io = io; 
  next(); 
});


// --- ROUTES API (REST) ---
app.get('/', (req, res) => res.send('Serveur Express est en ligne.'));
app.use('/api', authRoutes);
app.use('/api/notifications', notificationRoutes); 
app.use('/api/etablissements', etablissementRoutes);
app.use('/api/profil', profilRoutes);


// --- GESTION DES SOCKETS (Temps Réel) ---

// 3. LE "GARDE DU CORPS" SOCKET.IO
// Il laisse passer tout le monde, mais il "tag" les utilisateurs
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (token) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      socket.user = decodedToken; 
      console.log(`Auth Socket: Connexion authentifiée (UID: ${decodedToken.uid})`);
    } catch (error) {
      console.log("Auth Socket: Connexion anonyme (token invalide).");
      socket.user = null; 
    }
  } else {
    console.log("Auth Socket: Connexion anonyme.");
    socket.user = null; 
  }
  
  next(); 
});

// On lance le gestionnaire des événements (Chat, Alerte, etc.)
initializeSocket(io); 


// --- TÂCHE PLANIFIÉE (CRON JOB) ---
// S'exécute toutes les 5 minutes pour simuler le changement de gardes
// cron.schedule('*/5 * * * *', () => {
//   console.log('⏰ CRON 5min: Lancement de l\'inversion des gardes...');
//   // On appelle la fonction d'inversion et on passe 'io' pour prévenir les mobiles
//   inverseGarde(io);
// });


// --- DÉMARRAGE ---
server.listen(PORT, () => {
  console.log(`🚀 Le serveur écoute sur http://localhost:${PORT}`);
  
  // Optionnel: Lancer une inversion au démarrage pour tester tout de suite
  // inverseGarde(io);
});