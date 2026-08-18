import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.clinicaConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nome: '[nome da clínica]',
      endereco: '[endereço completo]',
      horario: '[ex: seg a sex 9h às 19h, sáb 9h às 13h]',
      pagamento: '[pix, cartão em até Nx, dinheiro...]',
      cancelamento: '[ex: cancelar com 24h de antecedência]',
    },
  })

  const jaTemPacotes = await prisma.pacote.count()
  if (jaTemPacotes === 0) {
    await prisma.pacote.createMany({
      data: [
        { nome: '[nome do pacote 1]', valor: '[valor]', descricao: '[o que inclui, quantas sessões]' },
        { nome: '[nome do pacote 2]', valor: '[valor]', descricao: '[o que inclui, quantas sessões]' },
      ],
    })
  }

  console.log('Seed concluído. Rode "npm run studio" para editar com os dados reais da clínica.')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erro) => {
    console.error(erro)
    await prisma.$disconnect()
    process.exit(1)
  })
