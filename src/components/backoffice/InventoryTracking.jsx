import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, TrendingDown } from "lucide-react";

export default function InventoryTracking({ inventoryData, alerts, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inventory Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p>Loading inventory data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const lowStockItems = inventoryData.filter(item => 
    item.quantity_in_stock <= item.reorder_level && item.active
  );

  const totalItems = inventoryData.length;
  const totalValue = inventoryData.reduce((sum, item) => 
    sum + (item.quantity_in_stock * (item.cost || 0)), 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Inventory Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Package className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-900">{totalItems}</p>
            <p className="text-sm text-blue-600">Total SKUs</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <TrendingDown className="w-6 h-6 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-900">${totalValue.toFixed(2)}</p>
            <p className="text-sm text-green-600">Total Value</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 mx-auto text-red-600 mb-2" />
            <p className="text-2xl font-bold text-red-900">{lowStockItems.length}</p>
            <p className="text-sm text-red-600">Low Stock</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Low Stock Alerts
          </h4>
          
          {lowStockItems.length > 0 ? (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {lowStockItems.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-red-900">{item.product_name}</p>
                    <p className="text-sm text-red-600">
                      Stock: {item.quantity_in_stock} | Reorder: {item.reorder_level}
                    </p>
                  </div>
                  <Badge className="bg-red-100 text-red-800">
                    Critical
                  </Badge>
                </div>
              ))}
              {lowStockItems.length > 10 && (
                <p className="text-sm text-gray-500 text-center">
                  +{lowStockItems.length - 10} more items need attention
                </p>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>All inventory levels are healthy</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}