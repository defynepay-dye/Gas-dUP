import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { Search, Sparkles, CheckCircle, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';

export default function AIUPCLookup({ onProductCreated, onClose }) {
  const [upcCode, setUpcCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    product_name: '',
    brand: '',
    manufacturer: '',
    category: '',
    description: '',
    default_cash_price: '',
    default_cost: '',
    image_url: '',
    pack_size: '',
    compliance_flags: {
      age_restricted: false,
      ebt_eligible: false,
      requires_id_scan: false
    }
  });

  const categories = [
    'tobacco', 'alcohol', 'beverages', 'snacks', 'automotive', 
    'personal_care', 'candy', 'food', 'lottery', 'produce', 
    'deli', 'bakery', 'other'
  ];

  const handleAILookup = async () => {
    if (!upcCode || upcCode.length < 8) {
      setSearchError('Please enter a valid UPC code (at least 8 digits)');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setAiData(null);

    try {
      const prompt = `Search the internet for product information for UPC: ${upcCode}

Please find and return the following information in JSON format:
- product_name: The full product name
- brand: The brand name
- manufacturer: The manufacturer or company name
- category: Best matching category from this list: tobacco, alcohol, beverages, snacks, automotive, personal_care, candy, food, lottery, produce, deli, bakery, other
- description: A brief product description
- suggested_retail_price: Typical retail price in USD (number only, no currency symbol)
- image_url: A direct URL to a product image if available
- pack_size: Package size description (e.g., "20oz", "6-pack", "12oz can")
- age_restricted: true/false if this product requires age verification (alcohol, tobacco, etc.)
- ebt_eligible: true/false if this product is typically eligible for EBT/food stamps

If you cannot find reliable information for any field, set it to null or an empty string. Be as accurate as possible.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            product_name: { type: "string" },
            brand: { type: "string" },
            manufacturer: { type: "string" },
            category: { type: "string" },
            description: { type: "string" },
            suggested_retail_price: { type: "number" },
            image_url: { type: "string" },
            pack_size: { type: "string" },
            age_restricted: { type: "boolean" },
            ebt_eligible: { type: "boolean" }
          }
        }
      });

      if (response && response.product_name) {
        setAiData(response);
        
        // Pre-fill form with AI data
        setFormData({
          product_name: response.product_name || '',
          brand: response.brand || '',
          manufacturer: response.manufacturer || '',
          category: response.category || '',
          description: response.description || '',
          default_cash_price: response.suggested_retail_price || '',
          default_cost: '', // User must set this
          image_url: response.image_url || '',
          pack_size: response.pack_size || '',
          compliance_flags: {
            age_restricted: response.age_restricted || false,
            ebt_eligible: response.ebt_eligible || false,
            requires_id_scan: response.age_restricted || false
          }
        });
      } else {
        setSearchError('AI could not find reliable product information for this UPC. Please enter details manually.');
      }
    } catch (error) {
      console.error('AI lookup error:', error);
      setSearchError('Failed to perform AI lookup. Please try again or enter details manually.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!upcCode || !formData.product_name || !formData.category) {
      setSearchError('UPC Code, Product Name, and Category are required');
      return;
    }

    if (!formData.default_cash_price || parseFloat(formData.default_cash_price) <= 0) {
      setSearchError('Default Cash Price is required and must be greater than 0');
      return;
    }

    setIsSaving(true);
    setSearchError(null);

    try {
      // Check if ProductMaster already exists for this UPC
      const existing = await base44.entities.ProductMaster.filter({ upc_code: upcCode });
      
      if (existing && existing.length > 0) {
        setSearchError(`A product with UPC ${upcCode} already exists in the master catalog.`);
        setIsSaving(false);
        return;
      }

      // Create ProductMaster record
      const productMasterData = {
        upc_code: upcCode,
        product_name: formData.product_name,
        brand: formData.brand || null,
        manufacturer: formData.manufacturer || null,
        category: formData.category,
        description: formData.description || null,
        default_cash_price: parseFloat(formData.default_cash_price),
        default_cost: formData.default_cost ? parseFloat(formData.default_cost) : null,
        image_url: formData.image_url || null,
        pack_size: formData.pack_size || null,
        compliance_flags: formData.compliance_flags,
        ai_enrichment_metadata: aiData ? {
          source: 'ai_lookup',
          confidence_score: 0.8,
          last_ai_update: new Date().toISOString(),
          verified_by_user: true
        } : {
          source: 'manual_entry',
          verified_by_user: true
        },
        usage_stats: {
          locations_using: 0,
          total_inventory_items: 0
        },
        active: true
      };

      const createdProduct = await base44.entities.ProductMaster.create(productMasterData);
      
      if (onProductCreated) {
        onProductCreated(createdProduct);
      }
      
      alert('Product successfully added to Master Catalog!');
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setSearchError('Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI-Assisted Product Lookup
          </CardTitle>
          <CardDescription>
            Enter a UPC code and let AI find product information from the internet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="upc">UPC Code *</Label>
              <Input
                id="upc"
                placeholder="Enter UPC code (e.g., 012345678901)"
                value={upcCode}
                onChange={(e) => setUpcCode(e.target.value)}
                disabled={isSearching || isSaving}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAILookup} 
                disabled={isSearching || isSaving || !upcCode}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    AI Lookup
                  </>
                )}
              </Button>
            </div>
          </div>

          {searchError && (
            <Alert className="border-red-300 bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">{searchError}</AlertDescription>
            </Alert>
          )}

          {aiData && (
            <Alert className="border-green-300 bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                AI successfully found product information! Review and edit below before saving.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>
            {aiData ? 'Review AI-generated data and make any necessary adjustments' : 'Enter product details manually'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_name">Product Name *</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({...formData, category: value})}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="default_cash_price">Default Cash Price * ($)</Label>
              <Input
                id="default_cash_price"
                type="number"
                step="0.01"
                value={formData.default_cash_price}
                onChange={(e) => setFormData({...formData, default_cash_price: e.target.value})}
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="default_cost">Default Cost ($)</Label>
              <Input
                id="default_cost"
                type="number"
                step="0.01"
                value={formData.default_cost}
                onChange={(e) => setFormData({...formData, default_cost: e.target.value})}
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="pack_size">Pack Size</Label>
              <Input
                id="pack_size"
                placeholder="e.g., 20oz, 6-pack"
                value={formData.pack_size}
                onChange={(e) => setFormData({...formData, pack_size: e.target.value})}
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                disabled={isSaving}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              disabled={isSaving}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Compliance Flags</Label>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.compliance_flags.age_restricted}
                  onChange={(e) => setFormData({
                    ...formData,
                    compliance_flags: {
                      ...formData.compliance_flags,
                      age_restricted: e.target.checked,
                      requires_id_scan: e.target.checked
                    }
                  })}
                  disabled={isSaving}
                />
                <span className="text-sm">Age Restricted</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.compliance_flags.ebt_eligible}
                  onChange={(e) => setFormData({
                    ...formData,
                    compliance_flags: {...formData.compliance_flags, ebt_eligible: e.target.checked}
                  })}
                  disabled={isSaving}
                />
                <span className="text-sm">EBT Eligible</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        {onClose && (
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !formData.product_name || !formData.category || !formData.default_cash_price}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Save to Master Catalog
            </>
          )}
        </Button>
      </div>
    </div>
  );
}