import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Fuel, Wrench, Clock } from "lucide-react";

export default function AlertsPanel({ pumps, products }) {
  const alerts = [];

  // Check for offline pumps
  const offlinePumps = pumps.filter(p => p.status === 'offline' || p.status === 'out_of_order');
  offlinePumps.forEach(pump => {
    alerts.push({
      id: `pump-${pump.id}`,
      type: 'critical',
      title: `Pump ${pump.pump_number} Offline`,
      message: pump.status === 'out_of_order' ? 'Out of order' : 'System offline',
      time: 'Now',
      icon: AlertTriangle
    });
  });

  // Check for maintenance needed
  const maintenancePumps = pumps.filter(p => p.status === 'maintenance');
  maintenancePumps.forEach(pump => {
    alerts.push({
      id: `maintenance-${pump.id}`,
      type: 'warning',
      title: `Pump ${pump.pump_number} Maintenance`,
      message: 'Scheduled maintenance in progress',
      time: '30m ago',
      icon: Wrench
    });
  });

  // Check for low inventory
  products.forEach(product => {
    if (product.inventory_gallons && product.low_inventory_threshold && 
        product.inventory_gallons <= product.low_inventory_threshold) {
      alerts.push({
        id: `inventory-${product.id}`,
        type: 'warning',
        title: `Low ${product.product_name} Inventory`,
        message: `${product.inventory_gallons} gallons remaining`,
        time: '1h ago',
        icon: Fuel
      });
    }
  });

  // Add some sample alerts if none exist
  if (alerts.length === 0) {
    alerts.push(
      {
        id: 'sample1',
        type: 'warning',
        title: 'Price Update Needed',
        message: 'Premium fuel pricing 2 hours old',
        time: '2h ago',
        icon: Clock
      },
      {
        id: 'sample2',
        type: 'info',
        title: 'Daily Totals Ready',
        message: 'End-of-day reports available',
        time: '4h ago',
        icon: AlertTriangle
      }
    );
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          System Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
              <div className="flex items-start gap-3">
                <alert.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{alert.title}</h4>
                  <p className="text-xs opacity-80 mt-1">{alert.message}</p>
                  <p className="text-xs opacity-60 mt-1">{alert.time}</p>
                </div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active alerts</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}