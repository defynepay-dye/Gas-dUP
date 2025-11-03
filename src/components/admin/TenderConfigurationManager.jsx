import React, { useState, useEffect } from 'react';
import { TenderConfiguration, Location } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, Minus, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TenderConfigurationManager() {
  const [tenders, setTenders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTender, setEditingTender] = useState(null);
  const [showDenominations, setShowDenominations] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);

  useEffect(() => {
    loadTenders();
  }, []);

  const loadTenders = async () => {
    setIsLoading(true);
    try {
      const tendersData = await TenderConfiguration.list('sort_order');
      setTenders(tendersData);
      
      // Detect duplicates
      const tenderTypeCount = {};
      const foundDuplicates = [];
      
      tendersData.forEach(tender => {
        const key = tender.tender_type;
        if (!tenderTypeCount[key]) {
          tenderTypeCount[key] = [];
        }
        tenderTypeCount[key].push(tender);
      });
      
      Object.entries(tenderTypeCount).forEach(([type, items]) => {
        if (items.length > 1) {
          foundDuplicates.push({ type, items });
        }
      });
      
      setDuplicates(foundDuplicates);
      if (foundDuplicates.length > 0) {
        setShowDuplicateAlert(true);
      }
    } catch (error) {
      console.error('Error loading tenders:', error);
    }
    setIsLoading(false);
  };

  const handleDeleteDuplicates = async (duplicateGroup) => {
    // Keep the first one (presumably the original), delete the rest
    const toKeep = duplicateGroup.items[0];
    const toDelete = duplicateGroup.items.slice(1);
    
    if (!window.confirm(`This will delete ${toDelete.length} duplicate "${duplicateGroup.type}" tender(s) and keep the original. Continue?`)) {
      return;
    }
    
    try {
      for (const tender of toDelete) {
        await TenderConfiguration.delete(tender.id);
      }
      alert(`Successfully removed ${toDelete.length} duplicate(s)!`);
      loadTenders();
    } catch (error) {
      console.error('Error deleting duplicates:', error);
      alert('Failed to delete duplicates');
    }
  };

  const handleSaveTender = async (tenderData) => {
    try {
      // Check if this tender type already exists (prevent creating new duplicates)
      const existingTender = tenders.find(t => 
        t.tender_type === tenderData.tender_type && 
        t.id !== editingTender?.id
      );
      
      if (existingTender) {
        alert(`A tender type "${tenderData.tender_type}" already exists. Please edit the existing one or choose a different type.`);
        return;
      }
      
      if (editingTender?.id) {
        await TenderConfiguration.update(editingTender.id, tenderData);
      } else {
        await TenderConfiguration.create(tenderData);
      }
      setEditingTender(null);
      loadTenders();
    } catch (error) {
      console.error('Error saving tender:', error);
      alert('Failed to save tender configuration');
    }
  };

  const handleDeleteTender = async (tenderId) => {
    if (!window.confirm('Delete this tender type?')) return;
    try {
      await TenderConfiguration.delete(tenderId);
      loadTenders();
    } catch (error) {
      console.error('Error deleting tender:', error);
      alert('Failed to delete tender');
    }
  };

  const getImpactIcon = (impact) => {
    switch (impact) {
      case 'increase':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'increase':
        return 'bg-green-100 text-green-800';
      case 'decrease':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Standard cash denominations for counting
  const cashDenominations = [
    { label: '$100', value: 100, type: 'bill' },
    { label: '$50', value: 50, type: 'bill' },
    { label: '$20', value: 20, type: 'bill' },
    { label: '$10', value: 10, type: 'bill' },
    { label: '$5', value: 5, type: 'bill' },
    { label: '$2', value: 2, type: 'bill' },
    { label: '$1', value: 1, type: 'bill' },
    { label: 'Quarter', value: 0.25, type: 'coin' },
    { label: 'Dime', value: 0.10, type: 'coin' },
    { label: 'Nickel', value: 0.05, type: 'coin' },
    { label: 'Penny', value: 0.01, type: 'coin' },
  ];

  if (isLoading) {
    return <div className="p-8 text-center">Loading tender configuration...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Duplicate Alert */}
      {showDuplicateAlert && duplicates.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900 mb-2">Duplicate Tender Types Detected</p>
                <p className="text-sm text-red-800 mb-3">
                  Found {duplicates.length} duplicate tender type(s). This can cause issues with POS operations.
                </p>
                <div className="space-y-2">
                  {duplicates.map((dup, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
                      <div>
                        <span className="font-medium capitalize">{dup.type.replace('_', ' ')}</span>
                        <span className="text-sm text-gray-600 ml-2">({dup.items.length} duplicates)</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteDuplicates(dup)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove Duplicates
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDuplicateAlert(false)}
                className="text-red-600"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Tender Type Configuration</h3>
          <p className="text-sm text-gray-500">Configure payment methods, cash drawer behavior, and authorization requirements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDenominations(!showDenominations)}>
            <DollarSign className="w-4 h-4 mr-2" />
            {showDenominations ? 'Hide' : 'Show'} Denominations
          </Button>
          <Button onClick={() => setEditingTender({})}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tender Type
          </Button>
        </div>
      </div>

      {showDenominations && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Cash Counting Denominations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {cashDenominations.map((denom) => (
                <div key={denom.label} className="bg-white p-3 rounded-lg border text-center">
                  <p className="text-xs text-gray-500">{denom.type === 'bill' ? 'Bill' : 'Coin'}</p>
                  <p className="text-lg font-bold">{denom.label}</p>
                  <p className="text-xs text-gray-600">${denom.value.toFixed(2)}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3">
              These denominations are used for cash counting in shift start/end and reconciliation.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenders.map((tender) => {
          const isDuplicate = duplicates.some(dup => 
            dup.items.some(item => item.id === tender.id)
          );
          
          return (
            <Card key={tender.id} className={!tender.active ? 'opacity-50' : isDuplicate ? 'border-red-300' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {tender.tender_name}
                      {!tender.active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                      {isDuplicate && <Badge className="bg-red-100 text-red-800 text-xs">Duplicate</Badge>}
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">{tender.tender_type}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Drawer Impact</span>
                  <Badge className={getImpactColor(tender.drawer_impact)}>
                    <div className="flex items-center gap-1">
                      {getImpactIcon(tender.drawer_impact)}
                      <span className="capitalize">{tender.drawer_impact}</span>
                    </div>
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Negative Allowed</span>
                    <Badge variant={tender.allows_negative ? 'default' : 'secondary'}>
                      {tender.allows_negative ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Requires Auth</span>
                    <Badge variant={tender.requires_authorization ? 'default' : 'secondary'}>
                      {tender.requires_authorization ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {tender.accounting_code && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">GL Code</span>
                      <span className="font-mono text-xs">{tender.accounting_code}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditingTender(tender)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteTender(tender.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {tenders.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 mb-2">No tender types configured</p>
              <p className="text-sm text-gray-500 mb-4">Add tender types to enable payment processing</p>
              <Button onClick={() => setEditingTender({})}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Tender Type
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">Important Configuration Notes</p>
            <ul className="list-disc ml-4 mt-2 text-amber-800 space-y-1">
              <li><strong>Drawer Impact:</strong> Determines how this tender affects cash drawer balance</li>
              <li><strong>Negative Allowed:</strong> Enable for payouts (lottery, vendor payments, safe drops)</li>
              <li><strong>Requires Authorization:</strong> Manager PIN required to use this tender</li>
              <li><strong>Sort Order:</strong> Controls display order in POS tender selection</li>
              <li><strong>Duplicates:</strong> Each tender type should only exist once to avoid POS errors</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {editingTender && (
        <TenderEditModal
          tender={editingTender}
          existingTenders={tenders}
          onSave={handleSaveTender}
          onClose={() => setEditingTender(null)}
        />
      )}
    </div>
  );
}

function TenderEditModal({ tender, existingTenders, onSave, onClose }) {
  const [formData, setFormData] = useState({
    tender_type: tender.tender_type || 'cash',
    tender_name: tender.tender_name || '',
    allows_negative: tender.allows_negative || false,
    requires_authorization: tender.requires_authorization || false,
    drawer_impact: tender.drawer_impact || 'neutral',
    active: tender.active !== undefined ? tender.active : true,
    sort_order: tender.sort_order || 0,
    accounting_code: tender.accounting_code || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const tenderTypes = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'ebt', label: 'EBT / SNAP' },
    { value: 'mobile_payment', label: 'Mobile Payment' },
    { value: 'lottery_payout', label: 'Lottery Payout' },
    { value: 'vendor_payout', label: 'Vendor Payout' },
    { value: 'safe_drop', label: 'Safe Drop' },
    { value: 'safe_pickup', label: 'Safe Pickup' },
    { value: 'gift_card', label: 'Gift Card' },
    { value: 'fleet_card', label: 'Fleet Card' }
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{tender.id ? 'Edit Tender Type' : 'New Tender Type'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Tender Type *</Label>
              <Select value={formData.tender_type} onValueChange={(value) => setFormData({...formData, tender_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tenderTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Display Name *</Label>
              <Input
                value={formData.tender_name}
                onChange={(e) => setFormData({...formData, tender_name: e.target.value})}
                placeholder="e.g., Cash, Credit Card, Lottery Payout"
                required
              />
            </div>

            <div className="col-span-2">
              <Label>Cash Drawer Impact *</Label>
              <Select value={formData.drawer_impact} onValueChange={(value) => setFormData({...formData, drawer_impact: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      Increase (Money In)
                    </div>
                  </SelectItem>
                  <SelectItem value="decrease">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      Decrease (Money Out)
                    </div>
                  </SelectItem>
                  <SelectItem value="neutral">
                    <div className="flex items-center gap-2">
                      <Minus className="w-4 h-4 text-gray-600" />
                      Neutral (No Impact)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                How this tender affects the physical cash drawer balance
              </p>
            </div>

            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
              />
            </div>

            <div>
              <Label>Accounting Code</Label>
              <Input
                value={formData.accounting_code}
                onChange={(e) => setFormData({...formData, accounting_code: e.target.value})}
                placeholder="GL Code"
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <Label htmlFor="allows-negative">Allow Negative Amounts</Label>
                <p className="text-xs text-gray-500">Enable for payouts and cash-out operations</p>
              </div>
              <Switch
                id="allows-negative"
                checked={formData.allows_negative}
                onCheckedChange={(checked) => setFormData({...formData, allows_negative: checked})}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <Label htmlFor="requires-auth">Requires Manager Authorization</Label>
                <p className="text-xs text-gray-500">Manager PIN required to use this tender</p>
              </div>
              <Switch
                id="requires-auth"
                checked={formData.requires_authorization}
                onCheckedChange={(checked) => setFormData({...formData, requires_authorization: checked})}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <Label htmlFor="active">Active</Label>
                <p className="text-xs text-gray-500">Available for selection in POS</p>
              </div>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({...formData, active: checked})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Tender Type</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}