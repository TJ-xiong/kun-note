import React from 'react'
import { Note } from 'src/types/note'
import './Slider.css'

interface SliderProps {
  currParentId: string
  noteData: Note[]
  currentNote: Note | null
  handleChangeNote: (id: string) => void
}

const App: React.FC<SliderProps> = ({ noteData, currentNote, handleChangeNote, currParentId }) => {
  // 排序：置顶优先，其余按名称降序
  const sortedNotes = [...noteData].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return b.title.localeCompare(a.title)
  })

  return (
    <div className="slider pointer-event-none">
      {sortedNotes.map((note: Note) => {
        const isActive = currentNote?.id === note?.id
        return (
          note.type !== 'folder' &&
          note.parentId === currParentId && ( // 只显示笔记，不显示文件夹
            <button
              key={note.id}
              onClick={() => handleChangeNote(note.id as string)}
              className={`slider-bookmark ${isActive ? 'slider-bookmark-active' : ''} ${note.isPinned ? 'slider-bookmark-pinned' : ''}`}
            >
              <span className={`slider-bookmark-indicator ${note.isPinned ? 'slider-bookmark-indicator-pinned' : ''}`} />
              <span className="slider-bookmark-text" title={note.title}>
                {note.title}
              </span>
            </button>
          )
        )
      })}
    </div>
  )
}

export default App
