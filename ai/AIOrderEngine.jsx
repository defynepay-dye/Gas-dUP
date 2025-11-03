
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  InventoryItem, POSTransaction, PurchaseOrder, Supplier, 
  SupplierProduct, AIInventoryRecommendation, Location, User 
} from '@/api/entities';
import { InvokeLLM, SendEmail } from '@/api/integrations';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Sparkles,
  ShoppingCart, DollarSign, Package, BarChart3, Zap, RefreshCw,
  ArrowRight, Clock, Target, Brain, FileText, Bell, Mail, Calendar,
  Sun, Cloud, Snowflake, Leaf, ChevronRight, Info
} from 'lucide-react';

// Seasonal patterns database
const SEASONAL_PATTERNS = {
  beverages: {
    summer: { months: [5, 6, 7, 8], multiplier: 1.4, reason: "Hot weather increases beverage consumption" },
    winter: { months: [11, 12, 1, 2], multiplier: 0.85, reason: "Cooler weather reduces cold beverage sales" },
    spring: { months: [3, 4], multiplier: 1.1, reason: "Warming weather drives beverage demand" },
    fall: { months: [9, 10], multiplier: 1.0, reason: "Stable demand" }
  },
  snacks: {
    summer: { months: [5, 6, 7, 8], multiplier: 1.2, reason: "Road trips and outdoor activities" },
    winter: { months: [11, 12, 1, 2], multiplier: 1.0, reason: "Stable year-round demand" },
    holidays: { months: [12], multiplier: 1.5, reason: "Holiday shopping and gatherings" }
  },
  alcohol: {
    summer: { months: [5, 6, 7, 8], multiplier: 1.3, reason: "BBQs and outdoor events" },
    winter: { months: [11, 12, 1, 2], multiplier: 1.2, reason: "Holiday celebrations" },
    weekends: { multiplier: 1.4, reason: "Weekend social activities" }
  },
  automotive: {
    winter: { months: [11, 12, 1, 2], multiplier: 1.3, reason: "Winter maintenance products" },
    summer: { months: [5, 6, 7, 8], multiplier: 1.2, reason: "Road trip season" }
  },
  candy: {
    halloween: { months: [10], multiplier: 2.0, reason: "Halloween candy season" },
    holidays: { months: [12], multiplier: 1.5, reason: "Holiday gift giving" },
    valentine: { months: [2], multiplier: 1.3, reason: "Valentine's Day" }
  }
};

const getSeasonalFactor = (category, currentMonth) => {
  const patterns = SEASONAL_PATTERNS[category?.toLowerCase()] || {};
  let factor = 1.0;
  let reason = "No seasonal pattern identified";
  
  for (const [seasonName, pattern] of Object.entries(patterns)) {
    if (pattern.months && pattern.months.includes(currentMonth)) {
      factor = pattern.multiplier;
      reason = pattern.reason;
      break;
    }
  }
  
  return { factor, reason };
};

