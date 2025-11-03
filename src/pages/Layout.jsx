

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Location, Region } from '@/api/entities';
import { 
  LayoutDashboard, ShoppingCart, MapPin, Building2, Globe, Shield,
  ChevronDown, Loader2, Smartphone
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [locations, setLocations] = useState([]);
  const [regions, setRegions] = useState([]);
  const [currentScope, setCurrentScope] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  useEffect(() => {
    loadUser();
    loadLocationsAndRegions();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setCurrentUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const loadLocationsAndRegions = async () => {
    setIsLoadingLocations(true);
    try {
      const [locationsData, regionsData] = await Promise.all([
        Location.list().catch(() => []),
        Region.list().catch(() => [])
      ]);
      
      setLocations(locationsData);
      setRegions(regionsData);
      
      sessionStorage.setItem('app_locations', JSON.stringify(locationsData));
      sessionStorage.setItem('app_regions', JSON.stringify(regionsData));
      
      if (locationsData.length > 0 || regionsData.length > 0) {
        initializeScope(locationsData, regionsData);
      }
    } catch (error) {
      console.error('Failed to load locations/regions:', error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const initializeScope = (locs, regs) => {
    if (!currentUser) {
      setTimeout(() => initializeScope(locs, regs), 100);
      return;
    }

    if (['admin', 'corporate_manager'].includes(currentUser.role)) {
      setCurrentScope({
        type: 'enterprise',
        id: 'all',
        label: 'All Locations (Enterprise)'
      });
    }
    else if (currentUser.role === 'regional_manager' && regs.length > 0) {
      const userRegion = regs.find(r => r.regional_manager_id === currentUser.id) || regs[0];
      setCurrentScope({
        type: 'region',
        id: userRegion.id,
        label: userRegion.region_name
      });
    }
    else if (currentUser.assigned_location_id && locs.length > 0) {
      const userLocation = locs.find(l => l.id === currentUser.assigned_location_id) || locs[0];
      setCurrentScope({
        type: 'location',
        id: userLocation.id,
        label: userLocation.location_name
      });
    }
    else if (locs.length > 0) {
      setCurrentScope({
        type: 'location',
        id: locs[0].id,
        label: locs[0].location_name
      });
    }
  };

  const handleScopeChange = (value) => {
    if (value === 'enterprise') {
      setCurrentScope({
        type: 'enterprise',
        id: 'all',
        label: 'All Locations (Enterprise)'
      });
    } else if (value.startsWith('region_')) {
      const regionId = value.replace('region_', '');
      const region = regions.find(r => r.id === regionId);
      if (region) {
        setCurrentScope({
          type: 'region',
          id: region.id,
          label: region.region_name
        });
      }
    } else if (value.startsWith('location_')) {
      const locationId = value.replace('location_', '');
      const loc = locations.find(l => l.id === locationId);
      if (loc) {
        setCurrentScope({
          type: 'location',
          id: loc.id,
          label: loc.location_name
        });
      }
    }
  };

  const getScopeValue = () => {
    if (!currentScope) return '';
    if (currentScope.type === 'enterprise') return 'enterprise';
    if (currentScope.type === 'region') return `region_${currentScope.id}`;
    if (currentScope.type === 'location') return `location_${currentScope.id}`;
    return '';
  };

  const canAccessMultipleLocations = currentUser && ['admin', 'corporate_manager', 'regional_manager'].includes(currentUser.role);

  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { 
        currentScope,
        currentUser,
        locations,
        regions
      });
    }
    return child;
  });

  if (isLoadingUser || isLoadingLocations) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-gray-900">
                FuelFlow Pro
              </h1>
              
              <nav className="hidden md:flex space-x-4">
                <Link
                  to={createPageUrl('PointOfSale')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPageName === 'PointOfSale'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Point of Sale
                  </div>
                </Link>
                <Link
                  to={createPageUrl('BackOffice')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPageName === 'BackOffice'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Back Office
                  </div>
                </Link>
                
                {/* VMP Access - Admin Only */}
                {currentUser && currentUser.role === 'admin' && (
                  <Link
                    to={createPageUrl('VendorManagementPortal')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentPageName === 'VendorManagementPortal'
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                        : 'text-purple-700 hover:bg-purple-50 border-2 border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span className="font-semibold">VMP</span>
                    </div>
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {canAccessMultipleLocations && (
                <Select value={getScopeValue()} onValueChange={handleScopeChange}>
                  <SelectTrigger className="w-64">
                    <div className="flex items-center gap-2">
                      {currentScope?.type === 'enterprise' && <Globe className="w-4 h-4" />}
                      {currentScope?.type === 'region' && <Building2 className="w-4 h-4" />}
                      {currentScope?.type === 'location' && <MapPin className="w-4 h-4" />}
                      <SelectValue>{currentScope?.label || 'Select Scope'}</SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {['admin', 'corporate_manager'].includes(currentUser?.role) && (
                      <SelectItem value="enterprise">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          All Locations (Enterprise)
                        </div>
                      </SelectItem>
                    )}
                    {regions.map(region => (
                      <SelectItem key={region.id} value={`region_${region.id}`}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {region.region_name}
                        </div>
                      </SelectItem>
                    ))}
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={`location_${loc.id}`}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {loc.location_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Android APK Setup Menu */}
              {currentUser && ['admin', 'corporate_manager'].includes(currentUser.role) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Smartphone className="w-4 h-4" />
                      <span className="hidden sm:inline">Android Setup</span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Mobile Deployment</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('CapacitorSetup')} className="cursor-pointer">
                        <Smartphone className="w-4 h-4 mr-2" />
                        Capacitor Setup Guide
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled className="text-xs text-gray-500">
                      Version: FuelFlow Pro v1.6
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {currentUser && (
                <div className="text-sm text-gray-600">
                  {currentUser.full_name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {childrenWithProps}
      </div>
    </div>
  );
}

