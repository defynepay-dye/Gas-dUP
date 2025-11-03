import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShoppingBag, Bell, Check, Settings, DollarSign, TrendingUp,
  Clock, Package, Star, Zap, ExternalLink, CheckCircle2
} from 'lucide-react';
import { DeliveryPlatformIntegration } from '@/api/entities';

export default function DeliveryHubApp({ onInstall, isInstalled }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);

  if (!isExpanded) {
    return (
      <Card className="border-2 border-orange-300 shadow-xl hover:shadow-2xl transition-all bg-gradient-to-br from-orange-50 to-red-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">Unified Delivery Hub</CardTitle>
                  <Badge className="bg-orange-600 text-white">HOT 🔥</Badge>
                  <Badge variant="outline" className="border-orange-400 text-orange-700">$99/month</Badge>
                </div>
                <CardDescription className="text-base">
                  Centralize all delivery platform orders in one place. Get real-time POS notifications, KDS-style management, and automatic inventory sync.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <Bell className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Real-Time POS Alerts</p>
                <p className="text-xs text-gray-600">Sound + visual notifications for every new order</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <Package className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Auto Inventory Sync</p>
                <p className="text-xs text-gray-600">Automatically deduct items from inventory</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">KDS-Style Interface</p>
                <p className="text-xs text-gray-600">Bump system for order management</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm font-semibold mb-2">Supported Platforms (7):</p>
            <div className="flex flex-wrap gap-2">
              {['GrubHub', 'Uber Eats', 'DoorDash', 'Drizly', 'Vroom', 'Instacart', 'Postmates'].map(platform => (
                <Badge key={platform} variant="outline" className="border-orange-300 text-orange-700">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setIsExpanded(true)}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
              size="lg"
            >
              {isInstalled ? (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Integration
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Get Started - $99/month
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://docs.fuelflowpro.com/delivery-hub', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-orange-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Unified Delivery Hub Configuration</CardTitle>
              <CardDescription>Connect your delivery platforms and configure settings</CardDescription>
            </div>
          </div>
          <Button variant="outline" onClick={() => setIsExpanded(false)}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DeliveryHubConfiguration onInstall={onInstall} />
      </CardContent>
    </Card>
  );
}

function DeliveryHubConfiguration({ onInstall }) {
  const [platforms, setPlatforms] = useState([
    { id: 'grubhub', name: 'GrubHub', icon: '🍔', enabled: false, apiKey: '', storeId: '' },
    { id: 'ubereats', name: 'Uber Eats', icon: '🚗', enabled: false, apiKey: '', storeId: '' },
    { id: 'doordash', name: 'DoorDash', icon: '🏪', enabled: false, apiKey: '', storeId: '' },
    { id: 'drizly', name: 'Drizly', icon: '🍷', enabled: false, apiKey: '', storeId: '' },
    { id: 'vroom', name: 'Vroom', icon: '🛵', enabled: false, apiKey: '', storeId: '' },
    { id: 'instacart', name: 'Instacart', icon: '🛒', enabled: false, apiKey: '', storeId: '' },
    { id: 'postmates', name: 'Postmates', icon: '📦', enabled: false, apiKey: '', storeId: '' }
  ]);

  const [globalSettings, setGlobalSettings] = useState({
    auto_accept_orders: false,
    sound_alerts: true,
    visual_alerts: true,
    default_prep_time: 15
  });

  const handlePlatformToggle = (platformId, enabled) => {
    setPlatforms(platforms.map(p =>
      p.id === platformId ? { ...p, enabled } : p
    ));
  };

  const handlePlatformUpdate = (platformId, field, value) => {
    setPlatforms(platforms.map(p =>
      p.id === platformId ? { ...p, [field]: value } : p
    ));
  };

  const handleSaveConfiguration = async () => {
    const enabledPlatforms = platforms.filter(p => p.enabled);
    
    if (enabledPlatforms.length === 0) {
      alert('Please enable at least one delivery platform');
      return;
    }

    const missingCredentials = enabledPlatforms.filter(p => !p.apiKey || !p.storeId);
    if (missingCredentials.length > 0) {
      alert(`Missing API credentials for: ${missingCredentials.map(p => p.name).join(', ')}`);
      return;
    }

    const config = {
      platforms: enabledPlatforms.map(p => ({
        platform: p.id,
        api_key: p.apiKey,
        store_id: p.storeId
      })),
      settings: globalSettings
    };

    onInstall({
      app_id: 'delivery_hub',
      app_name: 'Unified Delivery Hub',
      config: config
    });

    // Store configuration
    localStorage.setItem('delivery_hub_config', JSON.stringify(config));
    
    alert('✅ Delivery Hub configured successfully! Orders will now appear in your POS.');
  };

  const enabledCount = platforms.filter(p => p.enabled).length;

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Bell className="w-4 h-4 text-blue-600" />
        <AlertDescription>
          <strong>How it works:</strong> Once configured, delivery orders will appear as real-time alerts in your POS. 
          Click the alert to see the full KDS-style order management interface.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{enabledCount}</p>
              <p className="text-sm text-gray-600">Platforms Connected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">$99</p>
              <p className="text-sm text-gray-600">Per Month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">∞</p>
              <p className="text-sm text-gray-600">Orders Per Month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="platforms">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="platforms">Platform Connections</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-4">
          {platforms.map(platform => (
            <Card key={platform.id} className={platform.enabled ? 'border-green-300 bg-green-50' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{platform.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      <CardDescription>
                        {platform.enabled ? 'Connected' : 'Not connected'}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={platform.enabled}
                    onCheckedChange={(checked) => handlePlatformToggle(platform.id, checked)}
                  />
                </div>
              </CardHeader>
              {platform.enabled && (
                <CardContent className="space-y-3">
                  <div>
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter API key from platform"
                      value={platform.apiKey}
                      onChange={(e) => handlePlatformUpdate(platform.id, 'apiKey', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Store ID</Label>
                    <Input
                      placeholder="Enter your store ID on this platform"
                      value={platform.storeId}
                      onChange={(e) => handlePlatformUpdate(platform.id, 'storeId', e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://docs.fuelflowpro.com/delivery-hub/${platform.id}`, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    How to get {platform.name} credentials
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Handling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Accept Orders</Label>
                  <p className="text-sm text-gray-500">Automatically accept all incoming orders</p>
                </div>
                <Switch
                  checked={globalSettings.auto_accept_orders}
                  onCheckedChange={(checked) => setGlobalSettings({ ...globalSettings, auto_accept_orders: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sound Alerts</Label>
                  <p className="text-sm text-gray-500">Play sound when new orders arrive</p>
                </div>
                <Switch
                  checked={globalSettings.sound_alerts}
                  onCheckedChange={(checked) => setGlobalSettings({ ...globalSettings, sound_alerts: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Visual Alerts</Label>
                  <p className="text-sm text-gray-500">Show flashing notification banner</p>
                </div>
                <Switch
                  checked={globalSettings.visual_alerts}
                  onCheckedChange={(checked) => setGlobalSettings({ ...globalSettings, visual_alerts: checked })}
                />
              </div>
              <div>
                <Label>Default Prep Time (minutes)</Label>
                <Input
                  type="number"
                  value={globalSettings.default_prep_time}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, default_prep_time: parseInt(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSaveConfiguration}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
          size="lg"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Save & Activate Delivery Hub
        </Button>
      </div>
    </div>
  );
}