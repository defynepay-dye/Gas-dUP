import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QrCode, Key, CheckCircle, XCircle, Clock, Download, Copy, RefreshCw, Plus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ProvisioningManager() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [newCode, setNewCode] = useState({
    client_account_id: '',
    location_id: '',
    lss_configuration_id: '',
    expiration_days: 30
  });

  const queryClient = useQueryClient();

  // Fetch provisioning codes
  const { data: provisioningCodes = [], isLoading } = useQuery({
    queryKey: ['provisioning_codes'],
    queryFn: async () => {
      const data = await base44.entities.ProvisioningCode.list('-issued_date');
      return data || [];
    }
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['clients_list'],
    queryFn: async () => {
      const data = await base44.entities.ClientAccount.list('client_name');
      return data || [];
    }
  });

  // Fetch locations for dropdown
  const { data: locations = [] } = useQuery({
    queryKey: ['locations_list'],
    queryFn: async () => {
      const data = await base44.entities.Location.list('location_name');
      return data || [];
    }
  });

  // Fetch LSS configs for dropdown
  const { data: lssConfigs = [] } = useQuery({
    queryKey: ['lss_configs_list'],
    queryFn: async () => {
      const data = await base44.entities.LSSConfiguration.list();
      return data || [];
    }
  });

  // Create provisioning code
  const createCodeMutation = useMutation({
    mutationFn: async (codeData) => {
      // Generate unique activation code
      const activationCode = `FP-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(codeData.expiration_days));

      // Generate QR code data (base64 encoded JSON)
      const qrData = btoa(JSON.stringify({
        code: activationCode,
        client_id: codeData.client_account_id,
        location_id: codeData.location_id,
        lss_config_id: codeData.lss_configuration_id
      }));

      const newCodeData = {
        activation_code: activationCode,
        client_account_id: codeData.client_account_id,
        location_id: codeData.location_id,
        lss_configuration_id: codeData.lss_configuration_id,
        code_status: 'active',
        issued_date: new Date().toISOString(),
        expiration_date: expirationDate.toISOString(),
        qr_code_data: qrData,
        issued_by: 'Admin User'
      };

      return await base44.entities.ProvisioningCode.create(newCodeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['provisioning_codes']);
      setShowCreateModal(false);
      setNewCode({
        client_account_id: '',
        location_id: '',
        lss_configuration_id: '',
        expiration_days: 30
      });
      alert('✅ Provisioning code created successfully!');
    }
  });

  // Revoke code
  const revokeCodeMutation = useMutation({
    mutationFn: async (codeId) => {
      return await base44.entities.ProvisioningCode.update(codeId, {
        code_status: 'revoked'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['provisioning_codes']);
      alert('Provisioning code revoked');
    }
  });

  const handleCreateCode = () => {
    if (!newCode.client_account_id || !newCode.location_id || !newCode.lss_configuration_id) {
      alert('Please fill in all required fields');
      return;
    }
    createCodeMutation.mutate(newCode);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert('Activation code copied to clipboard!');
  };

  const handleDownloadQR = (code) => {
    // In production, this would generate a QR code image
    const qrText = `FuelFlow Pro Activation\nCode: ${code.activation_code}\nScan to activate your LSS`;
    const blob = new Blob([qrText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activation-${code.activation_code}.txt`;
    a.click();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'used': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'revoked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'used': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'expired': return <Clock className="w-4 h-4 text-gray-600" />;
      case 'revoked': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const activeCodeCount = provisioningCodes.filter(c => c.code_status === 'active').length;
  const usedCodeCount = provisioningCodes.filter(c => c.code_status === 'used').length;
  const expiredCodeCount = provisioningCodes.filter(c => c.code_status === 'expired').length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><RefreshCw className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{provisioningCodes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeCodeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{usedCodeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{expiredCodeCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Provisioning Codes</h2>
          <p className="text-gray-600">Generate and manage LSS activation codes</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Create New Code
        </Button>
      </div>

      {/* Provisioning Codes Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activation Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {provisioningCodes.map((code) => {
                  const client = clients.find(c => c.id === code.client_account_id);
                  const location = locations.find(l => l.id === code.location_id);
                  
                  return (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{code.activation_code}</code>
                          <button onClick={() => handleCopyCode(code.activation_code)} className="text-gray-400 hover:text-gray-600">
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {client?.client_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {location?.location_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(code.code_status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(code.code_status)}
                            {code.code_status}
                          </span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(code.issued_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(code.expiration_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCode(code);
                            setShowQRModal(true);
                          }}
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          QR
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadQR(code)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        {code.code_status === 'active' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm('Revoke this provisioning code?')) {
                                revokeCodeMutation.mutate(code.id);
                              }
                            }}
                          >
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Code Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Provisioning Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Client Account</Label>
              <Select
                value={newCode.client_account_id}
                onValueChange={(value) => setNewCode({ ...newCode, client_account_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Select
                value={newCode.location_id}
                onValueChange={(value) => setNewCode({ ...newCode, location_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>LSS Configuration</Label>
              <Select
                value={newCode.lss_configuration_id}
                onValueChange={(value) => setNewCode({ ...newCode, lss_configuration_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select LSS config" />
                </SelectTrigger>
                <SelectContent>
                  {lssConfigs.map(config => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.lss_identifier || `LSS-${config.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expiration (Days)</Label>
              <Input
                type="number"
                value={newCode.expiration_days}
                onChange={(e) => setNewCode({ ...newCode, expiration_days: e.target.value })}
                placeholder="30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCode}
              disabled={createCodeMutation.isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createCodeMutation.isLoading ? 'Creating...' : 'Generate Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code - {selectedCode?.activation_code}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="bg-white p-8 border-4 border-purple-600 rounded-lg">
              <QrCode className="w-48 h-48 text-purple-600" />
            </div>
            <code className="text-lg font-mono bg-gray-100 px-4 py-2 rounded">{selectedCode?.activation_code}</code>
            <p className="text-sm text-gray-600 text-center">
              Scan this QR code with the FuelFlow Pro LSS app to activate
            </p>
            <Button onClick={() => selectedCode && handleDownloadQR(selectedCode)} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}