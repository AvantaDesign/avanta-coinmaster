import { useState, useEffect, useRef } from 'react';
import { PlusCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * SelectWithCreate Component - Phase 27: Advanced Usability Enhancements
 * 
 * A dropdown select component with inline creation capability.
 * Allows users to create new items without leaving the current form.
 * 
 * Props:
 * - label: Input label text
 * - value: Currently selected value
 * - onChange: Callback when selection changes
 * - options: Array of {value, label} options
 * - onCreate: Async callback to create new item, receives (data) => Promise<newItem>
 * - createLabel: Label for "Create new" option (default: "Crear nuevo...")
 * - createFields: Array of field configs for creation modal [{name, label, type, required, placeholder}]
 * - placeholder: Placeholder text
 * - required: Whether field is required
 * - disabled: Whether field is disabled
 * - error: Error message to display
 * - emptyMessage: Message when no options available
 */
export default function SelectWithCreate({
  label,
  value,
  onChange,
  options = [],
  onCreate,
  createLabel = 'Crear nuevo...',
  createFields = [{ name: 'name', label: 'Nombre', type: 'text', required: true }],
  placeholder = 'Seleccionar...',
  required = false,
  disabled = false,
  error = null,
  emptyMessage = 'No hay opciones disponibles',
  className = ''
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [formData, setFormData] = useState({});
  const firstInputRef = useRef(null);

  // Initialize form data when modal opens
  useEffect(() => {
    if (showCreateModal) {
      const initialData = {};
      createFields.forEach(field => {
        initialData[field.name] = '';
      });
      setFormData(initialData);
      setCreateError(null);
      
      // Focus first input
      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 100);
    }
  }, [showCreateModal, createFields]);

  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === '__create_new__') {
      setShowCreateModal(true);
    } else {
      onChange(selectedValue);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      // Validate required fields
      for (const field of createFields) {
        if (field.required && !formData[field.name]?.trim()) {
          setCreateError(`El campo "${field.label}" es requerido`);
          setCreating(false);
          return;
        }
      }

      // Call onCreate callback
      const newItem = await onCreate(formData);
      
      // Select the newly created item
      onChange(newItem.id || newItem.value);
      
      // Close modal
      setShowCreateModal(false);
      setFormData({});
    } catch (err) {
      console.error('Error creating item:', err);
      setCreateError(err.message || 'Error al crear el elemento');
    } finally {
      setCreating(false);
    }
  };

  const handleFormChange = (fieldName, fieldValue) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: fieldValue
    }));
  };

  const closeModal = () => {
    if (!creating) {
      setShowCreateModal(false);
      setFormData({});
      setCreateError(null);
    }
  };

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Dropdown */}
      <select
        value={value || ''}
        onChange={handleSelectChange}
        required={required}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md 
          bg-white dark:bg-slate-800 
          border-gray-300 dark:border-slate-600 
          text-gray-900 dark:text-white
          focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 dark:border-red-400' : ''}`}
      >
        <option value="">{placeholder}</option>
        
        {options.length === 0 ? (
          <option disabled>{emptyMessage}</option>
        ) : (
          options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        )}
        
        {/* Create new option - only if onCreate is provided */}
        {onCreate && (
          <option value="__create_new__" className="font-semibold text-blue-600">
            ➕ {createLabel}
          </option>
        )}
      </select>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {createLabel}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={creating}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} className="p-4">
              {createError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 rounded">
                  {createError}
                </div>
              )}

              {/* Dynamic Form Fields */}
              <div className="space-y-4">
                {createFields.map((field, index) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {field.type === 'textarea' ? (
                      <textarea
                        ref={index === 0 ? firstInputRef : null}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFormChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-md 
                          bg-white dark:bg-slate-700 
                          border-gray-300 dark:border-slate-600 
                          text-gray-900 dark:text-white
                          focus:ring-2 focus:ring-blue-500"
                      />
                    ) : field.type === 'select' && field.options ? (
                      <select
                        ref={index === 0 ? firstInputRef : null}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFormChange(field.name, e.target.value)}
                        required={field.required}
                        className="w-full px-3 py-2 border rounded-md 
                          bg-white dark:bg-slate-700 
                          border-gray-300 dark:border-slate-600 
                          text-gray-900 dark:text-white
                          focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar...</option>
                        {field.options.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'color' ? (
                      <div className="flex items-center gap-2">
                        <input
                          ref={index === 0 ? firstInputRef : null}
                          type="color"
                          value={formData[field.name] || '#3B82F6'}
                          onChange={(e) => handleFormChange(field.name, e.target.value)}
                          className="h-10 w-20 rounded border border-gray-300 dark:border-slate-600"
                        />
                        <input
                          type="text"
                          value={formData[field.name] || '#3B82F6'}
                          onChange={(e) => handleFormChange(field.name, e.target.value)}
                          placeholder="#3B82F6"
                          pattern="^#[0-9A-Fa-f]{6}$"
                          className="flex-1 px-3 py-2 border rounded-md 
                            bg-white dark:bg-slate-700 
                            border-gray-300 dark:border-slate-600 
                            text-gray-900 dark:text-white
                            focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <input
                        ref={index === 0 ? firstInputRef : null}
                        type={field.type || 'text'}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFormChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        className="w-full px-3 py-2 border rounded-md 
                          bg-white dark:bg-slate-700 
                          border-gray-300 dark:border-slate-600 
                          text-gray-900 dark:text-white
                          focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                    
                    {field.help && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {field.help}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={creating}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md 
                    text-gray-700 dark:text-gray-300 
                    hover:bg-gray-50 dark:hover:bg-slate-700 
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md 
                    hover:bg-blue-700 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <PlusCircleIcon className="w-5 h-5" />
                      Crear
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
