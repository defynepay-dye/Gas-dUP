import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FuelTank } from '@/api/entities';

export default function UpdateTankLevelModal({ tank, onClose, onSave }) {
  const [level, setLevel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await FuelTank.update(tank.id, {
        current_physical_level: parseFloat(level),
        last_physical_reading_date: new Date().toISOString(),
      });
      onSave();
    } catch (error) {
      console.error("Failed to update tank level:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Physical Tank Level</DialogTitle>
          <DialogDescription>Enter the current level for {tank.tank_name} based on a manual dip stick reading or ATG.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-level">New Physical Level (Gallons)</Label>
            <Input id="new-level" type="number" value={level} onChange={e => setLevel(e.target.value)} placeholder={`Last reading: ${tank.current_physical_level || 'N/A'}`} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Reading'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}