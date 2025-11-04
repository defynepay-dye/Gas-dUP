import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from '@/api/base44Client';
import { InventoryItem } from '@/api/entities';
import { Upload, FileSpreadsheet, Brain, CheckCircle, AlertTriangle, Loader2, Download } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TobaccoProductImporter({ onImportComplete }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [step, setStep] = useState('upload'); // upload, review, complete

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
      // Step 1: Upload the file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Step 2: Use AI to intelligently extract and structure the data
      const aiPrompt = `
You are analyzing a multi-sheet tobacco/nicotine product Excel workbook.

The workbook contains these sheet types with the following columns:
1. Smokeless: Manufacturer, Brand Title, Can UPC, Roll UPC, SKU/UPC Name
2. Accessories: Manufacturer, Brand Title, Saleable Unit UPC, Packing Unit UPC, SKU/UPC Name
3. Cigarette: Manufacturer, Brand Title, Pack UPC, Carton UPC, SKU/UPC Description
4. Cigar: Manufacturer, Brand Title, Pack/Each UPC, Upright/Tray UPC, SKU/UPC Name
5. TDI: Manufacturer, Brand Title, Can UPC, Carton/Sleeve UPC, SKU/UPC Name
6. eVapor: Manufacturer, Brand Title, Saleable Unit UPC, Packing Unit UPC, SKU/UPC Name

For EACH product across ALL sheets, extract and return a JSON array where each object has:
- product_name: The SKU/UPC Name or Description
- manufacturer: The manufacturer name
- brand: The Brand Title
- upc_code: The SMALLEST unit UPC (Can UPC, Pack UPC, Saleable Unit UPC, or Pack/Each UPC)
- category: Infer from sheet type (smokeless, cigarette, cigar, accessories, evapor)
- pack_structure: An object with:
  - singles_per_box: Infer typical count (e.g., cans per roll, packs per carton). Use industry standards.
  - boxes_per_case: Usually 1 for tobacco (carton is often the largest unit)
  - box_upc: The intermediate UPC (Roll UPC, Packing Unit UPC, etc.) - can be null if not applicable
  - case_upc: The largest UPC (Carton UPC, Upright/Tray UPC, Carton/Sleeve UPC) - can be null if not applicable
- compliance_flags: Always set { age_restricted: true, tobacco_product: true }
- active: true

Use your knowledge of tobacco product packaging to infer realistic singles_per_box values:
- Cigarette packs per carton: typically 10
- Smokeless cans per roll: typically 5
- Cigar singles per upright: varies, use 20-25 as default
- eVapor devices per pack: typically 1-5

Return ONLY valid JSON array, no other text.
`;

      const extractedData = await base44.integrations.Core.InvokeLLM({
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
                  product_name: { type: "string" },
                  manufacturer: { type: "string" },
                  brand: { type: "string" },
                  upc_code: { type: "string" },
                  category: { type: "string" },
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
                      tobacco_product: { type: "boolean" }
                    }
                  },
                  active: { type: "boolean" }
                }
              }
            }
          }
        }
      });

      setProcessedData(extractedData.products || []);
      setStep('review');
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Failed to process file. Please check the file format and try again.');
    }
    setIsProcessing(false);
  };

  const confirmImport = async () => {
    if (!processedData || processedData.length === 0) return;

    setIsProcessing(true);
    try {
      // Enhance each product with required InventoryItem fields
      const inventoryItems = processedData.map(product => ({
        ...product,
        selling_units: [
          {
            unit_type: "single",
            unit_price: 0, // User will set prices later
            quantity_multiplier: 1,
            active: true
          }
        ],
        inventory_tracking: {
          quantity_on_hand_singles: 0,
          cost_method: "weighted_average",
          weighted_average_cost: 0
        },
        receiving_info: {
          preferred_receiving_unit: product.pack_structure?.case_upc ? "case" : "single"
        },
        reorder_level: 10 // Default, can be adjusted
      }));

      // Bulk create all products
      await base44.entities.InventoryItem.bulkCreate(inventoryItems);

      setImportResults({
        success: true,
        count: inventoryItems.length,
        message: `Successfully imported ${inventoryItems.length} tobacco/nicotine products.`
      });
      setStep('complete');

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Error importing products:', error);
      setImportResults({
        success: false,
        message: 'Failed to import products. Some items may already exist.'
      });
    }
    setIsProcessing(false);
  };

  const downloadSampleTemplate = () => {
    const csvContent = `Manufacturer,Brand Title,Pack UPC,Carton UPC,SKU / UPC Description
Philip Morris,Marlboro Red,074200001234,074200005678,Marlboro Red King Box
Reynolds American,Camel Blue,011200987654,011200987650,Camel Blue 99s Box`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tobacco_import_sample.csv';
    a.click();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI-Powered Tobacco Product Import
            </CardTitle>
            <CardDescription>
              Upload your multi-sheet tobacco/nicotine Excel workbook. AI will automatically map UPCs, packaging levels, and compliance flags.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={downloadSampleTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Sample Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 'upload' && (
          <>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-lg font-semibold mb-2">
                  {file ? file.name : 'Choose Excel Workbook'}
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  Supports: Smokeless, Accessories, Cigarette, Cigar, TDI, eVapor sheets
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button type="button" variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>
              </Label>
            </div>

            {file && (
              <Button
                onClick={processFile}
                disabled={isProcessing}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI Processing File...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Process with AI
                  </>
                )}
              </Button>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm">
                <strong>How it works:</strong> AI will analyze all sheets, identify UPC types (can, roll, pack, carton, etc.), 
                infer packaging quantities based on industry standards, and automatically set compliance flags for age-restricted tobacco products.
              </AlertDescription>
            </Alert>
          </>
        )}

        {step === 'review' && processedData && (
          <>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription>
                AI successfully processed <strong>{processedData.length} products</strong>. Review the data below and confirm to import.
              </AlertDescription>
            </Alert>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-3 text-left">Product Name</th>
                    <th className="p-3 text-left">Brand</th>
                    <th className="p-3 text-left">Unit UPC</th>
                    <th className="p-3 text-left">Case UPC</th>
                    <th className="p-3 text-left">Pack Qty</th>
                    <th className="p-3 text-left">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {processedData.slice(0, 50).map((product, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">{product.product_name}</td>
                      <td className="p-3">{product.brand}</td>
                      <td className="p-3 font-mono text-xs">{product.upc_code}</td>
                      <td className="p-3 font-mono text-xs">{product.pack_structure?.case_upc || 'N/A'}</td>
                      <td className="p-3">{product.pack_structure?.singles_per_box || 1}</td>
                      <td className="p-3 capitalize">{product.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {processedData.length > 50 && (
                <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                  ... and {processedData.length - 50} more products
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('upload')} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                onClick={confirmImport}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm & Import {processedData.length} Products
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'complete' && importResults && (
          <>
            <Alert className={importResults.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              {importResults.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <AlertDescription>
                {importResults.message}
              </AlertDescription>
            </Alert>

            {importResults.success && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  ✓ All products have been imported with multi-level UPC mapping<br/>
                  ✓ Compliance flags (age restriction) automatically set<br/>
                  ✓ Pack structures configured for accurate receiving<br/>
                  ✓ Ready for inventory receiving and POS operations
                </p>
                <Button onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setProcessedData(null);
                  setImportResults(null);
                }} className="w-full">
                  Import Another File
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}