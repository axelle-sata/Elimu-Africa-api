const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require("./db");

const app = express();


// =======================
// CORS
// =======================

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://elimufrica.netlify.app"
  ],
  credentials: true
}));

app.use(express.json());


// =======================
// ROUTES API
// =======================

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


// =======================
// ACCUEIL API
// =======================

app.get('/', (req, res) => {
  res.json({
    message: "Elimu Africa API En ligne!"
  });
});


// =======================
// HEALTH CHECK RENDER
// =======================

app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: "OK"
  });
});


// =======================
// VERIFICATION POSTGRESQL
// =======================

app.get('/check-db', async (req, res) => {

  try {

    const connexion = await pool.query(
      "SELECT current_database(), current_user, inet_server_addr();"
    );


    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
    );


    res.json({

      database: "connectée",

      connexion: connexion.rows,

      tables: tables.rows

    });


  } catch (err) {

    res.status(500).json({

      database: "erreur",

      error: err.message

    });

  }

});


// =======================
// START SERVER
// =======================

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {

  console.log("Serveur demarre sur le port " + PORT);

});