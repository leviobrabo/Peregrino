function startCommand(bot, message) {
  if (message.chat.type !== "private") {
    return;
  }
  const firstName = message.from.first_name;

  const msgstart = `Olá, <b>${firstName}</b>! 👋\n\nSou o <b>Peregrino</b> — seu companheiro bíblico diário no Telegram.\n\n<b>O que posso fazer por você:</b>\n📖 Pesquise qualquer versículo: <code>@operegrino_bot João 3:16</code>\n📅 Planos de leitura diários (21h30) — /plano\n🙏 Lembretes de oração personalizados — /horariooracao\n📝 Anotações bíblicas — /addanotacao\n⭐ Versículos diários (8h) — /verson\n🏅 Acompanhe seus dias de estudo — /status\n\nComece por /help para ver tudo disponível.\n\n<i>📦 Código-fonte: <a href="https://github.com/leviobrabo/Peregrino">GitHub</a></i>`;

  const options_start = {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📖 Pesquisar versículo", switch_inline_query_current_chat: "" },
        ],
        [
          { text: "📚 Ver planos de leitura", callback_data: "ver_planos" },
          { text: "🪪 Minha conta", callback_data: "minha_conta" },
        ],
        [
          { text: "✨ Adicionar a um grupo", url: "https://t.me/operegrino_bot?startgroup=true" },
        ],
        [
          { text: "🙏 Pedidos de oração", url: "https://t.me/pedidosdeoracaoperegrino" },
          { text: "📍 Canal Oficial", url: "https://t.me/peregrinobr" },
        ],
        [
          { text: "⚙️ Atualizações", url: "https://t.me/peregrinochannel" },
          { text: "💡 Sobre", callback_data: "edit_caption" },
        ],
      ],
    },
  };

  bot.sendMessage(message.chat.id, msgstart, options_start);
}

module.exports = {
  startCommand,
};
