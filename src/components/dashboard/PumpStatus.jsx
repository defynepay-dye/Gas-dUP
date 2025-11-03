import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fuel, AlertTriangle, CheckCircle, XCircle, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = {
  online: { color: "bg-green-100 text-green-800", icon: CheckCircle, iconColor: "text-green-500" },
  offline: { color: "bg-red-100 text-red-800", icon: XCircle, iconColor: "text-red-500" },
  maintenance: { color: "bg-yellow-100 text-yellow-800", icon: Wrench, iconColor: "text-yellow-500" },
  out_of_order: { color: "bg-red-100 text-red-800", icon: AlertTriangle, iconColor: "text-red-500" },
  emergency_stop: { color: "bg-red-100 text-red-800", icon: AlertTriangle, iconColor: "text-red-500" }
};

export default function PumpStatus({ pumps, isLoading }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="w-5 h-5" />
          Pump Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-6 w-16 mb-2" />
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pumps.map((pump) => {
              const config = statusConfig[pump.status] || statusConfig.offline;
              const StatusIcon = config.icon;
              
              return (
                <div key={pump.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Pump {pump.pump_number}</h3>
                    <StatusIcon className={`w-4 h-4 ${config.iconColor}`} />
                  </div>
                  <Badge className={`${config.color} mb-2`}>
                    {pump.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <p className="text-sm text-gray-600">{pump.pump_name}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    Products: {pump.products_available?.join(', ') || 'None'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}