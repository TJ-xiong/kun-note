import React, { useCallback, useEffect, useState } from 'react'
import { GetProps, Input } from 'antd'
import { Note, NoteType } from "src/types/note";
import { FileMarkdownOutlined, FolderOpenOutlined, LeftOutlined } from '@ant-design/icons'
import { useContextMenu } from '@renderer/hooks/useContextMenu'

interface SliderMenuProps {
  noteData: Note[]
  currentNote: Note | null
  handleChangeNote: (id: number) => void
  currParentId: number
  setCurrParentId: (id: number) => void
  loadList: () => Promise<void>
  handleAddNote: (type: NoteType, parentId: number, title?: string) => Promise<void>
}

function handleNoteData(noteData: Note[]): Note[] {
  // TODO: 处理笔记数据
  const result: Note[] = []
  const folders: Note[] = []
  // 遍历noteData，将文件夹和笔记分开
  noteData.forEach((item: Note) => {
    if (item.type === 'folder') {
      folders.push(item)
    } else {
      result.push(item)
    }
  })
  // 将文件夹放到笔记前面
  result.unshift(...folders)
  return result
}

const App: React.FC<SliderMenuProps> = ({
  loadList,
  noteData,
  currentNote,
  handleChangeNote,
  currParentId,
  setCurrParentId,
  handleAddNote
}) => {
  // const [notes, setNotes] = useState<Note[]>([])
  const { Search } = Input
  type SearchProps = GetProps<typeof Input.Search>
  const onSearch: SearchProps['onSearch'] = (value, _e, info) => console.log(info?.source, value)
  const [showNotes, setShowNotes] = useState<Note[]>([])
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  function handleClickItem(note: Note): void {
    if (note.type === 'folder') {
      // TODO: 处理文件夹点击事件
      setShowNotes(
        showNotes.filter(
          (item: Note) => item.parentId === note.id && item.parentId === currParentId
        )
      )
      note.id && setCurrParentId(note.id)
    }
    if (note.type === 'note') {
      note.id && handleChangeNote(note.id)
    }
  }

  function getFolderName(): string {
    if (!noteData) return ''
    return noteData.filter((note: Note) => note.id === currParentId)[0].title
  }

  function handleClickBack(): void {
    if (!noteData) return
    const note = noteData.filter((note: Note) => note.id === currParentId)[0]
    setCurrParentId(note.parentId)
  }

  const handleDeleteNote = async (id: number): Promise<void> => {
    await window.api.deleteNote(id)
    loadList()
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
      loadList()
    })
  }

  // 顶层声明 hook
  const { bind } = useContextMenu()

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
          label: '删除',
          onClick: () => {
            if (window.confirm(`确定要删除【${note.title}】吗？`)) {
              note.id && handleDeleteNote(note.id)
            }
          }
        }
      ])
    },
    [bind]
  )

  const handleBlackMenu = useCallback(
    (e: React.MouseEvent) => {
      bind.onContextMenu(e, [
        {
          label: '新建笔记',
          onClick: () => {
            handleAddNote('note', currParentId, '笔记')
          }
        },
        {
          divider: true,
          label: '',
          onClick: () => {}
        },
        {
          label: '新建文件夹',
          onClick: () => {
            handleAddNote('folder', currParentId, '文件夹')
          }
        }
      ])
    },
    [bind]
  )

  // 相当于 Vue 的 onMounted
  useEffect(() => {
    const newNotes = handleNoteData(noteData)
    setShowNotes(newNotes.filter((item: Note) => item.parentId === currParentId))
  }, [noteData, currParentId])

  return (
    <div className="slider-menu">
      <div>
        <Search placeholder="关键字搜索" onSearch={onSearch} allowClear />
      </div>
      <div
        className="slider-container"
        onContextMenu={(e) => {
          handleBlackMenu(e)
        }}
      >
        {currParentId !== 0 && (
          <div>
            <LeftOutlined style={{ cursor: 'pointer' }} onClick={handleClickBack} />
            <span>{getFolderName()}</span>
          </div>
        )}
        {showNotes.map((item: Note) => {
          return (
            <div
              key={item.id}
              onContextMenu={handleContextMenu(item)}
              onClick={() => handleClickItem(item)}
              style={{
                width: '100%',
                padding: '4px 0',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'start',
                borderBottom: '1px solid #e8e8e8',
                background: '#fff',
                cursor: 'pointer',
                gap: '8px',
                backgroundColor: currentNote?.id === item.id ? '#f0f0f0' : '#fff'
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
      </div>
    </div>
  )
}

export default App
