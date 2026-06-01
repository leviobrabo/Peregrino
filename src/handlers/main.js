const { bot } = require("../bot");
const { ChatModel, UserModel, PlanoModel } = require("../database");
const CronJob = require("cron").CronJob;
const fs = require('fs');


// REGISTRO
const groupId = process.env.groupId;
// NOME DO BOT
const nameBot = process.env.nameBot
// ID DO DONO
const owner = process.env.ownerId
// CANAL OFICIAL
const channelId = process.env.channelId;
// CANAL DE INTERSEÇÕES
const channelIdIt = process.env.channelIdIt;



const { infotraduCommand } = require("../commands/infotradu");
const { startCommand } = require("../commands/start");
const { helpCommand } = require("../commands/help");
const { diaCommand } = require("../commands/dia");
const { planoCommand } = require("../commands/planos");
const { livrosCommand } = require("../commands/livros");
const { comandosCommand } = require("../commands/comandos");

const chatCommands = [
  { command: 'help', description: 'Funcionalidades do bot' },
  { command: 'traducao', description: 'Escolha sua tradução preferida' },
  { command: 'comandos', description: 'Lista de comandos' },
  { command: 'planobiblico', description: 'Plano bíblico 365 dias' },
  { command: 'plano', description: 'Veja todos os planos disponíveis' },
  { command: 'addmotivo', description: 'Adicione um motivo de oração' },
  { command: 'addanotacao', description: 'Adicione uma anotação' },
  { command: 'horariooracao', description: 'Adicionar um lembrete de orar' },
  { command: 'verson', description: 'Receber versículos bíblicos' },
  { command: 'intercessao', description: 'Envie seu motivo de intercessão' },
  { command: 'status', description: 'Ver os status no bot' },
  { command: 'cancelarplano', description: 'Cancelar plano de leitura ativo' },
];
bot.setMyCommands(chatCommands, { scope: JSON.stringify({ type: 'all_private_chats' }) });

const groupCommands = [
  { command: 'status', description: 'Ver os status no bot' },
];

bot.setMyCommands(groupCommands, { scope: JSON.stringify({ type: 'all_group_chats' }) });

const adminCommands = [
  { command: 'fwdon', description: 'Receber encaminhamento no grupo' },
  { command: 'fwdoff', description: 'Não receber encaminhamento no grupo' },
  { command: '/verstema', description: 'Escolher entre Adoração, Amor, Consolo, Encorajamento, Fé' },
];

bot.setMyCommands(adminCommands, { scope: JSON.stringify({ type: 'all_chat_administrators' }) });

function getUserRank(daysActive) {
  const ranks = [
    { rank: 'Iniciante', days: 0 },
    { rank: 'Servo', days: 7 },
    { rank: 'Fiel', days: 14 },
    { rank: 'Líder', days: 21 },
    { rank: 'Guerreiro', days: 30 },
    { rank: 'Levita', days: 60 },
    { rank: 'Rei', days: 90 },
    { rank: 'Pastor', days: 100 },
    { rank: 'Discípulo', days: 120 },
    { rank: 'Patriarca', days: 150 },
    { rank: 'Sacerdote', days: 180 },
    { rank: 'Evangelista', days: 210 },
    { rank: 'Bíblico', days: 240 },
    { rank: 'Peregrino', days: 270 },
    { rank: 'Missionário', days: 300 },
    { rank: 'Embaixador de Cristo', days: 400 },
    { rank: 'Expositor da Palavra', days: 500 },
    { rank: 'Conhecedor da Verdade', days: 800 },
    { rank: 'Remido de Deus', days: 900 },
    { rank: 'Vaso de Honra', days: 1000 },
    { rank: 'Teológo', days: 1500 },
  ];
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (daysActive >= ranks[i].days) return ranks[i].rank;
  }
  return 'Iniciante';
}

bot.on("message", async (msg) => {
  try {
    if (
      msg.chat.type === "private" &&
      msg.entities &&
      msg.entities[0].type === "bot_command"
    ) {
      const existingUser = await UserModel.findOne({
        user_id: msg.from.id,
      });
      if (existingUser) {
        if (!existingUser.receivedPlusOne) {
          existingUser.receivedPlusOne = true;
          await existingUser.save();
          return;
        } else {
          // console.log('Usuário já recebeu o plus one');
        }
      } else {
        const user = new UserModel({
          user_id: msg.from.id,
          username: msg.from.username,
          firstname: msg.from.first_name,
          lastname: msg.from.last_name,
          fowr_private: true,
          is_dev: false,
          is_ban: false,
          diariavers: false,
          blb365: false,
          diasdeestudo: 0,
          translation: "acf",
          receivedPlusOne: false,
        });

        await user.save();
        console.log(`Usuário ${msg.from.id} salvo no banco de dados.`);

        const message = `#${nameBot} #New_User
        <b>User:</b> <a href="tg://user?id=${user.user_id}">${user.firstname}</a>
        <b>ID:</b> <code>${user.user_id}</code>
        <b>Username:</b> ${user.username ? `@${user.username}` : "Não informado"
          }`;
        bot.sendMessage(groupId, message, { parse_mode: "HTML", reply_to_message_id: 38573 });
      }
    }
  } catch (error) {
    console.error(
      `Erro ao salvar o usuário ${msg.from.id} no banco de dados: ${error.message}`
    );
  }
});

// ENTRADA E SAÍDA DE GRUPOS

bot.on("new_chat_members", async (msg) => {
  const chatId = msg.chat.id;
  const chatName = msg.chat.title;

  try {
    if (parseInt(chatId) === parseInt(groupId)) {
      console.log(
        `O chatId ${chatId} é igual ao groupId ${groupId}. Não será salvo no banco de dados.`
      );
    } else {
      const chat = await ChatModel.findOne({ chatId: chatId }).exec();

      if (chat) {
        console.log(
          `Grupo ${chatName} (${chatId}) já existe no banco de dados`
        );
      } else {
        const newChat = await ChatModel.create({
          chatId,
          chatName,
          isBlocked: false,
          forwarding: true,
          versdia: true,
          verstema: "Encorajamento",
        });
        console.log(
          `Grupo ${newChat.chatName} (${newChat.chatId}) adicionado ao banco de dados`
        );

        const botUser = await bot.getMe();
        const newMembers = msg.new_chat_members.filter(
          (member) => member.id === botUser.id
        );

        let chatusername;
        if (msg.chat.username) {
          chatusername = `@${msg.chat.username}`;
        } else {
          chatusername = "Private Group";
        }

        if (newMembers.length > 0) {
          const message = `#${nameBot} #New_Group
                  <b>Group:</b> ${chatName}
                  <b>ID:</b> <code>${chatId}</code>
                  <b>Link:</b> ${chatusername}`;

          bot.sendMessage(groupId, message, {
            parse_mode: "HTML",
            reply_to_message_id: 38573
          }).catch((error) => {
            console.error(
              `Erro ao enviar mensagem para o grupo ${chatId}: ${error}`
            );
          });
        }

        bot.sendMessage(
          chatId,
          "Olá, meu nome é Peregrino! Obrigado por me adicionar em seu grupo.\n\nSou um bot bíblicos, enviarei versículos bíblicos no grupo.\n\nEscolha o tema dos versículos /verstema ",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Canal Oficial",
                    url: "https://t.me/peregrinobr",
                  },
                  {
                    text: "Atualizações",
                    url: "https://t.me/peregrinochannel",
                  },
                ],
                [
                  {
                    text: "Pedidos de oração",
                    url: "https://t.me/pedidosdeoracaoperegrino",
                  },
                  {
                    text: "Relatar bugs",
                    url: "https://t.me/kylorensbot",
                  },
                ],
              ],
            },
          }
        );
      }
    }

    try {
      const developerMembers = [];
      for (const member of msg.new_chat_members) {
        if (!member.is_bot && (await is_dev(member.id))) {
          const user = await UserModel.findOne({ user_id: member.id });
          if (user && user.is_dev) {
            developerMembers.push(member);
          }
        }
      }

      if (developerMembers.length > 0) {
        const message = `👨‍💻 <b>Um dos meus desenvolvedores entrou no grupo:</b> <a href="tg://user?id=${developerMembers[0].id}">${developerMembers[0].first_name}</a> 😎👍`;
        bot.sendMessage(chatId, message, { parse_mode: "HTML" }).catch((error) => {
          console.error(`Erro ao enviar mensagem para o grupo ${chatId}: ${error}`);
        });
      }
    } catch (err) {
      console.error(err);
    }
  } catch (err) {
    console.error(err);
  }
});

bot.on("left_chat_member", async (msg) => {
  const botUser = await bot.getMe();
  if (msg.left_chat_member.id === botUser.id && String(msg.chat.id) === String(groupId)) {
    console.log("Bot left the group!");

    try {
      const chatId = msg.chat.id;
      const chat = await ChatModel.findOneAndDelete({ chatId });
      console.log(
        `Grupo ${chat.chatName} (${chat.chatId}) removido do banco de dados`
      );
    } catch (err) {
      console.error(err);
    }
  }
});

// Função para verificar se o usuário tem is_dev: true
async function is_dev(user_id) {
  try {
    const user = await UserModel.findOne({ user_id: user_id });
    if (user && user.is_dev === true) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao verificar is_dev:', error);
    return false;
  }
}

// LISTA DE GRUPOS

bot.onText(/^\/grupos/, async (message) => {
  const user_id = message.from.id;
  if (!(await is_dev(user_id))) {
    return;
  }
  if (message.chat.type !== "private") {
    return;
  }

  try {
    const chats = await ChatModel.find().sort({ chatId: 1 });

    let contador = 1;
    let chunkSize = 3900 - message.text.length;
    let messageChunks = [];
    let currentChunk = "";

    for (let chat of chats) {
      if (chat.chatId < 0) {
        let groupMessage = `<b>${contador}:</b> <b>Group=</b> ${chat.chatName} || <b>ID:</b> <code>${chat.chatId}</code>\n`;
        if (currentChunk.length + groupMessage.length > chunkSize) {
          messageChunks.push(currentChunk);
          currentChunk = "";
        }
        currentChunk += groupMessage;
        contador++;
      }
    }
    messageChunks.push(currentChunk);

    let index = 0;

    const markup = (index) => {
      return {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `<< ${index + 1}`,
                callback_data: `groups:${index - 1}`,
                disabled: index === 0,
              },
              {
                text: `>> ${index + 2}`,
                callback_data: `groups:${index + 1}`,
                disabled: index === messageChunks.length - 1,
              },
            ],
          ],
        },
        parse_mode: "HTML",
      };
    };

    // Verificar se o texto da mensagem está vazio
    if (message.text.trim() === "") {
      await bot.sendMessage(message.chat.id, "O texto está vazio.");
    } else {
      await bot.sendMessage(
        message.chat.id,
        messageChunks[index],
        markup(index)
      );
    }

    bot.on("callback_query", async (query) => {
      if (query.data.startsWith("groups:")) {
        index = Number(query.data.split(":")[1]);
        if (
          markup(index).reply_markup &&
          markup(index).reply_markup.inline_keyboard
        ) {
          markup(index).reply_markup.inline_keyboard[0][0].disabled =
            index === 0;
          markup(index).reply_markup.inline_keyboard[0][1].disabled =
            index === messageChunks.length - 1;
        }
        await bot.editMessageText(messageChunks[index], {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          ...markup(index),
        });
        await bot.answerCallbackQuery(query.id);
      }
    });
  } catch (error) {
    console.error(error);
  }
});


// PING E STATS 

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const numUsers = await UserModel.countDocuments();
  const numChats = await ChatModel.countDocuments();

  const message = `\n──❑ 「 Bot Stats 」 ❑──\n\n ☆ ${numUsers} usuários\n ☆ ${numChats} chats`;
  bot.sendMessage(chatId, message);
});

function timeFormatter(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const hoursFormatted = String(hours).padStart(2, "0");
  const minutesFormatted = String(minutes).padStart(2, "0");
  const secondsFormatted = String(secs).padStart(2, "0");

  return `${hoursFormatted}:${minutesFormatted}:${secondsFormatted}`;
}

bot.onText(/\/ping/, async (msg) => {
  const start = new Date();
  const replied = await bot.sendMessage(msg.chat.id, "𝚙𝚘𝚗𝚐!");
  const end = new Date();
  const m_s = end - start;
  const uptime = process.uptime();
  const uptime_formatted = timeFormatter(uptime);
  await bot.editMessageText(
    `𝚙𝚒𝚗𝚐: \`${m_s}𝚖𝚜\`\n𝚞𝚙𝚝𝚒𝚖𝚎: \`${uptime_formatted}\``,
    {
      chat_id: replied.chat.id,
      message_id: replied.message_id,
      parse_mode: "Markdown",
    }
  );
});

// Adicionar usuários devs

bot.onText(/\/adddev (\d+)/, async (msg, match) => {
  const user_id = msg.from.id;
  const userId = match[1];

  if (user_id.toString() !== owner) {
    await bot.sendMessage(
      msg.chat.id,
      "Você não está autorizado a executar este comando."
    );
    return;
  }

  if (msg.chat.type !== "private") {
    return;
  }

  const user = await UserModel.findOne({ user_id: userId });

  if (!user) {
    console.log("Nenhum Usuário encontrado com o ID informado.");
    return;
  }

  if (user.is_dev) {
    await bot.sendMessage(user_id, `O usuário ${userId} já é um dev.`);
    return;
  }

  await UserModel.updateOne({ user_id: userId }, { $set: { is_dev: true } });
  await bot.sendMessage(
    userId,
    `Parabéns! Você foi promovido a usuário dev. Agora você tem acesso a recursos especiais.`
  );
  await bot.sendMessage(user_id, `Usuário ${userId} foi promovido a dev.`);
});

bot.onText(/\/deldev (\d+)/, async (msg, match) => {
  const user_id = msg.from.id;
  const userId = match[1];

  if (user_id.toString() !== owner) {
    await bot.sendMessage(
      msg.chat.id,
      "Você não está autorizado a executar este comando."
    );
    return;
  }

  if (msg.chat.type !== "private") {
    return;
  }

  const user = await UserModel.findOne({ user_id: userId });

  if (!user) {
    console.log("Nenhum Usuário encontrado com o ID informado.");
    return;
  }

  if (!user.is_dev) {
    await bot.sendMessage(user_id, `O usuário ${userId} já não é um dev.`);
    return;
  }

  await UserModel.updateOne({ user_id: userId }, { $set: { is_dev: false } });
  await bot.sendMessage(
    userId,
    `Você não é mais um usuário dev. Seus acessos especiais foram revogados.`
  );
  await bot.sendMessage(user_id, `Usuário ${userId} não é mais um dev.`);
});



// Transmissão

bot.onText(/^(\/broadcast|\/bc)\b/, async (msg, match) => {
  const user_id = msg.from.id;
  if (!(await is_dev(user_id))) {
    return;
  }
  if (msg.chat.type !== "private") {
    return;
  }

  const query = match.input.substring(match[0].length).trim();
  if (!query) {
    return bot.sendMessage(
      msg.chat.id,
      "<i>I need text to broadcast.</i>",
      { parse_mode: "HTML" }
    );
  }
  const sentMsg = await bot.sendMessage(msg.chat.id, "<i>Processing...</i>", {
    parse_mode: "HTML",
  });
  const web_preview = query.startsWith("-d");
  const query_ = web_preview ? query.substring(2).trim() : query;
  const ulist = await UserModel.find().lean().select("user_id");
  let sucess_br = 0;
  let no_sucess = 0;
  let block_num = 0;
  for (const { user_id } of ulist) {
    try {
      await bot.sendMessage(user_id, query_, {
        disable_web_page_preview: !web_preview,
        parse_mode: "HTML",
      });
      sucess_br += 1;
    } catch (err) {
      if (
        err.response &&
        err.response.body &&
        err.response.body.error_code === 403
      ) {
        block_num += 1;
      } else {
        no_sucess += 1;
      }
    }
  }
  await bot.editMessageText(
    `
╭─❑ 「 <b>Broadcast Completed</b> 」 ❑──
│- <i>Total Users:</i> \`${ulist.length}\`
│- <i>Successful:</i> \`${sucess_br}\`
│- <i>Blocked:</i> \`${block_num}\`
│- <i>Failed:</i> \`${no_sucess}\`
╰❑
  `,
    {
      chat_id: sentMsg.chat.id,
      message_id: sentMsg.message_id,
      parse_mode: "HTML",
    }
  );
});

// NOVIDADES — broadcast formatado de atualizações do bot

bot.onText(/^\/novidades\b/, async (msg) => {
  const userId = msg.from.id;
  if (!(await is_dev(userId))) return;
  if (msg.chat.type !== "private") return;

  const novidades = `🆕 <b>Novidades do Peregrino</b>\n\n` +
    `📚 <b>4 novos planos de leitura:</b>\n` +
    `• /planosalmos — 30 Dias nos Salmos\n` +
    `• /planoproverbios — 30 Dias em Provérbios\n` +
    `• /planoidemcristo — Identidade em Cristo (7d)\n` +
    `• /planoansiedade — Ansiedade e Fé (7d)\n\n` +
    `📖 <b>Pesquisa inline:</b> Você pode pesquisar qualquer versículo diretamente em qualquer conversa digitando <code>@operegrino_bot</code> seguido da referência.\n\n` +
    `🙏 <b>Lembrete de oração:</b> Configure um horário personalizado com /horariooracao\n\n` +
    `📝 <b>Anotações bíblicas:</b> Guarde reflexões com /addanotacao\n\n` +
    `🏅 <b>Sistema de ranks:</b> Acumule dias de estudo e suba de Iniciante até Teológo. Veja seu progresso em /status\n\n` +
    `Use /plano para ver todos os 17 planos disponíveis.`;

  const sentMsg = await bot.sendMessage(msg.chat.id, "<i>Enviando novidades...</i>", { parse_mode: "HTML" });
  const ulist = await UserModel.find().lean().select("user_id");
  let ok = 0, blocked = 0, fail = 0;
  for (const { user_id } of ulist) {
    try {
      await bot.sendMessage(user_id, novidades, { parse_mode: "HTML", disable_web_page_preview: true });
      ok++;
    } catch (err) {
      if (err.response && err.response.body && err.response.body.error_code === 403) {
        blocked++;
      } else {
        fail++;
      }
    }
  }
  await bot.editMessageText(
    `╭─❑ 「 <b>Novidades Enviadas</b> 」 ❑─\n│ Total: ${ulist.length}\n│ Enviado: ${ok}\n│ Bloqueado: ${blocked}\n│ Falha: ${fail}\n╰❑`,
    { chat_id: sentMsg.chat.id, message_id: sentMsg.message_id, parse_mode: "HTML" }
  );
});

// BAN UNBAN E LISTA BAN (GRUPOS)

bot.onText(/\/ban/, async (message) => {
  const userId = message.from.id;
  const chatId = message.text.split(" ")[1];

  if (message.chat.type !== "private") {
    console.log("mensagem de ban só no privado do bot")
    return;
  }

  if (!(await is_dev(userId))) {
    await bot.sendMessage(
      message.chat.id,
      "Você não está autorizado a executar este comando."
    );
    return;
  }

  const chat = await ChatModel.findOne({ chatId: chatId });

  if (!chat) {
    console.log("Nenhum grupo encontrado com o ID informado.");
    return;
  }

  if (chat.isBlocked) {
    await bot.sendMessage(
      message.chat.id,
      `Grupo ${chat.chatName} já foi banido.`
    );
    return;
  }

  let chatUsername;
  if (message.chat.username) {
    chatUsername = `@${message.chat.username}`;
  } else {
    chatUsername = "Private Group";
  }
  const banMessage = `#${nameBot} #Banned
  <b>Group:</b> ${chat.chatName}
  <b>ID:</b> <code>${chatId}</code>
  <b>Dev:</b> ${chatUsername}`;

  bot.sendMessage(groupId, banMessage, { parse_mode: "HTML", reply_to_message_id: 38573 }).catch(
    (error) => {
      console.error(
        `Erro ao enviar mensagem para o grupo ${chatId}: ${error}`
      );
    }
  );

  await ChatModel.updateOne({ chatId: chatId }, { $set: { isBlocked: true } });
  await bot.sendMessage(chatId, `O bot foi removido do grupo.`);
  await bot.leaveChat(chatId);

  await bot.sendMessage(
    message.chat.id,
    `Grupo ${chat.chatName} de ID: ${chatId} foi banido com sucesso.`
  );
});

bot.onText(/\/unban/, async (message) => {
  const userId = message.from.id;
  const chatId = message.text.split(" ")[1];

  if (message.chat.type !== "private") {
    await bot.sendMessage(
      message.chat.id,
      "Por favor, envie este comando em um chat privado com o bot."
    );
    return;
  }

  if (!(await is_dev(userId))) {
    await bot.sendMessage(
      message.chat.id,
      "Você não está autorizado a executar este comando."
    );
    return;
  }

  const chat = await ChatModel.findOne({ chatId: chatId });

  if (!chat) {
    await bot.sendMessage(
      message.chat.id,
      `Nenhum grupo encontrado com o ID ${chatId}.`
    );
    return;
  }

  if (!chat.isBlocked) {
    await bot.sendMessage(
      message.chat.id,
      `O grupo ${chat.chatName} já está desbanido ou nunca foi banido.`
    );
    return;
  }

  let devUsername;
  if (message.chat.username) {
    devUsername = `@${message.chat.username}`;
  } else {
    devUsername = "Private Group";
  }
  const banMessage = `#${nameBot} #Unban
  <b>Group:</b> ${chat.chatName}
  <b>ID:</b> <code>${chatId}</code>
  <b>Dev:</b> ${devUsername}`;

  bot.sendMessage(groupId, banMessage, { parse_mode: "HTML", reply_to_message_id: 38573 }).catch(
    (error) => {
      console.error(
        `Erro ao enviar mensagem para o grupo ${chatId}: ${error}`
      );
    }
  );

  await ChatModel.updateOne({ chatId: chatId }, { $set: { isBlocked: false } });
  await bot.sendMessage(
    message.chat.id,
    `Grupo ${chat.chatName} foi desbanido.`
  );
});


bot.onText(/\/banned/, async (message) => {
  const userId = message.from.id;

  if (message.chat.type !== "private") {
    await bot.sendMessage(
      message.chat.id,
      "Por favor, envie este comando em um chat privado com o bot."
    );
    return;
  }

  if (!(await is_dev(userId))) {
    await bot.sendMessage(
      message.chat.id,
      "Você não está autorizado a executar este comando."
    );
    return;
  }

  const bannedChats = await ChatModel.find({ isBlocked: true });

  if (bannedChats.length === 0) {
    await bot.sendMessage(
      message.chat.id,
      "Nenhum chat encontrado no banco de dados que tenha sido banido."
    );
    return;
  }

  let contador = 1;
  let chunkSize = 3900;
  let messageChunks = [];
  let currentChunk = "<b>Chats banidos:</b>\n";

  for (const chat of bannedChats) {
    const groupMessage = `<b>${contador}:</b> <b>Group:</b> <a href="tg://resolve?domain=${chat.chatName}&amp;id=${chat.chatId}">${chat.chatName}</a> || <b>ID:</b> <code>${chat.chatId}</code>\n`;
    if (currentChunk.length + groupMessage.length > chunkSize) {
      messageChunks.push(currentChunk);
      currentChunk = "";
    }
    currentChunk += groupMessage;
    contador++;
  }
  messageChunks.push(currentChunk);

  let index = 0;

  const markup = (index) => {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `<< ${index + 1}`,
              callback_data: `banned:${index - 1}`,
              disabled: index === 0,
            },
            {
              text: `>> ${index + 2}`,
              callback_data: `banned:${index + 1}`,
              disabled: index === messageChunks.length - 1,
            },
          ],
        ],
      },
      parse_mode: "HTML",
    };
  };

  await bot.sendMessage(message.chat.id, messageChunks[index], markup(index));

  bot.on("callback_query", async (query) => {
    if (query.data.startsWith("banned:")) {
      index = Number(query.data.split(":")[1]);
      if (
        markup(index).reply_markup &&
        markup(index).reply_markup.inline_keyboard
      ) {
        markup(index).reply_markup.inline_keyboard[0][0].disabled =
          index === 0;
        markup(index).reply_markup.inline_keyboard[0][1].disabled =
          index === messageChunks.length - 1;
      }
      await bot.editMessageText(messageChunks[index], {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        ...markup(index),
      });
      await bot.answerCallbackQuery(query.id);
    }
  });
});

bot.onText(/\/devs/, async (message) => {
  const chatId = message.chat.id;
  const userId = message.from.id;

  if (!(await is_dev(userId))) {
    bot.sendMessage(
      chatId,
      "Este comando só pode ser usado por desenvolvedores!"
    );
    return;
  }

  if (message.chat.type !== "private" || chatId !== userId) {
    bot.sendMessage(
      chatId,
      "Este comando só pode ser usado em um chat privado com o bot!"
    );
    return;
  }

  try {
    const devsData = await UserModel.find({ is_dev: true });

    let message = "<b>Lista de desenvolvedores:</b>\n\n";
    for (let user of devsData) {
      const { firstname, user_id } = user;
      message += `<b>User:</b> ${firstname} ||`;
      message += `<b> ID:</b> <code>${user_id}</code>\n`;
    }

    bot.sendMessage(chatId, message, { parse_mode: "HTML" });
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      chatId,
      "Ocorreu um erro ao buscar a lista de desenvolvedores!"
    );
  }
});

