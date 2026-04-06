import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from '@renderer/state'
import App from './App'
import Settings from './pages/Settings'
import GlobalContextMenu from '@renderer/components/GlobalContextMenu'

// Check process arguments to determine which page to render
const getPageFromArgs = (): string => {
  const args = window.process?.argv || []
  const pageArg = args.find(arg => arg.startsWith('--page='))
  if (pageArg) {
    return pageArg.split('=')[1]
  }
  return 'main'
}

const page = getPageFromArgs()

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <StrictMode>
      <GlobalContextMenu /> {/* 全局只挂一次 */}
      {page === 'main' ? <App /> : <Settings />}
    </StrictMode>
  </Provider>
)
