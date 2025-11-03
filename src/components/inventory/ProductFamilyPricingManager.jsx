import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Package, Plus, Edit, Trash2, Save, X, 
  DollarSign, Loader2, Users, AlertTriangle 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ProductFamilyPricingManager({ locationId }) {
  const [families, setFamilies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingFamily, setEditingFamily] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadFamilies();
  }, []);

  const loadFamilies = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.ProductFamily.list('family_name');
      
      // For each family, count linked products
      const familiesWithCounts = await Promise.all(data.map(async (family) => {
        try {
          const linkedProducts = await base44.entities.InventoryItem.filter({ 
            product_family_id: family.id,
            ...(locationId && { location_id: locationId })
          });
          return { ...family, linkedProductCount: linkedProducts.length };
        } catch (error) {
          return { ...family, linkedProductCount: 0 };
        }
      }));

      setFamilies(familiesWithCounts);
    } catch (error) {
      console.error('Failed to load families:', error);
      setFamilies([]);
    }
    setIsLoading(false);
  };

  const handleSaveFamily = async (familyData) => {
    setIsUpdating(true);
    try {
      if (editingFamily?.id) {
        // Update existing family
        await base44.entities.ProductFamily.update(editingFamily.id, familyData);
        
        // Update all linked products' selling_configurations
        if (confirm(`Update pricing for all ${editingFamily.linkedProductCount} linked products?`)) {
          await updateLinkedProducts(editingFamily.id, familyData.default_selling_configurations);
        }
      } else {
        // Create new family
        await base44.entities.ProductFamily.create(familyData);
      }
      
      setEditingFamily(null);
      setShowAddModal(false);
      loadFamilies();
    } catch (error) {
      console.error('Failed to save family:', error);
      alert('Failed to save product family');
    }
    setIsUpdating(false);
  };

  const updateLinkedProducts = async (familyId, newConfigurations) => {
    try {
      const linkedProducts = await base44.entities.InventoryItem.filter({ 
        product_family_id: familyId,
        ...(locationId && { location_id: locationId })
      });

      const updatePromises = linkedProducts.map(product =>
        base44.entities.InventoryItem.update(product.id, {
          selling_configurations: newConfigurations
        })
      );

      await Promise.all(updatePromises);
      alert(`Successfully updated ${linkedProducts.length} products`);
    } catch (error) {
      console.error('Failed to update linked products:', error);
      alert('Failed to update all linked products');
    }
  };

  const handleDeleteFamily = async (familyId) => {
    const family = families.find(f => f.id === familyId);
    
    if (family.linkedProductCount > 0) {
      if (!confirm(`This family has ${family.linkedProductCount} linked products. Are you sure you want to delete it? Products will keep their current pricing but lose family link.`)) {
        return;
      }
    }

    try {
      await base44.entities.ProductFamily.delete(familyId);
      loadFamilies();
    } catch (error) {
      console.error('Failed to delete family:', error);
      alert('Failed to delete family');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Product Family Pricing</h2>
          <p className="text-gray-600 mt-1">Manage pricing groups where one UPC has multiple pack sizes</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Family
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : families.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">No product families configured yet</p>
            <Button className="mt-4" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Family
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {families.map(family => (
            <Card key={family.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{family.family_name}</span>
                  <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    {family.linkedProductCount}
                  </Badge>
                </CardTitle>
                <CardDescription>{family.family_code}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Pack Sizes:</p>
                  {family.default_selling_configurations && family.default_selling_configurations.length > 0 ? (
                    <div className="space-y-1">
                      {family.default_selling_configurations.map((config, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <span>{config.config_name} ({config.unit_multiplier}x)</span>
                          <span className="font-semibold text-green-600">${config.display_price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No configurations</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setEditingFamily(family)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeleteFamily(family.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(showAddModal || editingFamily) && (
        <ProductFamilyEditor
          family={editingFamily}
          onSave={handleSaveFamily}
          onClose={() => {
            setShowAddModal(false);
            setEditingFamily(null);
          }}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
}

function ProductFamilyEditor({ family, onSave, onClose, isUpdating }) {
  const [formData, setFormData] = useState({
    family_name: family?.family_name || '',
    family_code: family?.family_code || '',
    category: family?.category || 'beverages',
    brand: family?.brand || '',
    default_selling_configurations: family?.default_selling_configurations || [
      { config_name: 'Single', unit_multiplier: 1, display_price: 0, sales_unit_of_measure: 'each' }
    ]
  });

  const addConfiguration = () => {
    setFormData(prev => ({
      ...prev,
      default_selling_configurations: [
        ...prev.default_selling_configurations,
        { config_name: '', unit_multiplier: 1, display_price: 0, sales_unit_of_measure: 'each' }
      ]
    }));
  };

  const updateConfiguration = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      default_selling_configurations: prev.default_selling_configurations.map((config, idx) =>
        idx === index ? { ...config, [field]: field.includes('price') || field === 'unit_multiplier' ? parseFloat(value) || 0 : value } : config
      )
    }));
  };

  const removeConfiguration = (index) => {
    setFormData(prev => ({
      ...prev,
      default_selling_configurations: prev.default_selling_configurations.filter((_, idx) => idx !== index)
    }));
  };

  const handleSubmit = () => {
    if (!formData.family_name || !formData.family_code) {
      alert('Please fill in family name and code');
      return;
    }

    if (formData.default_selling_configurations.length === 0) {
      alert('Please add at least one selling configuration');
      return;
    }

    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {family ? 'Edit Product Family' : 'New Product Family'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="family_name">Family Name *</Label>
              <Input
                id="family_name"
                value={formData.family_name}
                onChange={(e) => setFormData({ ...formData, family_name: e.target.value })}
                placeholder="e.g., Monster Energy 16oz"
              />
            </div>
            <div>
              <Label htmlFor="family_code">Family Code *</Label>
              <Input
                id="family_code"
                value={formData.family_code}
                onChange={(e) => setFormData({ ...formData, family_code: e.target.value })}
                placeholder="e.g., MONSTER16"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g., Monster"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="w-full p-2 border rounded"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="beverages">Beverages</option>
                <option value="snacks">Snacks</option>
                <option value="candy">Candy</option>
                <option value="tobacco">Tobacco</option>
                <option value="food">Food</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">Selling Configurations *</Label>
              <Button size="sm" onClick={addConfiguration}>
                <Plus className="w-3 h-3 mr-1" />
                Add Size
              </Button>
            </div>

            <div className="space-y-2">
              {formData.default_selling_configurations.map((config, index) => (
                <div key={index} className="flex gap-2 items-end p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={config.config_name}
                      onChange={(e) => updateConfiguration(index, 'config_name', e.target.value)}
                      placeholder="Single, 6-Pack, Case"
                      className="h-9"
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Units</Label>
                    <Input
                      type="number"
                      value={config.unit_multiplier}
                      onChange={(e) => updateConfiguration(index, 'unit_multiplier', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={config.display_price}
                      onChange={(e) => updateConfiguration(index, 'display_price', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Unit</Label>
                    <Input
                      value={config.sales_unit_of_measure}
                      onChange={(e) => updateConfiguration(index, 'sales_unit_of_measure', e.target.value)}
                      placeholder="can, pack"
                      className="h-9"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeConfiguration(index)}
                    disabled={formData.default_selling_configurations.length === 1}
                    className="h-9"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {family && family.linkedProductCount > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-900">
                    This family has {family.linkedProductCount} linked products
                  </p>
                  <p className="text-yellow-700 mt-1">
                    When you save, you'll be prompted to update all linked products with these new configurations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Family</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}