// ENVIO DE TRANSMISSÃO PARA TODOS OS GRUPOS

bot.onText(/\/sendgp/, async (msg, match) => {
  const user_id = msg.from.id;
  if (!(await is_dev(user_id))) {
    return;
  }
  if (msg.chat.type !== "private") {
    return;
  }

  const sentMsg = await bot.sendMessage(msg.chat.id, "<i>Processing...</i>", {
    parse_mode: "HTML",
  });
  const web_preview = match.input.startsWith("-d");
  const query = web_preview ? match.input.substring(6).trim() : match.input;
  const ulist = await ChatModel.find({ forwarding: true })
    .lean()
    .select("chatId");
  let success_br = 0;
  let no_success = 0;
  let block_num = 0;

  if (msg.reply_to_message) {
    const replyMsg = msg.reply_to_message;
    for (const { chatId } of ulist) {
      try {
        await bot.forwardMessage(
          chatId,
          replyMsg.chat.id,
          replyMsg.message_id
        );
        success_br += 1;
      } catch (err) {
        if (
          err.response &&
          err.response.body &&
          err.response.body.error_code === 403
        ) {
          block_num += 1;
        } else {
          no_success += 1;
        }
      }
    }
  } else {
    for (const { chatId } of ulist) {
      try {
        await bot.sendMessage(chatId, query, {
          disable_web_page_preview: !web_preview,
          parse_mode: "HTML",
          reply_to_message_id: msg.message_id,
        });
        success_br += 1;
      } catch (err) {
        if (
          err.response &&
          err.response.body &&
          err.response.body.error_code === 403
        ) {
          block_num += 1;
        } else {
          no_success += 1;
        }
      }
    }
  }

  await bot.editMessageText(
    `
╭─❑ 「 <b>Broadcast Completed</b> 」 ❑──
│- <i>Total Group:</i> \`${ulist.length}\`
│- <i>Successful:</i> \`${success_br}\`
│- <i>Removed:</i> \`${block_num}\`
│- <i>Failed:</i> \`${no_success}\`
╰❑
  `,
    {
      chat_id: sentMsg.chat.id,
      message_id: sentMsg.message_id,
      parse_mode: "HTML",
    }
  );
});

// Desativar encaminhamento no grupo

bot.onText(/\/fwdoff/, async (msg) => {
  if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") {
    return;
  }

  const user_id = msg.from.id;
  const chat_id = msg.chat.id;

  const chatAdmins = await bot.getChatAdministrators(chat_id);
  const isAdmin = chatAdmins.some((admin) => admin.user.id === user_id);

  if (!isAdmin) {
    return;
  }

  const chat = await ChatModel.findOne({ chatId: chat_id });
  if (!chat || chat.forwarding === false) {
    await bot.sendMessage(chat_id, "O encaminhamento já está desativado.");
    return;
  }

  try {
    await ChatModel.updateMany({ chatId: chat_id }, { forwarding: false });
    console.log(
      `O bate-papo com ID ${chat_id} foi atualizado. Encaminhamento definido como falso.`
    );
    await bot.sendMessage(chat_id, "O encaminhamento foi desativado.");
  } catch (error) {
    console.error("Erro ao desativar o encaminhamento:", error);
    await bot.sendMessage(
      chat_id,
      "Ocorreu um erro ao desativar o encaminhamento."
    );
  }
});

// Ativar encaminhamento no grupo


bot.onText(/\/fwdon/, async (msg) => {
  if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") {
    return;
  }

  const user_id = msg.from.id;
  const chat_id = msg.chat.id;

  const chatAdmins = await bot.getChatAdministrators(chat_id);
  const isAdmin = chatAdmins.some((admin) => admin.user.id === user_id);

  if (!isAdmin) {
    return;
  }

  const chat = await ChatModel.findOne({ chatId: chat_id });
  if (!chat || chat.forwarding === true) {
    await bot.sendMessage(chat_id, "O encaminhamento já está habilitado.");
    return;
  }

  try {
    await ChatModel.updateMany({ chatId: chat_id }, { forwarding: true });
    console.log(
      `O bate-papo com ID ${chat_id} foi atualizado. Encaminhamento definido como verdadeiro.`
    );
    await bot.sendMessage(chat_id, "O encaminhamento foi ativado.");
  } catch (error) {
    console.error("Erro ao ativar o encaminhamento:", error);
    await bot.sendMessage(
      chat_id,
      "Ocorreu um erro ao ativar o encaminhamento."
    );
  }
});

bot.onText(/\/fwrds/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }

  const user_id = msg.from.id;

  if (!(await is_dev(user_id))) {
    return;
  }

  try {
    const groups = await ChatModel.find({ forwarding: false })
      .lean()
      .select("chatId chatName");

    if (groups.length === 0) {
      await bot.sendMessage(
        msg.chat.id,
        "Nenhum grupo encontrado com encaminhamento desativado."
      );
    } else {
      let response = "Grupos com encaminhamento desativado:\n\n";

      groups.forEach((group) => {
        response += `Chat ID: ${group.chatId} || Chat Name: ${group.chatName || "-"
          }\n`;
      });

      await bot.sendMessage(msg.chat.id, response);
    }
  } catch (error) {
    console.error("Erro ao recuperar grupos:", error);
    await bot.sendMessage(
      msg.chat.id,
      "Ocorreu um erro ao recuperar os grupos."
    );
  }
});


//ENVIO DE TRANSMISSÃO PARA CANAL DE INTERSEÇÃO

bot.onText(/\/sendit/, async (msg, match) => {
  const user_id = msg.from.id;
  if (!(await is_dev(user_id))) {
    return;
  }
  if (msg.chat.type !== "private") {
    return;
  }

  // Verificar se há uma mensagem marcada
  if (!msg.reply_to_message) {
    return bot.sendMessage(
      msg.chat.id,
      "<i>Por favor, responda à mensagem que você deseja enviar para channelIdIt.</i>",
      { parse_mode: "HTML" }
    );
  }

  try {
    // Encaminhar a mensagem marcada para channelIdIt
    await bot.copyMessage(channelIdIt, msg.chat.id, msg.reply_to_message.message_id);
    await bot.sendMessage(msg.chat.id, "Mensagem enviada para channelIdIt com sucesso.");
  } catch (error) {
    console.error('Erro ao enviar a mensagem para channelIdIt:', error);
    await bot.sendMessage(msg.chat.id, "Falha ao enviar a mensagem para channelIdIt.");
  }
});



// TRADUCÃO

let translationButtons = [];
let user;

bot.onText(/\/traducao/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const user = await UserModel.findOne({ user_id: userId });

  const translations = [
    { value: 'aa', label: 'Tradução (AA)' },
    { value: 'acf', label: 'Tradução (ACF)' },
    { value: 'ara', label: 'Tradução (ARA)' },
    { value: 'arc', label: 'Tradução (ARC)' },
    { value: 'as21', label: 'Tradução (AS21)' },
    { value: 'jfaa', label: 'Tradução (JFAA)' },
    { value: 'kja', label: 'Tradução (KJA)' },
    { value: 'kjf', label: 'Tradução (KJF)' },
    { value: 'naa', label: 'Tradução (NAA)' },
    { value: 'nbv', label: 'Tradução (NBV)' },
    { value: 'ntlh', label: 'Tradução (NTLH)' },
    { value: 'nvi', label: 'Tradução (NVI)' },
    { value: 'nvt', label: 'Tradução (NVT)' },
    { value: 'tb', label: 'Tradução (TB)' }
  ];

  const groupedButtons = [];
  for (let i = 0; i < translations.length; i += 2) {
    groupedButtons.push(translations.slice(i, i + 2));
  }

  translationButtons = groupedButtons.map((group) =>
    group.map((translation) => ({
      text: translation.label,
      callback_data: translation.value,
    }))
  );

  const replyMarkup = {
    inline_keyboard: translationButtons,
  };
  const translation = user && user.translation ? user.translation.toUpperCase() : 'acf';

  await bot.sendMessage(chatId, `<b>Escolha sua tradução preferida:</b>\n\n<b>Tradução atual:</b> ${translation}\n\nPara saber mais das traduções, digite /infotradu`, {
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
});

// Interseções

bot.onText(/\/intercessao/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.from.id;

  try {
    bot.sendMessage(userId, 'Por favor, digite o seu nome de quem quer a oração:');
    bot.once('message', (nomeMsg) => {
      const nome = nomeMsg.text;

      bot.sendMessage(userId, 'Por favor, digite o motivo da sua oração:');
      bot.once('message', (motivoMsg) => {
        const motivo = motivoMsg.text;

        bot.sendMessage(userId, 'Você deseja enviar esta oração para revisão?', {
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'Sim', callback_data: 'confirmar-intercessao' },
                { text: 'Não', callback_data: 'cancelar-intercessao' },
              ],
            ],
          },
        }).then(() => {
          bot.nomeOracao = nome;
          bot.motivoOracao = motivo;
          bot.nomeUsuario = msg.from.first_name;
        });
      });
    });
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
  }
});


// EXPLICAÇÃO DAS TRADUÇÕES

bot.onText(/^\/infotradu$/, (message) => {
  infotraduCommand(bot, message);
});

infotraduCommand

// start


bot.onText(/^\/start$/, (message) => {
  startCommand(bot, message);
});

// help
bot.onText(/^\/help$/, (message) => {
  helpCommand(bot, message);
});

//livros
bot.onText(/^\/livros$/, (message) => {
  livrosCommand(bot, message);
});

// planos
bot.onText(/^\/plano$/, (message) => {
  planoCommand(bot, message);
});

// comandos
bot.onText(/^\/comandos$/, (message) => {
  comandosCommand(bot, message);
});

// dia
bot.onText(/^\/dia$/, (message) => {
  diaCommand(bot, message);
});


// PLANO BÍBLICO

bot.onText(/\/planobiblico/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  try {
    const userId = msg.from.id;
    const user = await UserModel.findOne({ user_id: userId });

    if (user && user.blb365) {
      bot.sendMessage(msg.chat.id, "Plano bíblico 365 já está ativado!");
      return;
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { user_id: userId },
      { blb365: true, versiculoUser: 0, dia: 1 },
      { new: true }
    );

    if (!updatedUser) {
      console.log("Usuário não encontrado.");
      return;
    }

    const caption = "<b>Plano de leitura bíblica (365 dias)</b>\n\nVocê receberá textos bíblicos diariamente às 8 horas para leitura e meditação na palavra de Deus! E busque aprender mais de Deus através de sua escrituras.\n\n- Serão enviados 3 capítulos por dia.\n- A cada 4 dias, serão enviados 4 capítulos.\n- Ao final, você terá percorrido toda a Bíblia em 365 dias.\n\nEmbarque nessa trajetória rumo à leitura da Bíblia.\n\nPara escolher a tradução preferida digite: /traducao";

    bot.sendPhoto(msg.chat.id, "src/image/planobiblico.png", { caption, parse_mode: "HTML" });

    console.log(`Plano bíblico ativado para o usuário ${userId}`);
  } catch (error) {
    console.error("Erro ao atualizar o plano bíblico:", error);
    bot.sendMessage(msg.chat.id, "Ocorreu um erro ao ativar o plano bíblico.");
  }
});


async function getDailyText(dia, vers, userId) {
  try {
    const user = await UserModel.findOne({ user_id: userId });
    const translation = user.translation;
    const jsonObj = require(`../bible/${translation}.json`);

    let versiculoUser = vers;

    let quantVersiDia = 85;
    if (dia % 4 === 0) {
      quantVersiDia = 86;
    }

    let msg = [];
    let idMsg = 0;
    let contVersMsg = 0;
    let versiculoAtual = 0;
    let breakCheck = false;

    msg[idMsg] = `<b>Leitura do Dia ${dia} - ${translation.toUpperCase()}\n\n</b>`;

    for (const key in jsonObj) {
      if (breakCheck) break;

      const livro = jsonObj[key]["name"];
      const capitulos = jsonObj[key]["chapters"];

      for (const capitulo in capitulos) {
        if (breakCheck) break;

        for (const versiculo in capitulos[capitulo]) {
          if (breakCheck) break;

          if (versiculoAtual === versiculoUser) {
            const texto =
              `<b>${livro} ${parseInt(capitulo) + 1}:${parseInt(
                versiculo
              ) + 1}</b>\n` + capitulos[capitulo][versiculo];

            if (!(msg[idMsg].length + texto.length > 1000)) {
              msg[idMsg] += texto + "\n\n";
            }
            else {
              msg.push("");
              idMsg++;
              msg[idMsg] = "<b>Leitura do Dia " + dia + "\n\n</b>";
              msg[idMsg] += texto + "\n\n";
            }

            versiculoUser++;
            contVersMsg++;

            if (contVersMsg === quantVersiDia) {
              breakCheck = true;
            }
          }
          versiculoAtual++;
        }
      }
    }

    user.versiculoUser = versiculoUser;
    if (dia < 366) {
      user.dia = dia + 1;
    }
    await user.save();

    return msg
  } catch (err) {
    console.error("Error retrieving user from the database:", err);
  }
}

async function sendBibleTextDaily(userId) {
  try {
    const user = await UserModel.findOne({ user_id: userId });
    let dia = user.dia || 1;
    let versiculoUser = user.versiculoUser || 0;

    let msg = await getDailyText(dia, versiculoUser, userId);
    let position = 0;
    user.message = msg;
    user.messagePosition = position;

    const buttons = [];
    if (user.messagePosition > 0) {
      buttons.push({ text: "⬅️", callback_data: "prev-bible" });
    }
    if (msg.length > 1 && user.messagePosition < msg.length - 1) {
      buttons.push({ text: "➡️", callback_data: "next-bible" });
    }

    const options = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [buttons],
      },
    };

    const messageInfo = await bot.sendMessage(userId, msg[position], options);
    const messageId = messageInfo.message_id;

    user.messageId = messageId;
    await user.save();
  } catch (err) {
    console.error("Error retrieving user from the database:", err);
  }
}

async function handlePlanBiblicoCompletion(userId) {
  const user = await UserModel.findOne({ user_id: userId });
  if (!user) {
    return;
  }

  await bot.sendMessage(userId, "Deus seja louvado! 🎉🎊\n\nVocê concluiu o plano bíblico de 365 dias com sucesso, para ver quantos você concluiu digite: /status\n\nSe quiser mais planos digite: /planos");
  await UserModel.updateOne({ _id: user._id }, {
    $set: {
      dia: null,
      message: "",
      messagePosition: null,
      messageId: null,
      blb365: false,
    },
  });

  const plano = await PlanoModel.findOne({ user_id: userId });

  if (!plano) {
    const newPlano = new PlanoModel({
      user_id: userId,
      messagePlano: "",
      messageIdPlano: null,
      messagePositionPlano: null,
      planosConcluidos: 0,
    });
    await newPlano.save();
    return;
  }

  plano.planosConcluidos += 1;
  await plano.save();
}

const userJob = new CronJob(
  "00 00 18 * * *",
  async function () {
    try {
      const users = await UserModel.find({ blb365: true });
      for (const user of users) {
        const userId = user.user_id;
        const messageId = user.messageId;


        if (messageId) {
          try {
            await bot.deleteMessage(userId, messageId);
            console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
          } catch (error) {
            console.log(`Erro ao excluir mensagem anterior do usuário ${userId}: ${error.message}`);
          }
        }
        if (user.dia === 366) {
          await handlePlanBiblicoCompletion(userId);
        } else {
          await sendBibleTextDaily(userId);
          console.log(`Mensagem enviada com sucesso para o usuário ${userId}`);
        }
      }
    } catch (err) {
      console.error("Erro ao recuperar usuários do banco de dados:", err);
    }
  },
  null,
  true,
  "America/Sao_Paulo"
);

userJob.start();


