import sql from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Proteção simples — só roda com a chave certa
  if (req.query.key !== process.env.JWT_SECRET) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS licenses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'active',
      hotmart_id TEXT,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  res.status(200).json({ ok: true, message: 'Tabelas criadas com sucesso!' });
}
