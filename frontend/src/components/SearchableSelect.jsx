import React, { useEffect, useRef, useState } from 'react';

const SearchableSelect = ({
  label,
  name,
  value,
  placeholder,
  options,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const match = options.find(
      option => option.value === value || option.label === value
    );
    if (match) {
      setInputValue(match.label);
    } else {
      setInputValue(value || '');
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => {
    if (!inputValue) return true;
    const search = inputValue.toLowerCase();
    return option.label.toLowerCase().startsWith(search) || option.value.toLowerCase().startsWith(search);
  });

  const handleInputChange = (event) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onChange({ target: { name, value: newValue } });
    setIsOpen(true);
  };

  const handleOptionSelect = (option) => {
    setInputValue(option.label);
    onChange({ target: { name, value: option.value } });
    setIsOpen(false);
  };

  return (
    <div className='form-row'>
      <label>{label}</label>
      <div className='combo-wrapper' ref={containerRef}>
        <input
          type='text'
          className='form-select combo-input'
          name={name}
          value={inputValue}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          ref={inputRef}
        />
        <span
          className={`combo-arrow ${isOpen ? 'open' : ''}`}
          onClick={() => {
            setIsOpen(prev => {
              const next = !prev;
              if (!prev && inputRef.current) {
                inputRef.current.focus();
              }
              return next;
            });
          }}
          role="presentation"
        />
        {isOpen && (
          <div className='combo-options'>
            {filteredOptions.length === 0 ? (
              <div className='combo-option combo-option-empty'>No matches</div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  className='combo-option'
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleOptionSelect(option)}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;
