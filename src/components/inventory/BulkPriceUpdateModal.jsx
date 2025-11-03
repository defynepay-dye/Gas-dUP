import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InventoryItem } from '@/api/entities';
import { TrendingUp, DollarSign, Percent, Loader2, Info, Package } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export default function BulkPriceUpdateModal({ allInventory, categories, onComplete, onClose }) {
  const [scope, setScope] = useState('all'); // 'all', 'category', 'selected'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [updateType, setUpdateType] = useState('percentage'); // 'percentage', 'fixed_amount', 'set_price'
  const [updateValue, setUpdateValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewItems, setPreviewItems] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleGeneratePreview = () => {
    let itemsToUpdate = [];

    // Determine which items to update based on scope
    if (scope === 'all') {
      itemsToUpdate = allInventory.filter(item => item.active);
    } else if (scope === 'category' && selectedCategory) {
      itemsToUpdate = allInventory.filter(item => item.category === selectedCategory && item.active);
    }

    // Calculate new prices
    const preview = itemsToUpdate.map(item => {
      const currentPrice = item.selling_units?.[0]?.unit_price || item.cash_price || 0;
      let newPrice = currentPrice;

      if (updateType === 'percentage') {
        const percentChange = parseFloat(updateValue) || 0;
        newPrice = currentPrice * (1 + percentChange / 100);
      } else if (updateType === 'fixed_amount') {
        const fixedChange = parseFloat(updateValue) || 0;
        newPrice = currentPrice + fixedChange;
      } else if (updateType === 'set_price') {
        newPrice = parseFloat(updateValue) || 0;
      }

      return {
        ...item,
        currentPrice,
        newPrice: Math.max(0, newPrice), // Ensure no negative prices
        priceChange: newPrice - currentPrice,
        percentChange: currentPrice > 0 ? ((newPrice - currentPrice) / currentPrice * 100) : 0
      };
    });

    setPreviewItems(preview);
    setShowPreview(true);
  };

  const handleConfirmUpdate = async () => {
    if (previewItems.length === 0) {
      alert('No items to update');
      return;
    }

    if (!confirm(`Are you sure you want to update prices for ${previewItems.length} items?`)) {
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const item of previewItems) {
      try {
        // Update the selling_units array with new price
        const updatedSellingUnits = item.selling_units?.map((unit, index) => {
          if (index === 0) {
            return { ...unit, unit_price: item.newPrice };
          }
          return unit;
        }) || [{ unit_type: 'single', unit_price: item.newPrice, quantity_multiplier: 1, active: true }];

        await InventoryItem.update(item.id, {
          cash_price: item.newPrice,
          selling_units: updatedSellingUnits
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to update ${item.product_name}:`, error);
        failCount++;
      }
    }

    setIsProcessing(false);
    alert(`Bulk price update complete!\n\nSuccessfully updated: ${successCount}\nFailed: ${failCount}`);
    onComplete();
  };

  const totalItems = scope === 'all' 
    ? allInventory.filter(item => item.active).length 
    : scope === 'category' && selectedCategory
    ? allInventory.filter(item => item.category === selectedCategory && item.active).length
    : 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Bulk Price Update
          </DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="w-4 h-4 text-blue-600" />
              <AlertDescription>
                <strong>Mass Price Updates:</strong> Update prices across all inventory or by department/category. 
                Changes apply to the cash price and primary selling unit.
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="scope">Update Scope</Label>
                  <Select value={scope} onValueChange={setScope}>
                    <SelectTrigger id="scope">
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          All Inventory ({allInventory.filter(item => item.active).length} items)
                        </div>
                      </SelectItem>
                      <SelectItem value="category">By Category/Department</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scope === 'category' && (
                  <div>
                    <Label htmlFor="category">Select Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Choose category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => {
                          const itemCount = allInventory.filter(item => item.category === cat && item.active).length;
                          return (
                            <SelectItem key={cat} value={cat}>
                              <div className="flex items-center gap-2 capitalize">
                                {cat.replace('_', ' ')} ({itemCount} items)
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="updateType">Update Type</Label>
                  <Select value={updateType} onValueChange={setUpdateType}>
                    <SelectTrigger id="updateType">
                      <SelectValue placeholder="Select update type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4" />
                          Percentage Change
                        </div>
                      </SelectItem>
                      <SelectItem value="fixed_amount">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Fixed Dollar Amount
                        </div>
                      </SelectItem>
                      <SelectItem value="set_price">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Set Specific Price
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="updateValue">
                    {updateType === 'percentage' && 'Percentage Change (%)'}
                    {updateType === 'fixed_amount' && 'Dollar Amount ($)'}
                    {updateType === 'set_price' && 'New Price ($)'}
                  </Label>
                  <Input
                    id="updateValue"
                    type="number"
                    step="0.01"
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                    placeholder={
                      updateType === 'percentage' ? 'e.g., 5 for 5% increase, -10 for 10% decrease' :
                      updateType === 'fixed_amount' ? 'e.g., 0.50 to add $0.50' :
                      'e.g., 2.99'
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {updateType === 'percentage' && 'Positive numbers increase prices, negative decrease them'}
                    {updateType === 'fixed_amount' && 'Will be added to current prices (use negative for reduction)'}
                    {updateType === 'set_price' && 'All selected items will be set to this exact price'}
                  </p>
                </div>

                {totalItems > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Ready to update <strong>{totalItems}</strong> item{totalItems !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleGeneratePreview}
                disabled={!updateValue || (scope === 'category' && !selectedCategory) || totalItems === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Preview Changes
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <Info className="w-4 h-4 text-yellow-600" />
              <AlertDescription>
                <strong>Review Changes:</strong> {previewItems.length} items will be updated. Scroll to review before confirming.
              </AlertDescription>
            </Alert>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-right">Current</th>
                    <th className="px-3 py-2 text-right">New</th>
                    <th className="px-3 py-2 text-right">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {previewItems.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2">{item.product_name}</td>
                      <td className="px-3 py-2 capitalize">{item.category?.replace('_', ' ')}</td>
                      <td className="px-3 py-2 text-right">${item.currentPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-semibold">${item.newPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">
                        <Badge variant={item.priceChange >= 0 ? 'default' : 'destructive'}>
                          {item.priceChange >= 0 ? '+' : ''}${item.priceChange.toFixed(2)} ({item.percentChange >= 0 ? '+' : ''}{item.percentChange.toFixed(1)}%)
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Back
              </Button>
              <Button 
                onClick={handleConfirmUpdate}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>Confirm Update ({previewItems.length} items)</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}