bot.on("callback_query", async (query) => {
  const userId = query.from.id;
  const chatId = query.from.id;
  const firstName = query.from.first_name;
  const data = query.data;
  const user = await UserModel.findOne({ user_id: userId });
  const chat = await ChatModel.findOne({ chatId: chatId });
  const messageId = query.message.message_id;

  // console.log(query.data);
  // console.log(query.data.startsWith('next'));

  if (query.data.startsWith('prev') || query.data.startsWith('next') || query.data.startsWith('confirmar') || query.data.startsWith('cancelar')) {
    let comando = query.data.split("-");
    if (comando[1] == "bible") {
      const chatId = query.message.chat.id;
      const messageId = query.message.message_id;
      let message = user.message;

      if (user && user.messageId === messageId) {

        if (comando[0] === "prev" && user.messagePosition > 0) {
          user.messagePosition -= 1;
        } else if (comando[0] === "next" && user.messagePosition < message.length - 1) {
          user.messagePosition++;
        }
        await user.save();

        const buttons = [];
        if (user.messagePosition > 0) {
          buttons.push({ text: "⬅️", callback_data: "prev-bible" });
        }
        if (message.length > 1 && user.messagePosition < message.length - 1) {
          buttons.push({ text: "➡️", callback_data: "next-bible" });
        }

        const options = {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttons],
          },
        };

        bot.editMessageText(message[user.messagePosition], options);
      }
    }
    else if (comando[1] == "plano") {
      const chatId = query.message.chat.id;
      const plano = await PlanoModel.findOne({ user_id: userId });
      const messageIdPlano = query.message.message_id;
      let messagePlano = plano.messagePlano;

      if (plano && plano.messageIdPlano === messageIdPlano) {
        if (comando[0] === "prev" && plano.messagePositionPlano > 0) {
          plano.messagePositionPlano -= 1;
        } else if (comando[0] === "next" && plano.messagePositionPlano < messagePlano.length) {
          plano.messagePositionPlano++;
        }
        await plano.save();

        const buttonsPlano = [];

        if (plano.messagePositionPlano > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-plano" });
        }

        if (messagePlano.length > plano.messagePositionPlano + 1) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-plano" });
        }

        const messageOptions = {
          chat_id: chatId,
          message_id: messageIdPlano,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };
        await bot.editMessageText(messagePlano[plano.messagePositionPlano], messageOptions);
      }
    }
    else if (comando[1] == "planont") {
      const chatId = query.message.chat.id;
      const plano = await PlanoModel.findOne({ user_id: userId });
      const messageIdPlano = query.message.message_id;
      let messagePlano = plano.messagePlano;

      if (plano && plano.messageIdPlano === messageIdPlano) {
        if (comando[0] === "prev" && plano.messagePositionPlano > 0) {
          plano.messagePositionPlano -= 1;
        } else if (comando[0] === "next" && plano.messagePositionPlano < messagePlano.length) {
          plano.messagePositionPlano++;
        }
        await plano.save();

        const buttonsPlanoNV = [];

        if (plano.messagePositionPlano > 0) {
          buttonsPlanoNV.push({ text: "⬅️", callback_data: "prev-planont" });
        }

        if (messagePlano.length > plano.messagePositionPlano + 1) {
          buttonsPlanoNV.push({ text: "➡️", callback_data: "next-planont" });
        }

        const messageOptions = {
          chat_id: chatId,
          message_id: messageIdPlano,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlanoNV],
          },
        };
        await bot.editMessageText(messagePlano[plano.messagePositionPlano], messageOptions);
      }
    }
    else if (comando[1] == "planoor") {
      const chatId = query.message.chat.id;
      const plano = await PlanoModel.findOne({ user_id: userId });
      const messageIdPlano = query.message.message_id;
      let messagePlano = plano.messagePlano;

      if (plano && plano.messageIdPlano === messageIdPlano) {
        if (comando[0] === "prev" && plano.messagePositionPlano > 0) {
          plano.messagePositionPlano -= 1;
        } else if (comando[0] === "next" && plano.messagePositionPlano < messagePlano.length) {
          plano.messagePositionPlano++;
        }
        await plano.save();

        const buttonsPlano = [];

        if (plano.messagePositionPlano > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planoor" });
        }

        if (messagePlano.length > plano.messagePositionPlano + 1) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planoor" });
        }

        const messageOptions = {
          chat_id: chatId,
          message_id: messageIdPlano,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };
        await bot.editMessageText(messagePlano[plano.messagePositionPlano], messageOptions);
      }
    }
    else if (comando[1] == "planobt") {
      const chatId = query.message.chat.id;
      const plano = await PlanoModel.findOne({ user_id: userId });
      const messageIdPlano = query.message.message_id;
      let messagePlano = plano.messagePlano;

      if (plano && plano.messageIdPlano === messageIdPlano) {
        if (comando[0] === "prev" && plano.messagePositionPlano > 0) {
          plano.messagePositionPlano -= 1;
        } else if (comando[0] === "next" && plano.messagePositionPlano < messagePlano.length) {
          plano.messagePositionPlano++;
        }
        await plano.save();

        const buttonsPlano = [];

        if (plano.messagePositionPlano > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planobt" });
        }

        if (messagePlano.length > plano.messagePositionPlano + 1) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planobt" });
        }

        const messageOptions = {
          chat_id: chatId,
          message_id: messageIdPlano,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };
        await bot.editMessageText(messagePlano[plano.messagePositionPlano], messageOptions);
      }
    }
    else if (comando[1] == "planorc") {
      const chatId = query.message.chat.id;
      const plano = await PlanoModel.findOne({ user_id: userId });
      const messageIdPlano = query.message.message_id;
      let messagePlano = plano.messagePlano;

      if (plano && plano.messageIdPlano === messageIdPlano) {
        if (comando[0] === "prev" && plano.messagePositionPlano > 0) {
          plano.messagePositionPlano -= 1;
        } else if (comando[0] === "next" && plano.messagePositionPlano < messagePlano.length) {
          plano.messagePositionPlano++;
        }
        await plano.save();

        const buttonsPlano = [];

        if (plano.messagePositionPlano > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planorc" });
        }

        if (messagePlano.length > plano.messagePositionPlano + 1) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planorc" });
        }

        const messageOptions = {
          chat_id: chatId,
          message_id: messageIdPlano,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };
        await bot.editMessageText(messagePlano[plano.messagePositionPlano], messageOptions);
      }
    }
    else if (comando[1] == "planola") {
      const chatId = query.message.chat.id;
      const plano = await PlanoModel.findOne({ user_id: userId });
      const messageIdPlano = query.message.message_id;
      let messagePlano = plano.messagePlano;

      if (plano && plano.messageIdPlano === messageIdPlano) {
        if (comando[0] === "prev" && plano.messagePositionPlano > 0) {
          plano.messagePositionPlano -= 1;
        } else if (comando[0] === "next" && plano.messagePositionPlano < messagePlano.length) {
          plano.messagePositionPlano++;
        }
        await plano.save();

        const buttonsPlano = [];

        if (plano.messagePositionPlano > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planola" });
        }

        if (messagePlano.length > plano.messagePositionPlano + 1) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planola" });
        }

        const messageOptions = {
          chat_id: chatId,
          message_id: messageIdPlano,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };
        await bot.editMessageText(messagePlano[plano.messagePositionPlano], messageOptions);
      }
    }
    else if (comando[1] == "planonc") {
      const chatId = query.message.chat.id;
      const plano = await PlanoModel.findOne({ user_id: userId });
      const messageIdPlano = query.message.message_id;
      let messagePlano = plano.messagePlano;

      if (plano && plano.messageIdPlano === messageIdPlano) {
        if (comando[0] === "prev" && plano.messagePositionPlano > 0) {
          plano.messagePositionPlano -= 1;
        } else if (comando[0] === "next" && plano.messagePositionPlano < messagePlano.length) {
          plano.messagePositionPlano++;
        }
        await plano.save();

        const buttonsPlano = [];

        if (plano.messagePositionPlano > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planonc" });
        }

        if (messagePlano.length > plano.messagePositionPlano + 1) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planonc" });
        }

        const messageOptions = {
          chat_id: chatId,
          message_id: messageIdPlano,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };
        await bot.editMessageText(messagePlano[plano.messagePositionPlano], messageOptions);
      }
    }
    else if (comando[1] == "planonpb") {
      const chatId = query.message.chat.id;
      const plano = await PlanoModel.findOne({ user_id: userId });
      const messageIdPlano = query.message.message_id;
      let messagePlano = plano.messagePlano;

      if (plano && plano.messageIdPlano === messageIdPlano) {
        if (comando[0] === "prev" && plano.messagePositionPlano > 0) {
          plano.messagePositionPlano -= 1;
        } else if (comando[0] === "next" && plano.messagePositionPlano < messagePlano.length) {
          plano.messagePositionPlano++;
        }
        await plano.save();

        const buttonsPlano = [];

        if (plano.messagePositionPlano > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planonpb" });
        }

        if (messagePlano.length > plano.messagePositionPlano + 1) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planonpb" });
        }

        const messageOptions = {
          chat_id: chatId,
          message_id: messageIdPlano,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };
        await bot.editMessageText(messagePlano[plano.messagePositionPlano], messageOptions);
      }
    }
    else if (comando[1] == "planocs") {
      const chatId = query.message.chat.id;
      const plano = await PlanoModel.findOne({ user_id: userId });
      const messageIdPlano = query.message.message_id;
      let messagePlano = plano.messagePlano;

      if (plano && plano.messageIdPlano === messageIdPlano) {
        if (comando[0] === "prev" && plano.messagePositionPlano > 0) {
          plano.messagePositionPlano -= 1;
        } else if (comando[0] === "next" && plano.messagePositionPlano < messagePlano.length) {
          plano.messagePositionPlano++;
        }
        await plano.save();

        const buttonsPlano = [];

        if (plano.messagePositionPlano > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planocs" });
        }

        if (messagePlano.length > plano.messagePositionPlano + 1) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planocs" });
        }

        const messageOptions = {
          chat_id: chatId,
          message_id: messageIdPlano,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };
        await bot.editMessageText(messagePlano[plano.messagePositionPlano], messageOptions);
      }
    }
    else if (comando[1] == "planodc") {
      const chatId = query.message.chat.id;
      const plano = await PlanoModel.findOne({ user_id: userId });
      const messageIdPlano = query.message.message_id;
      let messagePlano = plano.messagePlano;

      if (plano && plano.messageIdPlano === messageIdPlano) {
        if (comando[0] === "prev" && plano.messagePositionPlano > 0) {
          plano.messagePositionPlano -= 1;
        } else if (comando[0] === "next" && plano.messagePositionPlano < messagePlano.length) {
          plano.messagePositionPlano++;
        }
        await plano.save();

        const buttonsPlano = [];

        if (plano.messagePositionPlano > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planodc" });
        }

        if (messagePlano.length > plano.messagePositionPlano + 1) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planodc" });
        }

        const messageOptions = {
          chat_id: chatId,
          message_id: messageIdPlano,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };
        await bot.editMessageText(messagePlano[plano.messagePositionPlano], messageOptions);
      }
    }
    else if (comando[1] == "planodv") {
      const chatId = query.message.chat.id;
      const plano = await PlanoModel.findOne({ user_id: userId });
      const messageIdPlano = query.message.message_id;
      let messagePlano = plano.messagePlano;

      if (plano && plano.messageIdPlano === messageIdPlano) {
        if (comando[0] === "prev" && plano.messagePositionPlano > 0) {
          plano.messagePositionPlano -= 1;
        } else if (comando[0] === "next" && plano.messagePositionPlano < messagePlano.length) {
          plano.messagePositionPlano++;
        }
        await plano.save();

        const buttonsPlano = [];
        if (plano.messagePositionPlano > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planodv" });
        }
        if (messagePlano.length > plano.messagePositionPlano + 1) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planodv" });
        }

        const messageOptions = {
          chat_id: chatId,
          message_id: messageIdPlano,
          parse_mode: "HTML",
          reply_markup: { inline_keyboard: [buttonsPlano] },
        };
        await bot.editMessageText(messagePlano[plano.messagePositionPlano], messageOptions);
      }
    }
    else if (comando[1] == "intercessao") {
      const chatId = query.message.chat.id;
      const userId = query.from.id;
      const data = query.data;
      const messageId = query.message.message_id;

      const messageConfirm = '✅ Sua oração foi enviada para revisão e quando autorizada será postada no canal. Acesse @pedidosdeoracaoperegrino';
      const messageCancel = '❌ Envio cancelado. Use o comando /oracao novamente se desejar enviar uma nova oração.';
      const mensagemenvi = `⏳ Você já enviou uma solicitação de intercessão e só pode enviar novamente amanhã.`;


      if (data === 'confirmar-intercessao') {

        const nome = bot.nomeOracao;
        const motivo = bot.motivoOracao;
        const user = await UserModel.findOne({ user_id: userId });

        bot.editMessageText(messageConfirm, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          chat_id: chatId,
          message_id: messageId,
        });
        await bot.sendMessage(owner, `Pedido de oração:\n\nNome: ${nome}\nMotivo: ${motivo}`, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'Sim', callback_data: 'confirmar-channnel' },
                { text: 'Não', callback_data: 'cancelar-channel' },
              ],
            ],
          },
        })
      }

      if (data === 'cancelar-intercessao') {
        bot.editMessageText(messageCancel, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          chat_id: chatId,
          message_id: messageId,
        });
      }
    }
    else if (comando[1] == "channnel") {
      const chatId = query.message.chat.id;
      const userId = query.from.id;
      const data = query.data;
      const messageId = query.message.message_id;

      const messageConfirm = '✅ Sua oração enviada para o canal. Acesse @pedidosdeoracaoperegrino';
      const messageCancel = '❌ Envio cancelado.';

      if (data === 'confirmar-channnel') {


        const nome = bot.nomeOracao;
        const motivo = bot.motivoOracao;

        bot.editMessageText(messageConfirm, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          chat_id: chatId,
          message_id: messageId,
        });
        await bot.sendMessage(channelIdIt, `Pedido de oração:\n\nNome: ${nome}\nMotivo: ${motivo}`)
      }

      if (data === 'cancelar-channnel') {
        bot.editMessageText(messageCancel, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
          chat_id: chatId,
          message_id: messageId,
        });
      }
    }
  } else if (["aa", "acf", "ara", "arc", "as21", "jfaa", "kja", "kjf", "naa", "nbv", "ntlh", "nvi", "nvt", "tb", "back"].includes(query.data)) {
    const chosenTranslation = query.data;
    const userId = query.from.id;

    if (chosenTranslation === 'back') {
      return bot.editMessageText(`<b>Escolha sua tradução preferida:</b>\n\n<b>Tradução atual:</b> ${user.translation.toUpperCase()}\n\nPara saber mais das traduções digite /infotradu`, {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: translationButtons,
        },
      });
    }

    user.translation = chosenTranslation;
    await user.save();

    const confirmationMessage = `<b>Tradução definida para ${chosenTranslation.toUpperCase()}</b>`;
    const backToTraducaoButton = {
      text: '⬅️ Voltar',
      callback_data: 'back',
    };

    await bot.editMessageText(confirmationMessage, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[backToTraducaoButton]],
      },
    });
  }
  else if (data === "commands") {
    const functions = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🙏 Oração",
              callback_data: "oracao",
            },
            {
              text: "📝 Anotação",
              callback_data: "anotacao",
            },
          ],
          [
            {
              text: "🖌 Traduções",
              callback_data: "traducao",
            },
          ],
          [
            {
              text: "📆 Plano bíblico",
              callback_data: "biblico",
            },
            {
              text: "📖 Planos",
              callback_data: "planos",
            },
          ],
          [
            {
              text: "⏰ Versículos",
              callback_data: "versiculos",
            },
          ],
          [
            {
              text: "⚡️ Atividade",
              callback_data: "atividade",
            },
            {
              text: "🔎 Bíblia inline",
              callback_data: "bibliainline",
            },
          ],
          [
            {
              text: "Voltar",
              callback_data: "back_to_help",
            },
          ],
        ],
      },
    }
    const funcao = `<b>As funções do bot</b>\n\nClique nos botões abaixo para saber informações de cada funcionalidade do bot.\n\nPara ter acesso a lista de comandos, digite /comandos`

    await bot.editMessageText(funcao, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: chatId,
      message_id: messageId,
      reply_markup: functions.reply_markup,
    });
  } else if (data === "donate") {
    const resposta_donate = `Olá, ${firstName}! \n\nContribua com qualquer valor para ajudar a manter o servidor do bot online e com mais recursos! Sua ajuda é fundamental para mantermos o bot funcionando de forma eficiente e com novas funcionalidades. \n\nPara fazer uma doação, utilize a chave PIX a seguir: \nPix: <code>32dc79d2-2868-4ef0-a277-2c10725341d4</code>\nBanco: Picpay\nNome: Luzia\n\nObrigado pela sua contribuição! 🙌\n\n<b>BTC:</b> <code>bc1qjxzlug0cwnfjrhacy9kkpdzxfj0mcxc079axtl</code>\n<b>ETH/USDT:</b> <code>0x1fbde0d2a96869299049f4f6f78fbd789d167d1b</code>`;

    await bot.editMessageText(resposta_donate, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Voltar",
              callback_data: "back_to_help",
            },
          ],
        ],
      },
    })
  } else if (data === "back_to_help") {
    const text =
      `<b>Olá! ${firstName}</b>\n\nEu sou um bot com o objetivo de propagar o evangelho pelo Telegram. Estou aqui para ajudá-lo em sua jornada espiritual e proporcionar uma experiência enriquecedora com recursos e comandos relacionados à Palavra de Deus. Fique à vontade para explorar as opções abaixo e descobrir tudo o que posso oferecer:\n\n<b>Funções disponíveis:</b>\n\n- Plano de leitura bíblica em 365 dias (18h)\n- Planos diversos(21h30min)\n- Adicione seus motivos de oração e crie lembretes\n- Adicione anotações bíblicas e reveja\n- Tenha um monitoramento de dias de estudo bíblico\n- Envio de versículos diários e versículos com tema para grupos\n- Pesquisa da Bíblia inline\n- Escolha a sua tradução preferida\n- Pedidos de intercessões`;
    const options = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📌 Lista de funções",
              callback_data: "commands",
            },
          ],
          [
            { text: "🚧 Projetos", url: "https://t.me/pjtlbrabo" },
            {
              text: "👤 Suporte", url: `https://t.me/kylorensbot`,
            },
          ],
          [
            {
              text: "💰 Faça uma contribuição",
              callback_data: "donate",
            }
          ]
        ],
      },
    };
    await bot.editMessageText(text, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: chatId,
      message_id: messageId,
      reply_markup: options.reply_markup,
    });
  } else if (data === "back_to_commands") {
    const functions = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🙏 Oração",
              callback_data: "oracao",
            },
            {
              text: "📝 Anotação",
              callback_data: "anotacao",
            },
          ],
          [
            {
              text: "🖌 Traduções",
              callback_data: "traducao",
            },
          ],
          [
            {
              text: "📆 Plano bíblico",
              callback_data: "biblico",
            },
            {
              text: "📖 Planos",
              callback_data: "planos",
            },
          ],
          [
            {
              text: "⏰ Versículos",
              callback_data: "versiculos",
            },
          ],
          [
            {
              text: "⚡️ Atividade",
              callback_data: "atividade",
            },
            {
              text: "🔎 Bíblia inline",
              callback_data: "bibliainline",
            },
          ],
          [
            {
              text: "Voltar",
              callback_data: "back_to_help",
            },
          ],
        ],
      },
    }
    const funcao = `<b>As funções do bot</b>\n\nClique nos botões abaixo para saber informações de cada funcionalidade do bot.\n\nPara ter acesso a lista de comandos, digite /comandos`

    await bot.editMessageText(funcao, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: chatId,
      message_id: messageId,
      reply_markup: functions.reply_markup,
    });
  } else if (data === "oracao") {
    const msgoracao = '<b>Para adicionar seus motivos de oração, siga estas etapas:</b>\n\n' +
      '1. <code>/oracao</code> - Visualiza seus motivos de oração.\n' +
      '2. <code>/addmotivo</code> &lt;motivo&gt; - Adiciona um novo motivo de oração.\n' +
      '3. <code>/delmotivo</code> &lt;número&gt; - Remove um motivo de oração específico.\n' +
      '4. <code>/horariooracao</code> &lt;horário&gt; - Define o horário de oração (formato 24h). <code>Ex: 21:30</code>\n' +
      '5. <code>/desativarhorario</code> - Desative o horário de oração\n' +
      '6. <code>/intercessao</code> - Envie um pedido de intercessão para o canal @pedidosdeoracaoperegrino\n\n' +
      'Certifique-se de ter no máximo <b>5 motivos</b> de oração cadastrados. Para mais informações digite /ajudaoracao';
    await bot.editMessageText(msgoracao, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Voltar",
              callback_data: "back_to_commands",
            },
          ],
        ],
      },
    });
  } else if (data === "anotacao") {
    const msganotacao = '<b>Para usar os comandos de anotação, siga estas etapas:</b>\n\n<b>1.</b> Digite <code>/anotacao</code> para visualizar suas anotações.\n<b>2.</b> Use <code>/addanotacao</code> &lt;texto que deseja anotar aqui&gt; para adicionar uma nova anotação.\n<b>3.</b> Utilize <code>/delanotacao</code> &lt;número&gt; para remover uma anotação específica.\n\n<b>Certifique-se de ter no máximo 10 anotações cadastradas e usar somente 200 caracteres. Para mais informações digite: /ajudaanotacao</b>';
    await bot.editMessageText(msganotacao, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Voltar",
              callback_data: "back_to_commands",
            },
          ],
        ],
      },
    });
  } else if (data === "traducao") {
    const msgatraducao = '<b>O Pelegrino possibilita que você escolha dentre 14 traduções a sua preferida</b>\n\nPela glória de Deus possuímos irmãos dedicados na propagação o Evangelho de Cristo, e com a ajuda do programadores <a href="https://github.com/damarals/biblias">Daniel Amaral</a> e <a href="https://github.com/thiagobodruk/biblia">Thiago Bodruk</a>\n\nPara saber mais digite: /infotradu!';
    await bot.editMessageText(msgatraducao, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Voltar",
              callback_data: "back_to_commands",
            },
          ],
        ],
      },
    });
  } else if (data === "biblico") {
    const msgplanobiblico = '<b>Plano bíblico 365 dias</b>\n\nEsse plano bíblico segue a linha canônica, então vai direto para a Bíblia de Gênesis a Apocalipse. Você receberá leituras para cada dia da semana como um guia constante para terminar a Bíblia inteira em um ano.\n\nEnvie /planobiblico para iniciar o plano!\nE se quiser mudar a tradução digita /traducao';
    await bot.editMessageText(msgplanobiblico, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Voltar",
              callback_data: "back_to_commands",
            },
          ],
        ],
      },
    });
  } else if (data === "planos") {
    const msgplano = '<b>O Pelegrino possui inúmeros planos bíblicos</b>\n\nEsses planos são projetados para ajudar as pessoas a se envolverem regularmente com a Palavra de Deus, fornecendo uma estrutura para ler a Bíblia de forma consistente ao longo de um período de tempo.\n\nEnvie /plano para escolher um plano e /topplanos para ver o ranking';
    await bot.editMessageText(msgplano, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Voltar",
              callback_data: "back_to_commands",
            },
          ],
        ],
      },
    });
  } else if (data === "versiculos") {
    const msgplano = '<b>O Pelegrino envia diariamente versículos bíblicos</b>\n\nO envio acontece às 8 horas, e é enviado um versículo por dia\n\nEnvie /verson para ativar e /versoff para desativar o envio!\n\nO envio de versículo também ocorrer para os grupos, basta colocar o bot como administrador no grupo e escolher um tema: /verstema e escolher entre Adoração, Amor, Consolo, Encorajamento, Fé'; await bot.editMessageText(msgplano, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Voltar",
              callback_data: "back_to_commands",
            },
          ],
        ],
      },
    });
  } else if (data === "atividade") {
    const msgatividade = '<b>O Pelegrino possui um sistema que contabiliza os dias de uso no bot</b>\n\nE possuímos um sistema de rank que disponibiliza níveis (de forma ludica) que é alcançado a cada perseverança \n\nEnvie /dia para saber maiis e /topdias para ver o ranking';
    await bot.editMessageText(msgatividade, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Voltar",
              callback_data: "back_to_commands",
            },
          ],
        ],
      },
    });
  } else if (data === "bibliainline") {
    const msginline = '<b>O Pelegrino possui uma bíblia inline</b>\n\nVocê pode tá se perguntando o que seria isso... basicamente é uma consulta por uma linha de comando, isto é, você pode consultar a bíblia em qualquer lugar do telegram (Grupos, Canais e chat privado).\n\nBasta enviar <code>@operegrino_bot Gênesis 1</code>\n<code>@operegrino_bot gn 1</code>\n<code>@operegrino_bot ap 1:2</code>\n<code>@operegrino_bot ex 1:5-8</code>.\n\nPara acessar a lista dos nome dos livros ou abreviações digite: /livros !';
    await bot.editMessageText(msginline, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Bíblia",
              switch_inline_query_current_chat: '',
            },
          ],
          [
            {
              text: "Voltar",
              callback_data: "back_to_commands",
            },
          ],
        ],
      },
    });
  } else if (data === "edit_caption") {
    const newCaption = `<b>SOBRE O BOT</b>\n\nEste bot foi inspirado na <a href="https://www.bible.com/pt">Bíblia YourVersion</a> e tem como objetivo principal propagar a palavra de Deus e auxiliar no estudo das escrituras sagradas. O bot oferece acesso fácil a 14 diferentes traduções bíblicas. (/infotradu)\n\nCom um acervo variado, os usuários podem escolher a versão preferida para leitura e estudo, atendendo às suas necessidades individuais de compreensão e interpretação das Escrituras. Essa diversidade de traduções proporciona uma experiência enriquecedora e abrangente.\n\nAlém das traduções, o bot disponibiliza recursos complementares, como planos bíblicos e versículos bíblicos diários\n\n<i>Agradeço sinceramente a <a href="https://t.me/peterinvest">Peter</a> pelo apoio e orientação durante o desenvolvimento deste bot.</i>\n\nQue este bot seja uma ferramenta valiosa e inspiradora para todos que buscam se conectar com a Palavra de Deus e fortalecer sua espiritualidade.`;

    const backToStartButton = [
      {
        text: "↩️ Voltar",
        callback_data: "back_to_start",
      },
      {
        text: "👤 Suporte",
        url: `tg://user?id=${owner}`,
      },
    ];

    const currentMessage = query.message.text;
    if (currentMessage !== newCaption) {
      await bot.editMessageText(newCaption, {
        parse_mode: "HTML",
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [backToStartButton],
        },
      });
    }
  } else if (data === "minha_conta") {
    const userId = query.from.id;
    const user = await UserModel.findOne({ user_id: userId });
    const plano = await PlanoModel.findOne({ user_id: userId });
    const planoStatus = plano && plano.planoAtivo ? 'Ativo' : 'Inativo';
    const {
      firstname,
      user_id,
      diariavers,
      fowr_private,
      blb365,
      dia,
      versiculoUser,
      motivosdeoracao,
      horariodeoracao,
      blocodenotas,
      diasdeestudo,
      translation,
    } = user;

    const userRank = getUserRank(diasdeestudo);

    let statusMessage = `<b>Informações do usuário:</b>\n\n`;
    statusMessage += `<b>🪪 Nome:</b> <a href="tg://user?id=${user_id}">${firstname}</a>\n`;
    statusMessage += `<b>⏰ Recebe versos diários:</b> ${diariavers ? 'Sim' : 'Não'}\n`;
    statusMessage += `<b>🗂 Recebe informativos:</b> ${fowr_private ? 'Sim' : 'Não'}\n`;
    statusMessage += `<b>📆 Plano de 365 dias:</b> ${blb365 ? 'Ativo' : 'Desativado'}\n`;

    if (blb365) {
      statusMessage += `<b>📅 Dia:</b> <code>${dia}</code>/365\n`;
      statusMessage += `<b>📜Versículo:</b> <code>${versiculoUser}</code>/31105\n`;
    }

    statusMessage += `<b>🙏 Motivos de oração:</b> ${motivosdeoracao.length} motivos\n`;
    motivosdeoracao.forEach((motivo, index) => {
      statusMessage += `<b>         ${index + 1} -</b> ${motivo}\n`;
    });

    statusMessage += `<b>🔔 Alerta de oração:</b> ${horariodeoracao || 'Não definido'}\n`;

    statusMessage += `<b>📝 Anotações:</b> ${blocodenotas.length} anotações\n`;
    blocodenotas.forEach((anotacao, index) => {
      statusMessage += `<b>         ${index + 1} -</b> ${anotacao}\n`;
    });
    if (plano && plano.plano1) {
      statusMessage += `<b>📖 Plano:</b> Transformado\n`;
    }

    if (plano && plano.plano2) {
      statusMessage += `<b>📖 Plano:</b> Sabedoria Divina\n`;
    }
    if (plano && plano.planosConcluidos) {
      statusMessage += `<b>✅ Plano Concluídos:</b> ${plano && plano.planosConcluidos ? plano.planosConcluidos : 0} planos\n`;
    }
    statusMessage += `<b>⚡️ Atividade no bot:</b> ${diasdeestudo} dias\n`;
    statusMessage += `<b>📈 Rank:</b> ${userRank}\n`;
    statusMessage += `<b>🖌 Tradução:</b> ${translation.toUpperCase()}`;

    await bot.editMessageText(statusMessage, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Voltar",
              callback_data: "back_to_start",
            },
          ],
        ],
      },
    });
  } else if (data === "ver_planos") {
    const msgplano = `<b>17 planos disponíveis</b>\n\n` +
      `📗 /planotransformado — Seja Transformado (3d)\n` +
      `📗 /planosabedoriadnv — Sabedoria Divina (5d)\n` +
      `📗 /planont — Novo Testamento (80d)\n` +
      `📗 /planoop — Orações Perigosas (7d)\n` +
      `📗 /planobibliatd — Bíblia para Todos (3d)\n` +
      `📗 /planocsr — Restaurando o Casamento (10d)\n` +
      `📗 /planolinguagemdoamor — 5 Linguagens do Amor (7d)\n` +
      `📗 /planonamoroctmp — Namoro Contemporâneo (7d)\n` +
      `📗 /planoapocalipse — Série Apocalipse (22d)\n` +
      `📗 /planonamoropb — Namoro Preto no Branco (5d)\n` +
      `📗 /planocasamento — Curso do Casamento (5d)\n` +
      `📗 /planodvc — Do Divórcio à Cura (7d)\n` +
      `📗 /planodevocionais — Crescendo na Fé (6d)\n` +
      `📗 /planosalmos — 30 Dias nos Salmos (30d)\n` +
      `📗 /planoproverbios — 30 Dias em Provérbios (30d)\n` +
      `📗 /planoidemcristo — Identidade em Cristo (7d)\n` +
      `📗 /planoansiedade — Ansiedade e Fé (7d)\n\n` +
      `<i>Enviados diariamente às 21h30. Use /cancelarplano para cancelar o ativo.</i>`;
    await bot.editMessageText(msgplano, {
      parse_mode: "HTML",
      chat_id: chatId,
      message_id: messageId,
      reply_markup: { inline_keyboard: [[{ text: "↩️ Voltar", callback_data: "back_to_start" }]] },
    });
  } else if (data === "back_to_start") {
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

    await bot.editMessageText(msgstart, {
      parse_mode: "HTML",
      chat_id: chatId,
      message_id: messageId,
      disable_web_page_preview: true,
      reply_markup: options_start.reply_markup,
    });
  }

});


// ORAÇÃO

bot.onText(/\/oracao/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const user = await UserModel.findOne({ user_id: userId });

    if (user) {
      if (user.motivosdeoracao && user.motivosdeoracao.length > 0) {
        const motivosList = user.motivosdeoracao.map((motivo, index) => {
          return `${index + 1}. ${motivo}`;
        }).join('\n');

        bot.sendMessage(chatId, `<b>Seus motivos de oração 🙏</b>\n\n<code>${motivosList}</code>`, { parse_mode: 'HTML' });
      } else {
        bot.sendMessage(chatId, 'Você não tem motivos de oração cadastrados.');
      }
    } else {
      bot.sendMessage(chatId, 'Você ainda não tem um registro de usuário. Digite /addoracao para criar um registro e adicionar motivos de oração.');
    }
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    bot.sendMessage(chatId, 'Desculpe, ocorreu um erro ao processar sua solicitação.');
  }
});

bot.onText(/\/addmotivo ?(.+)?/, async (msg, match) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (msg.text.toString().toLowerCase().trim() === "/addmotivo") {
    bot.sendMessage(chatId, "Comando incorreto, utilize /ajudaoracao em caso de dúvidas");
    return;
  }

  try {
    const motivo = match[1].trim();
    const user = await UserModel.findOne({ user_id: userId });

    if (user) {
      if (!user.motivosdeoracao) {
        user.motivosdeoracao = [motivo];
      } else if (user.motivosdeoracao.length < 5) {
        user.motivosdeoracao.push(motivo);
      } else {
        bot.sendMessage(chatId, `Você já possui 5 motivos de oração cadastrados. Remova um motivo antes de adicionar outro (<code>/delmotivo N°</code>)`, { parse_mode: 'HTML' });
        return;
      }

      await user.save();
      bot.sendMessage(chatId, '✅ Motivo de oração adicionado com sucesso.');
    } else {
      bot.sendMessage(chatId, 'Você ainda não tem um registro de usuário. Digite /addoracao para criar um registro e adicionar motivos de oração.');
    }
  } catch (err) {
    console.error('Erro ao salvar motivo de oração:', err);
    bot.sendMessage(chatId, 'Desculpe, ocorreu um erro ao processar sua solicitação.');
  }
});

