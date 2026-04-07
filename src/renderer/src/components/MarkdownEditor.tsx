import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkBreaks from 'remark-breaks'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import './MarkdownEditor.css'

interface MarkdownEditorProps {
  value?: string
  onChange?: (value: string) => void
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value = '', onChange }) => {
  const [content, setContent] = useState<string>(value)
  const [showPreview, setShowPreview] = useState<boolean>(false)
  const [mdMode, setMdMode] = useState<boolean>(false)
  const [onlyPreview, setOnlyPreview] = useState<boolean>(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // 外部 value 变化时同步内部 state
  useEffect(() => {
    setContent(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newValue = e.target.value
    setContent(newValue)
    onChange?.(newValue)
  }

  // 工具函数：将 React 节点递归转成字符串（用于代码块）
  const getCodeString = (nodes: unknown): string => {
    if (nodes == null) return ''
    if (typeof nodes === 'string' || typeof nodes === 'number') return String(nodes)
    if (Array.isArray(nodes)) return nodes.map(getCodeString).join('')
    if (typeof nodes === 'object' && (nodes as any).props) {
      return getCodeString((nodes as any).props.children)
    }
    try {
      return String(nodes)
    } catch {
      return ''
    }
  }

  // ReactMarkdown/MDEditor 预览共用的组件映射
  const components: Components = {
    p: ({ children, ...props }) => (
      <p {...props} className="markdown-paragraph">
        {children}
      </p>
    ),
    h1: ({ children, ...props }) => (
      <h1 {...props} className="markdown-heading markdown-heading-h1">
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 {...props} className="markdown-heading markdown-heading-h2">
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 {...props} className="markdown-heading markdown-heading-h3">
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 {...props} className="markdown-heading markdown-heading-h4">
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5 {...props} className="markdown-heading markdown-heading-h5">
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6 {...props} className="markdown-heading markdown-heading-h6">
        {children}
      </h6>
    ),
    li: ({ children, ...props }) => (
      <li {...props} className="markdown-list-item">
        {children}
      </li>
    ),
    table: ({ children, ...props }) => (
      <div className="markdown-table-wrapper">
        <table {...props} className="markdown-table">
          {children}
        </table>
      </div>
    ),
    td: ({ children, ...props }) => (
      <td {...props} className="markdown-table-cell">
        {children}
      </td>
    ),
    th: ({ children, ...props }) => (
      <th {...props} className="markdown-table-header">
        {children}
      </th>
    ),
    code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
      const match = /language-(\w+)/.exec(className || '')
      const codeString = getCodeString(children).replace(/\n$/, '')

      if (!inline && match) {
        return (
          <div className="markdown-code-block">
            <SyntaxHighlighter
              {...props as any}
              style={oneDark}
              language={match[1] as any}
              PreTag="div"
              customStyle={{ margin: 0, borderRadius: '4px', padding: '12px' }}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        )
      }
      return (
        <code {...props as any} className={`markdown-code-inline ${className || ''}`}>
          {codeString}
        </code>
      )
    },
    blockquote: ({ children, ...props }) => (
      <blockquote {...props} className="markdown-blockquote">
        {children}
      </blockquote>
    ),
    a: ({ children, ...props }) => (
      <a {...props} className="markdown-link">
        {children}
      </a>
    ),
    img: ({ src, alt = '', ...props }: { src?: string; alt?: string }) => {
      // 将相对路径图片读取为 data URL，避免 dev 环境下 file:/// 受限
      const [resolvedSrc, setResolvedSrc] = useState<string>(typeof src === 'string' ? src : '')
      useEffect(() => {
        let mounted = true
        const s = typeof src === 'string' ? src : ''
        const isRel = s.startsWith('./images/') || s.startsWith('images/')
        if (isRel) {
          window.api
            .getImageDataUrl(s)
            .then((dataUrl) => { if (mounted) setResolvedSrc(dataUrl) })
            .catch(() => { if (mounted) setResolvedSrc(s) })
        } else {
          setResolvedSrc(s)
        }
        return () => { mounted = false }
      }, [src])
      return <img {...(props as any)} src={resolvedSrc} alt={alt} />
    }
  }

  // 选区工具
  const getSel = (): { ta: HTMLTextAreaElement; start: number; end: number } | null => {
    const ta = textareaRef.current
    if (!ta) return null
    const start = ta.selectionStart ?? 0
    const end = ta.selectionEnd ?? 0
    return { ta, start, end }
  }

  const isPosInFencedCodeBlock = (pos: number): boolean => {
    let inCode = false
    let offset = 0
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineEnd = offset + line.length
      const trimmed = line.trimStart()
      if (trimmed.startsWith('```')) inCode = !inCode
      if (pos <= lineEnd) return inCode
      offset = lineEnd + 1
    }
    return inCode
  }

  const isSelectionInFencedCodeBlock = (start: number, end: number): boolean => {
    const s = Math.max(0, start)
    const e = Math.max(s, end - 1)
    return isPosInFencedCodeBlock(s) && isPosInFencedCodeBlock(e)
  }

  // 行内样式切换（加粗/斜体/删除线/行内代码）
  const wrapInline = (wrapper: string): void => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart ?? 0
    const end = ta.selectionEnd ?? 0

    let newStart = start
    let newEnd = end

    if (start !== end) {
      const hasLeft = start >= wrapper.length && content.slice(start - wrapper.length, start) === wrapper
      const hasRight = end + wrapper.length <= content.length && content.slice(end, end + wrapper.length) === wrapper
      if (hasLeft && hasRight) {
        const newContent = content.slice(0, start - wrapper.length) + content.slice(start, end) + content.slice(end + wrapper.length)
        setContent(newContent)
        onChange?.(newContent)
        newStart = start - wrapper.length
        newEnd = end - wrapper.length
      } else {
        const newContent = content.slice(0, start) + wrapper + content.slice(start, end) + wrapper + content.slice(end)
        setContent(newContent)
        onChange?.(newContent)
        newStart = start + wrapper.length
        newEnd = end + wrapper.length
      }
    } else {
      const insertion = wrapper + wrapper
      const newContent = content.slice(0, start) + insertion + content.slice(end)
      setContent(newContent)
      onChange?.(newContent)
      newStart = start + wrapper.length
      newEnd = newStart
    }

    setTimeout(() => {
      const t = textareaRef.current
      if (t) {
        t.focus()
        t.selectionStart = newStart
        t.selectionEnd = newEnd
      }
    }, 0)
  }

  const toggleBold = () => wrapInline('**')
  const toggleItalic = () => wrapInline('*')
  const toggleStrike = () => wrapInline('~~')
  const toggleCode = () => wrapInline('`')

  // 块级切换（标题/引用/列表/任务）
  const toggleHeading = (level: 1 | 2 | 3): void => {
    const sel = getSel()
    if (!sel) return
    const { start, end } = sel
    if (isSelectionInFencedCodeBlock(start, end)) return

    const s = content.lastIndexOf('\n', Math.max(0, start - 1)) + 1
    const eBreak = content.indexOf('\n', end)
    const e = eBreak === -1 ? content.length : eBreak

    const block = content.slice(s, e)
    const lines = block.split('\n')
    const newLines = lines.map((line) => {
      const m = line.match(/^\s{0,3}(#{1,6})\s+/)
      if (m) {
        const current = m[1].length
        const rest = line.replace(/^\s{0,3}(#{1,6})\s+/, '')
        if (current === level) return rest
        return '#'.repeat(level) + ' ' + rest
      }
      return '#'.repeat(level) + ' ' + line
    })
    const newBlock = newLines.join('\n')
    const newContent = content.slice(0, s) + newBlock + content.slice(e)
    setContent(newContent)
    onChange?.(newContent)
    setTimeout(() => {
      const t = textareaRef.current
      if (t) {
        t.focus()
        t.selectionStart = s
        t.selectionEnd = s + newBlock.length
      }
    }, 0)
  }

  const toggleQuote = () => {
    const sel = getSel(); if (!sel) return
    const { start, end } = sel
    if (isSelectionInFencedCodeBlock(start, end)) return
    const s = content.lastIndexOf('\n', Math.max(0, start - 1)) + 1
    const eBreak = content.indexOf('\n', end)
    const e = eBreak === -1 ? content.length : eBreak
    const block = content.slice(s, e)
    const lines = block.split('\n')
    const newLines = lines.map((line) => (/^(\s*)>\s?/.test(line) ? line.replace(/^(\s*)>\s?/, '$1') : '> ' + line))
    const newBlock = newLines.join('\n')
    const newContent = content.slice(0, s) + newBlock + content.slice(e)
    setContent(newContent)
    onChange?.(newContent)
    setTimeout(() => {
      const t = textareaRef.current; if (t) { t.focus(); t.selectionStart = s; t.selectionEnd = s + newBlock.length }
    }, 0)
  }

  const toggleUnordered = () => {
    const sel = getSel(); if (!sel) return
    const { start, end } = sel
    if (isSelectionInFencedCodeBlock(start, end)) return
    const s = content.lastIndexOf('\n', Math.max(0, start - 1)) + 1
    const eBreak = content.indexOf('\n', end)
    const e = eBreak === -1 ? content.length : eBreak
    const block = content.slice(s, e)
    const lines = block.split('\n')
    const allBulleted = lines.every((l) => /^\s*[-*+]\s+/.test(l))
    const newLines = allBulleted ? lines.map((l) => l.replace(/^\s*[-*+]\s+/, '')) : lines.map((l) => '- ' + l)
    const newBlock = newLines.join('\n')
    const newContent = content.slice(0, s) + newBlock + content.slice(e)
    setContent(newContent)
    onChange?.(newContent)
    setTimeout(() => {
      const t = textareaRef.current; if (t) { t.focus(); t.selectionStart = s; t.selectionEnd = s + newBlock.length }
    }, 0)
  }

  const toggleOrdered = () => {
    const sel = getSel(); if (!sel) return
    const { start, end } = sel
    if (isSelectionInFencedCodeBlock(start, end)) return
    const s = content.lastIndexOf('\n', Math.max(0, start - 1)) + 1
    const eBreak = content.indexOf('\n', end)
    const e = eBreak === -1 ? content.length : eBreak
    const block = content.slice(s, e)
    const lines = block.split('\n')
    const allNumbered = lines.every((l) => /^\s*\d+\.\s+/.test(l))
    const newLines = allNumbered ? lines.map((l) => l.replace(/^\s*\d+\.\s+/, '')) : lines.map((l, i) => `${i + 1}. ${l}`)
    const newBlock = newLines.join('\n')
    const newContent = content.slice(0, s) + newBlock + content.slice(e)
    setContent(newContent)
    onChange?.(newContent)
    setTimeout(() => {
      const t = textareaRef.current; if (t) { t.focus(); t.selectionStart = s; t.selectionEnd = s + newBlock.length }
    }, 0)
  }

  const toggleTask = () => {
    const sel = getSel(); if (!sel) return
    const { start, end } = sel
    if (isSelectionInFencedCodeBlock(start, end)) return
    const s = content.lastIndexOf('\n', Math.max(0, start - 1)) + 1
    const eBreak = content.indexOf('\n', end)
    const e = eBreak === -1 ? content.length : eBreak
    const block = content.slice(s, e)
    const lines = block.split('\n')
    const taskRe = /^\s*- \[( |x|X)\]\s+/
    const newLines = lines.every((l) => taskRe.test(l)) ? lines.map((l) => l.replace(taskRe, '')) : lines.map((l) => `- [ ] ${l}`)
    const newBlock = newLines.join('\n')
    const newContent = content.slice(0, s) + newBlock + content.slice(e)
    setContent(newContent)
    onChange?.(newContent)
    setTimeout(() => {
      const t = textareaRef.current; if (t) { t.focus(); t.selectionStart = s; t.selectionEnd = s + newBlock.length }
    }, 0)
  }

  // MD 模式下在光标处插入文本
  const insertAtMdSelection = (text: string) => {
    const ta = document.querySelector('.md-mode .w-md-editor-text-input') as HTMLTextAreaElement | null
    if (!ta) {
      const newValue = (content || '') + (content.endsWith('\n') ? '' : '\n') + text
      setContent(newValue)
      onChange?.(newValue)
      return
    }
    const start = ta.selectionStart ?? content.length
    const end = ta.selectionEnd ?? content.length
    const newValue = content.slice(0, start) + text + content.slice(end)
    setContent(newValue)
    onChange?.(newValue)
    setTimeout(() => {
      ta.focus()
      const pos = start + text.length
      ta.selectionStart = pos
      ta.selectionEnd = pos
    }, 0)
  }

  // 粘贴图片：保存到本地并插入 file:// URL
  const handlePasteImagesInMd = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!mdMode) return
    const dt = e.clipboardData
    if (!dt) return
    const items = Array.from(dt.items || [])
    const imageItems = items.filter((it) => it.type && it.type.startsWith('image/'))
    if (imageItems.length === 0) return

    e.preventDefault()

    for (const it of imageItems) {
      const file = it.getAsFile(); if (!file) continue
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
      })
      const url = await window.api.saveImage(dataUrl)
      insertAtMdSelection(`![image](${url})\n`)
    }
  }

  return (
    <div className="markdown-editor">
      {/* 顶部工具栏 */}
      <div className="markdown-toolbar">
        <label className="markdown-toolbar-label">
          <input
            type="checkbox"
            checked={mdMode}
            onChange={() => setMdMode(!mdMode)}
            className="markdown-toolbar-checkbox"
            title="切换 MD 模式（所见即所得）"
          />
          MD 模式
        </label>
        {!mdMode && (
          <label className="markdown-toolbar-label">
            <input
              type="checkbox"
              checked={onlyPreview}
              onChange={() => setOnlyPreview(!onlyPreview)}
              className="markdown-toolbar-checkbox"
              title="切换仅预览模式"
            />
            仅预览
          </label>
        )}
        {!mdMode && !onlyPreview && (
          <label className="markdown-toolbar-label">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={() => setShowPreview(!showPreview)}
              className="markdown-toolbar-checkbox"
              title="切换双栏模式"
            />
            双栏模式
          </label>
        )}
      </div>

      {/* 编辑 + 预览区 */}
      <div className="markdown-container">
        {mdMode ? (
          <div className="md-mode" onPaste={handlePasteImagesInMd}>
            <MDEditor
              value={content}
              onChange={(v) => {
                const nv = v ?? ''
                setContent(nv)
                onChange?.(nv)
              }}
              preview="live"
              previewOptions={{ remarkPlugins: [remarkGfm, remarkBreaks], components }}
              style={{ height: '100%' }}
            />
          </div>
        ) : (
          <>
            {!onlyPreview && (
              <textarea
                value={content}
                onChange={handleChange}
                ref={textareaRef}
                className={`markdown-textarea ${showPreview ? 'markdown-textarea-split' : ''}`}
                placeholder="在此输入内容"
                aria-label="Markdown 编辑器"
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); toggleBold() }
                  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') { e.preventDefault(); toggleItalic() }
                  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') { e.preventDefault(); toggleCode() }
                  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); toggleStrike() }
                  if ((e.ctrlKey || e.metaKey) && ['1','2','3','q','u','o','t'].includes(e.key.toLowerCase())) { e.preventDefault() }
                  if ((e.ctrlKey || e.metaKey) && e.key === '1') toggleHeading(1)
                  if ((e.ctrlKey || e.metaKey) && e.key === '2') toggleHeading(2)
                  if ((e.ctrlKey || e.metaKey) && e.key === '3') toggleHeading(3)
                  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') toggleQuote()
                  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') toggleUnordered()
                  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') toggleOrdered()
                  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') toggleTask()
                }}
              />
            )}

            {(onlyPreview || showPreview) && (
              <div className="markdown-preview-container">
                <div className="markdown-preview">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default MarkdownEditor
