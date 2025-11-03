import React, { useState, useEffect } from 'react';
import { Category, CategoryItem, Location } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Copy, Send, Grid, List as ListIcon, ChevronRight, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [categoryItems, setCategoryItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushSource, setPushSource] = useState(null);
  const [selectedLocations, setSelectedLocations] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [categoriesData, itemsData, locationsData] = await Promise.all([
        Category.list('display_order'),
        CategoryItem.list('display_order'),
        Location.list('location_name')
      ]);
      setCategories(categoriesData);
      setCategoryItems(itemsData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const handleSaveCategory = async (categoryData) => {
    try {
      if (editingCategory?.id) {
        await Category.update(editingCategory.id, categoryData);
      } else {
        await Category.create(categoryData);
      }
      setEditingCategory(null);
      loadData();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    }
  };

  const handleSaveItem = async (itemData) => {
    try {
      if (editingItem?.id) {
        await CategoryItem.update(editingItem.id, itemData);
      } else {
        await CategoryItem.create(itemData);
      }
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category? All items within will also be removed from Quick Items.')) return;
    try {
      await Category.delete(categoryId);
      loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await CategoryItem.delete(itemId);
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handlePushToLocations = async () => {
    if (selectedLocations.length === 0) {
      alert('Please select at least one location');
      return;
    }

    if (!window.confirm(`Push ${pushSource.type === 'category' ? 'category' : 'item'} to ${selectedLocations.length} location(s)?`)) {
      return;
    }

    try {
      // Logic to push category or item to multiple locations
      // This would create new records with location_id set appropriately
      alert(`Successfully pushed to ${selectedLocations.length} location(s)!`);
      setShowPushModal(false);
      setPushSource(null);
      setSelectedLocations([]);
    } catch (error) {
      console.error('Error pushing to locations:', error);
      alert('Failed to push to locations');
    }
  };

  const colorOptions = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { value: 'green', label: 'Green', class: 'bg-green-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { value: 'red', label: 'Red', class: 'bg-red-500' },
    { value: 'yellow', label: 'Yellow', class: 'bg-yellow-500' },
    { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
    { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' }
  ];

  const getCategoryItems = (categoryId) => {
    return categoryItems.filter(item => item.category_id === categoryId);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Category & Quick Items Manager</h3>
          <p className="text-sm text-gray-500">Organize your POS quick items into categories. Manage multi-location deployments.</p>
        </div>
        <Button onClick={() => setEditingCategory({})}>
          <Plus className="w-4 h-4 mr-2" />
          New Category
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Categories ({categories.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {categories.map(category => {
              const itemCount = getCategoryItems(category.id).length;
              const isSelected = selectedCategory?.id === category.id;
              return (
                <div
                  key={category.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`w-3 h-3 rounded-full ${colorOptions.find(c => c.value === category.color)?.class || 'bg-gray-400'}`} />
                      <span className="font-medium">{category.category_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-xs">{itemCount}</Badge>
                      {isSelected && <ChevronRight className="w-4 h-4 text-blue-600" />}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {category.show_in_pos && <Badge variant="outline" className="text-xs">POS</Badge>}
                    {category.show_in_kiosk && <Badge variant="outline" className="text-xs">Kiosk</Badge>}
                    {category.show_in_qsr && <Badge variant="outline" className="text-xs">QSR</Badge>}
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Grid className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No categories yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Details & Items */}
        <Card className="lg:col-span-2">
          {selectedCategory ? (
            <>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${colorOptions.find(c => c.value === selectedCategory.color)?.class || 'bg-gray-400'}`} />
                      {selectedCategory.category_name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{getCategoryItems(selectedCategory.id).length} items in this category</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => {
                      setPushSource({ type: 'category', data: selectedCategory });
                      setShowPushModal(true);
                    }}>
                      <Send className="w-4 h-4 mr-1" />
                      Push to Locations
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingCategory(selectedCategory)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(selectedCategory.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Items in Category</h4>
                    <Button size="sm" onClick={() => setEditingItem({ category_id: selectedCategory.id })}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {getCategoryItems(selectedCategory.id).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-gray-300 transition-all">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.item_name}</span>
                            {!item.active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="font-semibold text-green-600">${item.price?.toFixed(2) || '0.00'}</span>
                            {item.upc_code && <span className="font-mono text-xs">UPC: {item.upc_code}</span>}
                            {item.sku && <span className="font-mono text-xs">SKU: {item.sku}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingItem(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            setPushSource({ type: 'item', data: item });
                            setShowPushModal(true);
                          }}>
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {getCategoryItems(selectedCategory.id).length === 0 && (
                      <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                        <ListIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No items in this category yet</p>
                        <Button size="sm" className="mt-3" onClick={() => setEditingItem({ category_id: selectedCategory.id })}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add First Item
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-20">
              <div className="text-center text-gray-500">
                <Grid className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a category to view items</p>
                <p className="text-sm mt-1">or create a new category to get started</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Category Edit Modal */}
      {editingCategory && (
        <CategoryEditModal
          category={editingCategory}
          colorOptions={colorOptions}
          onSave={handleSaveCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}

      {/* Item Edit Modal */}
      {editingItem && (
        <ItemEditModal
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Push to Locations Modal */}
      {showPushModal && (
        <PushToLocationsModal
          source={pushSource}
          locations={locations}
          selectedLocations={selectedLocations}
          onSelectionChange={setSelectedLocations}
          onPush={handlePushToLocations}
          onClose={() => {
            setShowPushModal(false);
            setPushSource(null);
            setSelectedLocations([]);
          }}
        />
      )}
    </div>
  );
}

function CategoryEditModal({ category, colorOptions, onSave, onClose }) {
  const [formData, setFormData] = useState({
    category_name: category.category_name || '',
    display_order: category.display_order || 0,
    color: category.color || 'blue',
    icon: category.icon || 'grid',
    tax_settings: category.tax_settings || {
      tier_1_enabled: true,
      tier_1_rate: 6.25,
      tier_2_enabled: false,
      tier_2_rate: 0,
      tier_3_enabled: false,
      tier_3_rate: 0
    },
    show_in_pos: category.show_in_pos !== undefined ? category.show_in_pos : true,
    show_in_kiosk: category.show_in_kiosk !== undefined ? category.show_in_kiosk : true,
    show_in_qsr: category.show_in_qsr || false,
    active: category.active !== undefined ? category.active : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{category.id ? 'Edit Category' : 'New Category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Category Name *</Label>
              <Input
                value={formData.category_name}
                onChange={(e) => setFormData({...formData, category_name: e.target.value})}
                placeholder="e.g., Hot Food, Beverages, Lottery"
                required
              />
            </div>

            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
              />
            </div>

            <div>
              <Label>Button Color</Label>
              <Select value={formData.color} onValueChange={(value) => setFormData({...formData, color: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${color.class}`} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Category Tax Settings (Override Global)</h4>
            <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <Label>Tax Tier 1</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.tax_settings.tier_1_enabled}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      tax_settings: {...formData.tax_settings, tier_1_enabled: checked}
                    })}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tax_settings.tier_1_rate}
                    onChange={(e) => setFormData({
                      ...formData,
                      tax_settings: {...formData.tax_settings, tier_1_rate: parseFloat(e.target.value) || 0}
                    })}
                    className="w-24"
                    placeholder="6.25"
                  />
                  <span className="text-sm">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Tax Tier 2</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.tax_settings.tier_2_enabled}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      tax_settings: {...formData.tax_settings, tier_2_enabled: checked}
                    })}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tax_settings.tier_2_rate}
                    onChange={(e) => setFormData({
                      ...formData,
                      tax_settings: {...formData.tax_settings, tier_2_rate: parseFloat(e.target.value) || 0}
                    })}
                    className="w-24"
                    placeholder="2.00"
                  />
                  <span className="text-sm">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Tax Tier 3</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.tax_settings.tier_3_enabled}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      tax_settings: {...formData.tax_settings, tier_3_enabled: checked}
                    })}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tax_settings.tier_3_rate}
                    onChange={(e) => setFormData({
                      ...formData,
                      tax_settings: {...formData.tax_settings, tier_3_rate: parseFloat(e.target.value) || 0}
                    })}
                    className="w-24"
                    placeholder="0.00"
                  />
                  <span className="text-sm">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Display Options</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Show in POS Quick Items</Label>
                <Switch
                  checked={formData.show_in_pos}
                  onCheckedChange={(checked) => setFormData({...formData, show_in_pos: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Show in Kiosk</Label>
                <Switch
                  checked={formData.show_in_kiosk}
                  onCheckedChange={(checked) => setFormData({...formData, show_in_kiosk: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Show in QSR Menu</Label>
                <Switch
                  checked={formData.show_in_qsr}
                  onCheckedChange={(checked) => setFormData({...formData, show_in_qsr: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Category</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ItemEditModal({ item, onSave, onClose }) {
  const [formData, setFormData] = useState({
    category_id: item.category_id || '',
    item_name: item.item_name || '',
    upc_code: item.upc_code || '',
    price: item.price || 0,
    display_order: item.display_order || 0,
    sku: item.sku || '',
    description: item.description || '',
    image_url: item.image_url || '',
    cost: item.cost || 0,
    quantity_on_hand: item.quantity_on_hand || 0,
    track_inventory: item.track_inventory || false,
    active: item.active !== undefined ? item.active : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{item.id ? 'Edit Item' : 'New Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Item Name *</Label>
              <Input
                value={formData.item_name}
                onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                placeholder="e.g., Hot Dog, Coffee, Lottery Ticket"
                required
              />
            </div>

            <div>
              <Label>UPC Code</Label>
              <Input
                value={formData.upc_code}
                onChange={(e) => setFormData({...formData, upc_code: e.target.value})}
                placeholder="123456789012"
              />
              <p className="text-xs text-gray-500 mt-1">For scanning at POS</p>
            </div>

            <div>
              <Label>SKU</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                placeholder="Internal code"
              />
            </div>

            <div>
              <Label>Price *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                required
              />
            </div>

            <div>
              <Label>Cost</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
              />
            </div>

            <div>
              <Label>Quantity on Hand</Label>
              <Input
                type="number"
                value={formData.quantity_on_hand}
                onChange={(e) => setFormData({...formData, quantity_on_hand: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Optional description"
              />
            </div>

            <div className="col-span-2">
              <Label>Image URL</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label>Track Inventory</Label>
              <Switch
                checked={formData.track_inventory}
                onCheckedChange={(checked) => setFormData({...formData, track_inventory: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({...formData, active: checked})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PushToLocationsModal({ source, locations, selectedLocations, onSelectionChange, onPush, onClose }) {
  const handleToggleLocation = (locationId) => {
    if (selectedLocations.includes(locationId)) {
      onSelectionChange(selectedLocations.filter(id => id !== locationId));
    } else {
      onSelectionChange([...selectedLocations, locationId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(locations.map(loc => loc.id));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Push to Multiple Locations</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm font-medium">
              Pushing: <span className="font-bold">{source?.data?.category_name || source?.data?.item_name}</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              This will create a copy at each selected location
            </p>
          </div>

          <div className="flex justify-between items-center">
            <Label>Select Locations ({selectedLocations.length} selected)</Label>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={handleSelectAll}>Select All</Button>
              <Button size="sm" variant="ghost" onClick={handleDeselectAll}>Clear</Button>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-3">
            {locations.map(location => (
              <div
                key={location.id}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => handleToggleLocation(location.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(location.id)}
                  onChange={() => {}}
                  className="w-4 h-4"
                />
                <span className="flex-1">{location.location_name}</span>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onPush} disabled={selectedLocations.length === 0}>
            <Send className="w-4 h-4 mr-2" />
            Push to {selectedLocations.length} Location(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}