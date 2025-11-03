
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Scan, X, AlertTriangle, Brain, Plus, DollarSign, Loader2 } from "lucide-react"; // Added Loader2
import { InvokeLLM } from "@/api/integrations";
import { InventoryItem, User } from "@/api/entities";

export default function Scanner({ 
  inventory, 
  onAddToCart, 
  onClose, 
  pricingSettings,
  onAddNewProduct
}) {
  const [scannedCode, setScannedCode] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPriceOverride, setShowPriceOverride] = useState(false);
  const [overridePrice, setOverridePrice] = useState(""); // This will store the overridden UNIT price
  const [selectedItem, setSelectedItem] = useState(null); // This state is currently unused in the provided code logic
  const [isAILookup, setIsAILookup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to load current user:", error);
    }
  };

  const canOverridePrice = () => {
    return currentUser && (
      currentUser.role === 'admin' || 
      currentUser.role === 'store_manager' ||
      (currentUser.permissions && currentUser.permissions.includes('can_override_price'))
    );
  };

  const handleScan = async (code) => {
    if (!code.trim()) return;
    
    setIsSearching(true);
    const cleanCode = code.trim();
    
    // First, search existing inventory with enhanced UPC matching (main, box, case)
    let foundProduct = null;
    let sellingQuantity = 1;
    let scannedUpcLevel = 'single';
    let unitPrice = 0; // Price per single unit

    foundProduct = inventory.find(p => 
      p.upc_code === cleanCode || 
      p.pack_structure?.box_upc === cleanCode || 
      p.pack_structure?.case_upc === cleanCode
    );

    if (foundProduct) {
      unitPrice = foundProduct.cash_price || foundProduct.selling_units?.[0]?.unit_price || 0;
      let totalPrice = unitPrice;

      if (foundProduct.pack_structure?.case_upc === cleanCode) {
        sellingQuantity = (foundProduct.pack_structure.singles_per_box || 1) * (foundProduct.pack_structure.boxes_per_case || 1);
        totalPrice = unitPrice * sellingQuantity;
        scannedUpcLevel = 'case';
      } else if (foundProduct.pack_structure?.box_upc === cleanCode) {
        sellingQuantity = foundProduct.pack_structure.singles_per_box || 1;
        totalPrice = unitPrice * sellingQuantity;
        scannedUpcLevel = 'box';
      }
      // If it's the main upc_code, it's a single, which are the initial values.
      
      const modifiedProduct = {
        ...foundProduct,
        quantity: sellingQuantity,
        unit_price: unitPrice, // Base unit price for the product definition
        total_price: totalPrice, // Total price for the scanned quantity (base unit price * quantity)
        scanned_upc_level: scannedUpcLevel
      };
      setSearchResults([modifiedProduct]);
      setIsSearching(false);
      return;
    }
    
    // If no exact match by UPC, search for partial matches (product name, brand)
    const partialMatches = inventory.filter(item =>
      item.product_name.toLowerCase().includes(cleanCode.toLowerCase()) ||
      item.brand?.toLowerCase().includes(cleanCode.toLowerCase())
    ).slice(0, 5);
    
    if (partialMatches.length > 0) {
      // For partial matches, assume single unit scan initially
      const modifiedPartialMatches = partialMatches.map(item => ({
        ...item,
        quantity: 1,
        unit_price: item.cash_price || item.selling_units?.[0]?.unit_price || 0,
        total_price: item.cash_price || item.selling_units?.[0]?.unit_price || 0,
        scanned_upc_level: 'single'
      }));
      setSearchResults(modifiedPartialMatches);
      setIsSearching(false);
      return;
    }
    
    // If no matches found, use AI to look up the product
    setIsAILookup(true);
    try {
      const aiResponse = await InvokeLLM({
        prompt: `Look up product information for UPC/barcode: ${cleanCode}. If this appears to be a UPC code, provide detailed product information. If it's a product name or partial search, find the most likely convenience store product.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            product_name: { type: "string" },
            upc_code: { type: "string" },
            category: { 
              type: "string", 
              enum: ["tobacco", "alcohol", "beverages", "snacks", "automotive", "personal_care", "candy", "food", "lottery", "other"] 
            },
            brand: { type: "string" },
            estimated_price: { type: "number" },
            vendor: { type: "string" },
            age_restricted: { type: "boolean" },
            confidence: { type: "number", minimum: 0, maximum: 1 }
          }
        }
      });
      
      if (aiResponse && aiResponse.product_name && aiResponse.confidence > 0.6) {
        // Create a new product entry
        const newProduct = {
          id: `ai_${Date.now()}`,
          upc_code: aiResponse.upc_code || cleanCode,
          product_name: aiResponse.product_name,
          category: aiResponse.category || "other",
          brand: aiResponse.brand || "Unknown",
          cash_price: aiResponse.estimated_price || 0,
          compliance_flags: {
            age_restricted: aiResponse.age_restricted || false
          },
          tax_rate: 8.25, // Default tax rate
          vendor: aiResponse.vendor || "AI Identified",
          isNewProduct: true, // Flag to identify AI-created products
          confidence: aiResponse.confidence,
          // Add default quantities/prices for AI identified products (assumed single)
          quantity: 1,
          unit_price: aiResponse.estimated_price || 0,
          total_price: aiResponse.estimated_price || 0,
          scanned_upc_level: 'single'
        };
        
        setSearchResults([newProduct]);
      } else {
        // Show manual entry option
        setSearchResults([{
          id: `manual_${Date.now()}`,
          upc_code: cleanCode,
          product_name: "Unknown Product - Click to Add",
          category: "other", 
          cash_price: 0,
          isManualEntry: true,
          // Add default quantities/prices for manual entry (assumed single)
          quantity: 1,
          unit_price: 0,
          total_price: 0,
          scanned_upc_level: 'single'
        }]);
      }
    } catch (error) {
      console.error("AI lookup failed:", error);
      // Fallback to manual entry
      setSearchResults([{
        id: `manual_${Date.now()}`,
        upc_code: cleanCode,
        product_name: "Unknown Product - Click to Add",
        category: "other", 
        cash_price: 0,
        isManualEntry: true,
        // Add default quantities/prices for manual entry (assumed single)
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        scanned_upc_level: 'single'
      }]);
    }
    
    setIsAILookup(false);
    setIsSearching(false);
  };

  const handleAddToCart = (item) => {
    if (item.isManualEntry) {
      // Redirect to add new product
      onAddNewProduct(item.upc_code);
      return;
    }
    
    const itemToCart = { ...item }; // item from searchResults already has quantity, unit_price, total_price, scanned_upc_level

    if (showPriceOverride && overridePrice && canOverridePrice()) {
      const newOverrideUnitPrice = parseFloat(overridePrice);
      itemToCart.override_unit_price = newOverrideUnitPrice; // Store the overridden unit price
      itemToCart.original_unit_price = item.unit_price; // Store original unit price
      itemToCart.unit_price = newOverrideUnitPrice; // Update the effective unit price for this cart item
      itemToCart.total_price = newOverrideUnitPrice * itemToCart.quantity; // Recalculate total price
      itemToCart.priceOverride = true;
      itemToCart.overrideBy = currentUser.full_name;
    }
    // If no override, itemToCart already has calculated total_price and unit_price from handleScan
    
    onAddToCart(itemToCart);
    
    // If this was an AI-identified product, save it to the database
    if (item.isNewProduct && item.confidence > 0.8) {
      saveNewProduct(item); // Note: this saves the *original* AI product, not the overridden one
    }
    
    onClose();
  };

  const saveNewProduct = async (item) => {
    try {
      await InventoryItem.create({
        location_id: "main",
        upc_code: item.upc_code,
        product_name: item.product_name,
        category: item.category,
        brand: item.brand,
        cash_price: item.cash_price, // Use the AI-identified cash price as base
        pack_structure: {
          singles_per_box: 1,
          boxes_per_case: 1
        },
        selling_units: [{
          unit_type: "single",
          unit_price: item.cash_price, // Use the AI-identified cash price as base
          quantity_multiplier: 1,
          active: true
        }],
        inventory_tracking: {
          quantity_on_hand_singles: 1,
          cost_method: "weighted_average",
          weighted_average_cost: item.cash_price * 0.6 // Estimate cost
        },
        reorder_level: 10,
        compliance_flags: item.compliance_flags || {},
        tax_rate: item.tax_rate,
        vendor: item.vendor,
        auto_categorization: {
          last_updated: new Date().toISOString(),
          confidence_score: item.confidence,
          detected_brand: item.brand,
          detected_category: item.category,
          manual_override: false
        },
        active: true
      });
      console.log("New AI-identified product saved to inventory");
    } catch (error) {
      console.error("Failed to save new product:", error);
    }
  };

  const calculateDisplayPrice = (item) => {
    if (!pricingSettings?.dual_pricing_enabled) {
      // If no dual pricing, return the total for the quantity currently in the item object
      return item.total_price; 
    }
    
    const markupPercent = pricingSettings.credit_markup_percent_dry_stock || 0;
    // Use effective unit price (overridden or base unit_price)
    const effectiveUnitPrice = item.override_unit_price !== undefined ? item.override_unit_price : (item.unit_price || item.cash_price);
    return (effectiveUnitPrice * (1 + markupPercent / 100)) * item.quantity;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5" />
              Product Scanner
              {isAILookup && <Brain className="w-5 h-5 text-purple-500 animate-pulse" />}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Scan or type UPC/product name..."
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleScan(scannedCode);
                }
              }}
              className="flex-1 font-mono"
              disabled={isSearching}
            />
            <Button 
              onClick={() => handleScan(scannedCode)}
              disabled={isSearching || !scannedCode.trim()}
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Scan className="w-4 h-4 mr-2" />}
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>

          {isAILookup && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700">
                <Brain className="w-5 h-5 animate-pulse" />
                <span>AI is identifying this product...</span>
              </div>
            </div>
          )}

          {canOverridePrice() && (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showPriceOverride}
                  onChange={(e) => setShowPriceOverride(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Override Unit Price</span>
                <DollarSign className="w-4 h-4 text-green-600" />
              </label>
              {showPriceOverride && (
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Unit price"
                  value={overridePrice}
                  onChange={(e) => setOverridePrice(e.target.value)}
                  className="w-32"
                />
              )}
            </div>
          )}

          <div className="space-y-2">
            {searchResults.map((item) => (
              <div
                key={item.id}
                className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  item.isNewProduct ? 'border-purple-300 bg-purple-50' : 
                  item.isManualEntry ? 'border-orange-300 bg-orange-50' : 
                  'border-gray-200'
                }`}
                onClick={() => handleAddToCart(item)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      {item.brand && (
                        <Badge variant="outline" className="text-xs">
                          {item.brand}
                        </Badge>
                      )}
                      {item.isNewProduct && (
                        <Badge className="text-xs bg-purple-100 text-purple-800">
                          <Brain className="w-3 h-3 mr-1" />
                          AI Identified ({Math.round(item.confidence * 100)}%)
                        </Badge>
                      )}
                      {item.isManualEntry && (
                        <Badge className="text-xs bg-orange-100 text-orange-800">
                          <Plus className="w-3 h-3 mr-1" />
                          Add New
                        </Badge>
                      )}
                      {item.compliance_flags?.age_restricted && (
                        <Badge variant="destructive" className="text-xs">
                          Age Restricted
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">UPC: {item.upc_code}</p>
                  </div>
                  <div className="text-right">
                    {!item.isManualEntry && (
                      <div>
                        {item.scanned_upc_level && item.scanned_upc_level !== 'single' && (
                          <p className="text-sm text-gray-500">
                            {item.scanned_upc_level === 'box' ? 'Box' : 'Case'} ({item.quantity} units)
                          </p>
                        )}
                        {pricingSettings?.dual_pricing_enabled ? (
                          <div>
                            <p className="font-bold text-green-600">
                              Cash Total: ${item.total_price?.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Credit Total: ${calculateDisplayPrice(item).toFixed(2)}
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold">
                            Total: ${item.total_price?.toFixed(2)}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Unit Price: ${(item.override_unit_price !== undefined ? item.override_unit_price : (item.unit_price || item.cash_price))?.toFixed(2)}
                          {item.priceOverride && item.original_unit_price !== undefined && (
                            <span className="ml-1 text-orange-600">(Original Unit: ${item.original_unit_price.toFixed(2)})</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {searchResults.length === 0 && scannedCode && !isSearching && (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">Product Not Found</h3>
              <p className="text-sm">
                No products found for "{scannedCode}". The AI system will help identify new products automatically.
              </p>
            </div>
          )}

          {searchResults.length === 0 && !scannedCode && (
            <div className="text-center py-8 text-gray-500">
              <Scan className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">Ready to Scan</h3>
              <p className="text-sm">
                Use a barcode scanner or type a UPC code to search for products.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
