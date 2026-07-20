const express  = require("express");
const router   = express.Router();
const pool     = require("../db");
const authMidd = require("../middleware/auth");

// Tous les paiements avec infos élève complètes
router.get("/", authMidd, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, e.nom as eleve_nom, e.classe, e.age, e.parent, e.telephone
      FROM paiements p
      LEFT JOIN eleves e ON p.eleve_id = e.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Frais par classe (montants annuels)
router.get("/frais-classe", authMidd, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM frais_classe ORDER BY classe");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Situation financière de tous les élèves (payé / dû / reste)
router.get("/situation", authMidd, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.id as eleve_id,
        e.nom,
        e.age,
        e.classe,
        e.parent,
        e.telephone,
        COALESCE(f.montant_annuel, 0) as montant_du,
        COALESCE(SUM(p.montant), 0) as montant_paye,
        COALESCE(f.montant_annuel, 0) - COALESCE(SUM(p.montant), 0) as reste_a_payer
      FROM eleves e
      LEFT JOIN frais_classe f ON f.classe = e.classe
      LEFT JOIN paiements p ON p.eleve_id = e.id
      GROUP BY e.id, e.nom, e.age, e.classe, e.parent, e.telephone, f.montant_annuel
      ORDER BY e.nom ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Stats mensuelles (revenus par mois)
router.get("/stats-mensuelles", authMidd, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM created_at) as mois,
        EXTRACT(YEAR FROM created_at) as annee,
        SUM(montant) as total,
        COUNT(*) as nb_paiements
      FROM paiements
      GROUP BY annee, mois
      ORDER BY annee DESC, mois DESC
      LIMIT 12
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Stats par mode de paiement
router.get("/stats-mode", authMidd, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        mode,
        COUNT(*) as nb,
        SUM(montant) as total
      FROM paiements
      GROUP BY mode
      ORDER BY total DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Créer un paiement (avec tranche)
router.post("/", authMidd, async (req, res) => {
  const { eleve_id, montant, mode, trimestre } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO paiements (eleve_id, montant, mode, trimestre)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [eleve_id, montant, mode, trimestre || 1]
    );
    const eleve = await pool.query("SELECT * FROM eleves WHERE id = $1", [eleve_id]);
    res.status(201).json({ ...result.rows[0], eleve: eleve.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Historique des paiements d'un élève spécifique
router.get("/eleve/:id", authMidd, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM paiements WHERE eleve_id = $1 ORDER BY created_at DESC",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;