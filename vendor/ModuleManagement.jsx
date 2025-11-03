import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Package, ShoppingCart, Fuel, Users, Smartphone, BarChart3,
  Camera, Wrench, Search, CheckCircle, XCircle, RefreshCw, DollarSign
} from 'lucide-react';

// Module definitions
const AVAILABLE_MODULES = [
  {
    id: 'pos',
    name: 'Point of Sale',
    description: 'Core POS functionality for transactions',
    icon: ShoppingCart,
    tier: 'basic',
    price: 0,
    isCore: true
  },
  {
    id: 'fuel_management',
    name: 'Fuel Management',
    description: 'Pump control, forecourt management, and fuel pricing',
    icon: Fuel,
    tier: 'basic',
    price: 0,
    isCore: true
  },
  {
    id: 'inventory',
    name: 'Inventory Management',
    description: 'Stock tracking, receiving, and ordering',
    icon: Package,
    tier: 'basic',
    price: 0,
    isCore: true
  },
  {
    id: 'loyalty',
    name: 'Loyalty Program',
    description: 'Customer loyalty, points, and rewards',
    icon: Users,
    tier: 'professional',
    price: 49
  },
  {
    id: 'qsr',
    name: 'QSR / Food Service',
    description: 'Quick Service Restaurant menu and ordering',
    icon: Package,
    tier: 'professional',
    price: 99
  },
  {
    id: 'delivery_hub',
    name: 'Delivery Hub',
    description: 'DoorDash, Uber Eats, Grubhub integrations',
    icon: ShoppingCart,
    tier: 'professional',
    price: 79
  },
  {
    id: 'scan_data_reporting',
    name: 'Scan Data Reporting',
    description: 'CONEXXUS scan data for tobacco, CPG, alcohol',
    icon: BarChart3,
    tier: 'enterprise',
    price: 199
  },
  {
    id: 'ai_intelligence',
    name: 'AI Intelligence',
    description: 'Predictive analytics, smart ordering, price optimization',
    icon: BarChart3,
    tier: 'enterprise',
    price: 299
  },
  {
    id: 'mobile_fueling',
    name: 'Mobile Fueling',
    description: 'Pay-at-pump via mobile app',
    icon: Smartphone,
    tier: 'professional',
    price: 129
  },
  {
    id: 'kiosk_mode',
    name: 'Self-Service Kiosk',
    description: 'Customer-facing kiosk ordering',
    icon: Package,
    tier: 'professional',
    price: 79
  },
  {
    id: 'employee_payroll',
    name: 'Employee Payroll',
    description: 'Time clock, payroll, and HR management',
    icon: Users,
    tier: 'professional',
    price: 99
  },
  {
    id: 'car_wash_integration',
    name: 'Car Wash Integration',
    description: 'Car wash controller integration',
    icon: Package,
    tier: 'professional',
    price: 149
  },
  {
    id: 'predictive_maintenance',
    name: 'Predictive Maintenance',
    description: 'Equipment health monitoring and failure prediction',
    icon: Wrench,
    tier: 'enterprise',
    price: 199
  },
  {
    id: 'security_cameras',
    name: 'AI Security Cameras',
    description: 'Computer vision, gas-and-dash detection',
    icon: Camera,
    tier: 'enterprise',
    price: 249
  }
];

export default function ModuleManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  const queryClient = useQueryClient();

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients_modules'],
    queryFn: async () => {
      const data = await base44.entities.ClientAccount.list('client_name');
      return data || [];
    }
  });

  // Toggle module mutation
  const toggleModuleMutation = useMutation({
    mutationFn: async ({ clientId, moduleId, enabled }) => {
      const client = clients.find(c => c.id === clientId);
      if (!client) throw new Error('Client not found');

      const updatedModules = {
        ...client.enabled_modules,
        [moduleId]: enabled
      };

      return await base44.entities.ClientAccount.update(clientId, {
        enabled_modules: updatedModules
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clients_modules']);
      alert('✅ Module status updated successfully');
    }
  });

  const filteredClients = clients.filter(client =>
    !searchTerm || client.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleModule = (clientId, moduleId, currentState) => {
    if (window.confirm(`${currentState ? 'Disable' : 'Enable'} this module?`)) {
      toggleModuleMutation.mutate({
        clientId,
        moduleId,
        enabled: !currentState
      });
    }
  };

  const getModuleIcon = (moduleId) => {
    const module = AVAILABLE_MODULES.find(m => m.id === moduleId);
    return module?.icon || Package;
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><RefreshCw className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Module Management</h2>
        <p className="text-gray-600">Enable or disable feature modules for each client</p>
      </div>

      {/* Available Modules Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Available Modules</CardTitle>
          <CardDescription>All features available in FuelFlow Pro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVAILABLE_MODULES.map((module) => {
              const Icon = module.icon;
              return (
                <div key={module.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Icon className="w-8 h-8 text-purple-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{module.name}</h4>
                        {module.isCore && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Core</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{module.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge className={`text-xs ${getTierColor(module.tier)}`}>
                          {module.tier}
                        </Badge>
                        {module.price > 0 && (
                          <span className="text-xs font-bold text-green-600">
                            +${module.price}/mo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Client Module Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Client Module Configuration</CardTitle>
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
            <div className="space-y-4">
              {filteredClients.map((client) => {
                const enabledCount = Object.values(client.enabled_modules || {}).filter(Boolean).length;
                const totalModules = AVAILABLE_MODULES.length;
                
                return (
                  <div key={client.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{client.client_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTierColor(client.subscription_tier)}>
                            {client.subscription_tier}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {enabledCount} / {totalModules} modules enabled
                          </span>
                        </div>
                      </div>
                      <Badge className={
                        client.account_status === 'active' ? 'bg-green-100 text-green-800' :
                        client.account_status === 'trial' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {client.account_status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {AVAILABLE_MODULES.map((module) => {
                        const isEnabled = client.enabled_modules?.[module.id] || false;
                        const Icon = module.icon;
                        
                        return (
                          <div
                            key={module.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Icon className={`w-5 h-5 flex-shrink-0 ${isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{module.name}</p>
                                {module.price > 0 && (
                                  <p className="text-xs text-gray-500">+${module.price}/mo</p>
                                )}
                              </div>
                            </div>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => handleToggleModule(client.id, module.id, isEnabled)}
                              disabled={module.isCore || toggleModuleMutation.isLoading}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Calculate monthly total */}
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <span className="text-sm text-gray-600">Estimated Monthly Cost:</span>
                      <span className="text-lg font-bold text-green-600">
                        $
                        {AVAILABLE_MODULES.reduce((sum, module) => {
                          if (client.enabled_modules?.[module.id]) {
                            return sum + module.price;
                          }
                          return sum;
                        }, client.billing?.monthly_fee || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}