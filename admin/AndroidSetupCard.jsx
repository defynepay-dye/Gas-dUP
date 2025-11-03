import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Download, Lock, Settings } from "lucide-react";
import { createPageUrl } from "../../utils";
import { Link } from "react-router-dom";

export default function AndroidSetupCard() {
  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-600" />
              Android APK Deployment
            </CardTitle>
            <CardDescription className="mt-1">
              Convert FuelFlow Pro to a native Android application
            </CardDescription>
          </div>
          <Badge className="bg-green-600">v1.6</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 text-center">
            <Download className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-xs font-semibold">Build APK</p>
            <p className="text-xs text-gray-500">Using Capacitor</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <Lock className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-xs font-semibold">Kiosk Mode</p>
            <p className="text-xs text-gray-500">Lock to POS only</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <Settings className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-xs font-semibold">MDM Deploy</p>
            <p className="text-xs text-gray-500">Manage remotely</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
          <h4 className="font-semibold text-sm mb-2">What You'll Get:</h4>
          <ul className="text-xs space-y-1 text-gray-700">
            <li>✓ Native Android app (no browser required)</li>
            <li>✓ Prevent web surfing with kiosk mode</li>
            <li>✓ Deploy to unlimited devices</li>
            <li>✓ Centralized updates via MDM</li>
            <li>✓ Step-by-step setup instructions</li>
          </ul>
        </div>

        <Link to={createPageUrl('CapacitorSetup')}>
          <Button className="w-full bg-green-600 hover:bg-green-700">
            <Smartphone className="w-4 h-4 mr-2" />
            View Setup Guide
          </Button>
        </Link>

        <p className="text-xs text-center text-gray-500">
          Phase 1: Zero disruption to existing web app
        </p>
      </CardContent>
    </Card>
  );
}