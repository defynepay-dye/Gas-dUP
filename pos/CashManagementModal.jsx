import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CashManagement, Shift, ArmorsafeDeposit } from '@/api/entities';
import { DollarSign, AlertCircle, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CashManagementModal({ activeShift, currentUser, onClose, onSuccess }) {
  const [transactionType, setTransactionType] = useState('safe_drop');
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [notes, setNotes] = useState('');
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Denomination breakdown for safe drops
  const [showDenominations, setShowDenominations] = useState(false);
  const [denominations, setDenominations] = useState({
    hundreds: 0,
    fifties: 0,
    twenties: 0,
    tens: 0,
    fives: 0,
    ones: 0,
    quarters: 0,
    dimes: 0,
    nickels: 0,
    pennies: 0
  });

  useEffect(() => {
    // Determine if manager authorization is required
    const authRequired = ['lottery_payout', 'vendor_payout'].includes(transactionType) && 
                        parseFloat(amount) > 100;
    setRequiresAuth(authRequired);
  }, [transactionType, amount]);

  useEffect(() => {
    // Show denomination breakdown for safe drops
    setShowDenominations(transactionType === 'safe_drop');
  }, [transactionType]);

  const calculateTotalFromDenominations = () => {
    return (
      denominations.hundreds * 100 +
      denominations.fifties * 50 +
      denominations.twenties * 20 +
      denominations.tens * 10 +
      denominations.fives * 5 +
      denominations.ones * 1 +
      denominations.quarters * 0.25 +
      denominations.dimes * 0.10 +
      denominations.nickels * 0.05 +
      denominations.pennies * 0.01
    );
  };

  const handleDenominationChange = (denom, value) => {
    const newDenoms = { ...denominations, [denom]: parseInt(value) || 0 };
    setDenominations(newDenoms);
    
    // Auto-calculate total
    const total = (
      newDenoms.hundreds * 100 +
      newDenoms.fifties * 50 +
      newDenoms.twenties * 20 +
      newDenoms.tens * 10 +
      newDenoms.fives * 5 +
      newDenoms.ones * 1 +
      newDenoms.quarters * 0.25 +
      newDenoms.dimes * 0.10 +
      newDenoms.nickels * 0.05 +
      newDenoms.pennies * 0.01
    );
    setAmount(total.toFixed(2));
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (requiresAuth && !managerPin) {
      alert('Manager authorization required for this transaction');
      return;
    }

    if (transactionType === 'vendor_payout' && !vendorName) {
      alert('Please enter vendor name');
      return;
    }

    if (transactionType === 'lottery_payout' && !referenceNumber) {
      alert('Please enter lottery ticket/reference number');
      return;
    }

    setIsProcessing(true);

    try {
      const transactionAmount = parseFloat(amount);
      const currentDrawerBalance = activeShift.cash_in_drawer || 0;

      // Determine drawer impact
      let newDrawerBalance = currentDrawerBalance;
      let signedAmount = transactionAmount;

      switch (transactionType) {
        case 'safe_drop':
          newDrawerBalance = currentDrawerBalance - transactionAmount;
          signedAmount = -transactionAmount;
          break;
        case 'safe_pickup':
          newDrawerBalance = currentDrawerBalance + transactionAmount;
          signedAmount = transactionAmount;
          break;
        case 'lottery_payout':
        case 'vendor_payout':
          newDrawerBalance = currentDrawerBalance - transactionAmount;
          signedAmount = -transactionAmount;
          break;
        case 'bank_deposit':
          // Bank deposits don't affect drawer (already removed via safe drop)
          signedAmount = 0;
          break;
      }

      // Create CashManagement record
      await CashManagement.create({
        transaction_type: transactionType,
        amount: signedAmount,
        reference_number: referenceNumber || null,
        vendor_name: vendorName || null,
        cashier_name: currentUser.full_name,
        manager_authorization: requiresAuth ? managerPin : null,
        shift_id: activeShift.id,
        notes: notes || null,
        drawer_balance_before: currentDrawerBalance,
        drawer_balance_after: newDrawerBalance
      });

      let confirmationCode = null;

      // If this is a safe drop, create ArmorsafeDeposit record
      if (transactionType === 'safe_drop') {
        confirmationCode = `ARM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        await ArmorsafeDeposit.create({
          shift_id: activeShift.id,
          location_id: activeShift.location_id,
          deposit_amount: transactionAmount,
          deposit_timestamp: new Date().toISOString(),
          armorsafe_unit_id: 'UNIT-001', // This would come from system configuration
          confirmation_code: confirmationCode,
          employee_id: currentUser.id,
          employee_name: currentUser.full_name,
          denomination_breakdown: showDenominations ? denominations : null,
          transaction_type: 'safe_drop',
          armorsafe_metadata: {
            transmission_status: 'pending',
            device_serial: 'AS-12345' // This would come from actual Armorsafe integration
          },
          notes: notes || null
        });
      }

      // Update shift's cash_in_drawer in real-time
      await Shift.update(activeShift.id, {
        cash_in_drawer: newDrawerBalance
      });

      // Build alert message
      let alertMessage = `${transactionType.replace('_', ' ').toUpperCase()} processed successfully!\n\nAmount: $${transactionAmount.toFixed(2)}\nNew drawer balance: $${newDrawerBalance.toFixed(2)}`;
      
      if (confirmationCode) {
        alertMessage += `\n\nArmorsafe Confirmation: ${confirmationCode}`;
      }

      alert(alertMessage);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Cash management transaction failed:', error);
      alert('Transaction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Cash Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription>
              <strong>Current Cash in Drawer:</strong> ${(activeShift.cash_in_drawer || 0).toFixed(2)}
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="transaction_type">Transaction Type</Label>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger id="transaction_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="safe_drop">Safe Drop</SelectItem>
                <SelectItem value="safe_pickup">Safe Pickup (Add Cash)</SelectItem>
                <SelectItem value="lottery_payout">Lottery Payout</SelectItem>
                <SelectItem value="vendor_payout">Vendor Payout</SelectItem>
                <SelectItem value="bank_deposit">Bank Deposit (Record Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showDenominations && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Denomination Breakdown (for Armorsafe)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: '$100', key: 'hundreds', multiplier: 100 },
                  { label: '$50', key: 'fifties', multiplier: 50 },
                  { label: '$20', key: 'twenties', multiplier: 20 },
                  { label: '$10', key: 'tens', multiplier: 10 },
                  { label: '$5', key: 'fives', multiplier: 5 },
                  { label: '$1', key: 'ones', multiplier: 1 },
                  { label: 'Quarters', key: 'quarters', multiplier: 0.25 },
                  { label: 'Dimes', key: 'dimes', multiplier: 0.10 },
                  { label: 'Nickels', key: 'nickels', multiplier: 0.05 },
                  { label: 'Pennies', key: 'pennies', multiplier: 0.01 }
                ].map(denom => (
                  <div key={denom.key}>
                    <Label className="text-xs">{denom.label}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={denominations[denom.key]}
                      onChange={(e) => handleDenominationChange(denom.key, e.target.value)}
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ${(denominations[denom.key] * denom.multiplier).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">
                  Calculated Total: ${calculateTotalFromDenominations().toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {!showDenominations && (
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
            </div>
          )}

          {transactionType === 'vendor_payout' && (
            <div>
              <Label htmlFor="vendor_name">Vendor Name</Label>
              <Input
                id="vendor_name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Enter vendor name"
              />
            </div>
          )}

          {transactionType === 'lottery_payout' && (
            <div>
              <Label htmlFor="reference_number">Lottery Ticket/Reference Number</Label>
              <Input
                id="reference_number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Enter ticket or reference number"
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {requiresAuth && (
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
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Complete Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}