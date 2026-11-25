import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RichText from '@/components/RichText.vue'
import { parseInline, parseMarkdown } from '../markdown'

// A backend `tests/Unit/MarkdownTest.php` ugyanezeket az eseteket várja: az előnézet és a publikált oldal azonos.
const cases: [name: string, source: string, html: string][] = [
  ['üres', '', ''],
  ['csak szóköz', '   ', ''],
  ['sima szöveg', 'Szia', '<p>Szia</p>'],
  ['sortörés', 'Első\nMásodik', '<p>Első<br>Második</p>'],
  ['Windows sorvég', 'Első\r\nMásodik', '<p>Első<br>Második</p>'],
  ['bekezdések', 'Első\n\nMásodik', '<p>Első</p><p>Második</p>'],
  ['félkövér és dőlt', '**fontos** és *dőlt*', '<p><strong>fontos</strong> és <em>dőlt</em></p>'],
  [
    'dőlt a félkövérben',
    '**félkövér *dőlt* belül**',
    '<p><strong>félkövér <em>dőlt</em> belül</strong></p>',
  ],
  ['felsorolás kötőjellel', '- egy\n- kettő', '<ul><li>egy</li><li>kettő</li></ul>'],
  ['felsorolás csillaggal', '* egy\n* kettő', '<ul><li>egy</li><li>kettő</li></ul>'],
  ['számozott lista', '1. egy\n2. kettő', '<ol><li>egy</li><li>kettő</li></ol>'],
  [
    'lista a bekezdések között',
    'Bevezető\n- egy\n- kettő\nZáró',
    '<p>Bevezető</p><ul><li>egy</li><li>kettő</li></ul><p>Záró</p>',
  ],
  [
    'számozott és felsorolás egymás után',
    '1. egy\n- kettő',
    '<ol><li>egy</li></ol><ul><li>kettő</li></ul>',
  ],
  [
    'formázás a listában',
    '* **félkövér** elem',
    '<ul><li><strong>félkövér</strong> elem</li></ul>',
  ],
  [
    'külső hivatkozás',
    '[példa](https://example.com/?a=1&b=2)',
    '<p><a href="https://example.com/?a=1&amp;b=2" rel="noopener noreferrer">példa</a></p>',
  ],
  [
    'belső hivatkozás',
    '[oldal](/helyi/oldal)',
    '<p><a href="/helyi/oldal" rel="noopener noreferrer">oldal</a></p>',
  ],
  [
    'horgony',
    'Lásd [itt](#rész).',
    '<p>Lásd <a href="#rész" rel="noopener noreferrer">itt</a>.</p>',
  ],
  ['veszélyes protokoll', '[rossz](javascript:alert(1))', '<p>[rossz](javascript:alert(1))</p>'],
  ['data URL', '[rossz](data:text/html,x)', '<p>[rossz](data:text/html,x)</p>'],
  ['protokollfüggetlen cím', '[rossz](//example.com)', '<p>[rossz](//example.com)</p>'],
  ['lezáratlan jelek', '**nincs lezárva és *sem', '<p>**nincs lezárva és *sem</p>'],
  ['csak jelek', '**', '<p>**</p>'],
  ['négy csillag', '****', '<p>****</p>'],
  ['szóközzel határolt csillag', '2 * 3 * 4', '<p>2 * 3 * 4</p>'],
  ['üres felirat', '[](https://example.com)', '<p>[](https://example.com)</p>'],
  [
    'nyers HTML escape-elve',
    '<script>alert(1)</script> **x**',
    '<p>&lt;script&gt;alert(1)&lt;/script&gt; <strong>x</strong></p>',
  ],
  [
    'HTML a felirat helyén',
    '[<b>x</b>](/a)',
    '<p><a href="/a" rel="noopener noreferrer">&lt;b&gt;x&lt;/b&gt;</a></p>',
  ],
  [
    'ékezetes szöveg',
    '*árvíztűrő* **tükörfúrógép**',
    '<p><em>árvíztűrő</em> <strong>tükörfúrógép</strong></p>',
  ],
]

const render = (source: string): string =>
  mount(
    {
      components: { RichText },
      props: ['source'],
      template: '<div><RichText :source="source" /></div>',
    },
    { props: { source } },
  ).element.innerHTML

describe('markdown', () => {
  it.each(cases)('%s: a várt HTML-t építi a megjelenítés', (_name, source, html) => {
    expect(render(source)).toBe(html)
  })

  it('a leíró fa csak ismert csomóponttípusokat tartalmaz', () => {
    const blocks = parseMarkdown('**a** *b* [c](/d)\n- e\n1. f')

    expect(blocks.map((b) => b.type)).toEqual(['p', 'ul', 'ol'])
    expect(parseInline('**a** [b](/c)')).toEqual([
      { type: 'strong', children: ['a'] },
      ' ',
      { type: 'a', href: '/c', label: 'b' },
    ])
  })

  it('a hivatkozás az előnézetben nem navigál', async () => {
    const wrapper = mount(RichText, { props: { source: '[x](https://example.com)' } })
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })

    wrapper.find('a').element.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('nagyon hosszú, hibás bemenetre is véges időben lefut', () => {
    const source = '*a [b]('.repeat(2500) + '\n- '.repeat(500)
    const start = performance.now()

    parseMarkdown(source)

    expect(performance.now() - start).toBeLessThan(2000)
  })
})
