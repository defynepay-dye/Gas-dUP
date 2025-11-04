import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { POSTransaction } from "@/api/entities";
import { Receipt, Search, Printer, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

export default function TransactionJournal({ onClose, onRecallTransaction }) {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTransaction, setExpandedTransaction] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    let filtered = [...transactions];
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.transaction_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.cashier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.total_amount?.toString().includes(searchTerm)
      );
    }
    
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm]);

  const loadTransactions = async () => {
    setIsLoading(true);
    const data = await POSTransaction.list("-created_date", 50);
    setTransactions(data);
    setIsLoading(false);
  };

  const reprintReceipt = (transaction) => {
    alert(`Reprinting receipt for transaction ${transaction.transaction_number}`);
  };

  const statusColors = {
    completed: "bg-green-100 text-green-800",
    void: "bg-red-100 text-red-800",
    refunded: "bg-yellow-100 text-yellow-800",
    pending: "bg-blue-100 text-blue-800"
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Transaction Journal
            <Badge className="ml-2 bg-blue-600">Double-click to Return</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-y-auto max-h-[calc(85vh-200px)]">
            {isLoading ? (
              <div className="text-center py-8">Loading transactions...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="border rounded-lg hover:shadow-lg transition-all cursor-pointer"
                    onDoubleClick={() => onRecallTransaction(transaction)}
                  >
                    <div 
                      className="p-4 hover:bg-gray-50"
                      onClick={() => setExpandedTransaction(
                        expandedTransaction === transaction.id ? null : transaction.id
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-bold text-lg">{transaction.transaction_number}</h4>
                            <Badge className={statusColors[transaction.status] || "bg-gray-100 text-gray-800"}>
                              {transaction.status}
                            </Badge>
                            {expandedTransaction === transaction.id ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {format(new Date(transaction.created_date), "MMM d, yyyy h:mm a")} • {transaction.cashier_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-2xl text-green-600">
                            ${(transaction.total_amount || 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.items?.length || 0} items
                          </p>
                        </div>
                      </div>

                      {expandedTransaction === transaction.id && transaction.items && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div className="space-y-2">
                            {transaction.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                <div className="flex-1">
                                  <p className="font-medium">{item.product_name}</p>
                                  <p className="text-gray-500">
                                    Qty: {item.quantity} × ${(item.unit_price || 0).toFixed(2)}
                                  </p>
                                </div>
                                <p className="font-bold">${(item.total_price || 0).toFixed(2)}</p>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between pt-2 border-t">
                            <div className="space-y-1 text-sm">
                              <p>Subtotal: ${(transaction.subtotal || 0).toFixed(2)}</p>
                              <p>Tax: ${(transaction.tax_total || 0).toFixed(2)}</p>
                              <p className="font-bold">Total: ${(transaction.total_amount || 0).toFixed(2)}</p>
                            </div>
                            <div className="text-sm text-right text-gray-600">
                              {transaction.payments?.map((payment, idx) => (
                                <p key={idx}>
                                  {payment.method.replace('_', ' ')}
                                  {payment.card_last_four && ` ••••${payment.card_last_four}`}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 p-2 bg-gray-50 border-t rounded-b-lg">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          reprintReceipt(transaction);
                        }}
                        className="flex-1"
                      >
                        <Printer className="w-3 h-3 mr-1" />
                        Reprint
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRecallTransaction(transaction);
                        }}
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                        disabled={transaction.status === 'refunded' || transaction.status === 'void'}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Return/Refund
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}