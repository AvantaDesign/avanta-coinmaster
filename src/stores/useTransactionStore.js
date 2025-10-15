import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  fetchTransactions, 
  createTransaction, 
  updateTransaction, 
  deleteTransaction,
  restoreTransaction 
} from '../utils/api';

/**
 * Transaction Store using Zustand
 * 
 * Manages global state for transactions including:
 * - Transaction list and pagination
 * - Filters and search
 * - CRUD operations
 * - Loading and error states
 * - Statistics
 */
const useTransactionStore = create(
  persist(
    (set, get) => ({
      // State
      transactions: [],
      filteredTransactions: [],
      statistics: null,
      loading: false,
      error: null,
      
      // Filters
      filters: {
        category: 'all',
        searchTerm: '',
        type: 'all',
        account: 'all',
        transactionType: 'all',
        dateFrom: '',
        dateTo: '',
        showDeleted: false
      },
      
      // Sorting
      sortBy: 'date',
      sortOrder: 'desc',
      
      // Pagination
      pagination: {
        page: 1,
        perPage: 50,
        total: 0,
        totalPages: 0
      },

      // Selection for bulk operations
      selectedIds: [],

      /**
       * Load transactions from API
       */
      loadTransactions: async (params = {}) => {
        set({ loading: true, error: null });
        
        try {
          const { filters, sortBy, sortOrder, pagination } = get();
          
          // Build query parameters
          const queryParams = {
            include_stats: true,
            page: pagination.page,
            per_page: pagination.perPage,
            sort_by: sortBy,
            sort_order: sortOrder,
            ...params
          };
          
          // Apply filters
          if (filters.category !== 'all') queryParams.category = filters.category;
          if (filters.searchTerm) queryParams.search = filters.searchTerm;
          if (filters.type !== 'all') queryParams.type = filters.type;
          if (filters.account !== 'all') queryParams.account = filters.account;
          if (filters.transactionType !== 'all') queryParams.transaction_type = filters.transactionType;
          if (filters.dateFrom) queryParams.date_from = filters.dateFrom;
          if (filters.dateTo) queryParams.date_to = filters.dateTo;
          if (filters.showDeleted) queryParams.include_deleted = true;
          
          const result = await fetchTransactions(queryParams);
          
          // Handle API response format
          const transactions = result.data || result;
          const stats = result.statistics || null;
          const paginationData = result.pagination || {};
          
          set({ 
            transactions,
            filteredTransactions: transactions,
            statistics: stats,
            pagination: {
              ...get().pagination,
              total: paginationData.total || transactions.length,
              totalPages: paginationData.total_pages || 1
            },
            loading: false 
          });
          
          return transactions;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Create a new transaction
       */
      createTransaction: async (transactionData) => {
        set({ loading: true, error: null });
        
        try {
          const newTransaction = await createTransaction(transactionData);
          
          // Reload transactions to get updated list
          await get().loadTransactions();
          
          set({ loading: false });
          return newTransaction;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Update an existing transaction
       */
      updateTransaction: async (id, updates) => {
        set({ loading: true, error: null });
        
        try {
          const updatedTransaction = await updateTransaction(id, updates);
          
          // Update in local state
          const { transactions } = get();
          const updatedTransactions = transactions.map(t => 
            t.id === id ? { ...t, ...updates } : t
          );
          
          set({ 
            transactions: updatedTransactions,
            filteredTransactions: updatedTransactions,
            loading: false 
          });
          
          // Reload to ensure consistency
          await get().loadTransactions();
          
          return updatedTransaction;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Delete a transaction (soft delete)
       */
      deleteTransaction: async (id) => {
        set({ loading: true, error: null });
        
        try {
          await deleteTransaction(id);
          
          // Reload transactions
          await get().loadTransactions();
          
          set({ loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Restore a deleted transaction
       */
      restoreTransaction: async (id) => {
        set({ loading: true, error: null });
        
        try {
          await restoreTransaction(id);
          
          // Reload transactions
          await get().loadTransactions();
          
          set({ loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Bulk delete transactions
       */
      bulkDeleteTransactions: async (ids) => {
        set({ loading: true, error: null });
        
        try {
          await Promise.all(ids.map(id => deleteTransaction(id)));
          
          // Reload transactions
          await get().loadTransactions();
          
          set({ selectedIds: [], loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Bulk update transactions
       */
      bulkUpdateTransactions: async (ids, updates) => {
        set({ loading: true, error: null });
        
        try {
          await Promise.all(ids.map(id => {
            const transaction = get().transactions.find(t => t.id === id);
            return updateTransaction(id, { ...transaction, ...updates });
          }));
          
          // Reload transactions
          await get().loadTransactions();
          
          set({ selectedIds: [], loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      /**
       * Set filters
       */
      setFilters: (newFilters) => {
        set({ 
          filters: { ...get().filters, ...newFilters },
          pagination: { ...get().pagination, page: 1 } // Reset to page 1 when filtering
        });
        
        // Reload with new filters
        get().loadTransactions();
      },

      /**
       * Update a single filter
       */
      setFilter: (key, value) => {
        set({ 
          filters: { ...get().filters, [key]: value },
          pagination: { ...get().pagination, page: 1 }
        });
        
        // Reload with new filter
        get().loadTransactions();
      },

      /**
       * Clear all filters
       */
      clearFilters: () => {
        set({ 
          filters: {
            category: 'all',
            searchTerm: '',
            type: 'all',
            account: 'all',
            transactionType: 'all',
            dateFrom: '',
            dateTo: '',
            showDeleted: false
          },
          pagination: { ...get().pagination, page: 1 }
        });
        
        // Reload with cleared filters
        get().loadTransactions();
      },

      /**
       * Set sorting
       */
      setSorting: (sortBy, sortOrder) => {
        set({ sortBy, sortOrder });
        
        // Reload with new sorting
        get().loadTransactions();
      },

      /**
       * Set page
       */
      setPage: (page) => {
        set({ 
          pagination: { ...get().pagination, page }
        });
        
        // Reload with new page
        get().loadTransactions();
      },

      /**
       * Set items per page
       */
      setPerPage: (perPage) => {
        set({ 
          pagination: { ...get().pagination, perPage, page: 1 }
        });
        
        // Reload with new per page
        get().loadTransactions();
      },

      /**
       * Selection management
       */
      setSelectedIds: (ids) => {
        set({ selectedIds: ids });
      },

      selectTransaction: (id) => {
        const { selectedIds } = get();
        if (!selectedIds.includes(id)) {
          set({ selectedIds: [...selectedIds, id] });
        }
      },

      deselectTransaction: (id) => {
        const { selectedIds } = get();
        set({ selectedIds: selectedIds.filter(sid => sid !== id) });
      },

      toggleTransactionSelection: (id) => {
        const { selectedIds } = get();
        if (selectedIds.includes(id)) {
          get().deselectTransaction(id);
        } else {
          get().selectTransaction(id);
        }
      },

      selectAllTransactions: () => {
        const { filteredTransactions } = get();
        set({ selectedIds: filteredTransactions.map(t => t.id) });
      },

      clearSelection: () => {
        set({ selectedIds: [] });
      },

      /**
       * Get transaction by ID
       */
      getTransactionById: (id) => {
        const { transactions } = get();
        return transactions.find(t => t.id === id);
      },

      /**
       * Get filtered and sorted transactions
       */
      getFilteredTransactions: () => {
        return get().filteredTransactions;
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
          transactions: [],
          filteredTransactions: [],
          statistics: null,
          loading: false,
          error: null,
          filters: {
            category: 'all',
            searchTerm: '',
            type: 'all',
            account: 'all',
            transactionType: 'all',
            dateFrom: '',
            dateTo: '',
            showDeleted: false
          },
          sortBy: 'date',
          sortOrder: 'desc',
          pagination: {
            page: 1,
            perPage: 50,
            total: 0,
            totalPages: 0
          },
          selectedIds: []
        });
      }
    }),
    {
      name: 'transaction-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist filters and sorting preferences
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        pagination: {
          perPage: state.pagination.perPage
        }
      })
    }
  )
);

export default useTransactionStore;
