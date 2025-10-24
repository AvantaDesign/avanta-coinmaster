import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global Filter Store - Enhanced for Phase 50
 * Manages the business/personal filter state and advanced filter presets
 * Filter values: 'all', 'personal', 'business'
 */
const useFilterStore = create(
  persist(
    (set, get) => ({
      // Current filter value (legacy business/personal filter)
      filter: 'all',
      
      // Advanced filters
      advancedFilters: {},
      
      // Active preset
      activePreset: null,
      
      // Saved presets (cached from API)
      savedPresets: [],
      
      // Set the filter
      setFilter: (newFilter) => {
        if (['all', 'personal', 'business'].includes(newFilter)) {
          set({ filter: newFilter });
        }
      },
      
      // Get the current filter
      getFilter: () => get().filter,
      
      // Reset filter to 'all'
      resetFilter: () => set({ filter: 'all', advancedFilters: {}, activePreset: null }),
      
      // Get filter params for API calls
      getFilterParams: () => {
        const { filter } = get();
        if (filter === 'all') {
          return {};
        }
        return { type: filter };
      },
      
      // Set advanced filters
      setAdvancedFilters: (filters) => {
        set({ advancedFilters: filters, activePreset: null });
      },
      
      // Update a single filter field
      updateFilter: (key, value) => {
        set((state) => ({
          advancedFilters: { ...state.advancedFilters, [key]: value },
          activePreset: null,
        }));
      },
      
      // Clear all advanced filters
      clearAdvancedFilters: () => {
        set({ advancedFilters: {}, activePreset: null });
      },
      
      // Apply a preset
      applyPreset: async (presetId) => {
        const preset = get().savedPresets.find(p => p.id === presetId);
        if (preset) {
          set({ 
            advancedFilters: preset.filter_config,
            activePreset: presetId,
          });
          
          // Track preset usage
          try {
            const token = localStorage.getItem('token');
            await fetch(`/api/filters/presets/${presetId}/use`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
          } catch (error) {
            console.error('Error tracking preset usage:', error);
          }
        }
      },
      
      // Load saved presets from API
      loadPresets: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/filters/presets', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const presets = await response.json();
            set({ savedPresets: presets });
            return presets;
          }
        } catch (error) {
          console.error('Error loading presets:', error);
          return [];
        }
      },
      
      // Save current filters as a preset
      saveAsPreset: async (name, description = '', isFavorite = false) => {
        try {
          const token = localStorage.getItem('token');
          const { advancedFilters } = get();
          
          const response = await fetch('/api/filters/presets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name,
              description,
              filter_config: advancedFilters,
              is_favorite: isFavorite,
            })
          });
          
          if (response.ok) {
            const preset = await response.json();
            set((state) => ({
              savedPresets: [...state.savedPresets, preset],
              activePreset: preset.id,
            }));
            return preset;
          }
          throw new Error('Failed to save preset');
        } catch (error) {
          console.error('Error saving preset:', error);
          throw error;
        }
      },
      
      // Delete a preset
      deletePreset: async (presetId) => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/filters/presets/${presetId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            set((state) => ({
              savedPresets: state.savedPresets.filter(p => p.id !== presetId),
              activePreset: state.activePreset === presetId ? null : state.activePreset,
            }));
            return true;
          }
          throw new Error('Failed to delete preset');
        } catch (error) {
          console.error('Error deleting preset:', error);
          throw error;
        }
      },
      
      // Toggle preset favorite status
      togglePresetFavorite: async (presetId) => {
        try {
          const token = localStorage.getItem('token');
          const preset = get().savedPresets.find(p => p.id === presetId);
          
          if (!preset) return false;
          
          const response = await fetch(`/api/filters/presets/${presetId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              is_favorite: !preset.is_favorite,
            })
          });
          
          if (response.ok) {
            const updated = await response.json();
            set((state) => ({
              savedPresets: state.savedPresets.map(p => 
                p.id === presetId ? updated : p
              ),
            }));
            return true;
          }
          throw new Error('Failed to update preset');
        } catch (error) {
          console.error('Error updating preset:', error);
          throw error;
        }
      },
      
      // Get combined filters (legacy + advanced)
      getAllFilters: () => {
        const { filter, advancedFilters } = get();
        const legacyFilter = filter !== 'all' ? { type: filter } : {};
        return { ...legacyFilter, ...advancedFilters };
      },
    }),
    {
      name: 'avanta-filter-storage', // unique name for localStorage
      getStorage: () => localStorage,
    }
  )
);

export default useFilterStore;
