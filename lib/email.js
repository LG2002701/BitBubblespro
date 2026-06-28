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

        <div style="background:#fff7e6;border:1px solid #ffd591;border-radius:8px;padding:16px;margin-top:28px">
          <p style="margin:0;font-size:13px;color:#8a6d3b">
            <b>Atenção:</b> você também pode receber um e-mail da Hotmart mencionando
            "Club" ou "consumer.hotmart.com" — pode ignorar esse e-mail.
            O acesso correto ao BitBubbles PRO é sempre através do botão
            <b>"Acessar o Terminal"</b> acima, usando o e-mail e senha informados
            neste e-mail.
          </p>
        </div>

        <p style="color:#999;font-size:12px;margin-top:32px">BitBubbles PRO — Terminal Quant v4</p>
      </div>
    `
  });
}
}
