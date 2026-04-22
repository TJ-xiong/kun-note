import React, { useEffect, useState } from 'react'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import './MarkdownEditor.css'
import { getCommands, getExtraCommands } from '@uiw/react-md-editor/commands-cn'

interface MarkdownEditorProps {
  value?: string
  onChange?: (value: string) => void
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value = '', onChange }) => {
  const [content, setContent] = useState<string>(value)

  // 外部 value 变化时同步内部 state
  useEffect(() => {
    setContent(value)
  }, [value])

  // 自定义图片组件，处理相对路径图片
  const components = {
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
            .then((dataUrl) => {
              if (mounted) setResolvedSrc(dataUrl)
            })
            .catch(() => {
              if (mounted) setResolvedSrc(s)
            })
        } else {
          setResolvedSrc(s)
        }
        return () => {
          mounted = false
        }
      }, [src])
      return <img {...(props as any)} src={resolvedSrc} alt={alt} />
    }
  }

  // 过滤掉不需要的命令（全屏、帮助、重复的代码预览按钮）
  const allCommands = [...getCommands(), ...getExtraCommands()].filter((cmd) => {
    // fullscreen 和 help 通过 keyCommand 过滤
    if (cmd.keyCommand === 'fullscreen' || cmd.keyCommand === 'help') {
      return false
    }
    // codeEdit、codeLive、codePreview 通过 name 过滤
    if (cmd.name === 'edit' || cmd.name === 'live' || cmd.name === 'preview') {
      return false
    }
    return true
  })

  // MD 模式下在光标处插入文本
  const insertAtMdSelection = (text: string) => {
    const ta = document.querySelector(
      '.md-mode .w-md-editor-text-input'
    ) as HTMLTextAreaElement | null
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
    const dt = e.clipboardData
    if (!dt) return
    const items = Array.from(dt.items || [])
    const imageItems = items.filter((it) => it.type && it.type.startsWith('image/'))
    if (imageItems.length === 0) return

    e.preventDefault()

    for (const it of imageItems) {
      const file = it.getAsFile()
      if (!file) continue
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
      {/* 编辑 + 预览区 */}
      <div className="markdown-container">
        <div className="md-mode" onPaste={handlePasteImagesInMd}>
          <MDEditor
            value={content}
            onChange={(v) => {
              const nv = v ?? ''
              setContent(nv)
              onChange?.(nv)
            }}
            commands={allCommands}
            preview="live"
            previewOptions={{ remarkPlugins: [remarkGfm, remarkBreaks], components }}
            style={{ height: '100%' }}
          />
        </div>
      </div>
    </div>
  )
}

export default MarkdownEditor
