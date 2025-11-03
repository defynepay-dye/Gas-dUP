
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Receipt, 
  Fuel, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  Activity,
  Database
} from "lucide-react";
import { format } from "date-fns";

export default function RealTimeMetrics({ data, systemStatus, isLoading }) {
  const metrics = [
    {
      title: "Today's Sales",
      value: `$${data.currentSales.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Transactions",
      value: data.transactionCount.toString(),
      icon: Receipt,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Active Pumps",
      value: `${data.activePumps}/8`,
      icon: Fuel,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Avg Transaction",
      value: `$${data.avgTransactionValue.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Fuel Gallons",
      value: data.fuelGallonsSold.toFixed(1),
      icon: Fuel,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Inventory Alerts",
      value: data.inventoryAlerts.toString(),
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* System Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">System Online</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Last Sync: {format(data.lastSync, 'HH:mm:ss')}</span>
              </div>
              <Badge variant={systemStatus.syncStatus === 'synced' ? 'default' : 'destructive'}>
                AWS {systemStatus.syncStatus.toUpperCase()}
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              Auto-sync every 2 minutes
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className={`flex items-center gap-3 ${metric.bgColor} p-3 rounded-lg`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
                <div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-sm text-gray-600">{metric.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights */}
      {systemStatus.insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              AI Business Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Sales Trends</h4>
                <p className="text-sm text-gray-600">{systemStatus.insights.sales_trend}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Revenue Forecast</h4>
                <p className="text-sm text-gray-600">{systemStatus.insights.revenue_forecast}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Top Products</h4>
                <div className="flex flex-wrap gap-1">
                  {systemStatus.insights.top_performing_products?.map((product, i) => (
                    <Badge key={i} variant="secondary">{product}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Action Items</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {systemStatus.insights.alerts?.map((alert, i) => (
                    <li key={i}>• {alert}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
