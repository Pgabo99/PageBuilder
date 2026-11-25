import { SAFE_URL } from '@/utils/components'

// A formázott szöveg (`text` komponens, `format: markdown`) kis Markdown-részhalmaza: bekezdés (üres sor),
// sortörés, **félkövér**, *dőlt*, felsorolás (`- ` vagy `* `), számozott lista (`1. `) és [hivatkozás](cím).
// A backend `Markdown.php`-ja ugyanezt a nyelvtant valósítja meg; a két oldal tesztje azonos eseteket vár.
// Az eredmény leíró fa (nem HTML), így a megjelenítés `v-html` nélkül történik.

export type Inline =
  | string
  | { type: 'strong' | 'em'; children: Inline[] }
  | { type: 'a'; href: string; label: string }
  | { type: 'br' }

export type Block = { type: 'p'; inline: Inline[] } | { type: 'ul' | 'ol'; items: Inline[][] }

/** Soron belüli elemek: félkövér, dőlt, hivatkozás; a lezáratlan jel szövegként marad. */
export function parseInline(s: string): Inline[] {
  const out: Inline[] = []
  let buffer = ''
  const flush = (): void => {
    if (buffer !== '') {
      out.push(buffer)
      buffer = ''
    }
  }

  for (let i = 0; i < s.length;) {
    const char = s[i]!

    if (char === '*' && s[i + 1] === '*') {
      const end = s.indexOf('**', i + 2)
      if (end !== -1 && end > i + 2) {
        flush()
        out.push({ type: 'strong', children: parseInline(s.slice(i + 2, end)) })
        i = end + 2
        continue
      }
    } else if (char === '*') {
      const end = s.indexOf('*', i + 1)
      if (end !== -1 && end > i + 1) {
        const content = s.slice(i + 1, end)
        const edges = [content[0], content[content.length - 1]]
        if (!edges.some((edge) => edge === ' ' || edge === '\t')) {
          flush()
          out.push({ type: 'em', children: parseInline(content) })
          i = end + 1
          continue
        }
      }
    } else if (char === '[') {
      const labelEnd = s.indexOf(']', i + 1)
      if (labelEnd !== -1 && labelEnd > i + 1 && s[labelEnd + 1] === '(') {
        const close = s.indexOf(')', labelEnd + 2)
        if (close !== -1) {
          const url = s.slice(labelEnd + 2, close)
          if (SAFE_URL.test(url)) {
            flush()
            out.push({ type: 'a', href: url, label: s.slice(i + 1, labelEnd) })
            i = close + 1
            continue
          }
        }
      }
    }

    buffer += char
    i++
  }
  flush()

  return out
}

/** Blokkokra bontás: bekezdés (`inline`), felsorolás vagy számozott lista (`items`). */
export function parseMarkdown(source: string): Block[] {
  type Open = { type: 'p'; lines: string[] } | { type: 'ul' | 'ol'; items: Inline[][] }
  const blocks: Block[] = []
  let current: Open | null = null

  const flush = (): void => {
    if (current === null) return
    if (current.type === 'p') {
      const inline: Inline[] = []
      current.lines.forEach((line, index) => {
        if (index > 0) inline.push({ type: 'br' })
        inline.push(...parseInline(line))
      })
      blocks.push({ type: 'p', inline })
    } else {
      blocks.push(current)
    }
    current = null
  }

  for (const line of source.replace(/\r\n/g, '\n').split('\n')) {
    if (line.trim() === '') {
      flush()
      continue
    }

    let type: 'p' | 'ul' | 'ol' = 'p'
    let text = line
    const unordered = /^[-*] (.*)$/.exec(line)
    const ordered = /^\d+\. (.*)$/.exec(line)
    if (unordered) {
      type = 'ul'
      text = unordered[1]!
    } else if (ordered) {
      type = 'ol'
      text = ordered[1]!
    }

    if (current === null || current.type !== type) {
      flush()
      current = type === 'p' ? { type: 'p', lines: [] } : { type, items: [] }
    }

    if (current.type === 'p') current.lines.push(text)
    else current.items.push(parseInline(text))
  }
  flush()

  return blocks
}
