const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require("./db");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://elimufrica.netlify.app"
  ],
  credentials: true
}));

app.use(express.json());


// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/eleves', require('./routes/eleves'));
app.use("/api/enseignants", require("./routes/enseignants"));
app.use("/api/emploi-du-temps", require("./routes/emploi_du_temps"));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/paiements', require('./routes/paiements'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/cours', require('./routes/cours'));
app.use('/api/abonnements', require('./routes/abonnements'));
app.use('/api/absences', require('./routes/absences'));


// Route principale
app.get('/', (req, res) => {
  res.json({ 
    message: 'Elimu Africa API En ligne!'
  });
});


// Vérification Render
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: "OK" 
  });
});


// Vérifier la connexion à la base et les tables disponibles
app.get('/check-db', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    );

    res.json({
      database: "connectée",
      tables: result.rows
    });

  } catch (err) {
    res.status(500).json({
      database: "erreur",
      error: err.message
    });
  }
});


// Port Render
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('Serveur demarre sur le port ' + PORT);
});