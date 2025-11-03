import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Trash2, AlertTriangle } from "lucide-react";

export default function CartDisplay({ cart, onUpdateQuantity, onRemoveItem, subtotal, taxTotal, total }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Shopping Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cart.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Cart is empty</p>
            <p className="text-sm">Scan or search for products to add</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.upc_code} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{item.product_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">UPC: {item.upc_code}</span>
                    <Badge variant="secondary">{item.category}</Badge>
                    {item.age_restricted && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        21+
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    ${item.price.toFixed(2)} each • Tax: ${item.tax_amount.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.upc_code, item.quantity - 1)}
                    className="h-8 w-8"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.upc_code, item.quantity + 1)}
                    className="h-8 w-8"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                <div className="text-right">
                  <div className="font-medium">${item.total_price.toFixed(2)}</div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemoveItem(item.upc_code)}
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}