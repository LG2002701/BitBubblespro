import sql from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Proteção — chave dedicada, separada do JWT_SECRET
  if (req.query.key !== process.env.SETUP_KEY) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      failed_attempts INTEGER DEFAULT 0,
      locked_until TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Migração: garante as colunas novas mesmo se a tabela já existia antes
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP`;

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

  res.status(200).json({ ok: true, message: 'Tabelas criadas/atualizadas com sucesso!' });
}
