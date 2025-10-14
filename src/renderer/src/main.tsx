import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from '@renderer/state'
import App from './App'
import GlobalContextMenu from '@renderer/components/GlobalContextMenu'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <StrictMode>
      <GlobalContextMenu /> {/* 全局只挂一次 */}
      <App />
    </StrictMode>
  </Provider>
)
