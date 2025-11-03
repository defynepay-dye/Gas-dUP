import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const productColors = {
  regular: "bg-blue-100 text-blue-800",
  midgrade: "bg-yellow-100 text-yellow-800",
  premium: "bg-purple-100 text-purple-800",
  diesel: "bg-green-100 text-green-800",
  e85: "bg-orange-100 text-orange-800"
};

const statusColors = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800"
};

export default function RecentTransactions({ transactions, isLoading }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-48 mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">
                      Pump {transaction.pump_number} • {transaction.quantity_gallons?.toFixed(2)} gal
                    </h4>
                    <p className="text-sm text-gray-600">
                      {format(new Date(transaction.created_date), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${transaction.total_amount?.toFixed(2)}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <CreditCard className="w-3 h-3" />
                      {transaction.card_last_four ? `••••${transaction.card_last_four}` : transaction.payment_method}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge className={productColors[transaction.product_code] || "bg-gray-100 text-gray-800"}>
                    {transaction.product_code?.toUpperCase()}
                  </Badge>
                  <Badge className={statusColors[transaction.status] || "bg-gray-100 text-gray-800"}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
            {transactions.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No recent transactions</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}