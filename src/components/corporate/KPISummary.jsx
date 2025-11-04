import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Fuel } from "lucide-react";

export default function KPISummary({ locations }) {
  // Ensure locations is an array and has default fallback
  const safeLocations = locations || [];
  
  // Calculate KPIs with safe defaults
  const totalLocations = safeLocations.length;
  
  // Mock calculations - replace with real data when available
  const totalRevenue = safeLocations.reduce((sum, location) => {
    return sum + (location?.revenue || 0);
  }, 0);
  
  const totalTransactions = safeLocations.reduce((sum, location) => {
    return sum + (location?.transactions || 0);
  }, 0);
  
  const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Locations</p>
              <p className="text-2xl font-bold">{totalLocations}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold">{totalTransactions.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Ticket</p>
              <p className="text-2xl font-bold">${averageTicket.toFixed(2)}</p>
            </div>
            <Fuel className="w-8 h-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}