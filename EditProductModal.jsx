
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PricingSettings } from "@/api/entities"; // Assuming this path is correct

export default function EditProductModal({ product, onEdit, onClose }) {
  const [formData, setFormData] = useState({ ...product });
  // Default markup in dollars (10 cents), will be updated by settings
  const [markup, setMarkup] = useState(0.10); 

  useEffect(() => {
    async function fetchSettings() {
      try {
        const settings = await PricingSettings.list();
        if (settings.length > 0 && settings[0].credit_markup_cents_fuel !== undefined && settings[0].credit_markup_cents_fuel !== null) {
          // Convert cents to dollars for calculations
          setMarkup(settings[0].credit_markup_cents_fuel / 100);
        }
      } catch (error) {
        console.error("Could not fetch pricing settings for modal:", error);
        // Optionally, handle error by setting a default markup or displaying a message
      }
    }
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // parseFloat will return NaN for empty string or non-numeric input
    const numValue = parseFloat(value);

    setFormData(prev => {
      const newData = { ...prev };
      // Set the current field's value. If numValue is NaN, store an empty string.
      newData[name] = isNaN(numValue) ? '' : numValue;
      
      // Auto-calculate credit prices when cash prices change
      if (name === 'self_service_cash_price') {
        if (!isNaN(numValue)) {
          // Calculate credit price by adding the markup, and round to 3 decimal places for currency precision
          newData.self_service_credit_price = parseFloat((numValue + markup).toFixed(3));
        } else {
          // If cash price is cleared/invalid, clear the credit price as well
          newData.self_service_credit_price = ''; 
        }
      }
      
      if (name === 'full_service_cash_price') {
        if (!isNaN(numValue)) {
          // Calculate credit price by adding the markup, and round to 3 decimal places for currency precision
          newData.full_service_credit_price = parseFloat((numValue + markup).toFixed(3));
        } else {
          // If cash price is cleared/invalid, clear the credit price as well
          newData.full_service_credit_price = ''; 
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onEdit(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Fuel Prices: {product.product_name}</DialogTitle>
          <p className="text-sm text-gray-500">Cash prices are your base prices. Credit prices are calculated automatically based on your markup of <span className="font-bold">{markup * 100}¢</span>.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="self_service_cash_price">Self-Service Cash (Base)</Label>
              <Input 
                id="self_service_cash_price" 
                name="self_service_cash_price" 
                type="number" 
                step="0.001" 
                value={formData.self_service_cash_price} 
                onChange={handleChange}
                className="font-bold text-green-600"
              />
            </div>
            <div>
              <Label htmlFor="self_service_credit_price">Self-Service Credit</Label>
              <Input 
                id="self_service_credit_price" 
                name="self_service_credit_price" 
                type="number" 
                step="0.001" 
                value={formData.self_service_credit_price} 
                onChange={handleChange}
                className="bg-gray-50" // Visual cue for auto-calculated/derived field
                readOnly // Make credit price read-only as it's auto-calculated
              />
            </div>
            <div>
              <Label htmlFor="full_service_cash_price">Full-Service Cash (Base)</Label>
              <Input 
                id="full_service_cash_price" 
                name="full_service_cash_price" 
                type="number" 
                step="0.001" 
                value={formData.full_service_cash_price} 
                onChange={handleChange}
                className="font-bold text-green-600"
              />
            </div>
            <div>
              <Label htmlFor="full_service_credit_price">Full-Service Credit</Label>
              <Input 
                id="full_service_credit_price" 
                name="full_service_credit_price" 
                type="number" 
                step="0.001" 
                value={formData.full_service_credit_price} 
                onChange={handleChange}
                className="bg-gray-50" // Visual cue for auto-calculated/derived field
                readOnly // Make credit price read-only as it's auto-calculated
              />
            </div>
             <div>
              <Label htmlFor="inventory_gallons">Inventory (Gallons)</Label>
              <Input id="inventory_gallons" name="inventory_gallons" type="number" step="1" value={formData.inventory_gallons} onChange={handleChange} />
            </div>
             <div>
              <Label htmlFor="low_inventory_threshold">Low Inventory Threshold</Label>
              <Input id="low_inventory_threshold" name="low_inventory_threshold" type="number" step="1" value={formData.low_inventory_threshold} onChange={handleChange} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
