import { useState, useCallback, useRef } from 'react';
import Toast, { ToastType } from '../components/ui/Toast';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // The container must keep one identity across renders. Declared inline it was
  // a new component type every render, so any page that re-renders on a timer
  // (a ticking countdown) remounted each toast and restarted its dismiss timer
  // before it could fire: toasts stayed up forever. It reads the latest list
  // through a ref, and re-renders whenever the page holding the hook does.
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;
  const ToastContainer = useCallback(() => (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toastsRef.current.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={removeToast} />
      ))}
    </div>
  ), [removeToast]);

  return {
    toast: addToast,
    removeToast,
    ToastContainer,
  };
};
