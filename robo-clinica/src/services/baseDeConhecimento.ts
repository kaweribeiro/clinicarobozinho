import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function montarBaseDeConhecimento(): Promise<string> {
  const config = await prisma.clinicaConfig.findUnique({ where: { id: 1 } })
  const pacotes = await prisma.pacote.findMany()

  if (!config) {
    throw new Error(
      'Configuração da clínica não encontrada. Rode "npm run seed" e depois ' +
      'edite os dados reais com "npm run studio".'
    )
  }

  const listaPacotes = pacotes.length
    ? pacotes.map((p) => `- ${p.nome}: R$ ${p.valor} — ${p.descricao}`).join('\n')
    : '(nenhum pacote cadastrado ainda)'

  return `
CLÍNICA: ${config.nome}
ENDEREÇO: ${config.endereco}
HORÁRIO DE FUNCIONAMENTO: ${config.horario}

PACOTES E VALORES:
${listaPacotes}

FORMAS DE PAGAMENTO: ${config.pagamento}
POLÍTICA DE CANCELAMENTO: ${config.cancelamento}
`.trim()
}

export function mensagemEncaminharHumano(numeroHumano: string): string {
  return (
    'Essa pergunta eu prefiro que um dos nossos atendentes responda direitinho! ' +
    `Chama a gente por aqui: wa.me/${numeroHumano}`
  )
}
