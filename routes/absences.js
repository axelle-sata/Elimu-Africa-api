const express  = require("express");
const router   = express.Router();
const pool     = require("../db");
const authMidd = require("../middleware/auth");

// GET toutes les absences avec nom et classe de l'élève
router.get("/", authMidd, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, e.nom as eleve_nom, e.classe, e.telephone, e.parent
      FROM absences a
      LEFT JOIN eleves e ON a.eleve_id = e.id
      ORDER BY a.date DESC, a.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// GET absences par jour
router.get("/jour/:date", authMidd, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, e.nom as eleve_nom, e.classe, e.telephone, e.parent
      FROM absences a
      LEFT JOIN eleves e ON a.eleve_id = e.id
      WHERE a.date = $1
      ORDER BY a.created_at DESC
    `, [req.params.date]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// GET stats absences par élève
router.get("/stats-eleves", authMidd, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        e.nom, e.classe, e.telephone, e.parent,
        COUNT(*) as total_absences,
        COUNT(CASE WHEN a.justifie = TRUE  THEN 1 END) as nb_justifiees,
        COUNT(CASE WHEN a.justifie = FALSE THEN 1 END) as nb_non_justifiees
      FROM absences a
      LEFT JOIN eleves e ON a.eleve_id = e.id
      GROUP BY e.id, e.nom, e.classe, e.telephone, e.parent
      ORDER BY total_absences DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// POST enregistrer un pointage (tableau d'absents)
router.post("/pointage", authMidd, async (req, res) => {
  const { date, classe, absents } = req.body;

  if (!date || !classe) {
    return res.status(400).json({ message: "Date et classe obligatoires" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Supprimer les anciennes absences de cette classe pour ce jour
    await client.query(`
      DELETE FROM absences
      WHERE date = $1
        AND eleve_id IN (
          SELECT id FROM eleves WHERE classe = $2
        )
    `, [date, classe]);

    // Insérer les nouvelles absences
    if (Array.isArray(absents) && absents.length > 0) {
      for (const absent of absents) {
        const justifie = absent.motif === "autorise" || absent.motif === "maladie";
        await client.query(`
          INSERT INTO absences (eleve_id, date, motif, justifie)
          VALUES ($1, $2, $3, $4)
        `, [absent.eleve_id, date, absent.motif || "non_justifie", justifie]);
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Pointage enregistré", nb_absents: absents?.length || 0 });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  } finally {
    client.release();
  }
});

// DELETE supprimer une absence
router.delete("/:id", authMidd, async (req, res) => {
  try {
    await pool.query("DELETE FROM absences WHERE id = $1", [req.params.id]);
    res.json({ message: "Absence supprimée" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;