function planoCommand(bot, message) {
  if (message.chat.type !== "private") {
    return;
  }
  const msgplano = `<b>Sobre os planos oferecidos</b>\n\nHoje possuímos 13 planos de alta qualidade e espiritualidade para você aproveitar:\n\n<b>Seja Transformado Para Transformar (3 Dias)</b> - Experimentando o chamado de Deus e entendendo Seu propósito para nós. -> /planotransformado\n\n<b>Obtendo Sabedoria Divina (5 Dias)</b> - Descobrindo o verdadeiro significado da sabedoria divina. -> /planosabedoriadnv\n\n<b>Obtendo Novo Testamento (80 Dias)</b> - Mergulhando nas palavras de Jesus Cristo e seus seguidores ao longo de 80 dias. -> /planont\n\n<b>Orações Perigosas (7 dias)</b> - Desafiando você a orar de forma ousada e corajosa. -> /planoop\n\n<b>Bíblia para Todos (3 dias)</b> - Compreendendo a importância da Palavra de Deus e agindo contra a pobreza bíblica. -> /planobibliatd\n\n<b>Restaurando o Casamento com Base nas Escrituras (10 dias)</b> - Buscando sabedoria divina para a restauração dos laços matrimoniais. -> /planocsr\n\n<b>As 5 linguagens do amor (7 dias)</b> - Aprendendo a se comunicar e experimentar o amor plenamente. -> /planolinguagemdoamor\n\n<b>Namoro na Era Contemporânea (7 dias)</b> - Princípios fundamentais para um namoro saudável na era moderna. -> /planonamoroctmp\n\n<b>Série Apocalipse - Paulo Junior (22 Dias)</b> - Aprendendo e interpretando o livro de Apocalipse. -> /planoapocalipse\n\n<b>Namoro "Preto no Branco": Limites, Sexo e Realidade (5 dias)</b> - Orientações práticas para um namoro saudável. -> /planonamoropb\n\n<b>O Curso do Casamento (5 dias)</b> - Construindo um casamento saudável e duradouro. -> /planocasamento\n\n<b>Do Divórcio à Cura: Sobreviva e Floresça (7 dias)</b> - Encontrando cura e renovação durante tempos difíceis. -> /planodvc\n\n<b>Crescendo na Fé — Devocionais (6 dias)</b> - Reflexões diárias sobre graça, fé, paz, amor, transformação e propósito. -> /planodevocionais\n\nAproveite e use nossos planos para o seu crescimento espiritual. Caso deseje um plano novo, por favor, nos informe!`;
  bot.sendMessage(message.chat.id, msgplano, { parse_mode: "HTML" });
}

module.exports = {
  planoCommand,
};
