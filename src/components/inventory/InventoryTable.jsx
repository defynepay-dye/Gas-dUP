
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Package, 
    DollarSign, 
    Hash, 
    Tag, 
    Shield, 
    Edit, 
    TrendingUp,
    MoreHorizontal,
    Printer 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton";

// categoryColors is kept as it might be used elsewhere or in a future iteration for badges.
const categoryColors = {
  tobacco: "bg-red-100 text-red-800",
  alcohol: "bg-purple-100 text-purple-800",
  beverages: "bg-blue-100 text-blue-800",
  snacks: "bg-yellow-100 text-yellow-800",
  automotive: "bg-gray-100 text-gray-800",
  personal_care: "bg-green-100 text-green-800",
  candy: "bg-pink-100 text-pink-800",
  food: "bg-orange-100 text-orange-800",
  lottery: "bg-indigo-100 text-indigo-800",
  other: "bg-gray-100 text-gray-800"
};

// The InventoryItem mock for update is no longer used in this component's logic
// as the dynamic pricing panel (which used it) has been removed.
// We'll remove it to clean up the code.

export default function InventoryTable({ inventory, isLoading, onRefresh, onEdit, onPrintLabel }) {
  // onRefresh is still a prop but not used in the provided outline structure.
  // selectedItemForPricing state and related dialog logic are removed as per the outline.

  if (isLoading) {
    // Replaced skeleton array with a generic loading div as per outline
    return (
        <div className="border rounded-lg overflow-hidden p-6 text-center text-gray-500">
            <Package className="w-10 h-10 mx-auto mb-2 animate-pulse" />
            <p>Loading inventory...</p>
            {/* You could add a more detailed skeleton here if desired, 
                similar to the previous implementation, but the outline provided a simpler one. */}
        </div>
    );
  }
  
  if (!inventory || inventory.length === 0) {
      return (
          <div className="border rounded-lg overflow-hidden p-6 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Products Found</h3>
              <p>Your inventory is empty. Try adding a new product or adjusting your search filters.</p>
          </div>
      )
  }

  // New helper function from the outline
  const getStockColor = (item) => {
    // Assuming inventory_tracking and reorder_level exist as per the outline's usage
    const quantity = item.inventory_tracking?.quantity_on_hand_singles || 0;
    const reorderLevel = item.reorder_level || 0; // Reorder level from the item object
    if (quantity <= 0) return "bg-red-100 text-red-800";
    if (quantity <= reorderLevel) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>UPC</TableHead> {/* Added UPC header */}
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-center">Age Restricted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.product_name}
              </TableCell>
              <TableCell className="text-gray-500">
                {item.upc_code || 'N/A'}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`${categoryColors[item.category] || categoryColors.other} capitalize`}>
                    {item.category?.replace('_', ' ') || 'Other'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge className={getStockColor(item)}>
                    {item.inventory_tracking?.quantity_on_hand_singles || 0}
                </Badge>
                <div className="text-xs text-gray-500">
                  Reorder: {item.reorder_level || 0}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="space-y-1">
                  <div className="flex items-center justify-end gap-2"> {/* Added justify-end for right alignment */}
                    <span className="text-xs text-gray-500">Cash:</span>
                    <span className="font-semibold">${(item.cash_price || 0).toFixed(2)}</span>
                  </div>
                  {item.pack_structure?.singles_per_box > 1 && (
                    <div className="flex items-center justify-end gap-2"> {/* Added justify-end for right alignment */}
                      <span className="text-xs text-gray-500">Credit:</span>
                      <span className="text-sm">${((item.cash_price || 0) * 1.02).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">${(item.inventory_tracking?.weighted_average_cost || 0).toFixed(2)}</TableCell>
              <TableCell className="text-center">
                {item.compliance_flags?.age_restricted ? (
                  <Shield className="w-5 h-5 text-red-500 mx-auto" />
                ) : (
                   <span className="text-gray-300">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                    {onPrintLabel && ( // Only render if onPrintLabel prop is provided
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPrintLabel(item)}
                            title="Print Label"
                        >
                            <Printer className="w-4 h-4" />
                            <span className="sr-only">Print Label</span> {/* Accessibility */}
                        </Button>
                    )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
