import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { DollarSign, User, Lock, Monitor } from "lucide-react";
import { User as UserEntity } from "@/api/entities";
import { TimeClockEntry } from "@/api/entities";

export default function StartShiftModal({ onStart, onClose }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [shiftData, setShiftData] = useState({
    employee_name: "",
    terminal_id: "",
    opening_cash: "",
  });
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await UserEntity.me();
        setCurrentUser(user);
        setShiftData(prev => ({
          ...prev,
          employee_name: user.full_name,
          terminal_id: user.default_terminal_id || ""
        }));
      } catch (err) {
        console.error("Failed to load user:", err);
        setError("Failed to load user information");
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleStart = async () => {
    if (!shiftData.employee_name || !shiftData.opening_cash || !shiftData.terminal_id) {
      setError("Please fill in all required fields");
      return;
    }

    if (!pin || pin.length !== 4) {
      setError("Please enter your 4-digit PIN");
      return;
    }

    // Verify PIN matches user's PIN
    if (currentUser.pin && currentUser.pin !== pin) {
      setError("Invalid PIN. Please try again.");
      setPin("");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const shiftId = `SHIFT-${Date.now()}`;
      const now = new Date().toISOString();
      
      // Create TimeClockEntry first
      const timeEntry = await TimeClockEntry.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        clock_in_time: now,
        shift_id: shiftId,
        location_id: currentUser.assigned_location_id || 'default',
        status: 'clocked_in'
      });

      // Create Shift with link to TimeClockEntry
      const shiftDataToCreate = {
        shift_id: shiftId,
        employee_name: shiftData.employee_name,
        employee_id: currentUser.id,
        terminal_id: shiftData.terminal_id,
        location_id: currentUser.assigned_location_id || 'default',
        start_time: now,
        status: 'active',
        opening_cash: parseFloat(shiftData.opening_cash),
        cash_in_drawer: parseFloat(shiftData.opening_cash),
        time_clock_entry_id: timeEntry.id
      };

      onStart(shiftDataToCreate);
    } catch (err) {
      console.error("Failed to start shift:", err);
      setError("Failed to start shift. Please try again.");
      setIsLoading(false);
    }
  };

  if (isLoading && !currentUser) {
    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="text-center py-8">Loading user information...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start New Shift</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employeeName" className="text-right">Employee</Label>
            <div className="relative col-span-3">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="employeeName"
                value={shiftData.employee_name}
                disabled
                className="pl-10 bg-gray-50"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="terminal_id" className="text-right">
              Terminal
            </Label>
            <div className="relative col-span-3">
              <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="terminal_id"
                value={shiftData.terminal_id}
                onChange={(e) => setShiftData({ ...shiftData, terminal_id: e.target.value })}
                className="pl-10"
                placeholder="e.g., POS-1, Register 1"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="openingCash" className="text-right">Opening Cash</Label>
            <div className="relative col-span-3">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="openingCash"
                type="number"
                step="0.01"
                value={shiftData.opening_cash}
                onChange={(e) => setShiftData({ ...shiftData, opening_cash: e.target.value })}
                placeholder="e.g., 200.00"
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pin" className="text-right">Your PIN</Label>
            <div className="relative col-span-3">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="pin"
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit PIN"
                className="pl-10"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            <p><strong>Automated Time Tracking:</strong> Starting your shift will automatically clock you in.</p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={handleStart}
            disabled={!shiftData.employee_name || !shiftData.opening_cash || !shiftData.terminal_id || pin.length !== 4 || isLoading}
          >
            {isLoading ? 'Starting...' : 'Start Shift & Clock In'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}