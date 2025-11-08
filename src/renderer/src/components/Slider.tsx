import React from 'react'
import { Note } from 'src/types/note'
import './Slider.css'

interface SliderProps {
  currParentId: number
  noteData: Note[]
  currentNote: Note | null
  handleChangeNote: (id: number) => void
}

const App: React.FC<SliderProps> = ({ noteData, currentNote, handleChangeNote, currParentId }) => {
  return (
    <div className="slider pointer-event-none">
      {noteData.map((note: Note) => {
        const isActive = currentNote?.id === note.id
        return (
          note.type !== 'folder' &&
          note.parentId === currParentId && ( // 只显示笔记，不显示文件夹
            <button
              key={note.id}
              onClick={() => handleChangeNote(Number(note.id))}
              className={`slider-bookmark ${isActive ? 'slider-bookmark-active' : ''}`}
            >
              <span className="slider-bookmark-indicator" />
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
