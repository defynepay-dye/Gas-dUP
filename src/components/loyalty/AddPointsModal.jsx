import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoyaltyProgram } from "@/api/entities";
import { Gift, Plus, Minus } from "lucide-react";

export default function AddPointsModal({ customer, onClose, onUpdate }) {
  const [pointsChange, setPointsChange] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' or 'remove'

  const handleSubmit = async () => {
    const points = parseInt(pointsChange);
    
    if (isNaN(points) || points <= 0) {
      alert('Please enter a valid number of points');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a reason for this adjustment');
      return;
    }

    setIsProcessing(true);

    try {
      const finalPoints = adjustmentType === 'add' ? points : -points;
      const newBalance = Math.max(0, customer.points_balance + finalPoints);

      await LoyaltyProgram.update(customer.id, {
        points_balance: newBalance
      });

      alert(`Successfully ${adjustmentType === 'add' ? 'added' : 'removed'} ${points} points!\n\nNew balance: ${newBalance} points`);
      
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error('Error adjusting points:', error);
      alert('Failed to adjust points. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            Adjust Points
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Customer</p>
            <p className="font-semibold">{customer.profile?.full_name || customer.customer_phone}</p>
            <p className="text-sm text-gray-600 mt-2">Current Balance</p>
            <p className="text-2xl font-bold text-purple-600">{customer.points_balance} points</p>
          </div>

          <div>
            <Label>Adjustment Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                type="button"
                variant={adjustmentType === 'add' ? 'default' : 'outline'}
                onClick={() => setAdjustmentType('add')}
                className="h-16"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Points
              </Button>
              <Button
                type="button"
                variant={adjustmentType === 'remove' ? 'default' : 'outline'}
                onClick={() => setAdjustmentType('remove')}
                className="h-16"
              >
                <Minus className="w-5 h-5 mr-2" />
                Remove Points
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="points">Number of Points</Label>
            <Input
              id="points"
              type="number"
              min="1"
              value={pointsChange}
              onChange={(e) => setPointsChange(e.target.value)}
              placeholder="Enter points..."
              autoFocus
            />
            {pointsChange && (
              <p className="text-sm text-gray-600 mt-1">
                {adjustmentType === 'add' ? '+' : '-'}{pointsChange} points = ${(parseInt(pointsChange) * 0.01).toFixed(2)} value
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reason">Reason for Adjustment *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Manager compensation, Customer service recovery, Promotion bonus..."
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be recorded in the customer's history
            </p>
          </div>

          {pointsChange && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>New Balance:</strong> {Math.max(0, customer.points_balance + (adjustmentType === 'add' ? parseInt(pointsChange) : -parseInt(pointsChange)))} points
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isProcessing || !pointsChange || !reason.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? 'Processing...' : `${adjustmentType === 'add' ? 'Add' : 'Remove'} Points`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}