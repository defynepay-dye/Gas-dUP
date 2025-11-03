import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { POSTransaction, InventoryItem, Product } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";

export default function AIIntelligenceDashboard() {
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      // Get recent transaction data
      const recentTransactions = await POSTransaction.list('-created_date', 100);
      const inventory = await InventoryItem.list();
      const products = await Product.list();

      // Calculate basic metrics
      const totalSales = recentTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const lowStockItems = inventory.filter(item => 
        (item.inventory_tracking?.quantity_on_hand_singles || 0) <= item.reorder_level
      );

      // Use AI to analyze patterns
      const prompt = `
        Analyze this convenience store data and provide 3-5 key business insights:
        
        Recent Sales Data:
        - Total transactions: ${recentTransactions.length}
        - Total revenue: $${totalSales.toFixed(2)}
        - Low stock items: ${lowStockItems.length}
        
        Provide actionable insights in JSON format:
        {
          "insights": [
            {
              "type": "sales" | "inventory" | "pricing" | "customer",
              "title": "Brief insight title",
              "description": "Detailed explanation",
              "priority": "high" | "medium" | "low",
              "recommendation": "Specific action to take"
            }
          ]
        }
      `;

      const aiResponse = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (aiResponse?.insights) {
        setInsights(aiResponse.insights);
        setLastAnalysis(new Date());
      }
    } catch (error) {
      console.error("Error generating AI insights:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    generateInsights();
  }, []);

  const getInsightIcon = (type) => {
    switch (type) {
      case 'sales': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'inventory': return <Target className="w-5 h-5 text-blue-500" />;
      case 'pricing': return <Brain className="w-5 h-5 text-purple-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Business Intelligence
          </CardTitle>
          <div className="flex justify-between items-center">
            <p className="text-gray-600">AI-powered insights and recommendations for your business</p>
            <Button onClick={generateInsights} disabled={isLoading}>
              {isLoading ? 'Analyzing...' : 'Refresh Insights'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {lastAnalysis && (
        <p className="text-sm text-gray-500">
          Last analysis: {lastAnalysis.toLocaleString()}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getInsightIcon(insight.type)}
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                </div>
                <Badge className={getPriorityColor(insight.priority)}>
                  {insight.priority} priority
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{insight.description}</p>
              <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm font-medium text-blue-900">Recommendation:</p>
                <p className="text-sm text-blue-800">{insight.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {insights.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No insights available</h3>
            <p className="text-gray-500 mb-4">Generate AI insights to see business recommendations</p>
            <Button onClick={generateInsights}>Generate Insights</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}