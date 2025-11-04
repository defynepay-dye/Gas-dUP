import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock,
  Download, Search, RefreshCw, FileText, CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function BillingDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch all clients with billing info
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients_billing'],
    queryFn: async () => {
      const data = await base44.entities.ClientAccount.list('-created_date');
      return data || [];
    }
  });

  // Calculate billing metrics
  const totalMRR = useMemo(() => {
    return clients.reduce((sum, client) => {
      if (client.account_status === 'active' || client.account_status === 'trial') {
        return sum + (client.billing?.monthly_fee || 0);
      }
      return sum;
    }, 0);
  }, [clients]);

  const totalARR = useMemo(() => {
    return totalMRR * 12;
  }, [totalMRR]);

  const totalOutstanding = useMemo(() => {
    return clients.reduce((sum, client) => {
      return sum + (client.billing?.outstanding_balance || 0);
    }, 0);
  }, [clients]);

  const overdueClients = useMemo(() => {
    return clients.filter(client => {
      if (!client.billing?.next_billing_date) return false;
      const nextBilling = new Date(client.billing.next_billing_date);
      const today = new Date();
      return nextBilling < today && (client.billing?.outstanding_balance || 0) > 0;
    });
  }, [clients]);

  const paidClients = useMemo(() => {
    return clients.filter(client => 
      (client.billing?.outstanding_balance || 0) === 0 &&
      client.account_status === 'active'
    );
  }, [clients]);

  // Revenue by subscription tier
  const revenueByTier = useMemo(() => {
    const tiers = {};
    clients.forEach(client => {
      const tier = client.subscription_tier || 'basic';
      if (!tiers[tier]) tiers[tier] = 0;
      if (client.account_status === 'active' || client.account_status === 'trial') {
        tiers[tier] += client.billing?.monthly_fee || 0;
      }
    });
    return Object.entries(tiers).map(([name, value]) => ({ name, value }));
  }, [clients]);

  // Payment status distribution
  const paymentStatusData = useMemo(() => {
    return [
      { name: 'Current', value: paidClients.length, color: '#10b981' },
      { name: 'Overdue', value: overdueClients.length, color: '#ef4444' },
      { name: 'Trial', value: clients.filter(c => c.account_status === 'trial').length, color: '#3b82f6' }
    ];
  }, [clients, paidClients, overdueClients]);

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    return clients.filter(client =>
      client.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const exportBillingReport = () => {
    // In production, this would generate a CSV/PDF
    alert('Billing report export functionality would be implemented here');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><RefreshCw className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Monthly Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">${totalMRR.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">ARR: ${totalARR.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Outstanding A/R
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">${totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{overdueClients.length} overdue accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Paid Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{paidClients.length}</div>
            <p className="text-xs text-gray-500 mt-1">{((paidClients.length / clients.length) * 100).toFixed(1)}% current</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clients.filter(c => c.account_status === 'active').length}</div>
            <p className="text-xs text-gray-500 mt-1">Total: {clients.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ar">Accounts Receivable</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <Button onClick={exportBillingReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Tier */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Subscription Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueByTier}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Accounts Receivable</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Fee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Billing</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClients.map(client => {
                      const isOverdue = client.billing?.next_billing_date && 
                        new Date(client.billing.next_billing_date) < new Date() &&
                        (client.billing?.outstanding_balance || 0) > 0;
                      
                      return (
                        <tr key={client.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-gray-900">{client.client_name}</div>
                              <div className="text-sm text-gray-500">{client.client_type}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={
                              client.account_status === 'active' ? 'bg-green-100 text-green-800' :
                              client.account_status === 'trial' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {client.account_status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            ${(client.billing?.monthly_fee || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-bold ${
                              (client.billing?.outstanding_balance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              ${(client.billing?.outstanding_balance || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.billing?.last_payment_date ? 
                              format(new Date(client.billing.last_payment_date), 'MMM d, yyyy') : 
                              'N/A'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {client.billing?.next_billing_date ? (
                              <span className={isOverdue ? 'text-red-600 font-bold' : 'text-gray-900'}>
                                {format(new Date(client.billing.next_billing_date), 'MMM d, yyyy')}
                                {isOverdue && <AlertCircle className="w-4 h-4 inline ml-1" />}
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            <Button size="sm" variant="outline">
                              <FileText className="w-3 h-3 mr-1" />
                              Invoice
                            </Button>
                            <Button size="sm" variant="outline">
                              <CreditCard className="w-3 h-3 mr-1" />
                              Record Payment
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Management</h3>
              <p className="text-gray-600">Invoice generation and management coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
              <p className="text-gray-600">Revenue trends, churn analysis, and forecasting coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}