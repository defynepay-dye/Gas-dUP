import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Save, Fuel } from "lucide-react";

// This would interact with a `ReceiptSettings` entity in a real app
const initialSettings = {
  headerText: "Welcome to FuelStation Pro!",
  footerText: "Thank you for your business!",
  logoUrl: ""
};

export default function MaintenanceTab() {
  const [receiptSettings, setReceiptSettings] = useState(initialSettings);
  const [logoFile, setLogoFile] = useState(null);

  const handleSaveReceiptSettings = () => {
    // Here you would use an integration to upload the logoFile if it exists,
    // get the URL, and then save the receiptSettings object to the database.
    alert("Receipt settings saved!");
    console.log("Saving receipt settings:", {
      ...receiptSettings,
      logoFile: logoFile ? logoFile.name : "No new logo"
    });
  };

  const handleSaveFuelPrices = () => {
    // This would trigger a bulk update of the Product entity for fuel items
    alert("Fuel prices updated across all locations!");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Store & System Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receipt Customization</CardTitle>
            <CardDescription>Format the header and footer of printed receipts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receipt-header">Header Text</Label>
              <Textarea
                id="receipt-header"
                value={receiptSettings.headerText}
                onChange={(e) => setReceiptSettings({...receiptSettings, headerText: e.target.value})}
                placeholder="e.g., Welcome!"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receipt-footer">Footer Text</Label>
              <Textarea
                id="receipt-footer"
                value={receiptSettings.footerText}
                onChange={(e) => setReceiptSettings({...receiptSettings, footerText: e.target.value})}
                placeholder="e.g., Thank you for shopping with us!"
              />
            </div>
            <div className="space-y-2">
              <Label>Receipt Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 border rounded bg-white flex items-center justify-center">
                  {receiptSettings.logoUrl || logoFile ? (
                    <img
                      src={logoFile ? URL.createObjectURL(logoFile) : receiptSettings.logoUrl}
                      alt="Logo Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Upload className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files[0])}
                  className="flex-1"
                />
              </div>
            </div>
            <Button onClick={handleSaveReceiptSettings}>
              <Save className="w-4 h-4 mr-2" />
              Save Receipt Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remote Fuel Price Editor</CardTitle>
            <CardDescription>
              Update fuel prices for the selected location. Prices are per gallon.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {['Regular', 'Midgrade', 'Premium', 'Diesel'].map(grade => (
              <div key={grade} className="space-y-2">
                <Label>{grade} Fuel</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" placeholder="Cash Price" aria-label={`${grade} Cash Price`} />
                  <Input type="number" placeholder="Credit Price" aria-label={`${grade} Credit Price`} />
                </div>
              </div>
            ))}
            <Button onClick={handleSaveFuelPrices} className="w-full">
              <Fuel className="w-4 h-4 mr-2" />
              Update Fuel Prices
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}