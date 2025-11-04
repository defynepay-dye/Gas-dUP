import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Settings } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

export default function ForecourtControllerConfig({ config, onChange }) {
  const [expandedController, setExpandedController] = useState(null);

  const addController = () => {
    const newController = {
      controller_id: `CTRL-${Date.now()}`,
      controller_vendor: 'allied_electronics_nexgen',
      communication_protocol: 'rs485',
      connection_details: {
        connection_type: 'serial',
        baud_rate: 9600,
        parity: 'none',
        data_bits: 8,
        stop_bits: 1,
        polling_interval_ms: 1000,
        timeout_ms: 5000
      },
      pump_mapping: [],
      enabled: true
    };
    onChange([...config, newController]);
  };

  const removeController = (index) => {
    const updated = config.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateController = (index, path, value) => {
    const updated = [...config];
    const keys = path.split('.');
    let current = updated[index];
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    onChange(updated);
  };

  const addPumpMapping = (controllerIndex) => {
    const updated = [...config];
    if (!updated[controllerIndex].pump_mapping) {
      updated[controllerIndex].pump_mapping = [];
    }
    updated[controllerIndex].pump_mapping.push({
      logical_pump_number: updated[controllerIndex].pump_mapping.length + 1,
      physical_pump_id: '',
      dispenser_type: 'multi_product',
      nozzles: [
        { nozzle_number: 1, product_code: 'regular', hose_color: 'black' },
        { nozzle_number: 2, product_code: 'midgrade', hose_color: 'yellow' },
        { nozzle_number: 3, product_code: 'premium', hose_color: 'red' }
      ]
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Forecourt Controllers</h3>
          <p className="text-sm text-gray-600">Configure pump controllers and communication protocols</p>
        </div>
        <Button onClick={addController} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Controller
        </Button>
      </div>

      {config.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No forecourt controllers configured</p>
            <p className="text-sm mt-2">Click "Add Controller" to begin setup</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {config.map((controller, index) => (
            <Card key={controller.controller_id} className="border-2">
              <CardHeader className="bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">
                      Controller #{index + 1}
                    </CardTitle>
                    <Badge className={controller.enabled ? 'bg-green-600' : 'bg-gray-400'}>
                      {controller.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                      {controller.controller_id}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedController(expandedController === index ? null : index)}
                    >
                      {expandedController === index ? 'Collapse' : 'Expand'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeController(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                {/* Basic Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Controller Vendor/Model</Label>
                    <Select
                      value={controller.controller_vendor}
                      onValueChange={(value) => updateController(index, 'controller_vendor', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allied_electronics_nexgen">Allied Electronics Nexgen</SelectItem>
                        <SelectItem value="technotrade_pts2">Technotrade PTS2</SelectItem>
                        <SelectItem value="progressive_fuel_direct">Progressive Fuel Direct</SelectItem>
                        <SelectItem value="fiscal">Fiscal</SelectItem>
                        <SelectItem value="gilbarco_passport">Gilbarco Passport</SelectItem>
                        <SelectItem value="gilbarco_encore">Gilbarco Encore</SelectItem>
                        <SelectItem value="wayne_nucleus">Wayne Nucleus</SelectItem>
                        <SelectItem value="wayne_ovation">Wayne Ovation</SelectItem>
                        <SelectItem value="tokheim">Tokheim</SelectItem>
                        <SelectItem value="bennett">Bennett</SelectItem>
                        <SelectItem value="tatsuno">Tatsuno</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Communication Protocol</Label>
                    <Select
                      value={controller.communication_protocol}
                      onValueChange={(value) => updateController(index, 'communication_protocol', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rs485">RS-485</SelectItem>
                        <SelectItem value="current_loop">Current Loop (CL)</SelectItem>
                        <SelectItem value="gilbarco_loop">Gilbarco Loop (GL)</SelectItem>
                        <SelectItem value="dart">DART</SelectItem>
                        <SelectItem value="ethernet_tcp">Ethernet TCP/IP</SelectItem>
                        <SelectItem value="modbus">Modbus RTU</SelectItem>
                        <SelectItem value="proprietary">Proprietary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {expandedController === index && (
                  <>
                    {/* Connection Details */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Connection Details</h4>
                      <div className="space-y-4">
                        <div>
                          <Label>Connection Type</Label>
                          <Select
                            value={controller.connection_details?.connection_type}
                            onValueChange={(value) => updateController(index, 'connection_details.connection_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="serial">Serial Port</SelectItem>
                              <SelectItem value="ethernet">Ethernet TCP/IP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {controller.connection_details?.connection_type === 'serial' ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <Label>Serial Port</Label>
                              <Input
                                value={controller.connection_details?.serial_port || ''}
                                onChange={(e) => updateController(index, 'connection_details.serial_port', e.target.value)}
                                placeholder="COM1 or /dev/ttyUSB0"
                              />
                            </div>
                            <div>
                              <Label>Baud Rate</Label>
                              <Select
                                value={controller.connection_details?.baud_rate?.toString()}
                                onValueChange={(value) => updateController(index, 'connection_details.baud_rate', parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="9600">9600</SelectItem>
                                  <SelectItem value="19200">19200</SelectItem>
                                  <SelectItem value="38400">38400</SelectItem>
                                  <SelectItem value="57600">57600</SelectItem>
                                  <SelectItem value="115200">115200</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Parity</Label>
                              <Select
                                value={controller.connection_details?.parity}
                                onValueChange={(value) => updateController(index, 'connection_details.parity', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="even">Even</SelectItem>
                                  <SelectItem value="odd">Odd</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Data Bits</Label>
                              <Select
                                value={controller.connection_details?.data_bits?.toString()}
                                onValueChange={(value) => updateController(index, 'connection_details.data_bits', parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="7">7</SelectItem>
                                  <SelectItem value="8">8</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Stop Bits</Label>
                              <Select
                                value={controller.connection_details?.stop_bits?.toString()}
                                onValueChange={(value) => updateController(index, 'connection_details.stop_bits', parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1</SelectItem>
                                  <SelectItem value="2">2</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>IP Address</Label>
                              <Input
                                value={controller.connection_details?.ip_address || ''}
                                onChange={(e) => updateController(index, 'connection_details.ip_address', e.target.value)}
                                placeholder="192.168.1.50"
                              />
                            </div>
                            <div>
                              <Label>Port</Label>
                              <Input
                                type="number"
                                value={controller.connection_details?.port || ''}
                                onChange={(e) => updateController(index, 'connection_details.port', parseInt(e.target.value))}
                                placeholder="10001"
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Polling Interval (ms)</Label>
                            <Input
                              type="number"
                              value={controller.connection_details?.polling_interval_ms || 1000}
                              onChange={(e) => updateController(index, 'connection_details.polling_interval_ms', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Timeout (ms)</Label>
                            <Input
                              type="number"
                              value={controller.connection_details?.timeout_ms || 5000}
                              onChange={(e) => updateController(index, 'connection_details.timeout_ms', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SDK Credentials */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">SDK/API Credentials (if required)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>API Key</Label>
                          <Input
                            value={controller.sdk_credentials?.api_key || ''}
                            onChange={(e) => updateController(index, 'sdk_credentials.api_key', e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <Label>Username</Label>
                          <Input
                            value={controller.sdk_credentials?.username || ''}
                            onChange={(e) => updateController(index, 'sdk_credentials.username', e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <Label>Password</Label>
                          <Input
                            type="password"
                            value={controller.sdk_credentials?.password || ''}
                            onChange={(e) => updateController(index, 'sdk_credentials.password', e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pump Mapping */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Pump Mapping</h4>
                        <Button
                          size="sm"
                          onClick={() => addPumpMapping(index)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Pump
                        </Button>
                      </div>

                      {controller.pump_mapping && controller.pump_mapping.length > 0 ? (
                        <div className="space-y-2">
                          {controller.pump_mapping.map((pump, pumpIndex) => (
                            <div key={pumpIndex} className="bg-gray-50 p-3 rounded-lg border">
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <Label className="text-xs">Logical Pump #</Label>
                                  <Input
                                    type="number"
                                    value={pump.logical_pump_number}
                                    onChange={(e) => {
                                      const updated = [...config];
                                      updated[index].pump_mapping[pumpIndex].logical_pump_number = parseInt(e.target.value);
                                      onChange(updated);
                                    }}
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Physical ID/Address</Label>
                                  <Input
                                    value={pump.physical_pump_id}
                                    onChange={(e) => {
                                      const updated = [...config];
                                      updated[index].pump_mapping[pumpIndex].physical_pump_id = e.target.value;
                                      onChange(updated);
                                    }}
                                    placeholder="e.g., 01, A1"
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Dispenser Type</Label>
                                  <Select
                                    value={pump.dispenser_type}
                                    onValueChange={(value) => {
                                      const updated = [...config];
                                      updated[index].pump_mapping[pumpIndex].dispenser_type = value;
                                      onChange(updated);
                                    }}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="single_hose">Single Hose</SelectItem>
                                      <SelectItem value="multi_product">Multi-Product</SelectItem>
                                      <SelectItem value="blender">Blender</SelectItem>
                                      <SelectItem value="high_flow_diesel">High Flow Diesel</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No pumps mapped yet. Click "Add Pump" to configure.
                        </p>
                      )}
                    </div>

                    {/* Enable/Disable */}
                    <div className="border-t pt-4 flex items-center justify-between">
                      <div>
                        <Label>Enable Controller</Label>
                        <p className="text-sm text-gray-500">Active controllers will communicate with hardware</p>
                      </div>
                      <Switch
                        checked={controller.enabled}
                        onCheckedChange={(checked) => updateController(index, 'enabled', checked)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}