import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Percent, DollarSign, Package } from "lucide-react";
import { InventoryItem } from "@/api/entities";

const categories = [
  { value: "tobacco", label: "Tobacco Products" },
  { value: "alcohol", label: "Alcohol" },
  { value: "beverages", label: "Beverages" },
  { value: "snacks", label: "Snacks" },
  { value: "automotive", label: "Automotive" },
  { value: "personal_care", label: "Personal Care" },
  { value: "candy", label: "Candy" },
  { value: "food", label: "Food" },
  { value: "lottery", label: "Lottery" },
  { value: "other", label: "Other" }
];

export default function BulkPriceManager({ onClose, onUpdate }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('percentage'); // 'percentage' or 'fixed'
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [previewItems, setPreviewItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadCategoryPreview = async (category) => {
    if (!category) {
      setPreviewItems([]);
      return;
    }

    try {
      const items = await InventoryItem.filter({ category, active: true }, "product_name");
      setPreviewItems(items.slice(0, 10)); // Show first 10 items as preview
    } catch (error) {
      console.error('Error loading category preview:', error);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    loadCategoryPreview(category);
  };

  const calculateNewPrice = (currentPrice, adjustment, type) => {
    if (type === 'percentage') {
      return currentPrice * (1 + (adjustment / 100));
    } else {
      return currentPrice + adjustment;
    }
  };

  const handleBulkUpdate = async () => {
    if (!selectedCategory || !adjustmentValue) {
      alert('Please select category and adjustment value');
      return;
    }

    if (window.confirm(`Are you sure you want to apply ${adjustmentType === 'percentage' ? adjustmentValue + '%' : '$' + adjustmentValue} increase to all ${selectedCategory} items?`)) {
      setIsProcessing(true);
      
      try {
        const items = await InventoryItem.filter({ category: selectedCategory, active: true });
        const adjustment = parseFloat(adjustmentValue);
        
        const updatePromises = items.map(item => {
          const newPrice = calculateNewPrice(item.price, adjustment, adjustmentType);
          return InventoryItem.update(item.id, { 
            price: parseFloat(newPrice.toFixed(2)),
            last_price_update: new Date().toISOString()
          });
        });

        await Promise.all(updatePromises);
        
        onUpdate(`Successfully updated ${items.length} items in ${selectedCategory} category`);
        onClose();
      } catch (error) {
        console.error('Bulk price update failed:', error);
        alert('Failed to update prices. Please try again.');
      }
      
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Bulk Price Manager
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Selection */}
          <div>
            <Label htmlFor="category">Select Category</Label>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose product category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Adjustment Type and Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Percentage Increase
                    </div>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Fixed Amount Increase
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="adjustment">
                {adjustmentType === 'percentage' ? 'Percentage (%)' : 'Dollar Amount ($)'}
              </Label>
              <Input
                id="adjustment"
                type="number"
                step={adjustmentType === 'percentage' ? '0.1' : '0.01'}
                placeholder={adjustmentType === 'percentage' ? '5.0' : '0.50'}
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(e.target.value)}
              />
            </div>
          </div>

          {/* Preview */}
          {previewItems.length > 0 && adjustmentValue && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span className="font-medium">Preview Changes (First 10 Items)</span>
              </div>
              
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                {previewItems.map((item) => {
                  const newPrice = calculateNewPrice(item.price, parseFloat(adjustmentValue), adjustmentType);
                  const priceChange = newPrice - item.price;
                  
                  return (
                    <div key={item.id} className="p-3 border-b last:border-b-0 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-gray-500">{item.upc_code}</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">${item.price.toFixed(2)}</span>
                          <span>→</span>
                          <span className="font-bold text-green-600">${newPrice.toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-green-600">
                          +${priceChange.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-center text-sm text-gray-600">
                Changes will be applied to all items in this category
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpdate}
              disabled={!selectedCategory || !adjustmentValue || isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Updating Prices...' : `Apply Changes to ${selectedCategory}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}