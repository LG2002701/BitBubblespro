const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sql = neon(process.env.DATABASE_URL);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha obrigatorios' });
  }

  const users = await sql`
    SELECT u.id, u.email, u.password_hash, l.status, l.expires_at
    FROM users u
    JOIN licenses l ON l.user_id = u.id
    WHERE u.email = ${email}
    ORDER BY l.created_at DESC
    LIMIT 1
  `;

  const user = users[0];
  if (!user) return res.status(401).json({ error: 'Email ou senha incorretos' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Email ou senha incorretos' });

  if (user.status !== 'active') return res.status(403).json({ error: 'Licenca inativa' });
  if (new Date(user.expires_at) < new Date()) return res.status(403).json({ error: 'Licenca expirada' });

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(200).json({ token });
}
