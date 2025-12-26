import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  tableColumns: Record<string, string[]>;
  recentFilters: Record<string, unknown>;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setTableColumns: (table: string, columns: string[]) => void;
  setRecentFilter: (key: string, filter: unknown) => void;
  getRecentFilter: (key: string) => unknown;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarCollapsed: false,
      tableColumns: {},
      recentFilters: {},

      toggleTheme: () => {
        set((state) => ({ 
          theme: state.theme === 'light' ? 'dark' : 'light' 
        }));
      },

      toggleSidebar: () => {
        set((state) => ({ 
          sidebarCollapsed: !state.sidebarCollapsed 
        }));
      },

      setTableColumns: (table: string, columns: string[]) => {
        set((state) => ({
          tableColumns: {
            ...state.tableColumns,
            [table]: columns
          }
        }));
      },

      setRecentFilter: (key: string, filter: unknown) => {
        set((state) => ({
          recentFilters: {
            ...state.recentFilters,
            [key]: filter
          }
        }));
      },

      getRecentFilter: (key: string) => {
        const { recentFilters } = get();
        return recentFilters[key];
      }
    }),
    {
      name: 'ui-storage'
    }
  )
);
