import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Receipt, TrendingUp, Fuel } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsOverview({ transactions = [], pumps = [], isLoading = false }) {
  // Calculate stats from the provided data
  const today = new Date().toDateString();
  const todaysTransactions = transactions.filter(t => 
    new Date(t.created_date).toDateString() === today && t.status === 'completed'
  );

  const stats = {
    todaysSales: todaysTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0),
    transactionCount: todaysTransactions.length,
    averageTransaction: todaysTransactions.length > 0 
      ? todaysTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0) / todaysTransactions.length 
      : 0,
    activePumps: pumps.filter(p => p.status === 'online').length
  };

  const statCards = [
    {
      title: "Today's Sales",
      value: `$${stats.todaysSales.toFixed(2)}`,
      icon: DollarSign,
      bgColor: "bg-green-500",
      change: "+12% from yesterday"
    },
    {
      title: "Transactions",
      value: stats.transactionCount.toString(),
      icon: Receipt,
      bgColor: "bg-blue-500",
      change: `Avg: $${stats.averageTransaction.toFixed(2)}`
    },
    {
      title: "Active Pumps",
      value: `${stats.activePumps}/${pumps.length}`,
      icon: Fuel,
      bgColor: "bg-purple-500",
      change: "All systems operational"
    },
    {
      title: "Hourly Rate",
      value: `$${(stats.todaysSales / Math.max(1, new Date().getHours() || 1)).toFixed(0)}/hr`,
      icon: TrendingUp,
      bgColor: "bg-orange-500",
      change: "Current pace"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={stat.title} className="relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${stat.bgColor} rounded-full opacity-10`} />
          <CardHeader className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <CardTitle className="text-2xl md:text-3xl font-bold mt-2">
                  {isLoading ? <Skeleton className="h-8 w-24" /> : stat.value}
                </CardTitle>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor} bg-opacity-20`}>
                <stat.icon className={`w-5 h-5 ${stat.bgColor.replace('bg-', 'text-')}`} />
              </div>
            </div>
            {!isLoading && (
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                <span className="text-green-500 font-medium">{stat.change}</span>
              </div>
            )}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}