import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, MapPin, CheckCircle, XCircle, AlertTriangle, DollarSign, 
  Ticket, FileText, TrendingUp, Users, Activity, Wifi, WifiOff,
  ArrowUpRight, ArrowDownRight, Clock, Package, BarChart3, Download
} from 'lucide-react';
import { Bar, Line, Pie } from 'recharts';
import { BarChart, LineChart, PieChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';

export default function VendorAnalyticsDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedClient, setSelectedClient] = useState(null);

  // Fetch all clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['all_clients'],
    queryFn: async () => {
      const data = await base44.entities.ClientAccount.list('-created_date');
      return data || [];
    }
  });

  // Fetch all locations
  const { data: locations = [] } = useQuery({
    queryKey: ['all_locations'],
    queryFn: async () => {
      const data = await base44.entities.Location.list();
      return data || [];
    }
  });

  // Fetch all LSS configurations
  const { data: lssConfigs = [] } = useQuery({
    queryKey: ['all_lss_configs'],
    queryFn: async () => {
      const data = await base44.entities.LSSConfiguration.list();
      return data || [];
    }
  });

  // Fetch support tickets
  const { data: supportTickets = [] } = useQuery({
    queryKey: ['support_tickets'],
    queryFn: async () => {
      const data = await base44.entities.SupportTicket.list('-created_date', 100);
      return data || [];
    }
  });

  // Fetch scan data reports
  const { data: scanDataReports = [] } = useQuery({
    queryKey: ['scan_data_reports'],
    queryFn: async () => {
      const tobacco = await base44.entities.TobaccoScanData.list('-created_date', 50).catch(() => []);
      const cpg = await base44.entities.CPGScanData.list('-created_date', 50).catch(() => []);
      const alcohol = await base44.entities.AlcoholScanData.list('-created_date', 50).catch(() => []);
      return [...tobacco, ...cpg, ...alcohol];
    }
  });

  // Calculate key metrics
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.account_status === 'active').length;
  const trialClients = clients.filter(c => c.account_status === 'trial').length;
  const suspendedClients = clients.filter(c => c.account_status === 'suspended').length;
  
  const totalLocations = locations.length;
  const connectedLocations = lssConfigs.filter(lss => 
    lss.provisioning_status === 'active' && 
    lss.health_status?.overall_status === 'healthy'
  ).length;
  const disconnectedLocations = lssConfigs.filter(lss => 
    lss.health_status?.overall_status === 'offline' || 
    lss.health_status?.overall_status === 'critical'
  ).length;

  const openTickets = supportTickets.filter(t => t.status === 'open').length;
  const criticalTickets = supportTickets.filter(t => t.priority === 'critical' && t.status !== 'resolved').length;

  const totalMRR = clients.reduce((sum, client) => {
    if (client.account_status === 'active' || client.account_status === 'trial') {
      return sum + (client.billing?.monthly_fee || 0);
    }
    return sum;
  }, 0);

  const totalAR = clients.reduce((sum, client) => {
    return sum + (client.billing?.outstanding_balance || 0);
  }, 0);

  const successfulScanData = scanDataReports.filter(r => r.report_status === 'transmitted' || r.report_status === 'acknowledged').length;
  const pendingScanData = scanDataReports.filter(r => r.report_status === 'pending_review' || r.report_status === 'draft').length;

  // Client status distribution for pie chart
  const clientStatusData = [
    { name: 'Active', value: activeClients, color: '#10b981' },
    { name: 'Trial', value: trialClients, color: '#3b82f6' },
    { name: 'Suspended', value: suspendedClients, color: '#ef4444' },
    { name: 'Cancelled', value: clients.filter(c => c.account_status === 'cancelled').length, color: '#6b7280' }
  ];

  // MRR trend (mock data - in production would be calculated from historical data)
  const mrrTrendData = [
    { month: 'Jan', mrr: totalMRR * 0.7 },
    { month: 'Feb', mrr: totalMRR * 0.75 },
    { month: 'Mar', mrr: totalMRR * 0.82 },
    { month: 'Apr', mrr: totalMRR * 0.88 },
    { month: 'May', mrr: totalMRR * 0.93 },
    { month: 'Jun', mrr: totalMRR }
  ];

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-pulse text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Alerts Banner */}
      {(criticalTickets > 0 || disconnectedLocations > 0) && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Critical Alerts Requiring Attention</p>
                <p className="text-sm text-red-700">
                  {criticalTickets > 0 && `${criticalTickets} critical support tickets`}
                  {criticalTickets > 0 && disconnectedLocations > 0 && ' • '}
                  {disconnectedLocations > 0 && `${disconnectedLocations} locations offline`}
                </p>
              </div>
              <Button size="sm" variant="destructive">View Details</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clients */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-8 h-8 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-700">
                {((activeClients / totalClients) * 100).toFixed(0)}% Active
              </Badge>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalClients}</p>
            <p className="text-sm text-gray-600 mt-1">Total Clients</p>
            <div className="flex gap-2 mt-3 text-xs">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3 h-3" /> {activeClients} Active
              </span>
              <span className="flex items-center gap-1 text-blue-600">
                {trialClients} Trial
              </span>
              {suspendedClients > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="w-3 h-3" /> {suspendedClients} Suspended
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Locations & Connectivity */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="w-8 h-8 text-blue-600" />
              <Badge className={connectedLocations === totalLocations ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                {((connectedLocations / totalLocations) * 100).toFixed(0)}% Online
              </Badge>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalLocations}</p>
            <p className="text-sm text-gray-600 mt-1">Total Locations</p>
            <div className="flex gap-2 mt-3 text-xs">
              <span className="flex items-center gap-1 text-green-600">
                <Wifi className="w-3 h-3" /> {connectedLocations} Connected
              </span>
              {disconnectedLocations > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <WifiOff className="w-3 h-3" /> {disconnectedLocations} Offline
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Recurring Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> +12.5%
              </Badge>
            </div>
            <p className="text-3xl font-bold text-gray-900">${totalMRR.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">Monthly Recurring Revenue</p>
            <div className="flex gap-2 mt-3 text-xs">
              <span className="flex items-center gap-1 text-orange-600">
                <AlertTriangle className="w-3 h-3" /> ${totalAR.toLocaleString()} A/R
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Support Tickets */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Ticket className="w-8 h-8 text-orange-600" />
              {criticalTickets > 0 ? (
                <Badge className="bg-red-100 text-red-700">
                  {criticalTickets} Critical
                </Badge>
              ) : (
                <Badge className="bg-green-100 text-green-700">All Clear</Badge>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900">{openTickets}</p>
            <p className="text-sm text-gray-600 mt-1">Open Support Tickets</p>
            <div className="flex gap-2 mt-3 text-xs text-gray-600">
              <span>{supportTickets.filter(t => t.status === 'in_progress').length} In Progress</span>
              <span>•</span>
              <span>{supportTickets.filter(t => t.status === 'waiting_customer').length} Waiting</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">MRR Growth Trend</CardTitle>
            <CardDescription>Monthly recurring revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mrrTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} name="MRR" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Client Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Status Distribution</CardTitle>
            <CardDescription>Breakdown of client account statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={clientStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {clientStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Scan Data Reporting Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Scan Data Reporting Status
          </CardTitle>
          <CardDescription>Real-time status of client scan data submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <Badge className="bg-green-600 text-white">{successfulScanData}</Badge>
              </div>
              <p className="text-sm font-semibold text-green-900">Successfully Transmitted</p>
              <p className="text-xs text-green-700 mt-1">Acknowledged by manufacturers</p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-6 h-6 text-yellow-600" />
                <Badge className="bg-yellow-600 text-white">{pendingScanData}</Badge>
              </div>
              <p className="text-sm font-semibold text-yellow-900">Pending Review</p>
              <p className="text-xs text-yellow-700 mt-1">Awaiting validation</p>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-6 h-6 text-red-600" />
                <Badge className="bg-red-600 text-white">
                  {scanDataReports.filter(r => r.report_status === 'failed').length}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-red-900">Failed / Errors</p>
              <p className="text-xs text-red-700 mt-1">Requires attention</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Client Activity</CardTitle>
              <CardDescription>Latest events across all client locations</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clients.slice(0, 5).map((client) => {
              const clientLocations = locations.filter(l => l.client_account_id === client.id);
              const clientLSS = lssConfigs.filter(lss => lss.client_account_id === client.id);
              const onlineCount = clientLSS.filter(lss => 
                lss.health_status?.overall_status === 'healthy'
              ).length;

              return (
                <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      client.account_status === 'active' ? 'bg-green-100' : 
                      client.account_status === 'trial' ? 'bg-blue-100' : 'bg-red-100'
                    }`}>
                      <Building2 className={`w-5 h-5 ${
                        client.account_status === 'active' ? 'text-green-600' : 
                        client.account_status === 'trial' ? 'text-blue-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{client.client_name}</p>
                      <p className="text-xs text-gray-600">
                        {clientLocations.length} locations • {onlineCount} online • 
                        ${(client.billing?.monthly_fee || 0).toLocaleString()}/mo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={
                      client.account_status === 'active' ? 'bg-green-100 text-green-700' :
                      client.account_status === 'trial' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }>
                      {client.account_status}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      View Details <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}