import React, { useState, useEffect, useCallback } from 'react';
import { SecurityIncident, ShelfMonitoringEvent, MaintenanceAlert, SystemNotification } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Shield, 
  Wrench, 
  Package, 
  Bell,
  ChevronRight,
  X,
  Eye,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function AlertNotificationBanner() {
  const [alerts, setAlerts] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    try {
      const locationId = localStorage.getItem('current_location_id');
      
      // Load all alert types
      const [securityIncidents, shelfEvents, maintenanceAlerts, systemNotifications] = await Promise.all([
        SecurityIncident.filter({ 
          status: 'open',
          location_id: locationId 
        }, '-timestamp', 10).catch(() => []),
        
        ShelfMonitoringEvent.filter({ 
          status: 'detected',
          location_id: locationId 
        }, '-created_date', 10).catch(() => []),
        
        MaintenanceAlert.filter({ 
          status: 'open',
          location_id: locationId 
        }, '-created_date', 10).catch(() => []),
        
        SystemNotification.filter({
          display_contexts: 'pos_header',
          expiry_date: { $gte: new Date().toISOString() }
        }, '-created_date', 5).catch(() => [])
      ]);

      // Combine and normalize alerts
      const allAlerts = [
        ...securityIncidents.map(item => ({
          id: item.id,
          type: 'security',
          subtype: item.incident_type,
          severity: item.severity,
          title: item.incident_type.replace(/_/g, ' ').toUpperCase(),
          description: `Detected at ${item.camera_id || 'Unknown camera'}`,
          timestamp: item.timestamp,
          data: item,
          icon: Shield,
          color: 'red'
        })),
        
        ...shelfEvents.map(item => ({
          id: item.id,
          type: 'shelf',
          subtype: item.event_type,
          severity: item.event_type === 'out_of_stock' ? 'high' : 'medium',
          title: item.event_type.replace(/_/g, ' ').toUpperCase(),
          description: `${item.product_name} - Aisle ${item.aisle_number}`,
          timestamp: item.created_date,
          data: item,
          icon: Package,
          color: 'orange'
        })),
        
        ...maintenanceAlerts.map(item => ({
          id: item.id,
          type: 'maintenance',
          subtype: item.alert_type,
          severity: item.severity,
          title: `${item.equipment_name || item.equipment_type} Issue`,
          description: item.recommended_action || 'Maintenance required',
          timestamp: item.created_date,
          data: item,
          icon: Wrench,
          color: 'yellow'
        })),
        
        ...systemNotifications.map(item => ({
          id: item.id,
          type: 'system',
          subtype: item.notification_type,
          severity: item.priority,
          title: item.title,
          description: item.message,
          timestamp: item.created_date,
          data: item,
          icon: Bell,
          color: 'blue'
        }))
      ];

      // Sort by severity and timestamp
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      allAlerts.sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      setAlerts(allAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAlerts();
    // Refresh every 15 seconds
    const interval = setInterval(loadAlerts, 15000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');
  const totalAlerts = alerts.length;

  const getAlertColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-600 border-red-700';
      case 'high': return 'bg-orange-600 border-orange-700';
      case 'medium': return 'bg-yellow-600 border-yellow-700';
      default: return 'bg-blue-600 border-blue-700';
    }
  };

  const handleDismiss = async (alert) => {
    try {
      switch(alert.type) {
        case 'security':
          await SecurityIncident.update(alert.id, { status: 'under_review' });
          break;
        case 'shelf':
          await ShelfMonitoringEvent.update(alert.id, { status: 'staff_notified' });
          break;
        case 'maintenance':
          await MaintenanceAlert.update(alert.id, { status: 'acknowledged' });
          break;
        default:
          break;
      }
      loadAlerts();
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  if (isLoading || totalAlerts === 0) return null;

  return (
    <>
      <div className="mb-4">
        <div 
          className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
            criticalAlerts.length > 0 ? 'bg-red-50 border-red-500 animate-pulse' :
            highAlerts.length > 0 ? 'bg-orange-50 border-orange-500' :
            'bg-blue-50 border-blue-500'
          }`}
          onClick={() => setShowDetails(true)}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              criticalAlerts.length > 0 ? 'bg-red-600' :
              highAlerts.length > 0 ? 'bg-orange-600' :
              'bg-blue-600'
            }`}>
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            
            <div>
              <div className="font-bold text-lg flex items-center gap-2">
                {totalAlerts} Active Alert{totalAlerts !== 1 ? 's' : ''}
                {criticalAlerts.length > 0 && (
                  <Badge className="bg-red-600 text-white">
                    {criticalAlerts.length} CRITICAL
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-700">
                {alerts[0]?.title} • Click for details
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {alerts.slice(0, 3).map((alert, idx) => {
                const Icon = alert.icon;
                return (
                  <div 
                    key={idx}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${getAlertColor(alert.severity)}`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                );
              })}
              {totalAlerts > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold">
                  +{totalAlerts - 3}
                </div>
              )}
            </div>
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Active Alerts ({totalAlerts})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <div 
                  key={alert.id}
                  className={`border-2 rounded-lg p-4 ${getAlertColor(alert.severity)} bg-opacity-10 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${getAlertColor(alert.severity)}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold">{alert.title}</h4>
                          <Badge className={getAlertColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(alert.timestamp), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(alert)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {selectedAlert && (
        <Dialog open={true} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedAlert.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-auto">
                {JSON.stringify(selectedAlert.data, null, 2)}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}