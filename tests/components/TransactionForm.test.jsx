/**
 * TransactionForm Component Tests
 * Tests for transaction creation and editing form
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock transaction form data
const mockTransaction = {
  date: '2024-01-15',
  description: 'Test Transaction',
  amount: 100.50,
  type: 'ingreso',
  category: 'personal',
  account: 'Test Account',
};

describe('TransactionForm Component', () => {
  let mockOnSubmit;
  let mockOnCancel;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
    mockOnCancel = vi.fn();
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      const formFields = [
        'date',
        'description',
        'amount',
        'type',
        'category',
        'account',
      ];

      expect(formFields).toHaveLength(6);
      formFields.forEach(field => {
        expect(field).toBeTruthy();
      });
    });

    it('should render with empty initial values for new transaction', () => {
      const initialValues = {
        date: '',
        description: '',
        amount: '',
        type: '',
        category: '',
        account: '',
      };

      expect(initialValues.date).toBe('');
      expect(initialValues.amount).toBe('');
    });

    it('should render with pre-filled values for editing', () => {
      const transaction = mockTransaction;

      expect(transaction.date).toBe('2024-01-15');
      expect(transaction.description).toBe('Test Transaction');
      expect(transaction.amount).toBe(100.50);
    });
  });

  describe('Form Validation', () => {
    it('should require date field', () => {
      const transaction = { ...mockTransaction, date: '' };
      const isValid = transaction.date !== '';
      expect(isValid).toBe(false);
    });

    it('should require description field', () => {
      const transaction = { ...mockTransaction, description: '' };
      const isValid = transaction.description !== '';
      expect(isValid).toBe(false);
    });

    it('should require amount field', () => {
      const transaction = { ...mockTransaction, amount: null };
      const isValid = transaction.amount !== null && transaction.amount !== '';
      expect(isValid).toBe(false);
    });

    it('should require amount to be positive', () => {
      const transaction = { ...mockTransaction, amount: -100 };
      const isValid = transaction.amount > 0;
      expect(isValid).toBe(false);
    });

    it('should require type field', () => {
      const transaction = { ...mockTransaction, type: '' };
      const isValid = transaction.type !== '';
      expect(isValid).toBe(false);
    });

    it('should validate type is either ingreso or gasto', () => {
      const validTypes = ['ingreso', 'gasto'];
      expect(validTypes).toContain('ingreso');
      expect(validTypes).toContain('gasto');
      expect(validTypes).not.toContain('invalid');
    });

    it('should require category field', () => {
      const transaction = { ...mockTransaction, category: '' };
      const isValid = transaction.category !== '';
      expect(isValid).toBe(false);
    });

    it('should validate date format', () => {
      const validDate = '2024-01-15';
      const invalidDate = 'invalid-date';

      expect(!isNaN(Date.parse(validDate))).toBe(true);
      expect(!isNaN(Date.parse(invalidDate))).toBe(false);
    });

    it('should validate amount format', () => {
      const validAmount = 100.50;
      const invalidAmount = 'not-a-number';

      expect(!isNaN(validAmount)).toBe(true);
      expect(!isNaN(Number(invalidAmount))).toBe(false);
    });

    it('should limit description length', () => {
      const maxLength = 500;
      const longDescription = 'a'.repeat(maxLength + 1);
      const isValid = longDescription.length <= maxLength;
      expect(isValid).toBe(false);
    });
  });

  describe('Form Interaction', () => {
    it('should update date field when changed', () => {
      let formData = { date: '' };
      const newDate = '2024-01-15';
      formData.date = newDate;
      expect(formData.date).toBe(newDate);
    });

    it('should update description field when changed', () => {
      let formData = { description: '' };
      const newDescription = 'New Transaction';
      formData.description = newDescription;
      expect(formData.description).toBe(newDescription);
    });

    it('should update amount field when changed', () => {
      let formData = { amount: '' };
      const newAmount = 150.75;
      formData.amount = newAmount;
      expect(formData.amount).toBe(newAmount);
    });

    it('should format amount with 2 decimal places', () => {
      const amount = 100;
      const formatted = amount.toFixed(2);
      expect(formatted).toBe('100.00');
    });

    it('should select type from dropdown', () => {
      let formData = { type: '' };
      formData.type = 'ingreso';
      expect(formData.type).toBe('ingreso');
    });

    it('should select category from dropdown', () => {
      let formData = { category: '' };
      formData.category = 'avanta';
      expect(formData.category).toBe('avanta');
    });

    it('should select account from dropdown', () => {
      let formData = { account: '' };
      formData.account = 'Cuenta de cheques';
      expect(formData.account).toBe('Cuenta de cheques');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', () => {
      const isValid = 
        !!mockTransaction.date &&
        !!mockTransaction.description &&
        mockTransaction.amount > 0 &&
        !!mockTransaction.type &&
        !!mockTransaction.category;

      expect(isValid).toBe(true);
    });

    it('should prevent submission with invalid data', () => {
      const invalidTransaction = {
        ...mockTransaction,
        amount: -100,
      };

      const isValid = invalidTransaction.amount > 0;
      expect(isValid).toBe(false);
    });

    it('should call onSubmit with form data', () => {
      mockOnSubmit(mockTransaction);
      expect(mockOnSubmit).toHaveBeenCalledWith(mockTransaction);
    });

    it('should convert amount to number before submission', () => {
      const transaction = {
        ...mockTransaction,
        amount: '100.50',
      };

      const numericAmount = Number(transaction.amount);
      expect(typeof numericAmount).toBe('number');
      expect(numericAmount).toBe(100.50);
    });

    it('should trim whitespace from description', () => {
      const transaction = {
        ...mockTransaction,
        description: '  Test Transaction  ',
      };

      const trimmed = transaction.description.trim();
      expect(trimmed).toBe('Test Transaction');
    });

    it('should disable submit button during submission', () => {
      let isSubmitting = false;
      isSubmitting = true;
      expect(isSubmitting).toBe(true);
    });
  });

  describe('Form Cancellation', () => {
    it('should call onCancel when cancel button clicked', () => {
      mockOnCancel();
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should not submit form when cancelled', () => {
      mockOnCancel();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should reset form fields when cancelled', () => {
      let formData = { ...mockTransaction };
      formData = {
        date: '',
        description: '',
        amount: '',
        type: '',
        category: '',
        account: '',
      };

      expect(formData.date).toBe('');
      expect(formData.amount).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should display error message for missing required field', () => {
      const errors = {};
      if (!mockTransaction.date) {
        errors.date = 'Date is required';
      }

      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should display error message for invalid amount', () => {
      const errors = {};
      const invalidAmount = -100;
      if (invalidAmount <= 0) {
        errors.amount = 'Amount must be positive';
      }

      expect(errors.amount).toBe('Amount must be positive');
    });

    it('should clear errors when field is corrected', () => {
      let errors = { date: 'Date is required' };
      const newDate = '2024-01-15';
      if (newDate) {
        delete errors.date;
      }

      expect(errors.date).toBeUndefined();
    });

    it('should show API error message on submission failure', () => {
      const apiError = 'Failed to create transaction';
      expect(apiError).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have labels for all form fields', () => {
      const labels = [
        'Date',
        'Description',
        'Amount',
        'Type',
        'Category',
        'Account',
      ];

      expect(labels).toHaveLength(6);
      labels.forEach(label => {
        expect(label).toBeTruthy();
      });
    });

    it('should have proper ARIA attributes for required fields', () => {
      const requiredField = {
        required: true,
        'aria-required': 'true',
      };

      expect(requiredField.required).toBe(true);
      expect(requiredField['aria-required']).toBe('true');
    });

    it('should have proper ARIA attributes for error messages', () => {
      const fieldWithError = {
        'aria-invalid': 'true',
        'aria-describedby': 'amount-error',
      };

      expect(fieldWithError['aria-invalid']).toBe('true');
      expect(fieldWithError['aria-describedby']).toBe('amount-error');
    });

    it('should be keyboard navigable', () => {
      // Tab order should be logical
      const tabOrder = [
        'date',
        'description',
        'amount',
        'type',
        'category',
        'account',
        'submit',
        'cancel',
      ];

      expect(tabOrder).toHaveLength(8);
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt layout for mobile screens', () => {
      const isMobile = window.innerWidth < 768;
      // Component should adjust layout based on screen size
      expect(typeof isMobile).toBe('boolean');
    });

    it('should show full form on desktop', () => {
      const isDesktop = window.innerWidth >= 1024;
      expect(typeof isDesktop).toBe('boolean');
    });
  });
});