bot.onText(/\/delmotivo ?(.+)?/, async (msg, match) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (msg.text.toString().toLowerCase().trim() === "/delmotivo") {
    bot.sendMessage(chatId, "Comando incorreto, utilize /ajudaoracao em caso de dúvidas");
    return;
  }

  try {
    const motivoIndex = parseInt(match[1]) - 1;
    const user = await UserModel.findOne({ user_id: userId });

    if (user && user.motivosdeoracao && user.motivosdeoracao.length > motivoIndex) {
      user.motivosdeoracao.splice(motivoIndex, 1);

      await user.save();
      bot.sendMessage(chatId, '❎ Motivo de oração removido com sucesso.');
    } else {
      bot.sendMessage(chatId, 'Motivo de oração não encontrado.');
    }
  } catch (err) {
    console.error('Erro ao remover motivo de oração:', err);
    bot.sendMessage(chatId, 'Desculpe, ocorreu um erro ao processar sua solicitação.');
  }
});

bot.onText(/\/horariooracao ?(.+)?/, async (msg, match) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (msg.text.toString().toLowerCase().trim() === "/horariooracao") {
    bot.sendMessage(chatId, "Comando incorreto, utilize /ajudaoracao em caso de dúvidas");
    return;
  }
  const horario = match[1].trim();

  if (!/^\d{1,2}:\d{2}$/.test(horario)) {
    bot.sendMessage(chatId, 'Por favor, envie o horário no formato 24h. Por exemplo: <code>/horariooracao 8:30</code>', { parse_mode: 'HTML' });
    return;
  }


  try {
    const user = await UserModel.findOne({ user_id: userId });

    if (user) {
      user.horariodeoracao = horario;
      await user.save();

      bot.sendMessage(chatId, `Seu horário de oração foi definido para ${horario}.`);
    } else {
      bot.sendMessage(chatId, 'Usuário não encontrado.');
    }
  } catch (err) {
    console.error('Erro ao definir o horário de oração:', err);
    bot.sendMessage(chatId, 'Desculpe, ocorreu um erro ao processar sua solicitação.');
  }
});

bot.onText(/\/delhorario/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const user = await UserModel.findOne({ user_id: userId });

    if (user) {
      user.horariodeoracao = null;
      await user.save();

      bot.sendMessage(chatId, 'O horário de oração foi desativado.');
    } else {
      bot.sendMessage(chatId, 'Usuário não encontrado.');
    }
  } catch (err) {
    console.error('Erro ao desativar o horário de oração:', err);
    bot.sendMessage(chatId, 'Desculpe, ocorreu um erro ao processar sua solicitação.');
  }
});

function enviarMotivosDeOracao(chatId, motivos) {
  if (motivos.length > 0) {
    bot.sendMessage(chatId, '<b>🔔 LEMBRENTE DE ORAR</b>\n\n' + motivos.join('\n'), { parse_mode: 'HTML' });
  } else {
    bot.sendMessage(chatId, 'Adicione motivos de oração para receber lembretes.');
  }
}

async function verificarHorarioOracao() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  try {
    const paddedMinute = String(currentMinute).padStart(2, '0');
    const users = await UserModel.find({ horariodeoracao: `${currentHour}:${paddedMinute}` }).exec();

    users.forEach((user) => {
      const chatId = user.user_id;
      const motivos = user.motivosdeoracao || [];

      if (motivos.length > 0) {
        enviarMotivosDeOracao(chatId, motivos);
      } else {
        enviarMotivosDeOracao(chatId, []);
      }
    });
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
  }
}


setInterval(verificarHorarioOracao, 60000);

bot.onText(/\/ajudaoracao/, (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const chatId = msg.chat.id;
  const photoPath = 'src/image/helporacao.png';
  const caption = '<b>Para adicionar seus motivos de oração, siga estas etapas:</b>\n\n' +
    '1. <code>/oracao</code> - Visualiza seus motivos de oração.\n' +
    '2. <code>/addmotivo</code> &lt;motivo&gt; - Adiciona um novo motivo de oração.\n' +
    '3. <code>/delmotivo</code> &lt;número&gt; - Remove um motivo de oração específico.\n' +
    '4. <code>/horariooracao</code> &lt;horário&gt; - Define o horário de oração (formato 24h). <code>Ex: 21:30</code>\n' +
    '5. <code>/desativarhorario</code> - Desative o horário de oração\n\n' +
    'Certifique-se de ter no máximo <b>5 motivos</b> de oração cadastrados.';
  bot.sendPhoto(chatId, photoPath, { caption, parse_mode: 'HTML' });

});

// ANOTAÇÃO

bot.onText(/\/anotacao/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    const user = await UserModel.findOne({ user_id: userId });

    if (user && user.blocodenotas && user.blocodenotas.length > 0) {
      let anotacoesList = "";
      user.blocodenotas.forEach((anotacao, index) => {
        anotacoesList += `${index + 1}. <code>${anotacao}</code>\n\n`;
      });

      bot.sendMessage(chatId, `<b>Suas anotações 📝</b>\n\n${anotacoesList}`, { parse_mode: 'HTML' });
    } else {
      bot.sendMessage(chatId, `Nenhuma anotação encontrada. Para adicionar anotações digite: <code>/addanotacao</code>\n\nLembre-se de colocar no máximo 200 caracteres entre cada anotacação`, { parse_mode: 'HTML' });
    }
  } catch (err) {
    console.error('Erro ao obter anotações:', err);
    bot.sendMessage(chatId, 'Desculpe, ocorreu um erro ao processar sua solicitação.');
  }
});

bot.onText(/\/addanotacao ?(.+)?/, async (msg, match) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (msg.text.toString().toLowerCase().trim() === "/addanotacao") {
    bot.sendMessage(chatId, "Comando incorreto, utilize /ajudaanotacao em caso de dúvidas");
    return;
  }

  try {
    const anotacao = match[1].trim();
    const user = await UserModel.findOne({ user_id: userId });

    if (user) {
      if (!user.blocodenotas) {
        user.blocodenotas = [];
      }

      if (user.blocodenotas.length >= 10) {
        bot.sendMessage(chatId, `Você atingiu o limite máximo de 10 anotações.Remova um motivo antes de adicionar outro(<code>/delanotacao N°</code>)`, { parse_mode: 'HTML' });
        return;
      }

      user.blocodenotas.push(anotacao);
      await user.save();

      bot.sendMessage(chatId, '✅ Anotação adicionada com sucesso.');
    } else {
      bot.sendMessage(chatId, 'Usuário não encontrado.');
    }
  } catch (err) {
    console.error('Erro ao adicionar anotação:', err);
    bot.sendMessage(chatId, 'Desculpe, ocorreu um erro ao processar sua solicitação.');
  }
});

bot.onText(/\/delanotacao ?(.+)?/, async (msg, match) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (msg.text.toString().toLowerCase().trim() === "/delanotacao") {
    bot.sendMessage(chatId, "Comando incorreto, utilize /ajudaanotacao em caso de dúvidas");
    return;
  }

  try {
    const anotacaoIndex = parseInt(match[1]) - 1;
    const user = await UserModel.findOne({ user_id: userId });

    if (user && user.blocodenotas && user.blocodenotas.length > anotacaoIndex) {
      user.blocodenotas.splice(anotacaoIndex, 1);

      await user.save();
      bot.sendMessage(chatId, '❎ Anotação removida com sucesso.');
    } else {
      bot.sendMessage(chatId, 'Anotação não encontrada.');
    }
  } catch (err) {
    console.error('Erro ao remover anotação:', err);
    bot.sendMessage(chatId, 'Desculpe, ocorreu um erro ao processar sua solicitação.');
  }
});

bot.onText(/\/ajudaanotacao/, (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const chatId = msg.chat.id;
  const photoPath = 'src/image/helpanotacao.png';
  const caption = '<b>Para usar os comandos de anotação, siga estas etapas:</b>\n\n<b>1.</b> Digite <code>/anotacao</code> para visualizar suas anotações.\n<b>2.</b> Use <code>/addanotacao</code> &lt;texto que deseja anotar aqui&gt; para adicionar uma nova anotação.\n<b>3.</b> Utilize <code>/delanotacao</code> &lt;número&gt; para remover uma anotação específica.\n\n<b>Certifique-se de ter no máximo 10 anotações cadastradas e usar somente 200 caracteres</b>';

  bot.sendPhoto(chatId, photoPath, { caption, parse_mode: 'HTML' });

});

// RANKING DE FRENQUENCIA

bot.onText(/\/topdias/, async (msg) => {
  try {
    const usuarios = await UserModel.find()
      .sort({ diasdeestudo: -1 })
      .limit(5)
      .select('firstname diasdeestudo');

    let message = '<b>Ranking dos 5 mais ativos</b>\n\n';
    usuarios.forEach((usuario, index) => {
      message += `<code>#${index + 1}</code> <b>${usuario.firstname}</b> - <code>${usuario.diasdeestudo} dias</code>\n`;
    });

    bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
  }
});

// RANKING DE PLANOS CONCLUÍDOS

bot.onText(/\/topplanos/, async (msg) => {
  try {
    const topPlanos = await PlanoModel.find({ planosConcluidos: { $gt: 0 } })
      .sort({ planosConcluidos: -1 })
      .limit(5)
      .select('user_id planosConcluidos');

    const userIds = topPlanos.map(p => p.user_id);
    const users = await UserModel.find({ user_id: { $in: userIds } }).select('user_id firstname');
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u.firstname; });

    let message = '<b>Ranking dos 5 maiores usuários com mais planos concluídos:</b>\n\n';
    topPlanos.forEach((plano, index) => {
      const nome = userMap[plano.user_id] || 'Usuário';
      message += `<code>#${index + 1}</code> <b>${nome}</b> - <code>${plano.planosConcluidos} Planos Concluídos</code>\n`;
    });

    if (topPlanos.length === 0) {
      message += '<i>Nenhum plano concluído ainda.</i>';
    }

    bot.sendMessage(msg.chat.id, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
  }
});


// DIAS DE FREQUENCIA

async function sendCongratulatoryMessage() {
  try {
    const users = await UserModel.find({ receivedPlusOne: true });

    for (const user of users) {
      if (user.receivedPlusOne) {
        // Executa a ação se receivedPlusOne for true

        // Modifica os valores de diasdeestudo e receivedPlusOne
        user.diasdeestudo += 1;
        user.receivedPlusOne = false;
        const message = `<b>Perseverança atual: ${user.diasdeestudo}</b>\n\n<i>Mantenha o seu ritmo! 📖🙏</i>`;

        bot.sendMessage(
          user.user_id,
          message,
          { parse_mode: 'HTML' }
        );
      } else {
        // Caso receivedPlusOne seja false, define diasdeestudo como 0
        user.diasdeestudo = 0;
      }

      // Salva as alterações no banco de dados
      await user.save();
    }
  } catch (error) {
    console.error('Erro ao enviar a mensagem:', error);
  }
}

const loser = new CronJob('50 59 23 * * *', sendCongratulatoryMessage, null, true, "America/Sao_Paulo");
loser.start();



// STATUS

bot.onText(/\/status/, async (msg) => {
  const userId = msg.from.id;
  const plano = await PlanoModel.findOne({ user_id: userId });
  const planoStatus = plano && plano.planoAtivo ? 'Ativo' : 'Inativo';

  try {
    const user = await UserModel.findOne({ user_id: userId });
    if (!user) {
      bot.sendMessage(userId, 'Usuário não encontrado.');
      return;
    }


    const {
      firstname,
      user_id,
      diariavers,
      fowr_private,
      blb365,
      dia,
      versiculoUser,
      motivosdeoracao,
      horariodeoracao,
      blocodenotas,
      diasdeestudo,
      translation,
    } = user;

    const userRank = getUserRank(diasdeestudo);

    let statusMessage = `<b>Informações do usuário:</b>\n\n`;
    statusMessage += `<b>🪪 Nome:</b> <a href="tg://user?id=${user_id}">${firstname}</a>\n`;
    statusMessage += `<b>⏰ Recebe versos diários:</b> ${diariavers ? 'Sim' : 'Não'}\n`;
    statusMessage += `<b>🗂 Recebe informativos:</b> ${fowr_private ? 'Sim' : 'Não'}\n`;
    statusMessage += `<b>📆 Plano de 365 dias:</b> ${blb365 ? 'Ativo' : 'Desativado'}\n`;

    if (blb365) {
      statusMessage += `<b>📅 Dia:</b> <code>${dia}</code>/365\n`;
      statusMessage += `<b>📜Versículo:</b> <code>${versiculoUser}</code>/31105\n`;
    }

    statusMessage += `<b>🙏 Motivos de oração:</b> ${motivosdeoracao.length} motivos\n`;
    motivosdeoracao.forEach((motivo, index) => {
      statusMessage += `<b>         ${index + 1} -</b> ${motivo}\n`;
    });

    statusMessage += `<b>🔔 Alerta de oração:</b> ${horariodeoracao || 'Não definido'}\n`;

    statusMessage += `<b>📝 Anotações:</b> ${blocodenotas.length} anotações\n`;
    blocodenotas.forEach((anotacao, index) => {
      statusMessage += `<b>         ${index + 1} -</b> ${anotacao}\n`;
    });
    if (plano && plano.plano1) {
      statusMessage += `<b>📖 Plano:</b> Transformado\n`;
    }

    if (plano && plano.plano2) {
      statusMessage += `<b>📖 Plano:</b> Sabedoria Divina\n`;
    }
    if (plano && plano.planosConcluidos) {
      statusMessage += `<b>✅ Plano Concluídos:</b> ${plano && plano.planosConcluidos ? plano.planosConcluidos : 0} planos\n`;
    }
    statusMessage += `<b>⚡️ Atividade no bot:</b> ${diasdeestudo} dias\n`;
    statusMessage += `<b>📈 Rank:</b> ${userRank}\n`;
    statusMessage += `<b>🖌 Tradução:</b> ${translation.toUpperCase()}`;

    bot.sendMessage(userId, statusMessage, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error retrieving user status:', error);
    bot.sendMessage(userId, 'Ocorreu um erro ao recuperar o status do usuário.');
  }
}
);

// CANCELAR PLANO ATIVO

bot.onText(/\/cancelarplano/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  try {
    const plano = await PlanoModel.findOne({ user_id: userId, planoAtivo: true });

    if (!plano) {
      bot.sendMessage(chatId, "Você não possui nenhum plano ativo no momento.\n\nUse /plano para escolher um plano.");
      return;
    }

    const planoFlags = {};
    for (let i = 1; i <= 30; i++) {
      planoFlags[`plano${i}`] = false;
    }

    await PlanoModel.updateOne(
      { user_id: userId },
      {
        $set: {
          planoAtivo: false,
          diaPlano: null,
          messagePlano: [],
          messagePositionPlano: 0,
          messageIdPlano: null,
          ...planoFlags,
        },
      }
    );

    bot.sendMessage(chatId, "✅ Seu plano foi cancelado com sucesso.\n\nUse /plano para escolher um novo plano.");
  } catch (error) {
    console.error("Erro ao cancelar plano:", error);
    bot.sendMessage(chatId, "Ocorreu um erro ao cancelar seu plano. Tente novamente.");
  }
});

// consulta da bíblia inline

bot.on('inline_query', async (query) => {
  try {
    const userId = query.from.id;
    let user = await UserModel.findOne({ user_id: userId });

    if (!query.query) {
      const result_init = {
        type: 'article',
        id: query.id,
        title: 'Digite o nome do texto bíblico e sua referência',
        description: 'Por exemplo: Gênesis 1:3 ou gn 1:3',
        input_message_content: {
          message_text: `<b>O Pelegrino possui uma bíblia inline</b>\n\nVocê pode tá se perguntando o que seria isso... basicamente é uma consulta por uma linha de comando, isto é, você pode consultar a bíblia em qualquer lugar do telegram (Grupos, Canais e chat privado).\n\nBasta enviar <code>@operegrino_bot Gênesis 1</code>\n<code>@operegrino_bot gn 1</code>\n<code>@operegrino_bot ap 1:2</code>\n<code>@operegrino_bot ex 1:5-8</code>.\n\nPara acessar a lista dos nome dos livros ou abreviações digite: /livros !`,
          parse_mode: 'HTML',
        },
        thumbnail_url: 'https://i.imgur.com/QKb7BfU.jpeg',
      }
      await bot.answerInlineQuery(query.id, [result_init], {
        switch_pm_text: 'Como usar o bot',
        switch_pm_parameter: "how_to_use",
        cache_time: 0,
      });

      return;
    }

    if (!user) {
      user = new UserModel({
        user_id: userId,
        username: query.from.username,
        firstname: query.from.first_name,
        lastname: query.from.last_name,
        fowr_private: true,
        is_dev: false,
        is_ban: false,
        diariavers: false,
        blb365: false,
        diasdeestudo: 0,
        translation: "acf",
        receivedPlusOne: false
      });
      await user.save();
    }

    const translation = user.translation || 'acf';
    const jsonBible = require(`../bible/${translation}.json`);
    const BibleUrl = "https://i.imgur.com/72v1d7A.png";

    if (!query.query) {
      await bot.answerInlineQuery(query.id, []);
      return;
    }

    const searchQuery = query.query.trim();

    let livro, capitulo, versiculo, versiculo_fim;

    let test_search = searchQuery.split(" ");
    if (test_search.length > 1) {
      livro = test_search[0];
      let test_capt_vers = test_search[1].split(":");
      if (test_capt_vers.length > 1) {
        capitulo = test_capt_vers[0];
        let test_vers = test_capt_vers[1].split("-");
        if (test_vers.length > 1) {
          versiculo = test_vers[0];
          versiculo_fim = test_vers[1];
        } else {
          versiculo = test_capt_vers[1];
        }
      } else {
        capitulo = test_search[1];
      }
    }

    if (livro && capitulo) {
      const bookQuery = livro;
      const chapterQuery = parseInt(capitulo);
      const startVerseQuery = parseInt(versiculo) | 0;
      const endVerseQuery = parseInt(versiculo_fim) | 0;

      // console.log('Book Query:', bookQuery);
      //   console.log('Chapter Query:', chapterQuery);
      // console.log('Start Verse Query:', startVerseQuery);
      // console.log('End Verse Query:', endVerseQuery);

      const filteredBooks = jsonBible.filter((book) => {
        return (
          (book.name &&
            book.name.localeCompare(bookQuery, 'en', { sensitivity: 'accent' }) === 0) ||
          (book.abbrev &&
            book.abbrev.localeCompare(bookQuery, 'en', { sensitivity: 'accent' }) === 0)
        );
      });

      // console.log('Filtered Books:', filteredBooks);

      if (filteredBooks.length > 0) {
        const book = filteredBooks[0];
        const chapterIndex = chapterQuery - 1;

        // console.log('Chapter Index:', chapterIndex);

        if (chapterIndex >= 0 && chapterIndex < book.chapters.length) {
          const chapter = book.chapters[chapterIndex];

          if (startVerseQuery === 0 && endVerseQuery === 0) {
            // Enviar o capítulo inteiro
            const chapterTextArray = chapter.map((verse, index) => {
              const verseNumber = index + 1;
              return `${getSmallSuperscriptNumber(verseNumber)}${verse}`;
            });

            const verseNumber = 1;
            const chapterText = chapterTextArray.join('\n');
            const caption = `${book.name} ${chapterQuery} (${user.translation.toUpperCase()})`;
            const text = `<b>${book.name} ${chapterQuery} (${user.translation.toUpperCase()})</b>`;
            // console.log(searchQuery);
            // console.log('Chapter Text:', chapterText);

            const result = {
              type: 'article',
              id: query.id,
              title: caption,
              input_message_content: {
                message_text: `${text} \n\n<b>${getSmallSuperscriptNumber(
                  verseNumber
                )}</b><i>${chapterText}</i>`,
                parse_mode: 'HTML',
              },
              description: chapterText.slice(0, 100),
              thumbnail_url: BibleUrl,
            };

            // console.log('Result:', result);

            await bot.answerInlineQuery(query.id, [result]);
            return;
          } else if (startVerseQuery > 0 && startVerseQuery <= chapter.length && endVerseQuery === 0) {
            const verseIndex = startVerseQuery - 1;

            // console.log('Verse Index:', verseIndex);

            if (verseIndex >= 0 && verseIndex < chapter.length) {
              // Enviar um versículo específico
              const verseText = chapter[verseIndex];
              const verseNumber = verseIndex + 1;

              const caption = `${book.name} ${chapterQuery}:${startVerseQuery} (${user.translation.toUpperCase()})`;
              const text = `<b>${book.name} ${chapterQuery}:${startVerseQuery} (${user.translation.toUpperCase()})</b>`;
              //  console.log(searchQuery);
              // console.log('Verse Text:', verseText);

              const result = {
                type: 'article',
                id: query.id,
                title: caption,
                input_message_content: {
                  message_text: `${text}\n\n<b>${getSmallSuperscriptNumber(
                    verseNumber
                  )}</b><i>${verseText}</i>`,
                  parse_mode: 'HTML',
                },
                description: verseText.slice(0, 100),
                thumbnail_url: BibleUrl,
              };

              // console.log('Result:', result);

              await bot.answerInlineQuery(query.id, [result]);
              return;
            }
          } else if (startVerseQuery > 0 && startVerseQuery <= chapter.length && endVerseQuery > 0 && startVerseQuery <= endVerseQuery && endVerseQuery <= chapter.length) {
            // Enviar um intervalo de versículos
            const startVerseIndex = startVerseQuery - 1;
            const endVerseIndex = endVerseQuery - 1;

            // console.log('Start Verse Index:', startVerseIndex);
            // console.log('End Verse Index:', endVerseIndex);

            if (
              startVerseIndex >= 0 &&
              startVerseIndex < chapter.length &&
              endVerseIndex >= 0 &&
              endVerseIndex < chapter.length &&
              startVerseIndex <= endVerseIndex
            ) {
              const verseTextArray = chapter.slice(startVerseIndex, endVerseIndex + 1);

              const verseText = verseTextArray.map((verse, index) => {
                const verseNumber = startVerseQuery + index;
                return `${getSmallSuperscriptNumber(verseNumber)}${verse}`;
              }).join('\n');

              const verseNumber = startVerseQuery;
              const lastVerseNumber = endVerseQuery;
              const verseRange = `${verseNumber}-${lastVerseNumber}`;
              const caption = `${book.name} ${chapterQuery}:${verseRange} (${user.translation.toUpperCase()})`;
              const text = `<b>${book.name} ${chapterQuery}:${verseRange} (${user.translation.toUpperCase()})</b>`;

              const result = {
                type: 'article',
                id: query.id,
                title: caption,
                input_message_content: {
                  message_text: `${text}\n\n${verseText}`,
                  parse_mode: 'HTML',
                },
                description: verseText.slice(0, 100),
                thumbnail_url: BibleUrl,
              };

              await bot.answerInlineQuery(query.id, [result]);
              return;
            }
          }
        }
      }

      await bot.answerInlineQuery(query.id, []);
    }
  } catch (error) {
    console.error('Ocorreu um erro durante o processamento da consulta:', error);
    const errorMessage = 'Erro, Texto bíblico não encontrado';
    const errorResult = [
      {
        type: 'article',
        id: query.id,
        title: 'Erro',
        description: 'Texto bíblico não encontrado',
        input_message_content: {
          message_text: errorMessage,
        },
        thumbnail_url:
          'https://e7.pngegg.com/pngimages/804/92/png-clipart-computer-icons-error-exit-miscellaneous-trademark.png',
      },
    ];
    bot.answerInlineQuery(query.id, errorResult);
  }
});




function getSmallSuperscriptNumber(number) {
  const superscriptDigits = [
    '\u2070', // 0
    '\u00B9', // 1
    '\u00B2', // 2
    '\u00B3', // 3
    '\u2074', // 4
    '\u2075', // 5
    '\u2076', // 6
    '\u2077', // 7
    '\u2078', // 8
    '\u2079', // 9
  ];

  const numberString = number.toString();
  let superscriptNumber = '';
  for (let i = 0; i < numberString.length; i++) {
    const digit = parseInt(numberString[i]);
    superscriptNumber += superscriptDigits[digit];
  }

  return superscriptNumber;
}

// NOME DOS MESES

function getMonthName(month) {
  const monthNames = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  return monthNames[month - 1];
}

// verisculo do dia

bot.onText(/\/versoff/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const user = await UserModel.findOne({ user_id: userId });
  if (!user) {
    bot.sendMessage(
      msg.chat.id,
      "Usuário não encontrado. Por favor, registre-se primeiro. /start"
    );
    return;
  }
  if (!user.diariavers) {
    bot.sendMessage(
      chatId,
      "Você já desativou a função de receber versículos bíblicos diários."
    );
    return;
  }
  await UserModel.findOneAndUpdate(
    { user_id: userId },
    { diariavers: false },
    { new: true }
  );
  console.log(
    `Usuário ${userId} atualizou para não receber mensagem no privado.`
  );

  bot.sendMessage(
    chatId,
    "Versículos bíblicos diários desativadas. Você não irá receber versículos bíblicos diários às 8 horas todos os dias."
  );
});

