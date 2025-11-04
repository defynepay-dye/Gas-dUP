import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddProductModal({ onAdd, onClose }) {
  const [formData, setFormData] = useState({
    product_code: "",
    product_name: "",
    current_price: "",
    cost: "",
    tax_rate: "8.25",
    inventory_gallons: "1000",
    low_inventory_threshold: "500",
    supplier: "",
    octane_rating: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...formData,
      current_price: parseFloat(formData.current_price),
      cost: parseFloat(formData.cost),
      tax_rate: parseFloat(formData.tax_rate),
      inventory_gallons: parseInt(formData.inventory_gallons),
      low_inventory_threshold: parseInt(formData.low_inventory_threshold)
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Fuel Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product_code">Product Type</Label>
            <Select value={formData.product_code} onValueChange={(value) => setFormData({...formData, product_code: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular Unleaded</SelectItem>
                <SelectItem value="midgrade">Midgrade</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="e85">E85</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="product_name">Product Name</Label>
            <Input
              id="product_name"
              value={formData.product_name}
              onChange={(e) => setFormData({...formData, product_name: e.target.value})}
              placeholder="e.g., Regular Unleaded 87"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="current_price">Price per Gallon</Label>
              <Input
                id="current_price"
                type="number"
                step="0.001"
                value={formData.current_price}
                onChange={(e) => setFormData({...formData, current_price: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="cost">Cost per Gallon</Label>
              <Input
                id="cost"
                type="number"
                step="0.001"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inventory_gallons">Starting Inventory</Label>
              <Input
                id="inventory_gallons"
                type="number"
                value={formData.inventory_gallons}
                onChange={(e) => setFormData({...formData, inventory_gallons: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="low_inventory_threshold">Low Stock Alert</Label>
              <Input
                id="low_inventory_threshold"
                type="number"
                value={formData.low_inventory_threshold}
                onChange={(e) => setFormData({...formData, low_inventory_threshold: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              placeholder="e.g., Shell, Chevron"
            />
          </div>

          <div>
            <Label htmlFor="octane_rating">Octane Rating</Label>
            <Input
              id="octane_rating"
              value={formData.octane_rating}
              onChange={(e) => setFormData({...formData, octane_rating: e.target.value})}
              placeholder="e.g., 87, 89, 91"
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!formData.product_code || !formData.product_name || !formData.current_price}>
              Add Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}