import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, ChevronDown, ChevronUp } from "lucide-react";

const colorClasses = {
  blue: "bg-blue-500 hover:bg-blue-600 text-white",
  green: "bg-green-500 hover:bg-green-600 text-white",
  orange: "bg-orange-500 hover:bg-orange-600 text-white",
  purple: "bg-purple-500 hover:bg-purple-600 text-white",
  red: "bg-red-500 hover:bg-red-600 text-white",
  gray: "bg-gray-500 hover:bg-gray-600 text-white"
};

export default function CustomItemsPanel({ customItems, onAddToCart, isLoading }) {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleSubItemAdd = (parentItem, subItem) => {
    const customCartItem = {
      upc_code: `CUSTOM-${parentItem.id}-${subItem.name.replace(/\s+/g, '_')}`,
      product_name: `${parentItem.item_name} - ${subItem.name}`,
      category: parentItem.category,
      price: subItem.price,
      quantity: 1,
      total_price: subItem.price,
      tax_rate: subItem.tax_rate || 8.25,
      tax_amount: subItem.price * ((subItem.tax_rate || 8.25) / 100),
      is_custom: true,
      age_restricted: false
    };
    
    onAddToCart(customCartItem);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Services & Custom Items
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {customItems.map((item) => (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                <Button
                  onClick={() => toggleExpanded(item.id)}
                  className={`w-full p-4 justify-between ${colorClasses[item.button_color]}`}
                  variant="default"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.item_name}</span>
                    {item.sub_items?.length > 0 && (
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {item.sub_items.length} items
                      </Badge>
                    )}
                  </div>
                  {item.sub_items?.length > 0 && (
                    expandedItems[item.id] ? 
                      <ChevronUp className="w-4 h-4" /> : 
                      <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
                
                {expandedItems[item.id] && item.sub_items?.length > 0 && (
                  <div className="bg-gray-50 p-3">
                    <div className="grid grid-cols-1 gap-2">
                      {item.sub_items.filter(subItem => subItem.active).map((subItem, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div>
                            <span className="font-medium text-sm">{subItem.name}</span>
                            <div className="text-xs text-gray-500">
                              ${subItem.price.toFixed(2)}
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => handleSubItemAdd(item, subItem)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {customItems.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No custom items configured</p>
                <p className="text-sm">Add services and custom items for quick access</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}