bot.onText(/\/verson/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.from.id;
  const user = await UserModel.findOne({ user_id: userId });

  if (!user) {
    bot.sendMessage(
      msg.chat.id,
      "Usuário não encontrado. Por favor, faça o registro primeiro."
    );
    return;
  }

  if (user.diariavers) {
    bot.sendMessage(
      msg.chat.id,
      "Você já ativou a função de receber versículos bíblicos diários."
    );
    return;
  }

  await UserModel.findOneAndUpdate(
    { user_id: userId },
    { diariavers: true },
    { new: true }
  );

  console.log(`Usuário ${userId} atualizado para receber mensagens no privado`);

  bot.sendMessage(
    msg.chat.id,
    "Versículos bíblicos diários ativadas. Você receberá versículos bíblicos diários todos os dias às 8 horas."
  );
});

// ENVIO DO VERSÍCULO BÍBLICO PARA O USER

async function getVersiculoUser(userId) {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;

  try {
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: "📢 Canal Oficial",
            url: "https://t.me/peregrinobr",
          },
        ],
      ],
    };

    const jsonEvents = require("../verses/versiculodiario.json");
    const vers = jsonEvents[`${month}-${day}`];
    if (vers) {
      const versiculo = vers.versiculo;

      let message = `<b>Versículo do dia</b> - ${day} de ${getMonthName(month)}\n\n`;
      message += `"<i>${versiculo}"</i>`;

      await bot.sendMessage(userId, message, {
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
      });

    } else {
      console.log("Não há informações para o dia de hoje.");
    }
  } catch (error) {
    console.error("Erro ao obter informações:", error.message);
  }
}

const userVersJob = new CronJob(
  "00 00 08 * * *",
  async function () {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 45);
      const users = await UserModel.find({ diariavers: true });
      for (const user of users) {
        if (user.last_interaction) {
          const lastDate = new Date(user.last_interaction);
          if (lastDate < cutoff) continue;
        }
        const userId = user.user_id;
        await getVersiculoUser(userId);
        console.log(`Mensagem enviada com sucesso para o grupo ${userId}`);
      }
    } catch (error) {
      console.error("Error in morning job:", error.message);
    }
  },
  null,
  true,
  "America/Sao_Paulo"
);
userVersJob.start();

// ESCOLHA DO TEMA DO GRUPO (VERSÍCULO)

bot.onText(/\/verstema ?(.+)?/, async (msg, match) => {
  if (msg.chat.type !== 'group' && msg.chat.type !== 'supergroup') {
    await bot.sendMessage(msg.chat.id, 'Esse comando só pode ser enviado em grupos.');
    return;
  }

  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const chat = await ChatModel.findOne({ chatId: chatId });

  if (!chat) {
    bot.sendMessage(chatId, "Chat não encontrado no banco de dados.");
    return;
  }

  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const currentDate = `${day}/${month}/${year}`;

  if (chat.last_interaction_group && chat.last_interaction_group === currentDate) {
    const currentTheme = chat.verstema || "Nenhum tema definido";
    bot.sendMessage(chatId, `⏳ Você já enviou uma solicitação de mudança de tema e só pode enviar novamente amanhã.\n\nTema atual: ${currentTheme}`);
    return;
  }

  const chatMember = await bot.getChatMember(chatId, userId);

  if (chatMember.status !== 'administrator' && chatMember.status !== 'creator') {
    await bot.sendMessage(chatId, 'Apenas os administradores podem alterar o tema.');
    return;
  }

  if (msg.text.toString().toLowerCase().trim() === "/verstema") {
    const themes = ['Adoração', 'Amor', 'Consolo', 'Encorajamento', 'Fé'];
    const formattedThemes = themes.map(theme => `<code>${theme}</code>`);
    const message = `<b>Escolha um dos temas:</b> ${formattedThemes.join(', ')}`;
    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    return;
  }

  const tema = match[1]?.trim();

  if (!tema) {
    bot.sendMessage(chatId, "Por favor, forneça um tema válido.");
    return;
  }

  const temas = ['Adoração', 'Amor', 'Consolo', 'Encorajamento', 'Fé'];

  if (!temas.includes(tema)) {
    const formattedThemes = temas.map(theme => `<code>${theme}</code>`);
    const message = `Tema inválido. Escolha um dos temas disponíveis: ${formattedThemes.join(', ')}`;
    bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    return;
  }

  if (chat.verstema === tema) {
    bot.sendMessage(chatId, `O tema '${tema}' já está definido.`);
    return;
  }

  chat.verstema = tema;
  chat.last_interaction_group = currentDate;
  await chat.save();

  bot.sendMessage(chatId, `Tema atualizado para: ${tema}`);
});

// TEMAS PARA GRUPOS

// ADORAÇÃO

async function getAdoracao(chatId) {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;

  try {
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: "📢 Canal Oficial",
            url: "https://t.me/peregrinobr",
          },
        ],
      ],
    };

    const jsonEvents = require("../verses/versiculosgrupos/adoracao.json");
    const adoracao = jsonEvents[`${month}-${day}`];
    if (adoracao) {
      const versiculo = adoracao.versiculo;

      let message = `<b>Versículo do dia</b>\n\n`;
      message += `"<i>${versiculo}"</i>`;

      await bot.sendMessage(chatId, message, {
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
      });

    } else {
      console.log("Não há informações para o dia de hoje.");
    }
  } catch (error) {
    console.error("Erro ao obter informações:", error.message);
  }
}

const adoracao = new CronJob(
  "00 00 07 * * *",
  async function () {
    try {
      const chatModels = await ChatModel.find({ verstema: "Adoração" });
      for (const chatModel of chatModels) {
        const chatId = chatModel.chatId;
        if (chatId !== groupId) {
          await getAdoracao(chatId);
          console.log(`Mensagem enviada com sucesso para o grupo ${chatId}`);
        }
      }
    } catch (error) {
      console.error("Error in morning job:", error.message);
    }
  },
  null,
  true,
  "America/Sao_Paulo"
);
adoracao.start();



// AMOR

async function getAmor(chatId) {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;

  try {
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: "📢 Canal Oficial",
            url: "https://t.me/peregrinobr",
          },
        ],
      ],
    };

    const jsonEvents = require("../verses/versiculosgrupos/amor.json");
    const amor = jsonEvents[`${month}-${day}`];
    if (amor) {
      const versiculo = amor.versiculo;

      let message = `<b>Versículo do dia</b>\n\n`;
      message += `"<i>${versiculo}"</i>`;

      await bot.sendMessage(chatId, message, {
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
      });

    } else {
      console.log("Não há informações para o dia de hoje.");
    }
  } catch (error) {
    console.error("Erro ao obter informações:", error.message);
  }
}

const amor = new CronJob(
  "00 00 07 * * *",
  async function () {
    try {
      const chatModels = await ChatModel.find({ verstema: "Amor" });
      for (const chatModel of chatModels) {
        const chatId = chatModel.chatId;
        if (chatId !== groupId) {
          await getAmor(chatId);
          console.log(`Mensagem enviada com sucesso para o grupo ${chatId}`);
        }
      }
    } catch (error) {
      console.error("Error in morning job:", error.message);
    }
  },
  null,
  true,
  "America/Sao_Paulo"
);
amor.start();


// CONSOLO

async function getConsolo(chatId) {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;

  try {
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: "📢 Canal Oficial",
            url: "https://t.me/peregrinobr",
          },
        ],
      ],
    };

    const jsonEvents = require("../verses/versiculosgrupos/consolo.json");
    const consolo = jsonEvents[`${month}-${day}`];
    if (consolo) {
      const versiculo = consolo.versiculo;

      let message = `<b>Versículo do dia</b>\n\n`;
      message += `"<i>${versiculo}"</i>`;

      await bot.sendMessage(chatId, message, {
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
      });

    } else {
      console.log("Não há informações para o dia de hoje.");
    }
  } catch (error) {
    console.error("Erro ao obter informações:", error.message);
  }
}

const consolo = new CronJob(
  "00 00 07 * * *",
  async function () {
    try {
      const chatModels = await ChatModel.find({ verstema: "Consolo" });
      for (const chatModel of chatModels) {
        const chatId = chatModel.chatId;
        if (chatId !== groupId) {
          await getConsolo(chatId);
          console.log(`Mensagem enviada com sucesso para o grupo ${chatId}`);
        }
      }
    } catch (error) {
      console.error("Error in morning job:", error.message);
    }
  },
  null,
  true,
  "America/Sao_Paulo"
);
consolo.start();

// Encorajamento 

async function getEncorajamento(chatId) {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;

  try {
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: "📢 Canal Oficial",
            url: "https://t.me/peregrinobr",
          },
        ],
      ],
    };

    const jsonEvents = require("../verses/versiculosgrupos/encorajamento.json");
    const encorajamento = jsonEvents[`${month}-${day}`];
    if (encorajamento) {
      const versiculo = encorajamento.versiculo;

      let message = `<b>Versículo do dia</b>\n\n`;
      message += `"<i>${versiculo}"</i>`;

      await bot.sendMessage(chatId, message, {
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
      });

    } else {
      console.log("Não há informações para o dia de hoje.");
    }
  } catch (error) {
    console.error("Erro ao obter informações:", error.message);
  }
}

const encorajamento = new CronJob(
  "00 00 07 * * *",
  async function () {
    try {
      const chatModels = await ChatModel.find({ verstema: "Encorajamento" });
      for (const chatModel of chatModels) {
        const chatId = chatModel.chatId;
        if (chatId !== groupId) {
          await getEncorajamento(chatId);
          console.log(`Mensagem enviada com sucesso para o grupo ${chatId}`);
        }
      }
    } catch (error) {
      console.error("Error in morning job:", error.message);
    }
  },
  null,
  true,
  "America/Sao_Paulo"
);
encorajamento.start();

// Fé


async function getFe(chatId) {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;

  try {
    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: "📢 Canal Oficial",
            url: "https://t.me/peregrinobr",
          },
        ],
      ],
    };

    const jsonEvents = require("../verses/versiculosgrupos/fe.json");
    const fe = jsonEvents[`${month}-${day}`];
    if (fe) {
      const versiculo = fe.versiculo;

      let message = `<b>Versículo do dia</b>\n\n`;
      message += `"<i>${versiculo}"</i>`;

      await bot.sendMessage(chatId, message, {
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
      });

    } else {
      console.log("Não há informações para o dia de hoje.");
    }
  } catch (error) {
    console.error("Erro ao obter informações:", error.message);
  }
}

const fe = new CronJob(
  "00 00 07 * * *",
  async function () {
    try {
      const chatModels = await ChatModel.find({ verstema: "Fé" });
      for (const chatModel of chatModels) {
        const chatId = chatModel.chatId;
        if (chatId !== groupId) {
          await getFe(chatId);
          console.log(`Mensagem enviada com sucesso para o grupo ${chatId}`);
        }
      }
    } catch (error) {
      console.error("Error in morning job:", error.message);
    }
  },
  null,
  true,
  "America/Sao_Paulo"
);
fe.start();




// ENVIAR VERSICULO BÍBLICO PARA O CANAL

async function getVersiculoChannel() {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;


  try {
    const jsonEvents = require("../verses/versiculocanal.json");
    const versiculo = jsonEvents[`${month}-${day}`];
    if (versiculo) {
      const imagem = versiculo.imagem;
      const caption = versiculo.caption;
      const captionToSend  = "<b>Versículo bíblico do dia</b>\n\n<blockquote>❤️ Siga-nos: @peregrinobr</blockquote>";
      await bot.sendPhoto(channelId, imagem, { caption: captionToSend, parse_mode: 'HTML' });
      console.log("Enviado com sucesso para CANAL")
    } else {
      console.log("Não há informações para o dia de hoje.");
    }
  } catch (error) {
    console.error("Erro ao obter informações:", error.message);
  }
}
    const versiculocanal = new CronJob(
      "00 00 08 * * *",
      getVersiculoChannel,
      null,
      true,
      "America/Sao_Paulo"
    );
    versiculocanal.start();




// PLANOS BIBLICOS

// TRANSFORMADO

const planoTransformado = require("../plans/transformado.json");

bot.onText(/\/planotransformado/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.chat.id;
  const photoPath = 'src/image/transformado.jpg';
  const caption = '<b>Seja Transformado Para Transformar (3 Dias)</b>\n\nExperimentando o chamado de Deus e entendendo Seu propósito para nós. Levando uma vida de testemunho, contando aos outros sobre Sua graça salvadora. Superar o presente, com esperança no futuro. Viver uma vida digna como um vaso escolhido por Deus. Promover a unidade na Igreja, mantendo apenas Cristo como sua cabeça. Proclamando e ensinar a palavra de Deus.\n\nEDITOR - Gostaríamos de agradecer a C. JEBARAJ, Diretor Residente da Amazing Love Home, Chennai, por fornecer este plano. Para mais informações, visite: jebaraj1.blogspot.com';


  try {
    const existingPlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: true,
    });

    if (existingPlano) {
      bot.sendMessage(userId, "Você já possui um plano ativo.");
      return;
    }

    const existingInactivePlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: false,
    });

    if (existingInactivePlano) {
      await PlanoModel.updateMany(
        { user_id: userId, planoAtivo: false },
        {
          $set: {
            planoAtivo: true,
            diaPlano: 1,
            plano1: true,
            messagePositionPlano: 0,
          },
        }
      );

    } else {
      const newPlano = new PlanoModel({
        user_id: userId,
        firstname: msg.from.first_name,
        planoAtivo: true,
        diaPlano: 1,
        plano1: true,
        messagePositionPlano: 0,
        messageIdPlano: null,
        messagePlano: "",
        planosConcluidos: 0,
      });

      await newPlano.save();
    }

    await bot.sendPhoto(userId, photoPath, { caption: caption, parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      userId,
      "Ocorreu um erro ao criar o plano. Por favor, tente novamente mais tarde."
    );
  }
});


async function sendDailyText(userId, text, options) {
  try {
    const activePlanos = await PlanoModel.find({
      plano1: true,
      diaPlano: { $lte: 3 },
    });

    for (const plano of activePlanos) {
      if (plano.diaPlano !== 4) {
        const devocional = planoTransformado[plano.diaPlano].devocional[0];
        const biblia = planoTransformado[plano.diaPlano].biblia[0];
        const messageText = `<b>${devocional.titulo}</b>\n\nVersículo: ${devocional.versiculo}\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;

        let position = plano.messagePositionPlano || 0;
        plano.messagePlano = messageText;
        plano.messagePositionPlano = position;

        const messagePlano = await bot.sendMessage(plano.user_id, messageText, { parse_mode: "HTML" });
        plano.messageIdPlano = messagePlano.message_id;
        await plano.save();
      }

      plano.diaPlano++;
      await plano.save();
    }
  } catch (error) {
    console.error(error);
  }
}

async function handlePlanCompletion(plano) {
  const userId = plano.user_id;
  await bot.sendMessage(userId, "Glória a Deus! 🎉🎊\n\nVocê concluiu mais um plano com sucesso, para ver quantos você concluiu digite: /status\n\nSe quiser mais planos digite: /planos");
  await PlanoModel.updateOne({ _id: plano._id }, {
    $set: {
      diaPlano: "",
      messagePositionPlano: "",
      messageIdPlano: "",
      messagePlano: ""
    }
  });

  plano.planoAtivo = false;
  plano.plano1 = false;
  plano.planosConcluidos += 1;
  await plano.save();
}

const dailyJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano1: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      const messageIdPlano = plano.messageIdPlano;

      if (plano.diaPlano === 4) {
        if (plano.messageIdPlano) {
          await bot.deleteMessage(userId, plano.messageIdPlano);
          console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
        }
        await handlePlanCompletion(plano);
      } else {
        if (messageIdPlano) {
          try {
            await bot.deleteMessage(userId, plano.messageIdPlano);
            console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
          } catch (error) {
            console.log(`Erro ao excluir mensagem anterior do usuário ${userId}: ${error.message}`);
          }
        }

        await sendDailyText(userId);
        console.log(`Mensagem enviada com sucesso para o usuário ${userId}`);
      }
    }
  } catch (err) {
    console.error("Erro ao recuperar usuários do banco de dados:", err);
  }
}, null, true, "America/Sao_Paulo");

dailyJob.start();

// Obtendo Sabedoria Divina

const planoSabedoriaDivina = require("../plans/sabedoriaDivina.json");

bot.onText(/\/planosabedoriadnv/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.chat.id;
  const photoPath = 'src/image/sabedoriadivina.jpg';
  const caption = '<b>Obtendo Sabedoria Divina (5 Dias)</b>\n\nMuitos de nós veem a sabedoria como algo que pessoas mais experientes possuem. Mas nós realmente podemos possuí-la, não importa o quanto temos vivido. Esse plano de cinco dias te levará ao entendimento sobre o que a sabedoria divina realmente é e como obtê-la.\n\nEDITOR - Este Plano Bíblico foi originalmente criado e fornecido pela <a href="https://www.bible.com/pt/reading-plans/22066-gaining-godly-wisdom">YouVersion</a>';

  try {
    const existingPlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: true,
    });

    if (existingPlano) {
      bot.sendMessage(userId, "Você já possui um plano ativo.");
      return;
    }

    const existingInactivePlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: false,
    });

    if (existingInactivePlano) {
      await PlanoModel.updateMany(
        { user_id: userId, planoAtivo: false },
        {
          $set: {
            planoAtivo: true,
            plano2: true,
            diaPlano: 1,
            messagePositionPlano: 0,
          },
        }
      );

    } else {
      const newPlano = new PlanoModel({
        user_id: userId,
        planoAtivo: true,
        plano2: true,
        diaPlano: 1,
        messagePositionPlano: 0,
        messageIdPlano: null,
        messagePlano: "",
        planosConcluidos: 0,
      });

      await newPlano.save();
    }

    await bot.sendPhoto(userId, photoPath, { caption: caption, parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      userId,
      "Ocorreu um erro ao criar o plano. Por favor, tente novamente mais tarde."
    );
  }
});

async function sendSabedoriaDivina(userId, texto, options) {
  try {
    const activePlanos = await PlanoModel.find({
      plano2: true,
      diaPlano: { $lte: 5 },
    });

    for (const plano of activePlanos) {
      if (plano.diaPlano !== 6) {
        const devocional = planoSabedoriaDivina[plano.diaPlano].devocional[0];
        const biblia = planoSabedoriaDivina[plano.diaPlano].biblia[0];
        const planoText = `<b>${devocional.titulo}</b>\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;

        let position = plano.messagePositionPlano || 0;
        plano.messagePositionPlano = position;
        const buttonsPlano = [];
        const limite = 1000;
        const mensagemDividida = planoText.split("\n");

        if (position > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-plano" });
        }
        if (planoText.length > limite) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-plano" });
        }

        const messageOptions = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };

        let mesnsagemArray = []
        let arrayPosition = 0
        mesnsagemArray[arrayPosition] = ""
        let messageInfo;
        if (planoText.length <= limite) {
          mesnsagemArray[arrayPosition] = planoText
          messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML" });
        }
        else {

          for (let posicaoTexto = 0; posicaoTexto < mensagemDividida.length; posicaoTexto++) {
            let frase = mensagemDividida[posicaoTexto];
            if ((mesnsagemArray[arrayPosition].length + frase.length) <= limite) {
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
            else {
              mesnsagemArray.push("");
              arrayPosition++;
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
          }

          messageInfo = await bot.sendMessage(
            plano.user_id,
            mesnsagemArray[0],
            messageOptions
          );
        }
        plano.messagePositionPlano = 0;
        plano.messagePlano = mesnsagemArray
        plano.messageIdPlano = messageInfo.message_id;
        await plano.save();

      }

      plano.diaPlano++;
      await plano.save();
    }
  } catch (error) {
    console.error(error);
  }
}


async function handlePlanCompletionSabedoria(plano) {
  const userId = plano.user_id;
  await bot.sendMessage(userId, "Maravilha! 🎉🎊\n\nVocê concluiu mais um plano com sucesso, para ver quantos você concluiu digite: /status\n\nSe quiser mais planos digite: /planos");
  await PlanoModel.updateOne({ _id: plano._id }, {
    $set: {
      diaPlano: "",
      messagePositionPlano: "",
      messageIdPlano: "",
      messagePlano: ""
    }
  });

  plano.planoAtivo = false;
  plano.plano2 = false;
  plano.planosConcluidos += 1;
  await plano.save();
}

const sabedoriaJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano2: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      const messageIdPlano = plano.messageIdPlano;



      if (plano.diaPlano === 6) {
        if (plano.messageIdPlano) {
          await bot.deleteMessage(userId, plano.messageIdPlano);
          console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
        }
        await handlePlanCompletionSabedoria(plano);
      } else {
        if (messageIdPlano) {
          try {
            await bot.deleteMessage(userId, plano.messageIdPlano);
            console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
          } catch (error) {
            console.log(`Erro ao excluir mensagem anterior do usuário ${userId}: ${error.message}`);
          }
        }

        await sendSabedoriaDivina(userId);
        console.log(`Mensagem enviada com sucesso para o usuário ${userId}`);
      }
    }
  } catch (err) {
    console.error("Erro ao recuperar usuários do banco de dados:", err);
  }
}, null, true, "America/Sao_Paulo");

sabedoriaJob.start();


// NOVO TESTAMENTO

bot.onText(/\/planont/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.chat.id;
  const photoPath = 'src/image/novo_testamento.png';
  const caption = '<b>Obtendo Novo Testamento (80 Dias)</b>\n\nLeia o Novo Testamento ao longo de 80 dias, mergulhando nas palavras de sabedoria, amor e redenção de Jesus Cristo e seus seguidores. Descubra a jornada inspiradora de fé, esperança e salvação que tem tocado corações por séculos. Permita que a mensagem poderosa e intemporal da Bíblia ressoe em sua vida diariamente enquanto você se aprofunda na Palavra de Deus. ';


  try {
    const existingPlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: true,
    });

    if (existingPlano) {
      bot.sendMessage(userId, "Você já possui um plano ativo.");
      return;
    }

    const existingInactivePlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: false,
    });

    if (existingInactivePlano) {
      await PlanoModel.updateMany(
        { user_id: userId, planoAtivo: false },
        {
          $set: {
            planoAtivo: true,
            plano3: true,
            diaPlano: 1,
            messagePositionPlano: 0,
            versiculoPlano: 0,
          },
        }
      );

    } else {
      const newPlano = new PlanoModel({
        user_id: userId,
        firstname: msg.from.first_name,
        planoAtivo: true,
        plano3: true,
        diaPlano: 1,
        versiculoPlano: 0,
        messagePositionPlano: 0,
        messageIdPlano: null,
        messagePlano: "",
        planosConcluidos: 0,
      });

      await newPlano.save();
    }

    await bot.sendPhoto(userId, photoPath, { caption: caption, parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      userId,
      "Ocorreu um erro ao criar o plano. Por favor, tente novamente mais tarde."
    );
  }
});

async function getDailyTextNT(dia, vers, userId) {
  try {
    const plano = await PlanoModel.findOne({ user_id: userId });
    const jsonObj = require(`../plans/novotestamento.json`);

    let versiculoPlano = vers;

    let quantVersiDia = 99;
    if (dia % 4 === 0) {
      quantVersiDia = 100;
    }

    let msg = [];
    let idMsg = 0;
    let contVersMsg = 0;
    let versiculoAtual = 0;
    let breakCheck = false;

    msg[idMsg] = `<b>Leitura do Dia ${dia}\n\n</b>`;

    for (const key in jsonObj) {
      if (breakCheck) break;

      const livro = jsonObj[key]["name"];
      const capitulos = jsonObj[key]["chapters"];

      for (const capitulo in capitulos) {
        if (breakCheck) break;

        for (const versiculo in capitulos[capitulo]) {
          if (breakCheck) break;

          if (versiculoAtual === versiculoPlano) {
            const texto =
              `<b>${livro} ${parseInt(capitulo) + 1}:${parseInt(
                versiculo
              ) + 1}</b>\n` + capitulos[capitulo][versiculo];

            if (!(msg[idMsg].length + texto.length > 2000)) {
              msg[idMsg] += texto + "\n\n";
            }
            else {
              msg.push("");
              idMsg++;
              msg[idMsg] = "<b>Leitura do Dia " + dia + "\n\n</b>";
              msg[idMsg] += texto + "\n\n";
            }

            versiculoPlano++;
            contVersMsg++;

            if (contVersMsg === quantVersiDia) {
              breakCheck = true;
            }
          }
          versiculoAtual++;
        }
      }
    }

    plano.versiculoPlano = versiculoPlano;
    if (dia < 81) {
      plano.diaPlano = dia + 1;
    }
    await plano.save();

    return msg
  } catch (err) {
    console.error("Error retrieving user from the database:", err);
  }
}

