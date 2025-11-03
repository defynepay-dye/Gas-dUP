
import React, { useState, useEffect, useCallback } from 'react';
import { SystemNotification } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, Clock, CreditCard, AlertCircle } from "lucide-react";

export default function NotificationBanner() {
  const [notifications, setNotifications] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(new Set());

  const loadNotifications = useCallback(async () => {
    try {
      const activeNotifications = await SystemNotification.filter({
        display_contexts: 'pos_header',
        expiry_date: { $gte: new Date().toISOString() }
      });
      
      // Filter out dismissed notifications
      const filteredNotifications = activeNotifications.filter(n => !dismissed.has(n.id));
      setNotifications(filteredNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  }, [dismissed]); // `dismissed` is a dependency because `dismissed.has` is used

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [loadNotifications]); // `loadNotifications` is a dependency now that it's wrapped in useCallback

  useEffect(() => {
    if (notifications.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
      }, 5000); // Rotate every 5 seconds
      return () => clearInterval(interval);
    } else {
      // If notifications drop to 0 or 1, reset currentIndex to 0 to prevent out-of-bounds access
      setCurrentIndex(0);
    }
  }, [notifications.length]); // Dependency: notifications.length

  const dismissNotification = (notificationId) => {
    setDismissed(prev => new Set([...prev, notificationId]));
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'license_expiration':
        return <Clock className="w-4 h-4" />;
      case 'payment_due':
      case 'card_expired':
        return <CreditCard className="w-4 h-4" />;
      case 'system_update':
      case 'maintenance_required':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium':
        return 'bg-blue-100 border-blue-500 text-blue-800';
      case 'low':
        return 'bg-gray-100 border-gray-500 text-gray-800';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  };

  if (notifications.length === 0) return null;

  // Ensure currentIndex is valid if notifications array changes dynamically
  const actualCurrentIndex = currentIndex % notifications.length;
  const currentNotification = notifications[actualCurrentIndex];

  if (!currentNotification) return null; // Should not happen if notifications.length > 0 but good for safety

  return (
    <div className={`flex items-center justify-between p-3 border-l-4 mb-4 ${getNotificationColor(currentNotification.priority)}`}>
      <div className="flex items-center gap-3">
        {getNotificationIcon(currentNotification.notification_type)}
        <div>
          <div className="font-medium text-sm">{currentNotification.title}</div>
          <div className="text-sm opacity-90">{currentNotification.message}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {currentNotification.action_required && (
          <Button size="sm" className="bg-white/20 hover:bg-white/30 text-current">
            Take Action
          </Button>
        )}
        
        {notifications.length > 1 && (
          <div className="text-xs opacity-75">
            {actualCurrentIndex + 1} of {notifications.length}
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dismissNotification(currentNotification.id)}
          className="p-1 hover:bg-white/20"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
