import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Star, ArrowLeft, Sparkles, ShoppingBag, Package, Target, Search,
  TrendingUp, Users, BarChart3, Zap, Shield, Bell, Smartphone,
  Truck, Globe, Activity, DollarSign, Clock, FileText, Settings
} from 'lucide-react';

import LotteryIntegrationApp from '../../appstore/LotteryIntegrationApp';
import AdvancedEngagementSetup from '../../appstore/AdvancedEngagementSetup';
import DeliveryHubApp from '../../appstore/DeliveryHubApp';

export default function AppStoreTab() {
  const [selectedApp, setSelectedApp] = useState(null);
  const [installedApps, setInstalledApps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const apps = [
    {
      id: 'delivery_hub',
      name: 'Unified Delivery Hub',
      icon: ShoppingBag,
      category: 'Operations',
      price: '$99/month',
      description: 'Centralize all delivery platform orders in one place.',
      features: ['Real-time POS alerts', 'Auto inventory sync', 'KDS interface'],
      popular: true
    },
    {
      id: 'state_lottery_integration',
      name: 'State Lottery Integration',
      icon: Package,
      category: 'Operations',
      price: '$49/month',
      description: 'Auto-sync lottery games with state commission.',
      features: ['Auto-sync API', 'Real-time updates', 'Compliance reporting'],
      popular: true
    },
    {
      id: 'advanced_engagement',
      name: 'Advanced Engagement Suite',
      icon: Target,
      category: 'Marketing',
      price: '$199/month',
      description: 'Premium customer engagement tools.',
      features: ['Personalized offers', 'Multi-tier loyalty', 'CPG integration'],
      popular: true
    },
    {
      id: 'ai_pricing',
      name: 'AI Dynamic Pricing',
      icon: TrendingUp,
      category: 'Intelligence',
      price: '$299/month',
      description: 'AI-powered pricing optimization.',
      features: ['Real-time optimization', 'Competitor monitoring', 'Weather adjustments'],
      comingSoon: true
    },
    {
      id: 'mobile_ordering',
      name: 'Mobile Ordering & Delivery',
      icon: Smartphone,
      category: 'Operations',
      price: '$149/month',
      description: 'Custom branded mobile app.',
      features: ['iOS & Android apps', 'Order ahead', 'Push notifications'],
      comingSoon: true
    },
    {
      id: 'fleet_management',
      name: 'Fleet & Delivery Management',
      icon: Truck,
      category: 'Operations',
      price: '$199/month',
      description: 'Manage delivery fleet with optimization.',
      features: ['Route optimization', 'Driver tracking', 'Automated dispatch'],
      comingSoon: true
    },
    {
      id: 'customer_insights',
      name: 'Customer Insights AI',
      icon: Users,
      category: 'Intelligence',
      price: '$249/month',
      description: 'AI customer behavior analysis.',
      features: ['Churn prediction', 'Lifetime value forecasting', 'Segmentation'],
      comingSoon: true
    },
    {
      id: 'competitive_intelligence',
      name: 'Competitive Intelligence',
      icon: Globe,
      category: 'Intelligence',
      price: '$179/month',
      description: 'Monitor competitor pricing and trends.',
      features: ['Price monitoring', 'Promotion tracking', 'Benchmarking'],
      comingSoon: true
    },
    {
      id: 'advanced_analytics',
      name: 'Advanced Analytics Suite',
      icon: BarChart3,
      category: 'Intelligence',
      price: '$399/month',
      description: 'Enterprise analytics with forecasting.',
      features: ['Custom dashboards', 'Predictive forecasting', 'Executive reports'],
      comingSoon: true
    },
    {
      id: 'employee_performance',
      name: 'Employee Performance & Training',
      icon: Activity,
      category: 'Operations',
      price: '$129/month',
      description: 'Track performance and training.',
      features: ['Performance dashboards', 'Training modules', 'Gamification'],
      comingSoon: true
    }
  ];

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

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory && !app.popular;
  });

  const categories = ['all', ...new Set(apps.map(app => app.category))];

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="featured">
              <Star className="w-4 h-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="browse">
              <Search className="w-4 h-4 mr-2" />
              Browse All
            </TabsTrigger>
            <TabsTrigger value="installed">
              <Package className="w-4 h-4 mr-2" />
              Installed {installedApps.length > 0 && <Badge className="ml-2">{installedApps.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="coming">
              <Clock className="w-4 h-4 mr-2" />
              Coming Soon
            </TabsTrigger>
          </TabsList>

          {/* FEATURED TAB */}
          <TabsContent value="featured" className="space-y-6">
            <DeliveryHubApp 
              onInstall={handleInstallApp}
              isInstalled={isAppInstalled('delivery_hub')}
            />

            <LotteryIntegrationApp 
              onInstall={handleInstallApp}
              isInstalled={isAppInstalled('state_lottery_integration')}
            />
            
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl">Advanced Engagement Suite</CardTitle>
                        <Badge className="bg-purple-600 text-white">ENTERPRISE</Badge>
                        <Badge variant="outline" className="border-purple-400 text-purple-700">$199/month</Badge>
                      </div>
                      <CardDescription className="text-base">
                        Premium customer engagement tools including personalized offers, advanced loyalty programs, and CPG/Tobacco loyalty integration.
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setSelectedApp('advanced_engagement')}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  size="lg"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Configure Advanced Engagement
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BROWSE ALL TAB */}
          <TabsContent value="browse" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search apps by name or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    {categories.map(category => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="whitespace-nowrap"
                      >
                        {category === 'all' ? 'All Categories' : category}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredApps.map(app => {
                    const Icon = app.icon;
                    return (
                      <Card key={app.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{app.name}</CardTitle>
                              <Badge variant="outline" className="mt-1">{app.price}</Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-gray-600">{app.description}</p>
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-700">Key Features:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {app.features.slice(0, 3).map((feature, idx) => (
                                <li key={idx}>• {feature}</li>
                              ))}
                            </ul>
                          </div>
                          <Button className="w-full" variant="outline" disabled={app.comingSoon}>
                            {app.comingSoon ? 'Coming Soon' : 'Learn More'}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {filteredApps.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No apps match your search criteria</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* INSTALLED TAB */}
          <TabsContent value="installed" className="space-y-4">
            {installedApps.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No apps installed yet</p>
                  <p className="text-sm text-gray-400 mt-2">Browse the Featured tab to get started</p>
                </CardContent>
              </Card>
            ) : (
              installedApps.map(app => (
                <Card key={app.app_id} className="border-green-300 bg-green-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-600">✓ Installed</Badge>
                        <CardTitle>{app.app_name}</CardTitle>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Installed on {new Date(app.installed_date || Date.now()).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* COMING SOON TAB */}
          <TabsContent value="coming" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apps.filter(app => app.comingSoon).map(app => {
                const Icon = app.icon;
                return (
                  <Card key={app.id} className="opacity-75 hover:opacity-100 transition-opacity">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{app.name}</CardTitle>
                          <Badge variant="outline" className="mt-1 border-blue-400 text-blue-700">
                            <Clock className="w-3 h-3 mr-1" />
                            Coming Soon
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">{app.description}</p>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-700">Planned Features:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {app.features.map((feature, idx) => (
                            <li key={idx}>• {feature}</li>
                          ))}
                        </ul>
                      </div>
                      <Button className="w-full" variant="outline">
                        <Bell className="w-4 h-4 mr-2" />
                        Notify Me When Available
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}