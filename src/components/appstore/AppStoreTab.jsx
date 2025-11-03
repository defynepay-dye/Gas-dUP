
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, Star, TrendingUp, Users, ShoppingCart, BarChart3,
  Zap, Shield, Bell, FileText, Smartphone, Package, DollarSign,
  Clock, Target, Truck, Globe, Activity, ShoppingBag, ArrowLeft,
  Sparkles, Settings // Added Settings here
} from 'lucide-react';

import LotteryIntegrationApp from './LotteryIntegrationApp';
import AdvancedEngagementSetup from './AdvancedEngagementSetup';
import DeliveryHubApp from './DeliveryHubApp';

export default function AppStoreTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [installedApps, setInstalledApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInstalledApps();
  }, []);

  const loadInstalledApps = async () => {
    try {
      const installed = localStorage.getItem('installed_apps');
      if (installed) {
        setInstalledApps(JSON.parse(installed));
      }
    } catch (error) {
      console.error('Error loading installed apps:', error);
    }
    setIsLoading(false);
  };

  const handleInstallApp = (appData) => {
    if (!installedApps.some(app => app.app_id === appData.app_id)) {
      const updatedApps = [...installedApps, appData];
      setInstalledApps(updatedApps);
      localStorage.setItem('installed_apps', JSON.stringify(updatedApps));
      
      if (appData.app_id === 'state_lottery_integration') {
        localStorage.setItem('lottery_integration_config', JSON.stringify(appData.config));
      } else if (appData.app_id === 'delivery_hub') {
        localStorage.setItem('delivery_hub_config', JSON.stringify(appData.config));
      }
      
      alert(`✅ ${appData.app_name} installed successfully!`);
    } else {
      alert(`ℹ️ ${appData.app_name} is already installed.`);
    }
  };

  const isAppInstalled = (appId) => {
    return installedApps.some(app => app.app_id === appId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">App Store</h2>
          <p className="text-gray-600">Enhance your FuelFlow Pro with premium integrations and features</p>
        </div>
      </div>

      {selectedApp === 'advanced_engagement' ? (
        <div>
          <Button variant="ghost" onClick={() => setSelectedApp(null)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App Store
          </Button>
          <AdvancedEngagementSetup />
        </div>
      ) : (
        <Tabs defaultValue="featured" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="installed">
              Installed {installedApps.length > 0 && <Badge className="ml-2">{installedApps.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="productivity">Productivity</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="featured" className="space-y-6">
            {/* DELIVERY HUB - ABSOLUTELY FIRST */}
            <DeliveryHubApp 
              onInstall={handleInstallApp}
              isInstalled={isAppInstalled('delivery_hub')}
            />

            {/* STATE LOTTERY - SECOND */}
            <LotteryIntegrationApp 
              onInstall={handleInstallApp}
              isInstalled={isAppInstalled('state_lottery_integration')}
            />
            
            {/* Enterprise Features Section */}
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-600" />
                  Enterprise & Premium Features
                </CardTitle>
                <CardDescription>
                  Next-generation capabilities for advanced customer engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setSelectedApp('advanced_engagement')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Configure Advanced Engagement
                </Button>
              </CardContent>
            </Card>

            {/* Coming Soon Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  Coming Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        <h4 className="font-semibold">AI Dynamic Pricing</h4>
                      </div>
                      <p className="text-sm text-gray-600">Real-time price optimization</p>
                      <Badge className="mt-2">Q2 2025</Badge>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Smartphone className="w-5 h-5 text-green-500" />
                        <h4 className="font-semibold">Mobile Ordering</h4>
                      </div>
                      <p className="text-sm text-gray-600">Custom branded mobile app</p>
                      <Badge className="mt-2">Q2 2025</Badge>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Truck className="w-5 h-5 text-purple-500" />
                        <h4 className="font-semibold">Fleet Management</h4>
                      </div>
                      <p className="text-sm text-gray-600">Route optimization & tracking</p>
                      <Badge className="mt-2">Q3 2025</Badge>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="installed" className="space-y-4">
            {installedApps.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Apps Installed Yet</h3>
                  <p className="text-gray-500 mb-4">Browse the Featured tab to discover powerful integrations</p>
                  <Button onClick={() => document.querySelector('[value="featured"]').click()}>
                    Browse Apps
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {installedApps.map(app => (
                  <Card key={app.app_id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{app.app_name}</span>
                        <Badge className="bg-green-600">Installed</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Installed on {new Date(app.installed_at).toLocaleDateString()}
                      </p>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="productivity" className="space-y-4">
            <Card>
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Productivity Apps Coming Soon</h3>
                <p className="text-gray-500">Check back later for productivity-enhancing tools</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardContent className="p-12 text-center">
                <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">More Integrations Coming Soon</h3>
                <p className="text-gray-500">We're working on adding more third-party integrations</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
