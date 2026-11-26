import { expect, test } from '@playwright/test'
import { installFakeBackend, textChunks, type StreamChunk } from './support/fake-backend'

const step = (chunks: StreamChunk[]): StreamChunk[] => [{ type: 'start-step' }, ...chunks, { type: 'finish-step' }]

const FOLLOW_UP_INPUT = {
  leadId: '33333333-3333-4333-8333-333333333333',
  tipo: 'CALL',
  titulo: 'Llamar a Ana para confirmar licencias',
  fecha: '2099-03-15',
  hora: '10:30',
  notas: null,
}

/** Primer turno de la aprobación: el modelo pide crear_seguimiento y el SDK solicita aprobación. */
const approvalRequest = (): StreamChunk[] => [
  { type: 'start', messageId: 'a-1' },
  ...step([
    { type: 'tool-input-available', toolCallId: 'call-fu', toolName: 'crear_seguimiento', input: FOLLOW_UP_INPUT },
    { type: 'tool-approval-request', approvalId: 'ap-1', toolCallId: 'call-fu', signature: 'firma-hmac-del-servidor' },
  ]),
  { type: 'finish' },
]

test.describe('Asistente de IA', () => {
  test('responde en streaming usando una herramienta del CRM, sin exponer la clave de Gemini', async ({ page }) => {
    // Preparar
    const backend = await installFakeBackend(page, () => [
      { type: 'start', messageId: 'a-1' },
      ...step([
        { type: 'tool-input-available', toolCallId: 'call-1', toolName: 'seguimientos_pendientes', input: { soloVencidos: true } },
        { type: 'tool-output-available', toolCallId: 'call-1', output: { total: 2, seguimientos: [] } },
      ]),
      ...step(textChunks('t-1', 'Tienes **2 seguimientos vencidos**:\n- Llamar a Ana López\n- Enviar propuesta a Grupo Sol')),
      { type: 'finish' },
    ])
    await page.goto('/asistente')

    // Actuar
    await page.getByRole('button', { name: '¿Qué seguimientos tengo vencidos?' }).click()

    // Comprobar: la respuesta llega al log del chat con su formato.
    const log = page.getByRole('log', { name: 'Conversación con el asistente' })
    await expect(log.getByText('Revisó seguimientos')).toBeVisible()
    await expect(log.locator('strong', { hasText: '2 seguimientos vencidos' })).toBeVisible()
    await expect(log.getByRole('listitem')).toHaveText(['Llamar a Ana López', 'Enviar propuesta a Grupo Sol'])

    // Comprobar: el navegador solo habló con NUESTRA API, con el token de la sesión.
    expect(backend.chatBodies[0].messages.at(-1)).toMatchObject({
      role: 'user',
      parts: [{ type: 'text', text: '¿Qué seguimientos tengo vencidos?' }],
    })
    expect(backend.authHeaders).toContain('Bearer e2e-access-token')
    expect([...backend.externalHosts].some((host) => host.includes('googleapis'))).toBe(false)
  })

  test('programa un seguimiento solo después de que el usuario lo aprueba', async ({ page }) => {
    // Preparar
    const backend = await installFakeBackend(page, (n) =>
      n === 0
        ? approvalRequest()
        : [
            { type: 'start', messageId: 'a-1' },
            ...step([{ type: 'tool-output-available', toolCallId: 'call-fu', output: { creado: true } }]),
            ...step(textChunks('t-2', 'Listo: programé la llamada con Ana para el 15 de marzo a las 10:30.')),
            { type: 'finish' },
          ],
    )
    await page.goto('/asistente')
    const input = page.getByRole('textbox', { name: 'Mensaje para el asistente' })

    // Actuar: pedir la acción.
    await input.fill('Agenda una llamada con Ana el 15 de marzo a las 10:30')
    await input.press('Enter')

    // Comprobar: aparece la tarjeta y NO se ha reenviado nada todavía.
    const card = page.getByRole('group', { name: 'Aprobar seguimiento' })
    await expect(card).toContainText('Llamada')
    await expect(card).toContainText('Llamar a Ana para confirmar licencias')
    await expect(card).toContainText('2099-03-15 a las 10:30')
    expect(backend.chatBodies).toHaveLength(1)

    // Actuar: aprobar.
    await card.getByRole('button', { name: 'Programar seguimiento' }).click()

    // Comprobar: el chat reenvía solo la aprobación (firmada) y muestra el resultado.
    await expect(page.getByText('Listo: programé la llamada con Ana')).toBeVisible()
    await expect(page.getByText('Seguimiento programado')).toBeVisible()
    await expect(card).toBeHidden()
    expect(backend.chatBodies).toHaveLength(2)
    const toolPart = backend.chatBodies[1].messages.at(-1)?.parts.find((p: { type: string }) => p.type === 'tool-crear_seguimiento')
    expect(toolPart).toMatchObject({
      state: 'approval-responded',
      approval: { id: 'ap-1', approved: true, signature: 'firma-hmac-del-servidor' },
    })
  })

  test('al descartar, informa que no se guardó nada', async ({ page }) => {
    // Preparar
    const backend = await installFakeBackend(page, (n) =>
      n === 0
        ? approvalRequest()
        : [
            { type: 'start', messageId: 'a-1' },
            ...step([{ type: 'tool-output-denied', toolCallId: 'call-fu' }]),
            ...step(textChunks('t-3', 'Entendido, no programé nada.')),
            { type: 'finish' },
          ],
    )
    await page.goto('/asistente')
    const input = page.getByRole('textbox', { name: 'Mensaje para el asistente' })
    await input.fill('Agenda una llamada con Ana')
    await input.press('Enter')

    // Actuar
    await page.getByRole('group', { name: 'Aprobar seguimiento' }).getByRole('button', { name: 'Descartar' }).click()

    // Comprobar
    await expect(page.getByText('Seguimiento descartado: no se guardó nada.')).toBeVisible()
    await expect(page.getByText('Entendido, no programé nada.')).toBeVisible()
    const toolPart = backend.chatBodies[1].messages.at(-1)?.parts.find((p: { type: string }) => p.type === 'tool-crear_seguimiento')
    expect(toolPart).toMatchObject({ approval: { approved: false } })
  })
})
