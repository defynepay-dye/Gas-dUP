
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Settings, Key, Users, DollarSign, HeadphonesIcon, BarChart3, Package, Shield, AlertCircle, Loader2 } from 'lucide-react';
import ClientAccountManager from '../components/vendor/ClientAccountManager';
import LSSConfigurationManager from '../components/vendor/LSSConfigurationManager';
import ProvisioningManager from '../components/vendor/ProvisioningManager';
import HardwareProfileManager from '../components/vendor/HardwareProfileManager';
import BillingDashboard from '../components/vendor/BillingDashboard';
import SupportDashboard from '../components/vendor/SupportDashboard';
import VendorAnalyticsDashboard from '../components/vendor/VendorAnalyticsDashboard';
import ModuleManagement from '../components/vendor/ModuleManagement';

export default function VendorManagementPortal() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Only admin role can access VMP
      if (user.role === 'admin') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      console.error('Authorization check failed:', error);
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verifying VMP Access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="max-w-lg border-2 border-red-200 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied - Restricted Area</h2>
            <p className="text-gray-700 mb-2 font-medium">
              This is the FuelFlow Pro Vendor Management Portal.
            </p>
            <p className="text-gray-600 mb-6">
              Access is restricted to authorized FuelFlow Pro internal management team members only.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium">
                <Shield className="w-4 h-4 inline mr-2" />
                If you believe you should have access, contact your system administrator immediately.
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Unauthorized access attempts are logged and monitored.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* VMP Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 text-white shadow-2xl border-b-4 border-purple-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-10 h-10" />
                <h1 className="text-3xl font-bold">FuelFlow Pro Vendor Management Portal</h1>
              </div>
              <p className="text-purple-100 text-lg">Enterprise Multi-Tenant Management & Configuration System</p>
              <p className="text-purple-200 text-sm mt-1">Real-Time Client Deployment & LSS Provisioning Platform</p>
            </div>
            <div className="text-right bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-xs text-purple-100 uppercase tracking-wide">Logged in as</p>
              <p className="font-bold text-lg">{currentUser?.full_name}</p>
              <p className="text-xs text-purple-200">{currentUser?.email}</p>
              <div className="mt-2 inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
                <Shield className="w-3 h-3" />
                ADMIN ACCESS
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main VMP Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-white shadow-lg p-1.5 rounded-lg border border-gray-200">
            <TabsTrigger value="clients" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clients</span>
            </TabsTrigger>
            <TabsTrigger value="lss-config" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">LSS Config</span>
            </TabsTrigger>
            <TabsTrigger value="provisioning" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">Provision</span>
            </TabsTrigger>
            <TabsTrigger value="hardware" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Hardware</span>
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Modules</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <HeadphonesIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-4">
            <ClientAccountManager />
          </TabsContent>

          <TabsContent value="lss-config" className="space-y-4">
            <LSSConfigurationManager />
          </TabsContent>

          <TabsContent value="provisioning" className="space-y-4">
            <ProvisioningManager />
          </TabsContent>

          <TabsContent value="hardware" className="space-y-4">
            <HardwareProfileManager />
          </TabsContent>

          <TabsContent value="modules" className="space-y-4">
            <ModuleManagement />
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <BillingDashboard />
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <SupportDashboard />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <VendorAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
