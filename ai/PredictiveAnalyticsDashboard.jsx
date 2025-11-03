
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  DollarSign,
  Users,
  ShoppingCart,
  Fuel,
  Calendar,
  Zap,
  Eye
} from "lucide-react";
import { AIBusinessIntelligence } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";

export default function PredictiveAnalyticsDashboard({ locationId }) {
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7days');

  const loadAIInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await AIBusinessIntelligence.filter(
        { location_id: locationId },
        '-created_date',
        10
      );
      setInsights(data);
    } catch (error) {
      console.error("Error loading AI insights:", error);
    }
    setIsLoading(false);
  }, [locationId]);

  useEffect(() => {
    loadAIInsights();
  }, [loadAIInsights, selectedTimeframe]);

  const generateAIInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      // Use AI to analyze business data and generate insights
      const aiAnalysis = await InvokeLLM({
        prompt: `Analyze the fuel station business data and provide key insights for the next ${selectedTimeframe}. Focus on:
        1. Sales predictions and trends
        2. Inventory optimization opportunities
        3. Customer behavior patterns
        4. Competitive positioning recommendations
        5. Operational efficiency improvements
        
        Provide specific, actionable insights with confidence scores and potential revenue impact.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            key_insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  insight_type: { type: "string" },
                  description: { type: "string" },
                  impact_score: { type: "number" },
                  confidence_level: { type: "number" },
                  recommended_action: { type: "string" },
                  potential_revenue_impact: { type: "number" }
                }
              }
            },
            predictive_analytics: {
              type: "object",
              properties: {
                next_7_days_sales: { type: "number" },
                next_30_days_sales: { type: "number" }
              }
            }
          }
        }
      });

      const newInsight = await AIBusinessIntelligence.create({
        report_id: `AI-INSIGHT-${Date.now()}`,
        location_id: locationId,
        report_type: "operational_efficiency",
        analysis_period: {
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        ...aiAnalysis
      });

      setInsights([newInsight, ...insights]);
    } catch (error) {
      console.error("Error generating AI insights:", error);
    }
    setIsGeneratingInsights(false);
  };

  const getInsightIcon = (type) => {
    const iconMap = {
      sales_forecast: TrendingUp,
      inventory_optimization: ShoppingCart,
      customer_behavior: Users,
      competitor_analysis: Target,
      operational_efficiency: Zap,
      fraud_detection: AlertTriangle
    };
    return iconMap[type] || Brain;
  };

  const getImpactColor = (score) => {
    if (score >= 8) return "bg-red-100 text-red-800";
    if (score >= 6) return "bg-yellow-100 text-yellow-800";
    if (score >= 4) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI Business Intelligence
          </h2>
          <select 
            className="px-3 py-1 border rounded-lg"
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
          >
            <option value="7days">Next 7 Days</option>
            <option value="30days">Next 30 Days</option>
            <option value="90days">Next 90 Days</option>
          </select>
        </div>
        
        <Button 
          onClick={generateAIInsights}
          disabled={isGeneratingInsights}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Brain className="w-4 h-4 mr-2" />
          {isGeneratingInsights ? "Analyzing..." : "Generate New Insights"}
        </Button>
      </div>

      {/* Key Performance Predictions */}
      {insights.length > 0 && insights[0].predictive_analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Predicted 7-Day Sales</p>
                  <p className="text-2xl font-bold text-green-900">
                    ${insights[0].predictive_analytics.next_7_days_sales?.toLocaleString() || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Predicted 30-Day Sales</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${insights[0].predictive_analytics.next_30_days_sales?.toLocaleString() || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">AI Confidence</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {Math.round((insights[0].ai_model_performance?.accuracy_score || 0.85) * 100)}%
                  </p>
                </div>
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Revenue Opportunities</p>
                  <p className="text-2xl font-bold text-orange-900">
                    ${insights[0].key_insights?.reduce((sum, insight) => sum + (insight.potential_revenue_impact || 0), 0).toLocaleString() || 0}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Actionable AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">No AI insights generated yet</p>
              <Button onClick={generateAIInsights} className="bg-purple-600 hover:bg-purple-700">
                <Brain className="w-4 h-4 mr-2" />
                Generate First Analysis
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.slice(0, 1).map(report => 
                report.key_insights?.map((insight, index) => {
                  const InsightIcon = getInsightIcon(insight.insight_type);
                  
                  return (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <InsightIcon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold capitalize">
                              {insight.insight_type?.replace('_', ' ')}
                            </h4>
                            <p className="text-sm text-gray-600">{insight.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getImpactColor(insight.impact_score)}>
                            Impact: {insight.impact_score}/10
                          </Badge>
                          <Badge variant="outline">
                            {Math.round((insight.confidence_level || 0) * 100)}% Confidence
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Recommended Action:</p>
                        <p className="text-sm text-gray-600">{insight.recommended_action}</p>
                      </div>
                      
                      {insight.potential_revenue_impact > 0 && (
                        <div className="flex items-center gap-2 text-green-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Potential Revenue Impact: ${insight.potential_revenue_impact.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
