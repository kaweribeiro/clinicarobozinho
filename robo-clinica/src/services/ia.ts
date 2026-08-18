import Anthropic from '@anthropic-ai/sdk'
import { montarBaseDeConhecimento, mensagemEncaminharHumano } from './baseDeConhecimento.js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const numeroHumano = process.env.NUMERO_ATENDENTE_HUMANO ?? ''

const MARCADOR_ENCAMINHAR = '[ENCAMINHAR_HUMANO]'

function montarSystemPrompt(baseDeConhecimento: string): string {
  return `
Você é o atendente virtual de uma clínica de estética, respondendo pelo WhatsApp e Instagram.

Responda SOMENTE com base nestas informações:
---
${baseDeConhecimento}
---

Regras:
- Seja breve, simpático e direto (isso é um chat, não um e-mail).
- Se a pergunta puder ser respondida com as informações acima, responda normalmente.
- Se a pergunta for sobre reclamação, emergência, pedido de agendamento específico,
  ou QUALQUER coisa que não esteja nas informações acima, responda EXATAMENTE
  com o texto "${MARCADOR_ENCAMINHAR}" e nada mais — o sistema cuida do resto.
- Nunca invente preço, horário ou informação que não esteja listada acima.
`.trim()
}

export async function gerarResposta(pergunta: string): Promise<string> {
  const baseDeConhecimento = await montarBaseDeConhecimento()

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    system: montarSystemPrompt(baseDeConhecimento),
    messages: [{ role: 'user', content: pergunta }],
  })

  const texto = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''

  if (texto.includes(MARCADOR_ENCAMINHAR) || texto.length === 0) {
    return mensagemEncaminharHumano(numeroHumano)
  }

  return texto
}
