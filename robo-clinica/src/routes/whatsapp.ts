import { Router } from 'express'
import { z } from 'zod'
import { gerarResposta } from '../services/ia.js'
import { enviarMensagemWhatsApp } from '../services/evolution.js'
import { jaProcessado } from '../utils/dedupe.js'

export const whatsappRouter = Router()

// Validação leve: só garante que os campos que a gente USA vieram no formato certo.
// O payload real da Evolution API tem muito mais coisa, não precisamos tipar tudo.
const PayloadSchema = z
  .object({
    data: z
      .object({
        key: z
          .object({
            id: z.string().optional(),
            remoteJid: z.string().optional(),
            fromMe: z.boolean().optional(),
          })
          .optional(),
        message: z
          .object({
            conversation: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough()

whatsappRouter.post('/webhook/whatsapp', async (req, res) => {
  try {
    const parsed = PayloadSchema.safeParse(req.body)
    if (!parsed.success) {
      console.warn('Payload do WhatsApp em formato inesperado, ignorando.')
      return res.sendStatus(200)
    }

    const { data } = parsed.data
    const messageId = data?.key?.id
    const numero = data?.key?.remoteJid
    const texto = data?.message?.conversation
    const ehDoProprioBot = data?.key?.fromMe

    // ignora: sem número/texto, mensagem do próprio bot, grupo, ou webhook duplicado
    if (!numero || !texto || ehDoProprioBot || numero.includes('@g.us') || jaProcessado(messageId)) {
      return res.sendStatus(200)
    }

    const resposta = await gerarResposta(texto)
    await enviarMensagemWhatsApp(numero, resposta)

    res.sendStatus(200)
  } catch (erro) {
    console.error('Erro no webhook do WhatsApp:', erro)
    res.sendStatus(200) // responde 200 mesmo em erro, senão a Evolution API fica reenviando
  }
})
