import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Gift, Award, Calendar } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LoyaltyAnalyticsDashboard({ customers }) {
  // Calculate analytics
  const totalPoints = customers.reduce((sum, c) => sum + c.points_balance, 0);
  const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const avgSpend = customers.length > 0 ? totalSpent / customers.length : 0;
  const pointsValue = totalPoints * 0.01;

  // Tier distribution
  const tierData = [
    { name: 'Bronze', value: customers.filter(c => c.tier_status === 'bronze').length, color: '#f97316' },
    { name: 'Silver', value: customers.filter(c => c.tier_status === 'silver').length, color: '#9ca3af' },
    { name: 'Gold', value: customers.filter(c => c.tier_status === 'gold').length, color: '#eab308' },
    { name: 'Platinum', value: customers.filter(c => c.tier_status === 'platinum').length, color: '#a855f7' }
  ];

  // Top spenders
  const topSpenders = [...customers]
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 10)
    .map(c => ({
      name: c.profile?.full_name || c.customer_phone.slice(-4),
      spent: c.total_spent,
      points: c.points_balance
    }));

  // Engagement over time (simulated - would be real data in production)
  const engagementData = [
    { month: 'Jan', members: Math.floor(customers.length * 0.7), active: Math.floor(customers.length * 0.5) },
    { month: 'Feb', members: Math.floor(customers.length * 0.75), active: Math.floor(customers.length * 0.55) },
    { month: 'Mar', members: Math.floor(customers.length * 0.8), active: Math.floor(customers.length * 0.6) },
    { month: 'Apr', members: Math.floor(customers.length * 0.85), active: Math.floor(customers.length * 0.65) },
    { month: 'May', members: Math.floor(customers.length * 0.9), active: Math.floor(customers.length * 0.7) },
    { month: 'Jun', members: customers.length, active: Math.floor(customers.length * 0.75) }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-3xl font-bold">{customers.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Lifetime Value</p>
                <p className="text-3xl font-bold">${totalSpent.toFixed(0)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Customer Value</p>
                <p className="text-3xl font-bold">${avgSpend.toFixed(0)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Points Liability</p>
                <p className="text-3xl font-bold">${pointsValue.toFixed(0)}</p>
                <p className="text-xs text-gray-500">{totalPoints.toLocaleString()} points</p>
              </div>
              <Gift className="w-10 h-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="members" stroke="#8b5cf6" strokeWidth={2} name="Total Members" />
                <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} name="Active Members" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Spenders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 Customers by Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSpenders}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="spent" fill="#3b82f6" name="Total Spent ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}