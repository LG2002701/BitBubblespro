import sql from '../../lib/db.js';
import bcrypt from 'bcryptjs';
import { signToken } from '../../lib/jwt.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha obrigatórios' });
  }

  // Busca usuário
  const [user] = await sql`
    SELECT u.id, u.email, u.password_hash, l.status, l.expires_at
    FROM users u
    JOIN licenses l ON l.user_id = u.id
    WHERE u.email = ${email}
    ORDER BY l.created_at DESC
    LIMIT 1
  `;

  if (!user) return res.status(401).json({ error: 'Email ou senha incorretos' });

  // Verifica senha
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Email ou senha incorretos' });

  // Verifica licença
  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Licença inativa' });
  }
  if (new Date(user.expires_at) < new Date()) {
    return res.status(403).json({ error: 'Licença expirada' });
  }

  // Gera token JWT
  const token = signToken({ id: user.id, email: user.email });

  res.status(200).json({ token });
}
