import React, { useEffect, useState, useCallback, useRef, useContext } from 'react';
import dayjs from 'dayjs';
import { useNavigate, useLocation } from "react-router-dom";
import { fetchPost } from "utils/fetch";
import { getSchema, getStatus, validateMessages } from "utils/schemaValidator";
import { useSubmitting } from "utils";
import loadInit, { fixRangeDates } from "utils/loadInit";
import { API_URL, FILES_URL } from "config";
import { useDataAPI } from "utils/useDataAPIV3";
import { getFilterRangeValues, getFilterValue } from "utils";
import { DATE_FORMAT, DATETIME_FORMAT, DATE_FORMAT_NO_SEPARATOR } from 'config';
import { MediaContext, AppContext } from "./App";
import { isRH } from './commons';
import { LayoutContext } from "./GridLayout";

// ============================================================================
// SVG ICONS
// ============================================================================
const Camera = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const Edit = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const Trash2 = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const ChevronDown = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ChevronUp = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

const Eraser = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
    <path d="M22 21H7"/>
    <path d="m5 11 9 9"/>
  </svg>
);

const X = ({ size = 20, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const Search = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const Filter = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const RefreshCw = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const ChevronLeft = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ChevronRight = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const AlertCircle = ({ size = 16, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ============================================================================
// UI COMPONENTS
// ============================================================================

// Loading Spinner
const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };
  
  return (
    <div className={`inline-block ${sizes[size]} border-gray-300 border-t-blue-600 rounded-full animate-spin ${className}`} />
  );
};

// Button Component
const Button = ({ 
  children, 
  onClick, 
  disabled, 
  variant = 'default', 
  size = 'md', 
  icon, 
  className = '',
  loading = false,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95";
  
  const variants = {
    default: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500 shadow-sm",
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-md hover:shadow-lg",
    danger: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-md hover:shadow-lg",
    success: "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500 shadow-md hover:shadow-lg",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    link: "text-blue-600 hover:text-blue-800 underline-offset-4 hover:underline focus:ring-blue-500",
  };
  
  const sizes = {
    xs: "px-2 py-1 text-xs gap-1",
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

// Input Component
const Input = ({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  size = 'md', 
  className = '',
  error = false,
  icon,
  ...props 
}) => {
  const sizes = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };
  
  const baseStyles = "w-full border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed";
  const normalStyles = "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
  const errorStyles = "border-red-300 focus:ring-red-500 focus:border-red-500";
  
  if (icon) {
    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {icon}
        </div>
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`${baseStyles} ${error ? errorStyles : normalStyles} ${sizes[size]} pl-10 ${className}`}
          {...props}
        />
      </div>
    );
  }
  
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`${baseStyles} ${error ? errorStyles : normalStyles} ${sizes[size]} ${className}`}
      {...props}
    />
  );
};

// Select Component
const Select = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder, 
  disabled, 
  size = 'md', 
  className = '',
  error = false
}) => {
  const sizes = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };
  
  const baseStyles = "w-full border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed appearance-none bg-white";
  const normalStyles = "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
  const errorStyles = "border-red-300 focus:ring-red-500 focus:border-red-500";
  
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${baseStyles} ${error ? errorStyles : normalStyles} ${sizes[size]} ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options?.map((opt, idx) => (
          <option key={idx} value={opt.value}>
            {opt.label || opt.value}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <ChevronDown size={16} className="text-gray-400" />
      </div>
    </div>
  );
};

// DatePicker Component
const DatePicker = ({ 
  value, 
  onChange, 
  showTime, 
  disabled, 
  size = 'md', 
  className = '',
  error = false,
  placeholder = ''
}) => {
  const sizes = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };
  
  const baseStyles = "w-full border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 disabled:bg-gray-50";
  const normalStyles = "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
  const errorStyles = "border-red-300 focus:ring-red-500 focus:border-red-500";
  
  return (
    <input
      type={showTime ? "datetime-local" : "date"}
      value={value ? dayjs(value).format(showTime ? "YYYY-MM-DDTHH:mm" : "YYYY-MM-DD") : ''}
      onChange={(e) => onChange && onChange(e.target.value ? dayjs(e.target.value) : null)}
      disabled={disabled}
      placeholder={placeholder}
      className={`${baseStyles} ${error ? errorStyles : normalStyles} ${sizes[size]} ${className}`}
    />
  );
};

