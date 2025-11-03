import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SupplierProduct, Supplier } from '@/api/entities';
import { DollarSign, TrendingDown, TrendingUp, Award, AlertCircle, ShoppingCart } from 'lucide-react';

export default function VendorPricingModal({ item, onClose }) {
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSupplierPricing();
  }, [item]);

  const loadSupplierPricing = async () => {
    setIsLoading(true);
    try {
      // Load all supplier products for this item
      const supplierProducts = await SupplierProduct.filter({ product_id: item._id });
      
      // Load supplier details
      const supplierPromises = supplierProducts.map(async (sp) => {
        const supplier = await Supplier.filter({ id: sp.supplier_id });
        return {
          ...sp,
          supplier_details: supplier[0] || {}
        };
      });
      
      const enrichedSuppliers = await Promise.all(supplierPromises);
      
      // Sort by current cost (best price first)
      enrichedSuppliers.sort((a, b) => (a.current_cost || 0) - (b.current_cost || 0));
      
      setSupplierOptions(enrichedSuppliers);
    } catch (error) {
      console.error('Error loading supplier pricing:', error);
    }
    setIsLoading(false);
  };

  const handleCreatePO = (supplierProduct) => {
    alert(`Creating PO for ${item.product_name}\nSupplier: ${supplierProduct.supplier_details.supplier_name}\nCost: $${supplierProduct.current_cost}\n\nThis would open the PO creation flow.`);
  };

  const getBestValueBadge = (index, supplierProduct) => {
    if (index === 0) {
      return <Badge className="bg-green-600"><Award className="w-3 h-3 mr-1" />Best Price</Badge>;
    }
    
    if (supplierProduct.is_primary_supplier) {
      return <Badge className="bg-blue-600">Current Supplier</Badge>;
    }
    
    return null;
  };

  const getCurrentMargin = () => {
    const currentCost = item.inventory_tracking?.weighted_average_cost || 0;
    const sellPrice = item.selling_units?.[0]?.unit_price || 0;
    if (currentCost === 0) return 0;
    return ((sellPrice - currentCost) / sellPrice * 100).toFixed(1);
  };

  const getNewMargin = (newCost) => {
    const sellPrice = item.selling_units?.[0]?.unit_price || 0;
    if (newCost === 0) return 0;
    return ((sellPrice - newCost) / sellPrice * 100).toFixed(1);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Vendor Pricing Comparison: {item.product_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Item Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Current Cost</p>
                  <p className="text-lg font-bold">${(item.inventory_tracking?.weighted_average_cost || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Selling Price</p>
                  <p className="text-lg font-bold text-green-600">${(item.selling_units?.[0]?.unit_price || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Current Margin</p>
                  <p className="text-lg font-bold text-blue-600">{getCurrentMargin()}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Stock Level</p>
                  <p className="text-lg font-bold">{item.inventory_tracking?.quantity_on_hand_singles || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Options */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              Available Suppliers ({supplierOptions.length})
            </h3>
            
            {isLoading ? (
              <div className="text-center py-8">Loading supplier options...</div>
            ) : supplierOptions.length === 0 ? (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium">No supplier relationships found</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Add this product to supplier catalogs to see pricing options
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {supplierOptions.map((sp, index) => {
                  const currentCost = item.inventory_tracking?.weighted_average_cost || 0;
                  const priceDiff = sp.current_cost - currentCost;
                  const percentDiff = currentCost > 0 ? ((priceDiff / currentCost) * 100).toFixed(1) : 0;
                  const newMargin = getNewMargin(sp.current_cost);
                  
                  return (
                    <Card key={sp.id} className={`${index === 0 ? 'border-green-500 border-2' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-lg">{sp.supplier_details.supplier_name || 'Unknown Supplier'}</h4>
                              {getBestValueBadge(index, sp)}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-gray-600">Unit Cost</p>
                                <p className="font-bold text-lg">${sp.current_cost?.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Case Pack</p>
                                <p className="font-semibold">{sp.case_pack_size || 'N/A'} units</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Lead Time</p>
                                <p className="font-semibold">{sp.lead_time_days || 3} days</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Min Order</p>
                                <p className="font-semibold">{sp.minimum_order_quantity || 1} units</p>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex gap-3 items-center">
                              {priceDiff !== 0 && (
                                <div className={`flex items-center gap-1 text-sm ${priceDiff < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {priceDiff < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                  <span className="font-semibold">
                                    {priceDiff < 0 ? 'Save' : 'Cost'} ${Math.abs(priceDiff).toFixed(2)} ({percentDiff}%)
                                  </span>
                                </div>
                              )}
                              <div className="text-sm text-gray-600">
                                New Margin: <span className="font-semibold text-blue-600">{newMargin}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleCreatePO(sp)}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Create PO
                            </Button>
                            <p className="text-xs text-gray-500 text-center">
                              Last order: {sp.last_order_date ? new Date(sp.last_order_date).toLocaleDateString() : 'Never'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommendations */}
          {supplierOptions.length > 1 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Smart Recommendation
                </h4>
                <p className="text-sm text-green-800">
                  Switching to <strong>{supplierOptions[0].supplier_details.supplier_name}</strong> could save you{' '}
                  <strong>${Math.abs(supplierOptions[0].current_cost - (item.inventory_tracking?.weighted_average_cost || 0)).toFixed(2)}</strong>{' '}
                  per unit and increase margin to <strong>{getNewMargin(supplierOptions[0].current_cost)}%</strong>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}