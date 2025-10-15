import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  calculateCreditBalance,
  calculateAvailableCredit,
  calculateCreditUtilization,
  getNextPaymentDueDate,
  getDaysUntilPayment,
  isPaymentDueSoon,
  isPaymentOverdue
} from '../utils/credits';

const API_URL = import.meta.env.VITE_API_URL || 'https://avanta-finance.pages.dev';

/**
 * Credit Store using Zustand
 * 
 * Manages global state for credits including:
 * - Credit list and balances
 * - Credit movements
 * - CRUD operations
 * - Loading and error states
 * - Payment calculations
 */
const useCreditStore = create(
  persist(
    (set, get) => ({
      // State
      credits: [],
      movements: {},
      loading: false,
      error: null,
      
      // Statistics
      totalBalance: 0,
      totalAvailableCredit: 0,
      totalUtilization: 0,
      upcomingPayments: [],

      // Filters
      filterType: 'all',
      sortBy: 'name',

      /**
       * Get auth token
       */
      getToken: () => {
        return localStorage.getItem('authToken');
      },

      /**
       * Load credits from API
       */
      loadCredits: async (includeBalance = true, activeOnly = false) => {
        set({ loading: true, error: null });
        
        try {
          const token = get().getToken();
          const params = new URLSearchParams();
          if (includeBalance) params.append('include_balance', 'true');
          if (activeOnly) params.append('active_only', 'true');
          
          const response = await fetch(`${API_URL}/api/credits?${params}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to load credits');
          }

          const credits = await response.json();
          
          // Calculate statistics
          const totalBalance = credits.reduce((sum, credit) => 
            sum + (credit.balance || 0), 0
          );
          
          const totalAvailableCredit = credits.reduce((sum, credit) => {
            const available = calculateAvailableCredit(
              credit.credit_limit, 
              credit.balance || 0
            );
            return sum + available;
          }, 0);
          
          const totalUtilization = credits.length > 0
            ? credits.reduce((sum, credit) => {
                const utilization = calculateCreditUtilization(
                  credit.balance || 0,
                  credit.credit_limit
                );
                return sum + utilization;
              }, 0) / credits.length
            : 0;
          
          // Calculate upcoming payments
          const upcomingPayments = credits
            .filter(credit => credit.payment_due_day && credit.is_active)
            .map(credit => ({
              creditId: credit.id,
              creditName: credit.name,
              nextPaymentDate: getNextPaymentDueDate(credit.payment_due_day),
              daysUntil: getDaysUntilPayment(credit.payment_due_day),
              balance: credit.balance || 0,
              isDueSoon: isPaymentDueSoon(credit.payment_due_day),
              isOverdue: isPaymentOverdue(credit.payment_due_day, credit.last_payment_date)
            }))
            .sort((a, b) => a.daysUntil - b.daysUntil);
          
          set({ 
            credits,
            totalBalance,
            totalAvailableCredit,
            totalUtilization,
            upcomingPayments,
            loading: false 
          });
          
          return credits;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Load credit by ID
       */
      loadCredit: async (creditId) => {
        set({ loading: true, error: null });
        
        try {
          const token = get().getToken();
          const response = await fetch(`${API_URL}/api/credits/${creditId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to load credit');
          }

          const credit = await response.json();
          
          // Update in local state
          const { credits } = get();
          const updatedCredits = credits.map(c => 
            c.id === creditId ? credit : c
          );
          
          set({ credits: updatedCredits, loading: false });
          
          return credit;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Create a new credit
       */
      createCredit: async (creditData) => {
        set({ loading: true, error: null });
        
        try {
          const token = get().getToken();
          const response = await fetch(`${API_URL}/api/credits`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(creditData)
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create credit');
          }

          const newCredit = await response.json();
          
          // Reload all credits
          await get().loadCredits();
          
          set({ loading: false });
          return newCredit;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Update an existing credit
       */
      updateCredit: async (creditId, updates) => {
        set({ loading: true, error: null });
        
        try {
          const token = get().getToken();
          const response = await fetch(`${API_URL}/api/credits/${creditId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update credit');
          }

          const updatedCredit = await response.json();
          
          // Reload all credits
          await get().loadCredits();
          
          set({ loading: false });
          return updatedCredit;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Delete a credit
       */
      deleteCredit: async (creditId) => {
        set({ loading: true, error: null });
        
        try {
          const token = get().getToken();
          const response = await fetch(`${API_URL}/api/credits/${creditId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete credit');
          }

          // Reload all credits
          await get().loadCredits();
          
          set({ loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Load credit movements
       */
      loadMovements: async (creditId, params = {}) => {
        set({ loading: true, error: null });
        
        try {
          const token = get().getToken();
          const queryParams = new URLSearchParams(params);
          
          const response = await fetch(`${API_URL}/api/credits/${creditId}/movements?${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error('Failed to load movements');
          }

          const result = await response.json();
          const movements = result.movements || [];
          
          // Store movements for this credit
          set({ 
            movements: {
              ...get().movements,
              [creditId]: movements
            },
            loading: false 
          });
          
          return movements;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Add a credit movement
       */
      addMovement: async (creditId, movementData) => {
        set({ loading: true, error: null });
        
        try {
          const token = get().getToken();
          const response = await fetch(`${API_URL}/api/credits/${creditId}/movements`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(movementData)
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add movement');
          }

          const newMovement = await response.json();
          
          // Reload credit to update balance
          await get().loadCredit(creditId);
          
          // Reload movements for this credit
          await get().loadMovements(creditId);
          
          // Reload all credits to update statistics
          await get().loadCredits();
          
          set({ loading: false });
          return newMovement;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Get credit by ID
       */
      getCreditById: (creditId) => {
        const { credits } = get();
        return credits.find(c => c.id === creditId);
      },

      /**
       * Get movements for a credit
       */
      getMovements: (creditId) => {
        const { movements } = get();
        return movements[creditId] || [];
      },

      /**
       * Get filtered credits
       */
      getFilteredCredits: () => {
        const { credits, filterType, sortBy } = get();
        
        let filtered = [...credits];
        
        // Apply type filter
        if (filterType !== 'all') {
          filtered = filtered.filter(c => c.type === filterType);
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
          switch (sortBy) {
            case 'name':
              return a.name.localeCompare(b.name);
            case 'balance':
              return (b.balance || 0) - (a.balance || 0);
            case 'type':
              return a.type.localeCompare(b.type);
            case 'limit':
              return (b.credit_limit || 0) - (a.credit_limit || 0);
            default:
              return 0;
          }
        });
        
        return filtered;
      },

      /**
       * Set filter type
       */
      setFilterType: (type) => {
        set({ filterType: type });
      },

      /**
       * Set sort by
       */
      setSortBy: (sortBy) => {
        set({ sortBy });
      },

      /**
       * Get upcoming payments
       */
      getUpcomingPayments: (days = 30) => {
        const { upcomingPayments } = get();
        return upcomingPayments.filter(p => p.daysUntil <= days);
      },

      /**
       * Get overdue payments
       */
      getOverduePayments: () => {
        const { upcomingPayments } = get();
        return upcomingPayments.filter(p => p.isOverdue);
      },

      /**
       * Get statistics
       */
      getStatistics: () => {
        const { credits, totalBalance, totalAvailableCredit, totalUtilization } = get();
        
        const byType = credits.reduce((acc, credit) => {
          const type = credit.type || 'other';
          if (!acc[type]) {
            acc[type] = { count: 0, balance: 0, limit: 0 };
          }
          acc[type].count++;
          acc[type].balance += credit.balance || 0;
          acc[type].limit += credit.credit_limit || 0;
          return acc;
        }, {});
        
        return {
          totalCredits: credits.length,
          activeCredits: credits.filter(c => c.is_active).length,
          totalBalance,
          totalAvailableCredit,
          totalUtilization,
          byType
        };
      },

      /**
       * Clear error
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset store
       */
      reset: () => {
        set({
          credits: [],
          movements: {},
          loading: false,
          error: null,
          totalBalance: 0,
          totalAvailableCredit: 0,
          totalUtilization: 0,
          upcomingPayments: [],
          filterType: 'all',
          sortBy: 'name'
        });
      }
    }),
    {
      name: 'credit-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist filter preferences
        filterType: state.filterType,
        sortBy: state.sortBy
      })
    }
  )
);

export default useCreditStore;
