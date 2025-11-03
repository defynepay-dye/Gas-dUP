import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, AlertCircle, Save } from 'lucide-react';

export default function CancellationReasonsManager() {
  const [reasons, setReasons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReason, setEditingReason] = useState(null);

  useEffect(() => {
    loadReasons();
  }, []);

  const loadReasons = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.CancellationReason.list('sort_order');
      setReasons(data);
    } catch (error) {
      console.error('Failed to load cancellation reasons:', error);
    }
    setIsLoading(false);
  };

  const handleDelete = async (reasonId) => {
    if (!window.confirm('Are you sure you want to delete this cancellation reason?')) return;

    try {
      await base44.entities.CancellationReason.delete(reasonId);
      loadReasons();
    } catch (error) {
      console.error('Failed to delete reason:', error);
      alert('Failed to delete cancellation reason');
    }
  };

  const handleToggleActive = async (reason) => {
    try {
      await base44.entities.CancellationReason.update(reason.id, {
        is_active: !reason.is_active
      });
      loadReasons();
    } catch (error) {
      console.error('Failed to update reason:', error);
      alert('Failed to update cancellation reason');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Cancellation Reasons</h3>
          <p className="text-sm text-gray-600">Manage reasons for transaction cancellations in the POS</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Reason
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading cancellation reasons...</div>
      ) : reasons.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No cancellation reasons configured yet.</p>
            <p className="text-sm text-gray-500 mt-1">Add your first reason to enable transaction cancellation tracking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reasons.map(reason => (
            <Card key={reason.id} className={!reason.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">{reason.reason_text}</h4>
                      {!reason.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {reason.requires_manager_approval && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                          Requires Manager
                        </Badge>
                      )}
                      {reason.requires_note && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                          Requires Note
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Code: <span className="font-mono">{reason.reason_code}</span></p>
                    <p className="text-xs text-gray-500 mt-1">Sort Order: {reason.sort_order}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${reason.id}`} className="text-sm">Active</Label>
                      <Switch
                        id={`active-${reason.id}`}
                        checked={reason.is_active}
                        onCheckedChange={() => handleToggleActive(reason)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingReason(reason)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(reason.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && (
        <ReasonModal
          onClose={() => setShowAddModal(false)}
          onSuccess={loadReasons}
        />
      )}

      {editingReason && (
        <ReasonModal
          reason={editingReason}
          onClose={() => setEditingReason(null)}
          onSuccess={loadReasons}
        />
      )}
    </div>
  );
}

function ReasonModal({ reason, onClose, onSuccess }) {
  const [formData, setFormData] = useState(reason || {
    reason_text: '',
    reason_code: '',
    requires_manager_approval: false,
    requires_note: false,
    is_active: true,
    sort_order: 0
  });

  const handleSubmit = async () => {
    if (!formData.reason_text || !formData.reason_code) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (reason) {
        await base44.entities.CancellationReason.update(reason.id, formData);
      } else {
        await base44.entities.CancellationReason.create(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save cancellation reason:', error);
      alert('Failed to save cancellation reason');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reason ? 'Edit' : 'Add'} Cancellation Reason</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="reason_text">Reason Text *</Label>
            <Input
              id="reason_text"
              value={formData.reason_text}
              onChange={(e) => setFormData({...formData, reason_text: e.target.value})}
              placeholder="e.g., Customer changed mind"
            />
          </div>

          <div>
            <Label htmlFor="reason_code">Reason Code *</Label>
            <Input
              id="reason_code"
              value={formData.reason_code}
              onChange={(e) => setFormData({...formData, reason_code: e.target.value.toUpperCase().replace(/\s/g, '_')})}
              placeholder="e.g., CUSTOMER_CHANGE_MIND"
              className="font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">Use uppercase letters and underscores only</p>
          </div>

          <div>
            <Label htmlFor="sort_order">Sort Order</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in the list</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <Label htmlFor="requires_manager">Requires Manager Approval</Label>
              <p className="text-xs text-gray-600">Manager PIN required for this reason</p>
            </div>
            <Switch
              id="requires_manager"
              checked={formData.requires_manager_approval}
              onCheckedChange={(checked) => setFormData({...formData, requires_manager_approval: checked})}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <Label htmlFor="requires_note">Requires Note</Label>
              <p className="text-xs text-gray-600">Cashier must enter additional details</p>
            </div>
            <Switch
              id="requires_note"
              checked={formData.requires_note}
              onCheckedChange={(checked) => setFormData({...formData, requires_note: checked})}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <Label htmlFor="is_active">Active</Label>
              <p className="text-xs text-gray-600">Available for selection in POS</p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            <Save className="w-4 h-4 mr-2" />
            Save Reason
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}