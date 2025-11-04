import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Printer } from 'lucide-react';

export default function PrinterConfig({ config, onChange }) {
  const handleAddPrinter = () => {
    onChange([
      ...(config || []),
      {
        printer_id: '',
        printer_type: 'receipt',
        connection_type: 'ethernet',
        ip_address: '',
        port: 9100,
        driver: 'star_micronics',
        pos_terminal_assignment: '',
        enabled: true
      }
    ]);
  };

  const handlePrinterChange = (index, field, value) => {
    const newConfig = [...(config || [])];
    newConfig[index] = {
      ...newConfig[index],
      [field]: value
    };
    onChange(newConfig);
  };

  const handleRemovePrinter = (index) => {
    const newConfig = [...(config || [])];
    newConfig.splice(index, 1);
    onChange(newConfig);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-gray-600" />
            <CardTitle>Printers Configuration</CardTitle>
          </div>
          <Button size="sm" onClick={handleAddPrinter}>
            <Plus className="w-4 h-4 mr-2" />
            Add Printer
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {(!config || config.length === 0) ? (
          <div className="text-center py-8">
            <Printer className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No printers configured</p>
            <Button size="sm" onClick={handleAddPrinter}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Printer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {config.map((printer, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">Printer {index + 1}</h5>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemovePrinter(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Printer ID</Label>
                    <Input
                      value={printer.printer_id || ''}
                      onChange={(e) => handlePrinterChange(index, 'printer_id', e.target.value)}
                      placeholder="PRINTER001"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Printer Type</Label>
                    <Select
                      value={printer.printer_type || ''}
                      onValueChange={(value) => handlePrinterChange(index, 'printer_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receipt">Receipt</SelectItem>
                        <SelectItem value="label">Label</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="report">Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Connection Type</Label>
                    <Select
                      value={printer.connection_type || ''}
                      onValueChange={(value) => handlePrinterChange(index, 'connection_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usb">USB</SelectItem>
                        <SelectItem value="ethernet">Ethernet</SelectItem>
                        <SelectItem value="bluetooth">Bluetooth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Driver</Label>
                    <Select
                      value={printer.driver || ''}
                      onValueChange={(value) => handlePrinterChange(index, 'driver', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="star_micronics">Star Micronics</SelectItem>
                        <SelectItem value="epson_tm">Epson TM</SelectItem>
                        <SelectItem value="zebra">Zebra</SelectItem>
                        <SelectItem value="generic_esc_pos">Generic ESC/POS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {printer.connection_type === 'ethernet' && (
                    <>
                      <div>
                        <Label className="text-xs">IP Address</Label>
                        <Input
                          value={printer.ip_address || ''}
                          onChange={(e) => handlePrinterChange(index, 'ip_address', e.target.value)}
                          placeholder="192.168.1.100"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Port</Label>
                        <Input
                          type="number"
                          value={printer.port || ''}
                          onChange={(e) => handlePrinterChange(index, 'port', parseInt(e.target.value))}
                          placeholder="9100"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <Label className="text-xs">POS Terminal Assignment</Label>
                    <Input
                      value={printer.pos_terminal_assignment || ''}
                      onChange={(e) => handlePrinterChange(index, 'pos_terminal_assignment', e.target.value)}
                      placeholder="POS1, POS2, etc."
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