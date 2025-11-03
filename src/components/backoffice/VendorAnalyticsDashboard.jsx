import React, { useState, useEffect } from 'react';
import { AccountsPayable, PurchaseOrder, Supplier, InventoryReceiving } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Package,
  Truck,
  FileText,
  ChevronRight
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function VendorAnalyticsDashboard() {
  const [metrics, setMetrics] = useState({
    totalAPBalance: 0,
    overdueAmount: 0,
    current: 0,
    aged30: 0,
    aged60: 0,
    aged90Plus: 0,
    pendingOrders: 0,
    pendingOrdersValue: 0,
    inTransitOrders: 0,
    avgDaysToReceive: 0
  });
  const [apInvoices, setApInvoices] = useState([]);
  const [pendingPOs, setPendingPOs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVendorAnalytics();
  }, []);

  const loadVendorAnalytics = async () => {
    setIsLoading(true);
    try {
      const [apData, poData, receivingData] = await Promise.all([
        AccountsPayable.filter({ 
          status: { $in: ['open', 'partially_paid', 'overdue'] }
        }).catch(() => []),
        
        PurchaseOrder.filter({ 
          status: { $in: ['submitted', 'acknowledged', 'partially_received'] }
        }).catch(() => []),
        
        InventoryReceiving.filter({
          status: 'pending'
        }).catch(() => [])
      ]);

      // Calculate AP metrics
      const today = new Date();
      let totalAPBalance = 0;
      let overdueAmount = 0;
      let current = 0;
      let aged30 = 0;
      let aged60 = 0;
      let aged90Plus = 0;

      apData.forEach(invoice => {
        const balance = invoice.balance_due || invoice.invoice_amount;
        totalAPBalance += balance;

        const daysOutstanding = differenceInDays(today, new Date(invoice.invoice_date));
        
        if (new Date(invoice.due_date) < today) {
          overdueAmount += balance;
        }

        if (daysOutstanding <= 30) {
          current += balance;
        } else if (daysOutstanding <= 60) {
          aged30 += balance;
        } else if (daysOutstanding <= 90) {
          aged60 += balance;
        } else {
          aged90Plus += balance;
        }
      });

      // Calculate PO metrics
      const pendingOrdersValue = poData.reduce((sum, po) => sum + (po.total_amount || 0), 0);
      const inTransitOrders = poData.filter(po => po.status === 'acknowledged').length;

      setMetrics({
        totalAPBalance,
        overdueAmount,
        current,
        aged30,
        aged60,
        aged90Plus,
        pendingOrders: poData.length,
        pendingOrdersValue,
        inTransitOrders,
        avgDaysToReceive: 5 // Placeholder - would calculate from historical data
      });

      setApInvoices(apData.slice(0, 10));
      setPendingPOs(poData.slice(0, 10));
    } catch (error) {
      console.error('Error loading vendor analytics:', error);
    }
    setIsLoading(false);
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, color, alert }) => (
    <Card className={`${alert ? 'border-2 border-red-500' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading vendor analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Vendor & AP Analytics</h3>
          <p className="text-gray-500">Accounts payable aging and pending purchase orders</p>
        </div>
        <Button onClick={loadVendorAnalytics} variant="outline">
          Refresh
        </Button>
      </div>

      {/* AP Aging Summary */}
      <div>
        <h4 className="text-lg font-semibold mb-3">Accounts Payable Aging</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total AP Balance"
            value={`$${metrics.totalAPBalance.toFixed(2)}`}
            subtitle={`${apInvoices.length} open invoices`}
            icon={DollarSign}
            color="bg-blue-600"
          />
          <MetricCard
            title="Overdue Amount"
            value={`$${metrics.overdueAmount.toFixed(2)}`}
            subtitle="Past due date"
            icon={AlertTriangle}
            color="bg-red-600"
            alert={metrics.overdueAmount > 0}
          />
          <MetricCard
            title="Current (0-30 days)"
            value={`$${metrics.current.toFixed(2)}`}
            subtitle="Within terms"
            icon={Clock}
            color="bg-green-600"
          />
          <MetricCard
            title="90+ Days"
            value={`$${metrics.aged90Plus.toFixed(2)}`}
            subtitle="Severely aged"
            icon={AlertTriangle}
            color="bg-orange-600"
            alert={metrics.aged90Plus > 0}
          />
        </div>
      </div>

      {/* Aging Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>AP Aging Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Current (0-30 days)', amount: metrics.current, color: 'bg-green-500' },
              { label: '31-60 days', amount: metrics.aged30, color: 'bg-yellow-500' },
              { label: '61-90 days', amount: metrics.aged60, color: 'bg-orange-500' },
              { label: '90+ days', amount: metrics.aged90Plus, color: 'bg-red-500' }
            ].map((item, idx) => {
              const percentage = metrics.totalAPBalance > 0 
                ? (item.amount / metrics.totalAPBalance * 100).toFixed(1) 
                : 0;
              
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.label}</span>
                    <span className="font-bold">${item.amount.toFixed(2)} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`${item.color} h-3 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Purchase Orders */}
      <div>
        <h4 className="text-lg font-semibold mb-3">Pending Purchase Orders</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <MetricCard
            title="Pending Orders"
            value={metrics.pendingOrders}
            subtitle={`$${metrics.pendingOrdersValue.toFixed(2)} total value`}
            icon={Package}
            color="bg-purple-600"
          />
          <MetricCard
            title="In Transit"
            value={metrics.inTransitOrders}
            subtitle="Acknowledged by vendor"
            icon={Truck}
            color="bg-indigo-600"
          />
          <MetricCard
            title="Avg Days to Receive"
            value={`${metrics.avgDaysToReceive} days`}
            subtitle="From order to receipt"
            icon={TrendingUp}
            color="bg-teal-600"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingPOs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending purchase orders</p>
              ) : (
                pendingPOs.map(po => (
                  <div key={po.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{po.order_number}</span>
                        <Badge variant="outline">{po.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {po.supplier_id} • Ordered {format(new Date(po.order_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${po.total_amount?.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{po.items_ordered?.length || 0} items</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent AP Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AP Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {apInvoices.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No open AP invoices</p>
            ) : (
              apInvoices.map(invoice => {
                const isOverdue = new Date(invoice.due_date) < new Date();
                const daysOutstanding = differenceInDays(new Date(), new Date(invoice.invoice_date));
                
                return (
                  <div key={invoice.id} className={`flex items-center justify-between p-3 border-2 rounded-lg ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{invoice.invoice_number}</span>
                        <Badge className={isOverdue ? 'bg-red-600' : 'bg-gray-600'}>
                          {invoice.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {invoice.supplier_name} • Due {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                      </p>
                      {isOverdue && (
                        <p className="text-xs text-red-600 font-semibold mt-1">
                          OVERDUE by {Math.abs(differenceInDays(new Date(), new Date(invoice.due_date)))} days
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${(invoice.balance_due || invoice.invoice_amount).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{daysOutstanding} days old</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}