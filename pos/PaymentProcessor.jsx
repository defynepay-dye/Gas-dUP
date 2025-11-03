
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, CreditCard, Smartphone, AlertCircle, User } from "lucide-react";
import { base44 } from '@/api/base44Client';

export default function PaymentProcessor({ cart, total, onClose, onComplete, pricingSettings, isProcessing, currentUser }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [cashTendered, setCashTendered] = useState('');
  const [changeDue, setChangeDue] = useState(0);
  const [localProcessing, setLocalProcessing] = useState(false);
  const [showClerkTenderConfirm, setShowClerkTenderConfirm] = useState(false);

  // Calculate employee's available credit
  const employeeAvailableCredit = currentUser?.employee_purchase_settings?.allow_purchases_on_credit
    ? (currentUser.employee_purchase_settings.credit_limit || 0) - (currentUser.employee_purchase_settings.current_payable_balance || 0)
    : 0;

  const canUseClerkTender = currentUser?.employee_purchase_settings?.allow_purchases_on_credit && employeeAvailableCredit >= total;

  useEffect(() => {
    if (selectedMethod === 'cash' && cashTendered) {
      const tendered = parseFloat(cashTendered);
      if (!isNaN(tendered) && tendered >= total) {
        setChangeDue(tendered - total);
      } else {
        setChangeDue(0);
      }
    }
  }, [cashTendered, total, selectedMethod]);

  const handlePayment = async () => {
    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }

    if (selectedMethod === 'cash') {
      const tendered = parseFloat(cashTendered);
      if (isNaN(tendered) || tendered < total) {
        alert('Insufficient cash tendered');
        return;
      }
    }

    if (selectedMethod === 'clerk_tender') {
      setShowClerkTenderConfirm(true);
      return;
    }

    await processStandardPayment();
  };

  const processClerkTender = async () => {
    setShowClerkTenderConfirm(false);
    setLocalProcessing(true);

    try {
      const payment = {
        method: 'clerk_tender',
        amount: total,
        tendered: total,
        change: 0,
        employee_id: currentUser.id,
        employee_name: currentUser.full_name
      };

      await onComplete([payment], 'clerk_tender');

      const newBalance = (currentUser.employee_purchase_settings.current_payable_balance || 0) + total;
      const creditLimit = currentUser.employee_purchase_settings.credit_limit || 0;
      const percentUsed = creditLimit > 0 ? (newBalance / creditLimit * 100) : 0;

      // Send email notification if approaching or at limit
      if (percentUsed >= 80) {
        try {
          // Assuming `currentScope` is available via context or props in the parent component
          // or we fallback to 'Store Management'
          const currentScope = {}; // Placeholder if not passed as prop or context.
                                 // In a real app, you would pass this or retrieve from context.

          await base44.integrations.Core.SendEmail({
            to: currentUser.email,
            subject: `Employee Credit Balance Alert - ${percentUsed >= 100 ? 'LIMIT REACHED' : 'Approaching Limit'}`,
            body: `
Hello ${currentUser.full_name},

This is an automated notification regarding your employee purchase credit account.

Current Status:
- Current Balance: $${newBalance.toFixed(2)}
- Credit Limit: $${creditLimit.toFixed(2)}
- Percentage Used: ${percentUsed.toFixed(1)}%
- Available Credit: $${Math.max(0, creditLimit - newBalance).toFixed(2)}

${percentUsed >= 100 
  ? '⚠️ You have reached your credit limit and cannot make additional purchases on credit until you pay down your balance.' 
  : '⚠️ You are approaching your credit limit. Please consider paying down your balance soon.'}

You can pay down your balance at any POS terminal by accessing the Admin panel and selecting "Pay Down Balance".

Questions? Contact your store manager.

Thank you,
${currentScope?.label || 'Store Management'}
            `
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't fail the transaction if email fails
        }
      }

      alert(`✅ Purchase charged to employee account\n\nAmount: $${total.toFixed(2)}\nNew Balance: $${newBalance.toFixed(2)}\nAvailable Credit: $${Math.max(0, creditLimit - newBalance).toFixed(2)}`);
      
    } catch (error) {
      console.error('Clerk tender payment failed:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setLocalProcessing(false);
    }
  };

  const processStandardPayment = async () => {
    setLocalProcessing(true);

    try {
      const payment = {
        method: selectedMethod,
        amount: total,
        tendered: selectedMethod === 'cash' ? parseFloat(cashTendered) : total,
        change: selectedMethod === 'cash' ? changeDue : 0
      };

      if (selectedMethod === 'credit_card' || selectedMethod === 'debit_card') {
        payment.card_last_four = '****';
        payment.authorization_code = `AUTH${Date.now()}`;
      }

      await onComplete([payment]);
    } catch (error) {
      console.error('Payment processing failed:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setLocalProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Amount Due:</p>
            <p className="text-3xl font-bold text-blue-600">${total.toFixed(2)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={selectedMethod === 'cash' ? 'default' : 'outline'}
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => setSelectedMethod('cash')}
            >
              <DollarSign className="w-6 h-6 mb-1" />
              Cash
            </Button>

            <Button
              variant={selectedMethod === 'credit_card' ? 'default' : 'outline'}
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => setSelectedMethod('credit_card')}
            >
              <CreditCard className="w-6 h-6 mb-1" />
              Credit Card
            </Button>

            <Button
              variant={selectedMethod === 'debit_card' ? 'default' : 'outline'}
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => setSelectedMethod('debit_card')}
            >
              <CreditCard className="w-6 h-6 mb-1" />
              Debit Card
            </Button>

            <Button
              variant={selectedMethod === 'mobile_payment' ? 'default' : 'outline'}
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => setSelectedMethod('mobile_payment')}
            >
              <Smartphone className="w-6 h-6 mb-1" />
              Mobile Pay
            </Button>

            {currentUser?.employee_purchase_settings?.allow_purchases_on_credit && (
              <Button
                variant={selectedMethod === 'clerk_tender' ? 'default' : 'outline'}
                className={`h-20 flex flex-col items-center justify-center col-span-2 ${!canUseClerkTender ? 'opacity-50' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                onClick={() => canUseClerkTender && setSelectedMethod('clerk_tender')}
                disabled={!canUseClerkTender}
              >
                <User className="w-6 h-6 mb-1" />
                Charge to My Account
                <span className="text-xs mt-1">
                  Available Credit: ${employeeAvailableCredit.toFixed(2)}
                </span>
              </Button>
            )}
          </div>

          {selectedMethod === 'cash' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="cash_tendered">Cash Tendered</Label>
                <Input
                  id="cash_tendered"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="text-2xl font-bold text-center"
                  autoFocus
                />
              </div>
              {changeDue > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Change Due:</p>
                  <p className="text-2xl font-bold text-green-600">${changeDue.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {selectedMethod === 'clerk_tender' && !canUseClerkTender && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription>
                <strong>Credit Limit Exceeded</strong><br />
                Current Balance: ${(currentUser.employee_purchase_settings.current_payable_balance || 0).toFixed(2)}<br />
                Credit Limit: ${(currentUser.employee_purchase_settings.credit_limit || 0).toFixed(2)}<br />
                Available Credit: ${employeeAvailableCredit.toFixed(2)}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={localProcessing || isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={localProcessing || isProcessing || !selectedMethod || (selectedMethod === 'clerk_tender' && !canUseClerkTender)}
            >
              {(localProcessing || isProcessing) ? 'Processing...' : selectedMethod === 'clerk_tender' ? 'Charge to My Account' : 'Complete Payment'}
            </Button>
          </div>
        </div>

        {showClerkTenderConfirm && (
          <Dialog open={true} onOpenChange={() => setShowClerkTenderConfirm(false)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Employee Credit Purchase</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <AlertDescription>
                    <strong>Employee:</strong> {currentUser.full_name}<br />
                    <strong>Purchase Amount:</strong> ${total.toFixed(2)}<br />
                    <strong>Current Balance:</strong> ${(currentUser.employee_purchase_settings.current_payable_balance || 0).toFixed(2)}<br />
                    <strong>New Balance:</strong> ${((currentUser.employee_purchase_settings.current_payable_balance || 0) + total).toFixed(2)}<br />
                    <strong>Credit Limit:</strong> ${(currentUser.employee_purchase_settings.credit_limit || 0).toFixed(2)}
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-gray-600">
                  This amount will be added to your payable balance and will be deducted from your paycheck.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowClerkTenderConfirm(false)}>
                  Cancel
                </Button>
                <Button onClick={processClerkTender} className="bg-purple-600 hover:bg-purple-700">
                  Confirm & Charge to My Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
