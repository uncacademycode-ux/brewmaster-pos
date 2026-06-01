import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  tablesEnabled: boolean;
  setTablesEnabled: (v: boolean) => void;
  selectedTableId: string | null;
  setSelectedTableId: (id: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      tablesEnabled: true,
      setTablesEnabled: (v) => set({ tablesEnabled: v }),
      selectedTableId: null,
      setSelectedTableId: (id) => set({ selectedTableId: id }),
    }),
    { name: "coffee-pos-settings" }
  )
);
