import React, { useEffect, useRef, useCallback, useState } from 'react'
import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  NodeViewWrapper
} from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import { Markdown } from 'tiptap-markdown'
import { common, createLowlight } from 'lowlight'
import { useContextMenu } from '@renderer/hooks/useContextMenu'
import type { NodeViewProps, Editor } from '@tiptap/react'
import './RichTextEditor.css'

const lowlight = createLowlight(common)

interface RichTextEditorProps {
  noteId?: string
  value?: string
  onChange?: (value: string) => void
}

// ---- SVG 图标 ----

const icons = {
  bold: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  ),
  italic: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  ),
  underline: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  ),
  strikethrough: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4H9a3 3 0 0 0-3 3c0 2 1 3 3 3" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <path d="M15 12c2 0 3 1 3 3a3 3 0 0 1-3 3H8" />
    </svg>
  ),
  highlight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 11-6 6v3h9l3-3" />
      <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
    </svg>
  ),
  code: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  link: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  bulletList: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  orderedList: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <text x="2" y="8" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">1</text>
      <text x="2" y="14" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">2</text>
      <text x="2" y="20" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">3</text>
    </svg>
  ),
  taskList: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="6" height="6" rx="1" />
      <path d="m5 11 1.5-1.5" />
      <path d="M13 6h8" />
      <rect x="3" y="14" width="6" height="6" rx="1" />
      <path d="M13 15h8" />
    </svg>
  ),
  blockquote: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
    </svg>
  ),
  codeBlock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <polyline points="9 8 5 12 9 16" />
      <polyline points="15 8 19 12 15 16" />
    </svg>
  ),
  table: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  image: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  horizontalRule: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  ),
  undo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  redo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  alignLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="10" x2="3" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="17" y1="18" x2="3" y2="18" />
    </svg>
  ),
  alignCenter: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="10" x2="6" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="18" y1="18" x2="6" y2="18" />
    </svg>
  ),
  alignRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" y1="10" x2="7" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="21" y1="18" x2="7" y2="18" />
    </svg>
  ),
  chevronDown: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ---- 工具栏按钮 ----

const ToolbarButton: React.FC<{
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}> = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    className={`toolbar-btn ${active ? 'is-active' : ''}`}
    onClick={onClick}
    disabled={disabled}
    title={title}
  >
    {children}
  </button>
)

const ToolbarDivider: React.FC = () => <div className="toolbar-divider" />

// ---- 标题下拉 ----

const HeadingDropdown: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getCurrentLabel = (): string => {
    if (editor.isActive('heading', { level: 1 })) return '标题 1'
    if (editor.isActive('heading', { level: 2 })) return '标题 2'
    if (editor.isActive('heading', { level: 3 })) return '标题 3'
    if (editor.isActive('heading', { level: 4 })) return '标题 4'
    if (editor.isActive('heading', { level: 5 })) return '标题 5'
    if (editor.isActive('heading', { level: 6 })) return '标题 6'
    return '正文'
  }

  const items = [
    { label: '正文', action: () => editor.chain().focus().setParagraph().run() },
    { label: '标题 1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: '标题 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: '标题 3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: '标题 4', action: () => editor.chain().focus().toggleHeading({ level: 4 }).run() },
    { label: '标题 5', action: () => editor.chain().focus().toggleHeading({ level: 5 }).run() },
    { label: '标题 6', action: () => editor.chain().focus().toggleHeading({ level: 6 }).run() }
  ]

  return (
    <div className="toolbar-dropdown" ref={ref}>
      <button
        type="button"
        className="toolbar-dropdown-trigger"
        onClick={() => setOpen(!open)}
      >
        {getCurrentLabel()}
        <span className="toolbar-dropdown-arrow">{icons.chevronDown}</span>
      </button>
      {open && (
        <div className="toolbar-dropdown-menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`toolbar-dropdown-item ${getCurrentLabel() === item.label ? 'is-active' : ''}`}
              onClick={() => {
                item.action()
                setOpen(false)
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- 颜色选择器 ----

const COLORS = [
  '#000000', '#434343', '#666666', '#999999',
  '#e60000', '#ff9900', '#ffff00', '#00cc00',
  '#0066ff', '#9933ff', '#ff3399', '#ffffff',
  '#facccc', '#ffebcc', '#ffffcc', '#d9ead3',
  '#d0d0e0', '#cfe2f3', '#d9d2e9', '#ead1dc'
]

const ColorPicker: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="toolbar-dropdown" ref={ref}>
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => setOpen(!open)}
        title="文字颜色"
      >
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>A</span>
          <span
            style={{
              width: '14px',
              height: '3px',
              backgroundColor: editor.getAttributes('textStyle').color || '#000000',
              borderRadius: '1px'
            }}
          />
        </span>
      </button>
      {open && (
        <div className="toolbar-dropdown-menu color-picker">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="color-swatch"
              style={{ backgroundColor: color }}
              onClick={() => {
                editor.chain().focus().setColor(color).run()
                setOpen(false)
              }}
              title={color}
            />
          ))}
          <button
            type="button"
            className="color-reset"
            onClick={() => {
              editor.chain().focus().unsetColor().run()
              setOpen(false)
            }}
          >
            重置
          </button>
        </div>
      )}
    </div>
  )
}

