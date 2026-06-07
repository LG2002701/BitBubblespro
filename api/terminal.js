import { verifyToken } from '../lib/jwt.js';
import sql from '../lib/db.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const auth = req.headers.authorization || req.query.token;
  const token = auth?.replace('Bearer ', '');
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>Acesso negado</h2>
        <p>Faça login para acessar o terminal.</p>
        <a href="/login">Ir para o login</a>
      </body></html>
    `);
  }

  // Verifica licença ativa no banco
  const [license] = await sql`
    SELECT status, expires_at FROM licenses
    WHERE user_id = ${payload.id}
    ORDER BY created_at DESC LIMIT 1
  `;

  if (!license || license.status !== 'active' || new Date(license.expires_at) < new Date()) {
    return res.status(403).send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>Licença inativa</h2>
        <p>Sua assinatura expirou ou foi cancelada.</p>
      </body></html>
    `);
  }

  // Serve o HTML do terminal
  const html = fs.readFileSync(path.join(process.cwd(), 'public', 'terminal.html'), 'utf-8');
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
