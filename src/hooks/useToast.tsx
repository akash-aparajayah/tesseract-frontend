import { useState, useCallback, useRef, useEffect } from "react";
import Toast from "../components/common/Toast";

export interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error";
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const id = Date.now();

    // Replace existing toast with new one
    setToast({ id, message, type });

    // Auto-dismiss after 3 seconds
    timerRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  const removeToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const ToastContainer = useCallback(() => (
    <div className="toast-container">
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast()}
        />
      )}
    </div>
  ), [toast, removeToast]);

  return { showToast, ToastContainer };
};