async function sendBibleTextDailyNT(userId) {
  try {
    const plano = await PlanoModel.findOne({ user_id: userId });
    let dia = plano.diaPlano || 1;
    let versiculoPlano = plano.versiculoPlano || 0;

    let msg = await getDailyTextNT(dia, versiculoPlano, userId);
    let position = 0;
    plano.messagePlano = msg;
    plano.messagePositionPlano = position;

    const buttonsPlanoNV = [];
    if (plano.messagePositionPlano > 0) {
      buttonsPlanoNV.push({ text: "⬅️", callback_data: "prev-planont" });
    }
    if (msg.length > 1 && plano.messagePositionPlano < msg.length - 1) {
      buttonsPlanoNV.push({ text: "➡️", callback_data: "next-planont" });
    }

    const options = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [buttonsPlanoNV],
      },
    };

    const messageInfo = await bot.sendMessage(userId, msg[position], options);
    const messageIdPlano = messageInfo.message_id;

    plano.messageIdPlano = messageIdPlano;
    await plano.save();
  } catch (err) {
    console.error("Error retrieving user from the database:", err);
  }
}

async function handlePlanCompletionNT(plano) {
  const userId = plano.user_id;
  await bot.sendMessage(userId, "Maravilha! 🎉🎊\n\nVocê concluiu mais um plano com sucesso, para ver quantos você concluiu digite: /status\n\nSe quiser mais planos digite: /planos");
  await PlanoModel.updateOne({ _id: plano._id }, {
    $set: {
      diaPlano: "",
      messagePositionPlano: "",
      messageIdPlano: "",
      messagePlano: "",
      versiculoPlano: "",
    }
  });

  plano.planoAtivo = false;
  plano.plano3 = false;
  plano.planosConcluidos += 1;
  await plano.save();
}


const novotestamentoJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano3: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      const messageIdPlano = plano.messageIdPlano;



      if (plano.diaPlano === 81) {
        if (plano.messageIdPlano) {
          await bot.deleteMessage(userId, plano.messageIdPlano);
          console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
        }
        await handlePlanCompletionNT(plano);
      } else {
        if (messageIdPlano) {
          try {
            await bot.deleteMessage(userId, plano.messageIdPlano);
            console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
          } catch (error) {
            console.log(`Erro ao excluir mensagem anterior do usuário ${userId}: ${error.message}`);
          }
        }

        await sendBibleTextDailyNT(userId);
        console.log(`Mensagem enviada com sucesso para o usuário ${userId}`);
      }
    }
  } catch (err) {
    console.error("Erro ao recuperar usuários do banco de dados:", err);
  }
}, null, true, "America/Sao_Paulo");

novotestamentoJob.start();

// oracao perigosa

const planoOracoesPerigosas = require("../plans/oracoesperigosas.json");

bot.onText(/\/planoop/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.chat.id;
  const photoPath = 'src/image/oracoesperigosas.jpg';
  const caption = '<b>Orações Perigosas (7 dias)</b>\n\nVocê está cansado de ser cauteloso demais com a sua fé ? Você está pronto para enfrentar seus medos, desenvolver sua fé e liberar o seu potencial ? Este plano bíblico de 7 dias do livro "Orações Perigosas", do pastor Craig Groeschel da Life.Church, lhe desafia a orar perigosamente – porque seguir Jesus nunca teve nada a ver com segurança.\n\nEditor - Gostaríamos de agradecer ao Pastor Craig Groeschel e à Life.Church por fornecerem este plano.Para mais informações[em inglês], acesse https://www.craiggroeschel.com';


  try {
    const existingPlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: true,
    });

    if (existingPlano) {
      bot.sendMessage(userId, "Você já possui um plano ativo.");
      return;
    }

    const existingInactivePlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: false,
    });

    if (existingInactivePlano) {
      await PlanoModel.updateMany(
        { user_id: userId, planoAtivo: false },
        {
          $set: {
            planoAtivo: true,
            plano4: true,
            diaPlano: 1,
            messagePositionPlano: 0,
          },
        }
      );

    } else {
      const newPlano = new PlanoModel({
        user_id: userId,
        firstname: msg.from.first_name,
        planoAtivo: true,
        plano4: true,
        diaPlano: 1,
        messagePositionPlano: 0,
        messageIdPlano: null,
        messagePlano: "",
        planosConcluidos: 0,
      });

      await newPlano.save();
    }

    await bot.sendPhoto(userId, photoPath, { caption: caption, parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      userId,
      "Ocorreu um erro ao criar o plano. Por favor, tente novamente mais tarde."
    );
  }
});

async function sendOracoesPerigosas(userId, texto, options) {
  try {
    const activePlanos = await PlanoModel.find({
      plano4: true,
      diaPlano: { $lte: 7 },
    });

    for (const plano of activePlanos) {
      if (plano.diaPlano !== 8) {
        const devocional = planoOracoesPerigosas[plano.diaPlano].devocional[0];
        const biblia = planoOracoesPerigosas[plano.diaPlano].biblia[0];
        const planoText = `<b>${devocional.titulo}</b>\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;

        let position = plano.messagePositionPlano || 0;
        plano.messagePositionPlano = position;
        const buttonsPlano = [];
        const limite = 1000;
        const mensagemDividida = planoText.split("\n");

        if (position > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planoor" });
        }
        if (planoText.length > limite) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planoor" });
        }

        const messageOptions = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };

        let mesnsagemArray = []
        let arrayPosition = 0
        mesnsagemArray[arrayPosition] = ""
        let messageInfo;
        if (planoText.length <= limite) {
          mesnsagemArray[arrayPosition] = planoText
          messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML" });
        }
        else {

          for (let posicaoTexto = 0; posicaoTexto < mensagemDividida.length; posicaoTexto++) {
            let frase = mensagemDividida[posicaoTexto];
            if ((mesnsagemArray[arrayPosition].length + frase.length) <= limite) {
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
            else {
              mesnsagemArray.push("");
              arrayPosition++;
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
          }

          messageInfo = await bot.sendMessage(
            plano.user_id,
            mesnsagemArray[0],
            messageOptions
          );
        }
        plano.messagePositionPlano = 0;
        plano.messagePlano = mesnsagemArray
        plano.messageIdPlano = messageInfo.message_id;
        await plano.save();

      }

      plano.diaPlano++;
      await plano.save();
    }
  } catch (error) {
    console.error(error);
  }
}


async function handlePlanCompletionOracoes(plano) {
  const userId = plano.user_id;
  await bot.sendMessage(userId, "Ô benção! 🎉🎊\n\nVocê concluiu mais um plano com sucesso, para ver quantos você concluiu digite: /status\n\nSe quiser mais planos digite: /planos");
  await PlanoModel.updateOne({ _id: plano._id }, {
    $set: {
      diaPlano: "",
      messagePositionPlano: "",
      messageIdPlano: "",
      messagePlano: ""
    }
  });

  plano.planoAtivo = false;
  plano.plano4 = false;
  plano.planosConcluidos += 1;
  await plano.save();
}

const OracoesJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano4: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      const messageIdPlano = plano.messageIdPlano;



      if (plano.diaPlano === 8) {
        if (plano.messageIdPlano) {
          await bot.deleteMessage(userId, plano.messageIdPlano);
          console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
        }
        await handlePlanCompletionOracoes(plano);
      } else {
        if (messageIdPlano) {
          try {
            await bot.deleteMessage(userId, plano.messageIdPlano);
            console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
          } catch (error) {
            console.log(`Erro ao excluir mensagem anterior do usuário ${userId}: ${error.message}`);
          }
        }

        await sendOracoesPerigosas(userId);
        console.log(`Mensagem enviada com sucesso para o usuário ${userId}`);
      }
    }
  } catch (err) {
    console.error("Erro ao recuperar usuários do banco de dados:", err);
  }
}, null, true, "America/Sao_Paulo");

OracoesJob.start();

// BIBLIA PARA TODAS

const planoBibliaParaTodos = require("../plans/bibliaparaTodos.json");

bot.onText(/\/planobibliatd/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.chat.id;
  const photoPath = 'src/image/bibliaparatodos.jpg';
  const caption = '<b>Bíblia para Todos (3 dias)</b>\n\nSe formos honestos conosco, todos podemos dizer, de uma forma ou de outra, que a Palavra de Deus teve um impacto positivo e transformador em nossas vidas. Esperamos que nos próximos três dias você possa entender mais sobre o que é a pobreza bíblica e como você pode agir para ajudar a erradicar a pobreza bíblica!\n\nEditor - Gostaríamos de agradecer a YWAM Kona por disponibilizar este plano. Para obter mais informações [em inglês], acesse: http://www.endbiblepovertynow.com';

  try {
    const existingPlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: true,
    });

    if (existingPlano) {
      bot.sendMessage(userId, "Você já possui um plano ativo.");
      return;
    }

    const existingInactivePlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: false,
    });

    if (existingInactivePlano) {
      await PlanoModel.updateMany(
        { user_id: userId, planoAtivo: false },
        {
          $set: {
            planoAtivo: true,
            plano5: true,
            diaPlano: 1,
            messagePositionPlano: 0,
          },
        }
      );

    } else {
      const newPlano = new PlanoModel({
        user_id: userId,
        firstname: msg.from.first_name,
        planoAtivo: true,
        plano5: true,
        diaPlano: 1,
        messagePositionPlano: 0,
        messageIdPlano: null,
        messagePlano: "",
        planosConcluidos: 0,
      });

      await newPlano.save();
    }

    await bot.sendPhoto(userId, photoPath, { caption: caption, parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      userId,
      "Ocorreu um erro ao criar o plano. Por favor, tente novamente mais tarde."
    );
  }
});

async function sendBibliaParaTodos(userId, texto, options) {
  try {
    const activePlanos = await PlanoModel.find({
      plano5: true,
      diaPlano: { $lte: 3 },
    });

    for (const plano of activePlanos) {
      if (plano.diaPlano !== 4) {
        const devocional = planoBibliaParaTodos[plano.diaPlano].devocional[0];
        const biblia = planoBibliaParaTodos[plano.diaPlano].biblia[0];
        const planoText = `<b>${devocional.titulo}</b>\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;

        let position = plano.messagePositionPlano || 0;
        plano.messagePositionPlano = position;
        const buttonsPlano = [];
        const limite = 1000;
        const mensagemDividida = planoText.split("\n");

        if (position > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planobt" });
        }
        if (planoText.length > limite) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planobt" });
        }

        const messageOptions = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };

        let mesnsagemArray = []
        let arrayPosition = 0
        mesnsagemArray[arrayPosition] = ""
        let messageInfo;
        if (planoText.length <= limite) {
          mesnsagemArray[arrayPosition] = planoText
          messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML" });
        }
        else {

          for (let posicaoTexto = 0; posicaoTexto < mensagemDividida.length; posicaoTexto++) {
            let frase = mensagemDividida[posicaoTexto];
            if ((mesnsagemArray[arrayPosition].length + frase.length) <= limite) {
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
            else {
              mesnsagemArray.push("");
              arrayPosition++;
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
          }

          messageInfo = await bot.sendMessage(
            plano.user_id,
            mesnsagemArray[0],
            messageOptions
          );
        }
        plano.messagePositionPlano = 0;
        plano.messagePlano = mesnsagemArray
        plano.messageIdPlano = messageInfo.message_id;
        await plano.save();

      }

      plano.diaPlano++;
      await plano.save();
    }
  } catch (error) {
    console.error(error);
  }
}


async function handlePlanCompletionBpt(plano) {
  const userId = plano.user_id;
  await bot.sendMessage(userId, "Uhuuuuuuuuuu! 🎉🎊\n\nVocê concluiu mais um plano com sucesso, para ver quantos você concluiu digite: /status\n\nSe quiser mais planos digite: /planos");
  await PlanoModel.updateOne({ _id: plano._id }, {
    $set: {
      diaPlano: "",
      messagePositionPlano: "",
      messageIdPlano: "",
      messagePlano: ""
    }
  });

  plano.planoAtivo = false;
  plano.plano5 = false;
  plano.planosConcluidos += 1;
  await plano.save();
}

const BptJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano5: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      const messageIdPlano = plano.messageIdPlano;



      if (plano.diaPlano === 4) {
        if (plano.messageIdPlano) {
          await bot.deleteMessage(userId, plano.messageIdPlano);
          console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
        }
        await handlePlanCompletionBpt(plano);
      } else {
        if (messageIdPlano) {
          try {
            await bot.deleteMessage(userId, plano.messageIdPlano);
            console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
          } catch (error) {
            console.log(`Erro ao excluir mensagem anterior do usuário ${userId}: ${error.message}`);
          }
        }

        await sendBibliaParaTodos(userId);
        console.log(`Mensagem enviada com sucesso para o usuário ${userId}`);
      }
    }
  } catch (err) {
    console.error("Erro ao recuperar usuários do banco de dados:", err);
  }
}, null, true, "America/Sao_Paulo");

BptJob.start();

// Restaurando o Casamento com Base nas Escrituras

const planoResturandoCasamentos = require("../plans/restaurandocasamento.json");

bot.onText(/\/planocsr/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.chat.id;
  const photoPath = 'src/image/restaurandocasamento.jpg';
  const caption = '<b>Restaurando o Casamento com Base nas Escrituras (10 dias)</b>\n\O Plano Bíblico "Restaurando o Casamento com Base nas Escrituras" oferece histórias bíblicas inspiradoras para guiar casais na busca pela restauração do seu relacionamento, trazendo sabedoria divina, cura e renovação dos laços matrimoniais.\n\nEditor - Gostaríamos de agradecer ao Ministério Juntos Somos Um por fornecer este plano. Para mais informações, visite: https://www.basedebatalha.com.br';


  try {
    const existingPlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: true,
    });

    if (existingPlano) {
      bot.sendMessage(userId, "Você já possui um plano ativo.");
      return;
    }

    const existingInactivePlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: false,
    });

    if (existingInactivePlano) {
      await PlanoModel.updateMany(
        { user_id: userId, planoAtivo: false },
        {
          $set: {
            planoAtivo: true,
            plano6: true,
            diaPlano: 1,
            messagePositionPlano: 0,
          },
        }
      );

    } else {
      const newPlano = new PlanoModel({
        user_id: userId,
        firstname: msg.from.first_name,
        planoAtivo: true,
        plano6: true,
        diaPlano: 1,
        messagePositionPlano: 0,
        messageIdPlano: null,
        messagePlano: "",
        planosConcluidos: 0,
      });

      await newPlano.save();
    }

    await bot.sendPhoto(userId, photoPath, { caption: caption, parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      userId,
      "Ocorreu um erro ao criar o plano. Por favor, tente novamente mais tarde."
    );
  }
});

async function sendRestaurandoCasamentos(userId, texto, options) {
  try {
    const activePlanos = await PlanoModel.find({
      plano6: true,
      diaPlano: { $lte: 10 },
    });

    for (const plano of activePlanos) {
      if (plano.diaPlano !== 11) {
        const devocional = planoResturandoCasamentos[plano.diaPlano].devocional[0];
        const biblia = planoResturandoCasamentos[plano.diaPlano].biblia[0];
        const planoText = `<b>${devocional.titulo}</b>\n\nVersículo: ${devocional.versiculo}\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;

        let position = plano.messagePositionPlano || 0;
        plano.messagePositionPlano = position;
        const buttonsPlano = [];
        const limite = 1000;
        const mensagemDividida = planoText.split("\n");

        if (position > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planorc" });
        }
        if (planoText.length > limite) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planorc" });
        }

        const messageOptions = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };

        let mesnsagemArray = []
        let arrayPosition = 0
        mesnsagemArray[arrayPosition] = ""
        let messageInfo;
        if (planoText.length <= limite) {
          mesnsagemArray[arrayPosition] = planoText
          messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML" });
        }
        else {

          for (let posicaoTexto = 0; posicaoTexto < mensagemDividida.length; posicaoTexto++) {
            let frase = mensagemDividida[posicaoTexto];
            if ((mesnsagemArray[arrayPosition].length + frase.length) <= limite) {
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
            else {
              mesnsagemArray.push("");
              arrayPosition++;
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
          }

          messageInfo = await bot.sendMessage(
            plano.user_id,
            mesnsagemArray[0],
            messageOptions
          );
        }
        plano.messagePositionPlano = 0;
        plano.messagePlano = mesnsagemArray
        plano.messageIdPlano = messageInfo.message_id;
        await plano.save();

      }

      plano.diaPlano++;
      await plano.save();
    }
  } catch (error) {
    console.error(error);
  }
}


async function handlePlanCompletionRc(plano) {
  const userId = plano.user_id;
  await bot.sendMessage(userId, "Boaaaaa! 🎉🎊\n\nVocê concluiu mais um plano com sucesso, para ver quantos você concluiu digite: /status\n\nSe quiser mais planos digite: /planos");
  await PlanoModel.updateOne({ _id: plano._id }, {
    $set: {
      diaPlano: "",
      messagePositionPlano: "",
      messageIdPlano: "",
      messagePlano: ""
    }
  });

  plano.planoAtivo = false;
  plano.plano6 = false;
  plano.planosConcluidos += 1;
  await plano.save();
}

const RcJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano6: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      const messageIdPlano = plano.messageIdPlano;



      if (plano.diaPlano === 11) {
        if (plano.messageIdPlano) {
          await bot.deleteMessage(userId, plano.messageIdPlano);
          console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
        }
        await handlePlanCompletionRc(plano);
      } else {
        if (messageIdPlano) {
          try {
            await bot.deleteMessage(userId, plano.messageIdPlano);
            console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
          } catch (error) {
            console.log(`Erro ao excluir mensagem anterior do usuário ${userId}: ${error.message}`);
          }
        }

        await sendRestaurandoCasamentos(userId);
        console.log(`Mensagem enviada com sucesso para o usuário ${userId}`);
      }
    }
  } catch (err) {
    console.error("Erro ao recuperar usuários do banco de dados:", err);
  }
}, null, true, "America/Sao_Paulo");

RcJob.start();

// As 5 linguagens do amor

const planoLinguagemDoAmor = require("../plans/cincolinguagensamor.json");

bot.onText(/\/planolinguagemdoamor/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.chat.id;
  const photoPath = 'src/image/cincolinguagensamor.jpg';
  const caption = '<b>As 5 linguagens do amor (7 dias)</b>\n\nGary Chapman identificou cinco formas pelas quais as pessoas expressam e recebem as manifestações de amor: palavras de afirmação, tempo de qualidade, presentes, atos de serviço e toque físico. Aprenda a se comunicar por meio dessas linguagens e experimente como é ser realmente amado e compreendido.\n\nEditor - Gostaríamos de agradecer a Mundo Cristão por fornecer este plano. Para mais informações, acesse: https://www.mundocristao.com.br';
  try {
    const existingPlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: true,
    });

    if (existingPlano) {
      bot.sendMessage(userId, "Você já possui um plano ativo.");
      return;
    }

    const existingInactivePlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: false,
    });

    if (existingInactivePlano) {
      await PlanoModel.updateMany(
        { user_id: userId, planoAtivo: false },
        {
          $set: {
            planoAtivo: true,
            plano7: true,
            diaPlano: 1,
            messagePositionPlano: 0,
          },
        }
      );

    } else {
      const newPlano = new PlanoModel({
        user_id: userId,
        firstname: msg.from.first_name,
        planoAtivo: true,
        plano7: true,
        diaPlano: 1,
        messagePositionPlano: 0,
        messageIdPlano: null,
        messagePlano: "",
        planosConcluidos: 0,
      });

      await newPlano.save();
    }

    await bot.sendPhoto(userId, photoPath, { caption: caption, parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      userId,
      "Ocorreu um erro ao criar o plano. Por favor, tente novamente mais tarde."
    );
  }
});

async function sendLinguagemDoAmor(userId, texto, options) {
  try {
    const activePlanos = await PlanoModel.find({
      plano7: true,
      diaPlano: { $lte: 7 },
    });

    for (const plano of activePlanos) {
      if (plano.diaPlano !== 8) {
        const devocional = planoLinguagemDoAmor[plano.diaPlano].devocional[0];
        const biblia = planoLinguagemDoAmor[plano.diaPlano].biblia[0];
        const planoText = `<b>${devocional.titulo}</b>\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;

        let position = plano.messagePositionPlano || 0;
        plano.messagePositionPlano = position;
        const buttonsPlano = [];
        const limite = 1000;
        const mensagemDividida = planoText.split("\n");

        if (position > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planola" });
        }
        if (planoText.length > limite) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planola" });
        }

        const messageOptions = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };

        let mesnsagemArray = []
        let arrayPosition = 0
        mesnsagemArray[arrayPosition] = ""
        let messageInfo;
        if (planoText.length <= limite) {
          mesnsagemArray[arrayPosition] = planoText
          messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML" });
        }
        else {

          for (let posicaoTexto = 0; posicaoTexto < mensagemDividida.length; posicaoTexto++) {
            let frase = mensagemDividida[posicaoTexto];
            if ((mesnsagemArray[arrayPosition].length + frase.length) <= limite) {
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
            else {
              mesnsagemArray.push("");
              arrayPosition++;
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
          }

          messageInfo = await bot.sendMessage(
            plano.user_id,
            mesnsagemArray[0],
            messageOptions
          );
        }
        plano.messagePositionPlano = 0;
        plano.messagePlano = mesnsagemArray
        plano.messageIdPlano = messageInfo.message_id;
        await plano.save();

      }

      plano.diaPlano++;
      await plano.save();
    }
  } catch (error) {
    console.error(error);
  }
}


async function handlePlanCompletionLa(plano) {
  const userId = plano.user_id;
  await bot.sendMessage(userId, "Uauuuu! 🎉🎊\n\nVocê concluiu mais um plano com sucesso, para ver quantos você concluiu digite: /status\n\nSe quiser mais planos digite: /planos");
  await PlanoModel.updateOne({ _id: plano._id }, {
    $set: {
      diaPlano: "",
      messagePositionPlano: "",
      messageIdPlano: "",
      messagePlano: ""
    }
  });

  plano.planoAtivo = false;
  plano.plano7 = false;
  plano.planosConcluidos += 1;
  await plano.save();
}

const LaJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano7: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      const messageIdPlano = plano.messageIdPlano;



      if (plano.diaPlano === 8) {
        if (plano.messageIdPlano) {
          await bot.deleteMessage(userId, plano.messageIdPlano);
          console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
        }
        await handlePlanCompletionLa(plano);
      } else {
        if (messageIdPlano) {
          try {
            await bot.deleteMessage(userId, plano.messageIdPlano);
            console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
          } catch (error) {
            console.log(`Erro ao excluir mensagem anterior do usuário ${userId}: ${error.message}`);
          }
        }

        await sendLinguagemDoAmor(userId);
        console.log(`Mensagem enviada com sucesso para o usuário ${userId}`);
      }
    }
  } catch (err) {
    console.error("Erro ao recuperar usuários do banco de dados:", err);
  }
}, null, true, "America/Sao_Paulo");

LaJob.start();

// Namoro na Era Contemporânea

const planoNamoroEraContemporanea = require("../plans/namoroeracontemporanea.json");

bot.onText(/\/planonamoroctmp/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.chat.id;
  const photoPath = 'src/image/namoroeracontemporanea.jpg';
  const caption = '<b>Namoro na Era Contemporânea (7 dias)</b>\n\nNamoro... esta palavra causa ansiedade ou expectativa em seu coração? Toda a tecnologia e conectividade parece ter transformado o namoro em algo ainda mais complicado, confuso e frustrante. Neste Plano de 7 dias baseado no livro "Single. Dating. Engaged. Married." (em tradução livre: "Solteiro. Namorando. Noivado. Casado."), Ben Stuart o ajudará a entender que Deus tem um propósito para este momento da sua vida, oferecendo princípios fundamentais para te ajudar a descobrir quem e como namorar. Ben é pastor da Igreja Passion City, em Washington, DC, e ex-diretor executivo do Ministério Breakaway, um estudo Bíblico semanal frequentado por milhares de estudantes universitários no campus da Universidade Texas A&M. \n\nEditor - Gostaríamos de agradecer a Ben Stuart por fornecer este plano. Para mais informações, acesse: https://www.thatrelationshipbook.com';

  try {
    const existingPlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: true,
    });

    if (existingPlano) {
      bot.sendMessage(userId, "Você já possui um plano ativo.");
      return;
    }

    const existingInactivePlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: false,
    });

    if (existingInactivePlano) {
      await PlanoModel.updateMany(
        { user_id: userId, planoAtivo: false },
        {
          $set: {
            planoAtivo: true,
            plano8: true,
            diaPlano: 1,
            messagePositionPlano: 0,
          },
        }
      );

    } else {
      const newPlano = new PlanoModel({
        user_id: userId,
        firstname: msg.from.first_name,
        planoAtivo: true,
        plano8: true,
        diaPlano: 1,
        messagePositionPlano: 0,
        messageIdPlano: null,
        messagePlano: "",
        planosConcluidos: 0,
      });

      await newPlano.save();
    }

    await bot.sendPhoto(userId, photoPath, { caption: caption, parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      userId,
      "Ocorreu um erro ao criar o plano. Por favor, tente novamente mais tarde."
    );
  }
});

