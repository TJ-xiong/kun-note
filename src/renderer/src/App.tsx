import { useEffect, useRef, useState } from 'react'
import TitleBar from './components/TitleBar'
import { NewOrUpdateNote, Note, NoteType } from '../../types/note'
import MarkdownEditor from './components/MarkdownEditor'
import SliderMenu from './components/SliderMenu'
import Slider from './components/Slider'

window.addEventListener('mousemove', (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  const isTransparent = target?.classList.contains('pointer-event-none') ?? false
  window.api.handleTransparent(isTransparent)
})

function App(): React.JSX.Element {
  // const ipcHandle = (noteTitle: string): void => window.electron.ipcRenderer.send('ping', noteTitle)
  const [notes, setNotes] = useState<Note[]>([]) // 用 state 保存笔记
  const [currentNote, setCurrentNote] = useState<Note | null>(null) // 当前选中的笔记
  const [currParentId, setCurrParentId] = useState<number>(0) // 当前选中的目录id
  const saveTimer = useRef<NodeJS.Timeout | null>(null) // 保存防抖定时器
  // const [editingNoteId, setEditingNoteId] = useState<number | null>(null) // 正在编辑的笔记 id
  // const [editingTitle, setEditingTitle] = useState('') // 编辑中的标题
  const [sliderMenuShow, setSliderMenuShow] = useState(false)

  // 异步加载笔记
  const loadList = async (): Promise<void> => {
    try {
      const notesData = await window.api.listNotes()
      console.log('所有笔记:', notesData)
      setNotes(notesData) // 更新状态，界面自动刷新
      notesData[0].id && handleChangeNote(notesData[0].id) // 默认选中第一个笔记
    } catch (error) {
      console.error('加载笔记失败:', error)
    }
  }

  const handleAddNote = async (type: NoteType, parentId: number): Promise<void> => {
    const newNote: NewOrUpdateNote = {
      id: null,
      title: '新建笔记',
      content: '',
      type,
      parentId
    }
    const savedNote = await window.api.saveNote(newNote)
    console.log(savedNote)
    setNotes((prev) => [savedNote, ...prev])
    setCurrentNote(savedNote)
  }

  // 切换笔记
  const handleChangeNote = async (id: number): Promise<void> => {
    const note = await window.api.getNote(id)
    setCurrentNote(note)
  }

  // 编辑笔记内容
  const handleContentChange = (newValue: string): void => {
    if (!currentNote) return
    const updatedNote = { ...currentNote, content: newValue }
    setCurrentNote(updatedNote)
    // 防抖保存到数据库
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      window.api.saveNote({
        id: updatedNote.id, // 新笔记传 null，更新时传已有 id
        title: updatedNote.title,
        content: updatedNote.content,
        type: 'note',
        parentId: 0
      })
      console.log('笔记已保存:', updatedNote)
    }, 500) // 500ms 防抖，可根据需求调整
  }

  //
  // const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
  //   setEditingTitle(e.target.value)
  // }
  //
  // const handleTitleBlur = (note: Note): void => {
  //   handleUpdateNoteTitle(note, editingTitle)
  //   setEditingNoteId(null)
  // }
  //
  // const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, note: Note): void => {
  //   if (e.key === 'Enter') {
  //     handleUpdateNoteTitle(note, editingTitle)
  //     setEditingNoteId(null)
  //   }
  //   if (e.key === 'Escape') {
  //     setEditingNoteId(null)
  //   }
  // }

  // const handleUpdateNoteTitle = async (note: Note, title: string): Promise<void> => {
  //   window.api.saveNote({
  //     id: note.id, // 新笔记传 null，更新时传已有 id
  //     title: title,
  //     content: note.content,
  //     type: 'note',
  //     parentId: 0
  //   })
  //   notes.forEach((item) => {
  //     if (item.id === note.id) {
  //       item.title = title
  //     }
  //   })
  //   setNotes([...notes])
  // }

  // 相当于 Vue 的 onMounted
  useEffect(() => {
    loadList()
  }, []) // 空依赖数组表示只在组件挂载时执行一次

  return (
    <>
      <div className="container">
        <div className="slider">
          {sliderMenuShow ? (
            <SliderMenu
              loadList={loadList}
              noteData={notes}
              currParentId={currParentId}
              setCurrParentId={(id: number) => setCurrParentId(id)}
              currentNote={currentNote}
              handleChangeNote={(id: number) => handleChangeNote(id)}
            />
          ) : (
            <Slider
              currParentId={currParentId}
              noteData={notes}
              currentNote={currentNote}
              handleChangeNote={(id: number) => handleChangeNote(id)}
            />
          )}
        </div>
        <div className="main">
          <TitleBar
            onAddNote={() => handleAddNote('note', currParentId)}
            sliderMenuShow={sliderMenuShow}
            onSliderMenuShowChange={(value: boolean) => setSliderMenuShow(value)}
          />
          <div className="main-content">
            {currentNote ? (
              <MarkdownEditor value={currentNote.content || ''} onChange={handleContentChange} />
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
