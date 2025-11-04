import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, FileText, TrendingUp, Package, BarChart3 } from "lucide-react";

import AIInventoryDashboard from "../components/ai/AIInventoryDashboard";
import InvoiceAuditDashboard from "../components/ai/InvoiceAuditDashboard";

export default function AIIntelligencePage() {
  const [selectedLocation, setSelectedLocation] = useState(null);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            AI Intelligence Hub
          </h1>
          <p className="text-gray-500 mt-1">Enterprise AI-powered retail intelligence and automation</p>
        </div>

        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Inventory AI
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoice Auditing
            </TabsTrigger>
            <TabsTrigger value="profitability" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Profitability AI
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Predictive Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <AIInventoryDashboard locationId={selectedLocation} />
          </TabsContent>

          <TabsContent value="invoices">
            <InvoiceAuditDashboard locationId={selectedLocation} />
          </TabsContent>

          <TabsContent value="profitability">
            <div className="text-center py-16 text-gray-500">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-semibold mb-2">AI Profitability Analysis</h3>
              <p>Coming Soon - Real-time profit margin analysis and optimization</p>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-16 text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-semibold mb-2">Predictive Analytics</h3>
              <p>Coming Soon - Advanced forecasting and trend analysis</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}