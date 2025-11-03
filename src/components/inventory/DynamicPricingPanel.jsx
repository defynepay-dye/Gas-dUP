import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Brain,
  Clock,
  Cloud,
  Calendar,
  Package,
  Target,
  Zap,
  Info
} from 'lucide-react';

export default function DynamicPricingPanel({ item, onUpdate }) {
  const [dynamicPricing, setDynamicPricing] = useState(item.dynamic_pricing || {
    enabled: false,
    base_price: item.cash_price,
    current_dynamic_price: item.cash_price,
    pricing_rules: {
      time_based: [],
      weather_based: [],
      inventory_based: {
        expiration_threshold_days: 3,
        discount_percentage: 20,
        low_stock_threshold: 5,
        low_stock_adjustment: 1.1
      }
    }
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleToggleDynamic = async (enabled) => {
    const updated = { ...dynamicPricing, enabled };
    setDynamicPricing(updated);
    if (onUpdate) onUpdate(updated);
  };

  const generateAIRecommendation = async () => {
    setIsGeneratingAI(true);
    try {
      const { InvokeLLM } = await import('@/api/integrations');
      
      const prompt = `
        You are a retail pricing AI. Analyze optimal pricing for:
        Product: ${item.product_name}
        Category: ${item.category}
        Base Price: $${item.cash_price}
        Current Inventory: ${item.inventory_tracking?.quantity_on_hand_singles || 0} units
        
        Consider:
        1. Time of day optimization (peak vs off-peak)
        2. Weather impact (if applicable)
        3. Inventory levels and expiration
        4. Category-specific demand patterns
        
        Provide pricing recommendations with reasoning.
      `;

      const aiResponse = await InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            recommended_price: { type: "number" },
            reasoning: { type: "string" },
            expected_volume_impact: { type: "number" },
            expected_revenue_impact: { type: "number" },
            confidence_score: { type: "number" },
            time_based_rules: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time_range: { type: "string" },
                  price_adjustment: { type: "number" },
                  reasoning: { type: "string" }
                }
              }
            }
          }
        }
      });

      setDynamicPricing({
        ...dynamicPricing,
        ai_recommendations: aiResponse,
        current_dynamic_price: aiResponse.recommended_price
      });

      alert(`AI Recommendation: $${aiResponse.recommended_price.toFixed(2)}\n\n${aiResponse.reasoning}`);

    } catch (error) {
      console.error('AI pricing error:', error);
      alert('Failed to generate AI recommendation');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Dynamic Pricing
              <Badge className="bg-purple-600">AI-Powered</Badge>
            </CardTitle>
            <CardDescription>Real-time price optimization based on demand, weather, and inventory</CardDescription>
          </div>
          <Switch
            checked={dynamicPricing.enabled}
            onCheckedChange={handleToggleDynamic}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Pricing Display */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border">
            <p className="text-sm text-gray-600">Base Price</p>
            <p className="text-2xl font-bold">${item.cash_price?.toFixed(2)}</p>
          </div>
          <div className="text-center p-4 bg-purple-100 rounded-lg border-2 border-purple-400">
            <p className="text-sm text-purple-800 font-semibold">Dynamic Price</p>
            <p className="text-2xl font-bold text-purple-600">
              ${dynamicPricing.current_dynamic_price?.toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border">
            <p className="text-sm text-gray-600">Adjustment</p>
            <p className={`text-2xl font-bold ${dynamicPricing.current_dynamic_price > item.cash_price ? 'text-green-600' : 'text-red-600'}`}>
              {dynamicPricing.current_dynamic_price > item.cash_price ? '+' : ''}
              ${(dynamicPricing.current_dynamic_price - item.cash_price).toFixed(2)}
            </p>
          </div>
        </div>

        {dynamicPricing.enabled && (
          <>
            {/* AI Recommendation */}
            <div className="flex gap-3">
              <Button
                onClick={generateAIRecommendation}
                disabled={isGeneratingAI}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
              >
                <Brain className="w-4 h-4 mr-2" />
                {isGeneratingAI ? 'Analyzing...' : 'Generate AI Price Recommendation'}
              </Button>
            </div>

            {dynamicPricing.ai_recommendations && (
              <Alert className="bg-purple-50 border-purple-200">
                <Brain className="w-4 h-4 text-purple-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">AI Recommendation: ${dynamicPricing.ai_recommendations.recommended_price?.toFixed(2)}</p>
                    <p className="text-sm">{dynamicPricing.ai_recommendations.reasoning}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      <div>
                        <strong>Expected Volume:</strong> {dynamicPricing.ai_recommendations.expected_volume_impact > 0 ? '+' : ''}
                        {dynamicPricing.ai_recommendations.expected_volume_impact}%
                      </div>
                      <div>
                        <strong>Expected Revenue:</strong> {dynamicPricing.ai_recommendations.expected_revenue_impact > 0 ? '+' : ''}
                        {dynamicPricing.ai_recommendations.expected_revenue_impact}%
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setDynamicPricing({
                          ...dynamicPricing,
                          current_dynamic_price: dynamicPricing.ai_recommendations.recommended_price
                        });
                      }}
                    >
                      Apply AI Recommendation
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Pricing Rules Tabs */}
            <Tabs defaultValue="time" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="time">
                  <Clock className="w-4 h-4 mr-1" />
                  Time-Based
                </TabsTrigger>
                <TabsTrigger value="weather">
                  <Cloud className="w-4 h-4 mr-1" />
                  Weather
                </TabsTrigger>
                <TabsTrigger value="inventory">
                  <Package className="w-4 h-4 mr-1" />
                  Inventory
                </TabsTrigger>
                <TabsTrigger value="performance">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Performance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="time" className="space-y-3">
                <p className="text-sm text-gray-600">Adjust prices based on time of day (peak/off-peak hours)</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Clock className="w-4 h-4 mr-2" />
                  Add Time Rule
                </Button>
              </TabsContent>

              <TabsContent value="weather" className="space-y-3">
                <p className="text-sm text-gray-600">Price adjustments based on weather conditions</p>
                <div className="space-y-2">
                  <Label>Example: Hot Coffee prices increase when temperature &lt; 50°F</Label>
                  <Button variant="outline" size="sm" className="w-full">
                    <Cloud className="w-4 h-4 mr-2" />
                    Add Weather Rule
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="inventory" className="space-y-3">
                <p className="text-sm text-gray-600">Automatic discounts for expiring items or low stock surcharges</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Expiration Discount</Label>
                    <Input
                      type="number"
                      value={dynamicPricing.pricing_rules.inventory_based?.discount_percentage || 0}
                      onChange={(e) => {
                        const updated = { ...dynamicPricing };
                        updated.pricing_rules.inventory_based.discount_percentage = parseFloat(e.target.value);
                        setDynamicPricing(updated);
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">% off if expiring in 3 days</p>
                  </div>
                  <div>
                    <Label>Low Stock Adjustment</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={dynamicPricing.pricing_rules.inventory_based?.low_stock_adjustment || 1}
                      onChange={(e) => {
                        const updated = { ...dynamicPricing };
                        updated.pricing_rules.inventory_based.low_stock_adjustment = parseFloat(e.target.value);
                        setDynamicPricing(updated);
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Multiplier when stock &lt; 5</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-3">
                {dynamicPricing.performance_metrics ? (
                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
                        <p className="text-2xl font-bold text-green-600">
                          +{dynamicPricing.performance_metrics.revenue_lift}%
                        </p>
                        <p className="text-xs text-gray-600">Revenue Lift</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-2xl font-bold">
                          {dynamicPricing.performance_metrics.volume_change > 0 ? '+' : ''}
                          {dynamicPricing.performance_metrics.volume_change}%
                        </p>
                        <p className="text-xs text-gray-600">Volume Change</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <DollarSign className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <p className="text-2xl font-bold text-purple-600">
                          +{dynamicPricing.performance_metrics.margin_improvement}%
                        </p>
                        <p className="text-xs text-gray-600">Margin Improvement</p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Info className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Performance data will appear after dynamic pricing is active</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Button className="w-full" onClick={() => onUpdate && onUpdate(dynamicPricing)}>
              <DollarSign className="w-4 h-4 mr-2" />
              Save Dynamic Pricing Configuration
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}