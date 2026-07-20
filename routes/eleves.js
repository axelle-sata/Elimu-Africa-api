const express   = require("express");
const router    = express.Router();
const pool      = require("../db");
const authMidd  = require("../middleware/auth");

// Tous les élèves
router.get("/", authMidd, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM eleves ORDER BY nom ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Un élève par ID
router.get("/:id", authMidd, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM eleves WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Élève non trouvé" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Créer un élève
router.post("/", authMidd, async (req, res) => {
  const { nom, classe, age, parent, telephone } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO eleves (nom, classe, age, parent, telephone) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [nom, classe, age, parent, telephone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Modifier un élève
router.put("/:id", authMidd, async (req, res) => {
  const { nom, classe, age, parent, telephone } = req.body;
  try {
    const result = await pool.query(
      "UPDATE eleves SET nom=$1, classe=$2, age=$3, parent=$4, telephone=$5 WHERE id=$6 RETURNING *",
      [nom, classe, age, parent, telephone, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Supprimer un élève
router.delete("/:id", authMidd, async (req, res) => {
  try {
    await pool.query("DELETE FROM eleves WHERE id = $1", [req.params.id]);
    res.json({ message: "Élève supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;