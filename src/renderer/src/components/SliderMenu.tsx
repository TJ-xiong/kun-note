import React, { useCallback, useEffect, useState } from 'react'
import { GetProps, Input } from 'antd'
import { Note, NoteType } from 'src/types/note'
import { FileMarkdownOutlined, FolderOpenOutlined, LeftOutlined, DeleteOutlined } from '@ant-design/icons'
import { useContextMenu } from '@renderer/hooks/useContextMenu'

interface SliderMenuProps {
  currentNote: Note | null
  handleChangeNote: (id: string) => void
  currParentId: string
  setCurrParentId: (id: string) => void
  loadList: () => Promise<void>
  loadNotesByParent: (parentId: string) => Promise<Note[]>
  handleAddNote: (type: NoteType, parentId: string, title?: string) => Promise<void>
  onShowHistory: (noteId: string) => void
  refreshKey?: number
}

const App: React.FC<SliderMenuProps> = ({
  loadNotesByParent,
  loadList,
  currentNote,
  handleChangeNote,
  currParentId,
  setCurrParentId,
  handleAddNote,
  onShowHistory,
  refreshKey
}) => {
  const { Search } = Input
  type SearchProps = GetProps<typeof Input.Search>
  const [, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<Note[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showNotes, setShowNotes] = useState<Note[]>([])
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [currentFolderInfo, setCurrentFolderInfo] = useState<Note | null>(null) // 当前目录信息（用于返回）

  // 切换目录时从数据库获取数据
  const handleParentChange = useCallback(
    async (newParentId: string) => {
      if (newParentId !== 'root') {
        // 获取当前目录的文件夹信息
        const folderInfo = await window.api.getNote(newParentId)
        setCurrentFolderInfo(folderInfo)
      } else {
        setCurrentFolderInfo(null)
      }
      setCurrParentId(newParentId)
      const notes = await loadNotesByParent(newParentId)
      // 文件夹在前，笔记在后，置顶的优先显示，都按名称降序排序
      const folders = notes
        .filter((n) => n.type === 'folder')
        .sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1
          if (!a.isPinned && b.isPinned) return 1
          return b.title.localeCompare(a.title)
        })
      const noteItems = notes
        .filter((n) => n.type === 'note')
        .sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1
          if (!a.isPinned && b.isPinned) return 1
          return b.title.localeCompare(a.title)
        })
      setShowNotes([...folders, ...noteItems])
    },
    [loadNotesByParent, setCurrParentId]
  )

  // 初始化、目录切换或刷新时加载数据
  useEffect(() => {
    handleParentChange(currParentId)
  }, [refreshKey])

  const onSearch: SearchProps['onSearch'] = async (value) => {
    setSearchKeyword(value)
    if (!value.trim()) {
      return
    }
    setIsSearching(true)
    try {
      const results = await window.api.searchNotes(value.trim())
      setSearchResults(results)
    } catch (error) {
      console.error('搜索失败:', error)
      setSearchResults([])
    }
  }

  const onSearchChange: SearchProps['onChange'] = (e) => {
    const value = e.target.value
    setSearchKeyword(value)
    if (!value.trim()) {
      // 清除搜索时，如果有正在编辑的笔记，切换到该笔记所在目录
      setIsSearching(false)
      setSearchResults([])
      if (currentNote && currentNote.parentId) {
        handleParentChange(currentNote.parentId)
      }
    }
  }

  function handleClickItem(note: Note): void {
    if (note.type === 'folder') {
      // 文件夹：退出搜索状态，进入该文件夹
      setIsSearching(false)
      setSearchKeyword('')
      setSearchResults([])
      note.id && handleParentChange(note.id)
    }
    if (note.type === 'note') {
      // 笔记：只打开笔记，保持搜索结果状态
      note.id && handleChangeNote(note.id)
    }
  }

  function getFolderName(): string {
    return currentFolderInfo?.title || ''
  }

  function handleClickBack(): void {
    if (currParentId !== 'root' && currentFolderInfo) {
      handleParentChange(currentFolderInfo.parentId)
    }
  }

  const handleDeleteNote = async (id: string): Promise<void> => {
    await window.api.deleteNote(id)
    loadList() // 刷新父组件数据
    handleParentChange(currParentId)
  }
  /**
   * 右键修改标题
   * @param note
   */
  const handleSettingTitle = (note: Note): void => {
    setEditingNote(note)
  }
  /**
   * 输入框内容变化
   * @param e
   */
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const _editingNote = JSON.parse(JSON.stringify(editingNote))
    _editingNote.title = e.target.value
    setEditingNote(_editingNote)
  }
  /**
   * 输入框失去焦点
   */
  const handleTitleBlur = (): void => {
    if (editingNote) {
      handleUpdateNoteTitle(editingNote).then(() => {
        setEditingNote(null)
      })
    }
  }
  /**
   * 输入框回车
   * @param e
   */
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && editingNote) {
      handleUpdateNoteTitle(editingNote).then(() => {
        setEditingNote(null)
      })
    }
    if (e.key === 'Escape') {
      setEditingNote(null)
    }
  }
  /**
   * 操作数据库修改标题
   * @param note
   */
  const handleUpdateNoteTitle = async (note: Note): Promise<void> => {
    window.api.saveNote(note).then(() => {
      loadList() // 刷新父组件数据
      handleParentChange(currParentId)
      // 同步更新 currentNote，避免后续编辑内容时标题被覆盖
      if (note.id && currentNote?.id === note.id) {
        handleChangeNote(note.id)
      }
    })
  }

  // 顶层声明 hook
  const { bind } = useContextMenu()

  // 切换置顶状态
  const handleTogglePin = (note: Note): void => {
    if (note.id) {
      window.api.togglePin(note.id).then(() => {
        loadList() // 刷新父组件数据
        handleParentChange(currParentId)
      })
    }
  }

  const handleContextMenu = useCallback(
    (note: Note) => (e: React.MouseEvent) => {
      e.stopPropagation() // ✅ 阻止父组件右键事件触发
      bind.onContextMenu(e, [
        { label: '重命名', onClick: () => handleSettingTitle(note) },
        {
          divider: true,
          label: '',
          onClick: () => {}
        },
        {
          label: note.isPinned ? '取消置顶' : '置顶',
          onClick: () => handleTogglePin(note)
        },
        ...(note.type === 'note'
          ? [
              {
                divider: true,
                label: '',
                onClick: () => {}
              },
              {
                label: '版本历史',
                onClick: () => onShowHistory(note.id!)
              }
            ]
          : []),
        {
          divider: true,
          label: '',
          onClick: () => {}
        },
        {
          label: '删除',
          onClick: () => {
            if (window.confirm(`确定要删除【${note.title}】吗？`)) {
              note.id && handleDeleteNote(note.id)
            }
          }
        }
      ])
    },
    [bind, handleTogglePin, onShowHistory]
  )

  const handleBlackMenu = useCallback(
    (e: React.MouseEvent) => {
      bind.onContextMenu(e, [
        {
          label: '新建笔记',
          onClick: async () => {
            await handleAddNote('note', currParentId, '笔记')
            loadList() // 刷新父组件数据
            handleParentChange(currParentId)
          }
        },
        {
          divider: true,
          label: '',
          onClick: () => {}
        },
        {
          label: '新建文件夹',
          onClick: async () => {
            await handleAddNote('folder', currParentId, '文件夹')
            loadList() // 刷新父组件数据
            handleParentChange(currParentId)
          }
        }
      ])
    },
    [bind, handleAddNote, loadList, handleParentChange]
  )

  return (
    <div className="slider-menu">
      <div>
        <Search placeholder="关键字搜索" onSearch={onSearch} onChange={onSearchChange} allowClear />
      </div>
      <div
        className="slider-container"
        onContextMenu={(e) => {
          handleBlackMenu(e)
        }}
      >
        {isSearching ? (
          <div style={{ marginBottom: '8px', color: '#999', fontSize: '12px' }}>
            找到 {searchResults.length} 个结果
          </div>
        ) : currParentId !== 'root' ? (
          <div>
            <LeftOutlined style={{ cursor: 'pointer' }} onClick={handleClickBack} />
            <span>{getFolderName()}</span>
          </div>
        ) : null}
        {(isSearching ? searchResults : showNotes).map((item: Note) => {
          // 菜单项
          return (
            <div
              key={item.id}
              onContextMenu={handleContextMenu(item)}
              onClick={() => handleClickItem(item)}
              style={{
                width: currentNote?.id === item.id ? '82%' : '80%',
                margin: '0 auto',
                borderRadius: '10px',
                padding: '4px 0',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'start',
                background: '#fff',
                cursor: 'pointer',
                gap: '8px',
                backgroundColor: currentNote?.id === item.id ? '#f0f0f0' : '#fff',
                border: item.isPinned ? '1px solid #1890ff' : currentNote?.id === item.id ? '1px solid red' : 'none',
                boxShadow: item.isPinned ? '0 2px 4px rgba(24, 144, 255, 0.2)' : 'none'
              }}
            >
              {item.type === 'folder' ? <FolderOpenOutlined /> : <FileMarkdownOutlined />}
              {editingNote && editingNote.id === item.id ? (
                <input
                  type="text"
                  autoFocus={true}
                  value={String(editingNote.title)}
                  onChange={handleTitleChange}
                  onBlur={() => handleTitleBlur()}
                  onKeyDown={(e) => handleTitleKeyDown(e)}
                  style={{
                    width: '80%',
                    border: '1px solid blue',
                    background: 'transparent',
                    outline: 'none',
                    fontWeight: 'bold'
                  }}
                ></input>
              ) : (
                <div>{item.title}</div>
              )}
            </div>
          )
        })}
        {/* 回收站入口 */}
        {!isSearching && currParentId === 'root' && (
          <div
            onClick={() => window.api.openOrCloseWindow('trash')}
            style={{
              width: '80%',
              margin: '8px auto 0',
              padding: '6px 0',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'start',
              cursor: 'pointer',
              gap: '8px',
              color: '#8c8c8c',
              borderTop: '1px solid #f0f0f0'
            }}
          >
            <DeleteOutlined />
            <div>回收站</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
