import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fuel, RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Pump } from "@/api/entities";

const statusConfig = {
  online: { bgColor: "bg-slate-200", textColor: "text-slate-800", label: "IDLE" },
  offline: { bgColor: "bg-red-600", textColor: "text-white", label: "INOP" },
  fueling: { bgColor: "bg-blue-600", textColor: "text-white", label: "BUSY" },
  calling: { bgColor: "bg-amber-500", textColor: "text-white", label: "CALL" },
  payable: { bgColor: "bg-orange-600", textColor: "text-white", label: "PAY" },
  finished: { bgColor: "bg-emerald-600", textColor: "text-white", label: "DONE" },
  emergency_stop: { bgColor: "bg-red-700", textColor: "text-white", label: "STOP" },
  maintenance: { bgColor: "bg-purple-600", textColor: "text-white", label: "MAINT" }
};

export default function CompactFuelPanel({ pumps, products, isLoading, onPumpClick, onReload }) {
  const [simulatingLift, setSimulatingLift] = React.useState(false);

  const handleSimulateHandleLift = async (pumpId) => {
    setSimulatingLift(true);
    try {
      await Pump.update(pumpId, { status: 'calling' });
      await onReload();
      console.log(`📞 Pump now CALLING - customer lifted handle`);
    } catch (error) {
      console.error("Error simulating handle lift:", error);
    } finally {
      setSimulatingLift(false);
    }
  };

  const sortedPumps = React.useMemo(() => {
    if (!pumps || !Array.isArray(pumps)) return [];
    return [...pumps].sort((a, b) => a.pump_number - b.pump_number);
  }, [pumps]);

  const stationHealth = React.useMemo(() => {
    if (!sortedPumps.length) return null;

    const total = sortedPumps.length;
    const online = sortedPumps.filter(p => ['online', 'fueling', 'payable', 'finished'].includes(p.status)).length;
    const offline = sortedPumps.filter(p => ['offline', 'emergency_stop'].includes(p.status)).length;
    const needsAttention = sortedPumps.filter(p => ['calling', 'maintenance', 'offline', 'emergency_stop'].includes(p.status));
    const uptime = total > 0 ? ((online / total) * 100).toFixed(1) : 0;

    const healthStatus = 
      uptime >= 95 ? 'excellent' :
      uptime >= 85 ? 'good' :
      uptime >= 70 ? 'degraded' :
      'critical';

    return {
      total,
      online,
      offline,
      needsAttention,
      uptime,
      healthStatus,
      statusColor: 
        healthStatus === 'excellent' ? 'text-green-600' :
        healthStatus === 'good' ? 'text-blue-600' :
        healthStatus === 'degraded' ? 'text-amber-600' :
        'text-red-600',
      statusBg:
        healthStatus === 'excellent' ? 'bg-green-50 border-green-200' :
        healthStatus === 'good' ? 'bg-blue-50 border-blue-200' :
        healthStatus === 'degraded' ? 'bg-amber-50 border-amber-200' :
        'bg-red-50 border-red-200'
    };
  }, [sortedPumps]);

  return (
    <Card className="bg-white shadow-lg border-slate-200">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-blue-700">
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          <Fuel className="w-5 h-5" />
          Fueling Positions ({sortedPumps.length})
          {isLoading && (
            <div className="ml-2 text-sm text-blue-100 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Loading...
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onReload}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const onlinePump = sortedPumps.find(p => p.status === 'online');
                if (onlinePump) {
                  handleSimulateHandleLift(onlinePump.id);
                } else {
                  alert('No online pumps available to simulate lift.');
                }
              }}
              disabled={simulatingLift}
              className="text-white hover:bg-white/20 text-xs"
              title="Simulate customer lifting handle"
            >
              📞 Sim Lift
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {Array(16).fill(0).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {sortedPumps.map((pump) => {
              const config = statusConfig[pump.status] || statusConfig.offline;
              const isClickable = pump.status !== 'offline' && pump.status !== 'emergency_stop';
              const needsAttention = ['offline', 'emergency_stop', 'calling'].includes(pump.status);
              
              let displayAmount = null;
              let displayGallons = null;
              let displayLabel = null;
              
              if (pump.status === 'fueling') {
                displayAmount = pump.current_amount || 0;
                displayGallons = pump.current_gallons || 0;
                displayLabel = 'LIVE';
              } else if (pump.status === 'payable') {
                displayAmount = pump.current_amount || 0;
                displayGallons = pump.current_gallons || 0;
                displayLabel = 'DUE';
              } else if (pump.status === 'finished') {
                displayAmount = pump.last_transaction_amount || 0;
                displayGallons = pump.last_transaction_gallons || 0;
                displayLabel = 'LAST';
              } else if (pump.status === 'online' && (pump.last_transaction_amount || 0) > 0) {
                displayAmount = pump.last_transaction_amount;
                displayGallons = pump.last_transaction_gallons;
                displayLabel = 'LAST';
              }

              return (
                <div
                  key={pump.id}
                  onClick={() => isClickable && onPumpClick(pump)}
                  className={`aspect-square flex flex-col items-center justify-center border-2 rounded-lg text-center transition-all duration-200 shadow-sm hover:shadow-lg
                    ${isClickable ? 'cursor-pointer hover:border-blue-500' : 'cursor-not-allowed opacity-70'}
                    ${pump.status === 'payable' ? 'animate-pulse border-orange-500 ring-2 ring-orange-300' : 'border-slate-200'}
                    ${pump.status === 'calling' ? 'animate-bounce border-amber-500 ring-2 ring-amber-300 ring-offset-2' : ''}
                    ${pump.status === 'fueling' ? 'border-blue-500 ring-2 ring-blue-300' : ''}
                    ${needsAttention && pump.status !== 'calling' ? 'ring-2 ring-red-300' : ''}
                  `}
                >
                  <div className={`w-full text-center py-2 rounded-t-md ${config.bgColor} ${config.textColor}`}>
                    <span className="font-bold text-xl">{pump.pump_number}</span>
                    {needsAttention && pump.status !== 'calling' && <AlertTriangle className="w-3 h-3 mx-auto mt-1" />}
                    {pump.status === 'calling' && <AlertTriangle className="w-3 h-3 mx-auto mt-1 text-white" />}
                  </div>
                  <div className="flex-1 flex flex-col justify-center px-2 py-1 w-full">
                    <span className="font-semibold text-xs">{config.label}</span>
                    
                    {displayAmount !== null && (
                      <div className="mt-1 space-y-0.5">
                        <div className={`text-[10px] font-semibold ${
                          pump.status === 'fueling' ? 'text-blue-600 animate-pulse' : 
                          pump.status === 'payable' ? 'text-orange-600 font-bold' : 
                          'text-gray-500'
                        }`}>
                          {displayLabel}
                        </div>
                        <div className={`text-xs font-bold ${
                          pump.status === 'fueling' ? 'text-blue-600' : 
                          pump.status === 'payable' ? 'text-orange-600 text-lg' : 
                          'text-gray-600'
                        }`}>
                          ${displayAmount.toFixed(2)}
                        </div>
                        <div className="text-[9px] text-gray-500">
                          {displayGallons.toFixed(2)} gal
                        </div>
                      </div>
                    )}
                    
                    {pump.status === 'fueling' && pump.preauth_amount && (
                      <div className="text-[8px] text-gray-400 mt-0.5">
                        Lim: ${pump.preauth_amount.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Health Summary Section */}
        {stationHealth && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${stationHealth.statusBg}`}>
              <div className="flex items-center gap-2">
                {stationHealth.healthStatus === 'excellent' || stationHealth.healthStatus === 'good' ? (
                  <CheckCircle className={`w-5 h-5 ${stationHealth.statusColor}`} />
                ) : (
                  <AlertTriangle className={`w-5 h-5 ${stationHealth.statusColor}`} />
                )}
                <div>
                  <p className="text-xs font-medium text-gray-600">Station Health</p>
                  <p className={`text-sm font-bold ${stationHealth.statusColor} capitalize`}>
                    {stationHealth.healthStatus} ({stationHealth.uptime}% Uptime)
                  </p>
                </div>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex items-center gap-3 text-xs">
                <div className="text-center">
                  <p className="text-green-600 font-bold">{stationHealth.online}</p>
                  <p className="text-gray-500">Online</p>
                </div>
                <div className="text-center">
                  <p className="text-red-600 font-bold">{stationHealth.offline}</p>
                  <p className="text-gray-500">Offline</p>
                </div>
                {stationHealth.needsAttention.length > 0 && (
                  <div className="text-center">
                    <p className="text-amber-600 font-bold">{stationHealth.needsAttention.length}</p>
                    <p className="text-gray-500">Attention</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}