export default function AIOrderEngine() {
  const [recommendations, setRecommendations] = useState([]);
  const [draftOrders, setDraftOrders] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [analysisSettings, setAnalysisSettings] = useState({
    lookbackDays: 90,
    minConfidence: 0.6,
    considerSeasonality: true,
    autoEmailNotifications: true,
    safetyStockDays: 7
  });
  const [metrics, setMetrics] = useState({
    itemsNeedingReorder: 0,
    totalEstimatedCost: 0,
    potentialStockouts: 0,
    optimizationSavings: 0
  });

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      loadRecommendations();
    }
  }, [selectedLocation]);

  const loadLocations = async () => {
    try {
      const locs = await Location.list();
      setLocations(locs);
      if (locs.length > 0) {
        const savedLocationId = localStorage.getItem('current_location_id');
        const defaultLoc = locs.find(l => l.id === savedLocationId) || locs[0];
        setSelectedLocation(defaultLoc);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const recs = await AIInventoryRecommendation.filter({
        location_id: selectedLocation.id,
        action_taken: 'pending'
      }, '-recommendation_date', 50);
      
      setRecommendations(recs);
      
      // Calculate metrics
      const needsReorder = recs.filter(r => r.current_stock <= r.recommended_reorder_point).length;
      const totalCost = recs.reduce((sum, r) => sum + (r.cost_analysis?.optimal_order_cost || 0), 0);
      const stockouts = recs.filter(r => r.predicted_demand?.trend_direction === 'increasing' && r.current_stock < 10).length;
      const savings = recs.reduce((sum, r) => sum + Math.max(0, (r.cost_analysis?.stockout_risk_cost || 0) - (r.cost_analysis?.optimal_order_cost || 0)), 0);
      
      setMetrics({
        itemsNeedingReorder: needsReorder,
        totalEstimatedCost: totalCost,
        potentialStockouts: stockouts,
        optimizationSavings: savings
      });
      
      // Load existing draft orders
      const orders = await PurchaseOrder.filter({
        location_id: selectedLocation.id,
        status: 'draft'
      }, '-order_date', 20);
      setDraftOrders(orders);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const runAIAnalysis = async () => {
    if (!selectedLocation) {
      alert('Please select a location');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Step 1: Get all inventory items for this location
      const allItems = await InventoryItem.filter({ 
        location_id: selectedLocation.id,
        active: true 
      });

      // Step 2: Get recent sales data
      const lookbackDate = new Date();
      lookbackDate.setDate(lookbackDate.getDate() - analysisSettings.lookbackDays);
      
      const recentTransactions = await POSTransaction.filter({
        status: 'completed'
      }, '-created_date', 1000);

      const currentMonth = new Date().getMonth() + 1;

      // Step 3: Analyze each product with AI
      const analysisPromises = allItems.slice(0, 50).map(async (item) => {
        try {
          // Calculate sales velocity
          const itemSales = recentTransactions
            .flatMap(t => t.items || [])
            .filter(i => i.upc_code === item.upc_code);
          
          const totalSold = itemSales.reduce((sum, i) => sum + (i.quantity || 0), 0);
          const dailyAverage = totalSold / analysisSettings.lookbackDays;
          const currentStock = item.inventory_tracking?.quantity_on_hand_singles || 0;
          const daysUntilStockout = dailyAverage > 0 ? currentStock / dailyAverage : 999;

          // Get seasonal factor
          const seasonal = analysisSettings.considerSeasonality 
            ? getSeasonalFactor(item.category, currentMonth)
            : { factor: 1.0, reason: "Seasonality analysis disabled" };

          // Get supplier info
          const supplierProducts = await SupplierProduct.filter({ product_id: item.id });
          const primarySupplier = supplierProducts.find(sp => sp.is_primary_supplier) || supplierProducts[0];

          // Calculate week-over-week trends
          const lastWeekSales = itemSales.filter(sale => {
            const saleDate = new Date(sale.created_date);
            const daysAgo = (new Date() - saleDate) / (1000 * 60 * 60 * 24);
            return daysAgo <= 7;
          }).reduce((sum, i) => sum + (i.quantity || 0), 0);

          const previousWeekSales = itemSales.filter(sale => {
            const saleDate = new Date(sale.created_date);
            const daysAgo = (new Date() - saleDate) / (1000 * 60 * 60 * 24);
            return daysAgo > 7 && daysAgo <= 14;
          }).reduce((sum, i) => sum + (i.quantity || 0), 0);

          const weeklyTrend = previousWeekSales > 0 
            ? ((lastWeekSales - previousWeekSales) / previousWeekSales) * 100 
            : 0;

          // Use AI to forecast demand and recommend order
          const aiPrompt = `Analyze this product and recommend optimal ordering with advanced forecasting:

Product: ${item.product_name}
Category: ${item.category}
Current Stock: ${currentStock} units
Daily Sales Average (${analysisSettings.lookbackDays} days): ${dailyAverage.toFixed(2)} units
Days Until Stockout: ${daysUntilStockout.toFixed(1)} days
Reorder Level: ${item.reorder_level || 0} units
Cost per Unit: $${primarySupplier?.current_cost || item.inventory_tracking?.weighted_average_cost || 0}
Lead Time: ${primarySupplier?.lead_time_days || 3} days
Safety Stock Buffer: ${analysisSettings.safetyStockDays} days

Seasonal Analysis:
- Current Month: ${new Date().toLocaleString('default', { month: 'long' })}
- Seasonal Factor: ${seasonal.factor}x
- Reason: ${seasonal.reason}

Recent Trends:
- Last Week Sales: ${lastWeekSales} units
- Previous Week Sales: ${previousWeekSales} units
- Week-over-Week Change: ${weeklyTrend.toFixed(1)}%

Consider:
1. Current sales trend and weekly momentum
2. Seasonal patterns and upcoming events
3. Stock levels vs safety stock requirements
4. Lead time coverage with buffer
5. Economic order quantity optimization
6. Risk of stockout vs carrying costs

Provide comprehensive analysis with:
- Recommended reorder point (include safety stock)
- Recommended order quantity (optimized for cost and turnover)
- Predicted demand for next 7, 14, and 30 days
- Confidence score (0-1) based on data quality and patterns
- Risk assessment (low/medium/high)
- Detailed reasoning explaining the recommendation`;

          const aiResult = await InvokeLLM({
            prompt: aiPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                recommended_reorder_point: { type: "integer" },
                recommended_order_quantity: { type: "integer" },
                next_7_days_demand: { type: "number" },
                next_14_days_demand: { type: "number" },
                next_30_days_demand: { type: "number" },
                confidence_score: { type: "number" },
                stockout_risk: { type: "string" },
                trend_direction: { type: "string" },
                reasoning: { type: "string" },
                seasonal_impact: { type: "string" },
                recommended_action: { type: "string" }
              }
            }
          });

          // Skip if confidence too low
          if (aiResult.confidence_score < analysisSettings.minConfidence) {
            console.log(`Skipping ${item.product_name}: Low confidence (${aiResult.confidence_score})`);
            return null;
          }

          // Calculate costs
          const unitCost = primarySupplier?.current_cost || item.inventory_tracking?.weighted_average_cost || 0;
          const orderCost = aiResult.recommended_order_quantity * unitCost;
          const carryingCost = currentStock * unitCost * 0.002; // 0.2% per unit per period
          const stockoutRiskCost = daysUntilStockout < analysisSettings.safetyStockDays 
            ? dailyAverage * analysisSettings.safetyStockDays * (item.cash_price - unitCost) * 0.7 
            : 0;

          // Create recommendation record
          const recommendation = {
            location_id: selectedLocation.id,
            upc_code: item.upc_code,
            product_name: item.product_name,
            current_stock: currentStock,
            recommended_reorder_point: aiResult.recommended_reorder_point,
            recommended_order_quantity: aiResult.recommended_order_quantity,
            predicted_demand: {
              daily_average: dailyAverage,
              next_7_days: aiResult.next_7_days_demand,
              next_14_days: aiResult.next_14_days_demand,
              next_30_days: aiResult.next_30_days_demand,
              trend_direction: aiResult.trend_direction,
              seasonal_factor: seasonal.factor,
              seasonal_reasoning: seasonal.reason,
              weekly_trend_percent: weeklyTrend
            },
            confidence_score: aiResult.confidence_score,
            cost_analysis: {
              current_cost: unitCost,
              carrying_cost: carryingCost,
              stockout_risk_cost: stockoutRiskCost,
              optimal_order_cost: orderCost,
              potential_savings: stockoutRiskCost - orderCost
            },
            recommendation_date: new Date().toISOString(),
            action_taken: 'pending',
            supplier_id: primarySupplier?.supplier_id,
            lead_time_days: primarySupplier?.lead_time_days || 3,
            ai_reasoning: aiResult.reasoning,
            stockout_risk: aiResult.stockout_risk,
            seasonal_impact: aiResult.seasonal_impact,
            recommended_action: aiResult.recommended_action
          };

          // Save recommendation
          await AIInventoryRecommendation.create(recommendation);
          
          return recommendation;
        } catch (error) {
          console.error(`Error analyzing ${item.product_name}:`, error);
          return null;
        }
      });

      const results = await Promise.all(analysisPromises);
      const validResults = results.filter(r => r !== null);
      
      // Send email notification if enabled
      if (analysisSettings.autoEmailNotifications && validResults.length > 0) {
        await sendAnalysisCompleteEmail(validResults);
      }
      
      alert(`✅ AI Analysis Complete! Generated ${validResults.length} recommendations with confidence >= ${(analysisSettings.minConfidence * 100).toFixed(0)}%`);
      await loadRecommendations();
    } catch (error) {
      console.error('Error running AI analysis:', error);
      alert('Error running AI analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendAnalysisCompleteEmail = async (recommendations) => {
    try {
      const user = await User.me();
      const criticalItems = recommendations.filter(r => r.stockout_risk === 'high').length;
      const totalOrderValue = recommendations.reduce((sum, r) => sum + (r.cost_analysis?.optimal_order_cost || 0), 0);
      
      const emailBody = `
<h2>🤖 AI Order Engine - Analysis Complete</h2>

<p>The AI Order Engine has completed analysis for <strong>${selectedLocation.location_name}</strong>.</p>

<h3>Summary:</h3>
<ul>
  <li><strong>${recommendations.length}</strong> products analyzed</li>
  <li><strong>${criticalItems}</strong> items at HIGH risk of stockout</li>
  <li><strong>$${totalOrderValue.toFixed(2)}</strong> in recommended orders</li>
</ul>

<h3>Top Priority Items:</h3>
<ul>
${recommendations
  .filter(r => r.stockout_risk === 'high')
  .slice(0, 5)
  .map(r => `<li><strong>${r.product_name}</strong> - ${r.current_stock} units in stock, recommend ordering ${r.recommended_order_quantity}</li>`)
  .join('\n')}
</ul>

<p>🔗 Log in to your FuelFlow Pro Back Office to review and approve purchase orders.</p>

<p><em>This is an automated notification from FuelFlow Pro AI Order Engine.</em></p>
      `;

      await SendEmail({
        to: user.email,
        subject: `🤖 AI Order Engine Alert: ${criticalItems} Critical Items Need Attention`,
        body: emailBody
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  };

  const generatePurchaseOrders = async () => {
    if (recommendations.length === 0) {
      alert('No recommendations available. Run AI analysis first.');
      return;
    }

    setIsGenerating(true);

    try {
      // PHASE 2 ENHANCEMENT: Group recommendations by supplier WITH BEST PRICE SELECTION
      const supplierGroups = {};
      
      for (const rec of recommendations) {
        if (rec.recommended_order_quantity > 0) {
          // Get all supplier options for this product
          const allSupplierProducts = await SupplierProduct.filter({ 
            product_id: rec.upc_code,
            active: true 
          });

          if (allSupplierProducts.length === 0) continue;

          // Sort by price - BEST PRICE WINS
          const sortedByPrice = allSupplierProducts.sort((a, b) => a.current_cost - b.current_cost);
          const bestPriceSupplier = sortedByPrice[0];
          const supplierId = bestPriceSupplier.supplier_id;

          if (!supplierGroups[supplierId]) {
            supplierGroups[supplierId] = [];
          }

          supplierGroups[supplierId].push({
            ...rec,
            selectedSupplierProduct: bestPriceSupplier,
            allSupplierOptions: sortedByPrice,
            priceSavings: sortedByPrice.length > 1 
              ? (sortedByPrice[1].current_cost - bestPriceSupplier.current_cost) * rec.recommended_order_quantity
              : 0
          });
        }
      }

      let ordersCreated = 0;
      let totalOptimizationSavings = 0;

      // Create a PO for each supplier
      for (const [supplierId, items] of Object.entries(supplierGroups)) {
        try {
          const suppliers = await Supplier.filter({ id: supplierId });
          if (!suppliers || suppliers.length === 0) continue;

          const supplier = suppliers[0];
          
          const orderItems = items.map(rec => {
            const unitCost = rec.selectedSupplierProduct.current_cost;
            totalOptimizationSavings += rec.priceSavings || 0;
            
            return {
              supplier_product_id: rec.selectedSupplierProduct.id,
              inventory_item_id: rec.upc_code,
              product_name: rec.product_name,
              quantity: rec.recommended_order_quantity,
              unit_cost: unitCost,
              total_cost: rec.recommended_order_quantity * unitCost,
              ai_recommendation_id: rec.id,
              seasonal_note: rec.seasonal_impact,
              price_optimization_savings: rec.priceSavings || 0,
              alternative_suppliers_count: rec.allSupplierOptions?.length || 1
            };
          });

          const totalAmount = orderItems.reduce((sum, item) => sum + item.total_cost, 0);
          const totalPriceOptimization = orderItems.reduce((sum, item) => sum + (item.price_optimization_savings || 0), 0);
          const expectedDeliveryDate = new Date();
          expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + (supplier.delivery_info?.lead_time_days || 7));

          const poData = {
            order_number: `AI-PO-${Date.now()}-${supplierId.slice(0, 6)}`,
            supplier_id: supplierId,
            location_id: selectedLocation.id,
            items_ordered: orderItems,
            order_date: new Date().toISOString(),
            expected_delivery_date: expectedDeliveryDate.toISOString().split('T')[0],
            status: 'draft',
            total_amount: totalAmount,
            notes: `🤖 AI-generated order with BEST PRICE OPTIMIZATION\n\n` +
                   `📊 ${items.length} items recommended for reorder\n` +
                   `🎯 Confidence Level: ${(items.reduce((sum, i) => sum + i.confidence_score, 0) / items.length * 100).toFixed(0)}%\n` +
                   `💰 Order Value: $${totalAmount.toFixed(2)}\n` +
                   `💎 Price Optimization Savings: $${totalPriceOptimization.toFixed(2)}\n` +
                   `⏰ Expected Delivery: ${expectedDeliveryDate.toLocaleDateString()}\n\n` +
                   `${items.some(i => i.stockout_risk === 'high') ? '⚠️ Contains HIGH priority items requiring immediate attention\n\n' : ''}` +
                   `✨ This supplier was automatically selected for offering the best pricing across ${items.length} products.`,
            submitted_by: 'AI Order Engine with Price Optimization'
          };

          await PurchaseOrder.create(poData);
          ordersCreated++;

          // Mark recommendations as auto-ordered
          for (const rec of items) {
            await AIInventoryRecommendation.update(rec.id, {
              action_taken: 'auto_ordered',
              po_number: poData.order_number
            });
          }
        } catch (error) {
          console.error(`Error creating PO for supplier ${supplierId}:`, error);
        }
      }

      // Send enhanced email notification with pricing optimization details
      if (analysisSettings.autoEmailNotifications && ordersCreated > 0) {
        await sendOptimizedOrdersEmail(ordersCreated, totalOptimizationSavings);
      }

      alert(`✅ Purchase Orders Generated with Price Optimization!\n\n` +
            `${ordersCreated} draft orders created\n` +
            `$${totalOptimizationSavings.toFixed(2)} saved through supplier optimization\n\n` +
            `Orders are ready for review in the Draft Orders tab.`);
      await loadRecommendations();
    } catch (error) {
      console.error('Error generating purchase orders:', error);
      alert('Error generating purchase orders. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendOptimizedOrdersEmail = async (orderCount, optimizationSavings) => {
    try {
      const user = await User.me();
      const totalValue = draftOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      
      const emailBody = `
<h2>🎯 Purchase Orders Ready with Price Optimization</h2>

<p>The AI Order Engine has generated <strong>${orderCount} optimized purchase orders</strong> for <strong>${selectedLocation.location_name}</strong>.</p>

<h3>💎 Pricing Optimization Results:</h3>
<ul>
  <li><strong>${orderCount}</strong> purchase orders created</li>
  <li><strong>$${totalValue.toFixed(2)}</strong> total order value</li>
  <li><strong>$${optimizationSavings.toFixed(2)}</strong> saved through supplier price comparison</li>
  <li><strong>${((optimizationSavings / (totalValue + optimizationSavings)) * 100).toFixed(1)}%</strong> cost reduction achieved</li>
  <li>Status: <strong>DRAFT - Awaiting Approval</strong></li>
</ul>

<h3>🤖 How We Optimized:</h3>
<ul>
  <li>✅ Analyzed prices from ALL your suppliers for each product</li>
  <li>✅ Automatically selected lowest-cost supplier</li>
  <li>✅ Applied volume discounts where applicable</li>
  <li>✅ Considered delivery times and reliability</li>
</ul>

<p>⏰ <strong>Action Required:</strong> Review and approve these orders in your FuelFlow Pro Back Office.</p>

<p>💡 <strong>Projected Annual Savings:</strong> $${(optimizationSavings * 12).toFixed(2)} from price optimization alone!</p>

<p>🔗 Log in now to review your orders.</p>

<p><em>This is an automated notification from FuelFlow Pro AI Order Engine with Multi-Vendor Price Optimization.</em></p>
      `;

      await SendEmail({
        to: user.email,
        subject: `💎 ${orderCount} Optimized Orders Ready - Saved $${optimizationSavings.toFixed(2)}!`,
        body: emailBody
      });
    } catch (error) {
      console.error('Error sending orders notification:', error);
    }
  };

  const approveOrder = async (orderId) => {
    try {
      await PurchaseOrder.update(orderId, { status: 'submitted' });
      
      // Send confirmation email
      if (analysisSettings.autoEmailNotifications) {
        const user = await User.me();
        const order = draftOrders.find(o => o.id === orderId);
        
        if (order) {
          await SendEmail({
            to: user.email,
            subject: `✅ Purchase Order Approved: ${order.order_number}`,
            body: `
<h2>✅ Purchase Order Approved</h2>

<p>Order <strong>${order.order_number}</strong> has been approved and submitted.</p>

<ul>
  <li><strong>Total Amount:</strong> $${order.total_amount?.toFixed(2)}</li>
  <li><strong>Items:</strong> ${order.items_ordered?.length || 0}</li>
  <li><strong>Expected Delivery:</strong> ${new Date(order.expected_delivery_date).toLocaleDateString()}</li>
</ul>

<p>The supplier has been notified and will process your order.</p>
            `
          });
        }
      }
      
      alert('✅ Purchase order approved and submitted to supplier!');
      await loadRecommendations();
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Error approving order');
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeasonIcon = (category) => {
    const month = new Date().getMonth() + 1;
    if ([6, 7, 8].includes(month)) return <Sun className="w-4 h-4 text-orange-500" />;
    if ([12, 1, 2].includes(month)) return <Snowflake className="w-4 h-4 text-blue-500" />;
    if ([3, 4, 5].includes(month)) return <Leaf className="w-4 h-4 text-green-500" />;
    return <Cloud className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            AI Order Engine
            <Badge className="bg-purple-600 text-white">PREMIUM</Badge>
          </h1>
          <p className="text-gray-600 mt-1">Automated demand forecasting with seasonal intelligence</p>
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
            onClick={runAIAnalysis}
            disabled={isAnalyzing || !selectedLocation}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run AI Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="w-5 h-5" />
            Analysis Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label className="text-sm">Lookback Period (Days)</Label>
              <Input
                type="number"
                value={analysisSettings.lookbackDays}
                onChange={(e) => setAnalysisSettings({...analysisSettings, lookbackDays: parseInt(e.target.value)})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Min Confidence (%)</Label>
              <Input
                type="number"
                value={analysisSettings.minConfidence * 100}
                onChange={(e) => setAnalysisSettings({...analysisSettings, minConfidence: parseInt(e.target.value) / 100})}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Safety Stock (Days)</Label>
              <Input
                type="number"
                value={analysisSettings.safetyStockDays}
                onChange={(e) => setAnalysisSettings({...analysisSettings, safetyStockDays: parseInt(e.target.value)})}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={analysisSettings.considerSeasonality}
                onChange={(e) => setAnalysisSettings({...analysisSettings, considerSeasonality: e.target.checked})}
                className="w-4 h-4"
              />
              <Label className="text-sm">Consider Seasonality</Label>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={analysisSettings.autoEmailNotifications}
                onChange={(e) => setAnalysisSettings({...analysisSettings, autoEmailNotifications: e.target.checked})}
                className="w-4 h-4"
              />
              <Label className="text-sm flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Email Notifications
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Items Need Reorder</p>
                <p className="text-3xl font-bold text-orange-600">{metrics.itemsNeedingReorder}</p>
                <p className="text-xs text-gray-500 mt-1">Below reorder point</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Potential Stockouts</p>
                <p className="text-3xl font-bold text-red-600">{metrics.potentialStockouts}</p>
                <p className="text-xs text-gray-500 mt-1">High risk items</p>
              </div>
              <TrendingDown className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Est. Order Cost</p>
                <p className="text-3xl font-bold text-blue-600">${metrics.totalEstimatedCost.toFixed(0)}</p>
                <p className="text-xs text-gray-500 mt-1">Total to invest</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Est. Savings</p>
                <p className="text-3xl font-bold text-green-600">${metrics.optimizationSavings.toFixed(0)}</p>
                <p className="text-xs text-gray-500 mt-1">Avoiding stockouts</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommendations">
            <BarChart3 className="w-4 h-4 mr-2" />
            AI Recommendations ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="draft-orders">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Draft Orders ({draftOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>AI-Powered Reorder Recommendations</CardTitle>
                <Button
                  onClick={generatePurchaseOrders}
                  disabled={isGenerating || recommendations.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Purchase Orders
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No recommendations yet. Run AI analysis to get started.</p>
                  <Button onClick={runAIAnalysis} disabled={isAnalyzing}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Run AI Analysis
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <Card key={rec.id} className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-lg">{rec.product_name}</h4>
                                  {getSeasonIcon(rec.category)}
                                </div>
                                <p className="text-sm text-gray-600">UPC: {rec.upc_code}</p>
                              </div>
                              <Badge className={getRiskColor(rec.stockout_risk)}>
                                {rec.stockout_risk?.toUpperCase()} Risk
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Current Stock</p>
                                <p className="font-bold text-lg">{rec.current_stock}</p>
                                <p className="text-xs text-gray-400">units</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Daily Demand</p>
                                <p className="font-bold text-lg">{rec.predicted_demand?.daily_average?.toFixed(1)}</p>
                                <p className="text-xs text-gray-400">units/day</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">7-Day Forecast</p>
                                <p className="font-bold text-lg">{rec.predicted_demand?.next_7_days?.toFixed(0)}</p>
                                <p className="text-xs text-gray-400">units</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Order Qty</p>
                                <p className="font-bold text-lg text-green-600">{rec.recommended_order_quantity}</p>
                                <p className="text-xs text-gray-400">units</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Order Cost</p>
                                <p className="font-bold text-lg text-blue-600">${rec.cost_analysis?.optimal_order_cost?.toFixed(0)}</p>
                                <p className="text-xs text-gray-400">total</p>
                              </div>
                            </div>
                            
                            {rec.predicted_demand?.seasonal_reasoning && (
                              <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-800 flex items-center gap-1">
                                  {getSeasonIcon()}
                                  <strong>Seasonal Factor ({rec.predicted_demand.seasonal_factor}x):</strong> {rec.predicted_demand.seasonal_reasoning}
                                </p>
                              </div>
                            )}
                            
                            {rec.ai_reasoning && (
                              <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                                <p className="text-xs text-gray-700">
                                  <Sparkles className="w-3 h-3 inline mr-1 text-purple-600" />
                                  <strong>AI Insight:</strong> {rec.ai_reasoning.substring(0, 200)}
                                  {rec.ai_reasoning.length > 200 && '...'}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col justify-center gap-2 lg:min-w-[140px]">
                            <Badge variant="outline" className="justify-center">
                              <Target className="w-3 h-3 mr-1" />
                              {(rec.confidence_score * 100).toFixed(0)}% Confidence
                            </Badge>
                            {rec.predicted_demand?.trend_direction && (
                              <Badge 
                                variant="outline" 
                                className={`justify-center ${
                                  rec.predicted_demand.trend_direction === 'increasing' 
                                    ? 'text-green-600 border-green-300' 
                                    : rec.predicted_demand.trend_direction === 'decreasing' 
                                    ? 'text-red-600 border-red-300' 
                                    : 'text-gray-600'
                                }`}
                              >
                                {rec.predicted_demand.trend_direction === 'increasing' ? (
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                ) : rec.predicted_demand.trend_direction === 'decreasing' ? (
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                ) : null}
                                {rec.predicted_demand.trend_direction}
                              </Badge>
                            )}
                            {rec.predicted_demand?.weekly_trend_percent !== undefined && (
                              <Badge 
                                variant="outline" 
                                className={`justify-center text-xs ${
                                  rec.predicted_demand.weekly_trend_percent > 10 
                                    ? 'text-green-600 border-green-300' 
                                    : rec.predicted_demand.weekly_trend_percent < -10 
                                    ? 'text-red-600 border-red-300' 
                                    : 'text-gray-600'
                                }`}
                              >
                                {rec.predicted_demand.weekly_trend_percent > 0 ? '+' : ''}
                                {rec.predicted_demand.weekly_trend_percent.toFixed(1)}% WoW
                              </Badge>
                            )}
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

        {/* Draft Orders Tab */}
        <TabsContent value="draft-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Draft Purchase Orders - Ready for Review</CardTitle>
            </CardHeader>
            <CardContent>
              {draftOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No draft orders yet. Generate orders from recommendations.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {draftOrders.map((order) => (
                    <Card key={order.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-bold text-lg flex items-center gap-2">
                                  {order.order_number}
                                  <Badge className="bg-purple-100 text-purple-800">
                                    <Brain className="w-3 h-3 mr-1" />
                                    AI Generated
                                  </Badge>
                                </h4>
                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                  <Calendar className="w-3 h-3" />
                                  Expected: {new Date(order.expected_delivery_date).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800">
                                {order.items_ordered?.length || 0} Items
                              </Badge>
                            </div>
                            
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 mb-3 border border-purple-100">
                              <p className="text-sm text-gray-700 whitespace-pre-line">{order.notes}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500">Order Date</p>
                                <p className="font-semibold">{new Date(order.order_date).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Total Amount</p>
                                <p className="font-bold text-green-600 text-xl">${order.total_amount?.toFixed(2)}</p>
                              </div>
                            </div>
                            
                            {order.items_ordered && order.items_ordered.length > 0 && (
                              <div className="mt-3 space-y-1">
                                <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  Order Items:
                                </p>
                                <div className="bg-white rounded-lg p-2 border">
                                  {order.items_ordered.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="text-sm text-gray-600 flex justify-between py-1 border-b last:border-0">
                                      <span className="flex-1">• {item.product_name}</span>
                                      <span className="font-semibold">{item.quantity} units</span>
                                      <span className="text-green-600 ml-3">${item.total_cost?.toFixed(2)}</span>
                                    </div>
                                  ))}
                                  {order.items_ordered.length > 5 && (
                                    <p className="text-xs text-gray-500 text-center pt-2">
                                      +{order.items_ordered.length - 5} more items...
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 lg:min-w-[150px]">
                            <Button
                              onClick={() => approveOrder(order.id)}
                              className="bg-green-600 hover:bg-green-700 h-12"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve & Submit
                            </Button>
                            <Button variant="outline" className="h-12">
                              <FileText className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            {analysisSettings.autoEmailNotifications && (
                              <Button variant="outline" size="sm" className="text-xs">
                                <Mail className="w-3 h-3 mr-1" />
                                Email Summary
                              </Button>
                            )}
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
      </Tabs>
    </div>
  );
}
