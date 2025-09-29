import { createSlice, PayloadAction, configureStore } from '@reduxjs/toolkit'

export interface MenuItem {
  label: string
  onClick: () => void
  disabled?: boolean
  divider?: boolean
}

interface MenuState {
  visible: boolean
  position: { x: number; y: number }
  items: MenuItem[]
}

// 初始状态
const initialState: MenuState = {
  visible: false,
  position: { x: 0, y: 0 },
  items: []
}

// 创建 slice
const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    showMenu: (state, action: PayloadAction<{ x: number; y: number; items: MenuItem[] }>) => {
      state.visible = true
      state.position = { x: action.payload.x, y: action.payload.y }
      state.items = action.payload.items
    },
    hideMenu: (state) => {
      state.visible = false
    }
  }
})

// 导出 action
export const { showMenu, hideMenu } = menuSlice.actions

// 配置 store
export const store = configureStore({
  reducer: {
    menu: menuSlice.reducer
  }
})

// 定义类型
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
