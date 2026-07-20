const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMidd = require("../middleware/auth");

// 🔥 TEST ROUTE (IMPORTANT)
router.get("/test", (req, res) => {
  res.json({ ok: true, message: "messages route OK" });
});

// 🔹 GET MESSAGES
router.get("/", authMidd, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*,
        u1.nom as expediteur_nom,
        u2.nom as destinataire_nom
       FROM messages m
       LEFT JOIN utilisateurs u1 ON m.expediteur_id = u1.id
       LEFT JOIN utilisateurs u2 ON m.destinataire_id = u2.id
       WHERE m.destinataire_id = $1 OR m.expediteur_id = $1
       ORDER BY m.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 UTILISATEURS
router.get("/utilisateurs", authMidd, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nom, role FROM utilisateurs WHERE id != $1",
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 ENVOYER MESSAGE
router.post("/", authMidd, async (req, res) => {
  const { destinataire_id, sujet, contenu } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO messages (expediteur_id, destinataire_id, sujet, contenu)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, destinataire_id, sujet, contenu]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 MARQUER COMME LU
router.put("/:id/lu", authMidd, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE messages SET lu = TRUE WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;