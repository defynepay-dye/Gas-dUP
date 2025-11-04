import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Supplier, SupplierProduct, InventoryItem, Location, User
} from '@/api/entities';
import { InvokeLLM, SendEmail, UploadFile, ExtractDataFromUploadedFile } from '@/api/integrations';
import {
  TrendingDown, TrendingUp, Award, AlertCircle, Upload, Download,
  DollarSign, Percent, Gift, Clock, CheckCircle, XCircle, Zap,
  FileSpreadsheet, BarChart3, Target, Trophy, ShoppingCart
} from 'lucide-react';

export default function SupplierPricingEngine() {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [priceComparisons, setPriceComparisons] = useState([]);
  const [activePromotions, setActivePromotions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [metrics, setMetrics] = useState({
    totalSavingsOpportunity: 0,
    avgSavingsPercent: 0,
    itemsWithMultipleSuppliers: 0,
    activePromotions: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      analyzePricing();
    }
  }, [selectedLocation]);

  const loadInitialData = async () => {
    try {
      const locs = await Location.list();
      setLocations(locs);
      if (locs.length > 0) {
        const savedLocationId = localStorage.getItem('current_location_id');
        const defaultLoc = locs.find(l => l.id === savedLocationId) || locs[0];
        setSelectedLocation(defaultLoc);
      }

      const sups = await Supplier.filter({ active: true });
      setSuppliers(sups);

      const supProds = await SupplierProduct.filter({ active: true });
      setSupplierProducts(supProds);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const analyzePricing = async () => {
    if (!selectedLocation) return;

    setIsAnalyzing(true);

    try {
      // Get all inventory items for location
      const items = await InventoryItem.filter({
        location_id: selectedLocation.id,
        active: true
      });

      // Group supplier products by inventory item
      const comparisons = [];
      let totalSavings = 0;
      let itemsWithMultiple = 0;

      for (const item of items) {
        const itemSuppliers = supplierProducts.filter(sp => sp.product_id === item.id);

        if (itemSuppliers.length > 1) {
          itemsWithMultiple++;

          // Sort by price
          const sorted = itemSuppliers.sort((a, b) => a.current_cost - b.current_cost);
          const bestPrice = sorted[0];
          const currentSupplier = itemSuppliers.find(sp => sp.is_primary_supplier) || sorted[0];

          if (bestPrice.id !== currentSupplier.id) {
            const savings = (currentSupplier.current_cost - bestPrice.current_cost) * (item.inventory_tracking?.quantity_on_hand_singles || 100);
            totalSavings += savings;

            comparisons.push({
              item: item,
              currentSupplier: currentSupplier,
              bestPriceSupplier: bestPrice,
              allSuppliers: sorted,
              savingsPerUnit: currentSupplier.current_cost - bestPrice.current_cost,
              totalSavings: savings,
              savingsPercent: ((currentSupplier.current_cost - bestPrice.current_cost) / currentSupplier.current_cost) * 100
            });
          }
        }
      }

      setPriceComparisons(comparisons.sort((a, b) => b.totalSavings - a.totalSavings));

      // Find active promotions
      const promos = supplierProducts.filter(sp => {
        const contract = suppliers.find(s => s.id === sp.supplier_id)?.contract_info;
        if (!contract) return false;

        const rebates = contract.rebate_programs || [];
        const volumeDiscounts = contract.volume_discounts || [];

        return rebates.length > 0 || volumeDiscounts.length > 0;
      });

      setActivePromotions(promos);

      setMetrics({
        totalSavingsOpportunity: totalSavings,
        avgSavingsPercent: comparisons.length > 0 ? comparisons.reduce((sum, c) => sum + c.savingsPercent, 0) / comparisons.length : 0,
        itemsWithMultipleSuppliers: itemsWithMultiple,
        activePromotions: promos.length
      });
    } catch (error) {
      console.error('Error analyzing pricing:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePriceListUpload = async (event, supplierId) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingFile(true);

    try {
      // Upload file
      const { file_url } = await UploadFile({ file: file });

      // Extract data using AI
      const extractedData = await ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              product_name: { type: "string" },
              upc_code: { type: "string" },
              supplier_item_code: { type: "string" },
              unit_cost: { type: "number" },
              case_cost: { type: "number" },
              case_pack_size: { type: "integer" },
              promotion_price: { type: "number" },
              promotion_end_date: { type: "string" }
            }
          }
        }
      });

      if (extractedData.status === 'success') {
        let updated = 0;
        let created = 0;

        for (const row of extractedData.output) {
          try {
            // Find matching inventory item
            const items = await InventoryItem.filter({
              upc_code: row.upc_code,
              location_id: selectedLocation.id
            });

            if (items.length > 0) {
              const item = items[0];

              // Check if supplier product exists
              const existingSupplierProducts = await SupplierProduct.filter({
                supplier_id: supplierId,
                product_id: item.id
              });

              const supplierProductData = {
                supplier_id: supplierId,
                product_id: item.id,
                supplier_item_code: row.supplier_item_code,
                supplier_product_name: row.product_name,
                current_cost: row.unit_cost,
                case_pack_size: row.case_pack_size || 1,
                cost_history: [{
                  effective_date: new Date().toISOString(),
                  unit_cost: row.unit_cost,
                  case_cost: row.case_cost,
                  units_per_case: row.case_pack_size || 1,
                  price_change_reason: 'Price list upload'
                }],
                active: true
              };

              if (existingSupplierProducts.length > 0) {
                await SupplierProduct.update(existingSupplierProducts[0].id, supplierProductData);
                updated++;
              } else {
                await SupplierProduct.create(supplierProductData);
                created++;
              }
            }
          } catch (error) {
            console.error(`Error processing ${row.product_name}:`, error);
          }
        }

        alert(`✅ Price List Imported!\n\n${created} new products added\n${updated} products updated\n\nPricing analysis will update automatically.`);
        await loadInitialData();
        await analyzePricing();
      } else {
        alert('Error extracting data from file. Please ensure it\'s a valid CSV or Excel file.');
      }
    } catch (error) {
      console.error('Error uploading price list:', error);
      alert('Error uploading price list. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const switchToSupplier = async (comparison) => {
    if (!window.confirm(`Switch to ${comparison.bestPriceSupplier.supplier_name} for ${comparison.item.product_name}?\n\nThis will save $${comparison.savingsPerUnit.toFixed(2)} per unit (${comparison.savingsPercent.toFixed(1)}%)`)) {
      return;
    }

    try {
      // Update current supplier to non-primary
      await SupplierProduct.update(comparison.currentSupplier.id, {
        is_primary_supplier: false
      });

      // Update best price supplier to primary
      await SupplierProduct.update(comparison.bestPriceSupplier.id, {
        is_primary_supplier: true
      });

      // Update inventory item cost
      await InventoryItem.update(comparison.item.id, {
        'inventory_tracking.weighted_average_cost': comparison.bestPriceSupplier.current_cost
      });

      // Send notification email
      const user = await User.me();
      await SendEmail({
        to: user.email,
        subject: `💰 Supplier Switched: Saving $${comparison.totalSavings.toFixed(2)}`,
        body: `
<h2>🎯 Supplier Optimization Complete</h2>

<p>You've successfully switched suppliers for <strong>${comparison.item.product_name}</strong>.</p>

<h3>Cost Comparison:</h3>
<ul>
  <li><strong>Previous Supplier:</strong> ${comparison.currentSupplier.supplier_name} @ $${comparison.currentSupplier.current_cost.toFixed(2)}/unit</li>
  <li><strong>New Supplier:</strong> ${comparison.bestPriceSupplier.supplier_name} @ $${comparison.bestPriceSupplier.current_cost.toFixed(2)}/unit</li>
  <li><strong>Savings:</strong> $${comparison.savingsPerUnit.toFixed(2)}/unit (${comparison.savingsPercent.toFixed(1)}%)</li>
  <li><strong>Projected Annual Savings:</strong> $${(comparison.totalSavings * 12).toFixed(2)}</li>
</ul>

<p>🚀 Your AI Order Engine will now use the optimized supplier for future orders.</p>
        `
      });

      alert('✅ Supplier switched successfully! Your AI Order Engine will now use the optimized pricing.');
      await analyzePricing();
    } catch (error) {
      console.error('Error switching supplier:', error);
      alert('Error switching supplier. Please try again.');
    }
  };

  const exportPriceComparisonReport = () => {
    const csvContent = [
      ['Product', 'UPC', 'Current Supplier', 'Current Price', 'Best Supplier', 'Best Price', 'Savings/Unit', 'Savings %', 'Total Savings'],
      ...priceComparisons.map(c => [
        c.item.product_name,
        c.item.upc_code,
        suppliers.find(s => s.id === c.currentSupplier.supplier_id)?.supplier_name || 'Unknown',
        c.currentSupplier.current_cost.toFixed(2),
        suppliers.find(s => s.id === c.bestPriceSupplier.supplier_id)?.supplier_name || 'Unknown',
        c.bestPriceSupplier.current_cost.toFixed(2),
        c.savingsPerUnit.toFixed(2),
        c.savingsPercent.toFixed(1) + '%',
        c.totalSavings.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price-comparison-${selectedLocation?.location_name}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="w-8 h-8 text-green-600" />
            Supplier Pricing Intelligence
            <Badge className="bg-green-600 text-white">PREMIUM</Badge>
          </h1>
          <p className="text-gray-600 mt-1">Multi-vendor price comparison & automated best-price selection</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            className="border rounded-lg px-4 py-2"
            value={selectedLocation?.id || ''}
            onChange={(e) => {
              const loc = locations.find(l => l.id === e.target.value);
              setSelectedLocation(loc);
              localStorage.setItem('current_location_id', e.target.value);
            }}
          >
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.location_name}</option>
            ))}
          </select>
          <Button
            onClick={analyzePricing}
            disabled={isAnalyzing}
            className="bg-green-600 hover:bg-green-700"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Pricing'}
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Savings Opportunity</p>
                <p className="text-3xl font-bold text-green-600">${metrics.totalSavingsOpportunity.toFixed(0)}</p>
                <p className="text-xs text-gray-500 mt-1">By switching suppliers</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Savings Potential</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.avgSavingsPercent.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">Per product switched</p>
              </div>
              <Percent className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Multi-Supplier Items</p>
                <p className="text-3xl font-bold text-purple-600">{metrics.itemsWithMultipleSuppliers}</p>
                <p className="text-xs text-gray-500 mt-1">Products with options</p>
              </div>
              <ShoppingCart className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Promotions</p>
                <p className="text-3xl font-bold text-orange-600">{metrics.activePromotions}</p>
                <p className="text-xs text-gray-500 mt-1">Special offers available</p>
              </div>
              <Gift className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="comparisons" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparisons">
            <BarChart3 className="w-4 h-4 mr-2" />
            Price Comparisons ({priceComparisons.length})
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload Price Lists
          </TabsTrigger>
          <TabsTrigger value="promotions">
            <Gift className="w-4 h-4 mr-2" />
            Active Promotions ({activePromotions.length})
          </TabsTrigger>
        </TabsList>

        {/* Price Comparisons Tab */}
        <TabsContent value="comparisons" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Best Price Opportunities</CardTitle>
                <Button onClick={exportPriceComparisonReport} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {priceComparisons.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No pricing opportunities found.</p>
                  <p className="text-sm text-gray-500">Upload supplier price lists or ensure products have multiple supplier options.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {priceComparisons.map((comp, idx) => (
                    <Card key={idx} className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-bold text-lg">{comp.item.product_name}</h4>
                                <p className="text-sm text-gray-600">UPC: {comp.item.upc_code}</p>
                              </div>
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                <TrendingDown className="w-3 h-3 mr-1" />
                                Save {comp.savingsPercent.toFixed(1)}%
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-xs text-gray-500">Current Supplier</p>
                                <p className="font-semibold">{suppliers.find(s => s.id === comp.currentSupplier.supplier_id)?.supplier_name || 'Unknown'}</p>
                                <p className="text-lg font-bold text-red-600">${comp.currentSupplier.current_cost.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Best Price Supplier</p>
                                <p className="font-semibold text-green-600">{suppliers.find(s => s.id === comp.bestPriceSupplier.supplier_id)?.supplier_name || 'Unknown'}</p>
                                <p className="text-lg font-bold text-green-600">${comp.bestPriceSupplier.current_cost.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Savings Per Unit</p>
                                <p className="text-2xl font-bold text-green-600">${comp.savingsPerUnit.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Total Savings</p>
                                <p className="text-2xl font-bold text-green-600">${comp.totalSavings.toFixed(0)}</p>
                                <p className="text-xs text-gray-500">Current stock value</p>
                              </div>
                            </div>

                            {comp.allSuppliers.length > 2 && (
                              <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                                <p className="text-xs text-blue-800 font-semibold mb-1">All Supplier Options:</p>
                                <div className="flex flex-wrap gap-2">
                                  {comp.allSuppliers.map((sp, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {suppliers.find(s => s.id === sp.supplier_id)?.supplier_name}: ${sp.current_cost.toFixed(2)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 lg:min-w-[150px]">
                            <Button
                              onClick={() => switchToSupplier(comp)}
                              className="bg-green-600 hover:bg-green-700 h-12"
                            >
                              <Zap className="w-4 h-4 mr-2" />
                              Switch & Save
                            </Button>
                            <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-xs text-green-700 font-semibold">Annual Savings</p>
                              <p className="text-lg font-bold text-green-600">${(comp.totalSavings * 12).toFixed(0)}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Price Lists Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Supplier Price Lists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    How It Works
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Upload supplier price lists (CSV or Excel)</li>
                    <li>AI automatically extracts product codes, names, and prices</li>
                    <li>System matches products to your inventory by UPC</li>
                    <li>Pricing is updated and comparison analysis runs automatically</li>
                    <li>You'll be notified of savings opportunities</li>
                  </ul>
                </div>

                {suppliers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No suppliers found. Add suppliers first in the Suppliers tab.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suppliers.map(supplier => (
                      <Card key={supplier.id} className="border-2 hover:border-green-500 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                              <ShoppingCart className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-bold">{supplier.supplier_name}</h4>
                              <p className="text-xs text-gray-500">{supplier.supplier_code}</p>
                            </div>
                          </div>

                          <label className="block">
                            <input
                              type="file"
                              accept=".csv,.xlsx,.xls"
                              onChange={(e) => handlePriceListUpload(e, supplier.id)}
                              disabled={uploadingFile}
                              className="hidden"
                            />
                            <Button
                              as="span"
                              className="w-full cursor-pointer"
                              variant="outline"
                              disabled={uploadingFile}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {uploadingFile ? 'Uploading...' : 'Upload Price List'}
                            </Button>
                          </label>

                          <div className="mt-3 text-xs text-gray-500">
                            <p>Last updated: {supplier.last_order_date ? new Date(supplier.last_order_date).toLocaleDateString() : 'Never'}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    Expected File Format
                  </h4>
                  <p className="text-sm text-yellow-800 mb-2">Your CSV/Excel file should include these columns:</p>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li><strong>Product Name</strong> or <strong>Description</strong></li>
                    <li><strong>UPC Code</strong> or <strong>Barcode</strong> (for matching)</li>
                    <li><strong>Price</strong>, <strong>Cost</strong>, or <strong>Unit Price</strong></li>
                    <li>Optional: <strong>Case Pack</strong>, <strong>Promotion Price</strong></li>
                  </ul>
                  <p className="text-xs text-yellow-700 mt-2">⭐ The AI will automatically detect and map columns even if names differ slightly.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Promotions Tab */}
        <TabsContent value="promotions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Supplier Promotions & Volume Discounts</CardTitle>
            </CardHeader>
            <CardContent>
              {activePromotions.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No active promotions found.</p>
                  <p className="text-sm text-gray-500 mt-2">Configure supplier contracts to track rebates and volume discounts.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activePromotions.map((promo) => {
                    const supplier = suppliers.find(s => s.id === promo.supplier_id);
                    const contract = supplier?.contract_info;
                    const rebates = contract?.rebate_programs || [];
                    const volumeDiscounts = contract?.volume_discounts || [];

                    return (
                      <Card key={promo.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-lg flex items-center gap-2">
                                <Gift className="w-5 h-5 text-orange-600" />
                                {supplier?.supplier_name}
                              </h4>
                              <p className="text-sm text-gray-600">{promo.supplier_product_name}</p>

                              {rebates.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-sm font-semibold text-orange-800">Rebate Programs:</p>
                                  {rebates.map((rebate, idx) => (
                                    <div key={idx} className="bg-orange-50 rounded p-2">
                                      <p className="text-sm font-semibold">{rebate.program_name}</p>
                                      <p className="text-sm text-gray-700">${rebate.rebate_amount} - {rebate.qualification_criteria}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {volumeDiscounts.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-sm font-semibold text-blue-800">Volume Discounts:</p>
                                  {volumeDiscounts.map((discount, idx) => (
                                    <Badge key={idx} className="bg-blue-100 text-blue-800 mr-2">
                                      Buy ${discount.threshold_amount}+ → Save {discount.discount_percentage}%
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}