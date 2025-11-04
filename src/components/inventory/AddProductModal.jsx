import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function AddProductModal({ onAdd, onClose }) {
  const [formData, setFormData] = useState({
    product_name: '',
    upc_code: '',
    category: 'other',
    cash_price: '',
    cost: '',
    vendor: '',
    reorder_level: 10,
    active: true,
    compliance_flags: {
      age_restricted: false,
      ebt_eligible: false
    },
    pack_structure: {
      singles_per_box: 1,
      boxes_per_case: 1
    },
    selling_units: [{
      unit_type: 'single',
      unit_price: 0,
      quantity_multiplier: 1,
      active: true
    }],
    inventory_tracking: {
      quantity_on_hand_singles: 0,
      cost_method: 'weighted_average',
      weighted_average_cost: 0
    },
    receiving_info: {
      preferred_receiving_unit: 'case'
    }
  });

  const categories = [
    'tobacco', 'alcohol', 'beverages', 'snacks', 'automotive', 
    'personal_care', 'candy', 'food', 'lottery', 'qsr_main', 
    'qsr_ingredient', 'other'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.product_name) {
      alert('Please enter a product name');
      return;
    }

    const price = parseFloat(formData.cash_price) || 0;
    const costValue = parseFloat(formData.cost) || 0;

    const productData = {
      ...formData,
      cash_price: price,
      cost: costValue,
      reorder_level: parseInt(formData.reorder_level) || 10,
      selling_units: [{
        unit_type: 'single',
        unit_price: price,
        quantity_multiplier: 1,
        active: true
      }],
      inventory_tracking: {
        quantity_on_hand_singles: 0,
        cost_method: 'weighted_average',
        weighted_average_cost: costValue
      }
    };

    onAdd(productData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_name">Product Name *</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                placeholder="e.g., Coca Cola 20oz"
                required
              />
            </div>

            <div>
              <Label htmlFor="upc_code">UPC Code</Label>
              <Input
                id="upc_code"
                value={formData.upc_code}
                onChange={(e) => setFormData({...formData, upc_code: e.target.value})}
                placeholder="e.g., 012345678901"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
              <Label htmlFor="vendor">Vendor/Supplier</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                placeholder="e.g., Coca Cola"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cash_price">Cash Price *</Label>
              <Input
                id="cash_price"
                type="number"
                step="0.01"
                value={formData.cash_price}
                onChange={(e) => setFormData({...formData, cash_price: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                type="number"
                value={formData.reorder_level}
                onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
                placeholder="10"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Compliance Flags</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="age_restricted"
                checked={formData.compliance_flags.age_restricted}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  compliance_flags: {...formData.compliance_flags, age_restricted: checked}
                })}
              />
              <Label htmlFor="age_restricted" className="cursor-pointer">Age Restricted (21+)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ebt_eligible"
                checked={formData.compliance_flags.ebt_eligible}
                onCheckedChange={(checked) => setFormData({
                  ...formData,
                  compliance_flags: {...formData.compliance_flags, ebt_eligible: checked}
                })}
              />
              <Label htmlFor="ebt_eligible" className="cursor-pointer">EBT Eligible</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}