const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Routes
app.use("/api/auth",         require("./routes/auth"));
app.use("/api/eleves",       require("./routes/eleves"));
app.use("/api/notes",        require("./routes/notes"));
app.use("/api/paiements",    require("./routes/paiements"));
app.use("/api/messages",     require("./routes/messages"));
app.use("/api/cours",        require("./routes/cours"));
app.use("/api/abonnements",  require("./routes/abonnements"));
app.use("/api/absences",     require("./routes/absences"));
app.use("/api/enseignants",  require("./routes/enseignants"));

// Route test
app.get("/", (req, res) => {
  res.json({ message: "🌍 Elimu Africa API — En ligne !" });
});

// Démarrage
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur demarre sur http://localhost:${PORT}`);
});