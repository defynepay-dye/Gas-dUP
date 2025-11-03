
import React, { useState, useEffect } from 'react';
import { InventoryItem, InventoryReceiving, Supplier } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Scan, Plus, Trash2, Save, Package, Box, Layers } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ReceivingItem structure:
// {
//   upc_code: string,
//   product_name: string,
//   received_unit_type: 'single' | 'box' | 'case',
//   quantity_received: number,
//   unit_cost: number,
//   total_cost: number,
//   singles_added_to_inventory: number,
//   lot_number?: string,
//   expiration_date?: string,
//   pack_structure?: object
// }

export default function InventoryReceivingModal({ onClose, onRefresh }) {
  const [receivingNumber, setReceivingNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [scannedUPC, setScannedUPC] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    generateReceivingNumber();
    loadSuppliers();
  }, []);

  const generateReceivingNumber = () => {
    const timestamp = Date.now().toString().slice(-8);
    setReceivingNumber(`RCV-${timestamp}`);
  };

  const loadSuppliers = async () => {
    try {
      const data = await Supplier.list();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleUPCScan = async (upc) => {
    if (!upc || upc.trim() === '') return;

    setIsScanning(true);
    try {
      const allProducts = await InventoryItem.list();
      const product = allProducts.find(p =>
        p.upc_code === upc ||
        p.pack_structure?.box_upc === upc ||
        p.pack_structure?.case_upc === upc
      );

      if (product) {
        let receivedUnitType = 'single';
        let singlesMultiplier = 1;

        // NEW: Respect pack structure and receiving configuration
        // Prioritize case UPC, then box UPC, then default to single
        if (product.pack_structure?.case_upc === upc && product.receiving_info?.enable_case_receiving !== false) {
          receivedUnitType = 'case';
          singlesMultiplier = (product.pack_structure.singles_per_box || 1) * (product.pack_structure.boxes_per_case || 1);
        } else if (product.pack_structure?.box_upc === upc && product.receiving_info?.enable_box_receiving !== false) {
          receivedUnitType = 'box';
          singlesMultiplier = product.pack_structure.singles_per_box || 1;
        }
        // If neither case nor box UPC matched (or were disabled), it remains 'single' with multiplier 1.

        // Use preferred receiving unit if scanning the primary UPC (upc_code)
        if (upc === product.upc_code && product.receiving_info?.preferred_receiving_unit) {
          receivedUnitType = product.receiving_info.preferred_receiving_unit;
          
          if (receivedUnitType === 'case' && product.pack_structure) {
            singlesMultiplier = (product.pack_structure.singles_per_box || 1) * (product.pack_structure.boxes_per_case || 1);
          } else if (receivedUnitType === 'box' && product.pack_structure) {
            singlesMultiplier = product.pack_structure.singles_per_box || 1;
          } else if (receivedUnitType === 'single') { // Explicitly handle 'single' if it's the preferred unit
            singlesMultiplier = 1;
          }
        }

        const currentUnitCostPerSingle = product.inventory_tracking?.weighted_average_cost || 0;

        const existingItemIndex = items.findIndex(i => i.upc_code === product.upc_code);

        if (existingItemIndex >= 0) {
          const updatedItems = [...items];
          const itemToUpdate = updatedItems[existingItemIndex];
          
          itemToUpdate.quantity_received += 1;
          itemToUpdate.singles_added_to_inventory = itemToUpdate.quantity_received * singlesMultiplier;
          itemToUpdate.total_cost = itemToUpdate.singles_added_to_inventory * itemToUpdate.unit_cost;
          setItems(updatedItems);
        } else {
          setItems([...items, {
            upc_code: product.upc_code,
            product_name: product.product_name,
            received_unit_type: receivedUnitType,
            quantity_received: 1,
            unit_cost: currentUnitCostPerSingle,
            singles_added_to_inventory: singlesMultiplier,
            total_cost: currentUnitCostPerSingle * singlesMultiplier,
            pack_structure: product.pack_structure
          }]);
        }

        setScannedUPC('');
        setTimeout(() => document.getElementById('upc-scan-input')?.focus(), 100);
      } else {
        alert(`Product with UPC ${upc} not found in inventory.`);
      }
    } catch (error) {
      console.error('Error finding product:', error);
      alert('Error finding product. Please check console.');
    }
    setIsScanning(false);
  };

  const handleSave = async () => {
    if (!supplier || items.length === 0) {
      alert('Please select a supplier and add at least one item.');
      return;
    }

    setIsSaving(true);
    try {
      await InventoryReceiving.create({
        receiving_number: receivingNumber,
        supplier,
        invoice_number: invoiceNumber,
        received_date: new Date(receivedDate).toISOString(),
        receiving_method: 'barcode_scan',
        items_received: items.map(item => ({
            upc_code: item.upc_code,
            product_name: item.product_name,
            received_unit_type: item.received_unit_type,
            quantity_received: item.quantity_received,
            unit_cost: item.unit_cost,
            total_cost: item.total_cost,
            singles_added_to_inventory: item.singles_added_to_inventory,
            lot_number: item.lot_number || '',
            expiration_date: item.expiration_date || ''
        })),
        total_invoice_amount: items.reduce((sum, item) => sum + item.total_cost, 0),
        status: 'processed',
        processed_by: 'Current User'
      });

      for (const item of items) {
        const products = await InventoryItem.filter({ upc_code: item.upc_code });
        if (products.length > 0) {
          const product = products[0];
          let updatedProduct = { ...product };

          if (!updatedProduct.inventory_tracking) {
            updatedProduct.inventory_tracking = {
              quantity_on_hand_singles: 0,
              cost_method: 'weighted_average',
              weighted_average_cost: 0,
              fifo_layers: []
            };
          }

          updatedProduct.inventory_tracking.quantity_on_hand_singles =
            (updatedProduct.inventory_tracking.quantity_on_hand_singles || 0) + item.singles_added_to_inventory;

          if (updatedProduct.inventory_tracking.cost_method === 'weighted_average') {
              const currentTotalValue = (product.inventory_tracking.quantity_on_hand_singles || 0) *
                                       (product.inventory_tracking.weighted_average_cost || 0);
              const receivedTotalValue = item.singles_added_to_inventory * item.unit_cost;
              const totalQuantityAfterReceiving = (product.inventory_tracking.quantity_on_hand_singles || 0) + item.singles_added_to_inventory;

              updatedProduct.inventory_tracking.weighted_average_cost = totalQuantityAfterReceiving > 0
                  ? (currentTotalValue + receivedTotalValue) / totalQuantityAfterReceiving
                  : 0;
          } else if (updatedProduct.inventory_tracking.cost_method === 'fifo') {
              updatedProduct.inventory_tracking.fifo_layers = [
                ...(product.inventory_tracking.fifo_layers || []),
                {
                  quantity: item.singles_added_to_inventory,
                  unit_cost: item.unit_cost,
                  received_date: new Date().toISOString(),
                  lot_number: item.lot_number || ''
                }
              ];
          }

          updatedProduct.receiving_info = {
            ...product.receiving_info,
            last_received_date: new Date().toISOString(),
            last_received_cost: item.unit_cost
          };

          await InventoryItem.update(product.id, updatedProduct);
        }
      }

      alert(`Successfully received ${items.length} items!`);
      if (onRefresh) onRefresh();
      onClose();
    } catch (error) {
      console.error('Error saving receiving:', error);
      alert('Failed to save receiving. Please try again.');
    }
    setIsSaving(false);
  };

  const addManualItem = () => {
    setItems([...items, {
      upc_code: '',
      product_name: 'Manual Item (Edit)',
      received_unit_type: 'single',
      quantity_received: 1,
      unit_cost: 0,
      total_cost: 0,
      singles_added_to_inventory: 1,
      pack_structure: null
    }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Receive Inventory - Multi-Level UPC Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <Package className="w-4 h-4 text-blue-600" />
            <AlertDescription>
              <strong>Smart UPC Scanning:</strong> Scan any UPC level (single, box/roll, or case/carton).
              The system automatically calculates total singles received based on pack structure.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Receiving #</Label>
              <Input value={receivingNumber} disabled />
            </div>
            <div>
              <Label>Supplier</Label>
              <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.supplier_name}>{s.supplier_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Invoice #</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-12345"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="upc-scan-input">Scan UPC (Any Level)</Label>
            <div className="flex gap-2">
              <Input
                id="upc-scan-input"
                value={scannedUPC}
                onChange={(e) => setScannedUPC(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUPCScan(scannedUPC);
                  }
                }}
                placeholder="Scan barcode here..."
                disabled={isScanning}
                autoFocus
              />
              <Button
                onClick={() => handleUPCScan(scannedUPC)}
                disabled={isScanning || !scannedUPC}
              >
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Supports: Individual UPC, Box/Roll UPC, Case/Carton UPC
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Received Items ({items.length})</Label>
              <Button variant="outline" size="sm" onClick={addManualItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Manually
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-left">UPC Level</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="p-2 text-left">Singles</th>
                    <th className="p-2 text-left">Cost (per single)</th>
                    <th className="p-2 text-left">Total</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{item.product_name || `(${item.upc_code})`}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          {item.received_unit_type === 'case' && <Layers className="w-4 h-4 text-purple-600" />}
                          {item.received_unit_type === 'box' && <Box className="w-4 h-4 text-blue-600" />}
                          {item.received_unit_type === 'single' && <Package className="w-4 h-4 text-green-600" />}
                          <span className="text-xs capitalize">{item.received_unit_type}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={item.quantity_received}
                          onChange={(e) => {
                            const newQty = parseInt(e.target.value) || 0;
                            const updatedItems = [...items];
                            const itemToUpdate = updatedItems[index];

                            let singlesMultiplier = 1;
                            if (itemToUpdate.pack_structure) {
                                switch (itemToUpdate.received_unit_type) {
                                    case 'case':
                                        singlesMultiplier = (itemToUpdate.pack_structure.singles_per_box || 1) * (itemToUpdate.pack_structure.boxes_per_case || 1);
                                        break;
                                    case 'box':
                                        singlesMultiplier = itemToUpdate.pack_structure.singles_per_box || 1;
                                        break;
                                    case 'single':
                                        singlesMultiplier = 1;
                                        break;
                                }
                            }
                            itemToUpdate.quantity_received = newQty;
                            itemToUpdate.singles_added_to_inventory = newQty * singlesMultiplier;
                            itemToUpdate.total_cost = itemToUpdate.singles_added_to_inventory * itemToUpdate.unit_cost;
                            setItems(updatedItems);
                          }}
                          className="w-16"
                        />
                      </td>
                      <td className="p-2 font-semibold">{item.singles_added_to_inventory}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_cost}
                          onChange={(e) => {
                            const newCost = parseFloat(e.target.value) || 0;
                            const updatedItems = [...items];
                            const itemToUpdate = updatedItems[index];
                            itemToUpdate.unit_cost = newCost;
                            itemToUpdate.total_cost = newCost * itemToUpdate.singles_added_to_inventory;
                            setItems(updatedItems);
                          }}
                          className="w-24"
                        />
                      </td>
                      <td className="p-2 font-semibold">${item.total_cost.toFixed(2)}</td>
                      <td className="p-2">
                        <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Scan UPCs or add items manually
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">Total Invoice Amount:</p>
              <p className="text-2xl font-bold">
                ${items.reduce((sum, item) => sum + item.total_cost, 0).toFixed(2)}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || items.length === 0 || !supplier}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Complete Receiving
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
