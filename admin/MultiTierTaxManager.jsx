import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TaxSettings, Location } from "@/api/entities";
import { Save, Loader2, MapPin, DollarSign, AlertTriangle } from "lucide-react";

export default function MultiTierTaxManager({ currentScope }) {
  const [settings, setSettings] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    initializeComponent();
  }, []);

  useEffect(() => {
    if (currentScope?.id && currentScope.type === 'location') {
      setSelectedLocationId(currentScope.id);
    }
  }, [currentScope]);

  useEffect(() => {
    if (selectedLocationId) {
      loadSettings();
    }
  }, [selectedLocationId]);

  const initializeComponent = async () => {
    try {
      const locs = await Location.list();
      setLocations(locs);
      
      // Determine initial location
      if (currentScope?.id && currentScope.type === 'location') {
        setSelectedLocationId(currentScope.id);
      } else if (locs.length > 0) {
        setSelectedLocationId(locs[0].id);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to load locations:", error);
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    if (!selectedLocationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await TaxSettings.filter({ location_id: selectedLocationId });
      if (data.length > 0) {
        setSettings(data[0]);
      } else {
        // Create default settings for this location
        setSettings({
          location_id: selectedLocationId,
          tier_1_name: "State Tax",
          tier_1_rate: 6.25,
          tier_1_active: true,
          tier_2_name: "City Tax",
          tier_2_rate: 2,
          tier_2_active: true,
          tier_3_name: "Special Tax",
          tier_3_rate: 0,
          tier_3_active: false,
          fuel_tax_rate: 8.25,
          prepared_food_rate: 8.25,
          alcohol_tax_rate: 10.25,
          tobacco_tax_rate: 12
        });
      }
    } catch (error) {
      console.error("Failed to load tax settings:", error);
      // Provide default settings on error
      setSettings({
        location_id: selectedLocationId,
        tier_1_name: "State Tax",
        tier_1_rate: 6.25,
        tier_1_active: true,
        tier_2_name: "City Tax",
        tier_2_rate: 2,
        tier_2_active: true,
        tier_3_name: "Special Tax",
        tier_3_rate: 0,
        tier_3_active: false,
        fuel_tax_rate: 8.25,
        prepared_food_rate: 8.25,
        alcohol_tax_rate: 10.25,
        tobacco_tax_rate: 12
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings || !selectedLocationId) {
      alert("Please select a location first.");
      return;
    }

    setIsSaving(true);
    try {
      const saveData = {
        location_id: selectedLocationId,
        tier_1_name: settings.tier_1_name,
        tier_1_rate: Number(settings.tier_1_rate),
        tier_1_active: settings.tier_1_active,
        tier_2_name: settings.tier_2_name,
        tier_2_rate: Number(settings.tier_2_rate),
        tier_2_active: settings.tier_2_active,
        tier_3_name: settings.tier_3_name,
        tier_3_rate: Number(settings.tier_3_rate),
        tier_3_active: settings.tier_3_active,
        fuel_tax_rate: Number(settings.fuel_tax_rate),
        prepared_food_rate: Number(settings.prepared_food_rate),
        alcohol_tax_rate: Number(settings.alcohol_tax_rate),
        tobacco_tax_rate: Number(settings.tobacco_tax_rate)
      };

      if (settings.id) {
        await TaxSettings.update(settings.id, saveData);
      } else {
        const created = await TaxSettings.create(saveData);
        setSettings({ ...settings, id: created.id });
      }

      alert("Tax settings saved successfully!");
    } catch (error) {
      console.error("Failed to save tax settings:", error);
      alert("Error saving tax settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3">Loading tax settings...</span>
      </div>
    );
  }

  if (!selectedLocationId || locations.length === 0) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="w-4 h-4 text-yellow-600" />
        <AlertDescription>
          <strong>No Locations Found:</strong> Please create at least one location before configuring tax settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <MapPin className="w-4 h-4 text-blue-600" />
        <AlertDescription>
          <strong>Location-Specific Tax Settings:</strong> You are configuring taxes for{' '}
          <strong>{currentScope?.label || locations.find(l => l.id === selectedLocationId)?.location_name || 'this location'}</strong>. 
          These rates apply only to this location and must comply with local, county, and state tax laws.
        </AlertDescription>
      </Alert>

      {(!currentScope || currentScope.type === 'enterprise') && locations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Location</CardTitle>
            <CardDescription>Choose which location's tax settings to configure</CardDescription>
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
        <>
          <Card>
            <CardHeader>
              <CardTitle>Multi-Tier Tax Configuration</CardTitle>
              <CardDescription>
                Configure up to 3 tax tiers for complex jurisdictions (state, county, city, special districts).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tier 1 */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Tier 1 (Primary Tax)</h3>
                  <Switch
                    checked={settings.tier_1_active}
                    onCheckedChange={(checked) => setSettings({ ...settings, tier_1_active: checked })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tier1_name">Tax Name</Label>
                    <Input
                      id="tier1_name"
                      value={settings.tier_1_name}
                      onChange={(e) => setSettings({ ...settings, tier_1_name: e.target.value })}
                      placeholder="e.g., State Tax"
                      disabled={!settings.tier_1_active}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tier1_rate">Tax Rate (%)</Label>
                    <Input
                      id="tier1_rate"
                      type="number"
                      step="0.01"
                      value={settings.tier_1_rate}
                      onChange={(e) => setSettings({ ...settings, tier_1_rate: e.target.value })}
                      placeholder="6.25"
                      disabled={!settings.tier_1_active}
                    />
                  </div>
                </div>
              </div>

              {/* Tier 2 */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Tier 2 (Secondary Tax)</h3>
                  <Switch
                    checked={settings.tier_2_active}
                    onCheckedChange={(checked) => setSettings({ ...settings, tier_2_active: checked })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tier2_name">Tax Name</Label>
                    <Input
                      id="tier2_name"
                      value={settings.tier_2_name}
                      onChange={(e) => setSettings({ ...settings, tier_2_name: e.target.value })}
                      placeholder="e.g., City Tax"
                      disabled={!settings.tier_2_active}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tier2_rate">Tax Rate (%)</Label>
                    <Input
                      id="tier2_rate"
                      type="number"
                      step="0.01"
                      value={settings.tier_2_rate}
                      onChange={(e) => setSettings({ ...settings, tier_2_rate: e.target.value })}
                      placeholder="2.00"
                      disabled={!settings.tier_2_active}
                    />
                  </div>
                </div>
              </div>

              {/* Tier 3 */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Tier 3 (Additional Tax)</h3>
                  <Switch
                    checked={settings.tier_3_active}
                    onCheckedChange={(checked) => setSettings({ ...settings, tier_3_active: checked })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tier3_name">Tax Name</Label>
                    <Input
                      id="tier3_name"
                      value={settings.tier_3_name}
                      onChange={(e) => setSettings({ ...settings, tier_3_name: e.target.value })}
                      placeholder="e.g., Special District"
                      disabled={!settings.tier_3_active}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tier3_rate">Tax Rate (%)</Label>
                    <Input
                      id="tier3_rate"
                      type="number"
                      step="0.01"
                      value={settings.tier_3_rate}
                      onChange={(e) => setSettings({ ...settings, tier_3_rate: e.target.value })}
                      placeholder="0.00"
                      disabled={!settings.tier_3_active}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category-Specific Tax Rates</CardTitle>
              <CardDescription>Set special tax rates for specific product categories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fuel_tax">Fuel Products (%)</Label>
                  <Input
                    id="fuel_tax"
                    type="number"
                    step="0.01"
                    value={settings.fuel_tax_rate}
                    onChange={(e) => setSettings({ ...settings, fuel_tax_rate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="prepared_food_tax">Prepared Food (%)</Label>
                  <Input
                    id="prepared_food_tax"
                    type="number"
                    step="0.01"
                    value={settings.prepared_food_rate}
                    onChange={(e) => setSettings({ ...settings, prepared_food_rate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="alcohol_tax">Alcohol (%)</Label>
                  <Input
                    id="alcohol_tax"
                    type="number"
                    step="0.01"
                    value={settings.alcohol_tax_rate}
                    onChange={(e) => setSettings({ ...settings, alcohol_tax_rate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tobacco_tax">Tobacco (%)</Label>
                  <Input
                    id="tobacco_tax"
                    type="number"
                    step="0.01"
                    value={settings.tobacco_tax_rate}
                    onChange={(e) => setSettings({ ...settings, tobacco_tax_rate: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Tax Settings
            </Button>
          </div>
        </>
      )}
    </div>
  );
}