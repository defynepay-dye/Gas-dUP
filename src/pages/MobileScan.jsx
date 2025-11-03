import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, InventoryReceiving, User, Location } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, Package, CheckCircle, AlertCircle, Plus, Minus, 
  Save, Trash2, List, Sparkles, Search, X, RefreshCw, Keyboard
} from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';

export default function MobileScanPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [scannedItems, setScannedItems] = useState([]);
  const [manualUPC, setManualUPC] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReceiving, setShowReceiving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    loadUserData();
    // Auto-focus the input field for quick scanning
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const loadUserData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // Get location from localStorage or user's assigned location
      const savedLocationId = localStorage.getItem('current_location_id');
      const locationId = savedLocationId || user.assigned_location_id;
      
      if (locationId) {
        const locations = await Location.list();
        const location = locations.find(loc => loc.id === locationId);
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      alert("Please log in to use the scanner");
    }
  };

  const handleScannedUPC = async (upc) => {
    if (!upc || upc.trim() === '') return;
    
    setIsLoading(true);
    
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    try {
      // Look up product in inventory
      const existingItems = await InventoryItem.filter({ upc_code: upc });
      
      if (existingItems && existingItems.length > 0) {
        // Product exists
        const item = existingItems[0];
        addItemToReceiving(item, 1);
      } else {
        // Product not found - use AI to identify
        await identifyProductWithAI(upc);
      }
    } catch (error) {
      console.error("Error looking up product:", error);
      alert("Error looking up product");
    } finally {
      setIsLoading(false);
    }
  };

  const identifyProductWithAI = async (upc) => {
    try {
      const prompt = `Look up product information for UPC/Barcode: ${upc}
      
      Provide the following information:
      - Product name
      - Brand
      - Category (choose from: tobacco, alcohol, beverages, snacks, automotive, personal_care, candy, food, other)
      - Typical retail price
      - Pack size/quantity
      
      If you cannot find this UPC, return null for all fields.`;
      
      const result = await InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            product_name: { type: "string" },
            brand: { type: "string" },
            category: { type: "string" },
            suggested_price: { type: "number" },
            pack_size: { type: "string" },
            found: { type: "boolean" }
          }
        }
      });
      
      if (result.found) {
        // Create new inventory item
        const newItem = {
          upc_code: upc,
          product_name: result.product_name,
          brand: result.brand,
          category: result.category || 'other',
          cash_price: result.suggested_price || 0,
          location_id: currentLocation?.id,
          inventory_tracking: {
            quantity_on_hand_singles: 0,
            cost_method: 'weighted_average'
          },
          active: true
        };
        
        const createdItem = await InventoryItem.create(newItem);
        addItemToReceiving(createdItem, 1);
        
        alert(`✅ New product added: ${result.product_name}`);
      } else {
        // Product not found even with AI
        const productName = window.prompt(`Product not found for UPC ${upc}. Enter product name:`);
        if (productName) {
          const newItem = {
            upc_code: upc,
            product_name: productName,
            category: 'other',
            cash_price: 0,
            location_id: currentLocation?.id,
            inventory_tracking: {
              quantity_on_hand_singles: 0,
              cost_method: 'weighted_average'
            },
            active: true
          };
          
          const createdItem = await InventoryItem.create(newItem);
          addItemToReceiving(createdItem, 1);
        }
      }
    } catch (error) {
      console.error("Error identifying product with AI:", error);
      alert("Could not identify product. Please add manually.");
    }
  };

  const addItemToReceiving = (item, quantity) => {
    setScannedItems(prevItems => {
      const existingIndex = prevItems.findIndex(i => i.upc_code === item.upc_code);
      
      if (existingIndex > -1) {
        // Item already in list - increment quantity
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        // New item
        return [...prevItems, {
          ...item,
          quantity: quantity,
          unit_cost: item.inventory_tracking?.weighted_average_cost || 0
        }];
      }
    });
    
    // Show success feedback
    setShowReceiving(true);
  };

  const handleManualEntry = async (e) => {
    if (e) e.preventDefault();
    if (!manualUPC) return;
    
    await handleScannedUPC(manualUPC);
    setManualUPC('');
    
    // Re-focus input for next scan
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const updateItemQuantity = (upc, delta) => {
    setScannedItems(prevItems => 
      prevItems.map(item => {
        if (item.upc_code === upc) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const updateItemCost = (upc, cost) => {
    setScannedItems(prevItems => 
      prevItems.map(item => 
        item.upc_code === upc ? { ...item, unit_cost: parseFloat(cost) || 0 } : item
      )
    );
  };

  const handleSaveReceiving = async () => {
    if (scannedItems.length === 0) {
      alert("No items to receive");
      return;
    }
    
    if (!window.confirm(`Save receiving for ${scannedItems.length} items?`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create receiving document
      const receivingDoc = {
        receiving_number: `RCV-${Date.now()}`,
        supplier: "Walk-in / Manual Scan",
        invoice_number: "MOBILE-" + Date.now(),
        received_date: new Date().toISOString(),
        receiving_method: "barcode_scan",
        items_received: scannedItems.map(item => ({
          upc_code: item.upc_code,
          product_name: item.product_name,
          received_unit_type: "single",
          quantity_received: item.quantity,
          unit_cost: item.unit_cost,
          total_cost: item.quantity * item.unit_cost,
          singles_added_to_inventory: item.quantity
        })),
        total_invoice_amount: scannedItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0),
        status: "processed",
        processed_by: currentUser?.full_name || "Mobile User"
      };
      
      await InventoryReceiving.create(receivingDoc);
      
      // Update inventory quantities
      for (const item of scannedItems) {
        const currentQty = item.inventory_tracking?.quantity_on_hand_singles || 0;
        await InventoryItem.update(item.id, {
          inventory_tracking: {
            ...item.inventory_tracking,
            quantity_on_hand_singles: currentQty + item.quantity,
            weighted_average_cost: item.unit_cost || item.inventory_tracking?.weighted_average_cost || 0
          }
        });
      }
      
      alert("✅ Receiving saved successfully!");
      setScannedItems([]);
      setShowReceiving(false);
    } catch (error) {
      console.error("Error saving receiving:", error);
      alert("Failed to save receiving");
    } finally {
      setIsLoading(false);
    }
  };

  const totalItems = scannedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = scannedItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-6 h-6" />
              Mobile Inventory Scanner
            </CardTitle>
            {currentLocation && (
              <p className="text-sm text-blue-100">
                Location: {currentLocation.location_name}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Scanner Section */}
        <Card className="border-4 border-blue-500">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <Keyboard className="w-16 h-16 mx-auto mb-4 text-blue-600" />
              <h3 className="text-xl font-bold mb-2">Scan or Enter Barcode</h3>
              <p className="text-gray-600 mb-4">
                Use a Bluetooth barcode scanner or type manually
              </p>
            </div>

            {/* Barcode Input */}
            <form onSubmit={handleManualEntry} className="space-y-3">
              <div>
                <Label className="text-lg font-semibold mb-2 block">
                  UPC/Barcode
                </Label>
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Scan or type barcode..."
                    value={manualUPC}
                    onChange={(e) => setManualUPC(e.target.value)}
                    className="flex-1 text-lg h-14 text-center font-mono"
                    autoFocus
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit"
                    disabled={!manualUPC || isLoading}
                    className="h-14 px-6 bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Search className="w-6 h-6" />
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <h4 className="font-semibold text-blue-900 mb-2">How to Use:</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• Connect a Bluetooth barcode scanner and scan products</li>
                <li>• Or manually type/paste UPC codes</li>
                <li>• Press Enter or tap the search button</li>
                <li>• AI will identify unknown products automatically</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Scanned Items Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <List className="w-5 h-5" />
              Scanned Items ({totalItems})
            </CardTitle>
            {scannedItems.length > 0 && (
              <Button 
                onClick={() => setShowReceiving(!showReceiving)}
                variant="outline"
                size="sm"
              >
                {showReceiving ? "Hide" : "Show"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {scannedItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No items scanned yet</p>
                <p className="text-sm mt-1">Start scanning barcodes above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total Items</p>
                    <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Value</p>
                    <p className="text-2xl font-bold text-green-600">${totalValue.toFixed(2)}</p>
                  </div>
                </div>

                {/* Item List */}
                {showReceiving && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {scannedItems.map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{item.product_name}</h4>
                            <p className="text-xs text-gray-500">UPC: {item.upc_code}</p>
                            {item.brand && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {item.brand}
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 h-8 w-8"
                            onClick={() => updateItemQuantity(item.upc_code, -item.quantity)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => updateItemQuantity(item.upc_code, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-12 text-center font-semibold">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => updateItemQuantity(item.upc_code, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="flex-1">
                            <Label className="text-xs">Cost ea.</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_cost}
                              onChange={(e) => updateItemCost(item.upc_code, e.target.value)}
                              className="h-8 text-sm"
                              placeholder="0.00"
                            />
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="font-bold text-green-600">
                              ${(item.quantity * item.unit_cost).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t">
                  <Button
                    onClick={handleSaveReceiving}
                    disabled={isLoading || scannedItems.length === 0}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Save Receiving ({scannedItems.length} items)
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      if (window.confirm('Clear all scanned items?')) {
                        setScannedItems([]);
                        setShowReceiving(false);
                      }
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Items
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Helper Card */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-purple-900 mb-1">AI-Powered Assistant</h4>
                <p className="text-sm text-purple-700">
                  Unknown products are automatically identified using AI and internet search. 
                  Product information, pricing, and categories are filled in for you!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}