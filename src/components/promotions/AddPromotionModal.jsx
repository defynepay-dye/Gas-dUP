import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AddPromotionModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Promotion</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">Add promotion form - Coming soon</p>
      </DialogContent>
    </Dialog>
  );
}
