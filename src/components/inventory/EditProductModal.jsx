
import React, { useState, useEffect } from 'react';
import { InventoryItem, Category, CategoryItem } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Calendar as CalendarIcon, Zap, Tag, Package, DollarSign, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function EditProductModal({ item, onSave, onClose }) {
  const [formData, setFormData] = useState({
    product_name: item.product_name || '',
    upc_code: item.upc_code || '',
    category: item.category || '',
    brand: item.brand || '',
    manufacturer: item.manufacturer || '',
    cash_price: item.cash_price || 0,
    cost: item.inventory_tracking?.weighted_average_cost || item.cost || 0,
    quantity_on_hand: item.inventory_tracking?.quantity_on_hand_singles || 0,
    reorder_level: item.reorder_level || 0,
    expiration_date: item.expiration_date || null,
    active: item.active !== false,
    track_inventory: item.inventory_tracking ? true : false,
    product_family_id: item.product_family_id || null, // Initialize product_family_id
    selling_configurations: item.selling_configurations || [], // Initialize selling_configurations
  });

  const [categories, setCategories] = useState([]);
  const [productFamilies, setProductFamilies] = useState([]); // State for product families
  const [isLinkedToQuickItems, setIsLinkedToQuickItems] = useState(false);
  const [linkedCategoryItem, setLinkedCategoryItem] = useState(null);
  const [selectedQuickCategory, setSelectedQuickCategory] = useState('');
  const [showQuickItemLink, setShowQuickItemLink] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const loadCategories = async () => {
    try {
      const categoryData = await Category.filter({ active: true }, 'display_order');
      setCategories(categoryData);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    }
  };

  const loadProductFamilies = async () => {
    // This is a placeholder. In a real app, you would fetch product families
    // from your backend or data source.
    // For now, let's mock some data or keep it empty.
    const mockFamilies = [
      { id: 'family_1', name: 'Soda 12-Pack' },
      { id: 'family_2', name: 'Candy Bar Multipack' },
    ];
    setProductFamilies(mockFamilies);
  };

  const checkQuickItemLink = async () => {
    try {
      const linkedItems = await CategoryItem.filter({ 
        upc_code: item.upc_code 
      });
      if (linkedItems.length > 0) {
        setIsLinkedToQuickItems(true);
        setLinkedCategoryItem(linkedItems[0]);
      }
    } catch (error) {
      console.error('Failed to check quick item link:', error);
    }
  };

  useEffect(() => {
    loadCategories();
    loadProductFamilies(); // Load product families on component mount
    checkQuickItemLink();
  }, [item]); // Added 'item' to the dependency array because checkQuickItemLink uses item.upc_code

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const updateData = {
        product_name: formData.product_name,
        upc_code: formData.upc_code,
        category: formData.category,
        brand: formData.brand,
        manufacturer: formData.manufacturer,
        cash_price: parseFloat(formData.cash_price),
        reorder_level: parseInt(formData.reorder_level),
        expiration_date: formData.expiration_date,
        active: formData.active,
        product_family_id: formData.product_family_id, // Include product_family_id
        inventory_tracking: {
          quantity_on_hand_singles: parseInt(formData.quantity_on_hand),
          cost_method: item.inventory_tracking?.cost_method || 'weighted_average',
          weighted_average_cost: parseFloat(formData.cost)
        }
      };

      await InventoryItem.update(item.id, updateData);
      
      // If linked to quick items, update the CategoryItem as well
      if (isLinkedToQuickItems && linkedCategoryItem) {
        await CategoryItem.update(linkedCategoryItem.id, {
          item_name: formData.product_name,
          price: parseFloat(formData.cash_price),
          quantity_on_hand: parseInt(formData.quantity_on_hand),
          active: formData.active
        });
      }

      setSaveMessage('Product updated successfully!');
      setTimeout(() => {
        onSave();
      }, 1000);
    } catch (error) {
      console.error('Failed to save product:', error);
      setSaveMessage('Error saving product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkToQuickItems = async () => {
    if (!selectedQuickCategory) {
      alert('Please select a category first');
      return;
    }

    setIsSaving(true);
    try {
      const selectedCategory = categories.find(c => c.id === selectedQuickCategory);
      
      await CategoryItem.create({
        category_id: selectedQuickCategory,
        item_name: formData.product_name,
        upc_code: formData.upc_code,
        price: parseFloat(formData.cash_price),
        cost: parseFloat(formData.cost),
        quantity_on_hand: parseInt(formData.quantity_on_hand),
        track_inventory: true,
        active: formData.active,
        display_order: 0
      });

      setIsLinkedToQuickItems(true);
      setShowQuickItemLink(false);
      setSaveMessage(`Successfully linked to "${selectedCategory.category_name}" quick items!`);
      checkQuickItemLink(); // Re-check link status after linking
    } catch (error) {
      console.error('Failed to link to quick items:', error);
      alert('Failed to link to quick items. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    pink: 'bg-pink-100 text-pink-800',
    indigo: 'bg-indigo-100 text-indigo-800'
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Product: {formData.product_name}</DialogTitle>
        </DialogHeader>

        {saveMessage && (
          <Alert className={saveMessage.includes('Error') ? 'border-red-500' : 'border-green-500'}>
            <AlertDescription>{saveMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Product Family Link */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Product Family (Pricing Group)</h3>
            <p className="text-xs text-blue-700 mb-3">
              Link this product to a family to inherit pricing configurations for multiple pack sizes.
            </p>
            <Select
              value={formData.product_family_id || ''}
              onValueChange={(value) => setFormData({ ...formData, product_family_id: value || null })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No Family (Standalone Product)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No Family (Standalone Product)</SelectItem>
                {productFamilies.map(family => (
                  <SelectItem key={family.id} value={family.id}>
                    {family.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selling Configurations */}
          {formData.selling_configurations && formData.selling_configurations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Selling Configurations (Pack Sizes)</h3>
                {formData.product_family_id && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    Managed by Family
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                {formData.selling_configurations.map((config, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{config.config_name}</p>
                      <p className="text-sm text-gray-600">
                        {config.unit_multiplier} {config.sales_unit_of_measure}{config.unit_multiplier > 1 ? 's' : ''}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      ${config.display_price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              {formData.product_family_id && (
                <p className="text-xs text-gray-600 italic">
                  To change these configurations, edit the Product Family in the Families tab.
                </p>
              )}
            </div>
          )}

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic"><Package className="w-4 h-4 mr-2" />Basic Info</TabsTrigger>
              <TabsTrigger value="pricing"><DollarSign className="w-4 h-4 mr-2" />Pricing & Inventory</TabsTrigger>
              <TabsTrigger value="quickitems"><Zap className="w-4 h-4 mr-2" />Quick Items</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <Label htmlFor="upc_code">UPC Code</Label>
                  <Input
                    id="upc_code"
                    value={formData.upc_code}
                    onChange={(e) => setFormData({ ...formData, upc_code: e.target.value })}
                    placeholder="Scan or enter UPC"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tobacco">Tobacco</SelectItem>
                      <SelectItem value="alcohol">Alcohol</SelectItem>
                      <SelectItem value="beverages">Beverages</SelectItem>
                      <SelectItem value="snacks">Snacks</SelectItem>
                      <SelectItem value="automotive">Automotive</SelectItem>
                      <SelectItem value="personal_care">Personal Care</SelectItem>
                      <SelectItem value="candy">Candy</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="qsr_main">QSR Main</SelectItem>
                      <SelectItem value="qsr_ingredient">QSR Ingredient</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Brand name"
                  />
                </div>

                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Manufacturer name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="expiration_date">Expiration Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiration_date ? format(new Date(formData.expiration_date), 'PPP') : 'No expiration date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.expiration_date ? new Date(formData.expiration_date) : undefined}
                      onSelect={(date) => setFormData({ ...formData, expiration_date: date ? format(date, 'yyyy-MM-dd') : null })}
                    />
                    {formData.expiration_date && (
                      <div className="p-3 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setFormData({ ...formData, expiration_date: null })}
                        >
                          Clear Date
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Product is active for sale</Label>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cash_price">Cash Price *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="cash_price"
                      type="number"
                      step="0.01"
                      value={formData.cash_price}
                      onChange={(e) => setFormData({ ...formData, cash_price: e.target.value })}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cost">Cost</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="quantity_on_hand">Quantity on Hand</Label>
                  <Input
                    id="quantity_on_hand"
                    type="number"
                    value={formData.quantity_on_hand}
                    onChange={(e) => setFormData({ ...formData, quantity_on_hand: e.target.value })}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Direct inventory adjustment</p>
                </div>

                <div>
                  <Label htmlFor="reorder_level">Reorder Level</Label>
                  <Input
                    id="reorder_level"
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this</p>
                </div>
              </div>

              {formData.cash_price && formData.cost && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Margin:</span>
                      <span className="text-lg">
                        ${(parseFloat(formData.cash_price) - parseFloat(formData.cost)).toFixed(2)} 
                        ({(((parseFloat(formData.cash_price) - parseFloat(formData.cost)) / parseFloat(formData.cash_price)) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="quickitems" className="space-y-4 mt-4">
              {isLinkedToQuickItems ? (
                <Alert className="bg-green-50 border-green-200">
                  <Zap className="w-4 h-4 text-green-600" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-green-800">This product is linked to Quick Items</p>
                        <p className="text-sm text-green-700 mt-1">
                          Changes to price, name, and quantity will sync automatically to the POS quick button.
                        </p>
                      </div>
                      <Badge className="bg-green-600">Active</Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <Tag className="w-4 h-4" />
                    <AlertDescription>
                      <p className="font-semibold">Not linked to Quick Items</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Add this product to your POS quick buttons for faster checkout.
                      </p>
                    </AlertDescription>
                  </Alert>

                  {!showQuickItemLink ? (
                    <Button 
                      onClick={() => setShowQuickItemLink(true)} 
                      className="w-full"
                      variant="outline"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Link to Quick Item Category
                    </Button>
                  ) : (
                    <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                      <Label>Select Quick Item Category</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedQuickCategory(cat.id)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              selectedQuickCategory === cat.id 
                                ? 'border-blue-600 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${colorClasses[cat.color] || 'bg-gray-300'}`}></div>
                              <span className="font-medium text-sm">{cat.category_name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleLinkToQuickItems}
                          disabled={!selectedQuickCategory || isSaving}
                          className="flex-1"
                        >
                          Link to Selected Category
                        </Button>
                        <Button 
                          onClick={() => {
                            setShowQuickItemLink(false);
                            setSelectedQuickCategory('');
                          }}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
