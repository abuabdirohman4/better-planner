"use client";

import React from 'react';
import Modal, { ModalProps } from './Modal';
import Button from '@/components/ui/button/Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  confirmVariant = 'danger',
  isLoading = false,
  size = 'md',
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      // Modal will be closed by parent component if needed
    } catch (error) {
      // Error handling is done in the onConfirm function
      console.error('Error in confirm action:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="py-2">
        <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          size="sm"
        >
          {cancelText}
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          loading={isLoading}
          disabled={isLoading}
          size="sm"
          className={confirmVariant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300' : ''}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;

