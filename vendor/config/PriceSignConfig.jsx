import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, DollarSign } from 'lucide-react';

export default function PriceSignConfig({ config, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const handleProductMappingChange = (index, field, value) => {
    const newMapping = [...(config.product_mapping || [])];
    newMapping[index] = {
      ...newMapping[index],
      [field]: value
    };
    handleChange('product_mapping', newMapping);
  };

  const addProductMapping = () => {
    handleChange('product_mapping', [
      ...(config.product_mapping || []),
      {
        sign_segment: (config.product_mapping || []).length + 1,
        product_code: 'regular',
        price_type: 'cash'
      }
    ]);
  };

  const removeProductMapping = (index) => {
    const newMapping = [...(config.product_mapping || [])];
    newMapping.splice(index, 1);
    handleChange('product_mapping', newMapping);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <CardTitle>Price Sign Configuration</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <Label>Enable Price Sign</Label>
          <Switch
            checked={config.enabled || false}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
          />
        </div>

        {config.enabled && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price Sign Vendor</Label>
                <Select
                  value={config.vendor || ''}
                  onValueChange={(value) => handleChange('vendor', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_vision">Price Vision</SelectItem>
                    <SelectItem value="daktronics">Daktronics</SelectItem>
                    <SelectItem value="led_sign_systems">LED Sign Systems</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Connection Type</Label>
                <Select
                  value={config.connection_type || ''}
                  onValueChange={(value) => handleChange('connection_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serial">Serial</SelectItem>
                    <SelectItem value="ethernet">Ethernet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {config.connection_type === 'ethernet' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>IP Address</Label>
                  <Input
                    value={config.ip_address || ''}
                    onChange={(e) => handleChange('ip_address', e.target.value)}
                    placeholder="192.168.1.50"
                  />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input
                    type="number"
                    value={config.port || ''}
                    onChange={(e) => handleChange('port', parseInt(e.target.value))}
                    placeholder="5000"
                  />
                </div>
              </div>
            )}

            {config.connection_type === 'serial' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Serial Port</Label>
                  <Input
                    value={config.serial_port || ''}
                    onChange={(e) => handleChange('serial_port', e.target.value)}
                    placeholder="COM2 or /dev/ttyUSB1"
                  />
                </div>
                <div>
                  <Label>Baud Rate</Label>
                  <Select
                    value={config.baud_rate?.toString() || ''}
                    onValueChange={(value) => handleChange('baud_rate', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9600">9600</SelectItem>
                      <SelectItem value="19200">19200</SelectItem>
                      <SelectItem value="38400">38400</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">Product Mapping</h4>
                <Button size="sm" onClick={addProductMapping}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>

              <div className="space-y-3">
                {(config.product_mapping || []).map((mapping, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium">Sign Segment {mapping.sign_segment}</h5>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeProductMapping(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Product</Label>
                        <Select
                          value={mapping.product_code || ''}
                          onValueChange={(value) => handleProductMappingChange(index, 'product_code', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="midgrade">Midgrade</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Price Type</Label>
                        <Select
                          value={mapping.price_type || ''}
                          onValueChange={(value) => handleProductMappingChange(index, 'price_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                            <SelectItem value="blend">Blend</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}