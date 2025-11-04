import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle, Shield } from 'lucide-react';

export default function CancelTransactionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  cartItemCount,
  cartTotal 
}) {
  const [reasons, setReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState(null);
  const [additionalNote, setAdditionalNote] = useState('');
  const [managerPin, setManagerPin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [requiresManagerApproval, setRequiresManagerApproval] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadReasons();
      setSelectedReason(null);
      setAdditionalNote('');
      setManagerPin('');
      setRequiresManagerApproval(false);
    }
  }, [isOpen]);

  const loadReasons = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.CancellationReason.filter(
        { is_active: true },
        'sort_order'
      );
      setReasons(data);
    } catch (error) {
      console.error('Failed to load cancellation reasons:', error);
      setReasons([]);
    }
    setIsLoading(false);
  };

  const handleReasonSelect = (reason) => {
    setSelectedReason(reason);
    setRequiresManagerApproval(reason.requires_manager_approval);
    if (!reason.requires_note) {
      setAdditionalNote('');
    }
  };

  const handleConfirm = async () => {
    if (!selectedReason) {
      alert('Please select a cancellation reason');
      return;
    }

    if (selectedReason.requires_note && !additionalNote.trim()) {
      alert('Please provide additional details for this cancellation reason');
      return;
    }

    if (requiresManagerApproval && !managerPin) {
      alert('Manager PIN is required for this cancellation reason');
      return;
    }

    // Verify manager PIN if required
    if (requiresManagerApproval) {
      try {
        const users = await base44.entities.User.filter({ pin: managerPin });
        const manager = users.find(u => ['admin', 'store_manager', 'regional_manager'].includes(u.role));
        
        if (!manager) {
          alert('Invalid manager PIN');
          return;
        }

        // Pass manager info to parent
        onConfirm({
          reason: selectedReason,
          note: additionalNote,
          managerOverride: manager.full_name
        });
      } catch (error) {
        console.error('Failed to verify manager PIN:', error);
        alert('Failed to verify manager PIN');
        return;
      }
    } else {
      onConfirm({
        reason: selectedReason,
        note: additionalNote,
        managerOverride: null
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            Cancel Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-yellow-900">Are you sure you want to cancel this transaction?</p>
                <p className="text-sm text-yellow-700 mt-1">
                  {cartItemCount} item{cartItemCount !== 1 ? 's' : ''} totaling ${cartTotal.toFixed(2)} will be cancelled.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Select Cancellation Reason *</Label>
            {isLoading ? (
              <div className="text-center py-4 text-gray-500">Loading reasons...</div>
            ) : reasons.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-600">No cancellation reasons configured.</p>
                <p className="text-sm text-gray-500 mt-1">Please contact your administrator.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {reasons.map(reason => (
                  <button
                    key={reason.id}
                    onClick={() => handleReasonSelect(reason)}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      selectedReason?.id === reason.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium flex-1">{reason.reason_text}</span>
                      <div className="flex gap-1 flex-shrink-0">
                        {reason.requires_manager_approval && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Manager
                          </Badge>
                        )}
                        {reason.requires_note && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                            Note Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedReason?.requires_note && (
            <div>
              <Label htmlFor="note">Additional Details *</Label>
              <Textarea
                id="note"
                value={additionalNote}
                onChange={(e) => setAdditionalNote(e.target.value)}
                placeholder="Please provide additional details about this cancellation..."
                rows={3}
                className="mt-1"
              />
            </div>
          )}

          {requiresManagerApproval && (
            <div>
              <Label htmlFor="manager_pin" className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-yellow-600" />
                Manager PIN *
              </Label>
              <Input
                id="manager_pin"
                type="password"
                maxLength={4}
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit manager PIN"
                className="font-mono text-lg tracking-widest mt-1"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Keep Transaction
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason?.requires_note && !additionalNote.trim())}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}