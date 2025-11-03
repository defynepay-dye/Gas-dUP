import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shift } from "@/api/entities";
import { POSTransaction } from "@/api/entities";
import { CashManagement } from "@/api/entities";
import { NoSaleTransaction } from "@/api/entities";
import { User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { 
  DollarSign, AlertCircle, CheckCircle, Clock, TrendingUp, 
  Brain, Eye, Lock, Save, XCircle 
} from "lucide-react";
import { format } from "date-fns";

export default function ShiftReconciliation({ shift, onClose, onReconciled }) {
  const [reconciliationData, setReconciliationData] = useState(null);
  const [adjustedClosingCash, setAdjustedClosingCash] = useState(shift?.closing_cash || 0);
  const [managerNotes, setManagerNotes] = useState(shift?.notes || "");
  const [managerPin, setManagerPin] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadReconciliationData();
  }, [shift]);

  const loadReconciliationData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Load all shift-related data
      const [transactions, cashMgmt, noSales] = await Promise.all([
        POSTransaction.filter({ shift_id: shift.shift_id }),
        CashManagement.filter({ shift_id: shift.shift_id }),
        NoSaleTransaction.filter({ shift_id: shift.shift_id })
      ]);

      // Calculate expected cash
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

      const data = {
        expectedCash,
        actualCash: parseFloat(shift.closing_cash || 0),
        variance: parseFloat(shift.closing_cash || 0) - expectedCash,
        openingCash,
        cashSales,
        cashRemovals,
        cashAdditions,
        adjustments: totalAdjustments,
        transactionCount: transactions.filter(t => t.status === 'completed').length,
        noSaleCount: noSales.length,
        totalTransactions: transactions.length,
        cashManagementEvents: cashMgmt.length,
        shiftDuration: calculateShiftDuration(shift.start_time, shift.end_time)
      };

      setReconciliationData(data);
      setAdjustedClosingCash(data.actualCash);

      // Get AI insights
      await getAIInsights(data, shift, transactions, cashMgmt, noSales);

    } catch (error) {
      console.error('Error loading reconciliation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateShiftDuration = (start, end) => {
    if (!start || !end) return null;
    const duration = (new Date(end) - new Date(start)) / (1000 * 60 * 60);
    return duration.toFixed(2);
  };

  const getAIInsights = async (data, shift, transactions, cashMgmt, noSales) => {
    try {
      const prompt = `Analyze this shift reconciliation data and provide insights:

Shift Details:
- Employee: ${shift.employee_name}
- Duration: ${data.shiftDuration} hours
- Terminal: ${shift.terminal_id}
- Date: ${format(new Date(shift.start_time), 'MMM d, yyyy')}

Cash Reconciliation:
- Opening Cash: $${data.openingCash.toFixed(2)}
- Cash Sales: $${data.cashSales.toFixed(2)}
- Cash Additions: $${data.cashAdditions.toFixed(2)}
- Cash Removals: $${data.cashRemovals.toFixed(2)}
- Adjustments: $${data.adjustments.toFixed(2)}
- Expected Cash: $${data.expectedCash.toFixed(2)}
- Actual Cash: $${data.actualCash.toFixed(2)}
- Variance: $${data.variance.toFixed(2)}

Activity Metrics:
- Total Transactions: ${data.totalTransactions}
- Completed Transactions: ${data.transactionCount}
- No-Sale Events: ${data.noSaleCount}
- Cash Management Events: ${data.cashManagementEvents}

Provide a concise analysis with:
1. Overall Assessment (1-2 sentences)
2. Key Flags (list any concerns or anomalies)
3. Recommendations (specific actions for management)

Be direct and actionable.`;

      const response = await InvokeLLM({ prompt });
      setAiInsights(response);
    } catch (error) {
      console.error('Error getting AI insights:', error);
      setAiInsights("AI analysis unavailable");
    }
  };

  const handleReconcile = async () => {
    if (!managerPin || managerPin.length !== 4) {
      alert("Please enter your 4-digit manager PIN");
      return;
    }

    // Verify manager has appropriate role
    if (!['admin', 'store_manager', 'regional_manager', 'corporate_manager'].includes(currentUser.role)) {
      alert("Only managers can reconcile shifts");
      return;
    }

    // Verify PIN
    if (currentUser.pin && currentUser.pin !== managerPin) {
      alert("Invalid PIN. Please try again.");
      setManagerPin("");
      return;
    }

    setIsSaving(true);

    try {
      const updatedVariance = adjustedClosingCash - reconciliationData.expectedCash;

      await Shift.update(shift.id, {
        closing_cash: adjustedClosingCash,
        expected_cash: reconciliationData.expectedCash,
        cash_variance: updatedVariance,
        notes: managerNotes,
        reconciled: true,
        reconciled_by: currentUser.full_name,
        reconciled_by_id: currentUser.id,
        reconciled_at: new Date().toISOString()
      });

      alert("Shift reconciled successfully");
      if (onReconciled) onReconciled();
      onClose();
    } catch (error) {
      console.error("Failed to reconcile shift:", error);
      alert("Failed to reconcile shift. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Loading reconciliation data...</p>
        </CardContent>
      </Card>
    );
  }

  const isBalanced = Math.abs(reconciliationData.variance) <= 0.01;
  const isOver = reconciliationData.variance > 0.01;
  const isShort = reconciliationData.variance < -0.01;

  return (
    <div className="space-y-4">
      {/* Shift Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Shift Reconciliation: {shift.employee_name}</span>
            <Badge variant={shift.reconciled ? "default" : "secondary"}>
              {shift.reconciled ? "Reconciled" : "Pending Review"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Shift ID</p>
              <p className="font-semibold">{shift.shift_id}</p>
            </div>
            <div>
              <p className="text-gray-600">Terminal</p>
              <p className="font-semibold">{shift.terminal_id}</p>
            </div>
            <div>
              <p className="text-gray-600">Duration</p>
              <p className="font-semibold">{reconciliationData.shiftDuration} hours</p>
            </div>
            <div>
              <p className="text-gray-600">Start Time</p>
              <p className="font-semibold">{format(new Date(shift.start_time), 'MMM d, h:mm a')}</p>
            </div>
            <div>
              <p className="text-gray-600">End Time</p>
              <p className="font-semibold">{format(new Date(shift.end_time), 'MMM d, h:mm a')}</p>
            </div>
            <div>
              <p className="text-gray-600">Transactions</p>
              <p className="font-semibold">{reconciliationData.transactionCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Reconciliation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cash Reconciliation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Opening Cash:</span>
              <span className="font-medium">${reconciliationData.openingCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>+ Cash Sales:</span>
              <span className="font-medium">${reconciliationData.cashSales.toFixed(2)}</span>
            </div>
            {reconciliationData.cashAdditions > 0 && (
              <div className="flex justify-between text-sm text-green-700">
                <span>+ Cash Additions:</span>
                <span className="font-medium">${reconciliationData.cashAdditions.toFixed(2)}</span>
              </div>
            )}
            {reconciliationData.cashRemovals > 0 && (
              <div className="flex justify-between text-sm text-red-700">
                <span>- Cash Removals:</span>
                <span className="font-medium">${reconciliationData.cashRemovals.toFixed(2)}</span>
              </div>
            )}
            {reconciliationData.adjustments !== 0 && (
              <div className={`flex justify-between text-sm ${reconciliationData.adjustments > 0 ? 'text-green-700' : 'text-red-700'}`}>
                <span>{reconciliationData.adjustments > 0 ? '+' : '-'} Adjustments:</span>
                <span className="font-medium">${Math.abs(reconciliationData.adjustments).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold text-blue-900">
              <span>Expected Cash:</span>
              <span className="text-lg">${reconciliationData.expectedCash.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Actual Cash Counted:</span>
              <span className="text-lg">${reconciliationData.actualCash.toFixed(2)}</span>
            </div>
            <div className={`border-t pt-2 flex justify-between font-bold text-2xl ${
              isBalanced ? 'text-green-600' : isOver ? 'text-yellow-600' : 'text-red-600'
            }`}>
              <span>Variance (Over/Short):</span>
              <span>
                {reconciliationData.variance >= 0 ? '+' : ''}${reconciliationData.variance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Variance Status */}
          <div className={`mt-4 p-4 rounded-lg ${
            isBalanced ? 'bg-green-50 border border-green-200' : 
            isOver ? 'bg-yellow-50 border border-yellow-200' : 
            'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-semibold">
                {isBalanced ? 'Drawer Balanced' : isOver ? 'Drawer Over' : 'Drawer Short'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {aiInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {aiInsights}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{reconciliationData.transactionCount}</p>
              <p className="text-xs text-gray-600">Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">${reconciliationData.cashSales.toFixed(0)}</p>
              <p className="text-xs text-gray-600">Cash Sales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{reconciliationData.noSaleCount}</p>
              <p className="text-xs text-gray-600">No-Sales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{reconciliationData.cashManagementEvents}</p>
              <p className="text-xs text-gray-600">Cash Events</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manager Adjustment & Notes */}
      {!shift.reconciled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Manager Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adjusted_cash">Adjust Closing Cash (if needed)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="adjusted_cash"
                  type="number"
                  step="0.01"
                  value={adjustedClosingCash}
                  onChange={(e) => setAdjustedClosingCash(parseFloat(e.target.value) || 0)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="manager_notes">Manager Notes</Label>
              <Textarea
                id="manager_notes"
                value={managerNotes}
                onChange={(e) => setManagerNotes(e.target.value)}
                rows={4}
                placeholder="Document any discrepancies, explanations, or actions taken..."
              />
            </div>

            <div>
              <Label htmlFor="manager_pin">Your Manager PIN *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="manager_pin"
                  type="password"
                  maxLength={4}
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-digit PIN"
                  className="pl-10"
                  autoComplete="off"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          <XCircle className="w-4 h-4 mr-2" />
          Close
        </Button>
        {!shift.reconciled && (
          <Button 
            onClick={handleReconcile} 
            disabled={isSaving || !managerPin || managerPin.length !== 4}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Reconciling...' : 'Reconcile Shift'}
          </Button>
        )}
      </div>
    </div>
  );
}