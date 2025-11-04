import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedEngagementSettings, Location } from "@/api/entities";
import { 
  ShoppingCart, Smartphone, Zap, CheckCircle, XCircle, 
  AlertTriangle, Rocket, Star, TrendingUp, Users, Sparkles,
  ArrowRight, Lock, Unlock, FileText, PlayCircle
} from "lucide-react";

export default function AdvancedEngagementSetup() {
  const [settings, setSettings] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [locationsData] = await Promise.all([
        Location.list()
      ]);
      
      setLocations(locationsData);
      
      if (locationsData.length > 0) {
        const firstLocation = locationsData[0];
        setSelectedLocation(firstLocation);
        await loadSettingsForLocation(firstLocation.id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettingsForLocation = async (locationId) => {
    try {
      const settingsData = await AdvancedEngagementSettings.filter({ location_id: locationId });
      if (settingsData && settingsData.length > 0) {
        setSettings(settingsData[0]);
      } else {
        // Create default settings for this location
        const defaultSettings = {
          location_id: locationId,
          one_customer_one_cart_enabled: false,
          forecourt_recognition_enabled: false,
          ai_personalization_enabled: false,
          mobile_app_integration: {
            enabled: false,
            api_key: "",
            app_name: "",
            app_scheme: ""
          },
          forecourt_hardware: {
            qr_scanners_installed: false,
            bluetooth_beacons_installed: false,
            lpg_cameras_installed: false,
            pump_displays_upgraded: false
          },
          subscription_tier: "basic",
          setup_completed: false,
          notes: ""
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleLocationChange = async (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    setSelectedLocation(location);
    await loadSettingsForLocation(locationId);
  };

  const handleToggleFeature = (featureName) => {
    setSettings({
      ...settings,
      [featureName]: !settings[featureName]
    });
  };

  const handleUpdateMobileIntegration = (field, value) => {
    setSettings({
      ...settings,
      mobile_app_integration: {
        ...settings.mobile_app_integration,
        [field]: value
      }
    });
  };

  const handleUpdateHardware = (field, value) => {
    setSettings({
      ...settings,
      forecourt_hardware: {
        ...settings.forecourt_hardware,
        [field]: value
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (settings.id) {
        await AdvancedEngagementSettings.update(settings.id, settings);
      } else {
        const newSettings = await AdvancedEngagementSettings.create(settings);
        setSettings(newSettings);
      }
      alert('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading Advanced Engagement Settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load settings. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  const isEnterpriseTier = settings.subscription_tier === 'enterprise';
  const isPremiumOrHigher = settings.subscription_tier === 'premium' || isEnterpriseTier;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Advanced Customer Engagement
          </h2>
          <p className="text-gray-600 mt-1">
            Next-generation features for premium customer experiences
          </p>
        </div>
        <Badge className={`text-lg py-2 px-4 ${
          isEnterpriseTier ? 'bg-purple-600' : 
          isPremiumOrHigher ? 'bg-blue-600' : 
          'bg-gray-600'
        }`}>
          {settings.subscription_tier.toUpperCase()} TIER
        </Badge>
      </div>

      {/* Location Selector */}
      {locations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Location</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              className="w-full p-2 border rounded"
              value={selectedLocation?.id || ''}
              onChange={(e) => handleLocationChange(e.target.value)}
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.location_name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="getting-started">Get Started</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-blue-600" />
                What is Advanced Customer Engagement?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Advanced Customer Engagement transforms your convenience store into a modern, 
                AI-powered retail experience. It enables seamless shopping across multiple touchpoints, 
                personalized offers, and a unified customer journey from forecourt to checkout.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <ShoppingCart className="w-8 h-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold mb-1">One Customer, One Cart</h4>
                  <p className="text-sm text-gray-600">
                    Seamlessly merge fuel, pre-orders, and in-store purchases into a single transaction
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <Zap className="w-8 h-8 text-purple-600 mb-2" />
                  <h4 className="font-semibold mb-1">Forecourt Recognition</h4>
                  <p className="text-sm text-gray-600">
                    Identify customers at the pump and deliver personalized offers in real-time
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                  <h4 className="font-semibold mb-1">AI Personalization</h4>
                  <p className="text-sm text-gray-600">
                    Drive revenue with intelligent recommendations and targeted promotions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">Setup Completed</span>
                  {settings.setup_completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">One Customer, One Cart</span>
                  {settings.one_customer_one_cart_enabled ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">Forecourt Recognition</span>
                  {settings.forecourt_recognition_enabled ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">AI Personalization</span>
                  {settings.ai_personalization_enabled ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Activation</CardTitle>
              <CardDescription>
                Enable or disable advanced features for this location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* One Customer, One Cart */}
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-lg">One Customer, One Cart</h4>
                    {isPremiumOrHigher ? (
                      <Unlock className="w-4 h-4 text-green-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Enable seamless shopping across forecourt, mobile app, and in-store. 
                    Customers can build a single cart across all touchpoints.
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Requires: Premium or Enterprise Tier
                  </Badge>
                </div>
                <Button
                  variant={settings.one_customer_one_cart_enabled ? "default" : "outline"}
                  onClick={() => handleToggleFeature('one_customer_one_cart_enabled')}
                  disabled={!isPremiumOrHigher}
                >
                  {settings.one_customer_one_cart_enabled ? 'Enabled' : 'Enable'}
                </Button>
              </div>

              {/* Forecourt Recognition */}
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-lg">Forecourt Recognition</h4>
                    {isEnterpriseTier ? (
                      <Unlock className="w-4 h-4 text-green-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Automatically identify customers at fuel pumps and deliver personalized 
                    offers in real-time via mobile app or pump display.
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Requires: Enterprise Tier + Hardware Upgrades
                  </Badge>
                </div>
                <Button
                  variant={settings.forecourt_recognition_enabled ? "default" : "outline"}
                  onClick={() => handleToggleFeature('forecourt_recognition_enabled')}
                  disabled={!isEnterpriseTier}
                >
                  {settings.forecourt_recognition_enabled ? 'Enabled' : 'Enable'}
                </Button>
              </div>

              {/* AI Personalization */}
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-lg">AI-Powered Personalization</h4>
                    {isPremiumOrHigher ? (
                      <Unlock className="w-4 h-4 text-green-600" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Use AI to analyze customer behavior, predict needs, and generate 
                    personalized offers that drive higher basket sizes and loyalty.
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Requires: Premium or Enterprise Tier
                  </Badge>
                </div>
                <Button
                  variant={settings.ai_personalization_enabled ? "default" : "outline"}
                  onClick={() => handleToggleFeature('ai_personalization_enabled')}
                  disabled={!isPremiumOrHigher}
                >
                  {settings.ai_personalization_enabled ? 'Enabled' : 'Enable'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mobile App Integration</CardTitle>
              <CardDescription>
                Connect your customer-facing mobile application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app_name">Mobile App Name</Label>
                <Input
                  id="app_name"
                  placeholder="e.g., MyStore Rewards App"
                  value={settings.mobile_app_integration?.app_name || ''}
                  onChange={(e) => handleUpdateMobileIntegration('app_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="Enter API key for mobile app integration"
                  value={settings.mobile_app_integration?.api_key || ''}
                  onChange={(e) => handleUpdateMobileIntegration('api_key', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Contact FuelFlow Pro support to generate your API key
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="app_scheme">App URL Scheme</Label>
                <Input
                  id="app_scheme"
                  placeholder="e.g., mystore://"
                  value={settings.mobile_app_integration?.app_scheme || ''}
                  onChange={(e) => handleUpdateMobileIntegration('app_scheme', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="mobile_enabled"
                  checked={settings.mobile_app_integration?.enabled || false}
                  onChange={(e) => handleUpdateMobileIntegration('enabled', e.target.checked)}
                />
                <Label htmlFor="mobile_enabled" className="cursor-pointer">
                  Enable mobile app integration
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forecourt Hardware Status</CardTitle>
              <CardDescription>
                Track your forecourt hardware capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="qr_scanners"
                    checked={settings.forecourt_hardware?.qr_scanners_installed || false}
                    onChange={(e) => handleUpdateHardware('qr_scanners_installed', e.target.checked)}
                  />
                  <Label htmlFor="qr_scanners" className="cursor-pointer">
                    QR Code Scanners at Pumps
                  </Label>
                </div>
                {settings.forecourt_hardware?.qr_scanners_installed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="bluetooth_beacons"
                    checked={settings.forecourt_hardware?.bluetooth_beacons_installed || false}
                    onChange={(e) => handleUpdateHardware('bluetooth_beacons_installed', e.target.checked)}
                  />
                  <Label htmlFor="bluetooth_beacons" className="cursor-pointer">
                    Bluetooth Beacons for Proximity Detection
                  </Label>
                </div>
                {settings.forecourt_hardware?.bluetooth_beacons_installed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="lpg_cameras"
                    checked={settings.forecourt_hardware?.lpg_cameras_installed || false}
                    onChange={(e) => handleUpdateHardware('lpg_cameras_installed', e.target.checked)}
                  />
                  <Label htmlFor="lpg_cameras" className="cursor-pointer">
                    License Plate Recognition Cameras
                  </Label>
                </div>
                {settings.forecourt_hardware?.lpg_cameras_installed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pump_displays"
                    checked={settings.forecourt_hardware?.pump_displays_upgraded || false}
                    onChange={(e) => handleUpdateHardware('pump_displays_upgraded', e.target.checked)}
                  />
                  <Label htmlFor="pump_displays" className="cursor-pointer">
                    Upgraded Pump Displays (for personalized offers)
                  </Label>
                </div>
                {settings.forecourt_hardware?.pump_displays_upgraded ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Getting Started Tab */}
        <TabsContent value="getting-started" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-blue-600" />
                Getting Started Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Follow these steps to activate Advanced Customer Engagement features for your location.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Upgrade Your Subscription Tier</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Advanced features require Premium or Enterprise tier subscriptions.
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li><strong>Premium:</strong> One Customer One Cart + AI Personalization</li>
                      <li><strong>Enterprise:</strong> All Premium features + Forecourt Recognition</li>
                    </ul>
                    <Button size="sm" variant="outline" className="mt-3">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Contact Sales to Upgrade
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Mobile App Integration</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      For multi-store owners with existing apps:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Request API keys from FuelFlow Pro support</li>
                      <li>Integrate FuelFlow Pro APIs into your mobile app</li>
                      <li>Test customer identification and cart synchronization</li>
                      <li>Configure deep linking for seamless app experience</li>
                    </ul>
                    <p className="text-sm text-gray-600 mt-2">
                      For single-store owners or those without an app:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>FuelFlow Pro can provide a white-label mobile solution</li>
                      <li>Contact support for custom app development options</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Forecourt Hardware (Enterprise Only)</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      For forecourt recognition, you'll need:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li><strong>QR Code Scanners:</strong> Install at each pump for app-based identification</li>
                      <li><strong>Bluetooth Beacons (Optional):</strong> Ultra-precise location detection (1-meter accuracy)</li>
                      <li><strong>LPR Cameras (Optional):</strong> Automatic vehicle recognition</li>
                      <li><strong>Upgraded Pump Displays (Optional):</strong> Show personalized offers directly on pump screens</li>
                    </ul>
                    <Button size="sm" variant="outline" className="mt-3">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Request Hardware Quote
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Configure & Test</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Once prerequisites are met:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Enter your mobile app details in the "Integration" tab</li>
                      <li>Mark hardware installations as complete</li>
                      <li>Enable desired features in the "Features" tab</li>
                      <li>Test the complete customer journey with a pilot group</li>
                      <li>Train staff on new workflows</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Go Live!</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Launch your next-generation customer experience and start seeing results:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Higher basket sizes through seamless multi-touchpoint shopping</li>
                      <li>Increased in-store visits driven by forecourt offers</li>
                      <li>Improved loyalty through personalized experiences</li>
                      <li>Real-time AI insights into customer behavior</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Users className="w-12 h-12 text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-lg mb-2">Need Help Getting Started?</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    Our team of experts is ready to help you implement Advanced Customer Engagement 
                    at your location. We offer personalized onboarding, technical support, and 
                    training to ensure a smooth rollout.
                  </p>
                  <div className="flex gap-3">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Schedule Consultation
                    </Button>
                    <Button variant="outline">
                      Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button variant="outline" onClick={loadData}>
          Reset Changes
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}