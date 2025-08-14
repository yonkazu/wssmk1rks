const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Boleh batasi origin setelah client live
const allowOrigin = process.env.ALLOW_ORIGIN || '*';
app.use(cors({ origin: allowOrigin }));

// Koneksi ke Postgres via DATABASE_URL
// Render akan menyediakan URL DB; gunakan SSL bila perlu
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'require' ? { rejectUnauthorized: false } : undefined
});

// Buat tabel & seed data jika kosong (otomatis saat start)
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      studentid VARCHAR(40) PRIMARY KEY,
      fullname  VARCHAR(50),
      major     VARCHAR(50)
    );
  `);
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM students;');
  if (rows[0].count === 0) {
    await pool.query(`
      INSERT INTO students (studentid, fullname, major) VALUES
      ('S-001', 'Ani',   'Informatika'),
      ('S-002', 'Budi',  'Teknik Elektro'),
      ('S-003', 'Citra', 'Matematika');
    `);
  }
}

// Endpoint sederhana
app.get('/', (req, res) => res.send('API OK'));
app.get('/students', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM students ORDER BY studentid;');
  res.json(rows);
});

// Wajib listen ke PORT dari environment (Render menyediakannya)
const port = process.env.PORT || 3000;

initDb()
  .then(() => {
    app.listen(port, () => console.log(`API running on ${port}`));
  })
  .catch((err) => {
    console.error('DB init failed', err);
    process.exit(1);
  });
