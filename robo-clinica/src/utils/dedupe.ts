const processados = new Map<string, number>()
const TTL_MS = 5 * 60 * 1000 // 5 minutos

/**
 * Retorna true se esse id já foi processado recentemente (webhook duplicado).
 * Se for a primeira vez, registra e retorna false.
 */
export function jaProcessado(id: string | undefined): boolean {
  if (!id) return false

  limparAntigos()

  if (processados.has(id)) return true

  processados.set(id, Date.now())
  return false
}

function limparAntigos() {
  const agora = Date.now()
  for (const [id, timestamp] of processados) {
    if (agora - timestamp > TTL_MS) processados.delete(id)
  }
}
