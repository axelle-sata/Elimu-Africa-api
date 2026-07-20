const express  = require("express");
const router   = express.Router();
const pool     = require("../db");
const authMidd = require("../middleware/auth");

// ── Tous les cours ───────────────────────────────────────────────────────────
router.get("/", authMidd, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.nom as enseignant_nom,
        COUNT(DISTINCT l.id) as nb_lecons
      FROM cours c
      LEFT JOIN utilisateurs u ON c.enseignant_id = u.id
      LEFT JOIN lecons l ON l.cours_id = c.id
      WHERE c.publie = TRUE
      GROUP BY c.id, u.nom
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Progression de tous les élèves (directeur)
router.get("/progression/tous", authMidd, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        c.titre as cours_titre,
        c.matiere,
        l.titre as lecon_titre,
        u.nom as eleve_nom,
        e.classe
      FROM progression p
      JOIN cours c ON p.cours_id = c.id
      JOIN lecons l ON p.lecon_id = l.id
      JOIN utilisateurs u ON p.eleve_id = u.id
      LEFT JOIN eleves e ON e.nom = u.nom
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Stats progression par cours
router.get("/progression/stats", authMidd, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.titre,
        c.matiere,
        c.classe,
        COUNT(DISTINCT p.eleve_id) as nb_eleves,
        COUNT(DISTINCT p.lecon_id) as nb_lecons_completees,
        ROUND(AVG(p.score), 1) as score_moyen,
        COUNT(CASE WHEN p.termine = TRUE THEN 1 END) as nb_terminees
      FROM cours c
      LEFT JOIN progression p ON p.cours_id = c.id
      GROUP BY c.id, c.titre, c.matiere, c.classe
      ORDER BY nb_eleves DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Sauvegarder la progression ───────────────────────────────────────────────
router.post("/progression", authMidd, async (req, res) => {
  const { cours_id, lecon_id, termine, score } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO progression (eleve_id, cours_id, lecon_id, termine, score)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (eleve_id, lecon_id)
       DO UPDATE SET termine=$4, score=$5
       RETURNING *`,
      [req.user.id, cours_id, lecon_id, termine || false, score || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Créer un exercice ────────────────────────────────────────────────────────
router.post("/exercices", authMidd, async (req, res) => {
  const { lecon_id, question, choix_a, choix_b, choix_c, choix_d, bonne_reponse, explication } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO exercices (lecon_id, question, choix_a, choix_b, choix_c, choix_d, bonne_reponse, explication)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [lecon_id, question, choix_a, choix_b, choix_c, choix_d, bonne_reponse, explication]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Leçon avec exercices ─────────────────────────────────────────────────────
router.get("/lecon/:id", authMidd, async (req, res) => {
  try {
    const lecon = await pool.query(
      "SELECT * FROM lecons WHERE id = $1",
      [req.params.id]
    );
    if (lecon.rows.length === 0)
      return res.status(404).json({ message: "Leçon non trouvée" });

    const exercices = await pool.query(
      "SELECT * FROM exercices WHERE lecon_id = $1",
      [req.params.id]
    );

    res.json({ ...lecon.rows[0], exercices: exercices.rows });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Un cours par ID avec ses leçons ─────────────────────────────────────────
router.get("/:id", authMidd, async (req, res) => {
  try {
    const cours = await pool.query(
      `SELECT c.*, u.nom as enseignant_nom
       FROM cours c
       LEFT JOIN utilisateurs u ON c.enseignant_id = u.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (cours.rows.length === 0)
      return res.status(404).json({ message: "Cours non trouvé" });

    const lecons = await pool.query(
      "SELECT * FROM lecons WHERE cours_id = $1 ORDER BY ordre ASC",
      [req.params.id]
    );

    // Charger les exercices pour chaque leçon
    const leconsAvecExercices = await Promise.all(
      lecons.rows.map(async (l) => {
        const exercices = await pool.query(
          "SELECT * FROM exercices WHERE lecon_id = $1",
          [l.id]
        );
        return { ...l, exercices: exercices.rows };
      })
    );

    res.json({ ...cours.rows[0], lecons: leconsAvecExercices });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Créer un cours ───────────────────────────────────────────────────────────
router.post("/", authMidd, async (req, res) => {
  const { titre, description, matiere, classe, niveau, duree_minutes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO cours (titre, description, matiere, classe, enseignant_id, niveau, duree_minutes, publie)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE) RETURNING *`,
      [titre, description, matiere, classe, req.user.id, niveau || "debutant", duree_minutes || 30]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Créer une leçon ──────────────────────────────────────────────────────────
router.post("/:id/lecons", authMidd, async (req, res) => {
  const { titre, contenu, ordre, duree_minutes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO lecons (cours_id, titre, contenu, ordre, duree_minutes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, titre, contenu, ordre || 1, duree_minutes || 10]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;