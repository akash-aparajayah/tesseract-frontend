import { useEffect, useState, useRef } from "react";
import {  XCircle, CheckCircle} from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isHovered) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, 2000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isHovered, onClose]);

  const Icon = type === "success" ? CheckCircle : XCircle;

  return (
    <div
      className={`toast ${type}`}
      onMouseEnter={() => {
        setIsHovered(true);
        if (timerRef.current) clearTimeout(timerRef.current);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, padding: '0 12px' }}>{message}</span>

    </div>
  );
}