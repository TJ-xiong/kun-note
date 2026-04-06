import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Settings from './pages/Settings'
import React from 'react'

function AppRouter(): React.JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  )
}

export default AppRouter
