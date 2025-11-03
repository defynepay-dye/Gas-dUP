import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ClientAccount } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  Key,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

import ClientManagement from '../components/vendor/ClientManagement';
import LicenseManagement from '../components/vendor/LicenseManagement';
import ProvisioningManagement from '../components/vendor/ProvisioningManagement';
import HardwareProfileManager from '../components/vendor/HardwareProfileManager';
import VendorAnalytics from '../components/vendor/VendorAnalytics';

export default function VendorPortal() {
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    trialClients: 0,
    suspendedClients: 0,
    totalLocations: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const clientsData = await ClientAccount.list('-created_date');
      setClients(clientsData || []);

      // Calculate stats
      const activeCount = clientsData.filter(c => c.account_status === 'active').length;
      const trialCount = clientsData.filter(c => c.account_status === 'trial').length;
      const suspendedCount = clientsData.filter(c => c.account_status === 'suspended').length;
      
      setStats({
        totalClients: clientsData.length,
        activeClients: activeCount,
        trialClients: trialCount,
        suspendedClients: suspendedCount,
        totalLocations: clientsData.reduce((sum, c) => sum + (c.license_info?.max_locations || 0), 0),
        totalRevenue: clientsData.reduce((sum, c) => sum + (c.billing?.monthly_fee || 0), 0)
      });
    } catch (error) {
      console.error('Failed to load vendor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            FuelFlow Pro Vendor Management Portal
          </h1>
          <p className="text-lg text-gray-600">
            Centralized management for all your FuelFlow Pro deployments
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Clients</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
                </div>
                <Building2 className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Clients</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeClients}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Trial Clients</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.trialClients}</p>
                </div>
                <Clock className="w-12 h-12 text-yellow-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Locations</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalLocations}</p>
                </div>
                <Users className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid grid-cols-5 gap-2">
            <TabsTrigger value="clients">
              <Building2 className="w-4 h-4 mr-2" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="licenses">
              <Key className="w-4 h-4 mr-2" />
              Licenses
            </TabsTrigger>
            <TabsTrigger value="provisioning">
              <Settings className="w-4 h-4 mr-2" />
              Provisioning
            </TabsTrigger>
            <TabsTrigger value="profiles">
              <Settings className="w-4 h-4 mr-2" />
              Hardware Profiles
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            <ClientManagement clients={clients} onUpdate={loadData} />
          </TabsContent>

          <TabsContent value="licenses">
            <LicenseManagement clients={clients} onUpdate={loadData} />
          </TabsContent>

          <TabsContent value="provisioning">
            <ProvisioningManagement clients={clients} onUpdate={loadData} />
          </TabsContent>

          <TabsContent value="profiles">
            <HardwareProfileManager onUpdate={loadData} />
          </TabsContent>

          <TabsContent value="analytics">
            <VendorAnalytics clients={clients} stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}