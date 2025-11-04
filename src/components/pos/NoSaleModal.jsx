import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import { NoSaleTransaction } from "@/api/entities";
import { Shift } from "@/api/entities";
import { User } from "@/api/entities";

export default function NoSaleModal({ shift, onClose, onNoSaleComplete }) {
  const [reasonCode, setReasonCode] = useState('');
  const [reasonDescription, setReasonDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reasonCode) {
      setError('Please select a reason for opening the drawer');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const currentUser = await User.me();
      
      await NoSaleTransaction.create({
        transaction_number: `NO-SALE-${Date.now()}`,
        cashier_name: currentUser.full_name,
        cashier_id: currentUser.id,
        shift_id: shift.shift_id,
        terminal_id: shift.terminal_id,
        reason_code: reasonCode,
        reason_description: reasonDescription.trim() || null,
        location_id: shift.location_id || currentUser.assigned_location_id
      });

      // Increment no-sale count on shift
      await Shift.update(shift.id, {
        no_sale_count: (shift.no_sale_count || 0) + 1
      });

      alert('No-sale recorded successfully. Opening drawer...');
      
      console.log('[NO-SALE] Drawer opened for reason:', reasonCode);
      
      if (onNoSaleComplete) {
        onNoSaleComplete();
      }
      
      onClose();
    } catch (err) {
      console.error('No-sale error:', err);
      setError('Failed to record no-sale. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Open Cash Drawer (No Sale)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <Label>Reason for Opening Drawer</Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="change_needed">Customer Needs Change</SelectItem>
                <SelectItem value="customer_inquiry">Customer Inquiry</SelectItem>
                <SelectItem value="manager_request">Manager Request</SelectItem>
                <SelectItem value="training">Training / Demonstration</SelectItem>
                <SelectItem value="system_check">System Check</SelectItem>
                <SelectItem value="safe_drop_prep">Safe Drop Preparation</SelectItem>
                <SelectItem value="till_count">Till Count</SelectItem>
                <SelectItem value="other">Other (explain below)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              value={reasonDescription}
              onChange={(e) => setReasonDescription(e.target.value)}
              placeholder="Provide any additional details..."
              rows={3}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> All no-sale transactions are logged and appear on your shift report. Excessive no-sales may require manager review.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing || !reasonCode}>
            {isProcessing ? 'Recording...' : 'Open Drawer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}