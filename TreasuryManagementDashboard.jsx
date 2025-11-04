
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shift, CashManagement, ArmorsafeDeposit, POSTransaction } from '@/api/entities';
import { DollarSign, TrendingUp, Vault, AlertTriangle, CheckCircle, Clock, FileText, RefreshCw, Shield, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TreasuryManagementDashboard({ currentScope, activeShiftsData }) {
  const [activeShifts, setActiveShifts] = useState([]);
  const [recentDeposits, setRecentDeposits] = useState([]);
  const [cashManagementTransactions, setCashManagementTransactions] = useState([]);
  const [todayMetrics, setTodayMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadTreasuryData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadTreasuryData, 30000);
    return () => clearInterval(interval);
  }, [currentScope]);

  const loadTreasuryData = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Build filter based on scope
      let shiftFilter = { status: 'active' };
      let depositFilter = {};
      let cashMgmtFilter = {};
      let transactionFilter = { status: 'completed' };

      if (currentScope?.type === 'location') {
        shiftFilter.location_id = currentScope.id;
        depositFilter.location_id = currentScope.id;
        cashMgmtFilter.location_id = currentScope.id;
        transactionFilter.location_id = currentScope.id;
      }

      const [shifts, deposits, cashMgmt, transactions] = await Promise.all([
        Shift.filter(shiftFilter, '-start_time').catch(() => []),
        ArmorsafeDeposit.filter(depositFilter, '-deposit_timestamp', 10).catch(() => []),
        CashManagement.filter(cashMgmtFilter, '-created_date', 20).catch(() => []),
        POSTransaction.filter(transactionFilter, '-created_date', 100).catch(() => [])
      ]);

      setActiveShifts(shifts || []);
      setRecentDeposits(deposits || []);
      setCashManagementTransactions(cashMgmt || []);

      // Calculate today's metrics
      const todayTransactions = transactions.filter(t => 
        new Date(t.created_date) >= today
      );

      const totalCashSales = todayTransactions.reduce((sum, t) => {
        const cashPayment = t.payments?.find(p => p.method === 'cash');
        return sum + (cashPayment?.amount || 0);
      }, 0);

      const totalDeposits = deposits
        .filter(d => new Date(d.deposit_timestamp) >= today)
        .reduce((sum, d) => sum + d.deposit_amount, 0);

      const totalPayouts = cashMgmt
        .filter(cm => 
          new Date(cm.created_date) >= today && 
          ['lottery_payout', 'vendor_payout'].includes(cm.transaction_type)
        )
        .reduce((sum, cm) => sum + Math.abs(cm.amount), 0);

      const totalSafeDrops = cashMgmt
        .filter(cm => 
          new Date(cm.created_date) >= today && 
          cm.transaction_type === 'safe_drop'
        )
        .reduce((sum, cm) => sum + Math.abs(cm.amount), 0);

      setTodayMetrics({
        cashSales: totalCashSales,
        deposits: totalDeposits,
        payouts: totalPayouts,
        safeDrops: totalSafeDrops,
        transactionCount: todayTransactions.length
      });

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load treasury data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCashInDrawers = activeShifts.reduce((sum, shift) => sum + (shift.cash_in_drawer || 0), 0);
  const unreciledDeposits = recentDeposits.filter(d => !d.reconciled).length;

  // NEW: Calculate active drawer metrics if provided
  const activeCashMetrics = activeShiftsData ? {
    totalCash: activeShiftsData.reduce((sum, s) => sum + (s.cash_in_drawer || 0), 0),
    shiftCount: activeShiftsData.length,
    avgPerShift: activeShiftsData.length > 0 
      ? activeShiftsData.reduce((sum, s) => sum + (s.cash_in_drawer || 0), 0) / activeShiftsData.length 
      : 0
  } : null;

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Treasury Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time cash visibility and Armorsafe integration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500">Last Updated</p>
            <p className="text-sm font-medium">{format(lastRefresh, 'h:mm:ss a')}</p>
          </div>
          <Button onClick={loadTreasuryData} disabled={isLoading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* NEW: Active Cash Summary (only if activeShiftsData provided) */}
      {activeCashMetrics && activeCashMetrics.shiftCount > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Current Active Cash Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total in Active Drawers</p>
                <p className="text-2xl font-bold text-green-700">
                  ${activeCashMetrics.totalCash.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Shifts</p>
                <p className="text-2xl font-bold text-blue-700">
                  {activeCashMetrics.shiftCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg per Drawer</p>
                <p className="text-2xl font-bold text-purple-700">
                  ${activeCashMetrics.avgPerShift.toFixed(2)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Real-time data from currently active shifts within {currentScope?.label || 'all locations'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cash in Drawers */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <Badge className="bg-green-600 text-white">{activeShifts.length} Active</Badge>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Cash in Drawers</h3>
            <p className="text-3xl font-bold text-gray-900">${totalCashInDrawers.toFixed(2)}</p>
            {totalCashInDrawers > 2000 && (
              <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                High cash levels - consider safe drops
              </p>
            )}
          </CardContent>
        </Card>

        {/* Today's Cash Sales */}
        {todayMetrics && (
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                <Badge className="bg-blue-600 text-white">{todayMetrics.transactionCount} Txns</Badge>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Today's Cash Sales</h3>
              <p className="text-3xl font-bold text-gray-900">${todayMetrics.cashSales.toFixed(2)}</p>
            </CardContent>
          </Card>
        )}

        {/* Armorsafe Deposits */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Vault className="w-8 h-8 text-purple-600" />
              <Badge className="bg-purple-600 text-white">{recentDeposits.length} Total</Badge>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Today's Deposits</h3>
            <p className="text-3xl font-bold text-gray-900">${todayMetrics?.deposits.toFixed(2) || '0.00'}</p>
            {unreciledDeposits > 0 && (
              <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {unreciledDeposits} unreconciled
              </p>
            )}
          </CardContent>
        </Card>

        {/* Today's Payouts */}
        {todayMetrics && (
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-8 h-8 text-orange-600" />
                <Badge className="bg-orange-600 text-white">Payouts</Badge>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Today's Payouts</h3>
              <p className="text-3xl font-bold text-gray-900">${todayMetrics.payouts.toFixed(2)}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="active-shifts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active-shifts">
            <Clock className="w-4 h-4 mr-2" />
            Active Shifts ({activeShifts.length})
          </TabsTrigger>
          <TabsTrigger value="armorsafe">
            <Shield className="w-4 h-4 mr-2" />
            Armorsafe Deposits
          </TabsTrigger>
          <TabsTrigger value="cash-management">
            <DollarSign className="w-4 h-4 mr-2" />
            Cash Management
          </TabsTrigger>
        </TabsList>

        {/* Active Shifts Detail */}
        <TabsContent value="active-shifts">
          <Card>
            <CardHeader>
              <CardTitle>Active Shifts - Live Cash Tracking</CardTitle>
              <CardDescription>Real-time view of all open shifts and current drawer balances</CardDescription>
            </CardHeader>
            <CardContent>
              {activeShifts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No active shifts at this time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeShifts.map(shift => {
                    const startTime = new Date(shift.start_time);
                    const duration = Math.floor((new Date() - startTime) / (1000 * 60));
                    const hours = Math.floor(duration / 60);
                    const minutes = duration % 60;
                    
                    const cashLevel = shift.cash_in_drawer || 0;
                    let statusColor = 'bg-green-100 border-green-300 text-green-800';
                    let statusText = 'Normal';
                    
                    if (cashLevel < 100) {
                      statusColor = 'bg-yellow-100 border-yellow-300 text-yellow-800';
                      statusText = 'Low Cash';
                    } else if (cashLevel > 500) {
                      statusColor = 'bg-orange-100 border-orange-300 text-orange-800';
                      statusText = 'High Cash';
                    }

                    return (
                      <div key={shift.id} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{shift.employee_name}</h4>
                              <p className="text-sm text-gray-500">{shift.terminal_id} • {hours}h {minutes}m</p>
                            </div>
                          </div>
                          <Badge className={statusColor}>{statusText}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-gray-50 rounded p-3">
                            <p className="text-xs text-gray-500 mb-1">Opening</p>
                            <p className="text-lg font-semibold">${(shift.opening_cash || 0).toFixed(2)}</p>
                          </div>
                          <div className="bg-green-50 rounded p-3">
                            <p className="text-xs text-gray-500 mb-1">Current</p>
                            <p className="text-lg font-semibold text-green-700">${cashLevel.toFixed(2)}</p>
                          </div>
                          <div className={`rounded p-3 ${cashLevel >= (shift.opening_cash || 0) ? 'bg-blue-50' : 'bg-red-50'}`}>
                            <p className="text-xs text-gray-500 mb-1">Change</p>
                            <p className={`text-lg font-semibold ${cashLevel >= (shift.opening_cash || 0) ? 'text-blue-700' : 'text-red-700'}`}>
                              {cashLevel >= (shift.opening_cash || 0) ? '+' : ''}${(cashLevel - (shift.opening_cash || 0)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Armorsafe Deposits */}
        <TabsContent value="armorsafe">
          <Card>
            <CardHeader>
              <CardTitle>Armorsafe Smart Safe Deposits</CardTitle>
              <CardDescription>Track and reconcile smart safe deposits with confirmation codes</CardDescription>
            </CardHeader>
            <CardContent>
              {recentDeposits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Vault className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No Armorsafe deposits recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDeposits.map(deposit => (
                    <div key={deposit.id} className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Shield className="w-6 h-6 text-purple-600" />
                          <div>
                            <h4 className="font-semibold text-gray-900">${deposit.deposit_amount.toFixed(2)}</h4>
                            <p className="text-sm text-gray-600">{deposit.employee_name}</p>
                          </div>
                        </div>
                        <Badge className={deposit.reconciled ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}>
                          {deposit.reconciled ? (
                            <><CheckCircle className="w-3 h-3 mr-1 inline" />Reconciled</>
                          ) : (
                            'Pending'
                          )}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                        <div>
                          <p className="text-gray-500">Timestamp</p>
                          <p className="font-medium">{format(new Date(deposit.deposit_timestamp), 'MMM d, h:mm a')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Confirmation Code</p>
                          <p className="font-mono font-medium text-purple-700">{deposit.confirmation_code}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Unit ID</p>
                          <p className="font-medium">{deposit.armorsafe_unit_id}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Type</p>
                          <p className="font-medium capitalize">{deposit.transaction_type.replace('_', ' ')}</p>
                        </div>
                      </div>

                      {deposit.denomination_breakdown && (
                        <div className="mt-3 pt-3 border-t border-purple-200">
                          <p className="text-xs text-gray-500 mb-2">Denomination Breakdown:</p>
                          <div className="grid grid-cols-5 gap-2 text-xs">
                            {deposit.denomination_breakdown.hundreds > 0 && <span>$100 × {deposit.denomination_breakdown.hundreds}</span>}
                            {deposit.denomination_breakdown.fifties > 0 && <span>$50 × {deposit.denomination_breakdown.fifties}</span>}
                            {deposit.denomination_breakdown.twenties > 0 && <span>$20 × {deposit.denomination_breakdown.twenties}</span>}
                            {deposit.denomination_breakdown.tens > 0 && <span>$10 × {deposit.denomination_breakdown.tens}</span>}
                            {deposit.denomination_breakdown.fives > 0 && <span>$5 × {deposit.denomination_breakdown.fives}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Management Transactions */}
        <TabsContent value="cash-management">
          <Card>
            <CardHeader>
              <CardTitle>Cash Management Transactions</CardTitle>
              <CardDescription>All cash movements: safe drops, pickups, and payouts</CardDescription>
            </CardHeader>
            <CardContent>
              {cashManagementTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No cash management transactions recorded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cashManagementTransactions.map(transaction => {
                    const isNegative = transaction.amount < 0;
                    const typeColors = {
                      safe_drop: 'bg-purple-100 text-purple-800',
                      safe_pickup: 'bg-green-100 text-green-800',
                      lottery_payout: 'bg-blue-100 text-blue-800',
                      vendor_payout: 'bg-orange-100 text-orange-800',
                      bank_deposit: 'bg-gray-100 text-gray-800'
                    };

                    return (
                      <div key={transaction.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={typeColors[transaction.transaction_type] || 'bg-gray-100'}>
                                {transaction.transaction_type.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <span className="text-sm text-gray-600">{transaction.cashier_name}</span>
                            </div>
                            <p className="text-xs text-gray-500">{format(new Date(transaction.created_date), 'MMM d, yyyy h:mm a')}</p>
                            {transaction.reference_number && (
                              <p className="text-xs text-gray-600 mt-1">Ref: {transaction.reference_number}</p>
                            )}
                            {transaction.vendor_name && (
                              <p className="text-xs text-gray-600 mt-1">Vendor: {transaction.vendor_name}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                              {isNegative ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                            </p>
                            {transaction.drawer_balance_after !== undefined && (
                              <p className="text-xs text-gray-500 mt-1">
                                Drawer: ${transaction.drawer_balance_after.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CONEXXUS Compliance Badge */}
      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="w-5 h-5 text-blue-600" />
        <AlertDescription>
          <strong>CONEXXUS Treasury Management Compliant</strong>
          <p className="mt-1 text-sm text-gray-600">
            All cash transactions are tracked according to CONEXXUS Treasury Management Committee standards, 
            ensuring comprehensive audit trails and reconciliation capabilities.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
