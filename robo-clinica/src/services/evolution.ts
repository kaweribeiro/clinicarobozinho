import axios from 'axios'

const baseURL = process.env.EVOLUTION_API_URL
const apiKey = process.env.EVOLUTION_API_KEY
const instance = process.env.EVOLUTION_INSTANCE

export async function enviarMensagemWhatsApp(numero: string, texto: string) {
  await axios.post(
    `${baseURL}/message/sendText/${instance}`,
    { number: numero, text: texto },
    { headers: { apikey: apiKey } }
  )
}