// Modal Component
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  size = 'md',
  closeOnOverlay = true
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm" 
          onClick={closeOnOverlay ? onClose : undefined}
        />
        
        {/* Modal */}
        <div className={`inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle ${sizes[size]} w-full animate-slideUp`}>
          {title && (
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <button 
                  onClick={onClose} 
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}
          <div className="bg-white px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>
          {footer && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Drawer Component
const Drawer = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  position = 'right'
}) => {
  const positions = {
    left: 'left-0 animate-slideInLeft',
    right: 'right-0 animate-slideInRight',
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
        
        {/* Drawer */}
        <div className={`fixed inset-y-0 ${positions[position]} max-w-full flex`}>
          <div className="w-screen max-w-2xl">
            <div className="h-full flex flex-col bg-white shadow-2xl">
              {/* Header */}
              {title && (
                <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button 
                      onClick={onClose} 
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {children}
              </div>
              
              {/* Footer */}
              {footer && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                  {footer}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Alert Component
const Alert = ({ type = 'info', children, onClose, className = '' }) => {
  const types = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-400'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-400'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-400'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-400'
    },
  };
  
  const style = types[type];
  
  return (
    <div className={`${style.bg} ${style.border} ${style.text} border rounded-lg p-4 flex items-start gap-3 ${className}`}>
      <AlertCircle size={20} className={style.icon} />
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

// Badge Component
const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    in: 'bg-blue-100 text-blue-800',
    out: 'bg-green-100 text-green-800',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Card Component
const Card = ({ children, className = '', hover = false, onClick }) => {
  const hoverStyles = hover ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : '';
  return (
    <div 
      className={`bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-200 ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Table Component
const Table = ({ columns, data, loading, onRowClick, emptyMessage = 'Sem dados disponíveis' }) => {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Spinner size="md" />
                    <span>A carregar...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-4 py-3 text-sm text-gray-900">
                      {col.render ? col.render({ data: row, value: row[col.key] }) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange }) => {
  const pages = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Mostrar</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-sm text-gray-700">registos</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          icon={<ChevronLeft size={16} />}
        />
        
        {startPage > 1 && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <Button
            key={page}
            size="sm"
            variant={page === currentPage ? 'primary' : 'ghost'}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          icon={<ChevronRight size={16} />}
        />
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENTS
// ============================================================================

const title = "Registo de Picagens";

// Title Component
const TitleForm = ({ isRH }) => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-black text-gray-900 tracking-tight">
        {isRH ? title : `${title} Pessoal`}
      </h1>
      <p className="text-sm text-gray-500 mt-1">Gestão e visualização de registos de picagens</p>
    </div>
  );
};

// Visual Records Viewer Component
const RegistosVisuaisViewer = ({ data, onClose }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      let response = await fetchPost({
        url: `${API_URL}/rponto/sqlp/`,
        withCredentials: true,
        filter: {},
        parameters: {
          method: "GetCameraRecords",
          date: dayjs(data.dts).format(DATE_FORMAT_NO_SEPARATOR),
          num: data.num
        }
      });
      if (response.data.status !== "error") {
        setRecords(response.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {records.map((v, i) => (
        <Card key={`img-${i}`} className="overflow-hidden group">
          <div className="aspect-square relative overflow-hidden bg-gray-100">
            <img
              src={`${FILES_URL}/static/records/${v.filename}`}
              alt={`Record ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div className="p-3 bg-gradient-to-r from-gray-50 to-white">
            <div className="text-xs font-semibold text-gray-900">#{i + 1}</div>
            <div className="text-xs text-gray-600 mt-1">
              {v.tstamp && dayjs(v.tstamp).format(DATETIME_FORMAT)}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Biometrics Component
const Biometrias = ({ openNotification }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      let response = await fetchPost({
        url: `${API_URL}/rponto/sqlp/`,
        withCredentials: true,
        filter: {},
        parameters: { method: "BiometriasList" }
      });
      if (response.data.status !== "error") {
        setData(response.data.rows || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const syncAll = async () => {
    setLoading(true);
    try {
      let response = await fetchPost({
        url: `${API_URL}/rponto/sqlp/`,
        withCredentials: true,
        filter: {},
        parameters: { method: "Sync" }
      });
      openNotification?.(
        response.data.status,
        'top',
        "Notificação",
        "Dados biométricos sincronizados com sucesso!"
      );
    } catch (e) {
      openNotification?.("error", 'top', "Notificação", e.message);
    } finally {
      setLoading(false);
    }
  };

  const onDelFace = async (record) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar a biometria ${record.num}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      let response = await fetchPost({
        url: `${API_URL}/rponto/sqlp/`,
        withCredentials: true,
        filter: { num: record.num, file: record.file },
        parameters: { method: "DelFace" }
      });
      
      if (response.data.status !== "error") {
        openNotification?.(
          response.data.status,
          'top',
          "Notificação",
          `Biometria ${record.num} eliminada com sucesso!`
        );
        loadData();
      } else {
        openNotification?.(
          response.data.status,
          'top',
          "Notificação",
          `Erro ao eliminar a biometria ${record.num}!`
        );
      }
    } catch (e) {
      openNotification?.("error", 'top', "Notificação", e.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'num',
      header: 'Número',
      width: '100px',
      render: ({ value }) => <div className="font-bold">{value}</div>
    },
    {
      key: 't_stamp',
      header: 'Data',
      width: '150px',
      render: ({ value }) => dayjs(value).format(DATETIME_FORMAT)
    },
    {
      key: 'file',
      header: 'Ficheiro',
      render: ({ value }) => <div className="font-medium text-gray-700">{value}</div>
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: ({ data: row }) => (
        <div className="flex gap-2">
          <Button
            size="xs"
            variant="ghost"
            icon={<Camera size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(`${FILES_URL}/static/faces/${row.file}`);
            }}
          />
          <Button
            size="xs"
            variant="ghost"
            icon={<Trash2 size={14} className="text-red-600" />}
            onClick={(e) => {
              e.stopPropagation();
              onDelFace(row);
            }}
          />
        </div>
      )
    }
  ];

  return (
    <>
      <div className="mb-4">
        <Button
          variant="primary"
          onClick={syncAll}
          loading={loading}
          icon={<RefreshCw size={16} />}
        >
          Sincronizar Tudo
        </Button>
      </div>
      
      <Table
        columns={columns}
        data={data}
        loading={loading}
      />
      
      {selectedImage && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedImage(null)}
          title="Imagem Biométrica"
          size="md"
        >
          <div className="flex justify-center">
            <img src={selectedImage} alt="Biometric" className="max-w-full h-auto rounded-lg shadow-lg" />
          </div>
        </Modal>
      )}
    </>
  );
};

// Invalid Records Component
const InvalidRecords = ({ openNotification }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    num: '',
    dateFrom: dayjs().format(DATE_FORMAT),
    dateTo: dayjs().format(DATE_FORMAT)
  });
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      let response = await fetchPost({
        url: `${API_URL}/rponto/sqlp/`,
        withCredentials: true,
        filter: {},
        parameters: { method: "InvalidRecordsList" }
      });
      
      if (response.data.status !== "error") {
        const _dt = [];
        for (let [i, x] of (response.data.rows || []).entries()) {
          const v = x.filename.replace("../", "").replace("./", "");
          const r = v.split('/');
          
          if (r.length === 3) {
            let _f = r[2].split('.');
            _dt.push({
              k: `${r[2]}.${i}`,
              name: `${_f[0]}.${_f[1]}`,
              path: `${FILES_URL}/static/${v}`,
              num: null,
              type: _f[2]
            });
          } else if (r.length === 4) {
            let _f = r[3].split('.');
            _dt.push({
              k: `${r[3]}.${i}`,
              name: `${_f[0]}.${_f[1]}`,
              path: `${FILES_URL}/static/${v}`,
              num: r[2],
              type: _f[2]
            });
          }
        }
        setData(_dt);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'num',
      header: 'Número',
      width: '80px',
      render: ({ value }) => <div className="font-bold">{value || '-'}</div>
    },
    {
      key: 'name',
      header: 'Ficheiro',
      render: ({ value }) => <div className="font-medium text-gray-700">{value}</div>
    },
    {
      key: 'type',
      header: 'Evento',
      width: '100px',
      render: ({ value }) => (
        <Badge variant={value === 'in' ? 'in' : 'out'}>
          {value === 'in' ? 'Entrada' : 'Saída'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: ({ data: row }) => (
        <Button
          size="xs"
          variant="ghost"
          icon={<Camera size={14} />}
          onClick={() => setSelectedImage(row.path)}
        />
      )
    }
  ];

  return (
    <>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Número"
          value={filters.num}
          onChange={(e) => setFilters({ ...filters, num: e.target.value })}
          icon={<Search size={16} />}
        />
        <DatePicker
          value={filters.dateFrom}
          onChange={(val) => setFilters({ ...filters, dateFrom: val })}
          placeholder="Data início"
        />
        <DatePicker
          value={filters.dateTo}
          onChange={(val) => setFilters({ ...filters, dateTo: val })}
          placeholder="Data fim"
        />
      </div>
      
      <Table
        columns={columns}
        data={data}
        loading={loading}
      />
      
      {selectedImage && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedImage(null)}
          title="Registo Visual"
          size="md"
        >
          <div className="flex justify-center">
            <img src={selectedImage} alt="Invalid record" className="max-w-full h-auto rounded-lg shadow-lg" />
          </div>
        </Modal>
      )}
    </>
  );
};

// Fix Records Component
const typeList = [
  { value: '', label: "" },
  { value: "in", label: "Entrada" },
  { value: "out", label: "Saída" }
];

const Fix = ({ record, onClose, onSuccess, openNotification }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    num: '',
    nome: '',
    dts: '',
    nt: 0,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    let nt = 0;
    for (let i = 1; i <= 8; i++) {
      const idx = `${i}`.padStart(2, '0');
      if (record[`ss_${idx}`]) nt += 1;
    }

    const vals = {
      ...record,
      nt,
      dts: record?.dts && dayjs(record.dts).format(DATE_FORMAT),
      nome: `${record.SRN_0} ${record.NAM_0}`
    };

    for (let i = 1; i <= 8; i++) {
      const idx = `${i}`.padStart(2, '0');
      vals[`ss_${idx}`] = record[`ss_${idx}`] ? dayjs(record[`ss_${idx}`]) : null;
      vals[`ty_${idx}`] = record[`ty_${idx}`]?.trim() || '';
    }

    setFormData(vals);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const moveUp = (n) => {
    const idx = `${n}`.padStart(2, '0');
    const prevIdx = `${n - 1}`.padStart(2, '0');
    
    if (!formData[`ss_${idx}`]) return;
    
    const newData = { ...formData };
    
    if (!newData[`ss_${prevIdx}`]) {
      newData[`ss_${prevIdx}`] = newData[`ss_${idx}`];
      newData[`ss_${idx}`] = null;
      newData[`ty_${prevIdx}`] = newData[`ty_${idx}`];
      newData[`ty_${idx}`] = '';
    }
    
    setFormData(newData);
  };

  const moveDown = (n) => {
    const idx = `${n}`.padStart(2, '0');
    const nextIdx = `${n + 1}`.padStart(2, '0');
    
    if (!formData[`ss_${idx}`]) return;
    
    const newData = { ...formData };
    
    if (!newData[`ss_${nextIdx}`]) {
      newData[`ss_${nextIdx}`] = newData[`ss_${idx}`];
      newData[`ss_${idx}`] = null;
      newData[`ty_${nextIdx}`] = newData[`ty_${idx}`];
      newData[`ty_${idx}`] = '';
    }
    
    setFormData(newData);
  };

  const clear = (n) => {
    const idx = `${n}`.padStart(2, '0');
    setFormData(prev => ({
      ...prev,
      [`ss_${idx}`]: null,
      [`ty_${idx}`]: ''
    }));
  };

  const validate = () => {
    const newErrors = {};
    let nt = 0;
    
    for (let i = 1; i <= 8; i++) {
      const idx = `${i}`.padStart(2, '0');
      const nextIdx = `${i + 1}`.padStart(2, '0');
      
      const v1 = formData[`ss_${idx}`];
      const v2 = formData[`ss_${nextIdx}`];
      const ty1 = formData[`ty_${idx}`];
      
      if (v1) {
        nt++;
        
        if (!ty1) {
          newErrors[`ty_${idx}`] = `O tipo da picagem ${idx} deve estar preenchido`;
        }
        
        if (v2 && dayjs(v2).isBefore(dayjs(v1))) {
          newErrors[`ss_${nextIdx}`] = `A hora deve ser superior à anterior`;
        }
      }
      
      if (v2 && !v1) {
        newErrors[`ss_${idx}`] = `A hora deve estar preenchida`;
      }
    }
    
    setErrors(newErrors);
    return { valid: Object.keys(newErrors).length === 0, nt };
  };

  const onSubmit = async () => {
    const { valid, nt } = validate();
    
    if (!valid) return;
    
    setLoading(true);
    try {
      const vals = { ...formData, nt };
      
      for (let i = 1; i <= 8; i++) {
        const idx = `${i}`.padStart(2, '0');
        vals[`ss_${idx}`] = vals[`ss_${idx}`] ? dayjs(vals[`ss_${idx}`]).format(DATETIME_FORMAT) : null;
      }
      
      let response = await fetchPost({
        url: `${API_URL}/rponto/sqlp/`,
        withCredentials: true,
        filter: {},
        parameters: { method: "UpdateRecords", values: vals }
      });
      
      if (response.data.status !== "error") {
        openNotification?.(
          response.data.status,
          'top',
          "Notificação",
          response.data.title
        );
        onSuccess?.();
        onClose?.();
      } else {
        openNotification?.("error", 'top', "Notificação", response.data.title);
      }
    } catch (e) {
      openNotification?.("error", 'top', "Notificação", e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPickRow = (num) => {
    const idx = `${num}`.padStart(2, '0');
    const isFirst = num === 1;
    const isLast = num === 8;
    
    return (
      <Card key={num} className="p-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm">
            {num}
          </div>
          
          <div className="flex gap-1">
            <Button
              size="xs"
              variant="ghost"
              icon={<Eraser size={14} />}
              onClick={() => clear(num)}
              className="hover:bg-red-50 hover:text-red-600"
            />
            <Button
              size="xs"
              variant="ghost"
              icon={<ChevronUp size={14} />}
              onClick={() => moveUp(num)}
              disabled={isFirst}
            />
            <Button
              size="xs"
              variant="ghost"
              icon={<ChevronDown size={14} />}
              onClick={() => moveDown(num)}
              disabled={isLast}
            />
          </div>
          
          <div className="flex-1">
            <DatePicker
              value={formData[`ss_${idx}`]}
              onChange={(val) => handleChange(`ss_${idx}`, val)}
              showTime
              size="sm"
              error={!!errors[`ss_${idx}`]}
            />
            {errors[`ss_${idx}`] && (
              <p className="text-xs text-red-600 mt-1">{errors[`ss_${idx}`]}</p>
            )}
          </div>
          
          <div className="w-32">
            <Select
              value={formData[`ty_${idx}`]}
              onChange={(e) => handleChange(`ty_${idx}`, e.target.value)}
              options={typeList}
              size="sm"
              error={!!errors[`ty_${idx}`]}
            />
            {errors[`ty_${idx}`] && (
              <p className="text-xs text-red-600 mt-1">{errors[`ty_${idx}`]}</p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div>
      {Object.keys(errors).length > 0 && (
        <Alert type="error" className="mb-4">
          <div className="font-medium mb-1">Erros de validação:</div>
          <ul className="list-disc list-inside text-sm">
            {Object.values(errors).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
          <Input value={formData.num} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <Input value={formData.nome} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
          <Input value={formData.dts} disabled />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Picagens</h3>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => renderPickRow(num))}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="default" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onSubmit} loading={loading}>
          Registar
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default ({ setFormTitle, ...props }) => {
  const { openNotification } = useContext(LayoutContext);
  const { auth } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [num, setNum] = useState(null);
  const [filters, setFilters] = useState({
    fnum: '',
    fnome: '',
    fdateFrom: '',
    fdateTo: ''
  });
  
  // Modal/Drawer states
  const [showBiometrias, setShowBiometrias] = useState(false);
  const [showInvalidRecords, setShowInvalidRecords] = useState(false);
  const [showVisualRecords, setShowVisualRecords] = useState(false);
  const [showFix, setShowFix] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const defaultParameters = { method: "RegistosRH" };
      const filterValues = {
        ...filters,
        ...(num && { num })
      };
      
      let response = await fetchPost({
        url: `${API_URL}/rponto/sqlp/`,
        withCredentials: true,
        parameters: defaultParameters,
        pagination: { enabled: true, page: currentPage, pageSize },
        filter: filterValues
      });
      
      if (response.data.status !== "error") {
        setData(response.data.rows || []);
        setTotalPages(Math.ceil((response.data.total || 0) / pageSize));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setCurrentPage(1);
    loadData();
  };

  const handleClearFilters = () => {
    setFilters({
      fnum: '',
      fnome: '',
      fdateFrom: '',
      fdateTo: ''
    });
    setCurrentPage(1);
  };

  const columns = [
    ...(isRH(auth, num) ? [{
      key: 'num',
      header: 'Nº',
      width: '70px',
      render: ({ value }) => <div className="font-black">{value}</div>
    }] : []),
    {
      key: 'dts',
      header: 'Data',
      width: '100px',
      render: ({ value }) => dayjs(value).format(DATE_FORMAT)
    },
    ...(isRH(auth, num) ? [{
      key: 'actions',
      header: '',
      width: '60px',
      render: ({ data: row }) => (
        <Button
          size="xs"
          variant="ghost"
          icon={<Edit size={14} />}
          onClick={() => {
            setSelectedRecord(row);
            setShowFix(true);
          }}
        />
      )
    }] : []),
    ...(isRH(auth, num) ? [{
      key: 'name',
      header: 'Nome',
      render: ({ data: row }) => (
        <div className="font-semibold">{`${row.SRN_0} ${row.NAM_0}`}</div>
      )
    }] : []),
    {
      key: 'nt',
      header: 'Picagens',
      width: '90px',
      render: ({ value }) => (
        <Badge variant="primary">{value}</Badge>
      )
    },
    ...Array.from({ length: 8 }, (_, i) => {
      const idx = `${i + 1}`.padStart(2, '0');
      return {
        key: `ss_${idx}`,
        header: `P${idx}`,
        width: '130px',
        render: ({ value, data: row }) => {
          const type = row[`ty_${idx}`]?.trim();
          if (!value) return null;
          
          return (
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              type === 'in' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {dayjs(value).format('HH:mm')}
            </div>
          );
        }
      };
    }),
    ...(isRH(auth, num) ? [{
      key: 'visual',
      header: '',
      width: '60px',
      render: ({ data: row }) => (
        <Button
          size="xs"
          variant="ghost"
          icon={<Camera size={14} />}
          onClick={() => {
            setSelectedRecord(row);
            setShowVisualRecords(true);
          }}
        />
      )
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {!setFormTitle && <TitleForm isRH={isRH(auth, num)} />}
        
        {/* Filters Card */}
        <Card className="mb-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {isRH(auth, num) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número
                  </label>
                  <Input
                    value={filters.fnum}
                    onChange={(e) => setFilters({ ...filters, fnum: e.target.value })}
                    placeholder="Número"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <Input
                    value={filters.fnome}
                    onChange={(e) => setFilters({ ...filters, fnome: e.target.value })}
                    placeholder="Nome"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <DatePicker
                value={filters.fdateFrom}
                onChange={(val) => setFilters({ ...filters, fdateFrom: val })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <DatePicker
                value={filters.fdateTo}
                onChange={(val) => setFilters({ ...filters, fdateTo: val })}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="default" onClick={handleClearFilters}>
              Limpar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleFilter}
              icon={<Search size={16} />}
            >
              Pesquisar
            </Button>
          </div>
        </Card>
        
        {/* Action Buttons */}
        {isRH(auth, num) && (
          <div className="flex gap-2 mb-4">
            <Button 
              variant="default"
              onClick={() => setShowBiometrias(true)}
              icon={<Camera size={16} />}
            >
              Biometrias
            </Button>
            <Button 
              variant="default"
              onClick={() => setShowInvalidRecords(true)}
              icon={<AlertCircle size={16} />}
            >
              Registos Inválidos
            </Button>
          </div>
        )}
        
        {/* Data Table */}
        <Card className="overflow-hidden">
          <Table
            columns={columns}
            data={data}
            loading={loading}
          />
          
          {!loading && data.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </Card>
      </div>
      
      {/* Modals and Drawers */}
      <Drawer
        isOpen={showBiometrias}
        onClose={() => setShowBiometrias(false)}
        title="Biometrias"
      >
        <Biometrias openNotification={openNotification} />
      </Drawer>
      
      <Drawer
        isOpen={showInvalidRecords}
        onClose={() => setShowInvalidRecords(false)}
        title="Registos Inválidos"
      >
        <InvalidRecords openNotification={openNotification} />
      </Drawer>
      
      <Drawer
        isOpen={showVisualRecords}
        onClose={() => setShowVisualRecords(false)}
        title="Registos Visuais"
      >
        {selectedRecord && (
          <RegistosVisuaisViewer
            data={selectedRecord}
            onClose={() => setShowVisualRecords(false)}
          />
        )}
      </Drawer>
      
      <Drawer
        isOpen={showFix}
        onClose={() => setShowFix(false)}
        title="Corrigir Registo de Picagem"
      >
        {selectedRecord && (
          <Fix
            record={selectedRecord}
            onClose={() => setShowFix(false)}
            onSuccess={loadData}
            openNotification={openNotification}
          />
        )}
      </Drawer>
      
      {/* Add custom animations to tailwind.config.js */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
        
        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};