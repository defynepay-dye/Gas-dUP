import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart } from 'lucide-react';

export default function PackSizeSelectionModal({ 
  isOpen, 
  onClose, 
  product, 
  onSelectConfiguration 
}) {
  const [selectedConfig, setSelectedConfig] = useState(null);

  const handleConfirm = () => {
    if (selectedConfig) {
      onSelectConfiguration(selectedConfig);
      onClose();
    }
  };

  if (!product || !product.selling_configurations || product.selling_configurations.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Select Pack Size
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-semibold text-blue-900">{product.product_name}</p>
            <p className="text-sm text-blue-700 mt-1">UPC: {product.upc_code}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Choose selling configuration:</p>
            {product.selling_configurations.map((config, index) => (
              <button
                key={index}
                onClick={() => setSelectedConfig(config)}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  selectedConfig === config
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-lg">{config.config_name}</p>
                    <p className="text-sm text-gray-600">
                      {config.unit_multiplier} {config.sales_unit_of_measure || 'unit'}{config.unit_multiplier > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      ${config.display_price.toFixed(2)}
                    </p>
                    {config.unit_multiplier > 1 && (
                      <p className="text-xs text-gray-500">
                        ${(config.display_price / config.unit_multiplier).toFixed(2)} each
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedConfig}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}