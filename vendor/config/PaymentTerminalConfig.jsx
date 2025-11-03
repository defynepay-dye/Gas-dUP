import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CreditCard } from 'lucide-react';

export default function PaymentTerminalConfig({ config, onChange }) {
  const handleAddTerminal = () => {
    onChange([
      ...(config || []),
      {
        terminal_id: '',
        vendor: 'ingenico',
        connection_type: 'ethernet',
        ip_address: '',
        port: 0,
        processor_gateway: 'worldpay',
        merchant_id: '',
        terminal_number: '',
        pos_terminal_assignment: '',
        enabled: true
      }
    ]);
  };

  const handleTerminalChange = (index, field, value) => {
    const newConfig = [...(config || [])];
    newConfig[index] = {
      ...newConfig[index],
      [field]: value
    };
    onChange(newConfig);
  };

  const handleRemoveTerminal = (index) => {
    const newConfig = [...(config || [])];
    newConfig.splice(index, 1);
    onChange(newConfig);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <CardTitle>Payment Terminals Configuration</CardTitle>
          </div>
          <Button size="sm" onClick={handleAddTerminal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Terminal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {(!config || config.length === 0) ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No payment terminals configured</p>
            <Button size="sm" onClick={handleAddTerminal}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Terminal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {config.map((terminal, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">Terminal {index + 1}</h5>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveTerminal(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Terminal ID</Label>
                    <Input
                      value={terminal.terminal_id || ''}
                      onChange={(e) => handleTerminalChange(index, 'terminal_id', e.target.value)}
                      placeholder="TERM001"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vendor</Label>
                    <Select
                      value={terminal.vendor || ''}
                      onValueChange={(value) => handleTerminalChange(index, 'vendor', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ingenico">Ingenico</SelectItem>
                        <SelectItem value="verifone">VeriFone</SelectItem>
                        <SelectItem value="pax">PAX Technology</SelectItem>
                        <SelectItem value="dejavoo">Dejavoo</SelectItem>
                        <SelectItem value="first_data">First Data</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Connection Type</Label>
                    <Select
                      value={terminal.connection_type || ''}
                      onValueChange={(value) => handleTerminalChange(index, 'connection_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ethernet">Ethernet</SelectItem>
                        <SelectItem value="usb">USB</SelectItem>
                        <SelectItem value="bluetooth">Bluetooth</SelectItem>
                        <SelectItem value="wifi">WiFi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">IP Address</Label>
                    <Input
                      value={terminal.ip_address || ''}
                      onChange={(e) => handleTerminalChange(index, 'ip_address', e.target.value)}
                      placeholder="192.168.1.150"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Port</Label>
                    <Input
                      type="number"
                      value={terminal.port || ''}
                      onChange={(e) => handleTerminalChange(index, 'port', parseInt(e.target.value))}
                      placeholder="8000"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Processor Gateway</Label>
                    <Select
                      value={terminal.processor_gateway || ''}
                      onValueChange={(value) => handleTerminalChange(index, 'processor_gateway', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="worldpay">Worldpay</SelectItem>
                        <SelectItem value="tsys">TSYS</SelectItem>
                        <SelectItem value="first_data">First Data</SelectItem>
                        <SelectItem value="heartland">Heartland</SelectItem>
                        <SelectItem value="shift4">Shift4</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Merchant ID</Label>
                    <Input
                      value={terminal.merchant_id || ''}
                      onChange={(e) => handleTerminalChange(index, 'merchant_id', e.target.value)}
                      placeholder="Merchant ID"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Terminal Number</Label>
                    <Input
                      value={terminal.terminal_number || ''}
                      onChange={(e) => handleTerminalChange(index, 'terminal_number', e.target.value)}
                      placeholder="Terminal Number"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}