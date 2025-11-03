import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Server, Cpu, Network, Zap, Droplets, DollarSign, Car, Printer, CreditCard,
  Plus, Save, Trash2, Copy, CheckCircle, AlertCircle, Settings 
} from 'lucide-react';
import ForecourtControllerConfig from './config/ForecourtControllerConfig';
import ATGSystemConfig from './config/ATGSystemConfig';
import PriceSignConfig from './config/PriceSignConfig';
import CarWashConfig from './config/CarWashConfig';
import PaymentTerminalConfig from './config/PaymentTerminalConfig';
import PrinterConfig from './config/PrinterConfig';
import SmartSafeConfig from './config/SmartSafeConfig';

export default function LSSConfigurationManager() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [lssConfig, setLssConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadLocations();
    }
  }, [selectedClient]);

  useEffect(() => {
    if (selectedLocation) {
      loadLSSConfiguration();
    }
  }, [selectedLocation]);

  const loadClients = async () => {
    try {
      const data = await base44.entities.ClientAccount.filter({ account_status: 'active' }, 'client_name');
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await base44.entities.Location.list('location_name');
      setLocations(data);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const loadLSSConfiguration = async () => {
    setIsLoading(true);
    try {
      const configs = await base44.entities.LSSConfiguration.filter({
        client_account_id: selectedClient,
        location_id: selectedLocation
      });

      if (configs && configs.length > 0) {
        setLssConfig(configs[0]);
      } else {
        // Initialize new config
        setLssConfig({
          client_account_id: selectedClient,
          location_id: selectedLocation,
          station_mode: 'single_station',
          network_config: {},
          forecourt_controllers: [],
          atg_system: { enabled: false },
          price_sign: { enabled: false },
          payment_terminals: [],
          printers: [],
          car_wash_system: { enabled: false },
          cash_management: { smart_safe_enabled: false },
          provisioning_status: 'pending'
        });
      }
    } catch (error) {
      console.error('Failed to load LSS configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLSSConfiguration = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      if (lssConfig.id) {
        await base44.entities.LSSConfiguration.update(lssConfig.id, lssConfig);
      } else {
        await base44.entities.LSSConfiguration.create(lssConfig);
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
      await loadLSSConfiguration();
    } catch (error) {
      console.error('Failed to save LSS configuration:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (path, value) => {
    setLssConfig(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Client and Location Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Client & Location</CardTitle>
          <CardDescription>Choose which client and location to configure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Client Account</Label>
              <Select value={selectedClient || ''} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.client_name} ({client.subscription_tier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Location</Label>
              <Select 
                value={selectedLocation || ''} 
                onValueChange={setSelectedLocation}
                disabled={!selectedClient}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.location_name} - {location.city}, {location.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedClient && selectedLocation && lssConfig && (
            <div className="flex items-center gap-2 pt-2">
              <Badge className={lssConfig.provisioning_status === 'active' ? 'bg-green-600' : 'bg-yellow-600'}>
                {lssConfig.provisioning_status || 'pending'}
              </Badge>
              {lssConfig.id && (
                <span className="text-sm text-gray-500">LSS Config ID: {lssConfig.id}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Interface */}
      {selectedClient && selectedLocation && lssConfig && !isLoading && (
        <>
          {/* Save Button - Always Visible */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-lg">LSS Configuration</h3>
              {saveStatus === 'success' && (
                <Badge className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Saved Successfully
                </Badge>
              )}
              {saveStatus === 'error' && (
                <Badge className="bg-red-600">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Save Failed
                </Badge>
              )}
            </div>
            <Button 
              onClick={saveLSSConfiguration} 
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>

          {/* Configuration Tabs */}
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="general">
                <Server className="w-4 h-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="forecourt">
                <Zap className="w-4 h-4 mr-2" />
                Forecourt
              </TabsTrigger>
              <TabsTrigger value="atg">
                <Droplets className="w-4 h-4 mr-2" />
                ATG
              </TabsTrigger>
              <TabsTrigger value="price-sign">
                <DollarSign className="w-4 h-4 mr-2" />
                Price Sign
              </TabsTrigger>
              <TabsTrigger value="carwash">
                <Car className="w-4 h-4 mr-2" />
                Car Wash
              </TabsTrigger>
              <TabsTrigger value="payment">
                <CreditCard className="w-4 h-4 mr-2" />
                Payment
              </TabsTrigger>
              <TabsTrigger value="printers">
                <Printer className="w-4 h-4 mr-2" />
                Printers
              </TabsTrigger>
              <TabsTrigger value="safe">
                <Settings className="w-4 h-4 mr-2" />
                Smart Safe
              </TabsTrigger>
            </TabsList>

            {/* General Configuration */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General LSS Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Station Mode</Label>
                      <Select 
                        value={lssConfig.station_mode} 
                        onValueChange={(value) => updateConfig('station_mode', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single_station">Single Station</SelectItem>
                          <SelectItem value="multi_station">Multi-Station</SelectItem>
                          <SelectItem value="master_satellite">Master-Satellite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>LSS Identifier</Label>
                      <Input
                        value={lssConfig.lss_identifier || ''}
                        onChange={(e) => updateConfig('lss_identifier', e.target.value)}
                        placeholder="MAC address or serial number"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Network Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>LSS Static IP</Label>
                        <Input
                          value={lssConfig.network_config?.lss_static_ip || ''}
                          onChange={(e) => updateConfig('network_config.lss_static_ip', e.target.value)}
                          placeholder="192.168.1.100"
                        />
                      </div>
                      <div>
                        <Label>Subnet Mask</Label>
                        <Input
                          value={lssConfig.network_config?.subnet_mask || ''}
                          onChange={(e) => updateConfig('network_config.subnet_mask', e.target.value)}
                          placeholder="255.255.255.0"
                        />
                      </div>
                      <div>
                        <Label>Gateway</Label>
                        <Input
                          value={lssConfig.network_config?.gateway || ''}
                          onChange={(e) => updateConfig('network_config.gateway', e.target.value)}
                          placeholder="192.168.1.1"
                        />
                      </div>
                      <div>
                        <Label>DNS Primary</Label>
                        <Input
                          value={lssConfig.network_config?.dns_primary || ''}
                          onChange={(e) => updateConfig('network_config.dns_primary', e.target.value)}
                          placeholder="8.8.8.8"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Forecourt Controller Configuration */}
            <TabsContent value="forecourt">
              <ForecourtControllerConfig
                config={lssConfig.forecourt_controllers || []}
                onChange={(value) => updateConfig('forecourt_controllers', value)}
              />
            </TabsContent>

            {/* ATG Configuration */}
            <TabsContent value="atg">
              <ATGSystemConfig
                config={lssConfig.atg_system || {}}
                onChange={(value) => updateConfig('atg_system', value)}
              />
            </TabsContent>

            {/* Price Sign Configuration */}
            <TabsContent value="price-sign">
              <PriceSignConfig
                config={lssConfig.price_sign || {}}
                onChange={(value) => updateConfig('price_sign', value)}
              />
            </TabsContent>

            {/* Car Wash Configuration */}
            <TabsContent value="carwash">
              <CarWashConfig
                config={lssConfig.car_wash_system || {}}
                onChange={(value) => updateConfig('car_wash_system', value)}
              />
            </TabsContent>

            {/* Payment Terminal Configuration */}
            <TabsContent value="payment">
              <PaymentTerminalConfig
                config={lssConfig.payment_terminals || []}
                onChange={(value) => updateConfig('payment_terminals', value)}
              />
            </TabsContent>

            {/* Printer Configuration */}
            <TabsContent value="printers">
              <PrinterConfig
                config={lssConfig.printers || []}
                onChange={(value) => updateConfig('printers', value)}
              />
            </TabsContent>

            {/* Smart Safe Configuration */}
            <TabsContent value="safe">
              <SmartSafeConfig
                config={lssConfig.cash_management || {}}
                onChange={(value) => updateConfig('cash_management', value)}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading LSS configuration...</p>
          </div>
        </div>
      )}
    </div>
  );
}