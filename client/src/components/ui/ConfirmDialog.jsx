import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title = 'Confirm Action', message, confirmText = 'Confirm', variant = 'danger', loading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
    <div className="text-center">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ExclamationTriangleIcon className="w-7 h-7 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6">{message}</p>
      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
