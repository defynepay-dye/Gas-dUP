import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, CreditCard, Banknote, AlertCircle } from "lucide-react";

export default function PayDownBalanceModal({ employee, onClose, onSuccess }) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashTendered, setCashTendered] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentBalance = employee?.employee_purchase_settings?.current_payable_balance || 0;
  const changeDue = paymentMethod === 'cash' && cashTendered ? Math.max(0, parseFloat(cashTendered) - parseFloat(paymentAmount || 0)) : 0;

  const handlePayDown = async () => {
    const amount = parseFloat(paymentAmount);
    
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (amount > currentBalance) {
      alert('Payment amount cannot exceed current balance');
      return;
    }

    if (paymentMethod === 'cash') {
      const tendered = parseFloat(cashTendered);
      if (isNaN(tendered) || tendered < amount) {
        alert('Insufficient cash tendered');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Get all active payables for this employee
      const allPayables = await base44.entities.EmployeePayable.filter({
        employee_id: employee.id,
        status: ['active', 'partially_paid']
      }, 'purchase_date');

      let remainingPayment = amount;
      const updatedPayables = [];

      // Apply payment to oldest payables first (FIFO)
      for (const payable of allPayables) {
        if (remainingPayment <= 0) break;

        const amountToApply = Math.min(remainingPayment, payable.amount_remaining);
        const newAmountPaidDown = (payable.amount_paid_down || 0) + amountToApply;
        const newAmountRemaining = payable.amount_remaining - amountToApply;
        const newStatus = newAmountRemaining <= 0 ? 'paid_full' : 'partially_paid';

        const paymentRecord = {
          payment_date: new Date().toISOString(),
          amount: amountToApply,
          payment_method: paymentMethod,
          notes: `Pay down at POS`
        };

        await base44.entities.EmployeePayable.update(payable.id, {
          amount_paid_down: newAmountPaidDown,
          amount_remaining: newAmountRemaining,
          status: newStatus,
          payment_history: [...(payable.payment_history || []), paymentRecord]
        });

        remainingPayment -= amountToApply;
        updatedPayables.push({ ...payable, amountApplied: amountToApply });
      }

      // Update employee's current_payable_balance
      const newBalance = currentBalance - amount;
      await base44.auth.updateMe({
        employee_purchase_settings: {
          ...employee.employee_purchase_settings,
          current_payable_balance: Math.max(0, newBalance)
        }
      });

      alert(`✅ Payment Successful!\n\nAmount Paid: $${amount.toFixed(2)}\nNew Balance: $${newBalance.toFixed(2)}${paymentMethod === 'cash' ? `\nChange Due: $${changeDue.toFixed(2)}` : ''}`);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Pay down failed:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Down Employee Balance</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <AlertDescription>
              <div className="text-sm">
                <p className="font-semibold">{employee?.full_name}</p>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  Current Balance: ${currentBalance.toFixed(2)}
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="paymentAmount">Payment Amount</Label>
            <Input
              id="paymentAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="text-xl font-bold"
            />
          </div>

          <div>
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
                className="h-20"
              >
                <div className="flex flex-col items-center gap-2">
                  <Banknote className="w-6 h-6" />
                  <span>Cash</span>
                </div>
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="h-20"
              >
                <div className="flex flex-col items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  <span>Card</span>
                </div>
              </Button>
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div>
              <Label htmlFor="cashTendered">Cash Tendered</Label>
              <Input
                id="cashTendered"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="text-xl"
              />
              {changeDue > 0 && (
                <p className="text-sm text-green-600 font-semibold mt-1">
                  Change Due: ${changeDue.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handlePayDown} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Process Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}