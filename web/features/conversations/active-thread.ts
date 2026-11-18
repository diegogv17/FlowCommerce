// Registro de los chats abiertos en pantalla (ChatThread montado). El puente
// de tiempo real lo consulta para NO mostrar un toast de "nuevo mensaje" si el
// usuario ya está viendo esa conversación.
const openThreads = new Map<string, number>();

/** Marca el chat como abierto; devuelve la función para desmarcarlo. */
export function registerOpenThread(leadId: string): () => void {
  openThreads.set(leadId, (openThreads.get(leadId) ?? 0) + 1);
  return () => {
    const count = (openThreads.get(leadId) ?? 1) - 1;
    if (count <= 0) openThreads.delete(leadId);
    else openThreads.set(leadId, count);
  };
}

export function isThreadOpen(leadId: string): boolean {
  return (
    openThreads.has(leadId) &&
    (typeof document === 'undefined' || document.visibilityState === 'visible')
  );
}
