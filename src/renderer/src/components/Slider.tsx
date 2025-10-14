import React from 'react'
import { Note } from 'src/types/note'

interface SliderProps {
  noteData: Note[]
  currentNote: Note | null
  handleChangeNote: (id: number) => void
}

const App: React.FC<SliderProps> = ({ noteData, currentNote, handleChangeNote }) => {
  return (
    <div className="slider pointer-event-none">
      {noteData.map((note: Note) => {
        return (
          note.type !== 'folder' && ( // 只显示笔记，不显示文件夹
            <button
              key={note.id}
              onClick={() => handleChangeNote(Number(note.id))}
              style={{
                display: 'block',
                width: currentNote?.id === note.id ? '60px' : '45px',
                minHeight: '30px',
                border: 'none',
                borderRadius: '6px 0px 0px 6px',
                overflow: 'hidden',
                background: currentNote?.id === note.id ? '#d0e6ff' : '#f0f0f0',
                cursor: 'pointer',
                fontWeight: currentNote?.id === note.id ? 'bold' : 'normal',
                position: 'relative',
                fontSize: '12px'
              }}
            >
              <span
                style={{
                  display: 'block',
                  transition: 'all 0.3s ease',
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
            </button>
          )
        )
      })}
    </div>
  )
}

export default App
