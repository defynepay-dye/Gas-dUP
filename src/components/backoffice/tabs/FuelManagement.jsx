import React, { useState, useEffect } from 'react';
import { FuelTank } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Droplets, RefreshCw, Edit } from "lucide-react";
import AddTankModal from '../../fuel/AddTankModal';
import UpdateTankLevelModal from '../../fuel/UpdateTankLevelModal';
import FuelReconciliationModal from '../../fuel/FuelReconciliationModal';

const TankCard = ({ tank, onUpdate, onReconcile }) => {
  const percentage = (tank.current_physical_level / tank.capacity_gallons) * 100;
  let bgColor = "bg-green-500";
  if (percentage < 30) bgColor = "bg-yellow-500";
  if (percentage < 15) bgColor = "bg-red-500";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{tank.tank_name} ({tank.product_code})</CardTitle>
        <Droplets className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{tank.current_physical_level?.toLocaleString() || 0} gal</div>
        <p className="text-xs text-muted-foreground">of {tank.capacity_gallons?.toLocaleString()} gal capacity</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
          <div className={`${bgColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={() => onUpdate(tank)}><Edit className="w-4 h-4 mr-2" /> Update Level</Button>
          <Button size="sm" onClick={() => onReconcile(tank)}>Reconcile</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function FuelManagement() {
  const [tanks, setTanks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [updatingTank, setUpdatingTank] = useState(null);
  const [reconcilingTank, setReconcilingTank] = useState(null);

  const loadTanks = async () => {
    setIsLoading(true);
    try {
      const data = await FuelTank.list("tank_number");
      setTanks(data);
    } catch (error) {
      console.error("Failed to load fuel tanks:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTanks();
  }, []);

  const handleTankAdded = () => {
    setShowAddModal(false);
    loadTanks();
  };

  const handleLevelUpdated = () => {
    setUpdatingTank(null);
    loadTanks();
  };
  
  const handleReconciliationComplete = () => {
      setReconcilingTank(null);
      loadTanks();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fuel Tank Management</h2>
          <p className="text-gray-500">Monitor tank levels, manage deliveries, and perform reconciliation.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTanks} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tank
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p>Loading tanks...</p>
      ) : tanks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tanks.map(tank => (
            <TankCard key={tank.id} tank={tank} onUpdate={setUpdatingTank} onReconcile={setReconcilingTank} />
          ))}
        </div>
      ) : (
        <Card>
            <CardContent className="p-12 text-center">
                <Droplets className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium">No fuel tanks configured.</h3>
                <p className="text-gray-500 mb-4">Add your first tank to begin monitoring fuel levels.</p>
                <Button onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4 mr-2" />Add Fuel Tank</Button>
            </CardContent>
        </Card>
      )}

      {showAddModal && <AddTankModal onClose={() => setShowAddModal(false)} onSave={handleTankAdded} />}
      {updatingTank && <UpdateTankLevelModal tank={updatingTank} onClose={() => setUpdatingTank(null)} onSave={handleLevelUpdated} />}
      {reconcilingTank && <FuelReconciliationModal tank={reconcilingTank} onClose={() => setReconcilingTank(null)} onSave={handleReconciliationComplete} />}
    </div>
  );
}