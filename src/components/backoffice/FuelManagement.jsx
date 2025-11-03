import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Fuel, AlertTriangle, Droplets } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function FuelManagement({ fuelData, realTimeData, isLoading }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="w-5 h-5" />
            Fuel Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p>Loading fuel data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalGallons = fuelData.reduce((sum, item) => sum + item.gallons, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="w-5 h-5" />
          Fuel Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <Droplets className="w-6 h-6 mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold text-orange-900">{totalGallons.toFixed(1)}</p>
            <p className="text-sm text-orange-600">Gallons Sold Today</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 mx-auto text-red-600 mb-2" />
            <p className="text-2xl font-bold text-red-900">{realTimeData?.fuelGallonsSold || 0}</p>
            <p className="text-sm text-red-600">Total Today</p>
          </div>
        </div>
        
        <div className="h-48">
          {fuelData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fuelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ product, percent }) => `${product} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="gallons"
                >
                  {fuelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} gal`, 'Gallons']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No fuel data available</p>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {fuelData.map((item, index) => (
            <div key={item.product} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="capitalize">{item.product}</span>
              </div>
              <span className="font-medium">{item.gallons.toFixed(1)} gal</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}