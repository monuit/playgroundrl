import { AvatarMode, GameState } from '@/index'
import { create } from 'zustand'

const useGameState = create<GameState>()((set) => ({
  state: 'LOADING',
  setState: (state: string) => set(() => ({ state })),
  changingText: 'READY?',
  setChangingText: (text: string) => set(() => ({ changingText: text })),
  currentLvl: 1,
  setCurrentLvl: (currentLvl: number) => set(() => ({ currentLvl })),
  avatarMode: 'bunny',
  setAvatarMode: (avatarMode: AvatarMode) => set(() => ({ avatarMode })),
}))

export default useGameState
