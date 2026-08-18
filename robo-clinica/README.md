# Robô de atendimento — clínica de estética

Esqueleto pronto pra rodar: WhatsApp (Evolution API) + Instagram (Meta Graph API)
+ IA (Claude) + dados da clínica num banquinho (SQLite/Prisma) que dá pra editar
sem mexer em código.

Guia visual completo (passo a passo com prints/design) está no arquivo
`guia-de-uso.html` que veio junto — abra ele no navegador. Este README é a
versão em texto puro, pra quem preferir.

## 0. Antes de rodar

```bash
cp .env.example .env
```

Abra o `.env` e preencha:
- `ANTHROPIC_API_KEY` — console.anthropic.com
- `EVOLUTION_API_KEY` — invente uma chave qualquer, só precisa ser a mesma nos dois lugares
- `NUMERO_ATENDENTE_HUMANO` — número que recebe o cliente quando o bot não sabe responder

## 1. Instalar e preparar o banco (local, fora do Docker, pra testar rápido)

```bash
npm install
npm run migrate    # cria a tabela no banco
npm run seed        # popula com dados de exemplo (placeholders)
npm run studio       # abre uma telinha no navegador pra editar
```

No Prisma Studio, edite `ClinicaConfig` (nome, endereço, horário, pagamento,
cancelamento) e `Pacote` (adicione um registro pra cada pacote/serviço real).
**É só isso que muda quando o cliente pedir pra ajustar preço ou horário** —
não precisa editar código nem fazer deploy de novo.

## 2. Subir tudo (Evolution API + backend) via Docker

```bash
docker compose up -d --build
```

Na primeira vez, rode a migração e o seed também dentro do container:

```bash
docker compose exec backend npm run migrate:deploy
docker compose exec backend npm run seed
```

## 3. Conectar o WhatsApp

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: SUA_EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"clinica","qrcode":true}'
```

Isso devolve um QR code (base64) — ou veja de novo em
`GET /instance/connect/clinica`. Escaneie com o WhatsApp (Aparelhos conectados
→ Conectar um aparelho) usando **um número de teste primeiro**.

Configure o webhook da instância:

```bash
curl -X POST http://localhost:8080/webhook/set/clinica \
  -H "apikey: SUA_EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://backend:3333/webhook/whatsapp","webhook_by_events":false}'
```

Mande uma mensagem de teste. Se aparecer no log (`docker compose logs -f backend`)
e você receber resposta, está funcionando.

## 4. Conectar o Instagram

1. Confirme que a conta é Business/Creator e está vinculada a uma Página do Facebook.
2. Crie um app em developers.facebook.com, adicione o produto "Instagram".
3. Adicione a conta da clínica como **tester** (Funções → Testadores do Instagram)
   — assim não precisa de revisão completa da Meta pra atender só esse cliente.
4. Configure o webhook apontando pra `https://SEU_DOMINIO/webhook/instagram`,
   com o mesmo valor de `INSTAGRAM_VERIFY_TOKEN` do `.env`.
5. Gere o `INSTAGRAM_ACCESS_TOKEN` da página vinculada e cole no `.env`.

Precisa de HTTPS público — em teste local, use `ngrok http 3333`.

## 5. Deploy em produção

No VPS: clone o projeto, `cp .env.example .env` com os dados reais,
`docker compose up -d --build`, configure domínio + HTTPS (Caddy resolve
automaticamente) apontando pra porta 3333, e repita os passos 3 e 4 com o
número/conta REAIS da clínica.

## Estrutura

```
prisma/
  schema.prisma          → estrutura do banco (config da clínica + pacotes)
  seed.ts                  → popula o banco na primeira vez
src/
  server.ts                → sobe o Express, registra as rotas
  routes/whatsapp.ts        → recebe mensagem do WhatsApp, valida, chama a IA, responde
  routes/instagram.ts       → mesma coisa, pro Instagram
  services/ia.ts             → monta o prompt e chama a Claude API
  services/evolution.ts       → manda mensagem de volta pela Evolution API
  services/baseDeConhecimento.ts → busca os dados da clínica no banco
  utils/dedupe.ts               → evita responder a mesma mensagem duas vezes
```
