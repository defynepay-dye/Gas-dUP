
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  Server,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  Download,
  Bell,
  Settings,
  Monitor,
  Database,
  Cpu,
  HardDrive,
  Thermometer,
  Signal
} from "lucide-react";
import { NetworkDevice, NetworkHealthLog, Location } from "@/api/entities";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function NetworkMonitoringDashboard() {
  const [devices, setDevices] = useState([]);
  const [healthLogs, setHealthLogs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedDeviceType, setSelectedDeviceType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pingTarget, setPingTarget] = useState('');
  const [pingResult, setPingResult] = useState(null);
  const [isPinging, setIsPinging] = useState(false);

  // Define user-friendly labels for device types
  const deviceTypeLabels = {
    router: "Network Router",
    switch: "Network Switch",
    forecourt_controller: "Fuel Controller", // Replaces Technotrade PTS2
    crind_controller: "CRIND Controller",
    payment_terminal: "Payment Terminal",
    pos_terminal: "POS Terminal",
    security_camera: "Security Camera",
    access_point: "WiFi Access Point",
    atg_system: "Tank Gauge System",
    tank_monitor: "Tank Monitor",
    printer: "Receipt Printer",
    cash_drawer: "Cash Drawer",
    scanner: "Barcode Scanner",
    other: "Other Device"
  };

  useEffect(() => {
    loadData();
    // Real-time updates every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [devicesData, logsData, locationsData] = await Promise.all([
        NetworkDevice.list('-last_seen'),
        NetworkHealthLog.list('-timestamp', 100),
        Location.list()
      ]);
      setDevices(devicesData);
      setHealthLogs(logsData);
      setLocations(locationsData);
    } catch (error) {
      console.error("Error loading network data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePing = async (targetDevice) => {
    setIsPinging(true);
    setPingResult(null);
    
    try {
      // Simulate ping test
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const responseTime = Math.floor(Math.random() * 100) + 5;
      const packetLoss = Math.random() > 0.9 ? Math.floor(Math.random() * 5) : 0;
      
      const result = {
        device: targetDevice,
        status: responseTime < 100 && packetLoss === 0 ? 'success' : 'warning',
        response_time: responseTime,
        packet_loss: packetLoss,
        timestamp: new Date(),
        hops: Math.floor(Math.random() * 5) + 1
      };
      
      setPingResult(result);
      
      // Log the health check
      await NetworkHealthLog.create({
        device_id: targetDevice.id,
        location_id: targetDevice.location_id,
        timestamp: new Date().toISOString(),
        status: result.status === 'success' ? 'online' : 'warning',
        response_time_ms: responseTime,
        packet_loss_percent: packetLoss
      });
      
    } catch (error) {
      console.error("Ping failed:", error);
      setPingResult({
        device: targetDevice,
        status: 'error',
        message: 'Ping failed - device unreachable'
      });
    } finally {
      setIsPinging(false);
    }
  };

  // Filter devices
  const filteredDevices = devices.filter(device => {
    const locationMatch = selectedLocation === 'all' || device.location_id === selectedLocation;
    const typeMatch = selectedDeviceType === 'all' || device.device_type === selectedDeviceType;
    const searchMatch = searchQuery === '' || 
      device.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.ip_address.includes(searchQuery);
    return locationMatch && typeMatch && searchMatch;
  });

  // Calculate statistics
  const stats = {
    total: devices.length,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    warning: devices.filter(d => d.status === 'warning' || d.status === 'degraded').length,
    critical: devices.filter(d => d.device_type === 'crind_controller' || d.device_type === 'forecourt_controller' || d.device_type === 'payment_terminal').length
  };

  // Device type distribution
  const deviceTypeData = Object.entries(
    devices.reduce((acc, device) => {
      acc[device.device_type] = (acc[device.device_type] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: deviceTypeLabels[name] || name.replace('_', ' '), value }));

  // Response time trend (last 24 hours)
  const responseTimeTrend = healthLogs
    .slice(0, 20)
    .reverse()
    .map(log => ({
      time: format(new Date(log.timestamp), 'HH:mm'),
      response_ms: log.response_time_ms,
      packet_loss: log.packet_loss_percent
    }));

  // Health status distribution
  const healthStatusData = [
    { name: 'Online', value: stats.online, color: '#10b981' },
    { name: 'Warning', value: stats.warning, color: '#f59e0b' },
    { name: 'Offline', value: stats.offline, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Activity className="w-10 h-10" />
              Network Command Center
            </h1>
            <p className="text-blue-100 text-lg">Real-time monitoring • Predictive analytics • Instant diagnostics</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-200 mb-1">System Health</div>
            <div className="text-5xl font-bold">
              {Math.round((stats.online / stats.total) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Online</p>
                <p className="text-3xl font-bold text-emerald-900">{stats.online}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-1 text-xs text-emerald-700">
                <TrendingUp className="w-3 h-3" />
                <span>{Math.round((stats.online / stats.total) * 100)}% uptime</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Warning</p>
                <p className="text-3xl font-bold text-amber-900">{stats.warning}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-amber-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-1 text-xs text-amber-700">
                <Clock className="w-3 h-3" />
                <span>Needs attention</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Offline</p>
                <p className="text-3xl font-bold text-red-900">{stats.offline}</p>
              </div>
              <WifiOff className="w-12 h-12 text-red-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-1 text-xs text-red-700">
                <TrendingDown className="w-3 h-3" />
                <span>Critical issues</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Mission Critical</p>
                <p className="text-3xl font-bold text-purple-900">{stats.critical}</p>
              </div>
              <Zap className="w-12 h-12 text-purple-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-1 text-xs text-purple-700">
                <Server className="w-3 h-3" />
                <span>Core devices</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Devices</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <Database className="w-12 h-12 text-blue-500" />
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-1 text-xs text-blue-700">
                <MapPin className="w-3 h-3" />
                <span>{locations.length} locations</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Signal className="w-5 h-5" />
              Network Response Time (Last 20 Checks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="response_ms" stroke="#3b82f6" strokeWidth={2} name="Response (ms)" />
                <Line type="monotone" dataKey="packet_loss" stroke="#ef4444" strokeWidth={2} name="Packet Loss %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Device Health Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={healthStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {healthStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card className="shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-6 h-6" />
              Device Management & Diagnostics
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Alerts
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="devices" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="devices">All Devices</TabsTrigger>
              <TabsTrigger value="critical">Mission Critical</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
              <TabsTrigger value="analytics">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="devices" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search devices, IPs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  className="px-4 py-2 border rounded-md"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="all">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.location_name}</option>
                  ))}
                </select>
                <select
                  className="px-4 py-2 border rounded-md"
                  value={selectedDeviceType}
                  onChange={(e) => setSelectedDeviceType(e.target.value)}
                >
                  <option value="all">All Device Types</option>
                  {Object.entries(deviceTypeLabels).map(([type, label]) => (
                    <option key={type} value={type}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Device Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredDevices.map(device => (
                  <Card key={device.id} className={`hover:shadow-lg transition-all border-2 ${
                    device.status === 'online' ? 'border-emerald-200 bg-emerald-50/30' :
                    device.status === 'offline' ? 'border-red-200 bg-red-50/30' :
                    'border-amber-200 bg-amber-50/30'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {device.status === 'online' ? (
                            <Wifi className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <WifiOff className="w-5 h-5 text-red-600" />
                          )}
                          <div>
                            <h3 className="font-semibold">{device.device_name}</h3>
                            <p className="text-xs text-gray-500">{deviceTypeLabels[device.device_type] || device.device_type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <Badge className={
                          device.status === 'online' ? 'bg-emerald-500' :
                          device.status === 'offline' ? 'bg-red-500' :
                          'bg-amber-500'
                        }>
                          {device.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">IP Address:</span>
                          <span className="font-mono font-semibold">{device.ip_address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Manufacturer:</span>
                          <span className="font-semibold">{device.manufacturer || 'N/A'}</span>
                        </div>
                        {device.health_metrics && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Response Time:</span>
                              <span className="font-semibold text-blue-600">
                                {device.health_metrics.response_time_ms || 0}ms
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">CPU Usage:</span>
                              <span className={`font-semibold ${
                                device.health_metrics.cpu_usage_percent > 80 ? 'text-red-600' :
                                device.health_metrics.cpu_usage_percent > 60 ? 'text-amber-600' :
                                'text-emerald-600'
                              }`}>
                                {device.health_metrics.cpu_usage_percent || 0}%
                              </span>
                            </div>
                          </>
                        )}
                        {device.last_seen && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Last Seen:</span>
                            <span>{format(new Date(device.last_seen), 'MMM d, HH:mm')}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handlePing(device)}
                          disabled={isPinging}
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Ping
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Settings className="w-3 h-3 mr-1" />
                          Config
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredDevices.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No devices found matching your filters</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="critical" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {devices.filter(d => d.critical_device || 
                  ['crind_controller', 'forecourt_controller', 'payment_terminal'].includes(d.device_type)
                ).map(device => (
                  <Card key={device.id} className="border-2 border-purple-200 bg-purple-50/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Zap className="w-6 h-6 text-purple-600" />
                        <div>
                          <h3 className="font-bold text-lg">{device.device_name}</h3>
                          <p className="text-sm text-gray-600">{(deviceTypeLabels[device.device_type] || device.device_type.replace('_', ' ')).toUpperCase()}</p>
                        </div>
                        <Badge className="ml-auto bg-purple-600">CRITICAL</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Status</p>
                          <p className="font-semibold">{device.status.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">IP Address</p>
                          <p className="font-mono font-semibold">{device.ip_address}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Uptime</p>
                          <p className="font-semibold">{device.uptime_hours || 0}h</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Health</p>
                          <p className={`font-semibold ${device.status === 'online' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {device.status === 'online' ? '✓ Healthy' : '✗ Issues Detected'}
                          </p>
                        </div>
                      </div>

                      {device.ai_insights && device.ai_insights.failure_risk_score > 0.3 && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center gap-2 text-amber-800 font-semibold mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            AI Alert
                          </div>
                          <p className="text-sm text-amber-700">{device.ai_insights.recommended_action}</p>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                          <Activity className="w-3 h-3 mr-1" />
                          Monitor
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Settings className="w-3 h-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="diagnostics" className="space-y-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Network Diagnostic Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Device to Diagnose</label>
                    <select
                      className="w-full px-4 py-2 border rounded-md"
                      value={pingTarget}
                      onChange={(e) => setPingTarget(e.target.value)}
                    >
                      <option value="">Choose a device...</option>
                      {devices.map(device => (
                        <option key={device.id} value={device.id}>
                          {device.device_name} ({device.ip_address})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        const device = devices.find(d => d.id === pingTarget);
                        if (device) handlePing(device);
                      }}
                      disabled={!pingTarget || isPinging}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {isPinging ? 'Pinging...' : 'Run Ping Test'}
                    </Button>
                    <Button variant="outline" disabled={!pingTarget}>
                      <Server className="w-4 h-4 mr-2" />
                      Traceroute
                    </Button>
                    <Button variant="outline" disabled={!pingTarget}>
                      <Activity className="w-4 h-4 mr-2" />
                      Full Diagnostics
                    </Button>
                  </div>

                  {pingResult && (
                    <Card className={`border-2 ${
                      pingResult.status === 'success' ? 'border-emerald-500 bg-emerald-50' :
                      pingResult.status === 'warning' ? 'border-amber-500 bg-amber-50' :
                      'border-red-500 bg-red-50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold flex items-center gap-2">
                            {pingResult.status === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> :
                             pingResult.status === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-600" /> :
                             <WifiOff className="w-5 h-5 text-red-600" />}
                            Ping Result: {pingResult.device.device_name}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {format(pingResult.timestamp, 'HH:mm:ss')}
                          </span>
                        </div>
                        
                        {pingResult.status !== 'error' ? (
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Response Time</p>
                              <p className="text-2xl font-bold text-blue-600">{pingResult.response_time}ms</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Packet Loss</p>
                              <p className="text-2xl font-bold text-amber-600">{pingResult.packet_loss}%</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Network Hops</p>
                              <p className="text-2xl font-bold text-purple-600">{pingResult.hops}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-red-600 font-semibold">{pingResult.message}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Recent Health Checks */}
                  <div>
                    <h4 className="font-semibold mb-3">Recent Health Checks</h4>
                    <div className="space-y-2">
                      {healthLogs.slice(0, 10).map((log, idx) => {
                        const device = devices.find(d => d.id === log.device_id);
                        return (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-3">
                              {log.status === 'online' ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                              )}
                              <div>
                                <p className="font-medium">{device?.device_name || 'Unknown Device'}</p>
                                <p className="text-xs text-gray-500">{device?.ip_address}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{log.response_time_ms}ms</p>
                              <p className="text-xs text-gray-500">{format(new Date(log.timestamp), 'MMM d, HH:mm')}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {devices.filter(d => d.ai_insights && d.ai_insights.failure_risk_score > 0).map(device => (
                  <Card key={device.id} className="border-2 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold flex items-center gap-2">
                          <Cpu className="w-5 h-5 text-purple-600" />
                          {device.device_name}
                        </h3>
                        <Badge className={
                          device.ai_insights.failure_risk_score > 0.7 ? 'bg-red-500' :
                          device.ai_insights.failure_risk_score > 0.4 ? 'bg-amber-500' :
                          'bg-blue-500'
                        }>
                          Risk: {Math.round(device.ai_insights.failure_risk_score * 100)}%
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Failure Probability</span>
                            <span className="font-semibold">{Math.round(device.ai_insights.failure_risk_score * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                device.ai_insights.failure_risk_score > 0.7 ? 'bg-red-500' :
                                device.ai_insights.failure_risk_score > 0.4 ? 'bg-amber-500' :
                                'bg-blue-500'
                              }`}
                              style={{ width: `${device.ai_insights.failure_risk_score * 100}%` }}
                            />
                          </div>
                        </div>

                        {device.ai_insights.predicted_failure_date && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Predicted Failure:</span>
                            <span className="font-semibold text-red-600">
                              {format(new Date(device.ai_insights.predicted_failure_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}

                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-sm font-medium text-purple-900 mb-1">AI Recommendation:</p>
                          <p className="text-sm text-purple-700">{device.ai_insights.recommended_action}</p>
                        </div>

                        {device.ai_insights.anomaly_detected && (
                          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm font-semibold text-red-800">Anomaly Detected</span>
                          </div>
                        )}

                        <Button className="w-full bg-purple-600 hover:bg-purple-700">
                          <Settings className="w-4 h-4 mr-2" />
                          Schedule Maintenance
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {devices.filter(d => d.ai_insights && d.ai_insights.failure_risk_score > 0).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500 opacity-30" />
                  <p className="text-lg font-semibold">All Systems Running Optimally</p>
                  <p className="text-sm">No predictive maintenance alerts at this time</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
