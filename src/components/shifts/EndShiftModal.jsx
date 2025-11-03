import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { DollarSign, Lock, Clock } from "lucide-react";
import { User as UserEntity } from "@/api/entities";
import { TimeClockEntry } from "@/api/entities";
import { POSTransaction } from "@/api/entities";
import { CashManagement } from "@/api/entities";

export default function EndShiftModal({ shift, onEnd, onClose }) {
  const [closingCash, setClosingCash] = useState("");
  const [notes, setNotes] = useState("");
  const [pin, setPin] = useState("");
  const [reconciliationData, setReconciliationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const user = await UserEntity.me();
        setCurrentUser(user);
        
        if (shift && shift.shift_id) {
          await calculateExpectedCash();
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load shift data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [shift]);

  const calculateExpectedCash = async () => {
    try {
      const [transactions, cashMgmt] = await Promise.all([
        POSTransaction.filter({ shift_id: shift.shift_id }),
        CashManagement.filter({ shift_id: shift.shift_id })
      ]);

      const cashSales = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => {
          const cashPayment = t.payments?.find(p => p.method === 'cash');
          return sum + (cashPayment?.amount || 0);
        }, 0);

      const cashRemovals = cashMgmt
        .filter(t => ['lottery_payout', 'vendor_payout', 'safe_drop'].includes(t.transaction_type))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const cashAdditions = cashMgmt
        .filter(t => ['safe_pickup', 'change_fund'].includes(t.transaction_type))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const adjustments = shift.cash_adjustments || [];
      const totalAdjustments = adjustments.reduce((sum, adj) => sum + (adj.amount || 0), 0);

      const openingCash = parseFloat(shift.opening_cash || 0);
      const expectedCash = openingCash + cashSales - cashRemovals + cashAdditions + totalAdjustments;

      setReconciliationData({
        expectedCash,
        cashSales,
        cashRemovals,
        cashAdditions,
        adjustments: totalAdjustments,
        transactionCount: transactions.filter(t => t.status === 'completed').length
      });
    } catch (error) {
      console.error('Error calculating expected cash:', error);
      setError("Could not calculate expected cash");
    }
  };

  const handleEnd = async () => {
    if (!closingCash || parseFloat(closingCash) < 0) {
      setError("Please enter a valid closing cash amount");
      return;
    }

    if (!pin || pin.length !== 4) {
      setError("Please enter your 4-digit PIN to confirm");
      return;
    }

    // Verify PIN
    if (currentUser.pin && currentUser.pin !== pin) {
      setError("Invalid PIN. Please try again.");
      setPin("");
      return;
    }

    const actualCash = parseFloat(closingCash);
    const variance = actualCash - (reconciliationData?.expectedCash || 0);
    const isBalanced = Math.abs(variance) <= 0.01;

    if (!isBalanced && !notes.trim()) {
      setError("Please add notes to explain the cash variance (over or short).");
      return;
    }

    setIsLoading(true);

    try {
      const now = new Date().toISOString();

      // Update TimeClockEntry to clock out
      if (shift.time_clock_entry_id) {
        const clockInTime = new Date(shift.start_time);
        const clockOutTime = new Date(now);
        const totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);

        await TimeClockEntry.update(shift.time_clock_entry_id, {
          clock_out_time: now,
          status: 'clocked_out',
          total_hours: parseFloat(totalHours.toFixed(2))
        });
      }

      // End shift
      const shiftEndData = {
        closing_cash: actualCash,
        expected_cash: reconciliationData?.expectedCash || 0,
        cash_variance: variance,
        notes: notes.trim(),
        end_time: now,
        status: 'completed'
      };

      onEnd(shiftEndData);
    } catch (err) {
      console.error("Failed to end shift:", err);
      setError("Could not end shift. Please try again.");
      setIsLoading(false);
    }
  };

  const variance = closingCash !== "" ? parseFloat(closingCash) - (reconciliationData?.expectedCash || 0) : 0;
  const isOver = variance > 0.01;
  const isShort = variance < -0.01;
  const isBalanced = Math.abs(variance) <= 0.01;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>End Shift - {shift?.employee_name || 'Unknown Employee'}</DialogTitle>
        </DialogHeader>

        {isLoading && !reconciliationData ? (
          <div className="py-8 text-center text-gray-500">
            <p>Calculating expected cash...</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {reconciliationData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-blue-900">Expected Cash Breakdown</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Opening Cash:</span>
                    <span className="font-medium">${(shift?.opening_cash || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>+ Cash Sales ({reconciliationData.transactionCount} txns):</span>
                    <span className="font-medium">${reconciliationData.cashSales.toFixed(2)}</span>
                  </div>
                  {reconciliationData.cashAdditions > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>+ Cash Additions:</span>
                      <span className="font-medium">${reconciliationData.cashAdditions.toFixed(2)}</span>
                    </div>
                  )}
                  {reconciliationData.cashRemovals > 0 && (
                    <div className="flex justify-between text-red-700">
                      <span>- Cash Removals:</span>
                      <span className="font-medium">${reconciliationData.cashRemovals.toFixed(2)}</span>
                    </div>
                  )}
                  {reconciliationData.adjustments !== 0 && (
                    <div className={`flex justify-between ${reconciliationData.adjustments > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      <span>{reconciliationData.adjustments > 0 ? '+' : '-'} Adjustments:</span>
                      <span className="font-medium">${Math.abs(reconciliationData.adjustments).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-blue-900">
                    <span>Expected Cash in Drawer:</span>
                    <span className="text-lg">${reconciliationData.expectedCash.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="closing_cash">Actual Cash Counted *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="closing_cash"
                  type="number"
                  step="0.01"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  className="pl-10 text-lg font-semibold"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            {closingCash !== "" && reconciliationData && (
              <div className={`p-4 rounded-lg ${
                isBalanced ? 'bg-green-50 border border-green-200' : 
                isOver ? 'bg-yellow-50 border border-yellow-200' : 
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Variance (Over/Short):</span>
                  <span className={`text-2xl font-bold ${
                    isBalanced ? 'text-green-700' : 
                    isOver ? 'text-yellow-700' : 
                    'text-red-700'
                  }`}>
                    {variance >= 0 ? '+' : ''}${variance.toFixed(2)}
                  </span>
                </div>
                {!isBalanced && (
                  <p className="text-sm mt-2 text-gray-700">
                    {isOver ? '⚠️ Drawer is over. Explain in notes below.' : '⚠️ Drawer is short. Explain in notes below.'}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="notes">Shift Notes {!isBalanced && closingCash !== "" && '*'}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Any issues, incidents, or explanations for cash variance..."
              />
              {!isBalanced && closingCash !== "" && (
                <p className="text-xs text-red-600 mt-1">* Required when drawer doesn't balance</p>
              )}
            </div>

            <div>
              <Label htmlFor="pin">Your PIN to Confirm *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="pin"
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-digit PIN"
                  className="pl-10"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
              <Clock className="inline w-4 h-4 mr-1" />
              <strong>Automated Time Tracking:</strong> Ending your shift will automatically clock you out.
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleEnd} 
            disabled={isLoading || !closingCash || pin.length !== 4 || (closingCash !== "" && !isBalanced && !notes.trim())}
          >
            {isLoading ? 'Processing...' : 'End Shift & Clock Out'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}