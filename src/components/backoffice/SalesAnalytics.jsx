import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign } from "lucide-react";

export default function SalesAnalytics({ salesData, insights, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Sales Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p>Loading sales data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSales = salesData.reduce((sum, item) => sum + item.amount, 0);
  const averageDaily = salesData.length > 0 ? totalSales / salesData.length : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Sales Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <DollarSign className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-900">${totalSales.toFixed(2)}</p>
            <p className="text-sm text-blue-600">Total Sales</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <TrendingUp className="w-6 h-6 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-900">${averageDaily.toFixed(2)}</p>
            <p className="text-sm text-green-600">Daily Average</p>
          </div>
        </div>
        
        <div className="h-48">
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No sales data available</p>
            </div>
          )}
        </div>

        {insights && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">AI Insights</h4>
            <p className="text-sm text-gray-600">{insights.sales_trend || "Sales data is being analyzed..."}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}