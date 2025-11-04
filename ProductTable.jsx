
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductTable({ products, isLoading, onEdit, onRefresh }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product Name</TableHead>
          <TableHead>SS Cash</TableHead>
          <TableHead>SS Credit</TableHead>
          <TableHead>FS Cash</TableHead>
          <TableHead>FS Credit</TableHead>
          <TableHead>Inventory (Gal)</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.product_name}</TableCell>
            <TableCell className="font-bold text-green-600">${product.self_service_cash_price?.toFixed(3)}</TableCell>
            <TableCell>${product.self_service_credit_price?.toFixed(3)}</TableCell>
            <TableCell className="font-bold text-green-600">${product.full_service_cash_price?.toFixed(3)}</TableCell>
            <TableCell>${product.full_service_credit_price?.toFixed(3)}</TableCell>
            <TableCell>
              <Badge variant={product.inventory_gallons < product.low_inventory_threshold ? "destructive" : "secondary"}>
                {product.inventory_gallons?.toLocaleString()}
              </Badge>
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                <Pencil className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
