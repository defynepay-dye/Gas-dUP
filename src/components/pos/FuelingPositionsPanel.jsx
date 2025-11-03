
import React, { useState, useEffect } from 'react';
import { Pump, Product } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Fuel,
  DollarSign,
  Droplets,
  Circle,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  CreditCard
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function FuelingPositionsPanel({ pumps: propsPumps, onAddFuelToCart, onReload }) {
  const [pumps, setPumps] = useState(propsPumps || []);
  const [products, setProducts] = useState([]);
  const [selectedPump, setSelectedPump] = useState(null);
  const [authType, setAuthType] = useState('amount');
  const [authValue, setAuthValue] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (propsPumps) {
      setPumps(propsPumps);
    }
  }, [propsPumps]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productData = await Product.list();
      setProducts(productData || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      setIsLoading(false);
    }
  };

  const addDenomination = (denomination) => {
    const currentAmount = parseFloat(authValue) || 0;
    setAuthValue((currentAmount + denomination).toFixed(2));
  };

  const handleAuthorizePump = async () => {
    if (!selectedPump || !selectedProduct) {
      alert('Please select a fuel type');
      return;
    }

    if (authType !== 'fill_up' && authType !== 'call_in' && !authValue) {
      alert('Please enter an amount or select Fill Up/Call In');
      return;
    }

    try {
      const product = products.find(p => p.product_code === selectedProduct);
      if (!product) {
        alert('Invalid product selected');
        return;
      }

      let authAmount, authGallons;

      if (authType === 'fill_up') {
        authAmount = 150.00; // A reasonable default for 'fill up' pre-auth
        authGallons = authAmount / product.self_service_cash_price;
        
        await Pump.update(selectedPump.id, {
          status: 'authorized',
          active_product_code: selectedProduct,
          preauth_amount: authAmount,
          preauth_gallons: authGallons,
          is_prepaid: false, // Customer pays after fueling
          payment_completed: false,
          current_gallons: 0,
          current_amount: 0,
          last_transaction_gallons: 0,
          last_transaction_amount: 0
        });
        
        alert(`✅ Pump ${selectedPump.pump_number} AUTHORIZED for FILL UP\nCustomer can fuel. Pay after completion.`);
        
        setSelectedPump(null);
        setAuthValue('');
        setSelectedProduct('');
        if (onReload) onReload();
        return;
        
      } else if (authType === 'call_in') {
        await Pump.update(selectedPump.id, {
          status: 'calling',
          active_product_code: selectedProduct,
          preauth_amount: 0,
          preauth_gallons: 0,
          is_prepaid: false,
          payment_completed: false,
          current_gallons: 0,
          current_amount: 0
        });
        alert(`📞 Pump ${selectedPump.pump_number} is now CALLING`);
        setSelectedPump(null);
        setAuthValue('');
        setSelectedProduct('');
        if (onReload) onReload();
        return;
      } else {
        // Calculate based on authType (amount or gallons for prepaid)
        if (authType === 'amount') {
          // User entered dollar amount
          authAmount = parseFloat(authValue);
          authGallons = authAmount / product.self_service_cash_price;
        } else {
          // User entered gallons
          authGallons = parseFloat(authValue);
          authAmount = authGallons * product.self_service_cash_price;
        }
      }

      // Validate calculated values
      if (isNaN(authAmount) || isNaN(authGallons) || authAmount <= 0 || authGallons <= 0) {
        alert('Invalid authorization amount or gallons calculated');
        return;
      }

      console.log(`[FUEL AUTH] Pump ${selectedPump.pump_number}: $${authAmount.toFixed(2)} = ${authGallons.toFixed(3)}gal @ $${product.self_service_cash_price.toFixed(3)}/gal`);

      // Update pump with correct preauth values for a prepaid transaction
      await Pump.update(selectedPump.id, {
        // Status should be idle if prepaid and waiting for payment, or authorized if payment is handled directly (e.g. from POS)
        // For our current flow (add to cart, then tender), status 'idle' with preauth is correct.
        status: 'idle', 
        active_product_code: selectedProduct,
        preauth_amount: authAmount,        // ✅ The dollar amount (e.g., 5.00)
        preauth_gallons: authGallons,      // ✅ The calculated gallons (e.g., 1.52)
        is_prepaid: true,
        payment_completed: false, // Payment is not completed yet, it's added to cart
        current_gallons: 0,
        current_amount: 0,
        last_transaction_gallons: 0,
        last_transaction_amount: 0
      });

      // Create cart item with correct values
      const cartItem = {
        upc_code: `FUEL-${product.product_code.toUpperCase()}-PUMP${selectedPump.pump_number}-${Date.now()}`,
        product_name: `Pump ${selectedPump.pump_number} - ${product.product_name}`,
        quantity: authGallons,                           // ✅ Gallons (e.g., 1.52)
        unit_price: product.self_service_cash_price,     // ✅ Price per gallon (e.g., 3.29)
        total_price: authAmount,                         // ✅ Dollar amount (e.g., 5.00)
        tax_amount: 0,
        is_fuel: true,
        pump_number: selectedPump.pump_number,
        pump_id: selectedPump.id,
        is_custom_item: false,
        pending_authorization: true // Flag to indicate it's a fuel pre-auth waiting for tender
      };
      
      console.log('[FUEL AUTH] Cart item created:', cartItem);
      onAddFuelToCart(cartItem);
      
      setSelectedPump(null);
      setAuthValue('');
      setSelectedProduct('');

      alert(`✅ Pump ${selectedPump.pump_number}\n$${authAmount.toFixed(2)} added to sale\n\nAdd more items or hit TENDER when ready.`);

    } catch (error) {
      console.error('Error processing authorization:', error);
      alert('Failed to process authorization');
    }
  };

  const handleCancelTransaction = async (pump) => {
    if (!confirm(`Cancel transaction on Pump ${pump.pump_number}?`)) {
      return;
    }

    try {
      await Pump.update(pump.id, {
        status: 'idle',
        active_product_code: null,
        preauth_amount: 0,
        preauth_gallons: 0,
        is_prepaid: false,
        current_gallons: 0,
        current_amount: 0,
        payment_completed: false,
        last_transaction_gallons: 0,
        last_transaction_amount: 0
      });

      alert(`Pump ${pump.pump_number} reset to idle`);
      if (onReload) onReload();
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      alert('Failed to cancel transaction');
    }
  };

  // Handle authorizing a "calling" pump
  const handleAuthorizeCalling = (pump) => {
    // When user clicks on a "calling" pump, open the authorization dialog
    // It's effectively re-opening the authorization flow to provide an amount
    setSelectedPump(pump);
    setSelectedProduct(pump.active_product_code || '');
    setAuthType('amount'); // Default to amount input when re-authorizing a calling pump
    setAuthValue(''); // Clear any previous input
  };

  const handleCompleteSale = async (pump) => {
    if (!pump.active_product_code) return;

    if (pump.is_prepaid && pump.payment_completed) {
      await Pump.update(pump.id, {
        status: 'idle',
        active_product_code: null,
        preauth_amount: 0,
        preauth_gallons: 0,
        is_prepaid: false,
        current_gallons: 0,
        current_amount: 0,
        last_transaction_gallons: pump.last_transaction_gallons, // Keep last transaction for display
        last_transaction_amount: pump.last_transaction_amount, // Keep last transaction for display
        payment_completed: false
      });

      alert(`✅ Pump ${pump.pump_number} reset. Fuel was already paid.`);
      
      if (onReload) onReload();
      return;
    }

    if (!pump.is_prepaid || !pump.payment_completed) {
      try {
        const product = products.find(p => p.product_code === pump.active_product_code);
        if (!product) {
          alert('Product not found');
          return;
        }

        const actualGallons = pump.last_transaction_gallons || pump.current_gallons || 0;
        const actualAmount = pump.last_transaction_amount || pump.current_amount || 0;

        if (actualGallons <= 0 || actualAmount <= 0) {
          alert('No fuel was dispensed');
          return;
        }

        const cartItem = {
          upc_code: `FUEL-${product.product_code.toUpperCase()}-PUMP${pump.pump_number}-${Date.now()}`,
          product_name: `${product.product_name} - Pump ${pump.pump_number}`,
          quantity: actualGallons,
          unit_price: product.self_service_cash_price,
          total_price: actualAmount,
          tax_amount: 0,
          is_fuel: true,
          pump_number: pump.pump_number,
          pump_id: pump.id,
          is_custom_item: false,
          preauthorized: false, // This is for post-pay, so not pre-authorized
          actual_dispense: true
        };

        onAddFuelToCart(cartItem);

        await Pump.update(pump.id, {
          status: 'idle',
          active_product_code: null,
          preauth_amount: 0,
          preauth_gallons: 0,
          is_prepaid: false,
          current_gallons: 0,
          current_amount: 0,
          last_transaction_gallons: actualGallons, // Store actual transaction for display
          last_transaction_amount: actualAmount, // Store actual transaction for display
          payment_completed: false
        });

        alert(`✅ $${actualAmount.toFixed(2)} added to cart\n${actualGallons.toFixed(2)} gallons dispensed`);

        if (onReload) onReload();
      } catch (error) {
        console.error('Error completing sale:', error);
        alert('Failed to complete sale');
      }
    }
  };

  // NEW: Complete fueling manually
  const handleCompleteFueling = async (pump) => {
    if (pump.status !== 'fueling') return;
    
    if (!confirm(`Complete fueling on Pump ${pump.pump_number}?\n\nCurrent: ${pump.current_gallons?.toFixed(2)} gal / $${pump.current_amount?.toFixed(2)}`)) {
      return;
    }

    try {
      // Move directly to payable/finished based on prepaid status
      await Pump.update(pump.id, {
        status: pump.is_prepaid ? 'finished' : 'payable',
        last_transaction_gallons: pump.current_gallons || 0,
        last_transaction_amount: pump.current_amount || 0,
        current_gallons: 0,
        current_amount: 0
      });

      alert(`Pump ${pump.pump_number} fueling completed.\n${pump.current_gallons?.toFixed(2)} gallons / $${pump.current_amount?.toFixed(2)}`);
      if (onReload) onReload();
    } catch (error) {
      console.error('Error completing fueling:', error);
      alert('Failed to complete fueling');
    }
  };

  // NEW: Emergency stop all dispensers
  const handleStopAllDispensers = async () => {
    if (!confirm('🛑 EMERGENCY STOP ALL DISPENSERS?\n\nThis will immediately stop all active fueling.')) {
      return;
    }

    try {
      const fuelingPumps = pumps.filter(p => p.status === 'fueling');
      
      for (const pump of fuelingPumps) {
        await Pump.update(pump.id, {
          status: pump.is_prepaid ? 'finished' : 'payable',
          last_transaction_gallons: pump.current_gallons || 0,
          last_transaction_amount: pump.current_amount || 0,
          current_gallons: 0,
          current_amount: 0
        });
      }

      alert(`✅ All dispensers stopped.\n${fuelingPumps.length} pump(s) moved to payable/finished.`);
      if (onReload) onReload();
    } catch (error) {
      console.error('Error stopping dispensers:', error);
      alert('Failed to stop dispensers');
    }
  };

  const getStatusConfig = (pump) => {
    const status = pump.status || 'offline';

    const configs = {
      idle: {
        color: 'bg-green-500',
        textColor: 'text-green-900',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300',
        label: 'READY',
        icon: Circle
      },
      calling: {
        color: 'bg-yellow-500',
        textColor: 'text-yellow-900',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        label: 'CALLING',
        icon: PhoneCall,
        animate: 'animate-pulse'
      },
      authorized: {
        color: 'bg-blue-500',
        textColor: 'text-blue-900',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300',
        label: 'AUTHORIZED',
        icon: Play
      },
      fueling: {
        color: 'bg-orange-500',
        textColor: 'text-orange-900',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-300',
        label: 'FUELING',
        icon: Droplets,
        animate: 'animate-pulse'
      },
      finished: {
        color: 'bg-purple-500',
        textColor: 'text-purple-900',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-300',
        label: 'COMPLETE',
        icon: CheckCircle2,
        animate: 'animate-pulse'
      },
      payable: {
        color: 'bg-purple-500',
        textColor: 'text-purple-900',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-300',
        label: 'PAY NOW',
        icon: CreditCard
      },
      offline: {
        color: 'bg-red-500',
        textColor: 'text-red-900',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        label: 'OFFLINE',
        icon: AlertCircle
      }
    };

    return configs[status] || configs.offline;
  };

  if (isLoading && pumps.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p>Loading forecourt...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Fuel className="w-5 h-5 text-blue-600" />
          Fueling Positions
          <div className="ml-auto flex gap-2">
            <Button 
              size="sm" 
              variant="destructive"
              onClick={handleStopAllDispensers}
              className="h-8"
            >
              🛑 Stop All Dispensers
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {pumps.map((pump) => {
            const config = getStatusConfig(pump);
            const Icon = config.icon;
            const canCancel = ['authorized', 'fueling', 'calling', 'finished'].includes(pump.status);
            
            const isPendingPayment = pump.is_prepaid && !pump.payment_completed && pump.preauth_amount > 0 && pump.status === 'idle';
            const canComplete = pump.status === 'payable' && (!pump.is_prepaid || !pump.payment_completed);
            const isPrepaidComplete = pump.is_prepaid && pump.payment_completed;
            const shouldAutoReset = isPrepaidComplete && (pump.status === 'payable' || pump.status === 'finished');
            
            // CRITICAL FIX: Handle calling status
            const isCallingStatus = pump.status === 'calling';
            const isFueling = pump.status === 'fueling';

            return (
              <div key={pump.id} className="relative">
                <button
                  onClick={() => {
                    if (pump.status === 'idle' && !isPendingPayment) {
                      setSelectedPump(pump);
                    } else if (isCallingStatus) {
                      // NEW: Allow authorizing calling pumps
                      handleAuthorizeCalling(pump);
                    } else if (isFueling) { // NEW: Allow completing fueling manually
                      handleCompleteFueling(pump);
                    } else if (canComplete) {
                      handleCompleteSale(pump);
                    } else if (shouldAutoReset) {
                      handleCompleteSale(pump);
                    }
                  }}
                  disabled={pump.status === 'offline' || isPendingPayment}
                  className={`
                    w-full relative p-3 rounded-lg border-2 transition-all
                    ${isPendingPayment ? 'bg-orange-50 border-orange-300' : `${config.bgColor} ${config.borderColor}`}
                    ${pump.status === 'offline' || isPendingPayment ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg cursor-pointer'}
                    ${config.animate || ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-bold text-gray-900">
                      {pump.pump_number}
                    </span>
                    <Icon className={`w-5 h-5 ${isPendingPayment ? 'text-orange-500' : config.color.replace('bg-', 'text-')}`} />
                  </div>

                  {isPendingPayment ? (
                    <div className="text-xs font-bold px-2 py-1 rounded bg-orange-500 text-white text-center mb-2">
                      PENDING PAYMENT
                    </div>
                  ) : (
                    <div className={`text-xs font-bold px-2 py-1 rounded ${config.color} text-white text-center mb-2`}>
                      {config.label}
                    </div>
                  )}

                  {pump.active_product_code && (
                    <div className="text-xs font-medium text-gray-700 mb-1 uppercase">
                      {pump.active_product_code}
                    </div>
                  )}

                  {isPendingPayment && (
                    <div className="text-sm font-bold text-orange-900">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>${(pump.preauth_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-orange-700 mt-1 text-center font-bold">
                        ⏳ Awaiting Payment
                      </div>
                    </div>
                  )}

                  {pump.status === 'authorized' && pump.preauth_amount > 0 && !isPendingPayment && (
                    <div className="text-sm font-bold text-blue-900">
                      <div className="flex justify-between">
                        <span>Auth:</span>
                        <span>${(pump.preauth_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-green-700 mt-1 text-center font-bold">
                        ✓ Ready to Fuel
                      </div>
                    </div>
                  )}

                  {isCallingStatus && (
                    <div className="text-sm font-bold text-yellow-900">
                      <div className="text-xs text-yellow-700 text-center mt-1 font-bold animate-pulse">
                        📞 Tap to Authorize
                      </div>
                    </div>
                  )}

                  {isFueling && (
                    <div className="text-sm font-bold text-orange-900 space-y-1">
                      <div className="flex justify-between items-center">
                        <span>Gal:</span>
                        <span className="text-lg tabular-nums">{(pump.current_gallons || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>$:</span>
                        <span className="text-lg tabular-nums">${(pump.current_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-orange-700 mt-1 text-center font-bold animate-pulse">
                        ⛽ DISPENSING
                      </div>
                      <div className="text-xs bg-orange-600 text-white px-1 py-1 rounded mt-1 text-center font-bold">
                        👆 TAP TO COMPLETE
                      </div>
                    </div>
                  )}

                  {pump.status === 'finished' && (
                    <div className="text-sm font-bold text-purple-900 space-y-1">
                      <div className="flex justify-between items-center">
                        <span>Gal:</span>
                        <span className="text-lg tabular-nums">{(pump.last_transaction_gallons || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Sale:</span>
                        <span className="text-lg tabular-nums">${(pump.last_transaction_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-purple-700 text-center mt-1 font-bold animate-pulse">
                        ✓ COMPLETE
                      </div>
                    </div>
                  )}

                  {pump.status === 'payable' && !isPrepaidComplete && (
                    <div className="text-sm font-bold text-purple-900 space-y-1">
                      <div className="flex justify-between items-center">
                        <span>Gal:</span>
                        <span className="text-lg tabular-nums">{(pump.last_transaction_gallons || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Sale:</span>
                        <span className="text-lg tabular-nums">${(pump.last_transaction_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-purple-700 text-center mt-1 font-bold">
                        💳 Tap to Add
                      </div>
                    </div>
                  )}

                  {/* NEW: Last Transaction Display - Show on ALL IDLE pumps if data exists */}
                  {pump.status === 'idle' && !isPendingPayment && pump.last_transaction_amount > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <div className="text-xs text-gray-600 text-center mb-1 font-semibold">💰 Last Sale</div>
                      <div className="text-xs font-semibold text-gray-800 space-y-0.5 bg-green-50 p-2 rounded">
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="text-green-700">${(pump.last_transaction_amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gallons:</span>
                          <span className="text-green-700">{(pump.last_transaction_gallons || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>PPG:</span>
                          <span>${((pump.last_transaction_amount || 0) / (pump.last_transaction_gallons || 1)).toFixed(3)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </button>

                {canCancel && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => { // NEW: Add e.stopPropagation()
                      e.stopPropagation();
                      handleCancelTransaction(pump);
                    }}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-lg"
                    title="Cancel"
                  >
                    ×
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {selectedPump && (
          <Dialog open={!!selectedPump} onOpenChange={() => setSelectedPump(null)}>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Fuel className="w-5 h-5" />
                  Authorize Pump {selectedPump.pump_number}
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 py-2 sm:py-4">
                <div>
                  <Label className="text-sm sm:text-base font-semibold">Fuel Type</Label>
                  <select
                    className="w-full p-2 sm:p-3 border-2 rounded-lg text-sm sm:text-base mt-2"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    <option value="">Select Fuel Type</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.product_code}>
                        {product.product_name} - ${(product.self_service_cash_price || 0).toFixed(3)}/gal
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-sm sm:text-base font-semibold">Payment Type</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      type="button"
                      variant={authType === 'amount' ? 'default' : 'outline'}
                      onClick={() => setAuthType('amount')}
                      className="h-10 sm:h-12 text-xs sm:text-base"
                    >
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Dollar Amount</span>
                      <span className="sm:hidden">Amount</span>
                    </Button>
                    <Button
                      type="button"
                      variant={authType === 'gallons' ? 'default' : 'outline'}
                      onClick={() => setAuthType('gallons')}
                      className="h-10 sm:h-12 text-xs sm:text-base"
                    >
                      <Droplets className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Gallons</span>
                      <span className="sm:hidden">Gal</span>
                    </Button>
                    <Button
                      type="button"
                      variant={authType === 'fill_up' ? 'default' : 'outline'}
                      onClick={() => setAuthType('fill_up')}
                      className="h-10 sm:h-12 text-xs sm:text-base bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Fuel className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      Fill Up
                    </Button>
                    <Button
                      type="button"
                      variant={authType === 'call_in' ? 'default' : 'outline'}
                      onClick={() => setAuthType('call_in')}
                      className="h-10 sm:h-12 text-xs sm:text-base bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      Call In
                    </Button>
                  </div>
                </div>

                {authType !== 'fill_up' && authType !== 'call_in' && (
                  <>
                    <div>
                      <Label className="text-sm sm:text-base font-semibold">Quick Amount</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2 mt-2">
                        <Button
                          type="button"
                          onClick={() => addDenomination(100)}
                          className="h-10 sm:h-12 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-base"
                        >
                          $100
                        </Button>
                        <Button
                          type="button"
                          onClick={() => addDenomination(50)}
                          className="h-10 sm:h-12 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-base"
                        >
                          $50
                        </Button>
                        <Button
                          type="button"
                          onClick={() => addDenomination(20)}
                          className="h-10 sm:h-12 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-base"
                        >
                          $20
                        </Button>
                        <Button
                          type="button"
                          onClick={() => addDenomination(10)}
                          className="h-10 sm:h-12 bg-yellow-600 hover:bg-yellow-700 text-white text-xs sm:text-base"
                        >
                          $10
                        </Button>
                        <Button
                          type="button"
                          onClick={() => addDenomination(5)}
                          className="h-10 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-base"
                        >
                          $5
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setAuthValue("")}
                          variant="outline"
                          className="h-10 sm:h-12 text-xs sm:text-base"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm sm:text-base font-semibold">
                        {authType === 'amount' ? 'Dollar Amount' : 'Gallons'}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={authValue}
                          onChange={(e) => setAuthValue(e.target.value)}
                          placeholder={authType === 'amount' ? 'Enter dollar amount' : 'Enter gallons'}
                          className="text-xl sm:text-2xl h-12 sm:h-14 mt-2 font-bold flex-1"
                          autoFocus
                        />
                        <Button onClick={() => setAuthValue("")} variant="outline" size="sm" className="mt-2 h-12 sm:h-14">
                          Clear
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {authType === 'fill_up' && (
                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-2 border-green-200">
                    <p className="text-xs sm:text-sm font-semibold text-green-900 mb-2">Fill Up - Pay After Fueling</p>
                    <p className="text-xs sm:text-sm text-green-700">
                      Customer will pump until tank is full. Payment collected after dispensing.
                    </p>
                  </div>
                )}

                {authType === 'call_in' && (
                  <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border-2 border-orange-200">
                    <p className="text-xs sm:text-sm font-semibold text-orange-900 mb-2">Call In - Customer Will Request Amount</p>
                    <p className="text-xs sm:text-sm text-orange-700">
                      Customer will lift nozzle and call to authorize amount. Pump will show "CALLING" status.
                    </p>
                  </div>
                )}

                {authValue && selectedProduct && authType !== 'fill_up' && authType !== 'call_in' && (
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-2 border-blue-200">
                    <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">✅ PREPAY Authorization:</p>
                    {authType === 'amount' ? (
                      <div className="space-y-1">
                        <p className="text-base sm:text-lg font-bold text-blue-900">
                          Amount: ${parseFloat(authValue).toFixed(2)}
                        </p>
                        <p className="text-xs sm:text-sm text-blue-700">
                          Estimated: ~{((parseFloat(authValue) || 0) / ((products.find(p => p.product_code === selectedProduct)?.self_service_cash_price) || 1)).toFixed(2)} gallons
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-base sm:text-lg font-bold text-blue-900">
                          Gallons: {parseFloat(authValue).toFixed(2)}
                        </p>
                        <p className="text-xs sm:text-sm text-blue-700">
                          Estimated: ~${((parseFloat(authValue) || 0) * ((products.find(p => p.product_code === selectedProduct)?.self_service_cash_price) || 0)).toFixed(2)}
                        </p>
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-blue-300">
                      <p className="text-xs text-blue-800 font-semibold">Next Steps:</p>
                      <p className="text-xs text-blue-600">1. Amount added to sale</p>
                      <p className="text-xs text-blue-600">2. Complete sale transaction via TENDER</p>
                      <p className="text-xs text-blue-600">3. Pump authorizes automatically</p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 flex-col sm:flex-row flex-shrink-0 border-t pt-4">
                <Button variant="outline" onClick={() => setSelectedPump(null)} className="h-10 sm:h-12 w-full sm:w-auto">
                  Cancel
                </Button>
                <Button
                  onClick={handleAuthorizePump}
                  className="bg-blue-600 hover:bg-blue-700 h-10 sm:h-12 text-sm sm:text-base font-bold w-full sm:w-auto"
                  disabled={!selectedProduct || (authType !== 'fill_up' && authType !== 'call_in' && !authValue)}
                >
                  {authType === 'fill_up' || authType === 'call_in' ? (
                    <>
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      AUTHORIZE
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      ADD TO SALE
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
