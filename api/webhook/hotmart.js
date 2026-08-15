const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const sendWelcomeEmail = require('../../lib/email.js');

const sql = neon(process.env.DATABASE_URL);

// Eventos que LIBERAM acesso
const GRANT_EVENTS = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE'];

// Eventos que REVOGAM acesso
const REVOKE_EVENTS = [
  'PURCHASE_CANCELED',
  'PURCHASE_REFUNDED',
  'PURCHASE_CHARGEBACK',
  'SUBSCRIPTION_CANCELLATION',
  'PURCHASE_DELAYED', // falha de cobrança recorrente
];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // 1) Valida que a chamada veio mesmo da Hotmart
  const hottok = (req.body?.hottok || req.headers['x-hotmart-hottok'] || '').toString().trim();
  const expected = (process.env.HOTMART_HOTTOK || '').toString().trim();
  if (!hottok || !expected || hottok !== expected) {
    return res.status(401).json({ error: 'Hottok inválido' });
  }

  const event = req.body?.event;
  const { data } = req.body;
  // Eventos de compra usam data.buyer.email; eventos de assinatura usam data.subscriber.email
  const email = data?.buyer?.email || data?.subscriber?.email;
  const transaction = data?.purchase?.transaction;

  // 2) Evento de liberação de acesso
  if (GRANT_EVENTS.includes(event)) {
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

    // Duração baseada no tipo de recorrência, se a Hotmart mandar (fallback: 32 dias)
    const recurrencyDays = data?.subscription?.plan?.recurrency_period || 32;

    // Insere uma nova licença ativa a cada compra/renovação aprovada.
    // terminal.js sempre lê a licença mais recente (ORDER BY created_at DESC),
    // então não precisamos de UPSERT aqui.
    await sql`
      INSERT INTO licenses (user_id, status, hotmart_id, expires_at)
      VALUES (
        ${user.id},
        'active',
        ${transaction},
        NOW() + make_interval(days => ${recurrencyDays})
      )
    `;

    await sendWelcomeEmail(email, senha);
    return res.status(200).json({ ok: true, action: 'granted' });
  }

  // 3) Evento de revogação de acesso
  if (REVOKE_EVENTS.includes(event)) {
    if (!email) return res.status(400).json({ error: 'Email nao encontrado' });

    await sql`
      UPDATE licenses
      SET status = 'inactive'
      WHERE user_id = (SELECT id FROM users WHERE email = ${email})
    `;
    return res.status(200).json({ ok: true, action: 'revoked' });
  }

  // 4) Qualquer outro evento (primeiro acesso, troca de plano, dados logísticos,
  // abandono de carrinho, etc.) — não precisamos agir, só confirmar recebimento
  // com 200 pra Hotmart não ficar retentando.
  return res.status(200).json({ ok: true, action: 'ignored', event });
}
