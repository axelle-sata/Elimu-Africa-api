const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/elimu_db'
});

async function resetPasswords() {
  const hash = await bcrypt.hash('password', 10);
  const emails = [
    'directeur@sacrecoeur.sn',
    'enseignant@sacrecoeur.sn',
    'parent@sacrecoeur.sn',
    'etudiant@sacrecoeur.sn',
    'comptable@elimu.africa',
    'surveillant@sacrecoeur.sn'
  ];
  for (const email of emails) {
    await pool.query('UPDATE utilisateurs SET password = $1 WHERE email = $2', [hash, email]);
    console.log(`✅ Mot de passe mis à jour pour ${email}`);
  }
  await pool.end();
  console.log('Terminé !');
}

resetPasswords().catch(console.error);
