import { verifyToken } from '../../lib/jwt.js';

export default async function handler(req, res) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Sem token' });

  const token = auth.replace('Bearer ', '');
  const payload = verifyToken(token);

  if (!payload) return res.status(401).json({ error: 'Token inválido' });

  res.status(200).json({ id: payload.id, email: payload.email });
}
