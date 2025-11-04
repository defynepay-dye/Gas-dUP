
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Fuel, 
  Power, 
  PowerOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Wrench,
  Plus
} from "lucide-react";

const statusConfig = {
  online: { 
    color: "bg-green-100 text-green-800 border-green-200", 
    icon: CheckCircle, 
    iconColor: "text-green-500",
    bgColor: "bg-green-50 border-green-200"
  },
  offline: { 
    color: "bg-red-100 text-red-800 border-red-200", 
    icon: XCircle, 
    iconColor: "text-red-500",
    bgColor: "bg-red-50 border-red-200"
  },
  maintenance: { 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200", 
    icon: Wrench, 
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-50 border-yellow-200"
  },
  out_of_order: { 
    color: "bg-red-100 text-red-800 border-red-200", 
    icon: AlertTriangle, 
    iconColor: "text-red-500",
    bgColor: "bg-red-50 border-red-200"
  },
  emergency_stop: { 
    color: "bg-red-200 text-red-900 border-red-300", 
    icon: AlertTriangle, 
    iconColor: "text-red-600",
    bgColor: "bg-red-100 border-red-300"
  }
};

const productPrices = {
  regular: 3.299,
  midgrade: 3.499,
  premium: 3.799,
  diesel: 3.599,
  e85: 2.899
};

export default function FuelDispenserPanel({ pumps, onActivatePump, onStopPump, onAddFuelToCart, isLoading }) {
  const [selectedPump, setSelectedPump] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('regular');
  const [gallons, setGallons] = useState('');
  // manualPrice state is no longer used for input but kept for potential future use or to avoid breaking existing logic if it's referenced elsewhere.
  // For this component's scope, it's effectively removed from the UI and total calculation.
  const [manualPrice, setManualPrice] = useState(''); 

  const handleAddFuel = () => {
    if (!selectedPump || !gallons) return;
    
    // manualPrice is no longer taken from input, using default product price
    const price = productPrices[selectedProduct]; 
    onAddFuelToCart(selectedPump.pump_number, selectedProduct, parseFloat(gallons), parseFloat(price));
    setGallons('');
    setSelectedPump(null);
    setSelectedProduct('regular'); // Reset product selection after adding
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="w-5 h-5" />
          Fuel Dispensers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="p-3 border rounded-lg animate-pulse">
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded mb-1"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Compact Pump Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {pumps.map((pump) => {
                const config = statusConfig[pump.status] || statusConfig.offline;
                const StatusIcon = config.icon;
                
                return (
                  <div 
                    key={pump.id} 
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedPump?.id === pump.id ? 'ring-2 ring-blue-500' : config.bgColor
                    }`}
                    onClick={() => setSelectedPump(pump)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">P{pump.pump_number}</h3>
                      <StatusIcon className={`w-3 h-3 ${config.iconColor}`} />
                    </div>
                    
                    <Badge className={`${config.color} text-xs mb-2`}>
                      {pump.status === 'online' ? 'READY' : 
                       pump.status === 'offline' ? 'OFF' : 
                       pump.status.toUpperCase()}
                    </Badge>
                    
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onActivatePump(pump.id, 'regular');
                        }}
                        disabled={pump.status === 'online'}
                        className="flex-1 text-xs px-1 py-1 h-6"
                      >
                        <Power className="w-2 h-2" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStopPump(pump.id);
                        }}
                        disabled={pump.status === 'offline'}
                        className="flex-1 text-xs px-1 py-1 h-6"
                      >
                        <PowerOff className="w-2 h-2" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Fuel Add */}
            {selectedPump && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3">
                  <h4 className="font-medium mb-3 text-sm">Add Fuel - Pump {selectedPump.pump_number}</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <select 
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="regular">Regular</option>
                        <option value="midgrade">Midgrade</option>
                        <option value="premium">Premium</option>
                        <option value="diesel">Diesel</option>
                        <option value="e85">E85</option>
                      </select>
                    </div>
                    
                    <div>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="Gallons"
                        value={gallons}
                        onChange={(e) => setGallons(e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddFuel}
                        disabled={!gallons || parseFloat(gallons) <= 0}
                        size="sm"
                        className="flex-1"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedPump(null);
                          setGallons(''); // Clear gallons on cancel
                          setSelectedProduct('regular'); // Reset product on cancel
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>

                    {gallons && (
                      <div className="text-xs bg-white p-2 rounded border">
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>${(productPrices[selectedProduct] * parseFloat(gallons || 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
