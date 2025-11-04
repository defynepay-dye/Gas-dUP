import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Building2, MapPin, DollarSign, Settings, Package, Users,
  FileText, BarChart3, Wifi, CheckCircle, XCircle, Clock, Edit
} from 'lucide-react';
import ClientInfo from './config/ClientInfo';
import ClientLocations from './config/ClientLocations';
import ClientBilling from './config/ClientBilling';
import ClientModules from './config/ClientModules';
import ClientSupport from './config/ClientSupport';
import ClientAnalytics from './config/ClientAnalytics';

export default function ClientDetailView({ client, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: locations = [] } = useQuery({
    queryKey: ['client_locations', client.id],
    queryFn: async () => {
      const data = await base44.entities.Location.filter({ client_account_id: client.id });
      return data || [];
    }
  });

  const { data: lssConfigs = [] } = useQuery({
    queryKey: ['client_lss_configs', client.id],
    queryFn: async () => {
      const data = await base44.entities.LSSConfiguration.filter({ client_account_id: client.id });
      return data || [];
    }
  });

  const { data: supportTickets = [] } = useQuery({
    queryKey: ['client_tickets', client.id],
    queryFn: async () => {
      const data = await base44.entities.SupportTicket.filter({ client_account_id: client.id }, '-created_date', 20);
      return data || [];
    }
  });

  const onlineLocations = lssConfigs.filter(lss => 
    lss.health_status?.overall_status === 'healthy'
  ).length;

  const openTickets = supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{client.client_name}</h1>
              <Badge className={
                client.account_status === 'active' ? 'bg-green-100 text-green-700' :
                client.account_status === 'trial' ? 'bg-blue-100 text-blue-700' :
                client.account_status === 'suspended' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-700'
              }>
                {client.account_status}
              </Badge>
              <Badge variant="outline">{client.subscription_tier}</Badge>
            </div>
            <p className="text-gray-600 mt-1">
              {client.contact_info?.primary_contact_email} • {locations.length} locations
            </p>
          </div>
        </div>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Edit Client
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{locations.length}</p>
                <p className="text-xs text-gray-600 mt-1">Locations</p>
              </div>
              <MapPin className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{onlineLocations}</p>
                <p className="text-xs text-gray-600 mt-1">Online</p>
              </div>
              <Wifi className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">${(client.billing?.monthly_fee || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-600 mt-1">Monthly Fee</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{openTickets}</p>
                <p className="text-xs text-gray-600 mt-1">Open Tickets</p>
              </div>
              <FileText className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Detailed Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">
            <Building2 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="locations">
            <MapPin className="w-4 h-4 mr-2" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="billing">
            <DollarSign className="w-4 h-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="modules">
            <Package className="w-4 h-4 mr-2" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="support">
            <FileText className="w-4 h-4 mr-2" />
            Support
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ClientInfo client={client} locations={locations} lssConfigs={lssConfigs} />
        </TabsContent>

        <TabsContent value="locations">
          <ClientLocations client={client} locations={locations} lssConfigs={lssConfigs} />
        </TabsContent>

        <TabsContent value="billing">
          <ClientBilling client={client} />
        </TabsContent>

        <TabsContent value="modules">
          <ClientModules client={client} />
        </TabsContent>

        <TabsContent value="support">
          <ClientSupport client={client} tickets={supportTickets} />
        </TabsContent>

        <TabsContent value="analytics">
          <ClientAnalytics client={client} />
        </TabsContent>
      </Tabs>
    </div>
  );
}