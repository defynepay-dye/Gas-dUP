import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Shield } from 'lucide-react';

export default function SmartSafeConfig({ config, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const handleApiCredentialsChange = (field, value) => {
    onChange({
      ...config,
      api_credentials: {
        ...(config.api_credentials || {}),
        [field]: value
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          <CardTitle>Smart Safe / Cash Management Configuration</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <Label>Enable Smart Safe Integration</Label>
          <Switch
            checked={config.smart_safe_enabled || false}
            onCheckedChange={(checked) => handleChange('smart_safe_enabled', checked)}
          />
        </div>

        {config.smart_safe_enabled && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Smart Safe Vendor</Label>
                <Select
                  value={config.smart_safe_vendor || ''}
                  onValueChange={(value) => handleChange('smart_safe_vendor', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="armorsafe">Armorsafe</SelectItem>
                    <SelectItem value="fireking">FireKing</SelectItem>
                    <SelectItem value="tidel">Tidel</SelectItem>
                    <SelectItem value="gunnebo">Gunnebo</SelectItem>
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
                    placeholder="192.168.1.250"
                  />
                </div>
                <div>
                  <Label>Unit ID</Label>
                  <Input
                    value={config.unit_id || ''}
                    onChange={(e) => handleChange('unit_id', e.target.value)}
                    placeholder="Safe unit identifier"
                  />
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">API Credentials</h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Username</Label>
                  <Input
                    value={config.api_credentials?.username || ''}
                    onChange={(e) => handleApiCredentialsChange('username', e.target.value)}
                    placeholder="API username"
                  />
                </div>
                <div>
                  <Label className="text-xs">Password</Label>
                  <Input
                    type="password"
                    value={config.api_credentials?.password || ''}
                    onChange={(e) => handleApiCredentialsChange('password', e.target.value)}
                    placeholder="API password"
                  />
                </div>
                <div>
                  <Label className="text-xs">API Key</Label>
                  <Input
                    value={config.api_credentials?.api_key || ''}
                    onChange={(e) => handleApiCredentialsChange('api_key', e.target.value)}
                    placeholder="API key (if applicable)"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}