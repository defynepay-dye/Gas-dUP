import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, Box, Layers, Info } from 'lucide-react';
import { InventoryItem } from '@/api/entities';

export default function PackStructureEditor({ item, onClose, onSave }) {
  const [packStructure, setPackStructure] = useState({
    singles_per_box: item.pack_structure?.singles_per_box || 1,
    boxes_per_case: item.pack_structure?.boxes_per_case || 1,
    box_upc: item.pack_structure?.box_upc || '',
    case_upc: item.pack_structure?.case_upc || '',
  });

  const [receivingConfig, setReceivingConfig] = useState({
    enable_box_receiving: item.receiving_info?.enable_box_receiving ?? true,
    enable_case_receiving: item.receiving_info?.enable_case_receiving ?? true,
    preferred_receiving_unit: item.receiving_info?.preferred_receiving_unit || 'case',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await InventoryItem.update(item.id, {
        pack_structure: packStructure,
        receiving_info: {
          ...item.receiving_info,
          ...receivingConfig,
        }
      });
      onSave();
    } catch (error) {
      console.error('Error updating pack structure:', error);
      alert('Failed to update pack structure');
    }
    setIsSaving(false);
  };

  const totalSinglesInCase = packStructure.singles_per_box * packStructure.boxes_per_case;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pack Structure Configuration - {item.product_name}</DialogTitle>
        </DialogHeader>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription>
            <strong>CONEXXUS-Compliant Packaging:</strong> Define how this product is packaged for accurate receiving, 
            inventory tracking, and scan data reporting. This configuration ensures proper unit-level tracking 
            regardless of how inventory is received (singles, boxes/packs, or cases/cartons).
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {/* Pack Structure Definition */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Packaging Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="singles_per_box">Singles per Box/Pack</Label>
                  <Input
                    id="singles_per_box"
                    type="number"
                    min="1"
                    value={packStructure.singles_per_box}
                    onChange={(e) => setPackStructure({
                      ...packStructure,
                      singles_per_box: parseInt(e.target.value) || 1
                    })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    E.g., 10 packs in a carton, 5 cans in a roll
                  </p>
                </div>

                <div>
                  <Label htmlFor="boxes_per_case">Boxes per Case</Label>
                  <Input
                    id="boxes_per_case"
                    type="number"
                    min="1"
                    value={packStructure.boxes_per_case}
                    onChange={(e) => setPackStructure({
                      ...packStructure,
                      boxes_per_case: parseInt(e.target.value) || 1
                    })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Usually 1 for tobacco (carton is the case)
                  </p>
                </div>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-semibold text-green-900">
                  Total Singles per Case: {totalSinglesInCase}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  When you receive 1 case, inventory will increase by {totalSinglesInCase} singles
                </p>
              </div>
            </CardContent>
          </Card>

          {/* UPC Codes for Different Levels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                UPC Codes by Packaging Level
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Single Unit UPC (Primary)</Label>
                <Input
                  value={item.upc_code}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the primary UPC scanned at POS for individual sales
                </p>
              </div>

              <div>
                <Label htmlFor="box_upc">Box/Pack UPC (Optional)</Label>
                <Input
                  id="box_upc"
                  placeholder="e.g., Roll UPC, 6-Pack UPC, Inner Pack UPC"
                  value={packStructure.box_upc}
                  onChange={(e) => setPackStructure({
                    ...packStructure,
                    box_upc: e.target.value
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  UPC for intermediate packaging (rolls, 6-packs, inner boxes)
                </p>
              </div>

              <div>
                <Label htmlFor="case_upc">Case/Carton UPC (Optional)</Label>
                <Input
                  id="case_upc"
                  placeholder="e.g., Carton UPC, Case UPC, Master Pack UPC"
                  value={packStructure.case_upc}
                  onChange={(e) => setPackStructure({
                    ...packStructure,
                    case_upc: e.target.value
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  UPC for the largest shipping unit (cartons, cases, master packs)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Receiving Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Box className="w-5 h-5 text-orange-600" />
                Receiving Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <Label htmlFor="enable_box">Enable Box/Pack Receiving</Label>
                  <p className="text-xs text-gray-500">Allow receiving via box/pack UPC</p>
                </div>
                <Switch
                  id="enable_box"
                  checked={receivingConfig.enable_box_receiving}
                  onCheckedChange={(checked) => setReceivingConfig({
                    ...receivingConfig,
                    enable_box_receiving: checked
                  })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <Label htmlFor="enable_case">Enable Case/Carton Receiving</Label>
                  <p className="text-xs text-gray-500">Allow receiving via case/carton UPC</p>
                </div>
                <Switch
                  id="enable_case"
                  checked={receivingConfig.enable_case_receiving}
                  onCheckedChange={(checked) => setReceivingConfig({
                    ...receivingConfig,
                    enable_case_receiving: checked
                  })}
                />
              </div>

              <div>
                <Label>Preferred Receiving Unit (Default)</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={receivingConfig.preferred_receiving_unit}
                  onChange={(e) => setReceivingConfig({
                    ...receivingConfig,
                    preferred_receiving_unit: e.target.value
                  })}
                >
                  <option value="single">Single Units</option>
                  <option value="box">Box/Pack</option>
                  <option value="case">Case/Carton</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  This will be pre-selected when receiving this product
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Pack Structure'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}