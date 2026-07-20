const express   = require("express");
const router    = express.Router();
const pool      = require("../db");
const authMidd  = require("../middleware/auth");

// Tous les enseignants
router.get("/", authMidd, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM enseignants ORDER BY nom ASC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Un enseignant par ID
router.get("/:id", authMidd, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM enseignants WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Enseignant non trouvé" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Créer un enseignant
router.post("/", authMidd, async (req, res) => {
  const { nom, matiere, email, telephone, experience, heures_semaine, statut, classes, note } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO enseignants 
        (nom, matiere, email, telephone, experience, heures_semaine, statut, classes, note) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [nom, matiere, email, telephone, experience, heures_semaine, statut, classes, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Modifier un enseignant
router.put("/:id", authMidd, async (req, res) => {
  const { nom, matiere, email, telephone, experience, heures_semaine, statut, classes, note } = req.body;
  try {
    const result = await pool.query(
      `UPDATE enseignants 
       SET nom=$1, matiere=$2, email=$3, telephone=$4, 
           experience=$5, heures_semaine=$6, statut=$7, classes=$8, note=$9 
       WHERE id=$10 
       RETURNING *`,
      [nom, matiere, email, telephone, experience, heures_semaine, statut, classes, note, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Enseignant non trouvé" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Supprimer un enseignant
router.delete("/:id", authMidd, async (req, res) => {
  try {
    await pool.query("DELETE FROM enseignants WHERE id = $1", [req.params.id]);
    res.json({ message: "Enseignant supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;