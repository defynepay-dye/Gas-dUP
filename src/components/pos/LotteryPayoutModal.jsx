import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LotteryPayoutModal({ onComplete, onClose, currentUser, activeShift }) {
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }
    if (!reference.trim()) {
      setError("Please enter a ticket number or reference.");
      return;
    }

    const currentCash = activeShift?.cash_in_drawer || 0;
    if (numAmount > currentCash) {
      setError(`Amount exceeds current cash in drawer ($${currentCash.toFixed(2)}).`);
      return;
    }

    setError('');
    onComplete({ amount: numAmount, reference, notes });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <Card className="w-[450px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lottery Payout</CardTitle>
          <Button variant="ghost" onClick={onClose}>X</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Current Cash in Drawer: <span className="font-semibold text-lg">${(activeShift?.cash_in_drawer || 0).toFixed(2)}</span></p>
            </div>
            <div>
              <label htmlFor="payout-amount" className="block text-sm font-medium text-gray-700">Payout Amount</label>
              <Input
                id="payout-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 5.00"
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-gray-700">Ticket Number / Reference</label>
              <Input
                id="reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., Scratch-off #12345"
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
              <Input
                id="notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Customer John Doe"
                className="mt-1"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button onClick={handleSubmit} className="w-full">Process Payout</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};