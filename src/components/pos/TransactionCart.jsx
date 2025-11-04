
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, AlertCircle, Pause, DollarSign, Ticket, ArrowDown, CreditCard, Star, XCircle } from 'lucide-react';
import { SalesRestrictionRule, PricingSettings } from "@/api/entities";
import { Badge } from "@/components/ui/badge";

const cashDenominations = [
  { label: "$100", value: 100, color: "bg-green-600 hover:bg-green-700" },
  { label: "$50", value: 50, color: "bg-purple-600 hover:bg-purple-700" },
  { label: "$20", value: 20, color: "bg-green-500 hover:bg-green-600" },
  { label: "$10", value: 10, color: "bg-yellow-600 hover:bg-yellow-700" },
  { label: "$5", value: 5, color: "bg-blue-500 hover:bg-blue-600" }
];

const checkRestrictions = (item, restrictions) => {
    if (!item.category) return null;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    for (const rule of restrictions) {
        if (rule.category === item.category && rule.is_active) {
            if (rule.days_of_week && rule.days_of_week.includes(currentDay)) {
                if (rule.start_time && rule.end_time && currentTime >= rule.start_time && currentTime <= rule.end_time) {
                    return `Sale of ${item.category} is restricted at this time (${rule.rule_name}).`;
                }
            }
        }
    }
    return null;
};

