const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const sendWelcomeEmail = require('../../lib/email.js');

const sql = neon(process.env.DATABASE_URL);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  
  const { data } = req.body;
  const email = data?.buyer?.email;
  if (!email) return res.status(400).json({ error: 'Email nao encontrado' });

  const senha = Math.random().toString(36).slice(-8).toUpperCase();
  const hash = await bcrypt.hash(senha, 10);

  const users = await sql`
    INSERT INTO users (email, password_hash)
    VALUES (${email}, ${hash})
    ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}
    RETURNING id
  `;

  const user = users[0];

  await sql`
    INSERT INTO licenses (user_id, status, hotmart_id, expires_at)
    VALUES (
      ${user.id},
      'active',
      ${data?.purchase?.transaction},
      NOW() + INTERVAL '1 year'
    )
  `;

  await sendWelcomeEmail(email, senha);

  res.status(200).json({ ok: true });
}
