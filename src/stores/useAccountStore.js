import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  fetchAccounts, 
  createAccount, 
  updateAccount, 
  deleteAccount 
} from '../utils/api';

/**
 * Account Store using Zustand
 * 
 * Manages global state for accounts including:
 * - Account list and balances
 * - CRUD operations
 * - Loading and error states
 * - Account statistics
 */
const useAccountStore = create(
  persist(
    (set, get) => ({
      // State
      accounts: [],
      loading: false,
      error: null,
      
      // Statistics
      totalBalance: 0,
      totalIncome: 0,
      totalExpenses: 0,

      /**
       * Load accounts from API
       */
      loadAccounts: async (params = {}) => {
        set({ loading: true, error: null });
        
        try {
          const result = await fetchAccounts(params);
          const accounts = result.data || result;
          
          // Calculate statistics
          const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
          
          set({ 
            accounts,
            totalBalance,
            loading: false 
          });
          
          return accounts;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Create a new account
       */
      createAccount: async (accountData) => {
        set({ loading: true, error: null });
        
        try {
          const newAccount = await createAccount(accountData);
          
          // Add to local state
          const { accounts } = get();
          const updatedAccounts = [...accounts, newAccount];
          
          // Recalculate statistics
          const totalBalance = updatedAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
          
          set({ 
            accounts: updatedAccounts,
            totalBalance,
            loading: false 
          });
          
          return newAccount;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Update an existing account
       */
      updateAccount: async (id, updates) => {
        set({ loading: true, error: null });
        
        try {
          const updatedAccount = await updateAccount(id, updates);
          
          // Update in local state
          const { accounts } = get();
          const updatedAccounts = accounts.map(acc => 
            acc.id === id ? { ...acc, ...updates } : acc
          );
          
          // Recalculate statistics
          const totalBalance = updatedAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
          
          set({ 
            accounts: updatedAccounts,
            totalBalance,
            loading: false 
          });
          
          return updatedAccount;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Delete an account
       */
      deleteAccount: async (id) => {
        set({ loading: true, error: null });
        
        try {
          await deleteAccount(id);
          
          // Remove from local state
          const { accounts } = get();
          const updatedAccounts = accounts.filter(acc => acc.id !== id);
          
          // Recalculate statistics
          const totalBalance = updatedAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
          
          set({ 
            accounts: updatedAccounts,
            totalBalance,
            loading: false 
          });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Update account balance
       */
      updateAccountBalance: (accountId, balanceChange) => {
        const { accounts } = get();
        const updatedAccounts = accounts.map(acc => 
          acc.id === accountId 
            ? { ...acc, balance: (acc.balance || 0) + balanceChange }
            : acc
        );
        
        // Recalculate statistics
        const totalBalance = updatedAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
        
        set({ accounts: updatedAccounts, totalBalance });
      },

      /**
       * Get account by ID
       */
      getAccountById: (id) => {
        const { accounts } = get();
        return accounts.find(acc => acc.id === id);
      },

      /**
       * Get account by name
       */
      getAccountByName: (name) => {
        const { accounts } = get();
        return accounts.find(acc => acc.name === name);
      },

      /**
       * Get accounts by type
       */
      getAccountsByType: (type) => {
        const { accounts } = get();
        return accounts.filter(acc => acc.type === type);
      },

      /**
       * Get active accounts
       */
      getActiveAccounts: () => {
        const { accounts } = get();
        return accounts.filter(acc => acc.is_active !== false);
      },

      /**
       * Calculate total balance
       */
      calculateTotalBalance: () => {
        const { accounts } = get();
        return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      },

      /**
       * Calculate balance by type
       */
      calculateBalanceByType: (type) => {
        const { accounts } = get();
        return accounts
          .filter(acc => acc.type === type)
          .reduce((sum, acc) => sum + (acc.balance || 0), 0);
      },

      /**
       * Get account statistics
       */
      getStatistics: () => {
        const { accounts } = get();
        
        const byType = accounts.reduce((acc, account) => {
          const type = account.type || 'other';
          if (!acc[type]) {
            acc[type] = { count: 0, balance: 0 };
          }
          acc[type].count++;
          acc[type].balance += account.balance || 0;
          return acc;
        }, {});
        
        return {
          totalAccounts: accounts.length,
          totalBalance: accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
          byType,
          activeAccounts: accounts.filter(acc => acc.is_active !== false).length
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
          accounts: [],
          loading: false,
          error: null,
          totalBalance: 0,
          totalIncome: 0,
          totalExpenses: 0
        });
      }
    }),
    {
      name: 'account-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Don't persist any account data (it should be loaded fresh from API)
      })
    }
  )
);

export default useAccountStore;
