const express  = require("express");
const router   = express.Router();
const pool     = require("../db");
const authMidd = require("../middleware/auth");

// Notes d un eleve
router.get("/eleve/:id", authMidd, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM notes WHERE eleve_id = $1 ORDER BY matiere ASC",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Notes de toute une classe
router.get("/classe/:classe", authMidd, async (req, res) => {
  try {
    const sql = "SELECT n.*, e.nom as eleve_nom, e.classe FROM notes n JOIN eleves e ON n.eleve_id = e.id WHERE e.classe = $1 ORDER BY e.nom ASC, n.matiere ASC";
    const result = await pool.query(sql, [req.params.classe]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Toutes les notes
router.get("/", authMidd, async (req, res) => {
  try {
    const sql = "SELECT n.*, e.nom as eleve_nom, e.classe FROM notes n JOIN eleves e ON n.eleve_id = e.id ORDER BY e.classe ASC, e.nom ASC, n.matiere ASC";
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Ajouter ou modifier une note (upsert)
router.post("/", authMidd, async (req, res) => {
  const { eleve_id, matiere, note, trimestre, appreciation } = req.body;
  try {
    const sql = "INSERT INTO notes (eleve_id, matiere, note, trimestre, appreciation) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (eleve_id, matiere, trimestre) DO UPDATE SET note=$3, appreciation=$5 RETURNING *";
    const result = await pool.query(sql, [eleve_id, matiere, note, trimestre || 1, appreciation || ""]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Modifier une note par ID
router.put("/:id", authMidd, async (req, res) => {
  const { note, appreciation } = req.body;
  try {
    const result = await pool.query(
      "UPDATE notes SET note=$1, appreciation=$2 WHERE id=$3 RETURNING *",
      [note, appreciation || "", req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Supprimer une note
router.delete("/:id", authMidd, async (req, res) => {
  try {
    await pool.query("DELETE FROM notes WHERE id = $1", [req.params.id]);
    res.json({ message: "Note supprimee" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;
