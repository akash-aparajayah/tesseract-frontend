import React, { useEffect } from "react";
import "../../styles/Toast.css"; // import the CSS

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number; // auto-close after ms
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 1200 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
};

export default Toast;