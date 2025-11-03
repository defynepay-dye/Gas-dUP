
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Added DialogFooter
import {
  DollarSign
} from "lucide-react";
import CashAdjustmentModal from './CashAdjustmentModal';
import NoSaleModal from './NoSaleModal';
import PayDownBalanceModal from './PayDownBalanceModal'; // New import for PayDownBalanceModal

export default function AdminPanel({
  currentShift, // Kept from original, essential for CashAdjustmentModal and NoSaleModal
  onClose,
  onRefresh, // Kept from original, essential for CashAdjustmentModal and NoSaleModal
  onLogout, // New prop
  currentUser, // New prop
  onOpenClockIn // New prop
}) {
  const [showCashAdjustment, setShowCashAdjustment] = useState(false);
  const [showNoSale, setShowNoSale] = useState(false);
  const [showPayDown, setShowPayDown] = useState(false); // New state for Pay Down Balance modal

  // Logic to determine if the employee has a payable balance
  const employeeHasBalance = currentUser?.employee_purchase_settings?.allow_purchases_on_credit &&
    (currentUser?.employee_purchase_settings?.current_payable_balance || 0) > 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"> {/* Updated DialogContent styling */}
        <DialogHeader>
          <DialogTitle>Admin & Settings</DialogTitle> {/* Updated DialogTitle text */}
        </DialogHeader>

        <Tabs defaultValue="quick" className="w-full"> {/* Changed default tab to "quick" */}
          <TabsList className="grid w-full grid-cols-4"> {/* Changed grid-cols to 4 */}
            <TabsTrigger value="quick">Quick Actions</TabsTrigger> {/* New tab trigger for quick actions */}
            <TabsTrigger value="cash">Cash Management</TabsTrigger> {/* Renamed tab trigger (was 'system') */}
            <TabsTrigger value="reports">Reports</TabsTrigger> {/* Existing tab trigger */}
            <TabsTrigger value="settings">Settings</TabsTrigger> {/* New tab trigger for system settings */}
          </TabsList>

          {/* NEW TabContent for Quick Actions (incorporates old cash management buttons) */}
          <TabsContent value="quick" className="space-y-4">
            <div className="grid grid-cols-2 gap-4"> {/* Grid for consistent button layout */}
              {/* Existing Cash Adjustment Button, updated className for consistent styling */}
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 justify-center items-center text-center"
                onClick={() => setShowCashAdjustment(true)}
                disabled={!currentShift}
              >
                <DollarSign className="w-8 h-8" /> {/* Increased icon size */}
                <span>Cash Drawer Adjustment</span>
              </Button>

              {/* Existing No-Sale Button, updated className for consistent styling */}
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 justify-center items-center text-center"
                onClick={() => setShowNoSale(true)}
                disabled={!currentShift}
              >
                <DollarSign className="w-8 h-8" /> {/* Increased icon size */}
                <span>Open Drawer (No Sale)</span>
              </Button>

              {/* NEW: Pay Down Balance Button (conditionally rendered) */}
              {employeeHasBalance && (
                <Button
                  variant="outline"
                  className="h-24 flex flex-col gap-2 justify-center items-center text-center"
                  onClick={() => setShowPayDown(true)}
                >
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <span>Pay Down Balance</span>
                  <span className="text-xs text-green-600 font-semibold">
                    ${currentUser.employee_purchase_settings.current_payable_balance.toFixed(2)} owed
                  </span>
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Cash Management TabContent (was original 'system' tab, now dedicated to cash management ops) */}
          <TabsContent value="cash" className="space-y-3 mt-4">
            <p className="text-sm text-gray-500">Cash management operations and reports will be available here.</p> {/* Updated text */}
          </TabsContent>

          {/* Existing Reports TabContent */}
          <TabsContent value="reports" className="space-y-3 mt-4">
            <p className="text-sm text-gray-500">Quick reports and summaries will be displayed here.</p>
          </TabsContent>

          {/* NEW: Settings TabContent */}
          <TabsContent value="settings" className="space-y-3 mt-4">
            <p className="text-sm text-gray-500 mb-4">General settings for the POS system and employee actions.</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onLogout}
              >
                Logout
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onOpenClockIn}
              >
                Clock In/Out
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter> {/* New DialogFooter for a consistent close button */}
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>

      {/* Existing Modals */}
      {showCashAdjustment && currentShift && (
        <CashAdjustmentModal
          shift={currentShift}
          onClose={() => setShowCashAdjustment(false)}
          onAdjustmentComplete={onRefresh}
        />
      )}

      {showNoSale && currentShift && (
        <NoSaleModal
          shift={currentShift}
          onClose={() => setShowNoSale(false)}
          onNoSaleComplete={onRefresh}
        />
      )}

      {/* NEW: PayDownBalanceModal (conditionally rendered) */}
      {showPayDown && currentUser && ( // Added currentUser check for safety
        <PayDownBalanceModal
          employee={currentUser}
          onClose={() => setShowPayDown(false)}
          onSuccess={() => {
            setShowPayDown(false);
            window.location.reload(); // Refresh to update balance display after successful payment
          }}
        />
      )}
    </Dialog>
  );
}