async function sendNamoroEraContemporanea(userId, texto, options) {
  try {
    const activePlanos = await PlanoModel.find({
      plano8: true,
      diaPlano: { $lte: 7 },
    });

    for (const plano of activePlanos) {
      if (plano.diaPlano !== 8) {
        const devocional = planoNamoroEraContemporanea[plano.diaPlano].devocional[0];
        const biblia = planoNamoroEraContemporanea[plano.diaPlano].biblia[0];
        const planoText = `<b>${devocional.titulo}</b>\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;

        let position = plano.messagePositionPlano || 0;
        plano.messagePositionPlano = position;
        const buttonsPlano = [];
        const limite = 1000;
        const mensagemDividida = planoText.split("\n");

        if (position > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planonc" });
        }
        if (planoText.length > limite) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planonc" });
        }

        const messageOptions = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };

        let mesnsagemArray = []
        let arrayPosition = 0
        mesnsagemArray[arrayPosition] = ""
        let messageInfo;
        if (planoText.length <= limite) {
          mesnsagemArray[arrayPosition] = planoText
          messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML" });
        }
        else {

          for (let posicaoTexto = 0; posicaoTexto < mensagemDividida.length; posicaoTexto++) {
            let frase = mensagemDividida[posicaoTexto];
            if ((mesnsagemArray[arrayPosition].length + frase.length) <= limite) {
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
            else {
              mesnsagemArray.push("");
              arrayPosition++;
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
          }

          messageInfo = await bot.sendMessage(
            plano.user_id,
            mesnsagemArray[0],
            messageOptions
          );
        }
        plano.messagePositionPlano = 0;
        plano.messagePlano = mesnsagemArray
        plano.messageIdPlano = messageInfo.message_id;
        await plano.save();

      }

      plano.diaPlano++;
      await plano.save();
    }
  } catch (error) {
    console.error(error);
  }
}


async function handlePlanCompletionNc(plano) {
  const userId = plano.user_id;
  await bot.sendMessage(userId, "Uauuuu! 🎉🎊\n\nVocê concluiu mais um plano com sucesso, para ver quantos você concluiu digite: /status\n\nSe quiser mais planos digite: /planos");
  await PlanoModel.updateOne({ _id: plano._id }, {
    $set: {
      diaPlano: "",
      messagePositionPlano: "",
      messageIdPlano: "",
      messagePlano: ""
    }
  });

  plano.planoAtivo = false;
  plano.plano8 = false;
  plano.planosConcluidos += 1;
  await plano.save();
}

const NcJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano8: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      const messageIdPlano = plano.messageIdPlano;



      if (plano.diaPlano === 8) {
        if (plano.messageIdPlano) {
          await bot.deleteMessage(userId, plano.messageIdPlano);
          console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
        }
        await handlePlanCompletionNc(plano);
      } else {
        if (messageIdPlano) {
          try {
            await bot.deleteMessage(userId, plano.messageIdPlano);
            console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
          } catch (error) {
            console.log(`Erro ao excluir mensagem anterior do usuário ${userId}: ${error.message}`);
          }
        }

        await sendNamoroEraContemporanea(userId);
        console.log(`Mensagem enviada com sucesso para o usuário ${userId}`);
      }
    }
  } catch (err) {
    console.error("Erro ao recuperar usuários do banco de dados:", err);
  }
}, null, true, "America/Sao_Paulo");

NcJob.start();


// APOCALIPSE


const planoApocalipse = require("../plans/apocalipsepj.json");

bot.onText(/\/planoapocalipse/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.chat.id;
  const photoPath = 'src/image/apocalipsePj.jpg';
  const caption = '<b>Série Apocalipse - Paulo Junior (22 Dias)</b>\n\nVamos rumo à aprender e interpretar o livro de Apocalipse por 22 dias, abrangendo vários tópicos relacionados ao Apocalipse, como as mensagens às sete igrejas, os selos, as trombetas, a besta, entre outros.\n\nEDITOR - Gostaríamos de agradecer ao Pastor Paulo Junior, e o Canal  <a href="https://www.youtube.com/@defesadoevangelho">Em Defesa Do Evangelho</a>, por fornecer esta série. Para mais informações, visite: https://www.youtube.com/@paulojunioroficial5893';


  try {
    const existingPlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: true,
    });

    if (existingPlano) {
      bot.sendMessage(userId, "Você já possui um plano ativo.");
      return;
    }

    const existingInactivePlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: false,
    });

    if (existingInactivePlano) {
      await PlanoModel.updateMany(
        { user_id: userId, planoAtivo: false },
        {
          $set: {
            planoAtivo: true,
            diaPlano: 1,
            plano9: true,
          },
        }
      );

    } else {
      const newPlano = new PlanoModel({
        user_id: userId,
        firstname: msg.from.first_name,
        planoAtivo: true,
        diaPlano: 1,
        plano9: true,
        messagePositionPlano: 0,
        messageIdPlano: null,
        messagePlano: "",
        planosConcluidos: 0,
      });

      await newPlano.save();
    }

    await bot.sendPhoto(userId, photoPath, { caption: caption, parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      userId,
      "Ocorreu um erro ao criar o plano. Por favor, tente novamente mais tarde."
    );
  }
});


async function sendApocalipse(userId) {
  try {
    const activePlanos = await PlanoModel.find({
      plano9: true,
      diaPlano: { $lte: 22 },
    });

    for (const plano of activePlanos) {
      if (plano.diaPlano !== 23) {
        const apocalipse = planoApocalipse[plano.diaPlano.toString()];
        if (apocalipse) {
          const audio = apocalipse.audio;
          const caption = apocalipse.caption;

          const messageAudio = await bot.sendAudio(userId, audio, { caption });
          plano.messageIdPlano = messageAudio.message_id;
          await plano.save();
        }
      }

      plano.diaPlano++;
      await plano.save();
    }
  } catch (error) {
    console.error(error);
  }
}


async function handlePlanCompletionAp(plano) {
  const userId = plano.user_id;
  await bot.sendMessage(userId, "Glória a Deus! 🎉🎊\n\nVocê concluiu mais um plano com sucesso, para ver quantos você concluiu digite: /status\n\nSe quiser mais planos digite: /planos");
  await PlanoModel.updateOne({ _id: plano._id }, {
    $set: {
      diaPlano: "",
      messagePositionPlano: "",
      messageIdPlano: "",
      messagePlano: ""
    }
  });

  plano.planoAtivo = false;
  plano.plano9 = false;
  plano.planosConcluidos += 1;
  await plano.save();
}

const apJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano9: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      const messageIdPlano = plano.messageIdPlano;

      if (plano.diaPlano === 4) {
        if (plano.messageIdPlano) {
          await bot.deleteMessage(userId, plano.messageIdPlano);
          console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
        }
        await handlePlanCompletionAp(plano);
      } else {
        if (messageIdPlano) {
          try {
            await bot.deleteMessage(userId, plano.messageIdPlano);
            console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
          } catch (error) {
            console.log(`Erro ao excluir mensagem anterior do usuário ${userId}: ${error.message}`);
          }
        }

        await sendApocalipse(userId);
        console.log(`Mensagem enviada com sucesso para o usuário ${userId}`);
      }
    }
  } catch (err) {
    console.error("Erro ao recuperar usuários do banco de dados:", err);
  }
}, null, true, "America/Sao_Paulo");

apJob.start();


// Namoro 'Preto no Branco': Limites, Sexo e Realidade

const planoNamoroPB = require("../plans/namoropretonobranco.json");


bot.onText(/\/planonamoropb/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.chat.id;
  const photoPath = 'src/image/namoropretonobranco.jpg';
  const caption = '<b>Namoro "Preto no Branco": Limites, Sexo e Realidade (5 dias)</b>\n\nCansado de desastres, decepções e tragédias no namoro? Este devocional de 5 dias irá direto ao ponto e apresentará um plano prático para te ajudar a promover uma experiência de namoro saudável e agradável, compartilhando princípios comprovados e dicas que podem ser aplicadas durante a jornada do relacionamento.\n\nEditor - Gostaríamos de agradecer Adonis Lenzy e Heather Lenzy por fornecerem este plano. Para mais informações [em inglês], acesse: http://www.adonislenzy.com/product/dating-in-black-white-book-autographed-copy';

  try {
    const existingPlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: true,
    });

    if (existingPlano) {
      bot.sendMessage(userId, "Você já possui um plano ativo.");
      return;
    }

    const existingInactivePlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: false,
    });

    if (existingInactivePlano) {
      await PlanoModel.updateMany(
        { user_id: userId, planoAtivo: false },
        {
          $set: {
            planoAtivo: true,
            plano10: true,
            diaPlano: 1,
            messagePositionPlano: 0,
          },
        }
      );

    } else {
      const newPlano = new PlanoModel({
        user_id: userId,
        firstname: msg.from.first_name,
        planoAtivo: true,
        plano10: true,
        diaPlano: 1,
        messagePositionPlano: 0,
        messageIdPlano: null,
        messagePlano: "",
        planosConcluidos: 0,
      });

      await newPlano.save();
    }

    await bot.sendPhoto(userId, photoPath, { caption: caption, parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      userId,
      "Ocorreu um erro ao criar o plano. Por favor, tente novamente mais tarde."
    );
  }
});

async function sendNamoroPretoBranco(userId, texto, options) {
  try {
    const activePlanos = await PlanoModel.find({
      plano10: true,
      diaPlano: { $lte: 5 },
    });

    for (const plano of activePlanos) {
      if (plano.diaPlano !== 6) {
        const devocional = planoNamoroEraContemporanea[plano.diaPlano].devocional[0];
        const biblia = planoNamoroEraContemporanea[plano.diaPlano].biblia[0];
        const planoText = `<b>${devocional.titulo}</b>\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;

        let position = plano.messagePositionPlano || 0;
        plano.messagePositionPlano = position;
        const buttonsPlano = [];
        const limite = 1000;
        const mensagemDividida = planoText.split("\n");

        if (position > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planonpb" });
        }
        if (planoText.length > limite) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planonpb" });
        }

        const messageOptions = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };

        let mesnsagemArray = []
        let arrayPosition = 0
        mesnsagemArray[arrayPosition] = ""
        let messageInfo;
        if (planoText.length <= limite) {
          mesnsagemArray[arrayPosition] = planoText
          messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML" });
        }
        else {

          for (let posicaoTexto = 0; posicaoTexto < mensagemDividida.length; posicaoTexto++) {
            let frase = mensagemDividida[posicaoTexto];
            if ((mesnsagemArray[arrayPosition].length + frase.length) <= limite) {
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
            else {
              mesnsagemArray.push("");
              arrayPosition++;
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
          }

          messageInfo = await bot.sendMessage(
            plano.user_id,
            mesnsagemArray[0],
            messageOptions
          );
        }
        plano.messagePositionPlano = 0;
        plano.messagePlano = mesnsagemArray
        plano.messageIdPlano = messageInfo.message_id;
        await plano.save();

      }

      plano.diaPlano++;
      await plano.save();
    }
  } catch (error) {
    console.error(error);
  }
}

async function handlePlanCompletionPb(plano) {
  const userId = plano.user_id;
  await bot.sendMessage(userId, "Uauuuu! 🎉🎊\n\nVocê concluiu mais um plano com sucesso, para ver quantos você concluiu digite: /status\n\nSe quiser mais planos digite: /planos");
  await PlanoModel.updateOne({ _id: plano._id }, {
    $set: {
      diaPlano: "",
      messagePositionPlano: "",
      messageIdPlano: "",
      messagePlano: ""
    }
  });

  plano.planoAtivo = false;
  plano.plano10 = false;
  plano.planosConcluidos += 1;
  await plano.save();
}

const NpbJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano10: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      const messageIdPlano = plano.messageIdPlano;



      if (plano.diaPlano === 6) {
        if (plano.messageIdPlano) {
          await bot.deleteMessage(userId, plano.messageIdPlano);
          console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
        }
        await handlePlanCompletionPb(plano);
      } else {
        if (messageIdPlano) {
          try {
            await bot.deleteMessage(userId, plano.messageIdPlano);
            console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
          } catch (error) {
            console.log(`Erro ao excluir mensagem anterior do usuário ${userId}: ${error.message}`);
          }
        }

        await sendNamoroPretoBranco(userId);
        console.log(`Mensagem enviada com sucesso para o usuário ${userId}`);
      }
    }
  } catch (err) {
    console.error("Erro ao recuperar usuários do banco de dados:", err);
  }
}, null, true, "America/Sao_Paulo");

NpbJob.start();

// O Curso do Casamento

const planoCursoCasamento = require("../plans/cursodocasamento.json");


bot.onText(/\/planocasamento/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.chat.id;
  const photoPath = 'src/image/cursodocasamento.jpg';
  const caption = '<b>O Curso do Casamento (5 dias)</b>\n\nCasamentos fortes não se desenvolvem automaticamente. Nossa esperança é que você descubra as atitudes, os valores e os hábitos necessários para construir um casamento saudável e forte que durará por toda uma vida. Este plano de 5 dias foi adaptado do "Curso do Casamento" criado por Nick e Sila Lee, autores de "O Livro do Casamento".\n\nEditor - Gostaríamos de agradecer a Alpha por disponibilizar este plano. Para mais informações [em inglês], acesse: https://themarriagecourse.org/try/the-pre-marriage-course';

  try {
    const existingPlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: true,
    });

    if (existingPlano) {
      bot.sendMessage(userId, "Você já possui um plano ativo.");
      return;
    }

    const existingInactivePlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: false,
    });

    if (existingInactivePlano) {
      await PlanoModel.updateMany(
        { user_id: userId, planoAtivo: false },
        {
          $set: {
            planoAtivo: true,
            plano11: true,
            diaPlano: 1,
            messagePositionPlano: 0,
          },
        }
      );

    } else {
      const newPlano = new PlanoModel({
        user_id: userId,
        firstname: msg.from.first_name,
        planoAtivo: true,
        plano11: true,
        diaPlano: 1,
        messagePositionPlano: 0,
        messageIdPlano: null,
        messagePlano: "",
        planosConcluidos: 0,
      });

      await newPlano.save();
    }

    await bot.sendPhoto(userId, photoPath, { caption: caption, parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      userId,
      "Ocorreu um erro ao criar o plano. Por favor, tente novamente mais tarde."
    );
  }
});

async function sendCasamento(userId, texto, options) {
  try {
    const activePlanos = await PlanoModel.find({
      plano11: true,
      diaPlano: { $lte: 5 },
    });

    for (const plano of activePlanos) {
      if (plano.diaPlano !== 6) {
        const devocional = planoNamoroEraContemporanea[plano.diaPlano].devocional[0];
        const biblia = planoNamoroEraContemporanea[plano.diaPlano].biblia[0];
        const planoText = `<b>${devocional.titulo}</b>\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;

        let position = plano.messagePositionPlano || 0;
        plano.messagePositionPlano = position;
        const buttonsPlano = [];
        const limite = 1000;
        const mensagemDividida = planoText.split("\n");

        if (position > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planocs" });
        }
        if (planoText.length > limite) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planocs" });
        }

        const messageOptions = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };

        let mesnsagemArray = []
        let arrayPosition = 0
        mesnsagemArray[arrayPosition] = ""
        let messageInfo;
        if (planoText.length <= limite) {
          mesnsagemArray[arrayPosition] = planoText
          messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML" });
        }
        else {

          for (let posicaoTexto = 0; posicaoTexto < mensagemDividida.length; posicaoTexto++) {
            let frase = mensagemDividida[posicaoTexto];
            if ((mesnsagemArray[arrayPosition].length + frase.length) <= limite) {
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
            else {
              mesnsagemArray.push("");
              arrayPosition++;
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
          }

          messageInfo = await bot.sendMessage(
            plano.user_id,
            mesnsagemArray[0],
            messageOptions
          );
        }
        plano.messagePositionPlano = 0;
        plano.messagePlano = mesnsagemArray
        plano.messageIdPlano = messageInfo.message_id;
        await plano.save();

      }

      plano.diaPlano++;
      await plano.save();
    }
  } catch (error) {
    console.error(error);
  }
}

async function handlePlanCompletionCasamento(plano) {
  const userId = plano.user_id;
  await bot.sendMessage(userId, "BOMMMMM! 🎉🎊\n\nVocê concluiu mais um plano com sucesso, para ver quantos você concluiu digite: /status\n\nSe quiser mais planos digite: /planos");
  await PlanoModel.updateOne({ _id: plano._id }, {
    $set: {
      diaPlano: "",
      messagePositionPlano: "",
      messageIdPlano: "",
      messagePlano: ""
    }
  });

  plano.planoAtivo = false;
  plano.plano11 = false;
  plano.planosConcluidos += 1;
  await plano.save();
}

const CasamentoJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano11: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      const messageIdPlano = plano.messageIdPlano;



      if (plano.diaPlano === 6) {
        if (plano.messageIdPlano) {
          await bot.deleteMessage(userId, plano.messageIdPlano);
          console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
        }
        await handlePlanCompletionCasamento(plano);
      } else {
        if (messageIdPlano) {
          try {
            await bot.deleteMessage(userId, plano.messageIdPlano);
            console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
          } catch (error) {
            console.log(`Erro ao excluir mensagem anterior do usuário ${userId}: ${error.message}`);
          }
        }

        await sendCasamento(userId);
        console.log(`Mensagem enviada com sucesso para o usuário ${userId}`);
      }
    }
  } catch (err) {
    console.error("Erro ao recuperar usuários do banco de dados:", err);
  }
}, null, true, "America/Sao_Paulo");

CasamentoJob.start();

// Do Divórcio à Cura: Sobreviva e Floresça

const planoDivorcioACura = require("../plans/divorcioacura.json");

bot.onText(/\/planodvc/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.chat.id;
  const photoPath = 'src/image/divorcioacura.jpg';
  const caption = '<b>Do Divórcio à Cura: Sobreviva e Floresça (7 dias)</b>\n\nDurante um divórcio e outros tempos extremamente difíceis, chega um momento quando você se pergunta se vai conseguir superar. Pelos próximos 7 dias, você será capaz de se conectar com Deus por meio de orações, conselhos e planos de ação. Aprenda a não apenas sobreviver, mas a sobreviver e florescer.\n\nEditor - Gostaríamos de agradecer Brent D Papineau por fornecer este plano. Para mais informações, visite: http://divorcetohealing.blog (em inglês)';

  try {
    const existingPlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: true,
    });

    if (existingPlano) {
      bot.sendMessage(userId, "Você já possui um plano ativo.");
      return;
    }

    const existingInactivePlano = await PlanoModel.findOne({
      user_id: userId,
      planoAtivo: false,
    });

    if (existingInactivePlano) {
      await PlanoModel.updateMany(
        { user_id: userId, planoAtivo: false },
        {
          $set: {
            planoAtivo: true,
            plano12: true,
            diaPlano: 1,
            messagePositionPlano: 0,
          },
        }
      );

    } else {
      const newPlano = new PlanoModel({
        user_id: userId,
        firstname: msg.from.first_name,
        planoAtivo: true,
        plano12: true,
        diaPlano: 1,
        messagePositionPlano: 0,
        messageIdPlano: null,
        messagePlano: "",
        planosConcluidos: 0,
      });

      await newPlano.save();
    }

    await bot.sendPhoto(userId, photoPath, { caption: caption, parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
    bot.sendMessage(
      userId,
      "Ocorreu um erro ao criar o plano. Por favor, tente novamente mais tarde."
    );
  }
});

async function sendDivorcioACura(userId, texto, options) {
  try {
    const activePlanos = await PlanoModel.find({
      plano12: true,
      diaPlano: { $lte: 7 },
    });

    for (const plano of activePlanos) {
      if (plano.diaPlano !== 8) {
        const devocional = planoNamoroEraContemporanea[plano.diaPlano].devocional[0];
        const biblia = planoNamoroEraContemporanea[plano.diaPlano].biblia[0];
        const planoText = `<b>${devocional.titulo}</b>\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;

        let position = plano.messagePositionPlano || 0;
        plano.messagePositionPlano = position;
        const buttonsPlano = [];
        const limite = 1000;
        const mensagemDividida = planoText.split("\n");

        if (position > 0) {
          buttonsPlano.push({ text: "⬅️", callback_data: "prev-planodc" });
        }
        if (planoText.length > limite) {
          buttonsPlano.push({ text: "➡️", callback_data: "next-planodc" });
        }

        const messageOptions = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [buttonsPlano],
          },
        };

        let mesnsagemArray = []
        let arrayPosition = 0
        mesnsagemArray[arrayPosition] = ""
        let messageInfo;
        if (planoText.length <= limite) {
          mesnsagemArray[arrayPosition] = planoText
          messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML" });
        }
        else {

          for (let posicaoTexto = 0; posicaoTexto < mensagemDividida.length; posicaoTexto++) {
            let frase = mensagemDividida[posicaoTexto];
            if ((mesnsagemArray[arrayPosition].length + frase.length) <= limite) {
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
            else {
              mesnsagemArray.push("");
              arrayPosition++;
              mesnsagemArray[arrayPosition] += `${frase}\n`;
            }
          }

          messageInfo = await bot.sendMessage(
            plano.user_id,
            mesnsagemArray[0],
            messageOptions
          );
        }
        plano.messagePositionPlano = 0;
        plano.messagePlano = mesnsagemArray
        plano.messageIdPlano = messageInfo.message_id;
        await plano.save();

      }

      plano.diaPlano++;
      await plano.save();
    }
  } catch (error) {
    console.error(error);
  }
}

async function handlePlanCompletionDivorcioACura(plano) {
  const userId = plano.user_id;
  await bot.sendMessage(userId, "BOMMMMM! 🎉🎊\n\nVocê concluiu mais um plano com sucesso, para ver quantos você concluiu digite: /status\n\nSe quiser mais planos digite: /planos");
  await PlanoModel.updateOne({ _id: plano._id }, {
    $set: {
      diaPlano: "",
      messagePositionPlano: "",
      messageIdPlano: "",
      messagePlano: ""
    }
  });

  plano.planoAtivo = false;
  plano.plano12 = false;
  plano.planosConcluidos += 1;
  await plano.save();
}

const DivorcioJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano12: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      const messageIdPlano = plano.messageIdPlano;



      if (plano.diaPlano === 8) {
        if (plano.messageIdPlano) {
          await bot.deleteMessage(userId, plano.messageIdPlano);
          console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
        }
        await handlePlanCompletionDivorcioACura(plano);
      } else {
        if (messageIdPlano) {
          try {
            await bot.deleteMessage(userId, plano.messageIdPlano);
            console.log(`Mensagem anterior do usuário ${userId} excluída com sucesso`);
          } catch (error) {
            console.log(`Erro ao excluir mensagem anterior do usuário ${userId}: ${error.message}`);
          }
        }

        await sendDivorcioACura(userId);
        console.log(`Mensagem enviada com sucesso para o usuário ${userId}`);
      }
    }
  } catch (err) {
    console.error("Erro ao recuperar usuários do banco de dados:", err);
  }
}, null, true, "America/Sao_Paulo");

DivorcioJob.start();

// DEVOCIONAIS - CRESCENDO NA FÉ (6 DIAS)

const planoDevocionais = require("../plans/devocionais.json");

bot.onText(/\/planodevocionais/, async (msg) => {
  if (msg.chat.type !== "private") {
    return;
  }
  const userId = msg.chat.id;
  const photoPath = 'src/image/Jesus.jpg';
  const caption = '<b>Crescendo na Fé — Devocionais (6 Dias)</b>\n\nUm plano devocional de 6 dias para aprofundar sua caminhada com Deus. Cada dia traz uma reflexão bíblica sobre graça, fé, paz, amor, transformação e propósito. Ideal para quem deseja começar ou aprofundar o hábito da leitura devocional.\n\nCategoria: Crescimento Espiritual | Duração: 6 dias';

  try {
    const existingPlano = await PlanoModel.findOne({ user_id: userId, planoAtivo: true });
    if (existingPlano) {
      bot.sendMessage(userId, "Você já possui um plano ativo.\n\nUse /cancelarplano para cancelar o plano atual antes de iniciar um novo.");
      return;
    }

    const existingInactivePlano = await PlanoModel.findOne({ user_id: userId, planoAtivo: false });
    if (existingInactivePlano) {
      await PlanoModel.updateMany(
        { user_id: userId, planoAtivo: false },
        { $set: { planoAtivo: true, plano13: true, diaPlano: 1, messagePositionPlano: 0 } }
      );
    } else {
      const newPlano = new PlanoModel({
        user_id: userId,
        planoAtivo: true,
        plano13: true,
        diaPlano: 1,
        messagePositionPlano: 0,
        messageIdPlano: null,
        messagePlano: "",
        planosConcluidos: 0,
      });
      await newPlano.save();
    }

    await bot.sendPhoto(userId, photoPath, { caption, parse_mode: 'HTML' });
  } catch (error) {
    console.error(error);
    bot.sendMessage(userId, "Ocorreu um erro ao criar o plano. Por favor, tente novamente mais tarde.");
  }
});

