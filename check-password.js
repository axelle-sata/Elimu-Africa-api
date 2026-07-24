const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/elimu_db'
});

async function check() {
  const result = await pool.query(
    "SELECT email, password FROM utilisateurs WHERE email = 'directeur@sacrecoeur.sn'"
  );
  const user = result.rows[0];
  console.log("Email:", user.email);
  console.log("Hash:", user.password);
  const match = await bcrypt.compare('password', user.password);
  console.log("Match avec 'password':", match);
  await pool.end();
}

check().catch(console.error);
