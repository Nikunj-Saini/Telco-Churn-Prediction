import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const CustomDropdown = ({
  value,
  onChange,
  options = [],
  allLabel = 'All',
  icon: Icon = null,
  isMulti = false,
  className = ''
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);

  // Normalize value array for multi-select
  const selectedValues = useMemo(() => {
    if (!isMulti) return [];
    if (!value) return [];
    const rawItems = Array.isArray(value) ? value : String(value).split(',');
    const cleaned = rawItems
      .flatMap(v => String(v).split(','))
      .map(v => String(v).trim())
      .filter(v => v !== '');
    return Array.from(new Set(cleaned));
  }, [isMulti, value]);

  // Normalized list of selectable items (including 'All')
  const allItems = useMemo(() => {
    const items = [{ value: '', label: allLabel }];
    options.forEach(opt => {
      if (typeof opt === 'object') {
        items.push({ value: String(opt.value), label: opt.label });
      } else {
        items.push({ value: String(opt), label: String(opt) });
      }
    });
    return items;
  }, [options, allLabel]);

  // Sync highlighted index
  useEffect(() => {
    if (isOpen) {
      if (isMulti) {
        setHighlightedIndex(0);
      } else {
        const idx = allItems.findIndex(item => item.value === String(value || ''));
        setHighlightedIndex(idx !== -1 ? idx : 0);
      }
    }
  }, [isOpen, value, allItems, isMulti]);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute trigger label for multi-select vs single-select
  const triggerLabel = useMemo(() => {
    if (!isMulti) {
      const selectedItem = allItems.find(item => item.value === String(value || ''));
      return selectedItem ? selectedItem.label : allLabel;
    }

    if (selectedValues.length === 0) return allLabel;

    const labels = selectedValues.map(v => {
      const found = allItems.find(item => item.value === v);
      return found ? found.label : v;
    });

    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]}, ${labels[1]}`;
    return `${labels[0]}, ${labels[1]} +${labels.length - 2}`;
  }, [isMulti, value, selectedValues, allItems, allLabel]);

  const isSelected = isMulti ? selectedValues.length > 0 : !!value && value !== '';

  const handleOptionClick = (itemValue) => {
    if (!isMulti) {
      onChange(itemValue);
      setIsOpen(false);
      return;
    }

    if (itemValue === '') {
      // Clicked 'All' -> clear all selections
      onChange([]);
      return;
    }

    const strVal = String(itemValue).trim();
    if (selectedValues.includes(strVal)) {
      const updated = selectedValues.filter(v => v !== strVal);
      onChange(updated);
    } else {
      const updated = [...selectedValues, strVal];
      onChange(updated);
    }
  };

  return (
    <div
      className={`relative select-none ${className}`}
      ref={dropdownRef}
    >

      {/* Dropdown Button Trigger */}
      <button
        ref={triggerRef}
        type="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 outline-none group ${isOpen
            ? isDark
              ? 'bg-[#121620] border-[#2dd4bf] text-white ring-2 ring-[#2dd4bf]/20 shadow-lg'
              : 'bg-white border-teal-500 text-slate-900 ring-2 ring-teal-500/20 shadow-md'
            : isSelected
              ? isDark
                ? 'bg-[#0f241e] border-[#2dd4bf]/50 text-[#2dd4bf]'
                : 'bg-teal-50 border-teal-400 text-teal-800'
              : isDark
                ? 'bg-[#07090d] border-[#1e2430] text-slate-300 hover:bg-[#0d1017] hover:text-white hover:border-[#2a3444]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
          }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? (isDark ? 'text-[#2dd4bf]' : 'text-teal-600') : 'text-slate-400'}`} />}
          <span className="truncate">{triggerLabel}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isMulti && selectedValues.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black font-mono ${isDark ? 'bg-[#2dd4bf]/20 text-[#2dd4bf]' : 'bg-teal-600 text-white'
              }`}>
              {selectedValues.length}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen
                ? 'rotate-180 text-[#2dd4bf]'
                : isSelected
                  ? (isDark ? 'text-[#2dd4bf]' : 'text-teal-600')
                  : 'text-slate-400'
              }`}
          />
        </div>
      </button>

      {/* Floating Animated Menu List */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 top-full mt-2 w-full min-w-[200px] max-h-64 overflow-y-auto z-50 rounded-2xl shadow-2xl backdrop-blur-xl p-1.5 space-y-1 animate-slide-down border ${isDark
              ? 'bg-[#0a0d14] border-[#1e2430]'
              : 'bg-white border-slate-200'
            }`}
        >
          {allItems.map((item, idx) => {
            const strItemVal = String(item.value);
            const isAllItem = item.value === '';
            const isItemActive = isMulti
              ? (isAllItem ? selectedValues.length === 0 : selectedValues.includes(strItemVal))
              : String(value || '') === strItemVal;

            const isHighlighted = highlightedIndex === idx;

            return (
              <div
                key={item.value || '__all__'}
                ref={el => (itemRefs.current[idx] = el)}
                role="option"
                aria-selected={isItemActive}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => handleOptionClick(item.value)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${isItemActive
                    ? isDark
                      ? 'bg-[#0f241e] text-[#2dd4bf] font-black'
                      : 'bg-teal-50 text-teal-700 font-black'
                    : isHighlighted
                      ? isDark
                        ? 'bg-[#141a24] text-white'
                        : 'bg-slate-100 text-slate-900'
                      : isDark
                        ? 'text-slate-300 hover:bg-[#121620] hover:text-white'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  {isMulti && !isAllItem && (
                    <input
                      type="checkbox"
                      checked={isItemActive}
                      readOnly
                      className="w-3.5 h-3.5 rounded text-[#2dd4bf] accent-[#2dd4bf] pointer-events-none"
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
                {isItemActive && <Check className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#2dd4bf]' : 'text-teal-600'}`} />}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default CustomDropdown;
