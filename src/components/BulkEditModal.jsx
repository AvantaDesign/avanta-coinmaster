import { useState, useEffect } from 'react';
import { showSuccess, showError } from '../utils/notifications';

/**
 * BulkEditModal Component
 * 
 * Allows users to edit multiple transactions at once
 * Supports changing type, category, account, description, and other fields
 */
export default function BulkEditModal({ 
  isOpen, 
  onClose, 
  selectedTransactions, 
  onUpdate,
  categories = [],
  accounts = []
}) {
  const [editMode, setEditMode] = useState('update'); // 'update' or 'replace'
  const [formData, setFormData] = useState({
    transaction_type: '',
    category: '',
    account: '',
    description_find: '',
    description_replace: '',
    is_deductible: '',
    notes: '',
  });
  const [preview, setPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && selectedTransactions.length > 0) {
      generatePreview();
    }
  }, [formData, selectedTransactions, isOpen]);

  const generatePreview = () => {
    const previewData = selectedTransactions.map(transaction => {
      const updated = { ...transaction };
      
      // Apply updates based on form data
      if (formData.transaction_type) {
        updated.transaction_type = formData.transaction_type;
      }
      if (formData.category) {
        updated.category = formData.category;
      }
      if (formData.account) {
        updated.account = formData.account;
      }
      if (formData.description_find && formData.description_replace) {
        updated.description = updated.description.replace(
          new RegExp(formData.description_find, 'gi'),
          formData.description_replace
        );
      }
      if (formData.is_deductible !== '') {
        updated.is_deductible = parseInt(formData.is_deductible);
      }
      if (formData.notes && editMode === 'replace') {
        updated.notes = formData.notes;
      } else if (formData.notes && editMode === 'update') {
        updated.notes = (updated.notes || '') + '\n' + formData.notes;
      }
      
      return updated;
    });
    
    setPreview(previewData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const hasChanges = () => {
    return Object.values(formData).some(value => value !== '');
  };

  const handleApply = async () => {
    if (!hasChanges()) {
      showError('Please select at least one field to update');
      return;
    }

    setProcessing(true);
    try {
      // Prepare bulk update data
      const updates = selectedTransactions.map(transaction => {
        const updateData = { id: transaction.id };
        
        if (formData.transaction_type) {
          updateData.transaction_type = formData.transaction_type;
        }
        if (formData.category) {
          updateData.category = formData.category;
        }
        if (formData.account) {
          updateData.account = formData.account;
        }
        if (formData.description_find && formData.description_replace) {
          updateData.description = transaction.description.replace(
            new RegExp(formData.description_find, 'gi'),
            formData.description_replace
          );
        }
        if (formData.is_deductible !== '') {
          updateData.is_deductible = parseInt(formData.is_deductible);
        }
        if (formData.notes) {
          if (editMode === 'replace') {
            updateData.notes = formData.notes;
          } else {
            updateData.notes = (transaction.notes || '') + '\n' + formData.notes;
          }
        }
        
        return updateData;
      });

      // Send bulk update request
      const response = await fetch('/api/transactions/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update transactions');
      }

      const result = await response.json();
      
      showSuccess(
        `Successfully updated ${result.successful || selectedTransactions.length} transaction(s)`
      );
      
      if (result.failed && result.failed.length > 0) {
        showError(`Failed to update ${result.failed.length} transaction(s)`);
      }

      // Reset form and close
      setFormData({
        transaction_type: '',
        category: '',
        account: '',
        description_find: '',
        description_replace: '',
        is_deductible: '',
        notes: '',
      });
      setShowPreview(false);
      onUpdate();
      onClose();
    } catch (error) {
      showError(`Error updating transactions: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bulk Edit Transactions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Editing {selectedTransactions.length} transaction(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Edit Mode Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Edit Mode
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="update"
                  checked={editMode === 'update'}
                  onChange={(e) => setEditMode(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Update (add to existing)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="replace"
                  checked={editMode === 'replace'}
                  onChange={(e) => setEditMode(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Replace (overwrite existing)</span>
              </label>
            </div>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <select
              value={formData.transaction_type}
              onChange={(e) => handleChange('transaction_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Change</option>
              <option value="personal">Personal</option>
              <option value="business">Business</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Change</option>
              <option value="personal">Personal</option>
              <option value="avanta">Avanta</option>
            </select>
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account
            </label>
            <select
              value={formData.account}
              onChange={(e) => handleChange('account', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Change</option>
              {accounts.map(account => (
                <option key={account.id} value={account.name}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description Find & Replace */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Find Text in Description
              </label>
              <input
                type="text"
                value={formData.description_find}
                onChange={(e) => handleChange('description_find', e.target.value)}
                placeholder="Text to find..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Replace With
              </label>
              <input
                type="text"
                value={formData.description_replace}
                onChange={(e) => handleChange('description_replace', e.target.value)}
                placeholder="Replacement text..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.description_find}
              />
            </div>
          </div>

          {/* Is Deductible */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deductible
            </label>
            <select
              value={formData.is_deductible}
              onChange={(e) => handleChange('is_deductible', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Change</option>
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes {editMode === 'update' ? '(will be appended)' : '(will replace)'}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add notes..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Preview Toggle */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              disabled={!hasChanges()}
            >
              {showPreview ? 'Hide' : 'Show'} Preview ({preview.length} transactions)
            </button>
          </div>

          {/* Preview Section */}
          {showPreview && hasChanges() && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <h3 className="font-medium text-gray-900 mb-3">Preview Changes</h3>
              <div className="space-y-2">
                {preview.slice(0, 10).map((transaction, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-gray-200 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-gray-500">Description:</p>
                        <p className="font-medium">{transaction.description}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Type:</p>
                        <p className="font-medium">{transaction.transaction_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Category:</p>
                        <p className="font-medium">{transaction.category}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Account:</p>
                        <p className="font-medium">{transaction.account || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {preview.length > 10 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    ...and {preview.length - 10} more transactions
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!hasChanges() || processing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? 'Updating...' : 'Apply Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
