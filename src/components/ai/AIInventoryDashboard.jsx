
import React, { useState, useEffect, useCallback } from 'react';
import { AIInventoryRecommendation } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Package
} from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';

export default function AIInventoryDashboard({ locationId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);

  const loadRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await AIInventoryRecommendation.filter(
        { location_id: locationId },
        '-recommendation_date',
        50
      );
      setRecommendations(data);
    } catch (error) {
      console.error('Error loading AI recommendations:', error);
    }
    setIsLoading(false);
  }, [locationId]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const generateAIRecommendations = async () => {
    setIsGeneratingRecommendations(true);
    try {
      // Use AI to analyze inventory patterns and generate recommendations
      const aiAnalysis = await InvokeLLM({
        prompt: `Analyze current inventory data and generate intelligent reorder recommendations. Consider:
        - Historical sales patterns
        - Seasonal trends
        - Current stock levels
        - Lead times
        - Shelf life constraints
        - Storage capacity
        - Cost optimization
        
        Generate specific recommendations for each product including optimal reorder points, quantities, and confidence levels.`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  upc_code: { type: "string" },
                  product_name: { type: "string" },
                  current_stock: { type: "integer" },
                  recommended_reorder_point: { type: "integer" },
                  recommended_order_quantity: { type: "integer" },
                  confidence_score: { type: "number" },
                  reasoning: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Save AI recommendations to database
      for (const rec of aiAnalysis.recommendations) {
        await AIInventoryRecommendation.create({
          location_id: locationId,
          ...rec,
          recommendation_date: new Date().toISOString(),
          action_taken: 'pending'
        });
      }

      loadRecommendations();
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
    }
    setIsGeneratingRecommendations(false);
  };

  const approveRecommendation = async (recommendation) => {
    await AIInventoryRecommendation.update(recommendation.id, {
      action_taken: 'approved'
    });
    loadRecommendations();
    // Here you would typically trigger the actual ordering process
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConfidenceBadge = (score) => {
    if (score >= 0.8) return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low Confidence</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI Inventory Intelligence
          </h2>
          <p className="text-gray-500">AI-powered inventory optimization and demand forecasting</p>
        </div>
        <Button 
          onClick={generateAIRecommendations}
          disabled={isGeneratingRecommendations}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isGeneratingRecommendations ? 'Analyzing...' : 'Generate AI Recommendations'}
        </Button>
      </div>

      {/* AI Insights Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Recommendations</p>
                <p className="text-2xl font-bold">
                  {recommendations.filter(r => r.action_taken === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Potential Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  ${recommendations.reduce((sum, r) => sum + (r.cost_analysis?.optimal_order_cost || 0), 0).toFixed(0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">High Priority Items</p>
                <p className="text-2xl font-bold text-red-600">
                  {recommendations.filter(r => r.confidence_score > 0.8 && r.current_stock <= r.recommended_reorder_point).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Auto-Approved</p>
                <p className="text-2xl font-bold">
                  {recommendations.filter(r => r.action_taken === 'auto_ordered').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            AI Inventory Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading AI recommendations...</div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No AI recommendations yet</p>
              <p className="text-sm">Click "Generate AI Recommendations" to start</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{rec.product_name}</h4>
                        {rec.predicted_demand?.trend_direction && getTrendIcon(rec.predicted_demand.trend_direction)}
                        {getConfidenceBadge(rec.confidence_score)}
                      </div>
                      <p className="text-sm text-gray-500">UPC: {rec.upc_code}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        <span className="font-medium">Current: {rec.current_stock}</span>
                      </div>
                      <div className="text-sm text-orange-600">
                        <span className="font-medium">Reorder at: {rec.recommended_reorder_point}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Recommended Order</p>
                      <p className="font-semibold">{rec.recommended_order_quantity} units</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Daily Demand</p>
                      <p className="font-semibold">{rec.predicted_demand?.daily_average?.toFixed(1) || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Estimated Cost</p>
                      <p className="font-semibold">${rec.cost_analysis?.optimal_order_cost?.toFixed(2) || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Stock Level</p>
                      <Progress 
                        value={(rec.current_stock / (rec.recommended_reorder_point * 2)) * 100} 
                        className="w-full h-2"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Badge 
                        className={
                          rec.action_taken === 'pending' ? 'bg-orange-100 text-orange-800' :
                          rec.action_taken === 'approved' ? 'bg-green-100 text-green-800' :
                          rec.action_taken === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }
                      >
                        {rec.action_taken.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    {rec.action_taken === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => AIInventoryRecommendation.update(rec.id, { action_taken: 'rejected' })}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => approveRecommendation(rec)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve & Order
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
