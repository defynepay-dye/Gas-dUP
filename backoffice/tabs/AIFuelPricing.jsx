
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, ArrowUp, ArrowDown, History, Check, X, Clock, Calendar } from "lucide-react";
import { AIFuelPriceRecommendation, Product } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { format } from "date-fns";
import SchedulePriceChangeModal from '../SchedulePriceChangeModal';

const PriceChangeDisplay = ({ current, recommended }) => {
  const diff = recommended - current;
  const Icon = diff > 0 ? ArrowUp : ArrowDown;
  const color = diff > 0 ? "text-red-500" : "text-green-500";

  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 line-through">${current.toFixed(3)}</span>
      <span className="font-bold text-lg">${recommended.toFixed(3)}</span>
      <span className={`flex items-center text-sm font-semibold ${color}`}>
        <Icon className="w-4 h-4" />
        {Math.abs(diff).toFixed(3)}
      </span>
    </div>
  );
};

export default function AIFuelPricing() {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [automationEnabled, setAutomationEnabled] = useState(false);

  useEffect(() => {
    fetchLatestRecommendations();
  }, []);

  const fetchLatestRecommendations = async () => {
    setIsLoading(true);
    try {
      const data = await AIFuelPriceRecommendation.list("-created_date", 5);
      setRecommendations(data);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    }
    setIsLoading(false);
  };

  const generateRecommendations = async () => {
    setIsLoading(true);
    try {
      const fuelProducts = await Product.list();
      const currentPrices = fuelProducts.map(p => ({ grade: p.product_name, price: p.self_service_cash_price }));

      const prompt = `
        Act as an expert fuel pricing analyst for a US convenience store. Your goal is to maximize profit margins while remaining competitive.
        Given the current fuel prices: ${JSON.stringify(currentPrices)}.
        1.  Access real-time public internet data to find current prices for regular, midgrade, and premium gasoline from at least 3 nearby competitors (like Shell, BP, Exxon, 7-Eleven) using sources like Google Maps and GasBuddy.
        2.  Find the latest WTI crude oil price trends and any wholesale gasoline price index information (simulating OPIS data).
        3.  Based on this comprehensive data, recommend new retail prices per gallon for each fuel grade (regular, midgrade, premium, diesel).
        4.  Provide a clear, concise "reasoning" for your pricing strategy.
        5.  Provide a confidence score from 0 to 1.
        6.  Estimate the daily profit impact of these changes.
        7.  Format the entire output as a single JSON object matching this exact schema, with no extra text or explanations:
        ${JSON.stringify({
          recommendations: [{ product_code: "regular", product_name: "Regular Unleaded", current_price: 0, recommended_price: 0, projected_margin_impact_daily: 0 }],
          competitor_analysis: [{ name: "Competitor Name", distance: "0.5 miles", prices: { regular: 0, midgrade: 0, premium: 0 } }],
          market_trends: ["Market Trend 1", "Market Trend 2"],
          reasoning: "Your detailed reasoning here.",
          confidence_score: 0.95
        })}
      `;

      const aiResponse = await InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: { type: "object", properties: {} } // Let the prompt define the schema
      });
      
      if(aiResponse) {
        await AIFuelPriceRecommendation.create({ ...aiResponse, status: "pending_review" });
        fetchLatestRecommendations();
      }

    } catch (error) {
      console.error("Failed to generate AI recommendations:", error);
    }
    setIsLoading(false);
  };
  
  const handleRecommendationAction = async (id, status) => {
    await AIFuelPriceRecommendation.update(id, { status });
    fetchLatestRecommendations();
  };

  const handleSchedule = (recommendation) => {
    setSelectedRecommendation(recommendation);
    setIsScheduling(true);
  };
  
  const handleConfirmSchedule = async (id, scheduleTime) => {
    await AIFuelPriceRecommendation.update(id, { status: 'scheduled', scheduled_change_time: scheduleTime.toISOString() });
    setIsScheduling(false);
    setSelectedRecommendation(null);
    fetchLatestRecommendations();
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Fuel Pricing Strategy</CardTitle>
          <CardDescription>Generate and manage AI-powered fuel price recommendations to optimize margins based on real-time market data.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Button onClick={generateRecommendations} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
            Generate New Recommendations
          </Button>
          <div className="flex items-center space-x-2">
            <Switch id="automation-mode" checked={automationEnabled} onCheckedChange={setAutomationEnabled} />
            <Label htmlFor="automation-mode">Enable Full Automation</Label>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2"><History className="w-5 h-5" /> Recent Recommendations</h2>
        {recommendations.map(rec => (
          <Card key={rec.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between bg-gray-50/50">
              <div>
                <CardTitle className="text-lg">Recommendation - {format(new Date(rec.created_date), 'PPpp')}</CardTitle>
                <CardDescription>Confidence: {(rec.confidence_score * 100).toFixed(0)}%</CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={rec.status === 'pending_review' ? 'default' : 'secondary'} className="capitalize">{rec.status.replace('_', ' ')}</Badge>
                {rec.status === 'scheduled' && (
                   <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3"/> {format(new Date(rec.scheduled_change_time), 'PPp')}</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-medium">Price Changes</h4>
                <div className="space-y-3">
                  {rec.recommendations.map(p => (
                    <div key={p.product_code} className="flex justify-between items-center p-3 border rounded-lg">
                      <span className="font-semibold">{p.product_name}</span>
                      <PriceChangeDisplay current={p.current_price} recommended={p.recommended_price} />
                    </div>
                  ))}
                </div>
                <h4 className="font-medium">AI Reasoning</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{rec.reasoning}</p>
              </div>
              <div className="space-y-4">
                 <h4 className="font-medium">Competitor Prices</h4>
                 <div className="text-xs space-y-2">
                    {rec.competitor_analysis?.map((comp, i) => (
                      <div key={i} className="p-2 border rounded">
                        <div className="font-bold">{comp.name} ({comp.distance})</div>
                        <div>Reg: ${comp.prices.regular?.toFixed(3)} | Prem: ${comp.prices.premium?.toFixed(3)}</div>
                      </div>
                    ))}
                 </div>
                 <h4 className="font-medium">Market Trends</h4>
                 <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                    {rec.market_trends?.map((trend, i) => <li key={i}>{trend}</li>)}
                 </ul>
              </div>
            </CardContent>
            {rec.status === 'pending_review' && (
              <CardFooter className="bg-gray-50/50 p-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleRecommendationAction(rec.id, 'rejected')}><X className="w-4 h-4 mr-1"/> Reject</Button>
                <Button variant="outline" size="sm" onClick={() => handleSchedule(rec)}><Clock className="w-4 h-4 mr-1"/> Schedule</Button>
                <Button size="sm" onClick={() => handleRecommendationAction(rec.id, 'approved')}><Check className="w-4 h-4 mr-1"/> Approve & Apply Now</Button>
              </CardFooter>
            )}
          </Card>
        ))}
        {recommendations.length === 0 && !isLoading && <p>No recommendations found. Generate one to get started.</p>}
      </div>

      {isScheduling && selectedRecommendation && (
        <SchedulePriceChangeModal
          recommendation={selectedRecommendation}
          onClose={() => setIsScheduling(false)}
          onConfirm={handleConfirmSchedule}
        />
      )}
    </div>
  );
}
