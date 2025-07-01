import { toast } from 'sonner';

// Toast configuration
const toastConfig = {
  success: {
    style: {
      background: '#3B82F6', // Brand color
      color: '#fff',
      border: 'none',
    },
  },
  error: {
    style: {
      background: '#EF4444', // Error color
      color: '#fff',
      border: 'none',
    },
  },
};

// Success toast helper
export const showSuccessToast = (message: string, description?: string) => {
  toast.success(message, {
    description: description || '',
    duration: 4000,
    ...toastConfig.success,
  });
};

// Error toast helper
export const showErrorToast = (message: string, description?: string) => {
  toast.error(message, {
    description: description || '',
    duration: 4000,
    ...toastConfig.error,
  });
};

// Info toast helper
export const showInfoToast = (message: string, description?: string) => {
  toast.info(message, {
    description: description || '',
    duration: 4000,
  });
};

// Warning toast helper
export const showWarningToast = (message: string, description?: string) => {
  toast.warning(message, {
    description: description || '',
    duration: 4000,
  });
};

// Create toast object
const CustomToast = {
  success: showSuccessToast,
  error: showErrorToast,
  info: showInfoToast,
  warning: showWarningToast,
};

// Default export for convenience
export default CustomToast; 