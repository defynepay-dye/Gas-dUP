import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Ticket, Check, AlertCircle, RefreshCw, TrendingUp, Shield, Zap } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

export default function LotteryIntegrationApp({ onInstall, isInstalled }) {
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({
    stateCode: '',
    apiKey: '',
    retailerId: '',
    autoSync: true,
    syncFrequency: 'daily',
    enableWinningNumbers: true,
    enableAutoReporting: true
  });

  const handleInstall = async () => {
    if (!config.stateCode || !config.apiKey || !config.retailerId) {
      alert('Please fill in all required configuration fields');
      return;
    }

    // Validate and install
    const installData = {
      app_id: 'state_lottery_integration',
      app_name: 'State Lottery Integration',
      config: config
    };

    onInstall(installData);
    setShowConfig(false);
  };

  return (
    <Card className={isInstalled ? "border-green-500 bg-green-50" : ""}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                State Lottery Integration
                {isInstalled && <Badge className="bg-green-600">Installed</Badge>}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Automated game updates, winning numbers, and state reporting
              </p>
            </div>
          </div>
          <Badge className="bg-blue-600 text-white">Premium</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Auto Game Updates</p>
              <p className="text-xs text-gray-500">New SKUs added automatically</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Real-Time Sync</p>
              <p className="text-xs text-gray-500">Prices & inventory updated daily</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Winning Numbers Display</p>
              <p className="text-xs text-gray-500">AI-generated customer engagement</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">State Reporting</p>
              <p className="text-xs text-gray-500">Automated compliance reports</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-gray-900">Boost Lottery Sales by 30%+</p>
              <p className="text-xs text-gray-600 mt-1">
                Automated winning number displays and real-time game updates drive impulse purchases
              </p>
            </div>
          </div>
        </div>

        {!showConfig && !isInstalled && (
          <Button className="w-full" onClick={() => setShowConfig(true)}>
            Configure & Install
          </Button>
        )}

        {!showConfig && isInstalled && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfig(true)}>
              Reconfigure
            </Button>
            <Button variant="destructive" className="flex-1">
              Uninstall
            </Button>
          </div>
        )}

        {showConfig && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold">Configuration</h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="stateCode">State Code *</Label>
                <Input
                  id="stateCode"
                  placeholder="e.g., TX, CA, NY"
                  value={config.stateCode}
                  onChange={(e) => setConfig({...config, stateCode: e.target.value.toUpperCase()})}
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="retailerId">Retailer ID *</Label>
                <Input
                  id="retailerId"
                  placeholder="Your state-issued retailer ID"
                  value={config.retailerId}
                  onChange={(e) => setConfig({...config, retailerId: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="apiKey">State Lottery API Key *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your API key"
                  value={config.apiKey}
                  onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Obtain from your state lottery commission
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoSync">Auto-Sync Games Daily</Label>
                  <Switch
                    id="autoSync"
                    checked={config.autoSync}
                    onCheckedChange={(checked) => setConfig({...config, autoSync: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enableWinningNumbers">Show Winning Numbers on Display</Label>
                  <Switch
                    id="enableWinningNumbers"
                    checked={config.enableWinningNumbers}
                    onCheckedChange={(checked) => setConfig({...config, enableWinningNumbers: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enableAutoReporting">Automated State Reporting</Label>
                  <Switch
                    id="enableAutoReporting"
                    checked={config.enableAutoReporting}
                    onCheckedChange={(checked) => setConfig({...config, enableAutoReporting: checked})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfig(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleInstall}>
                {isInstalled ? 'Save Changes' : 'Install Now'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}