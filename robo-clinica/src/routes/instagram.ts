import { Router } from 'express'
import axios from 'axios'
import { z } from 'zod'
import { gerarResposta } from '../services/ia.js'
import { jaProcessado } from '../utils/dedupe.js'

export const instagramRouter = Router()

const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN
const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN

// A Meta chama essa rota UMA VEZ, na hora que você configura o webhook no
// App Dashboard, só pra confirmar que o servidor é seu.
instagramRouter.get('/webhook/instagram', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === verifyToken) {
    res.status(200).send(challenge)
  } else {
    res.sendStatus(403)
  }
})

const PayloadSchema = z
  .object({
    entry: z
      .array(
        z
          .object({
            messaging: z
              .array(
                z
                  .object({
                    sender: z.object({ id: z.string().optional() }).optional(),
                    message: z
                      .object({
                        mid: z.string().optional(),
                        text: z.string().optional(),
                        is_echo: z.boolean().optional(),
                      })
                      .optional(),
                  })
                  .passthrough()
              )
              .optional(),
          })
          .passthrough()
      )
      .optional(),
  })
  .passthrough()

// A Meta chama essa rota toda vez que chega uma DM nova
instagramRouter.post('/webhook/instagram', async (req, res) => {
  try {
    const parsed = PayloadSchema.safeParse(req.body)
    if (!parsed.success) {
      console.warn('Payload do Instagram em formato inesperado, ignorando.')
      return res.sendStatus(200)
    }

    const evento = parsed.data.entry?.[0]?.messaging?.[0]
    const remetente = evento?.sender?.id
    const texto = evento?.message?.text
    const messageId = evento?.message?.mid

    if (!remetente || !texto || evento?.message?.is_echo || jaProcessado(messageId)) {
      return res.sendStatus(200)
    }

    const resposta = await gerarResposta(texto)

    await axios.post(
      `https://graph.instagram.com/v21.0/me/messages?access_token=${accessToken}`,
      { recipient: { id: remetente }, message: { text: resposta } }
    )

    res.sendStatus(200)
  } catch (erro) {
    console.error('Erro no webhook do Instagram:', erro)
    res.sendStatus(200)
  }
})