// ---- 表格网格选择器 ----

const MAX_ROWS = 8
const MAX_COLS = 8

const TableGridPicker: React.FC<{ onInsert: (rows: number, cols: number) => void }> = ({ onInsert }) => {
  const [open, setOpen] = useState(false)
  const [hoverRow, setHoverRow] = useState(0)
  const [hoverCol, setHoverCol] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="toolbar-dropdown" ref={ref}>
      <button
        type="button"
        className="toolbar-btn"
        onClick={() => setOpen(!open)}
        title="插入表格"
      >
        {icons.table}
      </button>
      {open && (
        <div
          className="table-grid-picker"
          onMouseLeave={() => {
            setHoverRow(0)
            setHoverCol(0)
          }}
        >
          <div className="table-grid">
            {Array.from({ length: MAX_ROWS }, (_, r) => (
              <div key={r} className="table-grid-row">
                {Array.from({ length: MAX_COLS }, (_, c) => (
                  <div
                    key={c}
                    className={`table-grid-cell ${r <= hoverRow && c <= hoverCol ? 'is-highlighted' : ''}`}
                    onMouseEnter={() => {
                      setHoverRow(r)
                      setHoverCol(c)
                    }}
                    onClick={() => {
                      onInsert(r + 1, c + 1)
                      setOpen(false)
                      setHoverRow(0)
                      setHoverCol(0)
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="table-grid-label">
            {hoverRow + 1} × {hoverCol + 1}
          </div>
        </div>
      )}
    </div>
  )
}

// ---- 固定顶部工具栏 ----

const FixedToolbar: React.FC<{ editor: Editor }> = ({ editor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const reader = new FileReader()
        reader.onload = async () => {
          const dataUrl = reader.result as string
          const url = await window.api.saveImage(dataUrl)
          editor.chain().focus().setImage({ src: url, alt: 'image' }).run()
        }
        reader.readAsDataURL(file)
      }
      // 重置 input 以便重复选择同一文件
      e.target.value = ''
    },
    [editor]
  )

  const insertTable = useCallback(
    (rows: number, cols: number) => {
      editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    },
    [editor]
  )

  return (
    <div className="toolbar">
      {/* 历史 */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="撤销 (Ctrl+Z)">
        {icons.undo}
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="重做 (Ctrl+Shift+Z)">
        {icons.redo}
      </ToolbarButton>

      <ToolbarDivider />

      {/* 标题 */}
      <HeadingDropdown editor={editor} />

      <ToolbarDivider />

      {/* 内联格式 */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="加粗 (Ctrl+B)">
        {icons.bold}
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜体 (Ctrl+I)">
        {icons.italic}
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="下划线 (Ctrl+U)">
        {icons.underline}
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="删除线">
        {icons.strikethrough}
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="高亮">
        {icons.highlight}
      </ToolbarButton>
      <ColorPicker editor={editor} />

      <ToolbarDivider />

      {/* 列表 */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="无序列表">
        {icons.bulletList}
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="有序列表">
        {icons.orderedList}
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="任务列表">
        {icons.taskList}
      </ToolbarButton>

      <ToolbarDivider />

      {/* 块级 */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="引用">
        {icons.blockquote}
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="代码块">
        {icons.codeBlock}
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="分割线">
        {icons.horizontalRule}
      </ToolbarButton>

      <ToolbarDivider />

      {/* 插入 */}
      <TableGridPicker onInsert={insertTable} />
      <ToolbarButton onClick={() => fileInputRef.current?.click()} title="插入图片">
        {icons.image}
      </ToolbarButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      <ToolbarDivider />

      {/* 对齐 */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="左对齐">
        {icons.alignLeft}
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="居中对齐">
        {icons.alignCenter}
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="右对齐">
        {icons.alignRight}
      </ToolbarButton>
    </div>
  )
}

// ---- 浮动格式菜单 (选中文本时弹出) ----

const FormatBubbleMenu: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const linkRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (linkRef.current && !linkRef.current.contains(e.target as Node)) {
        setLinkOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openLinkPopup = () => {
    const existing = editor.getAttributes('link').href || ''
    setLinkUrl(existing)
    setLinkOpen(true)
  }

  const applyLink = () => {
    if (linkUrl.trim()) {
      editor.chain().focus().setLink({ href: linkUrl.trim() }).run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
    setLinkOpen(false)
  }

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor, state }) => {
        // 代码块内不显示
        if (editor.isActive('codeBlock')) return false
        // 选中节点（图片等）时不显示
        if ('node' in state.selection) return false
        // 有文本选区才显示
        const { from, to } = state.selection
        return from !== to
      }}
    >
      <div className="bubble-menu">
        <button
          type="button"
          className={`bubble-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="加粗"
        >
          {icons.bold}
        </button>
        <button
          type="button"
          className={`bubble-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="斜体"
        >
          {icons.italic}
        </button>
        <button
          type="button"
          className={`bubble-btn ${editor.isActive('underline') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="下划线"
        >
          {icons.underline}
        </button>
        <button
          type="button"
          className={`bubble-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="删除线"
        >
          {icons.strikethrough}
        </button>
        <button
          type="button"
          className={`bubble-btn ${editor.isActive('highlight') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="高亮"
        >
          {icons.highlight}
        </button>
        <button
          type="button"
          className={`bubble-btn ${editor.isActive('code') ? 'is-active' : ''}`}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="行内代码"
        >
          {icons.code}
        </button>
        <div className="bubble-divider" />
        <div className="bubble-link-wrapper" ref={linkRef}>
          <button
            type="button"
            className={`bubble-btn ${editor.isActive('link') ? 'is-active' : ''}`}
            onClick={openLinkPopup}
            title="链接"
          >
            {icons.link}
          </button>
          {linkOpen && (
            <div className="bubble-link-popup">
              <input
                type="text"
                className="bubble-link-input"
                placeholder="输入链接地址..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyLink()
                  if (e.key === 'Escape') setLinkOpen(false)
                }}
                autoFocus
              />
              <button type="button" className="bubble-link-confirm" onClick={applyLink}>
                确定
              </button>
            </div>
          )}
        </div>
      </div>
    </BubbleMenu>
  )
}

// ---- 自定义 Image NodeView：支持相对路径解析 + 右键复制 ----

const ResolvedImage: React.FC<NodeViewProps> = ({ node, selected }) => {
  const [resolvedSrc, setResolvedSrc] = React.useState<string>(node.attrs.src || '')
  const { bind: imgCtxMenu } = useContextMenu()

  useEffect(() => {
    let mounted = true
    const src = node.attrs.src || ''
    const isRel = src.startsWith('./images/') || src.startsWith('images/')
    if (isRel) {
      window.api
        .getImageDataUrl(src)
        .then((dataUrl) => {
          if (mounted) setResolvedSrc(dataUrl)
        })
        .catch(() => {
          if (mounted) setResolvedSrc(src)
        })
    } else {
      setResolvedSrc(src)
    }
    return () => {
      mounted = false
    }
  }, [node.attrs.src])

  const handleContextMenu = (e: React.MouseEvent) => {
    const src = node.attrs.src || ''
    const isRel = src.startsWith('./images/') || src.startsWith('images/')
    if (!isRel) return
    imgCtxMenu.onContextMenu(e, [
      {
        label: '复制图片',
        onClick: async () => {
          try {
            const dataUrl = await window.api.getImageDataUrl(src)
            const [meta, base64] = dataUrl.split(',')
            const mime = meta.match(/data:(.*?);/)?.[1] || 'image/png'
            const binaryStr = atob(base64)
            const bytes = new Uint8Array(binaryStr.length)
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i)
            }
            const blob = new Blob([bytes], { type: mime })
            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
          } catch (err) {
            window.api.log('error', `[复制图片] 失败: ${err}`)
          }
        }
      }
    ])
  }

  return (
    <NodeViewWrapper
      className={`image-node-view ${selected ? 'is-selected' : ''}`}
      onContextMenu={handleContextMenu}
    >
      <img
        src={resolvedSrc}
        alt={node.attrs.alt || ''}
        title={node.attrs.title || ''}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </NodeViewWrapper>
  )
}

// ---- 自定义 Image 扩展，注册 NodeView ----

const CustomImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ResolvedImage)
  }
})

// ---- 主组件 ----

const RichTextEditor: React.FC<RichTextEditorProps> = ({ noteId, value = '', onChange }) => {
  const lastExternalValue = useRef<string>(value)
  const isInternalUpdate = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false
      }),
      CustomImage.configure({
        inline: false,
        allowBase64: true
      }),
      Link.configure({
        openOnClick: false,
        autolink: true
      }),
      Placeholder.configure({
        placeholder: '开始输入笔记内容...'
      }),
      CodeBlockLowlight.configure({
        lowlight
      }),
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      Table.configure({
        resizable: false
      }),
      TableRow,
      TableCell,
      TableHeader,
      Underline,
      Highlight.configure({
        multicolor: false
      }),
      Typography,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true
      })
    ],
    content: value,
    editorProps: {
      handleClickOn: (view, pos, _node, _nodePos, event, direct) => {
        if (!direct) return false
        const el = event.target as HTMLElement
        if (el.tagName !== 'A' && !el.closest('a')) return false
        const { schema, doc } = view.state
        const $pos = doc.resolve(pos)
        const linkMark = $pos.marks().find((m) => m.type === schema.marks.link)
        if (!linkMark) return false
        let href = linkMark.attrs.href as string
        if (href && !/^https?:\/\//i.test(href)) href = 'https://' + href
        window.open(href, '_blank')
        return true
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || [])
        const imageItems = items.filter((it) => it.type?.startsWith('image/'))
        if (imageItems.length === 0) return false

        event.preventDefault()

        for (const item of imageItems) {
          const file = item.getAsFile()
          if (!file) continue
          const reader = new FileReader()
          reader.onload = async () => {
            const dataUrl = reader.result as string
            const url = await window.api.saveImage(dataUrl)
            const { state } = view
            const pos = state.selection.from
            const node = state.schema.nodes.image.create({ src: url, alt: 'image' })
            view.dispatch(state.tr.insert(pos, node))
          }
          reader.readAsDataURL(file)
        }
        return true
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false
        const files = Array.from(event.dataTransfer?.files || [])
        const imageFiles = files.filter((f) => f.type.startsWith('image/'))
        if (imageFiles.length === 0) return false

        event.preventDefault()

        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
        if (!coordinates) return false

        for (const file of imageFiles) {
          const reader = new FileReader()
          reader.onload = async () => {
            const dataUrl = reader.result as string
            const url = await window.api.saveImage(dataUrl)
            const node = view.state.schema.nodes.image.create({ src: url, alt: 'image' })
            view.dispatch(view.state.tr.insert(coordinates.pos, node))
          }
          reader.readAsDataURL(file)
        }
        return true
      }
    },
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markdown = (editor.storage as any).markdown.getMarkdown()
      onChange?.(markdown)
      setTimeout(() => {
        isInternalUpdate.current = false
      }, 0)
    }
  })

  useEffect(() => {
    if (!editor) return
    if (isInternalUpdate.current) return
    if (value === lastExternalValue.current) return
    lastExternalValue.current = value
    editor.commands.setContent(value || '', { emitUpdate: false })
  }, [editor, value])

  useEffect(() => {
    if (!editor) return
    const handler = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lastExternalValue.current = (editor.storage as any).markdown.getMarkdown()
    }
    editor.on('update', handler)
    return () => {
      editor.off('update', handler)
    }
  }, [editor])

  return (
    <div className="rich-text-editor" key={noteId}>
      {editor && <FixedToolbar editor={editor} />}
      {editor && <FormatBubbleMenu editor={editor} />}
      <div className="rich-text-editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default RichTextEditor
