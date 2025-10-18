import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global Filter Store
 * Manages the business/personal filter state across the entire application
 * Filter values: 'all', 'personal', 'business'
 */
const useFilterStore = create(
  persist(
    (set, get) => ({
      // Current filter value
      filter: 'all',
      
      // Set the filter
      setFilter: (newFilter) => {
        if (['all', 'personal', 'business'].includes(newFilter)) {
          set({ filter: newFilter });
        }
      },
      
      // Get the current filter
      getFilter: () => get().filter,
      
      // Reset filter to 'all'
      resetFilter: () => set({ filter: 'all' }),
      
      // Get filter params for API calls
      getFilterParams: () => {
        const { filter } = get();
        if (filter === 'all') {
          return {};
        }
        return { type: filter };
      },
    }),
    {
      name: 'avanta-filter-storage', // unique name for localStorage
      getStorage: () => localStorage,
    }
  )
);

export default useFilterStore;
