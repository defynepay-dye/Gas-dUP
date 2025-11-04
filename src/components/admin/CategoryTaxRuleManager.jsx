import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CategoryTaxRule, Location } from "@/api/entities";
import { Plus, Trash2, MapPin, Loader2 } from "lucide-react";

const categories = [
  'tobacco', 'alcohol', 'beverages', 'snacks', 'automotive', 
  'personal_care', 'candy', 'food', 'lottery', 'other'
];

export default function CategoryTaxRuleManager({ currentScope }) {
  const [rules, setRules] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    category: 'tobacco',
    tax_rate_id: 'tier_1',
    tax_rate_name: 'State Tax',
    is_active: true
  });

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (currentScope?.id) {
      setSelectedLocationId(currentScope.id);
    }
  }, [currentScope]);

  useEffect(() => {
    if (selectedLocationId) {
      loadRules();
    }
  }, [selectedLocationId]);

  const loadLocations = async () => {
    try {
      const locs = await Location.list();
      setLocations(locs);
    } catch (error) {
      console.error("Failed to load locations:", error);
    }
  };

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const data = await CategoryTaxRule.filter({ location_id: selectedLocationId });
      setRules(data || []);
    } catch (error) {
      console.error("Failed to load category tax rules:", error);
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRule = async () => {
    if (!selectedLocationId) {
      alert("Please select a location first");
      return;
    }

    try {
      await CategoryTaxRule.create({
        ...formData,
        location_id: selectedLocationId
      });
      setShowAddDialog(false);
      setFormData({
        category: 'tobacco',
        tax_rate_id: 'tier_1',
        tax_rate_name: 'State Tax',
        is_active: true
      });
      loadRules();
    } catch (error) {
      console.error("Failed to save rule:", error);
      alert("Error saving rule. Please try again.");
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (confirm("Are you sure you want to delete this tax rule?")) {
      try {
        await CategoryTaxRule.delete(ruleId);
        loadRules();
      } catch (error) {
        console.error("Failed to delete rule:", error);
        alert("Error deleting rule.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3">Loading tax rules...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <MapPin className="w-4 h-4 text-blue-600" />
        <AlertDescription>
          <strong>Location-Specific Tax Rules:</strong> You are managing category-specific tax rules for{' '}
          <strong>{currentScope?.label || 'a specific location'}</strong>.
        </AlertDescription>
      </Alert>

      {(!currentScope || currentScope.type === 'enterprise') && locations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Location</CardTitle>
            <CardDescription>Choose which location's category tax rules to manage</CardDescription>
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

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Category-Specific Tax Rules</CardTitle>
              <CardDescription>Override default tax rates for specific product categories</CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Category Tax Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat} className="capitalize">
                            {cat.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tax Tier to Apply</Label>
                    <Select value={formData.tax_rate_id} onValueChange={(value) => {
                      const tierMap = { 'tier_1': 'Tier 1', 'tier_2': 'Tier 2', 'tier_3': 'Tier 3' };
                      setFormData({...formData, tax_rate_id: value, tax_rate_name: tierMap[value]});
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tier_1">Tier 1</SelectItem>
                        <SelectItem value="tier_2">Tier 2</SelectItem>
                        <SelectItem value="tier_3">Tier 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveRule}>Save Rule</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No category tax rules configured for this location.</p>
              <p className="text-sm">Using default tax rates from Tax Settings.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium capitalize">{rule.category.replace('_', ' ')}</span>
                    <Badge variant="outline" className="ml-2">{rule.tax_rate_name}</Badge>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}