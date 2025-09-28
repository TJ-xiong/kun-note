import { useState, useEffect, useRef } from 'react'
import TitleBar from './components/TitleBar'
import { Note, NewOrUpdateNote } from '../../types/note'

function App(): React.JSX.Element {
  const ipcHandle = (noteTitle: string): void => window.electron.ipcRenderer.send('ping', noteTitle)
  const [notes, setNotes] = useState<Note[]>([]) // 用 state 保存笔记
  const [currentNote, setCurrentNote] = useState<Note | null>(null) // 当前选中的笔记
  const saveTimer = useRef<NodeJS.Timeout | null>(null) // 保存防抖定时器
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null) // 正在编辑的笔记 id
  const [editingTitle, setEditingTitle] = useState('') // 编辑中的标题

  // 异步加载笔记
  const loadList = async (): Promise<void> => {
    try {
      const notesData = await window.api.listNotes()
      console.log('所有笔记:', notesData)
      setNotes(notesData) // 更新状态，界面自动刷新
    } catch (error) {
      console.error('加载笔记失败:', error)
    }
  }

  const handleAddNote = async (): Promise<void> => {
    const newNote: NewOrUpdateNote = { id: null, title: '新建笔记', content: '' }
    const savedNote = await window.api.saveNote(newNote)
    console.log(savedNote)
    setNotes((prev) => [savedNote, ...prev])
    setCurrentNote(savedNote)
  }

  // 切换笔记
  const handleChangeNote = async (id: number | null): Promise<void> => {
    if (!id) return
    const note = await window.api.getNote(id)
    setCurrentNote(note)
  }

  // 编辑笔记内容
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    if (!currentNote) return
    const updatedNote = { ...currentNote, content: e.target.value }
    setCurrentNote(updatedNote)
    // 防抖保存到数据库
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      window.api.saveNote({
        id: updatedNote.id, // 新笔记传 null，更新时传已有 id
        title: updatedNote.title,
        content: updatedNote.content
      })
      console.log('笔记已保存:', updatedNote)
    }, 500) // 500ms 防抖，可根据需求调整
  }

  const handleDoubleClick = (note: Note): void => {
    setEditingNoteId(note.id)
    setEditingTitle(note.title)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEditingTitle(e.target.value)
  }

  const handleTitleBlur = (note: Note): void => {
    handleUpdateNoteTitle(note, note.title)
    setEditingNoteId(null)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, note: Note): void => {
    if (e.key === 'Enter') {
      handleUpdateNoteTitle(note, editingTitle)
      setEditingNoteId(null)
    }
    if (e.key === 'Escape') {
      setEditingNoteId(null)
    }
  }

  const handleUpdateNoteTitle = async (note: Note, title: string): Promise<void> => {
    await window.api.saveNote({
      id: note.id, // 新笔记传 null，更新时传已有 id
      title: title,
      content: note.content
    })
    loadList()
  }

  // 相当于 Vue 的 onMounted
  useEffect(() => {
    loadList()
  }, []) // 空依赖数组表示只在组件挂载时执行一次

  return (
    <>
      <div className="container">
        <div className="slider">
          {notes.map((note: Note) => (
            <button
              key={note.id}
              onClick={() => handleChangeNote(note.id)}
              onDoubleClick={() => handleDoubleClick(note)}
              style={{
                display: 'block',
                width: '80%',
                height: '30px',
                border: 'none',
                borderRadius: '6px 0px 0px 6px',
                background: currentNote?.id === note.id ? '#d0e6ff' : '#f0f0f0',
                cursor: 'pointer',
                fontWeight: currentNote?.id === note.id ? 'bold' : 'normal',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {editingNoteId === note.id ? (
                <input
                  type="text"
                  value={editingTitle}
                  autoFocus
                  onChange={handleTitleChange}
                  onBlur={() => handleTitleBlur(note)}
                  onKeyDown={(e) => handleTitleKeyDown(e, note)}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontWeight: 'bold'
                  }}
                />
              ) : (
                <>
                  <span
                    style={{
                      display: 'block',
                      transition: 'all 0.3s ease',
                      transform:
                        currentNote?.id === note.id ? 'translateX(0)' : 'translateX(-10px)',
                      opacity: currentNote?.id === note.id ? 1 : 0,
                      height: '100%',
                      width: '4px',
                      backgroundColor: '#3399ff',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      borderRadius: '2px'
                    }}
                  />
                  {note.title}
                </>
              )}
            </button>
          ))}
        </div>
        <div className="main">
          <TitleBar onAddNote={handleAddNote} />
          <div className="main-content">
            {currentNote ? (
              <textarea
                className="main-content-textarea"
                value={currentNote.content}
                onChange={handleContentChange}
                placeholder="请输入笔记内容"
              />
            ) : (
              <p>请选择一个笔记</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
