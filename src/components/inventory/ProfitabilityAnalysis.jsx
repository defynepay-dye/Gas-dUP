
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function ProfitabilityAnalysis({ inventory, onClose }) {
  const [analysisData, setAnalysisData] = useState([]);
  const [sortBy, setSortBy] = useState('margin_percent');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const calculateProfitability = useCallback(() => {
    const analysis = inventory.map(item => {
      // Get current cost based on cost method
      let currentCost = 0;
      if (item.inventory_tracking?.cost_method === 'weighted_average') {
        currentCost = item.inventory_tracking.weighted_average_cost || item.cost || 0;
      } else if (item.inventory_tracking?.cost_method === 'fifo') {
        // Calculate weighted average of FIFO layers for analysis
        const layers = item.inventory_tracking.fifo_layers || [];
        if (layers.length > 0) {
          const totalValue = layers.reduce((sum, layer) => sum + (layer.quantity * layer.unit_cost), 0);
          const totalQuantity = layers.reduce((sum, layer) => sum + layer.quantity, 0);
          currentCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
        }
      } else {
        currentCost = item.cost || 0;
      }

      const sellingPrice = item.cash_price || 0;
      const marginDollars = sellingPrice - currentCost;
      const marginPercent = sellingPrice > 0 ? (marginDollars / sellingPrice) * 100 : 0;
      const turnover = item.inventory_tracking?.quantity_on_hand_singles || item.quantity_in_stock || 0;
      const inventoryValue = turnover * currentCost;
      
      return {
        ...item,
        current_cost: currentCost,
        selling_price: sellingPrice,
        margin_dollars: marginDollars,
        margin_percent: marginPercent,
        inventory_value: inventoryValue,
        turnover_potential: turnover * marginDollars
      };
    });

    // Sort analysis data
    const sorted = analysis.sort((a, b) => {
      switch (sortBy) {
        case 'margin_percent':
          return b.margin_percent - a.margin_percent;
        case 'margin_dollars':
          return b.margin_dollars - a.margin_dollars;
        case 'inventory_value':
          return b.inventory_value - a.inventory_value;
        case 'turnover_potential':
          return b.turnover_potential - a.turnover_potential;
        default:
          return 0;
      }
    });

    setAnalysisData(sorted);
  }, [inventory, sortBy]); // Dependencies for useCallback: inventory and sortBy

  useEffect(() => {
    calculateProfitability();
  }, [calculateProfitability]); // useEffect now depends on the memoized calculateProfitability

  const filteredData = analysisData.filter(item => 
    categoryFilter === 'all' || item.category === categoryFilter
  );

  const categories = [...new Set(inventory.map(item => item.category))];

  const getMarginColor = (margin) => {
    if (margin >= 30) return 'text-green-600';
    if (margin >= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalInventoryValue = filteredData.reduce((sum, item) => sum + item.inventory_value, 0);
  const averageMargin = filteredData.length > 0 
    ? filteredData.reduce((sum, item) => sum + item.margin_percent, 0) / filteredData.length 
    : 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Profitability Analysis
          </DialogTitle>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${totalInventoryValue.toFixed(0)}</p>
                <p className="text-sm text-gray-500">Total Inventory Value</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{averageMargin.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Average Margin</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calculator className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{filteredData.filter(i => i.margin_percent >= 30).length}</p>
                <p className="text-sm text-gray-500">High Margin Items</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{filteredData.filter(i => i.margin_percent < 10).length}</p>
                <p className="text-sm text-gray-500">Low Margin Items</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="margin_percent">Margin %</SelectItem>
              <SelectItem value="margin_dollars">Margin $</SelectItem>
              <SelectItem value="inventory_value">Inventory Value</SelectItem>
              <SelectItem value="turnover_potential">Profit Potential</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category} className="capitalize">
                  {category.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Analysis Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">Product</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Cost Method</th>
                <th className="text-right p-3">Current Cost</th>
                <th className="text-right p-3">Selling Price</th>
                <th className="text-right p-3">Margin $</th>
                <th className="text-right p-3">Margin %</th>
                <th className="text-right p-3">On Hand</th>
                <th className="text-right p-3">Inventory Value</th>
                <th className="text-right p-3">Profit Potential</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 50).map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-sm text-gray-500">{item.upc_code}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="capitalize">
                      {item.category.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge className={item.inventory_tracking?.cost_method === 'fifo' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                      {item.inventory_tracking?.cost_method || 'Standard'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">${item.current_cost.toFixed(3)}</td>
                  <td className="p-3 text-right font-medium">${item.selling_price.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <span className={item.margin_dollars >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${item.margin_dollars.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className={`font-bold ${getMarginColor(item.margin_percent)}`}>
                      {item.margin_percent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {item.inventory_tracking?.quantity_on_hand_singles || item.quantity_in_stock || 0}
                  </td>
                  <td className="p-3 text-right">${item.inventory_value.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <span className={item.turnover_potential >= 0 ? 'text-green-600 font-medium' : 'text-red-600'}>
                      ${item.turnover_potential.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>Close Analysis</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
