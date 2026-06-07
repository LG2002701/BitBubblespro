const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function sendWelcomeEmail(email, senha) {
  await resend.emails.send({
    from: 'BitBubbles PRO <onboarding@resend.dev>',
    to: email,
    subject: 'Seu acesso ao BitBubbles PRO',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 20px">
        <h2 style="color:#6366f1">BitBubbles PRO</h2>
        <p>Seu acesso foi liberado! Use as credenciais abaixo para entrar no terminal:</p>
        <div style="background:#f4f4f8;border-radius:8px;padding:20px;margin:24px 0">
          <p><b>Email:</b> ${email}</p>
          <p><b>Senha:</b> ${senha}</p>
        </div>
        <a href="https://bit-bubblespro.vercel.app/login.html" 
           style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Acessar o Terminal
        </a>
        <p style="color:#999;font-size:12px;margin-top:32px">BitBubbles PRO — Terminal Quant v4</p>
      </div>
    `
  });
}
