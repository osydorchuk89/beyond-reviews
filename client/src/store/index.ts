import { create } from "zustand";

interface MobileMenuStore {
    isMenuOpen: boolean;
    openMenu: () => void;
    closeMenu: () => void;
}

export const useMobileMenuStore = create<MobileMenuStore>()((set) => ({
    isMenuOpen: false,
    openMenu: () => set(() => ({ isMenuOpen: true })),
    closeMenu: () => set(() => ({ isMenuOpen: false })),
}));
