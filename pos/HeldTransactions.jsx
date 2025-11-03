
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pause, ArrowLeft } from "lucide-react"; // Changed Hold to Pause
import { format } from "date-fns";

export default function HeldTransactions({ transactions, onRecall, onClose }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pause className="w-5 h-5" /> {/* Changed Hold to Pause */}
            Held Transactions ({transactions.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Pause className="w-12 h-12 mx-auto mb-4 opacity-30" /> {/* Changed Hold to Pause */}
              <p>No held transactions</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium">Transaction #{transaction.id}</h4>
                    <p className="text-sm text-gray-600">
                      {format(transaction.timestamp, "h:mm a")} • {transaction.cashier}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      ${transaction.items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
                    </p>
                    <Badge variant="secondary">{transaction.items.length} items</Badge>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-sm space-y-1">
                    {transaction.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.product_name} x{item.quantity}</span>
                        <span>${item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                    {transaction.items.length > 3 && (
                      <div className="text-gray-500">
                        +{transaction.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => onRecall(transaction.id)}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Recall Transaction
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
