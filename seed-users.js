const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:123456@localhost:5432/elimu_db",
});

const users = [
  "directeur@sacrecoeur.sn",
  "enseignant@sacrecoeur.sn",
  "parent@sacrecoeur.sn",
  "etudiant@sacrecoeur.sn",
  "comptable@elimu.africa",
  "surveillant@sacrecoeur.sn",
];

const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD || "password";

async function seedPasswords() {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const result = await pool.query(
    "UPDATE utilisateurs SET password = $1 WHERE email = ANY($2)",
    [hash, users]
  );

  console.log(`✅ Mots de passe mis à jour pour ${result.rowCount} utilisateur(s).`);

  if (result.rowCount !== users.length) {
    const found = await pool.query(
      "SELECT email FROM utilisateurs WHERE email = ANY($1)",
      [users]
    );

    const foundEmails = new Set(found.rows.map((row) => row.email));
    const missing = users.filter((email) => !foundEmails.has(email));

    if (missing.length > 0) {
      console.warn(
        "⚠️ Ces emails n'ont pas été trouvés dans la table utilisateurs :",
        missing.join(", ")
      );
    }
  }
}

seedPasswords()
  .catch((err) => {
    console.error("❌ Erreur lors de la mise à jour des mots de passe :", err.message);
    process.exit(1);
  })
  .finally(() => pool.end());
