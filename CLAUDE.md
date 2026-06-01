# CLAUDE.md — Bot Telegram (Versículos, Hinário, Planos de Leitura)

## Visão Geral do Projeto

Bot Telegram em nodejs que envia versículos bíblicos com imagens, hinos adventistas com suas histórias, e planos de leitura bíblica. As imagens locais são convertidas em URLs públicas via APIs de hospedagem de imagem antes do envio.

---

## Estrutura de Diretórios
src/ ├── verses/ │ └── versiculoscanal/ # JSONs de versículos com imagens e links ├── image/ # Imagens locais a serem convertidas em URL ├── hinario/ # JSONs do hinário adventista (com histórias) └── plans/ # JSONs dos planos de leitura bíblica

---

## APIs de Upload de Imagem

Use uma das duas APIs para converter imagens locais em URLs públicas.

### Opção 1 — imgbb (preferida)
- **Endpoint:** `POST https://api.imgbb.com/1/upload`
- **Parâmetros:**
  - `key` → sua API key
  - `image` → arquivo binário, base64 ou URL
  - `name` → nome extraído do arquivo de imagem (sem extensão)
  - `expiration` → opcional (segundos)
- **Resposta:** `data.url` contém a URL pública da imagem

### Opção 2 — freeimage.host (fallback)
- **Endpoint:** `GET/POST http://freeimage.host/api/1/upload/`
- **Parâmetros:**
  - `key` → sua API key
  - `source` → URL ou base64 da imagem
  - `format` → `json`
- **Resposta:** `image.url` contém a URL pública

### Regras de Upload
- Sempre use POST para arquivos locais
- Extraia o `name` do nome do arquivo de imagem (sem extensão)
- Salve `url_link` no JSON correspondente em `src/verses/versiculoscanal/`
- Salve também em `src/image/` se necessário
- Nunca reenvie imagens já convertidas (verifique se `url_link` já existe no JSON)

---

## src/verses/versiculoscanal

### Estrutura esperada de cada JSON:

json
Copiar

{
  "nome": "Nome extraído do arquivo de imagem",
  "url_link": "https://i.ibb.co/xxx/nome.jpg",
  "versiculo": "Texto do versículo",
  "referencia": "João 3:16"
}




### Tarefa:
1. Para cada imagem em `src/image/`, fazer upload via imgbb ou freeimage.host
2. Extrair o nome do arquivo como campo `nome`
3. Salvar a URL retornada como `url_link` no JSON correspondente
4. Garantir que o envio via Telegram use `send_photo` com a `url_link`

---

## src/hinario

### Estrutura dos JSONs existentes:
Observe todos os arquivos JSON dentro de `src/hinario/` e mantenha o padrão já existente.

### Tarefa — Adicionar histórias dos hinos:
1. Acessar: `https://musicaeadoracao.com.br/hinologia/historias-de-hinos/`
2. Para cada hino listado no JSON, buscar a história correspondente no site
3. Adicionar o campo `historia` no JSON de cada hino
4. **Limite de caracteres Telegram:** mensagens de texto têm limite de **4096 caracteres**
   - Se a história ultrapassar, dividir em múltiplas mensagens sequenciais
   - Ou truncar com reticências e link para o site completo

### Exemplo de estrutura após atualização:

json
Copiar

{
  "numero": 1,
  "titulo": "Santo! Santo! Santo!",
  "letra": "...",
  "historia": "História do hino aqui, respeitando 4096 chars..."
}




---

## src/plans

### Tarefa — Importar planos de leitura:
1. Acessar: `https://www.bible.com/pt/reading-plans`
2. Observar o padrão dos JSONs já existentes em `src/plans/`
3. Para cada plano disponível no site, adicionar/atualizar o JSON seguindo o padrão já implementado
4. Campos típicos esperados: `titulo`, `descricao`, `dias`, `conteudo_por_dia`
5. Respeitar limite de 4096 caracteres por mensagem Telegram

---

## Funções de Envio Telegram

### send_photo com URL
Use **sempre** a `url_link` (URL pública) para enviar fotos, nunca o caminho local:


nodejs

Copiar

# CORRETO
await bot.send_photo(chat_id=chat_id, photo=url_link, caption=caption)

# ERRADO — não usar path local
await bot.send_photo(chat_id=chat_id, photo=open("src/image/foto.jpg", "rb"))




### Regras de envio:
- `send_photo`: usar `url_link` do JSON
- `send_message`: respeitar 4096 chars; dividir se necessário
- Sempre incluir `parse_mode="HTML"` ou `"Markdown"` quando usar formatação

---

## Revisão Geral e Testes

### Verificar e corrigir:
1. Todas as chamadas `send_photo` usam URL pública (não arquivo local)
2. JSONs de versículos têm `url_link` preenchido
3. JSONs de hinos têm campo `historia` adicionado
4. JSONs de planos seguem o padrão existente
5. Nenhuma mensagem ultrapassa 4096 caracteres sem ser dividida
6. Upload de imagem não repete imagens já enviadas (idempotência)
7. Fallback para freeimage.host se imgbb falhar

### Implementar testes:
- Teste de upload de imagem (mock da API imgbb)
- Teste de leitura dos JSONs de versículos, hinário e planos
- Teste de função de divisão de mensagens longas
- Teste de `send_photo` com URL válida
- Teste de fallback entre APIs de imagem

---

## Variáveis de Ambiente (.env)
TELEGRAM_BOT_TOKEN=… IMGBB_API_KEY=… FREEIMAGE_API_KEY=…

---

## Observações Importantes

- **Nunca commitar** API keys ou tokens no código

- Usar `httpx` ou `aiohttp` para chamadas assíncronas às APIs externas
- Logs devem registrar sucesso/falha de cada upload e envio
- Ao fazer scraping do site de hinos e planos, respeitar `robots.txt` e adicionar delay entre requisições (`asyncio.sleep(1)`)
Esse 