async function sendDevocionais(plano) {
  try {
    const limite = 1000;
    const dia = plano.diaPlano;

    const devocional = planoDevocionais[dia].devocional[0];
    const biblia = planoDevocionais[dia].biblia[0];
    const planoText = `<b>${devocional.titulo}</b>\n\n${devocional.versiculo}\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;

    const mensagemDividida = planoText.split("\n");
    let mesnsagemArray = [];
    let arrayPosition = 0;
    mesnsagemArray[arrayPosition] = "";

    let messageInfo;
    if (planoText.length <= limite) {
      mesnsagemArray[arrayPosition] = planoText;
      messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML" });
    } else {
      for (let posicaoTexto = 0; posicaoTexto < mensagemDividida.length; posicaoTexto++) {
        let frase = mensagemDividida[posicaoTexto];
        if ((mesnsagemArray[arrayPosition].length + frase.length) <= limite) {
          mesnsagemArray[arrayPosition] += `${frase}\n`;
        } else {
          mesnsagemArray.push("");
          arrayPosition++;
          mesnsagemArray[arrayPosition] += `${frase}\n`;
        }
      }

      const buttonsPlano = [];
      if (mesnsagemArray.length > 1) {
        buttonsPlano.push({ text: "➡️", callback_data: "next-planodv" });
      }
      messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], {
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [buttonsPlano] },
      });
    }

    plano.messagePositionPlano = 0;
    plano.messagePlano = mesnsagemArray;
    plano.messageIdPlano = messageInfo.message_id;
    plano.diaPlano++;
    await plano.save();
  } catch (error) {
    console.error(error);
  }
}

async function handlePlanCompletionDevocionais(plano) {
  const userId = plano.user_id;
  await bot.sendMessage(userId, "Parabéns! 🎉🙏\n\nVocê concluiu o plano devocional 'Crescendo na Fé'!\n\nQue esses 6 dias de reflexão tenham fortalecido sua caminhada com Deus. Para ver seus planos concluídos use /status\n\nEscolha um novo plano com /plano");
  await PlanoModel.updateOne({ _id: plano._id }, {
    $set: { diaPlano: null, messagePositionPlano: 0, messageIdPlano: null, messagePlano: [] }
  });
  plano.planoAtivo = false;
  plano.plano13 = false;
  plano.planosConcluidos = (plano.planosConcluidos || 0) + 1;
  await plano.save();
}

const devocionaisJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano13: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;

      if (plano.diaPlano > 6) {
        if (plano.messageIdPlano) {
          try { await bot.deleteMessage(userId, plano.messageIdPlano); } catch (_) {}
        }
        await handlePlanCompletionDevocionais(plano);
      } else {
        if (plano.messageIdPlano) {
          try {
            await bot.deleteMessage(userId, plano.messageIdPlano);
          } catch (error) {
            console.log(`Erro ao excluir mensagem do usuário ${userId}: ${error.message}`);
          }
        }
        await sendDevocionais(plano);
        console.log(`Devocional enviado para o usuário ${userId} — dia ${plano.diaPlano - 1}`);
      }
    }
  } catch (err) {
    console.error("Erro no devocionaisJob:", err);
  }
}, null, true, "America/Sao_Paulo");

devocionaisJob.start();

// ─── PLANO 14: 30 DIAS NOS SALMOS ────────────────────────────────────────────

const planoSalmos = require("../plans/salmos30.json");

bot.onText(/\/planosalmos/, async (msg) => {
  if (msg.chat.type !== "private") return;
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  try {
    let plano = await PlanoModel.findOne({ user_id: userId });
    if (!plano) {
      plano = new PlanoModel({ user_id: userId, diaPlano: 1, planoAtivo: true, plano14: true });
    } else {
      if (plano.planoAtivo) {
        return bot.sendMessage(chatId, "Você já possui um plano ativo. Use /cancelarplano para cancelar antes de iniciar outro.");
      }
      plano.plano14 = true;
      plano.planoAtivo = true;
      plano.diaPlano = 1;
      plano.messagePlano = [];
      plano.messagePositionPlano = 0;
      plano.messageIdPlano = null;
    }
    await plano.save();
    bot.sendMessage(chatId, "✅ Plano <b>30 Dias nos Salmos</b> iniciado!\n\nVocê receberá o devocional diariamente às 21h30. Prepare o coração para mergulhar nos Salmos.", { parse_mode: "HTML" });
  } catch (error) {
    console.error("Erro ao iniciar planosalmos:", error);
    bot.sendMessage(chatId, "Ocorreu um erro. Tente novamente.");
  }
});

async function sendSalmos(plano) {
  try {
    const limite = 1000;
    const dia = plano.diaPlano;
    const devocional = planoSalmos[dia].devocional[0];
    const biblia = planoSalmos[dia].biblia[0];
    const planoText = `<b>${devocional.titulo}</b>\n\n${devocional.versiculo}\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;
    const mensagemDividida = planoText.split("\n");
    let mesnsagemArray = [];
    let arrayPosition = 0;
    mesnsagemArray[arrayPosition] = "";
    let messageInfo;
    if (planoText.length <= limite) {
      mesnsagemArray[arrayPosition] = planoText;
      messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML" });
    } else {
      for (const frase of mensagemDividida) {
        if ((mesnsagemArray[arrayPosition].length + frase.length) <= limite) {
          mesnsagemArray[arrayPosition] += `${frase}\n`;
        } else {
          mesnsagemArray.push("");
          arrayPosition++;
          mesnsagemArray[arrayPosition] += `${frase}\n`;
        }
      }
      const buttonsPlano = [];
      if (mesnsagemArray.length > 1) buttonsPlano.push({ text: "➡️", callback_data: "next-planosalmos" });
      messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML", reply_markup: { inline_keyboard: [buttonsPlano] } });
    }
    plano.messagePositionPlano = 0;
    plano.messagePlano = mesnsagemArray;
    plano.messageIdPlano = messageInfo.message_id;
    plano.diaPlano++;
    await plano.save();
  } catch (error) {
    console.error(error);
  }
}

async function handlePlanCompletionSalmos(plano) {
  await bot.sendMessage(plano.user_id, "Parabéns! 🎉🙏\n\nVocê concluiu o plano <b>30 Dias nos Salmos</b>!\n\nQue esses 30 dias de louvor e oração tenham aprofundado sua intimidade com Deus. Use /status para ver seus planos concluídos.\n\nEscolha um novo plano com /plano", { parse_mode: "HTML" });
  await PlanoModel.updateOne({ _id: plano._id }, { $set: { diaPlano: null, messagePositionPlano: 0, messageIdPlano: null, messagePlano: [] } });
  plano.planoAtivo = false;
  plano.plano14 = false;
  plano.planosConcluidos = (plano.planosConcluidos || 0) + 1;
  await plano.save();
}

const salmosJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano14: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      if (plano.diaPlano > 30) {
        if (plano.messageIdPlano) { try { await bot.deleteMessage(userId, plano.messageIdPlano); } catch (_) {} }
        await handlePlanCompletionSalmos(plano);
      } else {
        if (plano.messageIdPlano) { try { await bot.deleteMessage(userId, plano.messageIdPlano); } catch (_) {} }
        await sendSalmos(plano);
      }
    }
  } catch (err) {
    console.error("Erro no salmosJob:", err);
  }
}, null, true, "America/Sao_Paulo");
salmosJob.start();

// ─── PLANO 15: 30 DIAS EM PROVÉRBIOS ─────────────────────────────────────────

const planoProverbios = require("../plans/proverbios30.json");

bot.onText(/\/planoproverbios/, async (msg) => {
  if (msg.chat.type !== "private") return;
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  try {
    let plano = await PlanoModel.findOne({ user_id: userId });
    if (!plano) {
      plano = new PlanoModel({ user_id: userId, diaPlano: 1, planoAtivo: true, plano15: true });
    } else {
      if (plano.planoAtivo) {
        return bot.sendMessage(chatId, "Você já possui um plano ativo. Use /cancelarplano para cancelar antes de iniciar outro.");
      }
      plano.plano15 = true;
      plano.planoAtivo = true;
      plano.diaPlano = 1;
      plano.messagePlano = [];
      plano.messagePositionPlano = 0;
      plano.messageIdPlano = null;
    }
    await plano.save();
    bot.sendMessage(chatId, "✅ Plano <b>30 Dias em Provérbios</b> iniciado!\n\nVocê receberá o devocional diariamente às 21h30. Sabedoria prática de Deus para cada dia.", { parse_mode: "HTML" });
  } catch (error) {
    console.error("Erro ao iniciar planoproverbios:", error);
    bot.sendMessage(chatId, "Ocorreu um erro. Tente novamente.");
  }
});

async function sendProverbios(plano) {
  try {
    const limite = 1000;
    const dia = plano.diaPlano;
    const devocional = planoProverbios[dia].devocional[0];
    const biblia = planoProverbios[dia].biblia[0];
    const planoText = `<b>${devocional.titulo}</b>\n\n${devocional.versiculo}\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;
    const mensagemDividida = planoText.split("\n");
    let mesnsagemArray = [];
    let arrayPosition = 0;
    mesnsagemArray[arrayPosition] = "";
    let messageInfo;
    if (planoText.length <= limite) {
      mesnsagemArray[arrayPosition] = planoText;
      messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML" });
    } else {
      for (const frase of mensagemDividida) {
        if ((mesnsagemArray[arrayPosition].length + frase.length) <= limite) {
          mesnsagemArray[arrayPosition] += `${frase}\n`;
        } else {
          mesnsagemArray.push("");
          arrayPosition++;
          mesnsagemArray[arrayPosition] += `${frase}\n`;
        }
      }
      const buttonsPlano = [];
      if (mesnsagemArray.length > 1) buttonsPlano.push({ text: "➡️", callback_data: "next-planoproverbios" });
      messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML", reply_markup: { inline_keyboard: [buttonsPlano] } });
    }
    plano.messagePositionPlano = 0;
    plano.messagePlano = mesnsagemArray;
    plano.messageIdPlano = messageInfo.message_id;
    plano.diaPlano++;
    await plano.save();
  } catch (error) {
    console.error(error);
  }
}

async function handlePlanCompletionProverbios(plano) {
  await bot.sendMessage(plano.user_id, "Parabéns! 🎉🙏\n\nVocê concluiu o plano <b>30 Dias em Provérbios</b>!\n\nQue a sabedoria de Deus guie seus caminhos. Use /status para ver seus planos concluídos.\n\nEscolha um novo plano com /plano", { parse_mode: "HTML" });
  await PlanoModel.updateOne({ _id: plano._id }, { $set: { diaPlano: null, messagePositionPlano: 0, messageIdPlano: null, messagePlano: [] } });
  plano.planoAtivo = false;
  plano.plano15 = false;
  plano.planosConcluidos = (plano.planosConcluidos || 0) + 1;
  await plano.save();
}

const proverbiosJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano15: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      if (plano.diaPlano > 30) {
        if (plano.messageIdPlano) { try { await bot.deleteMessage(userId, plano.messageIdPlano); } catch (_) {} }
        await handlePlanCompletionProverbios(plano);
      } else {
        if (plano.messageIdPlano) { try { await bot.deleteMessage(userId, plano.messageIdPlano); } catch (_) {} }
        await sendProverbios(plano);
      }
    }
  } catch (err) {
    console.error("Erro no proverbiosJob:", err);
  }
}, null, true, "America/Sao_Paulo");
proverbiosJob.start();

// ─── PLANO 16: IDENTIDADE EM CRISTO (7 DIAS) ─────────────────────────────────

const planoIdentidadeCristo = require("../plans/identidadecristo.json");

bot.onText(/\/planoidemcristo/, async (msg) => {
  if (msg.chat.type !== "private") return;
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  try {
    let plano = await PlanoModel.findOne({ user_id: userId });
    if (!plano) {
      plano = new PlanoModel({ user_id: userId, diaPlano: 1, planoAtivo: true, plano16: true });
    } else {
      if (plano.planoAtivo) {
        return bot.sendMessage(chatId, "Você já possui um plano ativo. Use /cancelarplano para cancelar antes de iniciar outro.");
      }
      plano.plano16 = true;
      plano.planoAtivo = true;
      plano.diaPlano = 1;
      plano.messagePlano = [];
      plano.messagePositionPlano = 0;
      plano.messageIdPlano = null;
    }
    await plano.save();
    bot.sendMessage(chatId, "✅ Plano <b>Identidade em Cristo</b> iniciado!\n\nVocê receberá o devocional diariamente às 21h30. Durante 7 dias, descubra quem você é em Cristo.", { parse_mode: "HTML" });
  } catch (error) {
    console.error("Erro ao iniciar planoidemcristo:", error);
    bot.sendMessage(chatId, "Ocorreu um erro. Tente novamente.");
  }
});

async function sendIdentidadeCristo(plano) {
  try {
    const limite = 1000;
    const dia = plano.diaPlano;
    const devocional = planoIdentidadeCristo[dia].devocional[0];
    const biblia = planoIdentidadeCristo[dia].biblia[0];
    const planoText = `<b>${devocional.titulo}</b>\n\n${devocional.versiculo}\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;
    const mensagemDividida = planoText.split("\n");
    let mesnsagemArray = [];
    let arrayPosition = 0;
    mesnsagemArray[arrayPosition] = "";
    let messageInfo;
    if (planoText.length <= limite) {
      mesnsagemArray[arrayPosition] = planoText;
      messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML" });
    } else {
      for (const frase of mensagemDividida) {
        if ((mesnsagemArray[arrayPosition].length + frase.length) <= limite) {
          mesnsagemArray[arrayPosition] += `${frase}\n`;
        } else {
          mesnsagemArray.push("");
          arrayPosition++;
          mesnsagemArray[arrayPosition] += `${frase}\n`;
        }
      }
      const buttonsPlano = [];
      if (mesnsagemArray.length > 1) buttonsPlano.push({ text: "➡️", callback_data: "next-planoidemcristo" });
      messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML", reply_markup: { inline_keyboard: [buttonsPlano] } });
    }
    plano.messagePositionPlano = 0;
    plano.messagePlano = mesnsagemArray;
    plano.messageIdPlano = messageInfo.message_id;
    plano.diaPlano++;
    await plano.save();
  } catch (error) {
    console.error(error);
  }
}

async function handlePlanCompletionIdentidadeCristo(plano) {
  await bot.sendMessage(plano.user_id, "Parabéns! 🎉🙏\n\nVocê concluiu o plano <b>Identidade em Cristo</b>!\n\nQue você viva cada dia a partir de quem você é em Cristo. Use /status para ver seus planos concluídos.\n\nEscolha um novo plano com /plano", { parse_mode: "HTML" });
  await PlanoModel.updateOne({ _id: plano._id }, { $set: { diaPlano: null, messagePositionPlano: 0, messageIdPlano: null, messagePlano: [] } });
  plano.planoAtivo = false;
  plano.plano16 = false;
  plano.planosConcluidos = (plano.planosConcluidos || 0) + 1;
  await plano.save();
}

const identidadeCristoJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano16: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      if (plano.diaPlano > 7) {
        if (plano.messageIdPlano) { try { await bot.deleteMessage(userId, plano.messageIdPlano); } catch (_) {} }
        await handlePlanCompletionIdentidadeCristo(plano);
      } else {
        if (plano.messageIdPlano) { try { await bot.deleteMessage(userId, plano.messageIdPlano); } catch (_) {} }
        await sendIdentidadeCristo(plano);
      }
    }
  } catch (err) {
    console.error("Erro no identidadeCristoJob:", err);
  }
}, null, true, "America/Sao_Paulo");
identidadeCristoJob.start();

// ─── PLANO 17: ANSIEDADE E FÉ (7 DIAS) ───────────────────────────────────────

const planoAnsiedadeFe = require("../plans/ansiedadefe.json");

bot.onText(/\/planoansiedade/, async (msg) => {
  if (msg.chat.type !== "private") return;
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  try {
    let plano = await PlanoModel.findOne({ user_id: userId });
    if (!plano) {
      plano = new PlanoModel({ user_id: userId, diaPlano: 1, planoAtivo: true, plano17: true });
    } else {
      if (plano.planoAtivo) {
        return bot.sendMessage(chatId, "Você já possui um plano ativo. Use /cancelarplano para cancelar antes de iniciar outro.");
      }
      plano.plano17 = true;
      plano.planoAtivo = true;
      plano.diaPlano = 1;
      plano.messagePlano = [];
      plano.messagePositionPlano = 0;
      plano.messageIdPlano = null;
    }
    await plano.save();
    bot.sendMessage(chatId, "✅ Plano <b>Ansiedade e Fé</b> iniciado!\n\nVocê receberá o devocional diariamente às 21h30. Durante 7 dias, encontre paz e coragem bíblica.", { parse_mode: "HTML" });
  } catch (error) {
    console.error("Erro ao iniciar planoansiedade:", error);
    bot.sendMessage(chatId, "Ocorreu um erro. Tente novamente.");
  }
});

async function sendAnsiedadeFe(plano) {
  try {
    const limite = 1000;
    const dia = plano.diaPlano;
    const devocional = planoAnsiedadeFe[dia].devocional[0];
    const biblia = planoAnsiedadeFe[dia].biblia[0];
    const planoText = `<b>${devocional.titulo}</b>\n\n${devocional.versiculo}\n\n${devocional.texto}\n\n<b>${biblia.referencia}</b>\n\n${biblia.texto}`;
    const mensagemDividida = planoText.split("\n");
    let mesnsagemArray = [];
    let arrayPosition = 0;
    mesnsagemArray[arrayPosition] = "";
    let messageInfo;
    if (planoText.length <= limite) {
      mesnsagemArray[arrayPosition] = planoText;
      messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML" });
    } else {
      for (const frase of mensagemDividida) {
        if ((mesnsagemArray[arrayPosition].length + frase.length) <= limite) {
          mesnsagemArray[arrayPosition] += `${frase}\n`;
        } else {
          mesnsagemArray.push("");
          arrayPosition++;
          mesnsagemArray[arrayPosition] += `${frase}\n`;
        }
      }
      const buttonsPlano = [];
      if (mesnsagemArray.length > 1) buttonsPlano.push({ text: "➡️", callback_data: "next-planoansiedade" });
      messageInfo = await bot.sendMessage(plano.user_id, mesnsagemArray[0], { parse_mode: "HTML", reply_markup: { inline_keyboard: [buttonsPlano] } });
    }
    plano.messagePositionPlano = 0;
    plano.messagePlano = mesnsagemArray;
    plano.messageIdPlano = messageInfo.message_id;
    plano.diaPlano++;
    await plano.save();
  } catch (error) {
    console.error(error);
  }
}

async function handlePlanCompletionAnsiedadeFe(plano) {
  await bot.sendMessage(plano.user_id, "Parabéns! 🎉🙏\n\nVocê concluiu o plano <b>Ansiedade e Fé</b>!\n\nQue a paz de Deus que excede todo entendimento guarde seu coração. Use /status para ver seus planos concluídos.\n\nEscolha um novo plano com /plano", { parse_mode: "HTML" });
  await PlanoModel.updateOne({ _id: plano._id }, { $set: { diaPlano: null, messagePositionPlano: 0, messageIdPlano: null, messagePlano: [] } });
  plano.planoAtivo = false;
  plano.plano17 = false;
  plano.planosConcluidos = (plano.planosConcluidos || 0) + 1;
  await plano.save();
}

const ansiedadeFeJob = new CronJob("00 30 21 * * *", async () => {
  try {
    const activePlanos = await PlanoModel.find({ plano17: true });
    for (const plano of activePlanos) {
      const userId = plano.user_id;
      if (plano.diaPlano > 7) {
        if (plano.messageIdPlano) { try { await bot.deleteMessage(userId, plano.messageIdPlano); } catch (_) {} }
        await handlePlanCompletionAnsiedadeFe(plano);
      } else {
        if (plano.messageIdPlano) { try { await bot.deleteMessage(userId, plano.messageIdPlano); } catch (_) {} }
        await sendAnsiedadeFe(plano);
      }
    }
  } catch (err) {
    console.error("Erro no ansiedadeFeJob:", err);
  }
}, null, true, "America/Sao_Paulo");
ansiedadeFeJob.start();

// ─── CALLBACKS DE PAGINAÇÃO DOS NOVOS PLANOS ─────────────────────────────────

bot.on("callback_query", async (query) => {
  const data = query.data;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  const planCallbacks = {
    "next-planosalmos": { find: { plano14: true }, nextKey: "prev-planosalmos" },
    "next-planoproverbios": { find: { plano15: true }, nextKey: "prev-planoproverbios" },
    "next-planoidemcristo": { find: { plano16: true }, nextKey: "prev-planoidemcristo" },
    "next-planoansiedade": { find: { plano17: true }, nextKey: "prev-planoansiedade" },
  };

  if (planCallbacks[data]) {
    const plano = await PlanoModel.findOne({ user_id: query.from.id });
    if (!plano || !plano.messagePlano || plano.messagePlano.length === 0) {
      return bot.answerCallbackQuery(query.id);
    }
    const nextPos = plano.messagePositionPlano + 1;
    if (nextPos >= plano.messagePlano.length) {
      return bot.answerCallbackQuery(query.id);
    }
    const buttons = [];
    if (nextPos > 0) buttons.push({ text: "⬅️", callback_data: planCallbacks[data].nextKey });
    if (nextPos < plano.messagePlano.length - 1) buttons.push({ text: "➡️", callback_data: data });
    await bot.editMessageText(plano.messagePlano[nextPos], {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [buttons] },
    });
    plano.messagePositionPlano = nextPos;
    await plano.save();
    return bot.answerCallbackQuery(query.id);
  }
});

// ─── ONBOARDING PROGRESSIVO ───────────────────────────────────────────────────

const tips = {
  1: `🌟 <b>Dica do dia 1</b>\n\nBem-vindo ao Peregrino! Sabia que você pode pesquisar qualquer versículo da Bíblia diretamente em qualquer conversa do Telegram?\n\nDigite em qualquer chat: <code>@operegrino_bot João 3:16</code>\n\nExperimente agora!`,
  3: `📅 <b>Dica do dia 3</b>\n\nVocê sabia que temos <b>17 planos de leitura bíblica</b>? Eles são enviados todo dia às 21h30 direto aqui no chat.\n\nAlguns destaques:\n• /planoidemcristo — Identidade em Cristo (7d)\n• /planoansiedade — Ansiedade e Fé (7d)\n• /planosalmos — 30 Dias nos Salmos\n\nVeja todos com /plano`,
  7: `🏅 <b>Dica do dia 7</b>\n\nVocê está há 7 dias no Peregrino! 🎉\n\nSabia que temos um <b>sistema de ranks</b>? Quanto mais dias de estudo, mais você sobe:\nIniciante → Servo → Fiel → Guerreiro → ... → Teológo\n\nVeja seu progresso atual com /status\n\nConfigure também um lembrete de oração com /horariooracao`,
};

const onboardingJob = new CronJob("00 00 12 * * *", async () => {
  try {
    const now = new Date();
    const users = await UserModel.find({ dataCadastro: { $exists: true } }).lean();
    for (const user of users) {
      const diasNaPlataforma = Math.floor((now - new Date(user.dataCadastro)) / (1000 * 60 * 60 * 24));
      const tipsDiaEnviado = user.tipsDiaEnviado || [];
      for (const [dia, msg] of Object.entries(tips)) {
        const diaNum = parseInt(dia);
        if (diasNaPlataforma >= diaNum && !tipsDiaEnviado.includes(diaNum)) {
          try {
            await bot.sendMessage(user.user_id, msg, { parse_mode: "HTML" });
            await UserModel.updateOne({ user_id: user.user_id }, { $addToSet: { tipsDiaEnviado: diaNum } });
          } catch (_) {}
        }
      }
    }
  } catch (err) {
    console.error("Erro no onboardingJob:", err);
  }
}, null, true, "America/Sao_Paulo");
onboardingJob.start();

bot.on("polling_error", (error) => {
  console.error(`Erro no bot de polling: ${error}`);
});

function sendBotOnlineMessage() {
  console.log(`Peregrino iniciado com sucesso...`);
  bot.sendMessage(groupId, `#Peregrino #ONLINE\n\nBot is now playing ...`, { reply_to_message_id: 38573 });
}

function sendBotOfflineMessage() {
  console.log(`Peregrino encerrado com sucesso...`);
  bot.sendMessage(groupId, `#Peregrino #OFFLINE\n\nBot is now off ...`, { reply_to_message_id: 38573} )
    .then(() => {
      process.exit(0); // Encerra o processo do bot após enviar a mensagem offline
    })
    .catch((error) => {
      console.error("Erro ao enviar mensagem de desligamento:", error);
      process.exit(1); // Encerra o processo com um código de erro
    });
}

process.on('SIGINT', () => {
  sendBotOfflineMessage();
});

sendBotOnlineMessage();
