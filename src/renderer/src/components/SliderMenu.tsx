import React, { useCallback, useEffect, useState } from 'react'
import { GetProps, Input } from 'antd'
import { Note } from 'src/types/note'
import { FileMarkdownOutlined, FolderOpenOutlined, LeftOutlined } from '@ant-design/icons'
import { useContextMenu } from '@renderer/hooks/useContextMenu'

interface SliderMenuProps {
  noteData: Note[]
  currentNote: Note | null
  handleChangeNote: (id: number) => void
  currParentId: number
  setCurrParentId: (id: number) => void
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
  noteData,
  currentNote,
  handleChangeNote,
  currParentId,
  setCurrParentId
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

  const handleDoubleClick = (note: Note): void => {
    setEditingNote(note)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const _editingNote = JSON.parse(JSON.stringify(editingNote))
    _editingNote.title = e.target.value
    setEditingNote(_editingNote)
  }

  const handleTitleBlur = (): void => {
    if (editingNote) {
      handleUpdateNoteTitle(editingNote).then(() => {
        setEditingNote(null)
      })
    }
  }

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

  const handleUpdateNoteTitle = async (note: Note): Promise<void> => {
    window.api.saveNote(note)
    showNotes.forEach((item: Note) => {
      if (item.id === note.id) {
        item.title = note.title
      }
    })
    setShowNotes([...showNotes])
  }

  // 顶层声明 hook
  const { bind } = useContextMenu()

  const handleContextMenu = useCallback(
    (note: Note) => (e: React.MouseEvent) => {
      e.preventDefault()
      bind.onContextMenu(e, [
        { label: '重命名', onClick: () => handleDoubleClick(note) },
        {
          divider: true,
          label: '',
          onClick: () => {}
        },
        {
          label: '删除',
          onClick: () => {
            if (window.confirm(`确定要删除【${note.title}】吗？`)) {
              note.id && console.log('handleDeleteNote(note.id)')
            }
          }
        }
      ])
    },
    [bind]
  )

  // 相当于 Vue 的 onMounted
  useEffect(() => {
    const newNotes = handleNoteData(noteData)
    // setNotes(newNotes)
    setShowNotes(newNotes.filter((item: Note) => item.parentId === currParentId))
  }, [noteData, currParentId])

  return (
    <div className="slider-menu">
      <div>
        <Search placeholder="关键字搜索" onSearch={onSearch} allowClear />
      </div>
      <div className="slider-container">
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
