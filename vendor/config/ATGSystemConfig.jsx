import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Droplets } from 'lucide-react';

export default function ATGSystemConfig({ config, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const handleTankMappingChange = (index, field, value) => {
    const newMapping = [...(config.tank_mapping || [])];
    newMapping[index] = {
      ...newMapping[index],
      [field]: value
    };
    handleChange('tank_mapping', newMapping);
  };

  const addTank = () => {
    handleChange('tank_mapping', [
      ...(config.tank_mapping || []),
      {
        logical_tank_number: (config.tank_mapping || []).length + 1,
        atg_tank_id: '',
        product_code: 'regular',
        capacity_gallons: 10000,
        low_level_alarm_gallons: 2000,
        high_level_alarm_gallons: 9500
      }
    ]);
  };

  const removeTank = (index) => {
    const newMapping = [...(config.tank_mapping || [])];
    newMapping.splice(index, 1);
    handleChange('tank_mapping', newMapping);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-600" />
          <CardTitle>ATG System Configuration</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <Label>Enable ATG System</Label>
          <Switch
            checked={config.enabled || false}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
          />
        </div>

        {config.enabled && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ATG Vendor</Label>
                <Select
                  value={config.vendor || ''}
                  onValueChange={(value) => handleChange('vendor', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veeder_root_tls350">Veeder-Root TLS-350</SelectItem>
                    <SelectItem value="veeder_root_tls450">Veeder-Root TLS-450</SelectItem>
                    <SelectItem value="opw_sitesentry">OPW SiteSentry</SelectItem>
                    <SelectItem value="franklin_fueling_ts550">Franklin Fueling TS-550</SelectItem>
                    <SelectItem value="incon_proplus">Incon ProPlus</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input
                    type="number"
                    value={config.port || ''}
                    onChange={(e) => handleChange('port', parseInt(e.target.value))}
                    placeholder="10001"
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
                    placeholder="COM1 or /dev/ttyUSB0"
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
                <h4 className="font-semibold">Tank Mapping</h4>
                <Button size="sm" onClick={addTank}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tank
                </Button>
              </div>

              <div className="space-y-3">
                {(config.tank_mapping || []).map((tank, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <h5 className="font-medium">Tank {tank.logical_tank_number}</h5>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTank(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">ATG Tank ID</Label>
                        <Input
                          value={tank.atg_tank_id || ''}
                          onChange={(e) => handleTankMappingChange(index, 'atg_tank_id', e.target.value)}
                          placeholder="Tank ID in ATG system"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Product</Label>
                        <Select
                          value={tank.product_code || ''}
                          onValueChange={(value) => handleTankMappingChange(index, 'product_code', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="midgrade">Midgrade</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="e85">E85</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Capacity (gallons)</Label>
                        <Input
                          type="number"
                          value={tank.capacity_gallons || ''}
                          onChange={(e) => handleTankMappingChange(index, 'capacity_gallons', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Low Alarm (gallons)</Label>
                        <Input
                          type="number"
                          value={tank.low_level_alarm_gallons || ''}
                          onChange={(e) => handleTankMappingChange(index, 'low_level_alarm_gallons', parseInt(e.target.value))}
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