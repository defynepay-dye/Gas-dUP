
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock, User, CheckCircle, X } from 'lucide-react';

export default function ShiftCard({ shift, onEndShift, onReconcile }) {
    const statusConfig = {
        active: {
            badge: "bg-green-100 text-green-800",
            border: "border-green-300",
            bg: "bg-green-50"
        },
        completed: {
            badge: "bg-gray-100 text-gray-800",
            border: "border-gray-200",
            bg: "bg-white"
        },
        cancelled: {
            badge: "bg-red-100 text-red-800",
            border: "border-red-200",
            bg: "bg-red-50"
        }
    };

    const config = statusConfig[shift.status] || statusConfig.completed;

    return (
        <Card className={`${config.bg} ${config.border}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-0">
                <CardTitle className="text-base font-semibold">
                    Shift #{shift.id}
                </CardTitle>
                <Badge className={config.badge}>{shift.status.toUpperCase()}</Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        {shift.employee_name}
                    </span>
                    {shift.terminal_id && (
                        <Badge variant="outline">{shift.terminal_id}</Badge>
                    )}
                </div>

                <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(shift.start_time), 'MMM d, h:mm a')}</span>
                    {shift.end_time ? (
                        <>
                            <span>-</span>
                            <span>{format(new Date(shift.end_time), 'h:mm a')}</span>
                        </>
                    ) : (
                        <span>({formatDistanceToNow(new Date(shift.start_time))} ago)</span>
                    )}
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Opening Cash:</span>
                    <span className="font-medium">${shift.opening_cash?.toFixed(2) || '0.00'}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Sales:</span>
                    <span className="font-medium text-green-600">${shift.total_sales?.toFixed(2) || '0.00'}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Transactions:</span>
                    <span className="font-medium">{shift.transaction_count || 0}</span>
                </div>

                {shift.status === 'completed' && (
                    <>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Closing Cash:</span>
                            <span className="font-medium">
                                {shift.closing_cash ? `$${shift.closing_cash.toFixed(2)}` : 'N/A'}
                            </span>
                        </div>

                        {shift.cash_variance !== undefined && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Variance:</span>
                                <span className={`font-semibold ${
                                  Math.abs(shift.cash_variance) < 0.01 ? 'text-green-600' :
                                  shift.cash_variance > 0 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {shift.cash_variance >= 0 ? '+' : ''}${shift.cash_variance.toFixed(2)}
                                </span>
                            </div>
                        )}

                        {shift.no_sale_count > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">No-Sale Opens:</span>
                                <span className="font-semibold">{shift.no_sale_count}</span>
                            </div>
                        )}

                        {!shift.reconciled && onReconcile && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onReconcile(shift)}
                                className="w-full mt-2"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Reconcile Shift
                            </Button>
                        )}

                        {shift.reconciled && (
                            <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-800">
                                ✓ Reconciled by {shift.reconciled_by}
                            </div>
                        )}
                    </>
                )}

                {shift.status === 'active' && onEndShift && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onEndShift(shift)}
                        className="w-full"
                    >
                        <X className="w-4 h-4 mr-2" />
                        End Shift
                    </Button>
                )}

                {shift.notes && (
                    <div className="pt-4 border-t">
                        <p className="text-sm font-medium">Notes:</p>
                        <p className="text-sm text-gray-600 italic">"{shift.notes}"</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
