import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Wrench, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  Fuel,
  Activity
} from "lucide-react";

export default function HealthCheckModal({ pumps, onClose, onResetPump, onResetAll, onRefresh }) {
  const [isResetting, setIsResetting] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      idle: 'bg-green-500',
      calling: 'bg-yellow-500',
      authorized: 'bg-blue-500',
      fueling: 'bg-orange-500',
      payable: 'bg-purple-500',
      finished: 'bg-purple-500',
      offline: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusIcon = (status) => {
    if (status === 'offline' || status === 'error') {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (status === 'idle') {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return <Activity className="w-5 h-5 text-blue-500" />;
  };

  const handleResetAll = async () => {
    setIsResetting(true);
    await onResetAll();
    setIsResetting(false);
  };

  const handleResetPump = async (pumpId) => {
    setIsResetting(true);
    await onResetPump(pumpId);
    setIsResetting(false);
  };

  const offlinePumps = pumps.filter(p => p.status === 'offline').length;
  const activePumps = pumps.filter(p => ['fueling', 'authorized', 'calling'].includes(p.status)).length;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            System Health Check & Maintenance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* System Status Overview */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Pumps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{pumps.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Active Pumps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{activePumps}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Offline Pumps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">{offlinePumps}</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button onClick={onRefresh} variant="outline" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
            <Button 
              onClick={handleResetAll} 
              variant="destructive" 
              className="flex-1"
              disabled={isResetting}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Reset All Pumps
            </Button>
          </div>

          {/* Pump Status List */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Fuel className="w-4 h-4" />
              Individual Pump Status
            </h3>
            <div className="space-y-2">
              {pumps.map((pump) => (
                <Card key={pump.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(pump.status)}
                        <div>
                          <p className="font-semibold">Pump {pump.pump_number}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${getStatusColor(pump.status)} text-white`}>
                              {pump.status?.toUpperCase()}
                            </Badge>
                            {pump.active_product_code && (
                              <Badge variant="outline">
                                {pump.active_product_code.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {pump.status !== 'idle' && pump.status !== 'offline' && (
                          <div className="text-right text-sm">
                            {pump.preauth_amount > 0 && (
                              <p className="text-blue-600 font-semibold">
                                Auth: ${(pump.preauth_amount || 0).toFixed(2)}
                              </p>
                            )}
                            {pump.current_amount > 0 && (
                              <p className="text-orange-600 font-semibold">
                                Current: ${(pump.current_amount || 0).toFixed(2)}
                              </p>
                            )}
                            {pump.last_transaction_amount > 0 && (
                              <p className="text-purple-600 font-semibold">
                                Last: ${(pump.last_transaction_amount || 0).toFixed(2)}
                              </p>
                            )}
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResetPump(pump.id)}
                          disabled={isResetting || pump.status === 'idle'}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reset
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* System Information */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">System Information</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-1">
              <p><strong>Last Refresh:</strong> {new Date().toLocaleString()}</p>
              <p><strong>Terminal:</strong> POS-001</p>
              <p><strong>Version:</strong> FuelFlow Pro v1.0</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}