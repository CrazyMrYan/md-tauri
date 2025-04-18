import type { ExtendedProperties, IOpts, ThemeStyles } from '@/types'
import type { PropertiesHyphen } from 'csstype'
import type { Renderer, RendererObject, Tokens } from 'marked'
import type { ReadTimeResults } from 'reading-time'
import { cloneDeep, toMerged } from 'es-toolkit'
import frontMatter from 'front-matter'

import hljs from 'highlight.js'
import { marked } from 'marked'
import mermaid from 'mermaid'
import readingTime from 'reading-time'
import { URL } from 'url'

import { getStyleString } from '.'
import markedAlert from './MDAlert'

import { MDKatex } from './MDKatex'

marked.setOptions({
  breaks: true,
})
marked.use(MDKatex({ nonStandard: true }))

function buildTheme({ theme: _theme, fonts, size, isUseIndent }: IOpts): ThemeStyles {
  const theme = cloneDeep(_theme)
  const base = toMerged(theme.base, {
    'font-family': fonts,
    'font-size': size,
  })

  if (isUseIndent) {
    theme.block.p = {
      'text-indent': `2em`,
      ...theme.block.p,
    }
  }

  const mergeStyles = (styles: Record<string, PropertiesHyphen>): Record<string, ExtendedProperties> =>
    Object.fromEntries(
      Object.entries(styles).map(([ele, style]) => [ele, toMerged(base, style)]),
    )
  return {
    ...mergeStyles(theme.inline),
    ...mergeStyles(theme.block),
  } as ThemeStyles
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, `&amp;`) // 转义 &
    .replace(/</g, `&lt;`) // 转义 <
    .replace(/>/g, `&gt;`) // 转义 >
    .replace(/"/g, `&quot;`) // 转义 "
    .replace(/'/g, `&#39;`) // 转义 '
    .replace(/`/g, `&#96;`) // 转义 `
}

function buildAddition(): string {
  return `
    <style>
      .preview-wrapper pre::before {
        position: absolute;
        top: 0;
        right: 0;
        color: #ccc;
        text-align: center;
        font-size: 0.8em;
        padding: 5px 10px 0;
        line-height: 15px;
        height: 15px;
        font-weight: 600;
      }
    </style>
  `
}

function getStyles(styleMapping: ThemeStyles, tokenName: string, addition: string = ``): string {
  const dict = styleMapping[tokenName as keyof ThemeStyles]
  if (!dict) {
    return ``
  }
  const styles = getStyleString(dict)
  return `style="${styles}${addition}"`
}

function buildFootnoteArray(footnotes: [number, string, string][]): string {
  return footnotes
    .map(([index, title, link]) =>
      link === title
        ? `<code style="font-size: 90%; opacity: 0.6;">[${index}]</code>: <i style="word-break: break-all">${title}</i><br/>`
        : `<code style="font-size: 90%; opacity: 0.6;">[${index}]</code> ${title}: <i style="word-break: break-all">${link}</i><br/>`,
    )
    .join(`\n`)
}

function transform(legend: string, text: string | null, title: string | null): string {
  const options = legend.split(`-`)
  for (const option of options) {
    if (option === `alt` && text) {
      return text
    }
    if (option === `title` && title) {
      return title
    }
  }
  return ``
}

const macCodeSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" width="45px" height="13px" viewBox="0 0 450 130">
    <ellipse cx="50" cy="65" rx="50" ry="52" stroke="rgb(220,60,54)" stroke-width="2" fill="rgb(237,108,96)" />
    <ellipse cx="225" cy="65" rx="50" ry="52" stroke="rgb(218,151,33)" stroke-width="2" fill="rgb(247,193,81)" />
    <ellipse cx="400" cy="65" rx="50" ry="52" stroke="rgb(27,161,37)" stroke-width="2" fill="rgb(100,200,86)" />
  </svg>
`.trim()

interface ParseResult {
  yamlData: Record<string, any>
  markdownContent: string
  readingTime: ReadTimeResults
}

function parseFrontMatterAndContent(markdownText: string): ParseResult {
  try {
    const parsed = frontMatter(markdownText)
    const yamlData = parsed.attributes
    const markdownContent = parsed.body

    const readingTimeResult = readingTime(markdownContent)

    return {
      yamlData: yamlData as Record<string, any>,
      markdownContent,
      readingTime: readingTimeResult,
    }
  }
  catch (error) {
    console.error(`Error parsing front-matter:`, error)
    return {
      yamlData: {},
      markdownContent: markdownText,
      readingTime: readingTime(markdownText),
    }
  }
}

export function initRenderer(opts: IOpts) {
  const footnotes: [number, string, string][] = []
  let footnoteIndex: number = 0
  let styleMapping: ThemeStyles = buildTheme(opts)
  let codeIndex: number = 0
  let listIndex: number = 0
  let isOrdered: boolean = false

  function styles(tag: string, addition: string = ``): string {
    return getStyles(styleMapping, tag, addition)
  }

  function styledContent(styleLabel: string, content: string, tagName?: string): string {
    const tag = tagName ?? styleLabel
    return `<${tag} ${styles(styleLabel)}>${content}</${tag}>`
  }

  function addFootnote(title: string, link: string): number {
    footnotes.push([++footnoteIndex, title, link])
    return footnoteIndex
  }

  function reset(newOpts: Partial<IOpts>): void {
    footnotes.length = 0
    footnoteIndex = 0
    setOptions(newOpts)
  }

  function setOptions(newOpts: Partial<IOpts>): void {
    opts = { ...opts, ...newOpts }
    styleMapping = buildTheme(opts)
    marked.use(markedAlert({ styles: styleMapping }))
  }

  function buildReadingTime(readingTime: ReadTimeResults): string {
    if (!opts.countStatus) {
      return ``
    }
    if (!readingTime.words) {
      return ``
    }
    return `
      <blockquote ${styles(`blockquote`)}>
        <p ${styles(`blockquote_p`)}>字数 ${readingTime?.words}，阅读大约需 ${Math.ceil(readingTime?.minutes)} 分钟</p>
      </blockquote>
    `
  }

  const buildFootnotes = () => {
    if (!footnotes.length) {
      return ``
    }

    return (
      styledContent(`h4`, `引用链接`)
      + styledContent(`footnotes`, buildFootnoteArray(footnotes), `p`)
    )
  }

  const renderer: RendererObject = {
    heading({ tokens, depth }: Tokens.Heading) {
      const text = this.parser.parseInline(tokens)
      const tag = `h${depth}`
      return styledContent(tag, text)
    },

    paragraph({ tokens }: Tokens.Paragraph): string {
      const text = this.parser.parseInline(tokens)
      const isFigureImage = text.includes(`<figure`) && text.includes(`<img`)
      const isEmpty = text.trim() === ``
      if (isFigureImage || isEmpty) {
        return text
      }
      return styledContent(`p`, text)
    },

    blockquote({ tokens }: Tokens.Blockquote): string {
      let text = this.parser.parse(tokens)
      text = text.replace(/<p .*?>/g, `<p ${styles(`blockquote_p`)}>`)
      return styledContent(`blockquote`, text)
    },

    code({ text, lang = `` }: Tokens.Code): string {
      if (lang.startsWith(`mermaid`)) {
        clearTimeout(codeIndex)
        codeIndex = setTimeout(() => {
          mermaid.run()
        }, 0) as any as number
        return `<pre class="mermaid">${text}</pre>`
      }
      const langText = lang.split(` `)[0]
      const language = hljs.getLanguage(langText) ? langText : `plaintext`
      let highlighted = hljs.highlight(text, { language }).value
      // tab to 4 spaces
      highlighted = highlighted.replace(/\t/g, `    `)
      highlighted = highlighted
        .replace(/\r\n/g, `<br/>`)
        .replace(/\n/g, `<br/>`)
        .replace(/(>[^<]+)|(^[^<]+)/g, str => str.replace(/\s/g, `&nbsp;`))
      const span = `<span class="mac-sign" style="padding: 10px 14px 0;" hidden>${macCodeSvg}</span>`
      const code = `<code class="language-${lang}" ${styles(`code`)}>${highlighted}</code>`
      return `<pre class="hljs code__pre" ${styles(`code_pre`)}>${span}${code}</pre>`
    },

    codespan({ text }: Tokens.Codespan): string {
      const escapedText = escapeHtml(text)
      return styledContent(`codespan`, escapedText, `code`)
    },

    listitem(item: Tokens.ListItem): string {
      const prefix = isOrdered ? `${listIndex + 1}. ` : `• `
      const content = item.tokens.map(t => (this[t.type as keyof Renderer] as <T>(token: T) => string)(t)).join(``)
      return styledContent(`listitem`, `${prefix}${content}`, `li`)
    },

    list({ ordered, items, start = 1 }: Tokens.List): string {
      const listItems = []
      for (let i = 0; i < items.length; i++) {
        isOrdered = ordered
        listIndex = Number(start) + i - 1
        const item = items[i]
        listItems.push(this.listitem(item))
      }
      const label = ordered ? `ol` : `ul`
      return styledContent(label, listItems.join(``))
    },

    image({ href, title, text }: Tokens.Image): string {
      const subText = styledContent(`figcaption`, transform(opts.legend!, text, title))
      const figureStyles = styles(`figure`)
      const imgStyles = styles(`image`)
      return `<figure ${figureStyles}><img ${imgStyles} src="${href}" title="${title}" alt="${text}" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' width=\\'36\\' height=\\'36\\'%3E%3Cpath fill=\\'%23ccc\\' d=\\'M2.28 3.22a.75.75 0 0 0-1.06 1.06l4.928 4.929a4.75 4.75 0 0 0-1.9 3.791v8.5a.75.75 0 0 0 .75.75h12a.75.75 0 0 0 .402-.116l1.282 1.283a.75.75 0 1 0 1.06-1.061l-1.57-1.57-6.96-6.96L4.289 6.22l-2.01-3Zm7.57 7.57l6.94 6.94a.755.755 0 0 1-.039.002H5.75v-8.5a3.25 3.25 0 0 1 1.32-2.618l2.78 2.76Zm3.436-6.49h5.964v7.19l1.5 1.5V3.55a.75.75 0 0 0-.75-.75h-8.5a.75.75 0 0 0-.686.457l1.159 1.157a.743.743 0 0 0 .313-.114Z\\'/%3E%3C/svg%3E';this.style.border='1px solid #ddd';this.style.padding='8px';" />${subText}</figure>`
    },

    link({ href, title, text, tokens }: Tokens.Link): string {
      const parsedText = this.parser.parseInline(tokens)
      const allowedHosts = ['mp.weixin.qq.com']
      try {
        const url = new URL(href)
        if (allowedHosts.includes(url.host)) {
          return `<a href="${href}" title="${title || text}" ${styles(`wx_link`)}>${parsedText}</a>`
        }
      } catch (e) {
        console.error('Invalid URL:', href)
      }
      if (href === text) {
        return parsedText
      }
      if (opts.citeStatus) {
        const ref = addFootnote(title || text, href)
        return `<span ${styles(`link`)}>${parsedText}<sup>[${ref}]</sup></span>`
      }
      return styledContent(`link`, parsedText, `span`)
    },

    strong({ tokens }: Tokens.Strong): string {
      return styledContent(`strong`, this.parser.parseInline(tokens))
    },

    em({ tokens }: Tokens.Em): string {
      return styledContent(`em`, this.parser.parseInline(tokens), `span`)
    },

    table({ header, rows }: Tokens.Table): string {
      const headerRow = header
        .map(cell => this.tablecell(cell))
        .join(``)
      const body = rows
        .map((row) => {
          const rowContent = row
            .map(cell => this.tablecell(cell))
            .join(``)
          return styledContent(`tr`, rowContent)
        })
        .join(``)
      return `
        <section style="padding:0 8px; max-width: 100%; overflow: auto">
          <table class="preview-table">
            <thead ${styles(`thead`)}>${headerRow}</thead>
            <tbody>${body}</tbody>
          </table>
        </section>
      `
    },

    tablecell(token: Tokens.TableCell): string {
      const text = this.parser.parseInline(token.tokens)
      return styledContent(`td`, text)
    },

    hr(_: Tokens.Hr): string {
      return styledContent(`hr`, ``)
    },
  }

  marked.use({ renderer })

  return {
    buildAddition,
    buildFootnotes,
    setOptions,
    reset,
    parseFrontMatterAndContent,
    buildReadingTime,
    createContainer(content: string) {
      return styledContent(`container`, content, `section`)
    },
  }
}
