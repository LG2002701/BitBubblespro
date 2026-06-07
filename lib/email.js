export async function sendWelcomeEmail(email, senha) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'BitBubbles PRO <noreply@seudominio.com>',
      to: email,
      subject: '🚀 Seu acesso ao BitBubbles PRO',
      html: `
        <h2>Bem-vindo ao BitBubbles PRO!</h2>
        <p>Seu acesso foi liberado. Use as credenciais abaixo para entrar:</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Senha:</b> ${senha}</p>
        <p><a href="https://seusite.vercel.app/api/terminal">Acessar o terminal</a></p>
        <hr/>
        <p style="color:#999;font-size:12px">BitBubbles PRO — Terminal Quant</p>
      `
    })
  });
  return res.ok;
}
