import React, { useState } from "react";
import { InvokeLLM } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, AlertTriangle, CheckCircle } from "lucide-react";

export default function AIProductLookup({ onLookup, onAdd, onClose }) {
  const [upcCode, setUpcCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [error, setError] = useState("");

  const handleLookup = async () => {
    if (!upcCode.trim()) {
      setError("Please enter a UPC code");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const result = await onLookup(upcCode.trim());
      setLookupResult(result);
    } catch (err) {
      setError("Product not found or lookup failed. Please try again.");
      setLookupResult(null);
    }
    setIsLoading(false);
  };

  const handleAdd = () => {
    if (lookupResult) {
      onAdd(lookupResult);
    }
  };

  const handleFieldChange = (field, value) => {
    setLookupResult({ ...lookupResult, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            AI UPC Product Lookup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="upc-code">UPC Code</Label>
              <Input
                id="upc-code"
                value={upcCode}
                onChange={(e) => setUpcCode(e.target.value)}
                placeholder="Enter UPC code..."
                disabled={isLoading}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleLookup} disabled={isLoading || !upcCode.trim()}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                Lookup
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}

          {lookupResult && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold">Product Found - Review & Edit</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    value={lookupResult.product_name || ""}
                    onChange={(e) => handleFieldChange("product_name", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={lookupResult.category || "other"}
                    onValueChange={(value) => handleFieldChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tobacco">Tobacco</SelectItem>
                      <SelectItem value="alcohol">Alcohol</SelectItem>
                      <SelectItem value="beverages">Beverages</SelectItem>
                      <SelectItem value="snacks">Snacks</SelectItem>
                      <SelectItem value="automotive">Automotive</SelectItem>
                      <SelectItem value="personal_care">Personal Care</SelectItem>
                      <SelectItem value="candy">Candy</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="lottery">Lottery</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cash Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={lookupResult.cash_price?.toFixed(2) || "0.00"}
                    onChange={(e) => handleFieldChange("cash_price", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={lookupResult.cost?.toFixed(2) || "0.00"}
                    onChange={(e) => handleFieldChange("cost", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Vendor</Label>
                  <Input
                    value={lookupResult.vendor || ""}
                    onChange={(e) => handleFieldChange("vendor", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Reorder Level</Label>
                  <Input
                    type="number"
                    value={lookupResult.reorder_level || 10}
                    onChange={(e) => handleFieldChange("reorder_level", parseInt(e.target.value) || 10)}
                  />
                </div>
                <div>
                  <Label>Singles per Box</Label>
                  <Input
                    type="number"
                    value={lookupResult.singles_per_box || 1}
                    onChange={(e) => handleFieldChange("singles_per_box", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <Label>Boxes per Case</Label>
                  <Input
                    type="number"
                    value={lookupResult.boxes_per_case || 1}
                    onChange={(e) => handleFieldChange("boxes_per_case", parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label>Age Restricted</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    checked={lookupResult.age_restricted || false}
                    onChange={(e) => handleFieldChange("age_restricted", e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Requires age verification</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-700">
                  Add to Inventory
                </Button>
              </div>
            </div>
          )}

          {!lookupResult && !error && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              Enter a UPC code and click "Lookup" to search for product information.
            </div>
          )}

          {!lookupResult && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}