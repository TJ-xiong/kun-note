import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import TitleBar from './components/TitleBar'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  // 保存笔记
  const save = async (): Promise<void> => {
    const id = await window.api.saveNote({
      id: null, // 新笔记传 null，更新时传已有 id
      title: '我的第一篇笔记',
      content: '# Hello Markdown\n这是内容'
    })
    console.log('保存成功，笔记ID:', id)
  }

  // 获取所有笔记
  const loadList = async (): Promise<void> => {
    const notes = await window.api.listNotes()
    console.log('所有笔记:', notes)
  }

  // 获取单个笔记
  const loadOne = async (id: number): Promise<void> => {
    const note = await window.api.getNote(id)
    console.log('笔记内容:', note)
  }

  return (
    <>
      <TitleBar />
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <img alt="logo" className="logo" src={electronLogo} />
        <div className="creator">Powered by electron-vite</div>
        <div className="text">
          Build an Electron app with <span className="react">React</span>
          &nbsp;and <span className="ts">TypeScript</span>
        </div>
        <p className="tip">
          Please try pressing <code>F12</code> to open the devTool
        </p>
        <div className="actions">
          <div className="action">
            <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
              Documentation
            </a>
          </div>
          <div className="action">
            <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
              Send IPC
            </a>
            <a target="_blank" rel="noreferrer" onClick={save}>
              save note
            </a>
            <a target="_blank" rel="noreferrer" onClick={loadList}>
              loadList note
            </a>
            <a target="_blank" rel="noreferrer" onClick={() => loadOne(1)}>
              loadOne note
            </a>
          </div>
        </div>
        <Versions></Versions>
      </div>
    </>
  )
}

export default App
