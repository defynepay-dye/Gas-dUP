
import React, { useState, useEffect } from 'react';
import { Pump, Product, Transaction } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, 
  Square, 
  DollarSign, 
  Droplets, 
  Fuel,
  CheckCircle2,
  XCircle 
} from 'lucide-react';

export default function PumpControlsModal({ pump, onClose, onComplete }) {
  const [products, setProducts] = useState([]);
  const [authType, setAuthType] = useState('amount');
  const [authValue, setAuthValue] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [pumpStatus, setPumpStatus] = useState(pump);

  useEffect(() => {
    const loadProducts = async () => {
      const productData = await Product.list();
      setProducts(productData);
      if (pump.active_product_code) {
        setSelectedProduct(pump.active_product_code);
      }
    };

    const refreshPumpStatus = async () => {
      try {
        const [updatedPump] = await Pump.filter({ id: pump.id });
        if (updatedPump) {
          setPumpStatus(updatedPump);
        }
      } catch (error) {
        console.error('Error refreshing pump:', error);
      }
    };

    loadProducts();
    const interval = setInterval(refreshPumpStatus, 2000);
    return () => clearInterval(interval);
  }, [pump.id, pump.active_product_code]); // Fixed dependencies

  const handleAuthorize = async () => {
    if (!authValue || !selectedProduct) {
      alert('Please enter amount/gallons and select fuel type');
      return;
    }

    try {
      const product = products.find(p => p.product_code === selectedProduct);
      if (!product) {
        alert('Invalid fuel type selected');
        return;
      }

      const pricePerGallon = product.self_service_cash_price || 0;
      
      const updateData = {
        status: 'online',
        active_product_code: selectedProduct,
        preauth_amount: authType === 'amount' 
          ? parseFloat(authValue) 
          : (parseFloat(authValue) || 0) * pricePerGallon,
        preauth_gallons: authType === 'gallons' 
          ? parseFloat(authValue) 
          : pricePerGallon > 0 ? (parseFloat(authValue) || 0) / pricePerGallon : 0,
        is_prepaid: true,
        current_gallons: 0,
        current_amount: 0
      };

      await Pump.update(pump.id, updateData);
      alert(`Pump ${pump.pump_number} authorized!`);
      onClose();
    } catch (error) {
      console.error('Error authorizing pump:', error);
      alert('Failed to authorize pump');
    }
  };

  const handleComplete = async () => {
    if (!pumpStatus.active_product_code) {
      alert('No active fuel transaction');
      return;
    }

    const product = products.find(p => p.product_code === pumpStatus.active_product_code);
    if (!product) {
      alert('Product not found');
      return;
    }

    const finalGallons = pumpStatus.last_transaction_gallons || pumpStatus.preauth_gallons || 0;
    const finalAmount = pumpStatus.last_transaction_amount || pumpStatus.preauth_amount || 0;

    if (finalGallons === 0) {
      alert('No fuel dispensed');
      return;
    }

    const cartItem = {
      upc_code: `FUEL-${pumpStatus.active_product_code.toUpperCase()}`,
      product_name: `${product.product_name} - Pump ${pumpStatus.pump_number}`,
      quantity: finalGallons,
      unit_price: product.self_service_cash_price || 0,
      total_price: finalAmount,
      tax_amount: 0,
      is_fuel: true,
      pump_number: pumpStatus.pump_number,
      is_custom_item: false
    };

    await Pump.update(pump.id, {
      status: 'online',
      active_product_code: null,
      preauth_amount: 0,
      preauth_gallons: 0,
      is_prepaid: false,
      current_gallons: 0,
      current_amount: 0,
      last_transaction_gallons: 0,
      last_transaction_amount: 0
    });

    onComplete(cartItem);
    onClose();
  };

  const handleCancel = async () => {
    await Pump.update(pump.id, {
      status: 'online',
      active_product_code: null,
      preauth_amount: 0,
      preauth_gallons: 0,
      is_prepaid: false,
      current_gallons: 0,
      current_amount: 0
    });
    onClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-500 hover:bg-green-600';
      case 'offline':
        return 'bg-red-500 hover:bg-red-600';
      case 'authorizing':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'pumping':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'finished':
      case 'payable':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-blue-600" />
            Pump {pump.pump_number} Controls
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Display */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Status:</span>
                <Badge className={getStatusColor(pumpStatus.status)}>
                  {pumpStatus.status?.toUpperCase()}
                </Badge>
              </div>
              
              {pumpStatus.is_prepaid && (pumpStatus.preauth_amount || 0) > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Authorized:</span>
                    <span className="font-semibold">${(pumpStatus.preauth_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gallons:</span>
                    <span className="font-semibold">~{(pumpStatus.preauth_gallons || 0).toFixed(2)} gal</span>
                  </div>
                </>
              )}

              {(pumpStatus.current_gallons || 0) > 0 && (
                <>
                  <div className="flex justify-between text-sm text-blue-600 mt-2 pt-2 border-t">
                    <span>Dispensing:</span>
                    <span className="font-semibold">{(pumpStatus.current_gallons || 0).toFixed(2)} gal</span>
                  </div>
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Amount:</span>
                    <span className="font-semibold">${(pumpStatus.current_amount || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Authorization Controls */}
          {pumpStatus.status === 'online' && !pumpStatus.is_prepaid && (
            <>
              <div>
                <Label>Fuel Type</Label>
                <select
                  className="w-full p-2 border rounded mt-1"
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
                <Label>Authorization Type</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={authType === 'amount' ? 'default' : 'outline'}
                    onClick={() => setAuthType('amount')}
                    className="flex-1"
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    Amount
                  </Button>
                  <Button
                    variant={authType === 'gallons' ? 'default' : 'outline'}
                    onClick={() => setAuthType('gallons')}
                    className="flex-1"
                  >
                    <Droplets className="w-4 h-4 mr-1" />
                    Gallons
                  </Button>
                </div>
              </div>

              <div>
                <Label>{authType === 'amount' ? 'Amount ($)' : 'Gallons'}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={authValue}
                  onChange={(e) => setAuthValue(e.target.value)}
                  placeholder={authType === 'amount' ? '0.00' : '0.00'}
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={handleAuthorize} 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!authValue || !selectedProduct}
              >
                <Play className="w-4 h-4 mr-2" />
                Authorize Pump
              </Button>
            </>
          )}

          {/* Complete Transaction */}
          {(pumpStatus.status === 'payable' || pumpStatus.status === 'finished') && (
            <Button 
              onClick={handleComplete} 
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete & Add to Sale
            </Button>
          )}

          {/* Cancel Transaction */}
          {pumpStatus.is_prepaid && pumpStatus.status !== 'payable' && pumpStatus.status !== 'finished' && (
            <Button 
              onClick={handleCancel} 
              variant="destructive"
              className="w-full"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Authorization
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
