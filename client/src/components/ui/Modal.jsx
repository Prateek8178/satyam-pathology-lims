import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };

const Modal = ({ isOpen, onClose, title, children, size = 'md', hideClose }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-xl shadow-2xl w-full flex flex-col max-h-[90vh]', SIZES[size])}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {!hideClose && <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><XMarkIcon className="w-5 h-5" /></button>}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
