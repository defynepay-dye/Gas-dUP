import React, { useState, useEffect, useCallback } from 'react';
import { SecurityIncident, ShelfMonitoringEvent, MaintenanceAlert } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle } from 'lucide-react';

export default function SecurityAlertBellCompact() {
  const [alertCount, setAlertCount] = useState(0);
  const [hasCritical, setHasCritical] = useState(false);

  const loadAlerts = useCallback(async () => {
    try {
      const locationId = localStorage.getItem('current_location_id');
      
      const [securityIncidents, shelfEvents, maintenanceAlerts] = await Promise.all([
        SecurityIncident.filter({ 
          status: 'open',
          location_id: locationId 
        }).catch(() => []),
        
        ShelfMonitoringEvent.filter({ 
          status: 'detected',
          location_id: locationId 
        }).catch(() => []),
        
        MaintenanceAlert.filter({ 
          status: 'open',
          location_id: locationId 
        }).catch(() => [])
      ]);

      const total = securityIncidents.length + shelfEvents.length + maintenanceAlerts.length;
      const critical = [...securityIncidents, ...maintenanceAlerts].filter(a => a.severity === 'critical').length;
      
      setAlertCount(total);
      setHasCritical(critical > 0);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  const handleClick = () => {
    // Trigger parent alert viewer
    if (window.showSecurityAlerts) {
      window.showSecurityAlerts();
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className={`w-full h-full border-2 transition-all relative flex flex-col items-center justify-center gap-1 ${
        hasCritical 
          ? 'border-red-500 bg-red-50 hover:bg-red-100 animate-pulse' 
          : alertCount > 0
          ? 'border-orange-500 bg-orange-50 hover:bg-orange-100'
          : 'border-gray-300 hover:bg-gray-50'
      }`}
    >
      <Bell className={`w-4 h-4 ${hasCritical ? 'text-red-600' : alertCount > 0 ? 'text-orange-600' : 'text-gray-600'}`} />
      <span className={`text-xs font-semibold ${hasCritical ? 'text-red-700' : alertCount > 0 ? 'text-orange-700' : 'text-gray-700'}`}>
        Alerts
      </span>
      {alertCount > 0 && (
        <Badge className={`absolute -top-1 -right-1 ${hasCritical ? 'bg-red-600' : 'bg-orange-600'} text-white px-1.5 py-0.5 text-xs`}>
          {alertCount}
        </Badge>
      )}
    </Button>
  );
}