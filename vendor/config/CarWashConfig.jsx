import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Car } from 'lucide-react';

export default function CarWashConfig({ config, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const handlePackageChange = (index, field, value) => {
    const newPackages = [...(config.wash_packages || [])];
    newPackages[index] = {
      ...newPackages[index],
      [field]: value
    };
    handleChange('wash_packages', newPackages);
  };

  const addPackage = () => {
    handleChange('wash_packages', [
      ...(config.wash_packages || []),
      {
        package_name: '',
        wash_code: '',
        price: 0
      }
    ]);
  };

  const removePackage = (index) => {
    const newPackages = [...(config.wash_packages || [])];
    newPackages.splice(index, 1);
    handleChange('wash_packages', newPackages);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-blue-600" />
          <CardTitle>Car Wash System Configuration</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <Label>Enable Car Wash Integration</Label>
          <Switch
            checked={config.enabled || false}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
          />
        </div>

        {config.enabled && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Car Wash Vendor</Label>
                <Select
                  value={config.vendor || ''}
                  onValueChange={(value) => handleChange('vendor', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drb_systems">DRB Systems</SelectItem>
                    <SelectItem value="ics">ICS (Innovative Control Systems)</SelectItem>
                    <SelectItem value="sonny_s">Sonny's</SelectItem>
                    <SelectItem value="ryko">Ryko</SelectItem>
                    <SelectItem value="pdi">PDI</SelectItem>
                    <SelectItem value="washworld">WashWorld</SelectItem>
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
                    <SelectItem value="ethernet">Ethernet</SelectItem>
                    <SelectItem value="serial">Serial</SelectItem>
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
                    placeholder="192.168.1.200"
                  />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input
                    type="number"
                    value={config.port || ''}
                    onChange={(e) => handleChange('port', parseInt(e.target.value))}
                    placeholder="8080"
                  />
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">Wash Packages</h4>
                <Button size="sm" onClick={addPackage}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Package
                </Button>
              </div>

              <div className="space-y-3">
                {(config.wash_packages || []).map((pkg, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium">Package {index + 1}</h5>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePackage(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Package Name</Label>
                        <Input
                          value={pkg.package_name || ''}
                          onChange={(e) => handlePackageChange(index, 'package_name', e.target.value)}
                          placeholder="Basic Wash"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Wash Code</Label>
                        <Input
                          value={pkg.wash_code || ''}
                          onChange={(e) => handlePackageChange(index, 'wash_code', e.target.value)}
                          placeholder="Code sent to controller"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={pkg.price || ''}
                          onChange={(e) => handlePackageChange(index, 'price', parseFloat(e.target.value))}
                        />
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