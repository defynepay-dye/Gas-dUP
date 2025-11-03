
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shift, CashManagement, ArmorsafeDeposit, POSTransaction } from '@/api/entities';
import { DollarSign, Download, Calendar, TrendingUp, Shield, FileText, Activity } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function TreasuryReportsTab({ currentScope, activeShiftsData }) {
  const [dateRange, setDateRange] = useState('today');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [dateRange, currentScope]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday':
        return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  };

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange();
      
      let filter = {};
      if (currentScope?.type === 'location') {
        filter.location_id = currentScope.id;
      }

      const [shifts, cashMgmt, deposits, transactions] = await Promise.all([
        Shift.filter(filter).catch(() => []),
        CashManagement.filter(filter).catch(() => []),
        ArmorsafeDeposit.filter(filter).catch(() => []),
        POSTransaction.filter({ status: 'completed', ...filter }).catch(() => [])
      ]);

      // Filter by date range
      const filteredShifts = shifts.filter(s => {
        const shiftDate = new Date(s.start_time);
        return shiftDate >= start && shiftDate <= end;
      });

      const filteredCashMgmt = cashMgmt.filter(cm => {
        const cmDate = new Date(cm.created_date);
        return cmDate >= start && cmDate <= end;
      });

      const filteredDeposits = deposits.filter(d => {
        const depositDate = new Date(d.deposit_timestamp);
        return depositDate >= start && depositDate <= end;
      });

      const filteredTransactions = transactions.filter(t => {
        const txnDate = new Date(t.created_date);
        return txnDate >= start && txnDate <= end;
      });

      // Calculate metrics
      const totalCashSales = filteredTransactions.reduce((sum, t) => {
        const cashPayment = t.payments?.find(p => p.method === 'cash');
        return sum + (cashPayment?.amount || 0);
      }, 0);

      const totalCardSales = filteredTransactions.reduce((sum, t) => {
        const cardPayments = t.payments?.filter(p => 
          ['credit_card', 'debit_card', 'mobile_payment'].includes(p.method)
        );
        return sum + (cardPayments?.reduce((s, p) => s + p.amount, 0) || 0);
      }, 0);

      const totalDeposits = filteredDeposits.reduce((sum, d) => sum + d.deposit_amount, 0);

      const safeDrops = filteredCashMgmt.filter(cm => cm.transaction_type === 'safe_drop');
      const totalSafeDrops = safeDrops.reduce((sum, cm) => sum + Math.abs(cm.amount), 0);

      const payouts = filteredCashMgmt.filter(cm => 
        ['lottery_payout', 'vendor_payout'].includes(cm.transaction_type)
      );
      const totalPayouts = payouts.reduce((sum, cm) => sum + Math.abs(cm.amount), 0);

      const completedShifts = filteredShifts.filter(s => s.status === 'completed');
      const totalVariance = completedShifts.reduce((sum, s) => sum + (s.cash_variance || 0), 0);
      const averageVariance = completedShifts.length > 0 ? totalVariance / completedShifts.length : 0;

      setReportData({
        shifts: filteredShifts,
        cashMgmt: filteredCashMgmt,
        deposits: filteredDeposits,
        transactions: filteredTransactions,
        metrics: {
          totalCashSales,
          totalCardSales,
          totalDeposits,
          totalSafeDrops,
          totalPayouts,
          totalVariance,
          averageVariance,
          shiftCount: filteredShifts.length,
          completedShiftCount: completedShifts.length,
          depositCount: filteredDeposits.length,
          reconciledDeposits: filteredDeposits.filter(d => d.reconciled).length
        }
      });
    } catch (error) {
      console.error('Failed to load treasury report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const csvContent = [
      ['FuelFlow Pro Treasury Management Report'],
      [`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`],
      [`Period: ${dateRange.toUpperCase()}`],
      [],
      ['SUMMARY METRICS'],
      ['Metric', 'Value'],
      ['Total Cash Sales', `$${reportData.metrics.totalCashSales.toFixed(2)}`],
      ['Total Card Sales', `$${reportData.metrics.totalCardSales.toFixed(2)}`],
      ['Total Safe Drops', `$${reportData.metrics.totalSafeDrops.toFixed(2)}`],
      ['Total Armorsafe Deposits', `$${reportData.metrics.totalDeposits.toFixed(2)}`],
      ['Total Payouts', `$${reportData.metrics.totalPayouts.toFixed(2)}`],
      ['Completed Shifts', reportData.metrics.completedShiftCount],
      ['Average Cash Variance', `$${reportData.metrics.averageVariance.toFixed(2)}`],
      [],
      ['ARMORSAFE DEPOSITS'],
      ['Timestamp', 'Employee', 'Amount', 'Confirmation Code', 'Reconciled'],
      ...reportData.deposits.map(d => [
        format(new Date(d.deposit_timestamp), 'MMM d, yyyy h:mm a'),
        d.employee_name,
        `$${d.deposit_amount.toFixed(2)}`,
        d.confirmation_code,
        d.reconciled ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treasury-report-${dateRange}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Treasury Management Reports</h2>
          <p className="text-sm text-gray-500 mt-1">Comprehensive cash flow and reconciliation reporting</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} disabled={!reportData}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* NEW: Active Cash Summary (if provided) */}
      {activeShiftsData && activeShiftsData.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Drawer Cash (Real-Time)</p>
                <p className="text-2xl font-bold text-blue-700">
                  ${activeShiftsData.reduce((sum, s) => sum + (s.cash_in_drawer || 0), 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">{activeShiftsData.length} active shifts</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">Loading report data...</p>
          </CardContent>
        </Card>
      ) : reportData ? (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <h3 className="text-sm font-medium text-gray-600">Cash Sales</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">${reportData.metrics.totalCashSales.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <h3 className="text-sm font-medium text-gray-600">Card Sales</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">${reportData.metrics.totalCardSales.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-6 h-6 text-purple-600" />
                  <h3 className="text-sm font-medium text-gray-600">Armorsafe Deposits</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">${reportData.metrics.totalDeposits.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.metrics.depositCount} deposits • {reportData.metrics.reconciledDeposits} reconciled
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-6 h-6 text-orange-600" />
                  <h3 className="text-sm font-medium text-gray-600">Payouts</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">${reportData.metrics.totalPayouts.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shift Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Shift Summary</CardTitle>
                <CardDescription>{reportData.metrics.shiftCount} shifts in period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Completed Shifts</span>
                    <span className="text-lg font-bold">{reportData.metrics.completedShiftCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Total Cash Variance</span>
                    <span className={`text-lg font-bold ${reportData.metrics.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${reportData.metrics.totalVariance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Average Variance</span>
                    <span className={`text-lg font-bold ${reportData.metrics.averageVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${reportData.metrics.averageVariance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Analysis</CardTitle>
                <CardDescription>Net cash movement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium text-green-800">+ Cash Inflows</span>
                    <span className="text-lg font-bold text-green-700">${reportData.metrics.totalCashSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span className="text-sm font-medium text-red-800">- Payouts</span>
                    <span className="text-lg font-bold text-red-700">${reportData.metrics.totalPayouts.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span className="text-sm font-medium text-purple-800">- Safe Drops</span>
                    <span className="text-lg font-bold text-purple-700">${reportData.metrics.totalSafeDrops.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-100 rounded border-2 border-blue-300">
                    <span className="text-sm font-medium text-blue-900">Net Cash Flow</span>
                    <span className="text-xl font-bold text-blue-900">
                      ${(reportData.metrics.totalCashSales - reportData.metrics.totalPayouts - reportData.metrics.totalSafeDrops).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Armorsafe Deposits */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Armorsafe Deposits</CardTitle>
              <CardDescription>Smart safe deposit activity</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.deposits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No Armorsafe deposits in this period</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reportData.deposits.slice(0, 10).map(deposit => (
                    <div key={deposit.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium">{format(new Date(deposit.deposit_timestamp), 'MMM d, h:mm a')}</p>
                        <p className="text-sm text-gray-600">{deposit.employee_name} • {deposit.confirmation_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${deposit.deposit_amount.toFixed(2)}</p>
                        {deposit.reconciled ? (
                          <span className="text-xs text-green-600">✓ Reconciled</span>
                        ) : (
                          <span className="text-xs text-yellow-600">Pending</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <p>No data available for selected period</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
