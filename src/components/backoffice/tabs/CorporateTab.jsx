import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Activity, Zap } from 'lucide-react';
import NetworkMonitoringDashboard from '../../corporate/NetworkMonitoringDashboard';

export default function CorporateTab() {
  // For demo purposes - in production, check if user has premium access
  const hasPremiumAccess = true;

  if (!hasPremiumAccess) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[600px]">
        <Card className="max-w-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Enterprise Network Monitoring</h2>
            <p className="text-lg text-gray-600 mb-6">
              Get real-time visibility into your entire infrastructure across all locations.
              Monitor CRIND, Technotrade PTS2, routers, and every network device in one command center.
            </p>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-3xl font-bold text-blue-600">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime SLA</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">$50K+</div>
                  <div className="text-sm text-gray-600">Avg. Annual Savings</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">15min</div>
                  <div className="text-sm text-gray-600">Faster Resolution</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">AI-Powered Predictive Maintenance Included</span>
              </div>
            </div>
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold">Prevent Downtime Before It Happens</div>
                  <div className="text-sm text-gray-600">AI predicts device failures 72 hours in advance</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold">Real-Time Multi-Location Dashboard</div>
                  <div className="text-sm text-gray-600">Monitor 100+ locations from one screen</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <div className="font-semibold">Instant Critical Alerts</div>
                  <div className="text-sm text-gray-600">SMS, email, and mobile push notifications</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Badge className="text-2xl px-6 py-2">$199-499/mo per location</Badge>
            </div>
            <Button className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6">
              Contact Sales for Enterprise Demo
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              30-day free trial • No credit card required • Cancel anytime
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <NetworkMonitoringDashboard />;
}