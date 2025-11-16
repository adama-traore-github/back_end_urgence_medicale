require('dotenv').config();

// 1. Imports
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin'); 

// --- IMPORTATION DES GESTIONNAIRES ---
const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notification');
const etablissementRoutes = require('./routes/etablissement');
const profilRoutes = require('./routes/profil');
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

// --- 3. LE "GARDE DU CORPS" SOCKET.IO (MIS À JOUR) ---
// Il laisse passer tout le monde, mais il "tag" les utilisateurs
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (token) {
    // Un token est fourni. On essaie de le vérifier.
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      socket.user = decodedToken; // Utilisateur authentifié
      console.log(`Auth Socket: Connexion authentifiée (UID: ${decodedToken.uid})`);
    } catch (error) {
      // Token fourni mais invalide (expiré, faux...)
      console.log("Auth Socket: Connexion anonyme (token invalide).");
      socket.user = null; // Traité comme anonyme
    }
  } else {
    // Pas de token fourni.
    console.log("Auth Socket: Connexion anonyme.");
    socket.user = null; // Traité comme anonyme
  }
  
  next(); // <-- ON LAISSE TOUJOURS PASSER
});
// --- FIN DE LA MODIFICATION ---
// --- FIN DU BLOC ---

// On délègue le reste du travail (les 'socket.on') au handler
initializeSocket(io); 

// --- DÉMARRAGE ---
server.listen(PORT, () => {
  console.log(`🚀 Le serveur écoute sur http://localhost:${PORT}`);
});