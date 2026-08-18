import 'dotenv/config'
import express from 'express'
import { whatsappRouter } from './routes/whatsapp.js'
import { instagramRouter } from './routes/instagram.js'

const app = express()
app.use(express.json())

app.use(whatsappRouter)
app.use(instagramRouter)

app.get('/', (_req, res) => {
  res.send('Robô da clínica está no ar.')
})

const port = process.env.PORT ?? 3333
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`)
})