export default function TransactionCart({ 
    cart,
    onRemoveItem, 
    onUpdateQuantity, 
    onClearCart, 
    subtotal, 
    taxTotal, 
    total, 
    promotionDiscount,
    appliedDeals,
    onShowPayment,
    onHold,
    onExactCash,
    onQuickCash,
    onLotteryPayout,
    onSafeDrop, 
    salesRestrictions = [],
    activeShift,
    onCancelTransaction,
}) {
    const [restrictedItems, setRestrictedItems] = useState({});
    const [pricingSettings, setPricingSettings] = useState(null);

    const cartItems = useMemo(() => cart?.items || [], [cart?.items]);
    const customer = useMemo(() => cart?.customer, [cart?.customer]);
    const loyaltyDiscount = useMemo(() => cart?.loyalty_discount || 0, [cart?.loyalty_discount]);

    useEffect(() => {
        loadPricingSettings();
    }, []);

    const loadPricingSettings = async () => {
        try {
            const settings = await PricingSettings.list();
            if (settings && settings.length > 0) {
                setPricingSettings(settings[0]);
            }
        } catch (error) {
            console.error("Failed to load pricing settings:", error);
        }
    };

    useEffect(() => {
        if (!cartItems || cartItems.length === 0) {
            setRestrictedItems({});
            return;
        }

        const verifyCart = () => {
            const newRestrictedItems = {};
            for (const item of cartItems) {
                const itemKey = item.upc_code || item.id;
                const restrictionError = checkRestrictions(item, salesRestrictions);
                if (restrictionError) {
                    newRestrictedItems[itemKey] = restrictionError;
                }
            }
            setRestrictedItems(newRestrictedItems);
        };

        verifyCart();
    }, [cartItems, salesRestrictions]);

    const hasRestrictedItems = Object.keys(restrictedItems).length > 0;
    const hasItems = cartItems && cartItems.length > 0;
    const canTakeAction = !hasRestrictedItems && hasItems;

    // Calculate both cash and credit totals
    const { cashTotal, creditTotal } = useMemo(() => {
        if (!pricingSettings || !pricingSettings.dual_pricing_enabled) {
            const totalWithDiscount = (total || 0) - loyaltyDiscount;
            return { cashTotal: totalWithDiscount, creditTotal: totalWithDiscount };
        }

        let cashSubtotal = 0;
        let creditSubtotal = 0;

        cartItems.forEach(item => {
            const cashPrice = item.cash_price || item.unit_price;
            cashSubtotal += cashPrice * item.quantity;

            let creditPrice = cashPrice;
            if (item.is_fuel) {
                const markup = (pricingSettings.credit_markup_cents_fuel || 0) / 100;
                creditPrice = cashPrice + markup;
            } else {
                const markupPercent = (pricingSettings.credit_markup_percent_dry_stock || 0) / 100;
                creditPrice = cashPrice * (1 + markupPercent);
            }
            creditSubtotal += creditPrice * item.quantity;
        });

        const taxAmount = cartItems.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
        const promoDiscount = cartItems.reduce((sum, item) => sum + (item.discount || 0), 0);

        const cashFinal = cashSubtotal + taxAmount - promoDiscount - loyaltyDiscount;
        const creditFinal = creditSubtotal + taxAmount - promoDiscount - loyaltyDiscount;

        return {
            cashTotal: parseFloat(cashFinal.toFixed(2)),
            creditTotal: parseFloat(creditFinal.toFixed(2))
        };
    }, [pricingSettings, cartItems, total, taxTotal, promotionDiscount, loyaltyDiscount]);

    return (
        <div className="bg-white rounded-lg shadow-md flex flex-col" style={{ height: 'calc(100vh - 280px)' }}>
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                <h2 className="text-lg font-semibold">Current Sale</h2>
            </div>

            {hasRestrictedItems && (
                <div className="p-3 bg-red-50 border-b border-red-200 flex-shrink-0">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                            <p className="font-semibold text-red-800">Restricted Item(s) in Cart</p>
                            <p className="text-sm text-red-700">Cannot complete sale. Please remove the highlighted items.</p>
                        </div>
                    </div>
                </div>
            )}

            {pricingSettings && pricingSettings.dual_pricing_enabled && hasItems && (
                <div className="p-2 bg-blue-50 border-b flex-shrink-0">
                    <p className="text-xs text-center font-semibold text-blue-900">
                        ⚖️ DUAL PRICING ACTIVE - Both Cash & Credit Prices Displayed
                    </p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0">
                {!hasItems ? (
                    <div className="text-center text-gray-500 p-8">
                        <p className="text-xl">No Items</p>
                        <p className="text-sm mt-2">Scan item, select from Quick Items, or authorize a pump</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {cartItems.map((item) => {
                            const itemKey = item.upc_code || item.id;
                            const isRestricted = !!restrictedItems[itemKey];
                            const isPendingFuel = item.is_fuel && item.pending_authorization;
                            
                            // Calculate both prices for this item
                            const cashPrice = item.cash_price || item.unit_price;
                            let creditPrice = cashPrice;
                            
                            if (pricingSettings && pricingSettings.dual_pricing_enabled) {
                                if (item.is_fuel) {
                                    const markup = (pricingSettings.credit_markup_cents_fuel || 0) / 100;
                                    creditPrice = cashPrice + markup;
                                } else {
                                    const markupPercent = (pricingSettings.credit_markup_percent_dry_stock || 0) / 100;
                                    creditPrice = cashPrice * (1 + markupPercent);
                                }
                            }
                            
                            return (
                                <div key={itemKey} className={`p-4 ${isRestricted ? 'bg-red-50' : isPendingFuel ? 'bg-blue-50' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{item.product_name}</p>
                                                {isPendingFuel && (
                                                    <Badge className="bg-blue-600 text-white text-xs">
                                                        PENDING AUTH
                                                    </Badge>
                                                )}
                                            </div>
                                            
                                            {/* DUAL PRICING DISPLAY - ALWAYS SHOW BOTH */}
                                            {pricingSettings && pricingSettings.dual_pricing_enabled && (
                                                <div className="mt-2 p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded border border-gray-200">
                                                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                                                        <div className="text-center p-1.5 bg-green-100 rounded border border-green-300">
                                                            <div className="text-green-800 text-[10px] uppercase">Cash Price</div>
                                                            <div className="text-green-900 text-base">${(cashPrice * item.quantity).toFixed(2)}</div>
                                                            <div className="text-green-700 text-[10px]">${cashPrice.toFixed(2)} each</div>
                                                        </div>
                                                        <div className="text-center p-1.5 bg-blue-100 rounded border border-blue-300">
                                                            <div className="text-blue-800 text-[10px] uppercase">Credit Price</div>
                                                            <div className="text-blue-900 text-base">${(creditPrice * item.quantity).toFixed(2)}</div>
                                                            <div className="text-blue-700 text-[10px]">${creditPrice.toFixed(2)} each</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-2 mt-2">
                                                {!item.is_fuel ? (
                                                    <>
                                                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => onUpdateQuantity(itemKey, item.quantity - 1)}>-</Button>
                                                        <span className="text-sm text-gray-700 w-8 text-center">{item.quantity}</span>
                                                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => onUpdateQuantity(itemKey, item.quantity + 1)}>+</Button>
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-gray-700">{item.quantity.toFixed(2)} gal</span>
                                                )}
                                            </div>
                                            {item.discount > 0 && (
                                                <p className="text-xs text-green-600 mt-1">Discount: -${(item.discount || 0).toFixed(2)}</p>
                                            )}
                                            {isRestricted && (
                                                <p className="text-xs text-red-600 mt-1">{restrictedItems[itemKey]}</p>
                                            )}
                                            {isPendingFuel && (
                                                <p className="text-xs text-blue-700 mt-1">⏳ Pump will authorize after payment</p>
                                            )}
                                        </div>
                                        <div className="text-right ml-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-500 hover:text-red-600"
                                                onClick={() => onRemoveItem(itemKey)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 border-t">
                {hasItems && (
                    <div className="p-3 space-y-2 bg-gray-50">
                        {customer && (
                            <div className="flex justify-between text-sm bg-purple-50 p-2 rounded mb-2">
                                <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500" />
                                    {customer.profile?.full_name || customer.customer_phone}
                                </span>
                                <Badge className="bg-purple-600 text-white">
                                    {customer.available_points || 0} pts
                                </Badge>
                            </div>
                        )}
                        
                        {promotionDiscount > 0 && (
                            <div className="flex justify-between text-sm font-medium text-green-600">
                                <span>Promotions</span>
                                <span>-${(promotionDiscount || 0).toFixed(2)}</span>
                            </div>
                        )}
                        {loyaltyDiscount > 0 && (
                            <div className="flex justify-between text-sm font-medium text-purple-600">
                                <span>Loyalty Rewards</span>
                                <span>-${(loyaltyDiscount).toFixed(2)}</span>
                            </div>
                        )}
                        
                        {/* DUAL PRICING TOTALS - BOTH DISPLAYED */}
                        {pricingSettings && pricingSettings.dual_pricing_enabled ? (
                            <div className="border-t pt-2 mt-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-green-100 p-3 rounded-lg border-2 border-green-600">
                                        <div className="text-xs font-bold text-green-800 uppercase text-center mb-1">Cash Total</div>
                                        <div className="text-2xl font-bold text-green-900 text-center">${cashTotal.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-lg border-2 border-blue-600">
                                        <div className="text-xs font-bold text-blue-800 uppercase text-center mb-1">Credit Total</div>
                                        <div className="text-2xl font-bold text-blue-900 text-center">${creditTotal.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between text-xl font-bold border-t pt-2">
                                <span>TOTAL</span>
                                <span className="text-green-600">${(cashTotal).toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                )}

                {hasItems && (
                    <div className="p-2 bg-blue-50 border-t">
                        <div className="text-xs font-semibold mb-2 text-center">QUICK CASH PAYMENT</div>
                        <div className="grid grid-cols-3 gap-2">
                            {cashDenominations.map((denom) => (
                                <Button
                                    key={denom.value}
                                    onClick={() => onQuickCash(denom.value)}
                                    className={`${denom.color} text-white font-bold h-16 text-lg`}
                                    disabled={hasRestrictedItems || cashTotal > denom.value}
                                >
                                    {denom.label}
                                </Button>
                            ))}
                            <Button
                                onClick={onExactCash}
                                className="bg-green-700 hover:bg-green-800 text-white font-bold h-16 text-sm col-span-3"
                                disabled={!canTakeAction}
                            >
                                <DollarSign className="w-5 h-5 mr-1" /> EXACT CASH
                            </Button>
                        </div>
                    </div>
                )}

                <div className="p-2 space-y-2 border-t bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                        <Button 
                            variant="outline" 
                            onClick={onHold} 
                            disabled={!canTakeAction}
                            className="h-10 text-sm"
                        >
                            <Pause className="w-4 h-4 mr-1" /> Hold
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={onLotteryPayout}
                            className="h-10 text-sm"
                        >
                            <Ticket className="w-4 h-4 mr-1" /> Lotto
                        </Button>
                    </div>

                    <Button 
                        size="lg" 
                        className="w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700"
                        onClick={onShowPayment} 
                        disabled={!canTakeAction}
                    >
                        <CreditCard className="w-5 h-5 mr-2" />
                        OTHER PAYMENT
                    </Button>

                    {hasItems && (
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                onClick={onClearCart}
                                variant="outline"
                                className="border-gray-300 text-sm"
                                disabled={!hasItems}
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Clear Cart
                            </Button>
                            <Button
                                onClick={onCancelTransaction}
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50 text-sm"
                                disabled={!hasItems}
                            >
                                <XCircle className="w-4 h-4 mr-1" />
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
