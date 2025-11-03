import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Clock,
  MapPin,
  User
} from "lucide-react";
import { format } from "date-fns";

export default function ActiveCashDrawersOverview({ activeShifts, currentScope }) {
  const [showDrillDown, setShowDrillDown] = useState(false);

  if (!activeShifts || activeShifts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Active Cash Drawers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No active shifts at this time</p>
        </CardContent>
      </Card>
    );
  }

  const totalCashInDrawers = activeShifts.reduce((sum, shift) => sum + (shift.cash_in_drawer || 0), 0);
  const highCashShifts = activeShifts.filter(shift => (shift.cash_in_drawer || 0) > 500);
  const lowCashShifts = activeShifts.filter(shift => (shift.cash_in_drawer || 0) < 50);

  return (
    <>
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowDrillDown(true)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Active Cash Drawers
            </span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-green-600">${totalCashInDrawers.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Total in Drawers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{activeShifts.length}</p>
              <p className="text-xs text-gray-500">Active Shifts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{highCashShifts.length}</p>
              <p className="text-xs text-gray-500">Need Safe Drop</p>
            </div>
          </div>

          {(highCashShifts.length > 0 || lowCashShifts.length > 0) && (
            <div className="flex gap-2 flex-wrap">
              {highCashShifts.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {highCashShifts.length} High Cash Alert
                </Badge>
              )}
              {lowCashShifts.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-700">
                  <AlertTriangle className="w-3 h-3" />
                  {lowCashShifts.length} Low Cash
                </Badge>
              )}
            </div>
          )}

          <Button variant="outline" className="w-full" onClick={(e) => {
            e.stopPropagation();
            setShowDrillDown(true);
          }}>
            View Active Shifts Details
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDrillDown} onOpenChange={setShowDrillDown}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Active Cash Drawer Details</DialogTitle>
            {currentScope && (
              <p className="text-sm text-gray-500">
                Viewing: {currentScope.label}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-3">
            {activeShifts.map((shift) => {
              const cashInDrawer = shift.cash_in_drawer || 0;
              const openingCash = shift.opening_cash || 0;
              const netChange = cashInDrawer - openingCash;
              const isHighCash = cashInDrawer > 500;
              const isLowCash = cashInDrawer < 50;

              return (
                <Card key={shift.id} className={`${isHighCash ? 'border-red-300 bg-red-50' : isLowCash ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Employee
                        </p>
                        <p className="font-semibold">{shift.employee_name}</p>
                        <p className="text-xs text-gray-500">{shift.shift_id}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Location & Terminal
                        </p>
                        <p className="font-semibold">{shift.location_id?.substring(0, 8)}...</p>
                        <p className="text-xs text-gray-500">Terminal: {shift.terminal_id}</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Started
                        </p>
                        <p className="font-semibold">
                          {format(new Date(shift.start_time), 'h:mm a')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(shift.start_time), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Cash Status
                        </p>
                        <p className={`text-lg font-bold ${isHighCash ? 'text-red-600' : isLowCash ? 'text-yellow-600' : 'text-green-600'}`}>
                          ${cashInDrawer.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">Opening: ${openingCash.toFixed(2)}</span>
                          <span className={`flex items-center gap-1 ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <TrendingUp className="w-3 h-3" />
                            {netChange >= 0 ? '+' : ''}${netChange.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isHighCash && (
                      <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <p className="text-sm text-red-700 font-semibold">
                          High cash alert - Safe drop recommended
                        </p>
                      </div>
                    )}

                    {isLowCash && (
                      <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm text-yellow-700 font-semibold">
                          Low cash - May need change fund replenishment
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}