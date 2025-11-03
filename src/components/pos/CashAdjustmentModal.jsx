import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shift } from '@/api/entities';
import { DollarSign, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CashAdjustmentModal({ shift, onClose, onAdjustmentComplete }) {
  const [adjustmentType, setAdjustmentType] = useState('mid_shift_addition');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [managerPin, setManagerPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!shift) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <p>No active shift found. Please start a shift first.</p>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) === 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a reason for this adjustment');
      return;
    }

    if (!managerPin) {
      alert('Manager PIN is required for cash adjustments');
      return;
    }

    setIsProcessing(true);

    try {
      const adjustmentAmount = parseFloat(amount);
      const signedAmount = ['mid_shift_removal', 'variance_correction'].includes(adjustmentType) && adjustmentAmount > 0
        ? -adjustmentAmount
        : adjustmentAmount;

      const currentDrawerBalance = shift.cash_in_drawer || 0;
      const newDrawerBalance = currentDrawerBalance + signedAmount;

      const newAdjustment = {
        adjusted_by: shift.employee_name || 'Unknown',
        adjusted_by_id: shift.employee_id || 'unknown',
        timestamp: new Date().toISOString(),
        adjustment_type: adjustmentType,
        amount: signedAmount,
        reason: reason,
        requires_manager_approval: true,
        approved_by: managerPin,
        approved_at: new Date().toISOString()
      };

      const currentAdjustments = shift.cash_adjustments || [];

      await Shift.update(shift.id, {
        cash_adjustments: [...currentAdjustments, newAdjustment],
        cash_in_drawer: newDrawerBalance
      });

      alert(`Cash adjustment recorded successfully!\n\nAmount: $${Math.abs(signedAmount).toFixed(2)} ${signedAmount >= 0 ? 'added to' : 'removed from'} drawer\nNew balance: $${newDrawerBalance.toFixed(2)}`);
      
      if (onAdjustmentComplete) {
        onAdjustmentComplete();
      }
      onClose();
    } catch (error) {
      console.error('Cash adjustment failed:', error);
      alert('Adjustment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Cash Adjustment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription>
              <strong>Current Cash in Drawer:</strong> ${(shift.cash_in_drawer || 0).toFixed(2)}
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="adjustment_type">Adjustment Type</Label>
            <Select value={adjustmentType} onValueChange={setAdjustmentType}>
              <SelectTrigger id="adjustment_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opening_cash_correction">Opening Cash Correction</SelectItem>
                <SelectItem value="mid_shift_addition">Mid-Shift Addition</SelectItem>
                <SelectItem value="mid_shift_removal">Mid-Shift Removal</SelectItem>
                <SelectItem value="variance_correction">Variance Correction</SelectItem>
                <SelectItem value="manager_override">Manager Override</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              {['mid_shift_removal', 'variance_correction'].includes(adjustmentType) 
                ? 'This amount will be REMOVED from the drawer' 
                : 'This amount will be ADDED to the drawer'}
            </p>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Adjustment</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this adjustment is needed..."
              rows={3}
            />
          </div>

          <Alert className="bg-yellow-50 border-yellow-300">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <AlertDescription>
              <p className="font-semibold text-yellow-900 mb-2">Manager Authorization Required</p>
              <Label htmlFor="manager_pin">Manager PIN</Label>
              <Input
                id="manager_pin"
                type="password"
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                placeholder="Enter manager PIN"
                maxLength={4}
                className="mt-1"
              />
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Submit Adjustment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}