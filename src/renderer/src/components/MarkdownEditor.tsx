import React, { useEffect, useRef, useState } from 'react'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import './MarkdownEditor.css'
import { getCommands, getExtraCommands } from '@uiw/react-md-editor/commands-cn'
import type { ICommand } from '@uiw/react-md-editor'
import { useContextMenu } from '@renderer/hooks/useContextMenu'

interface MarkdownEditorProps {
  value?: string
  onChange?: (value: string) => void
}

// 图片引用正则，匹配 ![alt](./images/xxx) 或 ![alt](images/xxx)
const IMG_REF_RE = /!\[.*?\]\(((?:\.\/)?images\/[\w.-]+)\)/g

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value = '', onChange }) => {
  const [content, setContent] = useState<string>(value)
  const editorRef = useRef<HTMLDivElement>(null)
  const { bind: contextMenuBind } = useContextMenu()

  // 外部 value 变化时同步内部 state
  useEffect(() => {
    setContent(value)
  }, [value])

  // 自定义图片组件，处理相对路径图片 + 右键复制
  const components = {
    img: ({ src, alt = '', ...props }: { src?: string; alt?: string }) => {
      const [resolvedSrc, setResolvedSrc] = useState<string>(typeof src === 'string' ? src : '')
      const { bind: imgCtxMenu } = useContextMenu()
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

      const isLocalImage = (() => {
        const s = typeof src === 'string' ? src : ''
        return s.startsWith('./images/') || s.startsWith('images/')
      })()

      const handleImgContextMenu = (e: React.MouseEvent) => {
        if (!isLocalImage) return
        imgCtxMenu.onContextMenu(e, [
          {
            label: '复制图片',
            onClick: () => copyImageToClipboard(src!)
          }
        ])
      }

      return <img {...(props as any)} src={resolvedSrc} alt={alt} onContextMenu={handleImgContextMenu} />
    }
  }

  // 过滤掉不需要的命令（全屏、帮助、重复的代码预览按钮），并清理多余分割线
  const filterCommands = (cmds: ICommand[]): ICommand[] =>
    cmds
      .filter((cmd) => {
        if (cmd.keyCommand === 'fullscreen' || cmd.keyCommand === 'help') return false
        return true
      })
      .filter((cmd, i, arr) => {
        // 移除连续的分割线和末尾的分割线
        if (cmd.keyCommand === 'divider') {
          if (i === arr.length - 1) return false // 末尾分割线
          if (i > 0 && arr[i - 1].keyCommand === 'divider') return false // 连续分割线
        }
        return true
      })

  const commands = filterCommands(getCommands())
  const extraCommands = filterCommands(getExtraCommands())

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

  // 将图片 data URL 转为 Blob 并写入剪贴板
  const copyImageToClipboard = async (imgPath: string): Promise<boolean> => {
    try {
      window.api.log('info', `[复制图片] 开始, imgPath=${imgPath}`)
      const dataUrl = await window.api.getImageDataUrl(imgPath)
      window.api.log('info', `[复制图片] getImageDataUrl 返回, dataUrl长度=${dataUrl.length}`)

      // data:image/png;base64,xxx → 直接从 base64 构造 Blob，避免 fetch 对 data URL 的限制
      const [meta, base64] = dataUrl.split(',')
      const mime = meta.match(/data:(.*?);/)?.[1] || 'image/png'
      const binaryStr = atob(base64)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: mime })
      window.api.log('info', `[复制图片] blob 类型=${blob.type}, 大小=${blob.size}`)

      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ])
      window.api.log('info', `[复制图片] 写入剪贴板成功`)
      return true
    } catch (e) {
      window.api.log('error', `[复制图片] 失败: ${e}`)
      return false
    }
  }

  // 获取当前 textarea 选中文本中的图片引用
  const getSelectedImagePaths = (): string[] => {
    const ta = getTextArea()
    if (!ta) return []
    const selected = content.slice(ta.selectionStart, ta.selectionEnd)
    const matches = [...selected.matchAll(IMG_REF_RE)]
    return matches.map((m) => m[1])
  }

  // 获取 textarea 元素
  const getTextArea = (): HTMLTextAreaElement | null => {
    return document.querySelector('.md-mode .w-md-editor-text-input') as HTMLTextAreaElement | null
  }

  // 判断光标位置是否在图片引用内，返回图片路径或 null
  const getImagePathAtCursor = (): string | null => {
    const ta = getTextArea()
    if (!ta) return null
    const cursor = ta.selectionStart
    // 重置 lastIndex 因为使用了 g 标志
    const re = /!\[.*?\]\(((?:\.\/)?images\/[\w.-]+)\)/g
    let match: RegExpExecArray | null
    while ((match = re.exec(content)) !== null) {
      const start = match.index
      const end = start + match[0].length
      if (cursor >= start && cursor <= end) {
        return match[1]
      }
    }
    return null
  }

  // 拦截复制事件：选中文本含图片引用时，复制真实图片到剪贴板
  const handleCopy = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const imgPaths = getSelectedImagePaths()
    window.api.log('info', `[复制] 触发, 选中图片数=${imgPaths.length}, imgPaths=${JSON.stringify(imgPaths)}`)
    if (imgPaths.length === 0) return

    const ta = getTextArea()
    if (!ta) {
      window.api.log('warn', `[复制] 未找到 textarea 元素`)
      return
    }
    const selected = content.slice(ta.selectionStart, ta.selectionEnd)
    window.api.log('info', `[复制] 选中文本长度=${selected.length}, startsWith!=${selected.trim().startsWith('![')}`)

    // 只选中了单张图片 → 复制图片 blob
    if (imgPaths.length === 1 && selected.trim().startsWith('![')) {
      window.api.log('info', `[复制] 模式: 单张图片复制`)
      e.preventDefault()
      await copyImageToClipboard(imgPaths[0])
      return
    }

    // 混合内容 → 写入 HTML（含 <img>） + 纯文本
    window.api.log('info', `[复制] 模式: 混合内容复制`)
    e.preventDefault()
    const resolved: Record<string, string> = {}
    for (const p of imgPaths) {
      try {
        resolved[p] = await window.api.getImageDataUrl(p)
      } catch (err) {
        window.api.log('error', `[复制] 解析图片失败: ${p}, ${err}`)
      }
    }

    let html = selected.replace(
      /!\[(.*?)\]\(((?:\.\/)?images\/[\w.-]+)\)/g,
      (_full, alt, path) => {
        const url = resolved[path]
        return url ? `<img src="${url}" alt="${alt}" />` : _full
      }
    )
    // 包裹为 HTML 片段
    html = `<div>${html}</div>`

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([selected], { type: 'text/plain' })
        })
      ])
      window.api.log('info', `[复制] 混合内容写入剪贴板成功`)
    } catch (err) {
      window.api.log('error', `[复制] 混合内容写入剪贴板失败: ${err}`)
    }
  }

  // 右键菜单：在图片引用上显示"复制图片"选项
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    const imgPath = getImagePathAtCursor()
    window.api.log('info', `[右键菜单] imgPath=${imgPath}`)
    if (!imgPath) return

    // 使用项目的 useContextMenu 注入菜单项
    contextMenuBind.onContextMenu(e, [
      {
        label: '复制图片',
        onClick: () => {
          window.api.log('info', `[右键菜单] 点击复制图片, imgPath=${imgPath}`)
          copyImageToClipboard(imgPath)
        }
      }
    ])
  }

  return (
    <div className="markdown-editor">
      {/* 编辑 + 预览区 */}
      <div className="markdown-container">
        <div
          className="md-mode"
          ref={editorRef}
          onPaste={handlePasteImagesInMd}
          onCopy={handleCopy}
          onContextMenu={handleContextMenu}
        >
          <MDEditor
            value={content}
            onChange={(v) => {
              const nv = v ?? ''
              setContent(nv)
              onChange?.(nv)
            }}
            commands={commands}
            extraCommands={extraCommands}
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
