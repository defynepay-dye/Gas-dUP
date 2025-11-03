
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { InventoryItem, LotteryTicket } from '@/api/entities';
import { Upload, Brain, CheckCircle, AlertTriangle, Loader2, Package, Ticket, ShoppingBag } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function UniversalProductImporter({ onImportComplete, onClose }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [step, setStep] = useState('upload');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setProcessedData(null);
      setImportResults(null);
      setStep('upload');
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const aiPrompt = `
You are an intelligent product data analyzer for a convenience store/fuel station POS system.

Analyze this file (CSV, Excel, or any format) and extract ALL products across ALL categories.

The file may contain:
- Tobacco products (cigarettes, smokeless, cigars, vape) with pack/carton/roll/case UPCs
- Lottery games with game numbers, ticket prices, and roll sizes
- General merchandise (beverages, snacks, candy, food, automotive, personal care)
- CPG products with various pack configurations
- Alcohol products with bottles/cases

For EACH product, intelligently extract and return a JSON array where each object has:

{
  "product_type": "lottery" | "inventory_item",
  
  // For product_type === "lottery":
  "lottery_data": {
    "game_name": "string",
    "game_number": "string",
    "ticket_price": number,
    "roll_size": number (tickets per roll, typically 200-300),
    "commission_rate": number (default 5% if not specified)
  },
  
  // For product_type === "inventory_item":
  "inventory_data": {
    "product_name": "string",
    "upc_code": "string (smallest unit UPC)",
    "category": "tobacco" | "alcohol" | "beverages" | "snacks" | "candy" | "food" | "automotive" | "personal_care" | "other",
    "brand": "string",
    "manufacturer": "string",
    "cash_price": number (if available, else 0),
    "pack_structure": {
      "singles_per_box": number (use industry standards: cigarettes=10, soda 6-pack=6, etc.),
      "boxes_per_case": number (typically 1 for most products unless multi-tier),
      "box_upc": "string or null",
      "case_upc": "string or null"
    },
    "compliance_flags": {
      "age_restricted": boolean (true for tobacco/alcohol/lottery),
      "tobacco_product": boolean,
      "alcohol_product": boolean
    }
  }
}

**Intelligence Guidelines:**
- Detect lottery products by keywords: "game", "ticket", "roll", "$1", "$2", etc.
- Infer pack_structure from product names/descriptions (e.g., "12 oz Can 24pk" = singles_per_box: 24)
- Use CONEXXUS-standard packaging hierarchies
- Set age_restricted=true for tobacco, alcohol, lottery
- If unclear, default to singles_per_box=1, boxes_per_case=1

Return ONLY valid JSON array, no other text.
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_type: { type: "string", enum: ["lottery", "inventory_item"] },
                  lottery_data: {
                    type: "object",
                    properties: {
                      game_name: { type: "string" },
                      game_number: { type: "string" },
                      ticket_price: { type: "number" },
                      roll_size: { type: "number" },
                      commission_rate: { type: "number" }
                    }
                  },
                  inventory_data: {
                    type: "object",
                    properties: {
                      product_name: { type: "string" },
                      upc_code: { type: "string" },
                      category: { type: "string" },
                      brand: { type: "string" },
                      manufacturer: { type: "string" },
                      cash_price: { type: "number" },
                      pack_structure: {
                        type: "object",
                        properties: {
                          singles_per_box: { type: "integer" },
                          boxes_per_case: { type: "integer" },
                          box_upc: { type: "string" },
                          case_upc: { type: "string" }
                        }
                      },
                      compliance_flags: {
                        type: "object",
                        properties: {
                          age_restricted: { type: "boolean" },
                          tobacco_product: { type: "boolean" },
                          alcohol_product: { type: "boolean" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setProcessedData(response.products || []);
      setStep('review');
    } catch (error) {
      console.error('AI processing error:', error);
      alert('Failed to process file. Please check the format and try again.');
    }
    setIsProcessing(false);
  };

  const handleConfirmImport = async () => {
    setIsProcessing(true);
    const results = {
      lottery: { success: 0, failed: 0, errors: [] },
      inventory: { success: 0, failed: 0, errors: [] }
    };

    for (const product of processedData) {
      try {
        if (product.product_type === 'lottery' && product.lottery_data) {
          await LotteryTicket.create({
            ...product.lottery_data,
            tickets_remaining: product.lottery_data.roll_size,
            last_ticket_sold: "000",
            activation_date: new Date().toISOString().split('T')[0],
            active: true
          });
          results.lottery.success++;
        } else if (product.product_type === 'inventory_item' && product.inventory_data) {
          const invData = product.inventory_data;
          await InventoryItem.create({
            ...invData,
            selling_units: [{
              unit_type: "single",
              unit_price: invData.cash_price || 0,
              quantity_multiplier: 1,
              active: true
            }],
            inventory_tracking: {
              quantity_on_hand_singles: 0,
              cost_method: "weighted_average",
              weighted_average_cost: 0
            },
            receiving_info: {
              preferred_receiving_unit: "case",
              enable_box_receiving: true,
              enable_case_receiving: true
            },
            active: true
          });
          results.inventory.success++;
        }
      } catch (error) {
        if (product.product_type === 'lottery') {
          results.lottery.failed++;
          results.lottery.errors.push(`${product.lottery_data?.game_name}: ${error.message}`);
        } else {
          results.inventory.failed++;
          results.inventory.errors.push(`${product.inventory_data?.product_name}: ${error.message}`);
        }
      }
    }

    setImportResults(results);
    setStep('complete');
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Universal AI Product Importer
          </h2>
          <p className="text-gray-600 mt-1">
            Import ANY products—tobacco, lottery, general merchandise, alcohol, CPG. 
            The AI automatically detects product types and configures them correctly.
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {step === 'upload' && (
            <>
              <Alert className="bg-blue-50 border-blue-200">
                <Package className="w-4 h-4 text-blue-600" />
                <AlertDescription>
                  <strong>Supported Formats:</strong> Excel (.xlsx, .xls), CSV, or structured text files.
                  <br /><strong>What it handles:</strong> Lottery rolls, tobacco products, beverages, snacks, alcohol—everything.
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
                {file && (
                  <p className="mt-3 text-sm text-gray-600">
                    Selected: <strong>{file.name}</strong>
                  </p>
                )}
              </div>

              {file && (
                <Button
                  onClick={processFile}
                  disabled={isProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      AI Analyzing File...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Process with AI
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {step === 'review' && processedData && (
            <>
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription>
                  <strong>AI Analysis Complete:</strong> Found {processedData.length} products.
                </AlertDescription>
              </Alert>

              <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                {processedData.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {product.product_type === 'lottery' ? (
                        <>
                          <Ticket className="w-5 h-5 text-yellow-600" />
                          <div>
                            <p className="font-medium">{product.lottery_data?.game_name}</p>
                            <p className="text-xs text-gray-500">
                              Game #{product.lottery_data?.game_number} • ${product.lottery_data?.ticket_price} • Roll of {product.lottery_data?.roll_size}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Package className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{product.inventory_data?.product_name}</p>
                            <p className="text-xs text-gray-500">
                              {product.inventory_data?.category} • {product.inventory_data?.upc_code}
                              {product.inventory_data?.pack_structure && 
                                ` • ${product.inventory_data.pack_structure.singles_per_box}x${product.inventory_data.pack_structure.boxes_per_case}`
                              }
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <Badge variant={product.product_type === 'lottery' ? 'default' : 'secondary'}>
                      {product.product_type === 'lottery' ? 'Lottery' : product.inventory_data?.category}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Import
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {step === 'complete' && importResults && (
            <>
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription>
                  <strong>Import Complete!</strong>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Inventory Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{importResults.inventory.success}</p>
                    <p className="text-xs text-gray-500">Successfully imported</p>
                    {importResults.inventory.failed > 0 && (
                      <p className="text-sm text-red-600 mt-2">{importResults.inventory.failed} failed</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      Lottery Games
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{importResults.lottery.success}</p>
                    <p className="text-xs text-gray-500">Successfully imported</p>
                    {importResults.lottery.failed > 0 && (
                      <p className="text-sm text-red-600 mt-2">{importResults.lottery.failed} failed</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {(importResults.inventory.errors.length > 0 || importResults.lottery.errors.length > 0) && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription>
                    <strong>Some items failed:</strong>
                    <ul className="list-disc ml-4 mt-2 text-xs">
                      {[...importResults.inventory.errors, ...importResults.lottery.errors].map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={() => {
                setStep('upload');
                setFile(null);
                setProcessedData(null);
                setImportResults(null);
                if (onImportComplete) onImportComplete();
              }} className="w-full">
                Import More Products
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
