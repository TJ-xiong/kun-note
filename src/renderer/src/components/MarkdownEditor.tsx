import React, { useState, useEffect } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkBreaks from 'remark-breaks'
import './MarkdownEditor.css'

interface MarkdownEditorProps {
  value?: string
  onChange?: (value: string) => void
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value = '', onChange }) => {
  const [content, setContent] = useState<string>(value)
  const [showPreview, setShowPreview] = useState<boolean>(false)
  const [onlyPreview, setOnlyPreview] = useState<boolean>(false)

  // 外部 value 变化时同步内部 state
  useEffect(() => {
    setContent(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newValue = e.target.value
    setContent(newValue)
    onChange?.(newValue)
  }

  const components: Components = {
    // 自定义段落组件，移除默认的上下 margin，避免单个换行时出现空行
    // 只保留很小的底部 margin 用于真正的段落分隔
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    p({ children, ...props }: any) {
      return (
        <p {...props} className="markdown-paragraph">
          {children}
        </p>
      )
    },
    // 标题组件，确保长标题也能换行
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h1: ({ children, ...props }: any) => (
      <h1 {...props} className="markdown-heading markdown-heading-h1">
        {children}
      </h1>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h2: ({ children, ...props }: any) => (
      <h2 {...props} className="markdown-heading markdown-heading-h2">
        {children}
      </h2>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h3: ({ children, ...props }: any) => (
      <h3 {...props} className="markdown-heading markdown-heading-h3">
        {children}
      </h3>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h4: ({ children, ...props }: any) => (
      <h4 {...props} className="markdown-heading markdown-heading-h4">
        {children}
      </h4>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h5: ({ children, ...props }: any) => (
      <h5 {...props} className="markdown-heading markdown-heading-h5">
        {children}
      </h5>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h6: ({ children, ...props }: any) => (
      <h6 {...props} className="markdown-heading markdown-heading-h6">
        {children}
      </h6>
    ),
    // 列表项组件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    li: ({ children, ...props }: any) => (
      <li {...props} className="markdown-list-item">
        {children}
      </li>
    ),
    // 表格组件 - 添加横向滚动支持
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table: ({ children, ...props }: any) => (
      <div className="markdown-table-wrapper">
        <table {...props} className="markdown-table">
          {children}
        </table>
      </div>
    ),
    // 表格单元格 - 允许内容换行
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    td: ({ children, ...props }: any) => (
      <td {...props} className="markdown-table-cell">
        {children}
      </td>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    th: ({ children, ...props }: any) => (
      <th {...props} className="markdown-table-header">
        {children}
      </th>
    ),
    // 代码块组件 - 添加横向滚动
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      if (!inline && match) {
        return (
          <div className="markdown-code-block">
            <SyntaxHighlighter
              {...props}
              style={oneDark}
              language={match[1]}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderRadius: '4px',
                padding: '12px'
              }}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        )
      }
      return (
        <code {...props} className={`markdown-code-inline ${className || ''}`}>
          {children}
        </code>
      )
    },
    // 引用块组件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blockquote: ({ children, ...props }: any) => (
      <blockquote {...props} className="markdown-blockquote">
        {children}
      </blockquote>
    ),
    // 链接组件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    a: ({ children, ...props }: any) => (
      <a {...props} className="markdown-link">
        {children}
      </a>
    )
  }

  return (
    <div className="markdown-editor">
      {/* 顶部工具栏 */}
      <div className="markdown-toolbar">
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
        {!onlyPreview && (
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
        {/* 左侧编辑器 */}
        {!onlyPreview && (
          <textarea
            value={content}
            onChange={handleChange}
            className={`markdown-textarea ${showPreview ? 'markdown-textarea-split' : ''}`}
            placeholder="在此输入内容"
            aria-label="Markdown 编辑器"
          />
        )}

        {/* 右侧预览 */}
        {(onlyPreview || showPreview) && (
          <div className="markdown-preview-container">
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MarkdownEditor
