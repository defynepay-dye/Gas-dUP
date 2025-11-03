import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fuel, DollarSign, CreditCard, Calculator, ArrowUp } from "lucide-react";

const presetAmounts = [5, 10, 20, 40];
const keypadNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

export default function PumpTender({ 
  pump, 
  selectedProduct, 
  pricePerGallon, 
  onTender, 
  onClose,
  settings = { cashDiscountPercent: 3 } 
}) {
  const [tenderAmount, setTenderAmount] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [serviceType, setServiceType] = useState('self_service');
  
  // Calculate pricing based on payment and service type
  const calculatePrice = (basePrice, payment, service) => {
    let price = basePrice;
    
    // Apply cash discount
    if (payment === 'cash') {
      price = price * (1 - (settings.cashDiscountPercent / 100));
    }
    
    // Full service markup (typically 10-15 cents more)
    if (service === 'full_service') {
      price = price + 0.12;
    }
    
    return price;
  };

  const currentPrice = calculatePrice(pricePerGallon, paymentType, serviceType);
  const maxGallons = tenderAmount ? (parseFloat(tenderAmount) / currentPrice).toFixed(2) : '0.00';

  const handleKeypadInput = (num) => {
    if (tenderAmount.length < 6) {
      setTenderAmount(prev => prev + num.toString());
    }
  };

  const handlePresetAmount = (amount) => {
    setTenderAmount(amount.toString());
  };

  const handleClear = () => {
    setTenderAmount('');
  };

  const handleBackspace = () => {
    setTenderAmount(prev => prev.slice(0, -1));
  };

  const handleOK = () => {
    if (!tenderAmount || parseFloat(tenderAmount) <= 0) return;
    
    onTender({
      pumpNumber: pump.pump_number,
      product: selectedProduct,
      tenderAmount: parseFloat(tenderAmount),
      pricePerGallon: currentPrice,
      maxGallons: parseFloat(maxGallons),
      paymentType,
      serviceType,
      isPrePay: true
    });
  };

  const handleOKUpTo = () => {
    if (!tenderAmount || parseFloat(tenderAmount) <= 0) return;
    
    onTender({
      pumpNumber: pump.pump_number,
      product: selectedProduct,
      tenderAmount: parseFloat(tenderAmount),
      pricePerGallon: currentPrice,
      maxGallons: parseFloat(maxGallons),
      paymentType,
      serviceType,
      isPrePay: true,
      fillToAmount: true // This indicates "OK up to" - fill tank and refund excess
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="w-5 h-5" />
            Pump {pump.pump_number} - Quick Tender
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service & Payment Type Selection */}
          <Tabs value={serviceType} onValueChange={setServiceType}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="self_service">Self Service</TabsTrigger>
              <TabsTrigger value="full_service">Full Service</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={paymentType} onValueChange={setPaymentType}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cash" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Cash
              </TabsTrigger>
              <TabsTrigger value="credit" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Credit
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Product & Pricing Display */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{selectedProduct.toUpperCase()}</span>
              <div className="flex items-center gap-2">
                {paymentType === 'cash' && (
                  <Badge className="bg-green-100 text-green-800">
                    {settings.cashDiscountPercent}% Cash Discount
                  </Badge>
                )}
                {serviceType === 'full_service' && (
                  <Badge className="bg-blue-100 text-blue-800">
                    Full Service
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ${currentPrice.toFixed(3)}/gal
            </div>
            {paymentType === 'cash' && (
              <div className="text-sm text-gray-600">
                Credit price: ${pricePerGallon.toFixed(3)}/gal
              </div>
            )}
          </div>

          {/* Amount Display */}
          <div className="text-center p-4 bg-gray-100 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Tender Amount</div>
            <div className="text-4xl font-bold text-green-600">
              ${tenderAmount || '0.00'}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Up to {maxGallons} gallons
            </div>
          </div>

          {/* Preset Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {presetAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                onClick={() => handlePresetAmount(amount)}
                className="h-12 text-lg font-semibold"
              >
                ${amount}
              </Button>
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {keypadNumbers.slice(0, 9).map((num) => (
              <Button
                key={num}
                variant="outline"
                onClick={() => handleKeypadInput(num)}
                className="h-12 text-xl font-semibold"
              >
                {num}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={handleClear}
              className="h-12 text-lg font-semibold text-red-600"
            >
              Clear
            </Button>
            <Button
              variant="outline"
              onClick={() => handleKeypadInput(0)}
              className="h-12 text-xl font-semibold"
            >
              0
            </Button>
            <Button
              variant="outline"
              onClick={handleBackspace}
              className="h-12 text-lg font-semibold text-orange-600"
            >
              ←
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleOK}
              disabled={!tenderAmount || parseFloat(tenderAmount) <= 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              OK - Exact Amount
            </Button>
            <Button
              onClick={handleOKUpTo}
              disabled={!tenderAmount || parseFloat(tenderAmount) <= 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <ArrowUp className="w-4 h-4 mr-1" />
              OK Up To
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}