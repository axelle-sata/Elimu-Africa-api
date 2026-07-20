const express   = require("express");
const router    = express.Router();
const pool      = require("../db");
const authMidd  = require("../middleware/auth");

router.get("/", authMidd, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM emploi_du_temps 
       ORDER BY 
         CASE jour 
           WHEN 'Lundi'    THEN 1 
           WHEN 'Mardi'    THEN 2 
           WHEN 'Mercredi' THEN 3 
           WHEN 'Jeudi'    THEN 4 
           WHEN 'Vendredi' THEN 5 
         END, heure ASC, classe ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.post("/", authMidd, async (req, res) => {
  const { jour, heure, matiere, classe, salle, prof, color } = req.body;
  try {
    // Vérifier conflit prof
    const conflitProf = await pool.query(
      "SELECT id FROM emploi_du_temps WHERE jour=$1 AND heure=$2 AND prof=$3",
      [jour, heure, prof]
    );
    if (conflitProf.rows.length > 0)
      return res.status(409).json({ message: `${prof} a déjà un cours le ${jour} à ${heure}.` });

    // Vérifier conflit classe
    const conflitClasse = await pool.query(
      "SELECT id FROM emploi_du_temps WHERE jour=$1 AND heure=$2 AND classe=$3",
      [jour, heure, classe]
    );
    if (conflitClasse.rows.length > 0)
      return res.status(409).json({ message: `La classe ${classe} a déjà un cours le ${jour} à ${heure}.` });

    // Vérifier conflit salle
    const conflitSalle = await pool.query(
      "SELECT id FROM emploi_du_temps WHERE jour=$1 AND heure=$2 AND salle=$3",
      [jour, heure, salle]
    );
    if (conflitSalle.rows.length > 0)
      return res.status(409).json({ message: `La salle ${salle} est déjà occupée le ${jour} à ${heure}.` });

    const result = await pool.query(
      `INSERT INTO emploi_du_temps (jour, heure, matiere, classe, salle, prof, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [jour, heure, matiere, classe, salle, prof, color || "#60A5FA"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.put("/:id", authMidd, async (req, res) => {
  const { jour, heure, matiere, classe, salle, prof, color } = req.body;
  const id = req.params.id;
  try {
    const conflitProf = await pool.query(
      "SELECT id FROM emploi_du_temps WHERE jour=$1 AND heure=$2 AND prof=$3 AND id!=$4",
      [jour, heure, prof, id]
    );
    if (conflitProf.rows.length > 0)
      return res.status(409).json({ message: `${prof} a déjà un cours le ${jour} à ${heure}.` });

    const conflitClasse = await pool.query(
      "SELECT id FROM emploi_du_temps WHERE jour=$1 AND heure=$2 AND classe=$3 AND id!=$4",
      [jour, heure, classe, id]
    );
    if (conflitClasse.rows.length > 0)
      return res.status(409).json({ message: `La classe ${classe} a déjà un cours le ${jour} à ${heure}.` });

    const conflitSalle = await pool.query(
      "SELECT id FROM emploi_du_temps WHERE jour=$1 AND heure=$2 AND salle=$3 AND id!=$4",
      [jour, heure, salle, id]
    );
    if (conflitSalle.rows.length > 0)
      return res.status(409).json({ message: `La salle ${salle} est déjà occupée le ${jour} à ${heure}.` });

    const result = await pool.query(
      `UPDATE emploi_du_temps 
       SET jour=$1, heure=$2, matiere=$3, classe=$4, salle=$5, prof=$6, color=$7
       WHERE id=$8 RETURNING *`,
      [jour, heure, matiere, classe, salle, prof, color, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Cours non trouvé" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.delete("/:id", authMidd, async (req, res) => {
  try {
    await pool.query("DELETE FROM emploi_du_temps WHERE id=$1", [req.params.id]);
    res.json({ message: "Cours supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

module.exports = router;