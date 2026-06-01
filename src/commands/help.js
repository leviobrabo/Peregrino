function helpCommand(bot, message) {
  if (message.chat.type !== "private") {
    return;
  }
  const firstName = message.from.first_name;

  const text = `<b>Olá, ${firstName}!</b> Aqui está tudo que você pode fazer:\n\n` +
    `<b>📖 Bíblia</b>\n` +
    `• Pesquisa inline: <code>@operegrino_bot João 3:16</code>\n` +
    `• Trocar tradução: /traducao (14 disponíveis)\n` +
    `• Ver livros: /livros\n\n` +
    `<b>📅 Planos de Leitura</b> <i>(enviados às 21h30)</i>\n` +
    `• Ver todos os 17 planos: /plano\n` +
    `• Plano bíblico 365 dias: /planobiblico <i>(enviado às 18h)</i>\n` +
    `• Cancelar plano ativo: /cancelarplano\n\n` +
    `<b>🙏 Oração</b>\n` +
    `• Lembrete diário de orar: /horariooracao\n` +
    `• Adicionar motivo de oração: /addmotivo\n` +
    `• Pedir intercessão da comunidade: /intercessao\n\n` +
    `<b>📝 Anotações</b>\n` +
    `• Adicionar anotação bíblica: /addanotacao\n\n` +
    `<b>⭐ Versículos Diários</b> <i>(enviados às 8h)</i>\n` +
    `• Ativar/desativar: /verson | /versoff\n\n` +
    `<b>🪪 Minha Conta</b>\n` +
    `• Ver status e rank: /status\n` +
    `• Dia do estudo bíblico: /dia\n\n` +
    `<b>👥 Em Grupos</b>\n` +
    `• Ative versículos temáticos diários (7h) com /verstema\n` +
    `• Temas: Adoração, Amor, Consolo, Encorajamento, Fé\n\n` +
    `<i>Dúvidas? Fale com o suporte.</i>`;

  const options = {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📌 Lista completa de comandos", callback_data: "commands" },
        ],
        [
          { text: "🚧 Projetos", url: "https://t.me/pjtlbrabo" },
          { text: "👤 Suporte", url: "https://t.me/kylorensbot" },
        ],
        [
          { text: "💰 Fazer uma contribuição", callback_data: "donate" },
        ],
      ],
    },
  };

  bot.sendMessage(message.chat.id, text, options);
}

module.exports = {
  helpCommand,
};
