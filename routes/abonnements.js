const express  = require("express");
const router   = express.Router();
const pool     = require("../db");
const authMidd = require("../middleware/auth");

// Tous les abonnements
router.get("/", authMidd, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM abonnements ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Créer un abonnement
router.post("/", authMidd, async (req, res) => {
  const { ecole_nom, plan, montant, mode_paiement } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO abonnements (ecole_nom, plan, montant, mode_paiement, date_prochaine_facture)
       VALUES ($1, $2, $3, $4, CURRENT_DATE + INTERVAL '30 days') RETURNING *`,
      [ecole_nom, plan, montant, mode_paiement]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Modifier le statut d'un abonnement
router.put("/:id/statut", authMidd, async (req, res) => {
  const { statut } = req.body;
  try {
    const result = await pool.query(
      "UPDATE abonnements SET statut = $1 WHERE id = $2 RETURNING *",
      [statut, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;