import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CosmeticsStore {
  equippedBoard: string;
  equippedPiece: string;
  equippedFx: string;
  equip: (type: 'board' | 'piece' | 'fx', cssClass: string) => void;
}

export const useCosmetics = create<CosmeticsStore>()(persist((set) => ({
  equippedBoard: 'board-classic',
  equippedPiece: 'piece-classic',
  equippedFx: '',
  equip: (type, cssClass) => {
    if (type === 'board') set({ equippedBoard: cssClass });
    else if (type === 'piece') set({ equippedPiece: cssClass });
    else set({ equippedFx: cssClass });
  },
}), { name: 'damka-cosmetics' }));
