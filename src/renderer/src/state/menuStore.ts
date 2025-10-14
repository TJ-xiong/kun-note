// state/store.ts
import { configureStore } from '@reduxjs/toolkit'
import menuReducer, { MenuState } from './menuSlice'

export const store = configureStore({
  reducer: {
    menu: menuReducer
  }
})

// ✅ 导出类型
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type { MenuState }
