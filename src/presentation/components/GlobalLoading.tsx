import { useEffect, useState } from 'react';
import { loadingEvents } from '../../config/api';

export const GlobalLoading = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = loadingEvents.subscribe(setVisible);
    return () => {
      unsubscribe();
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-lg px-6 py-4 flex flex-col items-center">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-3" />
        <p className="text-sm text-gray-700">Đang xử lý...</p>
      </div>
    </div>
  );
};
