import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Package, CheckCircle, XCircle, DollarSign, Edit } from 'lucide-react';

export default function ClientModules({ client, onEditModules }) {
  const modules = [
    { id: 'pos', name: 'Point of Sale', icon: '🛒', tier: 'basic', price: 0 },
    { id: 'fuel_management', name: 'Fuel Management', icon: '⛽', tier: 'basic', price: 0 },
    { id: 'inventory', name: 'Inventory Management', icon: '📦', tier: 'basic', price: 0 },
    { id: 'loyalty', name: 'Loyalty Program', icon: '⭐', tier: 'professional', price: 49 },
    { id: 'qsr', name: 'QSR / Food Service', icon: '🍔', tier: 'professional', price: 99 },
    { id: 'delivery_hub', name: 'Delivery Hub', icon: '🚗', tier: 'professional', price: 79 },
    { id: 'scan_data_reporting', name: 'Scan Data Reporting', icon: '📊', tier: 'enterprise', price: 199 },
    { id: 'ai_intelligence', name: 'AI Intelligence', icon: '🤖', tier: 'enterprise', price: 299 },
    { id: 'mobile_fueling', name: 'Mobile Fueling', icon: '📱', tier: 'professional', price: 129 },
    { id: 'kiosk_mode', name: 'Self-Service Kiosk', icon: '🖥️', tier: 'professional', price: 79 },
    { id: 'employee_payroll', name: 'Employee Payroll', icon: '💰', tier: 'professional', price: 99 },
    { id: 'car_wash_integration', name: 'Car Wash Integration', icon: '🚿', tier: 'professional', price: 149 },
    { id: 'predictive_maintenance', name: 'Predictive Maintenance', icon: '🔧', tier: 'enterprise', price: 199 },
    { id: 'security_cameras', name: 'AI Security Cameras', icon: '📹', tier: 'enterprise', price: 249 }
  ];

  const enabledModules = client.enabled_modules || {};
  const enabledCount = Object.values(enabledModules).filter(Boolean).length;
  
  const getTierColor = (tier) => {
    switch (tier) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateMonthlyCost = () => {
    return modules.reduce((sum, module) => {
      if (enabledModules[module.id]) {
        return sum + module.price;
      }
      return sum;
    }, client.billing?.monthly_fee || 0);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Enabled Modules</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {enabledCount} of {modules.length} modules enabled
            </p>
          </div>
          <Button size="sm" onClick={onEditModules}>
            <Edit className="w-4 h-4 mr-2" />
            Manage Modules
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {modules.map((module) => {
            const isEnabled = enabledModules[module.id] || false;
            const isCore = module.price === 0;
            
            return (
              <div
                key={module.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isEnabled 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-2xl">{module.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm truncate">{module.name}</p>
                        {isCore && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Core</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
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
                  <div className="ml-2">
                    {isEnabled ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">Estimated Monthly Cost:</span>
          </div>
          <span className="text-xl font-bold text-green-600">
            ${calculateMonthlyCost().toLocaleString()}
          </span>
        </div>

        {client.billing?.outstanding_balance > 0 && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">
              Outstanding Balance: ${client.billing.outstanding_balance.toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}