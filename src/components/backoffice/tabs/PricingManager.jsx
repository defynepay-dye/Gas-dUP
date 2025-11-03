import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PricingSettings, Location } from "@/api/entities";
import { DollarSign, Percent, Save, Loader2, MapPin, AlertTriangle } from "lucide-react";

export default function PricingManager({ currentScope }) {
  const [settings, setSettings] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    // Initialize selectedLocationId based on currentScope
    if (currentScope?.type === 'location' && currentScope?.id) {
      setSelectedLocationId(currentScope.id);
    } else if (locations.length > 0 && !selectedLocationId) {
      // Fallback: select first location if no specific scope
      setSelectedLocationId(locations[0].id);
    }
  }, [currentScope, locations]);

  useEffect(() => {
    if (selectedLocationId) {
      loadSettings();
    }
  }, [selectedLocationId]);

  const loadLocations = async () => {
    try {
      const locs = await Location.list();
      setLocations(locs || []);
      
      // If no locations exist, create a default one
      if (!locs || locs.length === 0) {
        setError('No locations found. Please create a location first.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to load locations:", error);
      setError('Failed to load locations. Please refresh the page.');
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    if (!selectedLocationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await PricingSettings.filter({ location_id: selectedLocationId });
      
      if (data && data.length > 0) {
        setSettings(data[0]);
      } else {
        // No settings for this location - create defaults
        setSettings({
          location_id: selectedLocationId,
          dual_pricing_enabled: true,
          credit_markup_cents_fuel: 10,
          credit_markup_percent_dry_stock: 3.5,
        });
      }
    } catch (error) {
      console.error("Failed to load pricing settings:", error);
      setError('Failed to load pricing settings. Using defaults.');
      // Still set defaults even on error
      setSettings({
        location_id: selectedLocationId,
        dual_pricing_enabled: true,
        credit_markup_cents_fuel: 10,
        credit_markup_percent_dry_stock: 3.5,
      });
    } finally {
      // Always set isLoading to false
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings || !selectedLocationId) {
      alert('Please select a location first.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      const saveData = {
        location_id: selectedLocationId,
        dual_pricing_enabled: settings.dual_pricing_enabled,
        credit_markup_cents_fuel: Number(settings.credit_markup_cents_fuel),
        credit_markup_percent_dry_stock: Number(settings.credit_markup_percent_dry_stock),
      };

      if (settings.id) {
        await PricingSettings.update(settings.id, saveData);
      } else {
        const created = await PricingSettings.create(saveData);
        setSettings({ ...settings, id: created.id });
      }
      
      alert("Pricing settings saved successfully!");
    } catch (error) {
      console.error("Failed to save pricing settings:", error);
      setError('Failed to save pricing settings. Please try again.');
      alert("Error saving settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Show error state
  if (error && !settings) {
    return (
      <div className="space-y-4">
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
        <Button onClick={loadLocations}>Retry</Button>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3">Loading pricing settings...</span>
      </div>
    );
  }

  // Show "no locations" state
  if (locations.length === 0) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="w-4 h-4 text-yellow-600" />
        <AlertDescription>
          <strong>No Locations Found:</strong> Please create at least one location before configuring pricing settings.
        </AlertDescription>
      </Alert>
    );
  }

  // Show "no location selected" state
  if (!selectedLocationId) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="w-4 h-4 text-yellow-600" />
        <AlertDescription>
          <strong>No Location Selected:</strong> Please select a location to configure pricing settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Location Context Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <MapPin className="w-4 h-4 text-blue-600" />
        <AlertDescription>
          <strong>Location-Specific Settings:</strong> You are configuring pricing for{' '}
          <strong>{locations.find(l => l.id === selectedLocationId)?.location_name || 'a specific location'}</strong>. 
          These settings will only apply to this location.
        </AlertDescription>
      </Alert>

      {/* Error Alert (if any during save) */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Location Selector (if managing multiple locations) */}
      {(!currentScope || currentScope.type === 'enterprise') && locations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Location</CardTitle>
            <CardDescription>Choose which location's pricing settings to configure</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.location_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {settings && (
        <Card>
          <CardHeader>
            <CardTitle>Dual Pricing Configuration</CardTitle>
            <CardDescription>
              Manage the cash discount program settings. Prices entered for products should be the base cash price. 
              The system will add these markups to calculate the credit price.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Label htmlFor="dual-pricing-enabled" className="text-lg font-medium">
                Enable Cash Discount Program
              </Label>
              <Switch
                id="dual-pricing-enabled"
                checked={settings.dual_pricing_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, dual_pricing_enabled: checked })}
              />
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!settings.dual_pricing_enabled ? 'opacity-50' : ''}`}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fuel Markup</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="fuel-markup">Credit Price Markup (Cents per Gallon)</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="fuel-markup"
                      type="number"
                      step="0.01"
                      value={settings.credit_markup_cents_fuel}
                      onChange={(e) => setSettings({ ...settings, credit_markup_cents_fuel: e.target.value })}
                      placeholder="e.g., 10"
                      className="pl-10"
                      disabled={!settings.dual_pricing_enabled}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">This is a fixed cent amount added to the cash price of fuel to determine the credit price.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">In-Store Markup</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="dry-stock-markup">Credit Price Markup (Percentage)</Label>
                  <div className="relative mt-1">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="dry-stock-markup"
                      type="number"
                      step="0.1"
                      value={settings.credit_markup_percent_dry_stock}
                      onChange={(e) => setSettings({ ...settings, credit_markup_percent_dry_stock: e.target.value })}
                      placeholder="e.g., 3.5"
                      className="pl-10"
                      disabled={!settings.dual_pricing_enabled}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">A percentage added to the cash price of all non-fuel items to determine the credit price.</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={loadSettings}>
                Reset
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}