import { Fragment, type ReactNode } from 'react'

/** **negritas** dentro de una línea, sin HTML: el texto viene del modelo. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
    chunk.startsWith('**') && chunk.endsWith('**') && chunk.length > 4 ? (
      <strong key={i} className="font-semibold text-navy-900">
        {chunk.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{chunk}</Fragment>
    ),
  )
}

/**
 * Formato mínimo del texto del asistente: párrafos, viñetas ("- " o "* ") y
 * negritas. Se arma con elementos de React, nunca con innerHTML.
 */
export function AssistantText({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  let bullets: string[] = []
  const flush = () => {
    if (bullets.length === 0) return
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-1 list-disc space-y-0.5 pl-5">
        {bullets.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    )
    bullets = []
  }
  for (const line of text.split('\n')) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line)
    if (bullet) {
      bullets.push(bullet[1])
      continue
    }
    flush()
    if (line.trim()) blocks.push(<p key={`p-${blocks.length}`}>{inline(line)}</p>)
  }
  flush()
  return <div className="space-y-1.5 leading-relaxed">{blocks}</div>
}
