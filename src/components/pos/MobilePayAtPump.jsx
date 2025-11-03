import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  QrCode, 
  MapPin, 
  CreditCard, 
  Fuel,
  CheckCircle2,
  AlertTriangle,
  Timer,
  Zap
} from "lucide-react";
import { MobileFuelingSession, CustomerProfile } from "@/api/entities";

export default function MobilePayAtPump({ pumps, onSessionCreated }) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedPump, setSelectedPump] = useState(null);
  const [customerPhone, setCustomerPhone] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    loadActiveSessions();
    const interval = setInterval(loadActiveSessions, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveSessions = async () => {
    try {
      const sessions = await MobileFuelingSession.filter(
        { session_status: ["initiated", "pump_authorized", "fueling"] },
        "-initiated_at"
      );
      setActiveSessions(sessions);
    } catch (error) {
      console.error("Error loading mobile sessions:", error);
    }
  };

  const createMobileSession = async () => {
    if (!selectedPump || !customerPhone) return;
    
    setIsCreatingSession(true);
    try {
      // Generate unique QR code for this session
      const sessionId = `MOBILE-${Date.now()}-${selectedPump.pump_number}`;
      const qrCode = btoa(`fuelstation://pump/${selectedPump.pump_number}/session/${sessionId}`);
      
      const session = await MobileFuelingSession.create({
        session_id: sessionId,
        customer_id: customerPhone,
        pump_number: selectedPump.pump_number,
        qr_code: qrCode,
        session_status: "initiated",
        session_timestamps: {
          initiated_at: new Date().toISOString(),
          session_timeout: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minute timeout
        }
      });

      setShowQRCode(true);
      onSessionCreated?.(session);
      loadActiveSessions();
    } catch (error) {
      console.error("Error creating mobile session:", error);
    }
    setIsCreatingSession(false);
  };

  const getSessionStatusBadge = (status) => {
    const configs = {
      initiated: { color: "bg-blue-100 text-blue-800", icon: Timer },
      pump_authorized: { color: "bg-yellow-100 text-yellow-800", icon: Zap },
      fueling: { color: "bg-green-100 text-green-800", icon: Fuel },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle2 },
      cancelled: { color: "bg-red-100 text-red-800", icon: AlertTriangle }
    };
    
    const config = configs[status] || configs.initiated;
    const StatusIcon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <StatusIcon className="w-3 h-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Mobile Pay Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Mobile Pay-at-Pump Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Pump</label>
              <select 
                className="w-full p-2 border rounded-lg"
                value={selectedPump?.pump_number || ''}
                onChange={(e) => {
                  const pump = pumps.find(p => p.pump_number === parseInt(e.target.value));
                  setSelectedPump(pump);
                }}
              >
                <option value="">Choose pump...</option>
                {pumps.filter(p => p.status === 'online').map(pump => (
                  <option key={pump.pump_number} value={pump.pump_number}>
                    Pump {pump.pump_number}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Customer Phone</label>
              <Input
                placeholder="(555) 123-4567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={createMobileSession}
            disabled={!selectedPump || !customerPhone || isCreatingSession}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <QrCode className="w-4 h-4 mr-2" />
            {isCreatingSession ? "Creating Session..." : "Generate QR Code"}
          </Button>
        </CardContent>
      </Card>

      {/* Active Mobile Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Active Mobile Sessions ({activeSessions.length})
            </span>
            <Button size="sm" onClick={loadActiveSessions} variant="outline">
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No active mobile sessions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Fuel className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Pump {session.pump_number}</h4>
                        <p className="text-sm text-gray-600">{session.customer_id}</p>
                      </div>
                    </div>
                    {getSessionStatusBadge(session.session_status)}
                  </div>
                  
                  {session.session_status === 'fueling' && session.transaction_details && (
                    <div className="bg-white rounded-lg p-3 mt-3">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-500">Gallons</p>
                          <p className="font-bold text-lg">{(session.transaction_details.gallons_dispensed || 0).toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Price/Gal</p>
                          <p className="font-bold text-lg">${(session.transaction_details.price_per_gallon || 0).toFixed(3)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="font-bold text-lg text-green-600">${(session.transaction_details.total_amount || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500">
                      Started: {new Date(session.session_timestamps.initiated_at).toLocaleTimeString()}
                    </span>
                    <div className="flex gap-2">
                      {session.session_status === 'initiated' && (
                        <Button size="sm" variant="outline">
                          <QrCode className="w-3 h-3 mr-1" />
                          Show QR
                        </Button>
                      )}
                      <Button size="sm" variant="destructive">
                        Cancel Session
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}