import React, { useState, useEffect } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkBreaks from 'remark-breaks'

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <SyntaxHighlighter {...props} style={oneDark} language={match[1]} PreTag="div">
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code
          {...props}
          className={className}
          style={{ background: '#eee', padding: '2px 4px', borderRadius: '4px', fontSize: '13px' }}
        >
          {children}
        </code>
      )
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 顶部工具栏 */}
      <div style={{ padding: '5px 10px', borderBottom: '1px solid #ddd', background: '#f5f5f5' }}>
        <label style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={onlyPreview}
            onChange={() => setOnlyPreview(!onlyPreview)}
            style={{ marginRight: '6px' }}
          />
          仅预览
        </label>
        {!onlyPreview && (
          <label style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showPreview}
              onChange={() => setShowPreview(!showPreview)}
              style={{ marginRight: '6px', marginLeft: '10px' }}
            />
            双栏模式
          </label>
        )}
      </div>

      {/* 编辑 + 预览区 */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧编辑器 */}
        {!onlyPreview && (
          <textarea
            value={content}
            onChange={handleChange}
            style={{
              flex: showPreview ? 1 : 1,
              height: '100%',
              padding: '10px',
              fontSize: '14px',
              fontFamily: 'monospace',
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'transparent'
            }}
          />
        )}

        {/* 右侧预览 */}
        {(onlyPreview || showPreview) && (
          <div
            style={{
              flex: 1,
              padding: '10px',
              overflow: 'auto',
              borderLeft: '1px solid #ddd',
              whiteSpace: 'pre-wrap',
              background: 'transparent'
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]} // ✅ 自动换行
              components={components}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

export default MarkdownEditor
