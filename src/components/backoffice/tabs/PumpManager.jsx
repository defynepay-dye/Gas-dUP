
import React, { useState, useEffect } from "react";
import { Pump, POSTransaction, Location } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Fuel,
  AlertTriangle,
  Activity,
  Settings,
  QrCode,
  Info,
  PlusCircle,
  Smartphone,
  Trash2,
  MapPin
} from "lucide-react";

import PumpControls from "../../pumps/PumpControls";
import PumpQRCodeGenerator from "../../pumps/PumpQRCodeGenerator";
import PumpEditModal from "../../pumps/PumpEditModal";

export default function PumpManager({ currentScope }) {
  const [pumps, setPumps] = useState([]);
  const [selectedPump, setSelectedPump] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pumpStats, setPumpStats] = useState({});
  const [editingPump, setEditingPump] = useState(null);
  const [selectedPumpForQR, setSelectedPumpForQR] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  const [isAddPumpModalOpen, setIsAddPumpModalOpen] = useState(false);
  const [newPump, setNewPump] = useState({
    pump_number: '',
    status: 'online',
    fuel_type: 'Regular',
    capacity_gallons: 10000,
    gps_coordinates: {
      latitude: null,
      longitude: null,
    },
    mobile_payment_enabled: false,
    location_id: null,
  });

  useEffect(() => {
    loadPumps();
    loadPumpStats();

    if (currentScope?.label) {
      setCurrentLocation(currentScope.label);
      setNewPump(prev => ({ ...prev, location_id: currentScope.type === 'location' ? currentScope.id : null }));
    } else {
      setCurrentLocation("Gas Station X, 123 Main St, City, State");
      setNewPump(prev => ({ ...prev, location_id: null }));
    }
  }, [currentScope]);

  const loadPumps = async () => {
    setIsLoading(true);
    try {
      let data;

      if (currentScope?.type === 'location' && currentScope?.id) {
        data = await Pump.filter({ location_id: currentScope.id }, "pump_number");
      } else if (currentScope?.type === 'region' && currentScope?.id) {
        const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
        const regionLocationIds = locationsData
          .filter(loc => loc.region_id === currentScope.id)
          .map(loc => loc.id);

        const allPumps = await Pump.list("pump_number");
        data = allPumps.filter(p => regionLocationIds.includes(p.location_id));
      } else {
        data = await Pump.list("pump_number");
      }

      const uniquePumps = data
        .filter((pump, index, self) =>
          index === self.findIndex(p =>
            p.pump_number === pump.pump_number && p.location_id === pump.location_id
          )
        )
        .sort((a, b) => a.pump_number - b.pump_number);
      setPumps(uniquePumps);
    } catch (error) {
      console.error('Failed to load pumps:', error);
      setPumps([]);
    }
    setIsLoading(false);
  };

  const loadPumpStats = async () => {
    try {
      let transactions;

      if (currentScope?.type === 'location' && currentScope?.id) {
        transactions = await POSTransaction.filter({ location_id: currentScope.id }, "-created_date", 200);
      } else if (currentScope?.type === 'region' && currentScope?.id) {
        const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
        const regionLocationIds = locationsData
          .filter(loc => loc.region_id === currentScope.id)
          .map(loc => loc.id);

        const allTransactions = await POSTransaction.list("-created_date", 500);
        transactions = allTransactions.filter(t => regionLocationIds.includes(t.location_id));
      } else {
        transactions = await POSTransaction.list("-created_date", 200);
      }

      const today = new Date().toDateString();

      const stats = {};
      transactions.forEach(t => {
        const pumpIdentifier = `${t.pump_number}-${t.location_id}`;
        if (!stats[pumpIdentifier]) {
          stats[pumpIdentifier] = { todayCount: 0, todayTotal: 0, totalGallons: 0 };
        }

        if (new Date(t.created_date).toDateString() === today && t.status === 'completed') {
          stats[pumpIdentifier].todayCount++;
          stats[pumpIdentifier].todayTotal += (t.total_amount || 0);
        }

        if (t.status === 'completed' && t.items) {
          const fuelItems = t.items.filter(item => item.is_fuel);
          fuelItems.forEach(item => {
            stats[pumpIdentifier].totalGallons += (item.quantity || 0);
          });
        }
      });

      setPumpStats(stats);
    } catch (error) {
      console.error('Failed to load pump stats:', error);
      setPumpStats({});
    }
  };

  const updatePumpStatus = async (pumpId, newStatus) => {
    await Pump.update(pumpId, { status: newStatus });
    loadPumps();
  };

  const emergencyStopAll = async () => {
    if (confirm("Are you sure you want to emergency stop all pumps?")) {
      const updatePromises = pumps.map(pump =>
        Pump.update(pump.id, { status: "emergency_stop" })
      );
      await Promise.all(updatePromises);
      loadPumps();
    }
  };

  const handleAddNewPump = async () => {
    if (!newPump.pump_number || isNaN(parseInt(newPump.pump_number))) {
      alert("Please enter a valid pump number.");
      return;
    }

    if (newPump.mobile_payment_enabled && (!newPump.gps_coordinates.latitude || !newPump.gps_coordinates.longitude)) {
      alert("GPS coordinates are required if mobile payment is enabled.");
      return;
    }

    const pumpToAdd = { ...newPump };
    if (currentScope?.type === 'location' && currentScope?.id) {
      pumpToAdd.location_id = currentScope.id;
    } else if (!pumpToAdd.location_id) {
      alert("Please select a specific location before adding a pump or provide a location ID.");
      return;
    }

    try {
      await Pump.create(pumpToAdd);
      alert(`Pump ${pumpToAdd.pump_number} added successfully!`);
      setIsAddPumpModalOpen(false);
      setNewPump({
        pump_number: '',
        status: 'online',
        fuel_type: 'Regular',
        capacity_gallons: 10000,
        gps_coordinates: {
          latitude: null,
          longitude: null,
        },
        mobile_payment_enabled: false,
        location_id: currentScope?.type === 'location' ? currentScope.id : null,
      });
      loadPumps();
    } catch (error) {
      console.error("Failed to add new pump:", error);
      alert("Failed to add pump. Please check console for details.");
    }
  };

  const handleDelete = async (pumpId) => {
    if (!confirm("Are you sure you want to delete this pump? This action cannot be undone.")) {
      return;
    }

    try {
      await Pump.delete(pumpId);
      alert("Pump deleted successfully");
      loadPumps();
    } catch (error) {
      console.error("Failed to delete pump:", error);
      alert("Failed to delete pump. It may be in use.");
    }
  };

  const statusCounts = pumps.reduce((counts, pump) => {
    counts[pump.status] = (counts[pump.status] || 0) + 1;
    return counts;
  }, {});

  const statusConfig = {
    online: { color: 'bg-green-500', label: 'Online' },
    offline: { color: 'bg-red-500', label: 'Offline' },
    maintenance: { color: 'bg-yellow-500', label: 'Maintenance' },
    out_of_order: { color: 'bg-red-600', label: 'Out of Order' },
    emergency_stop: { color: 'bg-red-800', label: 'Emergency' },
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    maintenance: 'bg-yellow-500',
    fueling: 'bg-blue-500',
    payable: 'bg-purple-500'
  };

  return (
    <div className="space-y-6">
      {currentScope && (currentScope.type === 'location' || currentScope.type === 'region') && (
        <Alert className="bg-blue-50 border-blue-200">
          <MapPin className="w-4 h-4 text-blue-600" />
          <AlertDescription>
            <strong>Viewing pumps for:</strong> {currentScope.label}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Pump Configuration & Status</h2>
          <p className="text-gray-500">Monitor and configure fuel dispensers.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={loadPumps}
            className="flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Refresh Status
          </Button>
          <Button
            variant="default"
            onClick={() => setIsAddPumpModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={currentScope?.type !== 'location'}
          >
            <PlusCircle className="w-4 h-4" />
            Add New Pump
          </Button>
          <Button
            variant="destructive"
            onClick={emergencyStopAll}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Emergency Stop All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries({
          online: { label: "Online", color: "bg-green-500", count: statusCounts.online || 0 },
          offline: { label: "Offline", color: "bg-red-500", count: statusCounts.offline || 0 },
          maintenance: { label: "Maintenance", color: "bg-yellow-500", count: statusCounts.maintenance || 0 },
          out_of_order: { label: "Out of Order", color: "bg-red-600", count: statusCounts.out_of_order || 0 },
          emergency_stop: { label: "Emergency", color: "bg-red-800", count: statusCounts.emergency_stop || 0 },
        }).map(([key, { label, color, count }]) => (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 ${color} rounded-full`}></div>
                <span className="text-sm font-medium">{label}</span>
                <span className="ml-auto font-bold">{count}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div></CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          pumps.map(pump => {
            const pumpIdentifier = `${pump.pump_number}-${pump.location_id}`;
            return (
              <Card key={pump.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${statusColors[pump.status] || 'bg-gray-100'}`}>
                        <Fuel className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <span>Pump {pump.pump_number}</span>
                          <Badge className={statusConfig[pump.status]?.color || 'bg-gray-500'}>
                            {pump.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </CardTitle>
                        {pump.mobile_payment_enabled && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 mt-1">
                            <Smartphone className="w-3 h-3 mr-1" />
                            Mobile Enabled
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Daily Sales:</span>
                    <span className="font-semibold text-gray-800">
                      ${pumpStats[pumpIdentifier]?.todayTotal?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Transactions Today:</span>
                    <span className="font-semibold text-gray-800">
                      {pumpStats[pumpIdentifier]?.todayCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Total Gallons:</span>
                    <span className="font-semibold text-gray-800">
                      {pumpStats[pumpIdentifier]?.totalGallons?.toFixed(2) || '0.00'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPump(pump)}
                      className="flex flex-col items-center justify-center h-16 p-1"
                    >
                      <Activity className="w-4 h-4 mb-1" />
                      <span className="text-xs">Controls</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingPump(pump)}
                      className="flex flex-col items-center justify-center h-16 p-1"
                    >
                      <Settings className="w-4 h-4 mb-1" />
                      <span className="text-xs">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPumpForQR(pump)}
                      className="flex flex-col items-center justify-center h-16 p-1"
                      disabled={!pump.mobile_payment_enabled}
                    >
                      <QrCode className="w-4 h-4 mb-1" />
                      <span className="text-xs">QR</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(pump.id)}
                      className="flex flex-col items-center justify-center h-16 p-1"
                    >
                      <Trash2 className="w-4 h-4 mb-1" />
                      <span className="text-xs">Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {selectedPump && (
        <Dialog open={!!selectedPump} onOpenChange={() => setSelectedPump(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Controls for Pump {selectedPump.pump_number}</DialogTitle>
            </DialogHeader>
            <PumpControls
              selectedPump={selectedPump}
              onStatusUpdate={updatePumpStatus}
              onPumpUpdated={() => {
                loadPumps();
                setSelectedPump(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {editingPump && (
        <PumpEditModal
          pump={editingPump}
          onClose={() => setEditingPump(null)}
          onPumpUpdated={() => {
            loadPumps();
            setEditingPump(null);
          }}
        />
      )}

      {selectedPumpForQR && currentLocation && (
        <PumpQRCodeGenerator
          pump={selectedPumpForQR}
          location={{ id: selectedPumpForQR.location_id, name: currentLocation }}
          onClose={() => setSelectedPumpForQR(null)}
        />
      )}

      <Dialog open={isAddPumpModalOpen} onOpenChange={setIsAddPumpModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Fuel Pump</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
            <div className="col-span-1">
              <Label htmlFor="pump_number">Pump Number</Label>
              <Input
                id="pump_number"
                type="number"
                placeholder="e.g., 1, 2, 3..."
                value={newPump.pump_number}
                onChange={(e) => setNewPump({ ...newPump, pump_number: parseInt(e.target.value) || '' })}
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="status">Initial Status</Label>
              <Input
                id="status"
                value={newPump.status}
                onChange={(e) => setNewPump({ ...newPump, status: e.target.value })}
                placeholder="online, offline, maintenance..."
              />
            </div>
            {currentScope?.type !== 'location' && (
              <div className="col-span-2">
                <Label htmlFor="location_id">Location ID (Required for new pump)</Label>
                <Input
                  id="location_id"
                  type="text"
                  placeholder="e.g., loc_123abc"
                  value={newPump.location_id || ''}
                  onChange={(e) => setNewPump({ ...newPump, location_id: e.target.value })}
                />
              </div>
            )}
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-4">GPS Coordinates (For Mobile Payments)</h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    placeholder="40.712800"
                    value={newPump.gps_coordinates?.latitude || ''}
                    onChange={(e) => setNewPump({
                      ...newPump,
                      gps_coordinates: {
                        ...newPump.gps_coordinates,
                        latitude: parseFloat(e.target.value) || null
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    placeholder="-74.006000"
                    value={newPump.gps_coordinates?.longitude || ''}
                    onChange={(e) => setNewPump({
                      ...newPump,
                      gps_coordinates: {
                        ...newPump.gps_coordinates,
                        longitude: parseFloat(e.target.value) || null
                      }
                    })}
                  />
                </div>
                <div className="col-span-2">
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      <strong>How to get GPS coordinates:</strong><br />
                      1. Open Google Maps on your phone<br />
                      2. Stand at the pump location<br />
                      3. Long-press on the map at your exact location<br />
                      4. Copy the coordinates (latitude, longitude)<br />
                      5. Paste them here
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="mobile_payment_enabled"
                  checked={newPump.mobile_payment_enabled}
                  onCheckedChange={(checked) => setNewPump({ ...newPump, mobile_payment_enabled: checked })}
                />
                <Label htmlFor="mobile_payment_enabled">Enable Mobile Pay-at-Pump (requires GPS coordinates)</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPumpModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNewPump}>Add Pump</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
