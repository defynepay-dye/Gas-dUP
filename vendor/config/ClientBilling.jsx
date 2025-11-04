import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, Calendar, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function ClientBilling({ client, onRecordPayment }) {
  const billing = client.billing || {};
  const isOverdue = billing.outstanding_balance > 0;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Billing & Payments</CardTitle>
          <Button size="sm" onClick={onRecordPayment}>
            <DollarSign className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Monthly Fee</p>
            <p className="text-2xl font-bold text-blue-900">
              ${(billing.monthly_fee || 0).toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">Per Location Fee</p>
            <p className="text-2xl font-bold text-purple-900">
              ${(billing.per_location_fee || 0).toLocaleString()}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${isOverdue ? 'bg-red-50' : 'bg-green-50'}`}>
            <p className={`text-sm mb-1 ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
              Outstanding Balance
            </p>
            <p className={`text-2xl font-bold ${isOverdue ? 'text-red-900' : 'text-green-900'}`}>
              ${(billing.outstanding_balance || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {isOverdue && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800 font-medium">
              This account has an outstanding balance
            </p>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Payment Details</h4>
          <div className="space-y-2">
            {billing.payment_method && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Method:
                </span>
                <span className="font-medium capitalize">{billing.payment_method.replace('_', ' ')}</span>
              </div>
            )}
            {billing.last_payment_date && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Last Payment:
                </span>
                <span className="font-medium">
                  {format(new Date(billing.last_payment_date), 'MMM d, yyyy')}
                </span>
              </div>
            )}
            {billing.next_billing_date && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Next Billing:
                </span>
                <span className="font-medium">
                  {format(new Date(billing.next_billing_date), 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}