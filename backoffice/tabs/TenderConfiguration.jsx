
import React, { useState, useEffect } from 'react';
import { TenderConfiguration as TenderConfigEntity } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Settings, Trash2, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function TenderConfiguration() {
  const [tenders, setTenders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTender, setEditingTender] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTenders();
  }, []);

  const loadTenders = async () => {
    setIsLoading(true);
    try {
      const data = await TenderConfigEntity.list('sort_order');
      setTenders(data);
    } catch (error) {
      console.error('Error loading tender configurations:', error);
    }
    setIsLoading(false);
  };

  const getImpactBadge = (impact) => {
    const colors = {
      increase: 'bg-green-100 text-green-800',
      decrease: 'bg-red-100 text-red-800',
      neutral: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={colors[impact]}>{impact}</Badge>;
  };

  const defaultTenders = [
    { tender_type: 'cash', tender_name: 'Cash', allows_negative: false, drawer_impact: 'increase' },
    { tender_type: 'credit_card', tender_name: 'Credit Card', allows_negative: false, drawer_impact: 'neutral' },
    { tender_type: 'debit_card', tender_name: 'Debit Card', allows_negative: false, drawer_impact: 'neutral' },
    { tender_type: 'ebt', tender_name: 'EBT Food Stamps', allows_negative: false, drawer_impact: 'neutral' },
    { tender_type: 'mobile_payment', tender_name: 'Mobile Payment', allows_negative: false, drawer_impact: 'neutral' },
    { tender_type: 'lottery_payout', tender_name: 'Lottery Payout', allows_negative: true, drawer_impact: 'decrease' },
    { tender_type: 'vendor_payout', tender_name: 'Vendor Payout', allows_negative: true, drawer_impact: 'decrease' },
    { tender_type: 'safe_drop', tender_name: 'Safe Drop', allows_negative: false, drawer_impact: 'decrease' },
    { tender_type: 'safe_pickup', tender_name: 'Safe Pickup', allows_negative: false, drawer_impact: 'increase' },
  ];

  const initializeDefaults = async () => {
    for (const tender of defaultTenders) {
      const existing = tenders.find(t => t.tender_type === tender.tender_type);
      if (!existing) {
        await TenderConfigEntity.create({
          ...tender,
          requires_authorization: tender.allows_negative,
          active: true,
          sort_order: defaultTenders.indexOf(tender)
        });
      }
    }
    loadTenders();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tender Configuration</h2>
          <p className="text-gray-500">Configure payment methods and cash management options</p>
        </div>
        <div className="flex gap-2">
          {tenders.length === 0 && (
            <Button onClick={initializeDefaults} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Initialize Defaults
            </Button>
          )}
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tender Type
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading tender configurations...</div>
      ) : (
        <div className="grid gap-4">
          {tenders.map((tender) => (
            <Card key={tender.id} className={`${!tender.active ? 'opacity-50' : ''}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-5 h-5" />
                      <h3 className="font-semibold">{tender.tender_name}</h3>
                      {getImpactBadge(tender.drawer_impact)}
                      {tender.allows_negative && (
                        <Badge className="bg-orange-100 text-orange-800">Allows Negative</Badge>
                      )}
                      {tender.requires_authorization && (
                        <Badge className="bg-blue-100 text-blue-800">Requires Auth</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 capitalize">Type: {tender.tender_type.replace('_', ' ')}</p>
                    {tender.accounting_code && (
                      <p className="text-sm text-gray-500">GL Code: {tender.accounting_code}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={tender.active} 
                      onCheckedChange={async (checked) => {
                        await TenderConfigEntity.update(tender.id, { active: checked });
                        loadTenders();
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingTender(tender);
                        setShowAddModal(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && (
        <TenderModal
          tender={editingTender}
          onSave={async (tenderData) => {
            if (editingTender) {
              await TenderConfigEntity.update(editingTender.id, tenderData);
            } else {
              await TenderConfigEntity.create(tenderData);
            }
            loadTenders();
            setShowAddModal(false);
            setEditingTender(null);
          }}
          onClose={() => {
            setShowAddModal(false);
            setEditingTender(null);
          }}
        />
      )}
    </div>
  );
}

function TenderModal({ tender, onSave, onClose }) {
  const [formData, setFormData] = useState(tender || {
    tender_type: 'cash',
    tender_name: '',
    allows_negative: false,
    requires_authorization: false,
    drawer_impact: 'neutral',
    active: true,
    sort_order: 0,
    accounting_code: ''
  });

  const handleSubmit = () => {
    if (!formData.tender_name) {
      alert('Please enter a tender name');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tender ? 'Edit' : 'Add'} Tender Type</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tender Type</Label>
              <select 
                className="w-full p-2 border rounded"
                value={formData.tender_type}
                onChange={(e) => setFormData({...formData, tender_type: e.target.value})}
                disabled={!!tender}
              >
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="ebt">EBT</option>
                <option value="mobile_payment">Mobile Payment</option>
                <option value="lottery_payout">Lottery Payout</option>
                <option value="vendor_payout">Vendor Payout</option>
                <option value="safe_drop">Safe Drop</option>
                <option value="safe_pickup">Safe Pickup</option>
                <option value="gift_card">Gift Card</option>
                <option value="fleet_card">Fleet Card</option>
              </select>
            </div>
            
            <div>
              <Label>Display Name</Label>
              <Input
                value={formData.tender_name}
                onChange={(e) => setFormData({...formData, tender_name: e.target.value})}
                placeholder="Enter display name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Drawer Impact</Label>
              <select 
                className="w-full p-2 border rounded"
                value={formData.drawer_impact}
                onChange={(e) => setFormData({...formData, drawer_impact: e.target.value})}
              >
                <option value="increase">Increase (Money In)</option>
                <option value="decrease">Decrease (Money Out)</option>
                <option value="neutral">Neutral (No Impact)</option>
              </select>
            </div>
            
            <div>
              <Label>Accounting Code</Label>
              <Input
                value={formData.accounting_code}
                onChange={(e) => setFormData({...formData, accounting_code: e.target.value})}
                placeholder="GL account code"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              checked={formData.allows_negative}
              onCheckedChange={(checked) => setFormData({...formData, allows_negative: checked})}
            />
            <Label>Allow negative amounts (payouts)</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              checked={formData.requires_authorization}
              onCheckedChange={(checked) => setFormData({...formData, requires_authorization: checked})}
            />
            <Label>Require manager authorization</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({...formData, active: checked})}
            />
            <Label>Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Tender Type</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
