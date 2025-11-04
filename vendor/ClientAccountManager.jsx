import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, Plus, Search, Filter, MapPin, DollarSign, Users, Package,
  Settings, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, AlertTriangle,
  Download, Upload, RefreshCw, MoreVertical, ChevronRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ClientDetailView from './ClientDetailView';

export default function ClientAccountManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['client_accounts'],
    queryFn: async () => {
      const data = await base44.entities.ClientAccount.list('-created_date');
      return data || [];
    }
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['all_locations'],
    queryFn: async () => {
      const data = await base44.entities.Location.list();
      return data || [];
    }
  });

  const { data: lssConfigs = [] } = useQuery({
    queryKey: ['all_lss_configs'],
    queryFn: async () => {
      const data = await base44.entities.LSSConfiguration.list();
      return data || [];
    }
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData) => {
      return await base44.entities.ClientAccount.create(clientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['client_accounts']);
      setShowAddModal(false);
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.ClientAccount.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['client_accounts']);
    }
  });

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.contact_info?.primary_contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || client.account_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowDetailView(true);
  };

  const handleToggleStatus = async (client, newStatus) => {
    await updateClientMutation.mutateAsync({
      id: client.id,
      data: { account_status: newStatus }
    });
  };

  if (showDetailView && selectedClient) {
    return (
      <ClientDetailView 
        client={selectedClient}
        onBack={() => {
          setShowDetailView(false);
          setSelectedClient(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Account Management</h2>
          <p className="text-gray-600 mt-1">Manage all FuelFlow Pro client accounts and their configurations</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import Clients
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Add New Client
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                <p className="text-xs text-gray-600 mt-1">Total Clients</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {clients.filter(c => c.account_status === 'active').length}
                </p>
                <p className="text-xs text-gray-600 mt-1">Active</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {clients.filter(c => c.account_status === 'trial').length}
                </p>
                <p className="text-xs text-gray-600 mt-1">Trial</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {clients.filter(c => c.account_status === 'suspended').length}
                </p>
                <p className="text-xs text-gray-600 mt-1">Suspended</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
                <p className="text-xs text-gray-600 mt-1">Total Locations</p>
              </div>
              <MapPin className="w-8 h-8 text-gray-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search clients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="pending_activation">Pending Activation</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client Accounts ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No clients found</p>
              <Button onClick={() => setShowAddModal(true)} className="mt-4" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Client
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredClients.map((client) => {
                const clientLocations = locations.filter(l => l.client_account_id === client.id);
                const clientLSS = lssConfigs.filter(lss => lss.client_account_id === client.id);
                const onlineLocations = clientLSS.filter(lss => 
                  lss.health_status?.overall_status === 'healthy'
                ).length;

                return (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleViewClient(client)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        client.account_status === 'active' ? 'bg-green-100' :
                        client.account_status === 'trial' ? 'bg-blue-100' :
                        client.account_status === 'suspended' ? 'bg-orange-100' :
                        'bg-gray-100'
                      }`}>
                        <Building2 className={`w-6 h-6 ${
                          client.account_status === 'active' ? 'text-green-600' :
                          client.account_status === 'trial' ? 'text-blue-600' :
                          client.account_status === 'suspended' ? 'text-orange-600' :
                          'text-gray-600'
                        }`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900">{client.client_name}</h3>
                          <Badge className={
                            client.account_status === 'active' ? 'bg-green-100 text-green-700' :
                            client.account_status === 'trial' ? 'bg-blue-100 text-blue-700' :
                            client.account_status === 'suspended' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {client.account_status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {client.subscription_tier}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {clientLocations.length} locations
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            {onlineLocations} online
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${(client.billing?.monthly_fee || 0).toLocaleString()}/mo
                          </span>
                          {client.billing?.outstanding_balance > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              ${client.billing.outstanding_balance.toLocaleString()} AR
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={(e) => {
                        e.stopPropagation();
                        handleViewClient(client);
                      }}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleViewClient(client);
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Full Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {client.account_status === 'active' && (
                            <DropdownMenuItem
                              className="text-orange-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(client, 'suspended');
                              }}
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Suspend Account
                            </DropdownMenuItem>
                          )}
                          {client.account_status === 'suspended' && (
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(client, 'active');
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Reactivate Account
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onSave={(clientData) => createClientMutation.mutate(clientData)}
        />
      )}
    </div>
  );
}

function AddClientModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    client_name: '',
    client_type: 'single_site',
    account_status: 'pending_activation',
    subscription_tier: 'professional',
    contact_info: {
      primary_contact_name: '',
      primary_contact_email: '',
      primary_contact_phone: '',
      billing_address: '',
      billing_city: '',
      billing_state: '',
      billing_zip: ''
    },
    license_info: {
      max_locations: 1,
      max_terminals_per_location: 2,
      max_users: 10,
      auto_renew: true
    },
    enabled_modules: {
      pos: true,
      fuel_management: true,
      inventory: true,
      loyalty: false,
      qsr: false,
      delivery_hub: false,
      scan_data_reporting: false
    },
    billing: {
      monthly_fee: 0,
      per_location_fee: 0,
      payment_method: 'credit_card',
      outstanding_balance: 0
    }
  });

  const handleSubmit = () => {
    if (!formData.client_name || !formData.contact_info.primary_contact_email) {
      alert('Please fill in required fields');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client Account</DialogTitle>
          <DialogDescription>
            Create a new FuelFlow Pro client account with initial configuration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                  placeholder="e.g., ABC Fuel Stores Inc."
                />
              </div>
              <div>
                <Label htmlFor="client_type">Client Type</Label>
                <Select
                  value={formData.client_type}
                  onValueChange={(value) => setFormData({...formData, client_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_site">Single Site</SelectItem>
                    <SelectItem value="multi_site_chain">Multi-Site Chain</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_name">Primary Contact Name</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_info.primary_contact_name}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact_info: {...formData.contact_info, primary_contact_name: e.target.value}
                  })}
                />
              </div>
              <div>
                <Label htmlFor="contact_email">Primary Contact Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_info.primary_contact_email}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact_info: {...formData.contact_info, primary_contact_email: e.target.value}
                  })}
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_info.primary_contact_phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    contact_info: {...formData.contact_info, primary_contact_phone: e.target.value}
                  })}
                />
              </div>
            </div>
          </div>

          {/* Subscription & Licensing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Subscription & Licensing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subscription_tier">Subscription Tier</Label>
                <Select
                  value={formData.subscription_tier}
                  onValueChange={(value) => setFormData({...formData, subscription_tier: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="ultimate">Ultimate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="max_locations">Max Locations</Label>
                <Input
                  id="max_locations"
                  type="number"
                  value={formData.license_info.max_locations}
                  onChange={(e) => setFormData({
                    ...formData,
                    license_info: {...formData.license_info, max_locations: parseInt(e.target.value)}
                  })}
                />
              </div>
              <div>
                <Label htmlFor="monthly_fee">Monthly Fee ($)</Label>
                <Input
                  id="monthly_fee"
                  type="number"
                  step="0.01"
                  value={formData.billing.monthly_fee}
                  onChange={(e) => setFormData({
                    ...formData,
                    billing: {...formData.billing, monthly_fee: parseFloat(e.target.value)}
                  })}
                />
              </div>
            </div>
          </div>

          {/* Enabled Modules */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Enabled Modules</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(formData.enabled_modules).map(([module, enabled]) => (
                <div key={module} className="flex items-center space-x-2">
                  <Checkbox
                    id={module}
                    checked={enabled}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      enabled_modules: {...formData.enabled_modules, [module]: checked}
                    })}
                  />
                  <label htmlFor={module} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize">
                    {module.replace(/_/g, ' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
            Create Client Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}