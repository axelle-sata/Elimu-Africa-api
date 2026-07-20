const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://elimufrica.netlify.app"
  ],
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/eleves', require('./routes/eleves'));
app.use("/api/enseignants", require('./routes/enseignants'));
app.use("/api/emploi-du-temps", require('./routes/emploi_du_temps'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/paiements', require('./routes/paiements'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/cours', require('./routes/cours'));
app.use('/api/abonnements', require('./routes/abonnements'));
app.use('/api/absences', require('./routes/absences'));


app.get('/', (req, res) => {
  res.json({ message: 'Elimu Africa API En ligne!' });
});

// Route utilisée par Render pour vérifier que l'API fonctionne
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: "OK" });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('Serveur demarre sur le port ' + PORT);
});