import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function EmployeeBalanceWidget({ currentUser, onPayDown }) {
  const [showBalance, setShowBalance] = useState(false);

  if (!currentUser?.employee_purchase_settings?.allow_purchases_on_credit) {
    return null;
  }

  const currentBalance = currentUser.employee_purchase_settings.current_payable_balance || 0;
  const creditLimit = currentUser.employee_purchase_settings.credit_limit || 0;
  const availableCredit = creditLimit - currentBalance;
  const percentUsed = creditLimit > 0 ? (currentBalance / creditLimit * 100) : 0;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Employee Balance</p>
              {showBalance ? (
                <p className={`text-2xl font-bold ${currentBalance > creditLimit * 0.8 ? 'text-red-600' : 'text-blue-600'}`}>
                  ${currentBalance.toFixed(2)}
                </p>
              ) : (
                <p className="text-2xl font-bold text-gray-400">••••••</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Available Credit: ${availableCredit.toFixed(2)} / ${creditLimit.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            {currentBalance > 0 && (
              <Button
                size="sm"
                onClick={onPayDown}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Pay Now
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                percentUsed > 80 ? 'bg-red-500' : percentUsed > 50 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{percentUsed.toFixed(0)}% used</span>
            {percentUsed > 80 && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Near Limit
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}