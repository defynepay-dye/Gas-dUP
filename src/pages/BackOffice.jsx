
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard, Fuel, Package, DollarSign, Archive, Clock, 
  Users, BarChart3, Monitor, Settings, Store, Gift, Ticket,
  FileText, Calendar, Shield, Wrench
} from 'lucide-react';

import DashboardTab from '../components/backoffice/tabs/DashboardTab';
import PumpManager from '../components/backoffice/tabs/PumpManager';
import ProductManager from '../components/backoffice/tabs/ProductManager';
import InventoryManager from '../components/backoffice/tabs/InventoryManager';
import ShiftManager from '../components/backoffice/tabs/ShiftManager';
import ReportsManager from '../components/backoffice/tabs/ReportsManager';
import PricingManager from '../components/backoffice/tabs/PricingManager';
import PromotionsManager from '../components/backoffice/tabs/PromotionsManager';
import LoyaltyManager from '../components/backoffice/tabs/LoyaltyManager';
import MediaManager from '../components/backoffice/tabs/MediaManager';
import UserManagement from '../components/backoffice/tabs/UserManagement';
import TimeAttendance from '../components/backoffice/tabs/TimeAttendance';
import AppStoreTab from '../components/backoffice/tabs/AppStoreTab';
import AdminTab from '../components/backoffice/tabs/AdminTab';
import TobaccoLoyaltyHub from '../components/backoffice/tabs/TobaccoLoyaltyHub';
import LotteryManager from '../components/backoffice/tabs/LotteryManager';
import MaintenanceTab from '../components/backoffice/tabs/MaintenanceTab';

export default function BackOfficePage({ currentScope, currentUser, locations, regions }) {
  const [activeTab, setActiveTab] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab') || 'dashboard';
  });

  const [activeSection, setActiveSection] = useState('dashboard');
  
  // NEW: State for active shifts data to pass to reports
  const [activeShiftsData, setActiveShiftsData] = useState([]);

  const sections = {
    dashboard: {
      label: 'Dashboard',
      icon: LayoutDashboard,
      tabs: [
        { value: 'dashboard', label: 'Overview', icon: LayoutDashboard }
      ]
    },
    operations: {
      label: 'Operations',
      icon: Store,
      tabs: [
        { value: 'pumps', label: 'Pumps', icon: Fuel },
        { value: 'products', label: 'Products', icon: Package },
        { value: 'pricing', label: 'Pricing', icon: DollarSign },
        { value: 'inventory', label: 'Inventory', icon: Archive }
      ]
    },
    promotions: {
      label: 'Promotions & Loyalty',
      icon: Gift,
      tabs: [
        { value: 'promotions', label: 'Promotions', icon: Gift },
        { value: 'loyalty', label: 'Loyalty', icon: Shield },
        { value: 'tobacco', label: 'Tobacco & CPG', icon: Package },
        { value: 'lottery', label: 'Lottery', icon: Ticket }
      ]
    },
    employees: {
      label: 'Employee Management',
      icon: Users,
      tabs: [
        { value: 'shifts', label: 'Shifts', icon: Clock },
        { value: 'time', label: 'Time & Attendance', icon: Calendar },
        { value: 'users', label: 'User Roles', icon: Users }
      ]
    },
    insights: {
      label: 'Insights & Media',
      icon: BarChart3,
      tabs: [
        { value: 'reports', label: 'Reports', icon: FileText },
        { value: 'media', label: 'Media Hub', icon: Monitor }
      ]
    },
    settings: {
      label: 'Settings & Tools',
      icon: Settings,
      tabs: [
        { value: 'settings', label: 'System Settings', icon: Settings },
        { value: 'maintenance', label: 'Maintenance', icon: Wrench },
        { value: 'appstore', label: 'App Store', icon: Store }
      ]
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    window.history.replaceState(null, '', `/BackOffice?tab=${value}`);
  };

  const handleSectionChange = (key) => {
    setActiveSection(key);
    const firstTab = sections[key].tabs[0].value;
    setActiveTab(firstTab);
    window.history.replaceState(null, '', `/BackOffice?tab=${firstTab}`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="bg-white border-b shadow-sm">
          <div className="px-6 py-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Back Office Management
            </h1>
            <p className="text-gray-600 mt-1">Complete control center for your fuel and convenience store operations</p>
          </div>

          <div className="px-6 pb-2">
            <div className="flex gap-2 overflow-x-auto">
              {Object.entries(sections).map(([key, section]) => {
                const Icon = section.icon;
                return (
                  <button
                    key={key}
                    onClick={() => handleSectionChange(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-all whitespace-nowrap ${
                      activeSection === key
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            {sections[activeSection].tabs.length > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-2">
                <TabsList className="w-full grid gap-2" style={{ gridTemplateColumns: `repeat(${sections[activeSection].tabs.length}, 1fr)` }}>
                  {sections[activeSection].tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger 
                        key={tab.value} 
                        value={tab.value}
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
            )}

            <TabsContent value="dashboard" className="bg-white rounded-lg shadow-sm p-6">
              <DashboardTab currentScope={currentScope} currentUser={currentUser} locations={locations} regions={regions} />
            </TabsContent>

            <TabsContent value="pumps" className="bg-white rounded-lg shadow-sm p-6">
              <PumpManager />
            </TabsContent>

            <TabsContent value="products" className="bg-white rounded-lg shadow-sm p-6">
              <ProductManager />
            </TabsContent>

            <TabsContent value="pricing" className="bg-white rounded-lg shadow-sm p-6">
              <PricingManager />
            </TabsContent>

            <TabsContent value="inventory" className="bg-white rounded-lg shadow-sm p-6">
              <InventoryManager />
            </TabsContent>

            <TabsContent value="promotions" className="bg-white rounded-lg shadow-sm p-6">
              <PromotionsManager />
            </TabsContent>

            <TabsContent value="loyalty" className="bg-white rounded-lg shadow-sm p-6">
              <LoyaltyManager />
            </TabsContent>

            <TabsContent value="tobacco" className="bg-white rounded-lg shadow-sm p-6">
              <TobaccoLoyaltyHub />
            </TabsContent>

            <TabsContent value="lottery" className="bg-white rounded-lg shadow-sm p-6">
              <LotteryManager />
            </TabsContent>

            <TabsContent value="shifts" className="bg-white rounded-lg shadow-sm p-6">
              <ShiftManager currentScope={currentScope} />
            </TabsContent>

            <TabsContent value="time" className="bg-white rounded-lg shadow-sm p-6">
              <TimeAttendance />
            </TabsContent>

            <TabsContent value="users" className="bg-white rounded-lg shadow-sm p-6">
              <UserManagement />
            </TabsContent>

            <TabsContent value="reports" className="bg-white rounded-lg shadow-sm p-6">
              <ReportsManager currentScope={currentScope} activeShiftsData={activeShiftsData} />
            </TabsContent>

            <TabsContent value="media" className="bg-white rounded-lg shadow-sm p-6">
              <MediaManager />
            </TabsContent>

            <TabsContent value="settings" className="bg-white rounded-lg shadow-sm p-6">
              <AdminTab />
            </TabsContent>

            <TabsContent value="maintenance" className="bg-white rounded-lg shadow-sm p-6">
              <MaintenanceTab />
            </TabsContent>

            <TabsContent value="appstore" className="bg-white rounded-lg shadow-sm p-6">
              <AppStoreTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
