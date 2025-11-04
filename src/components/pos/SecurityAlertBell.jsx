
import React, { useState, useEffect, useCallback } from 'react';
import { SystemNotification } from '@/api/entities'; // Changed from multiple entities to SystemNotification
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Shield, // Kept for security notifications
  Package, // Kept for shelf monitoring events
  Wrench, // Kept for maintenance alerts
  X,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // Added from outline
  DialogFooter // Added from outline
} from '@/components/ui/dialog';
import { format } from 'date-fns';

// Helper function to map notification types to icons
const getIconForNotificationType = (type) => {
  switch (type) {
    case 'security_incident':
    case 'security':
      return Shield;
    case 'shelf_event':
    case 'shelf':
      return Package;
    case 'maintenance_alert':
    case 'maintenance':
      return Wrench;
    default:
      return Bell; // Default icon for other types
  }
};

export default function SecurityAlertBell() {
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [criticalCount, setCriticalCount] = useState(0);

  const loadAlerts = useCallback(async () => {
    try {
      const locationId = localStorage.getItem('current_location_id');

      // Fetch SystemNotifications instead of disparate entities
      const systemNotifications = await SystemNotification.filter({
        status: 'open',
        location_id: locationId
      }, '-created_at', 20).catch(() => []);

      const allAlerts = systemNotifications.map(item => ({
        id: item.id,
        type: item.type, // e.g., 'security', 'shelf', 'maintenance'
        severity: item.severity,
        title: item.title || item.message.substring(0, 50) + (item.message.length > 50 ? '...' : ''), // Use title or first part of message
        description: item.message,
        timestamp: item.created_at, // Assuming SystemNotification has 'created_at'
        data: item,
        icon: getIconForNotificationType(item.type),
        // Color will be determined by getSeverityColor based on severity
      }));

      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      allAlerts.sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      setAlerts(allAlerts);
      setCriticalCount(allAlerts.filter(a => a.severity === 'critical').length);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [loadAlerts]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      default: return 'bg-blue-600';
    }
  };

  const handleDismiss = async (alert) => {
    // A production app would update the record to mark it as read by the user
    // For this implementation, we simply remove it from the local state
    setAlerts(prev => prev.filter(a => a.id !== alert.id));
    // Optionally, re-calculate critical count if needed, or trigger a full reload
    setCriticalCount(prev => (alert.severity === 'critical' ? prev - 1 : prev));
  };

  const totalAlerts = alerts.length;
  const hasCritical = criticalCount > 0;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowAlerts(true)}
        className={`h-16 border-2 transition-all flex flex-col items-center justify-center gap-1 ${
          hasCritical
            ? 'border-red-400 bg-red-100 hover:bg-red-200 animate-pulse text-red-800'
            : totalAlerts > 0
              ? 'border-red-300 bg-red-100 hover:bg-red-200 text-red-800'
              : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
        } relative`}
      >
        <Bell className="w-5 h-5" />
        <span className="text-xs font-medium">Alerts</span>
        {totalAlerts > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 px-2"
          >
            {totalAlerts}
          </Badge>
        )}
      </Button>

      <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-600" />
              Active Alerts ({totalAlerts})
              {hasCritical && (
                <Badge className="bg-red-600 text-white ml-2">
                  {criticalCount} CRITICAL
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Review and manage important system notifications and events across your locations.
            </DialogDescription>
          </DialogHeader>

          {totalAlerts === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold">No Active Alerts</p>
              <p className="text-sm">All systems operating normally</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const Icon = alert.icon; // Icon is now dynamically assigned in loadAlerts
                const severityBgColor = getSeverityColor(alert.severity);

                return (
                  <div
                    key={alert.id}
                    className={`border-2 rounded-lg p-4 ${severityBgColor} bg-opacity-10`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 flex-1">
                        <div className={`p-3 rounded-lg ${severityBgColor}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold text-lg">{alert.title}</h4>
                            <Badge className={`${severityBgColor} text-white`}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Clock className="w-3 h-3" />
                            {format(new Date(alert.timestamp), 'MMM d, h:mm a')}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(alert)}
                        className="hover:bg-gray-200"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter className="mt-4">
            {/* Optional footer content if needed */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
