import sql from '../../lib/db.js';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../../lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Valida que veio da Hotmart
  const secret = req.headers['x-hotmart-webhook-token'];
  if (secret !== process.env.HOTMART_SECRET) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  const { data } = req.body;

  // Pega email do comprador
  const email = data?.buyer?.email;
  if (!email) return res.status(400).json({ error: 'Email não encontrado' });

  // Gera senha aleatória
  const senha = Math.random().toString(36).slice(-8).toUpperCase();
  const hash  = await bcrypt.hash(senha, 10);

  // Cria usuário se não existir
  const [user] = await sql`
    INSERT INTO users (email, password_hash)
    VALUES (${email}, ${hash})
    ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}
    RETURNING id
  `;

  // Cria licença ativa por 1 ano
  await sql`
    INSERT INTO licenses (user_id, status, hotmart_id, expires_at)
    VALUES (
      ${user.id},
      'active',
      ${data?.purchase?.transaction},
      NOW() + INTERVAL '1 year'
    )
  `;

  // Manda email com as credenciais
  await sendWelcomeEmail(email, senha);

  res.status(200).json({ ok: true });
}
