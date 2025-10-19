import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

/**
 * TagInput Component - Phase 27: Advanced Usability Enhancements
 * 
 * A component for managing tags on entities with autocomplete and inline creation.
 * 
 * Props:
 * - entityType: Type of entity ('transaction', 'account', 'budget', etc.)
 * - entityId: ID of the entity
 * - tags: Current tags array [{id, name, color}]
 * - onTagsChange: Callback when tags change (tagIds)
 * - onCreateTag: Callback to create new tag, receives (tagData) => Promise<newTag>
 * - availableTags: Array of available tags to choose from
 * - disabled: Whether input is disabled
 * - maxTags: Maximum number of tags allowed
 * - placeholder: Placeholder text
 */
export default function TagInput({
  entityType,
  entityId,
  tags = [],
  onTagsChange,
  onCreateTag,
  availableTags = [],
  disabled = false,
  maxTags = 10,
  placeholder = 'Agregar etiqueta...'
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredTags, setFilteredTags] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCreateOption, setShowCreateOption] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Filter available tags based on input and already selected tags
  useEffect(() => {
    if (!inputValue || !showSuggestions) {
      setFilteredTags([]);
      setShowCreateOption(false);
      return;
    }

    const currentTagIds = tags.map(t => t.id);
    const filtered = availableTags.filter(tag => 
      !currentTagIds.includes(tag.id) &&
      tag.name.toLowerCase().includes(inputValue.toLowerCase())
    );

    setFilteredTags(filtered);
    
    // Show create option if no exact match exists
    const exactMatch = filtered.some(tag => 
      tag.name.toLowerCase() === inputValue.toLowerCase()
    );
    setShowCreateOption(!exactMatch && inputValue.trim().length > 0);
    
    setSelectedIndex(0);
  }, [inputValue, showSuggestions, availableTags, tags]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    if (inputValue || availableTags.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputKeyDown = (e) => {
    if (!showSuggestions) return;

    const totalOptions = filteredTags.length + (showCreateOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalOptions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalOptions) % totalOptions);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex < filteredTags.length) {
          handleSelectTag(filteredTags[selectedIndex]);
        } else if (showCreateOption) {
          handleCreateNewTag();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setInputValue('');
        break;
    }
  };

  const handleSelectTag = (tag) => {
    if (tags.length >= maxTags) {
      return;
    }

    const newTags = [...tags, tag];
    onTagsChange(newTags.map(t => t.id));
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagId) => {
    const newTags = tags.filter(t => t.id !== tagId);
    onTagsChange(newTags.map(t => t.id));
  };

  const handleCreateNewTag = async () => {
    if (!inputValue.trim() || !onCreateTag) return;

    try {
      const newTag = await onCreateTag({
        name: inputValue.trim(),
        color: '#3B82F6',
        category: entityType
      });

      handleSelectTag(newTag);
    } catch (error) {
      console.error('Error creating tag:', error);
      alert('Error al crear la etiqueta: ' + error.message);
    }
  };

  return (
    <div className="relative">
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: tag.color + '20',
              color: tag.color,
              border: `1px solid ${tag.color}40`
            }}
          >
            {tag.name}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:opacity-70 focus:outline-none"
                aria-label={`Remover ${tag.name}`}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Input Field */}
      {!disabled && tags.length < maxTags && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-md 
              bg-white dark:bg-slate-800 
              border-gray-300 dark:border-slate-600 
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
              disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && (filteredTags.length > 0 || showCreateOption) && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 
                border border-gray-300 dark:border-slate-600 
                rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {/* Existing Tags */}
              {filteredTags.map((tag, index) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleSelectTag(tag)}
                  className={`w-full text-left px-4 py-2 flex items-center gap-2
                    ${index === selectedIndex 
                      ? 'bg-blue-50 dark:bg-blue-900/30' 
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700'}
                    transition-colors`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-gray-900 dark:text-white">
                    {tag.name}
                  </span>
                  {tag.usage_count > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {tag.usage_count} usos
                    </span>
                  )}
                </button>
              ))}

              {/* Create New Option */}
              {showCreateOption && onCreateTag && (
                <button
                  type="button"
                  onClick={handleCreateNewTag}
                  className={`w-full text-left px-4 py-2 flex items-center gap-2 border-t 
                    border-gray-200 dark:border-slate-600
                    ${selectedIndex === filteredTags.length 
                      ? 'bg-blue-50 dark:bg-blue-900/30' 
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700'}
                    transition-colors`}
                >
                  <PlusIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="flex-1 text-blue-600 dark:text-blue-400 font-medium">
                    Crear "{inputValue}"
                  </span>
                </button>
              )}

              {/* Empty State */}
              {filteredTags.length === 0 && !showCreateOption && (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No se encontraron etiquetas
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Max Tags Warning */}
      {tags.length >= maxTags && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Máximo de {maxTags} etiquetas alcanzado
        </p>
      )}
    </div>
  );
}
