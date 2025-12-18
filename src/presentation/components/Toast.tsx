import { useEffect } from 'react';
import { CheckCircle2, XCircle, X, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const toastStyles = {
  success: {
    bg: 'bg-green-600',
    icon: CheckCircle2,
  },
  error: {
    bg: 'bg-red-600',
    icon: XCircle,
  },
  info: {
    bg: 'bg-purple-600',
    icon: Info,
  },
  warning: {
    bg: 'bg-orange-600',
    icon: AlertTriangle,
  },
};

export const ToastItem = ({ toast, onClose }: ToastProps) => {
  const style = toastStyles[toast.type];
  const Icon = style.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000); // Auto close after 5 seconds

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div
      className={`${style.bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 min-w-[300px] max-w-[500px] animate-slide-in-right`}
    >
      <div className="flex-shrink-0">
        <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
