import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Server } from 'lucide-react';
import { format } from 'date-fns';

export default function ClientLSSHealth({ lssConfigs, locations }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'offline': return <WifiOff className="w-4 h-4 text-gray-600" />;
      default: return <Server className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>LSS Health Status</CardTitle>
      </CardHeader>
      <CardContent>
        {lssConfigs.length === 0 ? (
          <div className="text-center py-8">
            <Server className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No LSS configurations yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lssConfigs.map(lss => {
              const location = locations.find(l => l.id === lss.location_id);
              const overallStatus = lss.health_status?.overall_status || 'offline';
              
              return (
                <div key={lss.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        overallStatus === 'healthy' ? 'bg-green-100' :
                        overallStatus === 'degraded' ? 'bg-yellow-100' :
                        overallStatus === 'critical' ? 'bg-red-100' :
                        'bg-gray-100'
                      }`}>
                        {getStatusIcon(overallStatus)}
                      </div>
                      <div>
                        <p className="font-semibold">{location?.location_name || 'Unknown Location'}</p>
                        <p className="text-xs text-gray-600">{lss.lss_identifier || 'No identifier'}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(overallStatus)}>
                      {overallStatus}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-600">Forecourt:</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {lss.health_status?.forecourt_controller_status || 'N/A'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">ATG:</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {lss.health_status?.atg_status || 'N/A'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">Payment:</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {lss.health_status?.payment_terminal_status || 'N/A'}
                      </Badge>
                    </div>
                    {lss.health_status?.last_health_check && (
                      <div>
                        <span className="text-gray-600">Last Check:</span>
                        <span className="ml-2 font-medium">
                          {format(new Date(lss.health_status.last_health_check), 'HH:mm')}
                        </span>
                      </div>
                    )}
                  </div>

                  {lss.last_sync_with_cloud && (
                    <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                      Last sync: {format(new Date(lss.last_sync_with_cloud), 'MMM d, yyyy HH:mm')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}