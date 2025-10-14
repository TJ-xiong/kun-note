// state/menuSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface MenuItemData {
  id: string
  label: string
  disabled?: boolean
  divider?: boolean
}

export interface MenuState {
  visible: boolean
  position: { x: number; y: number }
  items: MenuItemData[]
}

const initialState: MenuState = {
  visible: false,
  position: { x: 0, y: 0 },
  items: []
}

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    showMenu: (state, action: PayloadAction<{ x: number; y: number; items: MenuItemData[] }>) => {
      state.visible = true
      state.position = action.payload
      state.items = action.payload.items
    },
    hideMenu: (state) => {
      state.visible = false
    }
  }
})

export const { showMenu, hideMenu } = menuSlice.actions
export default menuSlice.reducer
