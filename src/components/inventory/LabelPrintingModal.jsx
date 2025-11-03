import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer, Eye, Sparkles } from "lucide-react";
import { InvokeLLM } from "@/api/integrations";

const LABEL_TEMPLATES = {
  shelf_small: {
    name: "Shelf Label (2x1 inch)",
    size: "2x1",
    description: "Small shelf tag with price and UPC",
    supports: ["product_name", "upc", "price", "attributes"]
  },
  shelf_medium: {
    name: "Shelf Label (4x2 inch)",
    size: "4x2",
    description: "Standard shelf label with full details",
    supports: ["product_name", "upc", "price", "attributes", "brand", "description"]
  },
  price_tag: {
    name: "Price Tag (2x2 inch)",
    size: "2x2",
    description: "Large price display for signage",
    supports: ["product_name", "price", "tagline"]
  },
  weighted_product: {
    name: "Weighted Product Label (3x2 inch)",
    size: "3x2",
    description: "Label for produce/deli with price per lb/kg",
    supports: ["product_name", "price_per_weight", "upc", "attributes"]
  },
  promotional: {
    name: "Promotional Label (4x3 inch)",
    size: "4x3",
    description: "Eye-catching promotional label",
    supports: ["product_name", "price", "tagline", "attributes", "was_price"]
  }
};

