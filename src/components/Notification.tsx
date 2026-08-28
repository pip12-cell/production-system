import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notification, showNotification } = useApp();

  if (!notification) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
  };

  const bgStyles = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-950',
    error: 'bg-rose-50 border-rose-300 text-rose-950',
    info: 'bg-blue-50 border-blue-300 text-blue-950'
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgStyles[notification.type]}`}>
        {icons[notification.type]}
        <p className="text-sm font-semibold flex-1 leading-relaxed">{notification.message}</p>
        <button
          onClick={() => showNotification('')}
          className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-700 transition"
          aria-label="إغلاق التنبيه"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const NotificationContainer = NotificationToast;

