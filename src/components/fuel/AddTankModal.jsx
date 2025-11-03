import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FuelTank } from '@/api/entities';

export default function AddTankModal({ onClose, onSave }) {
  const [newTank, setNewTank] = useState({
    tank_number: '',
    tank_name: '',
    product_code: 'regular',
    capacity_gallons: '',
    current_physical_level: '',
    low_fuel_threshold: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await FuelTank.create({
        ...newTank,
        tank_number: parseInt(newTank.tank_number),
        capacity_gallons: parseFloat(newTank.capacity_gallons),
        current_physical_level: parseFloat(newTank.current_physical_level),
        low_fuel_threshold: parseFloat(newTank.low_fuel_threshold),
        last_physical_reading_date: new Date().toISOString()
      });
      onSave();
    } catch (error) {
      console.error("Failed to create tank:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Fuel Tank</DialogTitle>
          <DialogDescription>Configure a new underground storage tank.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tank-number">Tank Number</Label>
              <Input id="tank-number" type="number" value={newTank.tank_number} onChange={e => setNewTank({ ...newTank, tank_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tank-name">Tank Name</Label>
              <Input id="tank-name" value={newTank.tank_name} onChange={e => setNewTank({ ...newTank, tank_name: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-code">Fuel Product</Label>
            <Select value={newTank.product_code} onValueChange={value => setNewTank({ ...newTank, product_code: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="midgrade">Midgrade</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="e85">E85</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Total Capacity (Gallons)</Label>
              <Input id="capacity" type="number" value={newTank.capacity_gallons} onChange={e => setNewTank({ ...newTank, capacity_gallons: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current-level">Initial Level (Gallons)</Label>
              <Input id="current-level" type="number" value={newTank.current_physical_level} onChange={e => setNewTank({ ...newTank, current_physical_level: e.target.value })} />
            </div>
          </div>
           <div className="space-y-2">
              <Label htmlFor="low-threshold">Low Fuel Threshold (Gallons)</Label>
              <Input id="low-threshold" type="number" value={newTank.low_fuel_threshold} onChange={e => setNewTank({ ...newTank, low_fuel_threshold: e.target.value })} />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Tank'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}