export default function LabelPrintingModal({ items, onClose, onPrint }) {
  const [selectedTemplate, setSelectedTemplate] = useState("shelf_medium");
  const [labelQuantity, setLabelQuantity] = useState(1);
  const [customAttributes, setCustomAttributes] = useState({
    is_organic: false,
    is_local: false,
    is_gluten_free: false,
    is_vegan: false,
    is_new_item: false,
    is_clearance: false,
    is_sale: false
  });
  const [customTagline, setCustomTagline] = useState("");
  const [generatingTagline, setGeneratingTagline] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const selectedItems = Array.isArray(items) ? items : [items];
  const template = LABEL_TEMPLATES[selectedTemplate];

  const handleGenerateAITagline = async () => {
    if (selectedItems.length === 0) return;
    
    setGeneratingTagline(true);
    try {
      const item = selectedItems[0];
      const prompt = `Generate a short, catchy promotional tagline (max 10 words) for this product:
Product: ${item.product_name}
Category: ${item.category}
Brand: ${item.brand || 'Generic'}
Price: $${item.cash_price}

The tagline should be attention-grabbing, benefit-focused, and appropriate for a convenience store shelf label. Return ONLY the tagline, no quotes or explanation.`;

      const response = await InvokeLLM({ prompt });
      setCustomTagline(response.trim());
    } catch (error) {
      console.error("Failed to generate tagline:", error);
      alert("Could not generate AI tagline. Please enter manually.");
    } finally {
      setGeneratingTagline(false);
    }
  };

  const handleGeneratePreview = () => {
    const item = selectedItems[0]; // Preview first item only
    
    setPreviewData({
      template: selectedTemplate,
      product_name: item.product_name,
      upc_code: item.upc_code,
      price: item.is_weighted ? `$${item.price_per_unit_weight?.toFixed(2)}/${item.unit_of_measure}` : `$${item.cash_price?.toFixed(2)}`,
      brand: item.brand,
      attributes: customAttributes,
      tagline: customTagline,
      is_weighted: item.is_weighted
    });
  };

  const handlePrint = () => {
    const printJobs = selectedItems.map(item => ({
      item_id: item.id,
      product_name: item.product_name,
      upc_code: item.upc_code,
      price: item.is_weighted ? item.price_per_unit_weight : item.cash_price,
      is_weighted: item.is_weighted,
      unit_of_measure: item.unit_of_measure,
      brand: item.brand,
      template: selectedTemplate,
      quantity: labelQuantity,
      attributes: customAttributes,
      tagline: customTagline
    }));

    onPrint(printJobs);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Print Labels - {selectedItems.length} Item{selectedItems.length > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Side: Configuration */}
          <div className="space-y-6">
            <div>
              <Label>Label Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LABEL_TEMPLATES).map(([key, tmpl]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span className="font-medium">{tmpl.name}</span>
                        <span className="text-xs text-gray-500">{tmpl.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Labels Per Item</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="100"
                value={labelQuantity}
                onChange={(e) => setLabelQuantity(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Total labels to print: {selectedItems.length * labelQuantity}
              </p>
            </div>

            <div>
              <Label className="mb-3 block">Product Attributes</Label>
              <div className="space-y-2">
                {[
                  { key: 'is_organic', label: '🌿 Organic', color: 'bg-green-100 text-green-800' },
                  { key: 'is_local', label: '📍 Local Product', color: 'bg-blue-100 text-blue-800' },
                  { key: 'is_gluten_free', label: '🌾 Gluten Free', color: 'bg-yellow-100 text-yellow-800' },
                  { key: 'is_vegan', label: '🥬 Vegan', color: 'bg-green-100 text-green-800' },
                  { key: 'is_new_item', label: '✨ New Item', color: 'bg-purple-100 text-purple-800' },
                  { key: 'is_clearance', label: '🔥 Clearance', color: 'bg-red-100 text-red-800' },
                  { key: 'is_sale', label: '💰 On Sale', color: 'bg-orange-100 text-orange-800' }
                ].map(attr => (
                  <div key={attr.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={attr.key}
                      checked={customAttributes[attr.key]}
                      onCheckedChange={(checked) => 
                        setCustomAttributes({...customAttributes, [attr.key]: checked})
                      }
                    />
                    <label htmlFor={attr.key} className="text-sm font-medium cursor-pointer">
                      <Badge className={attr.color}>{attr.label}</Badge>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {template.supports.includes('tagline') && (
              <div>
                <Label htmlFor="tagline">Custom Tagline (Optional)</Label>
                <div className="flex gap-2 mt-1">
                  <Textarea
                    id="tagline"
                    value={customTagline}
                    onChange={(e) => setCustomTagline(e.target.value)}
                    placeholder="e.g., 'Fresh Daily!' or 'Limited Time Only!'"
                    rows={2}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateAITagline}
                    disabled={generatingTagline}
                    className="flex-shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Click the sparkle button for AI-generated tagline
                </p>
              </div>
            )}

            <Button onClick={handleGeneratePreview} variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              Generate Preview
            </Button>
          </div>

          {/* Right Side: Preview */}
          <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center">
            {previewData ? (
              <LabelPreview data={previewData} template={template} />
            ) : (
              <div className="text-center text-gray-400">
                <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Click "Generate Preview" to see label</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4 mr-2" />
            Send to Printer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LabelPreview({ data, template }) {
  const getTemplateStyles = () => {
    const [width, height] = template.size.split('x').map(s => parseInt(s));
    return {
      width: `${width * 80}px`,
      height: `${height * 80}px`
    };
  };

  const activeAttributes = Object.entries(data.attributes)
    .filter(([key, value]) => value)
    .map(([key, value]) => {
      const labels = {
        is_organic: { text: 'ORGANIC', color: 'bg-green-600' },
        is_local: { text: 'LOCAL', color: 'bg-blue-600' },
        is_gluten_free: { text: 'GLUTEN FREE', color: 'bg-yellow-600' },
        is_vegan: { text: 'VEGAN', color: 'bg-green-600' },
        is_new_item: { text: 'NEW', color: 'bg-purple-600' },
        is_clearance: { text: 'CLEARANCE', color: 'bg-red-600' },
        is_sale: { text: 'SALE', color: 'bg-orange-600' }
      };
      return labels[key];
    });

  return (
    <Card className="bg-white shadow-lg" style={getTemplateStyles()}>
      <CardContent className="p-4 h-full flex flex-col justify-between">
        {/* Product Name */}
        <div>
          <h3 className="font-bold text-lg leading-tight mb-1">{data.product_name}</h3>
          {data.brand && template.supports.includes('brand') && (
            <p className="text-sm text-gray-600">{data.brand}</p>
          )}
        </div>

        {/* Attributes */}
        {activeAttributes.length > 0 && (
          <div className="flex flex-wrap gap-1 my-2">
            {activeAttributes.map((attr, idx) => (
              <Badge key={idx} className={`${attr.color} text-white text-xs px-2 py-0.5`}>
                {attr.text}
              </Badge>
            ))}
          </div>
        )}

        {/* Tagline */}
        {data.tagline && template.supports.includes('tagline') && (
          <p className="text-sm italic text-blue-700 my-2">{data.tagline}</p>
        )}

        {/* Price */}
        <div className="mt-auto">
          <div className="text-3xl font-bold text-green-700">{data.price}</div>
          
          {/* UPC Barcode Simulation */}
          {data.upc_code && template.supports.includes('upc') && (
            <div className="mt-2">
              <div className="flex justify-between h-12 items-end">
                {[...Array(13)].map((_, i) => (
                  <div key={i} className="w-1 bg-black" style={{height: `${Math.random() * 40 + 20}px`}} />
                ))}
              </div>
              <p className="text-xs text-center font-mono mt-0.5">{data.upc_code}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}