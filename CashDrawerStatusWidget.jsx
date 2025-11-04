import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function CashDrawerStatusWidget({ activeShift }) {
  if (!activeShift) {
    return (
      <Card className="border-2 border-gray-200">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 text-sm">No active shift</p>
        </CardContent>
      </Card>
    );
  }

  const currentCash = activeShift.cash_in_drawer || 0;
  const openingCash = activeShift.opening_cash || 0;
  const netChange = currentCash - openingCash;
  const netChangePercent = openingCash > 0 ? ((netChange / openingCash) * 100) : 0;

  // Calculate shift duration
  const startTime = new Date(activeShift.start_time);
  const now = new Date();
  const durationMinutes = Math.floor((now - startTime) / (1000 * 60));
  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;

  // Determine status color based on cash level
  let statusColor = 'bg-green-100 border-green-300';
  let statusIcon = <CheckCircle className="w-5 h-5 text-green-600" />;
  let statusText = 'Normal';

  if (currentCash < 100) {
    statusColor = 'bg-yellow-100 border-yellow-300';
    statusIcon = <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    statusText = 'Low Cash';
  } else if (currentCash > 500) {
    statusColor = 'bg-orange-100 border-orange-300';
    statusIcon = <AlertTriangle className="w-5 h-5 text-orange-600" />;
    statusText = 'High Cash - Consider Safe Drop';
  }

  return (
    <Card className={`border-2 ${statusColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Cash Drawer Status</CardTitle>
          {statusIcon}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Cash - Prominent Display */}
        <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Current Cash in Drawer</p>
          <div className="flex items-baseline gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">{currentCash.toFixed(2)}</span>
          </div>
          <Badge className={`mt-2 ${statusColor} text-gray-900 border-0`}>
            {statusText}
          </Badge>
        </div>

        {/* Net Change */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Opening Cash</p>
            <p className="text-lg font-semibold text-gray-700">${openingCash.toFixed(2)}</p>
          </div>
          <div className={`rounded-lg p-3 ${netChange >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-xs text-gray-500 mb-1">Net Change</p>
            <div className="flex items-center gap-1">
              {netChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-lg font-semibold ${netChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {netChange >= 0 ? '+' : ''}{netChange.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {netChange >= 0 ? '+' : ''}{netChangePercent.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Shift Duration */}
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 rounded-lg p-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Shift Duration: <strong>{durationHours}h {remainingMinutes}m</strong></span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div>
            <p className="text-xs text-gray-500">Cashier</p>
            <p className="text-sm font-medium truncate">{activeShift.employee_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Terminal</p>
            <p className="text-sm font-medium">{activeShift.terminal_id || 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}