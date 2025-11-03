import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TaxSettings as TaxSettingsEntity } from "@/api/entities";
import { Calculator, Percent, Save, Settings } from "lucide-react";

export default function TaxSettings() {
  const [taxConfig, setTaxConfig] = useState({
    tier_1_name: "State Tax",
    tier_1_rate: 6.25,
    tier_1_active: true,
    tier_2_name: "City Tax", 
    tier_2_rate: 2.0,
    tier_2_active: true,
    tier_3_name: "Special Tax",
    tier_3_rate: 0.0,
    tier_3_active: false,
    fuel_tax_rate: 8.25,
    prepared_food_rate: 8.25,
    alcohol_tax_rate: 10.25,
    tobacco_tax_rate: 12.0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadTaxSettings();
  }, []);

  const loadTaxSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await TaxSettingsEntity.list();
      if (settings.length > 0) {
        setTaxConfig(settings[0]);
      }
    } catch (error) {
      console.error("Failed to load tax settings:", error);
    }
    setIsLoading(false);
  };

  const saveTaxSettings = async () => {
    setIsSaving(true);
    try {
      const settings = await TaxSettingsEntity.list();
      if (settings.length > 0) {
        await TaxSettingsEntity.update(settings[0].id, taxConfig);
      } else {
        await TaxSettingsEntity.create(taxConfig);
      }
      alert("Tax settings saved successfully!");
    } catch (error) {
      console.error("Failed to save tax settings:", error);
      alert("Failed to save tax settings");
    }
    setIsSaving(false);
  };

  const updateTaxConfig = (field, value) => {
    setTaxConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateCombinedRate = () => {
    let combined = 0;
    if (taxConfig.tier_1_active) combined += taxConfig.tier_1_rate;
    if (taxConfig.tier_2_active) combined += taxConfig.tier_2_rate;
    if (taxConfig.tier_3_active) combined += taxConfig.tier_3_rate;
    return combined;
  };

  if (isLoading) {
    return <div className="p-4">Loading tax settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tax Configuration</h2>
          <p className="text-gray-600">Configure multi-tier tax rates for your location</p>
        </div>
        <Button onClick={saveTaxSettings} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General Tax Tiers</TabsTrigger>
          <TabsTrigger value="category">Category-Specific Rates</TabsTrigger>
          <TabsTrigger value="preview">Preview & Test</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Tax Tier 1
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={taxConfig.tier_1_active}
                    onCheckedChange={(checked) => updateTaxConfig('tier_1_active', checked)}
                  />
                  <Label>Active</Label>
                </div>
                <div>
                  <Label htmlFor="tier1_name">Tax Name</Label>
                  <Input
                    id="tier1_name"
                    value={taxConfig.tier_1_name}
                    onChange={(e) => updateTaxConfig('tier_1_name', e.target.value)}
                    placeholder="e.g., State Tax"
                  />
                </div>
                <div>
                  <Label htmlFor="tier1_rate">Tax Rate (%)</Label>
                  <Input
                    id="tier1_rate"
                    type="number"
                    step="0.01"
                    value={taxConfig.tier_1_rate}
                    onChange={(e) => updateTaxConfig('tier_1_rate', parseFloat(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tier 2 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Tax Tier 2
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={taxConfig.tier_2_active}
                    onCheckedChange={(checked) => updateTaxConfig('tier_2_active', checked)}
                  />
                  <Label>Active</Label>
                </div>
                <div>
                  <Label htmlFor="tier2_name">Tax Name</Label>
                  <Input
                    id="tier2_name"
                    value={taxConfig.tier_2_name}
                    onChange={(e) => updateTaxConfig('tier_2_name', e.target.value)}
                    placeholder="e.g., City Tax"
                  />
                </div>
                <div>
                  <Label htmlFor="tier2_rate">Tax Rate (%)</Label>
                  <Input
                    id="tier2_rate"
                    type="number"
                    step="0.01"
                    value={taxConfig.tier_2_rate}
                    onChange={(e) => updateTaxConfig('tier_2_rate', parseFloat(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tier 3 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Tax Tier 3
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={taxConfig.tier_3_active}
                    onCheckedChange={(checked) => updateTaxConfig('tier_3_active', checked)}
                  />
                  <Label>Active</Label>
                </div>
                <div>
                  <Label htmlFor="tier3_name">Tax Name</Label>
                  <Input
                    id="tier3_name"
                    value={taxConfig.tier_3_name}
                    onChange={(e) => updateTaxConfig('tier_3_name', e.target.value)}
                    placeholder="e.g., Special District Tax"
                  />
                </div>
                <div>
                  <Label htmlFor="tier3_rate">Tax Rate (%)</Label>
                  <Input
                    id="tier3_rate"
                    type="number"
                    step="0.01"
                    value={taxConfig.tier_3_rate}
                    onChange={(e) => updateTaxConfig('tier_3_rate', parseFloat(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Combined Rate Display */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Combined Tax Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge className="text-lg px-4 py-2">
                  <Percent className="w-4 h-4 mr-2" />
                  {calculateCombinedRate().toFixed(2)}% Total
                </Badge>
                <div className="text-sm text-gray-600">
                  This is the combined rate for standard items
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fuel Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="fuel_tax">Fuel Tax Rate (%)</Label>
                  <Input
                    id="fuel_tax"
                    type="number"
                    step="0.01"
                    value={taxConfig.fuel_tax_rate}
                    onChange={(e) => updateTaxConfig('fuel_tax_rate', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-gray-500 mt-1">Applied to all fuel purchases</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prepared Foods</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="food_tax">Prepared Food Tax Rate (%)</Label>
                  <Input
                    id="food_tax"
                    type="number"
                    step="0.01"
                    value={taxConfig.prepared_food_rate}
                    onChange={(e) => updateTaxConfig('prepared_food_rate', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-gray-500 mt-1">Hot foods, sandwiches, etc.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alcoholic Beverages</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="alcohol_tax">Alcohol Tax Rate (%)</Label>
                  <Input
                    id="alcohol_tax"
                    type="number"
                    step="0.01"
                    value={taxConfig.alcohol_tax_rate}
                    onChange={(e) => updateTaxConfig('alcohol_tax_rate', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-gray-500 mt-1">Beer, wine, spirits</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tobacco Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="tobacco_tax">Tobacco Tax Rate (%)</Label>
                  <Input
                    id="tobacco_tax"
                    type="number"
                    step="0.01"
                    value={taxConfig.tobacco_tax_rate}
                    onChange={(e) => updateTaxConfig('tobacco_tax_rate', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-gray-500 mt-1">Cigarettes, cigars, vaping products</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Tax Rate Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Standard Items</h4>
                    <p className="text-2xl font-bold text-green-600">{calculateCombinedRate().toFixed(2)}%</p>
                    <p className="text-sm text-gray-500">Snacks, beverages, automotive</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Fuel Products</h4>
                    <p className="text-2xl font-bold text-blue-600">{taxConfig.fuel_tax_rate.toFixed(2)}%</p>
                    <p className="text-sm text-gray-500">Gasoline, diesel</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Alcoholic Beverages</h4>
                    <p className="text-2xl font-bold text-purple-600">{taxConfig.alcohol_tax_rate.toFixed(2)}%</p>
                    <p className="text-sm text-gray-500">Beer, wine, spirits</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Tobacco Products</h4>
                    <p className="text-2xl font-bold text-red-600">{taxConfig.tobacco_tax_rate.toFixed(2)}%</p>
                    <p className="text-sm text-gray-500">Cigarettes, vaping</p>
                  </div>
                </div>

                {/* Sample Calculation */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Sample Calculation</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>$10.00 Standard Item:</span>
                      <span>${(10 * (calculateCombinedRate() / 100)).toFixed(2)} tax</span>
                    </div>
                    <div className="flex justify-between">
                      <span>$3.299/gal Fuel (10 gal):</span>
                      <span>${(32.99 * (taxConfig.fuel_tax_rate / 100)).toFixed(2)} tax</span>
                    </div>
                    <div className="flex justify-between">
                      <span>$8.99 Beer:</span>
                      <span>${(8.99 * (taxConfig.alcohol_tax_rate / 100)).toFixed(2)} tax</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}