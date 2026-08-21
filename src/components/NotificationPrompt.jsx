import React, { useState, useEffect } from 'react';
import { requestNotificationPermission } from '../utils/notificationUtils';

function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const hasPrompted = localStorage.getItem('mis_notification_prompted');
    // Only show if we haven't asked before, and if notifications are supported but not granted/denied yet.
    if (!hasPrompted && 'Notification' in window && Notification.permission === 'default') {
      // Delay prompt slightly to let the app load first
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = async () => {
    setShowPrompt(false);
    localStorage.setItem('mis_notification_prompted', 'true');
    const token = await requestNotificationPermission();
    if (token) {
      console.log('Notifications enabled via auto-prompt.');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('mis_notification_prompted', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-surface text-on-surface w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-outline/20 transform scale-100 animate-in zoom-in-95 duration-300">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto text-primary">
          <span className="material-symbols-outlined text-2xl">notifications_active</span>
        </div>
        <h2 className="text-xl font-headline-md font-bold text-center mb-2">Enable Notifications</h2>
        <p className="text-sm text-center text-on-surface-variant mb-6">
          Get instantly notified when an Admin cancels or reschedules a lecture or lab. You won't miss important updates!
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleAllow}
            className="w-full py-3 rounded-xl bg-primary text-on-primary font-label-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Allow Notifications
          </button>
          <button 
            onClick={handleDismiss}
            className="w-full py-3 rounded-xl bg-surface-dim text-on-surface font-label-bold hover:bg-surface-container transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationPrompt;
