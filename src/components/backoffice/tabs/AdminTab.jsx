import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Cog, Ban, Package, XCircle } from "lucide-react";
import SystemSetup from '../../admin/SystemSetup';
import POSConfiguration from '../../admin/POSConfiguration';
import ComplianceManager from '../../admin/ComplianceManager';
import QuickItemsManager from '../../admin/QuickItemsManager';
import CancellationReasonsManager from '../../admin/CancellationReasonsManager';

export default function AdminTab({ currentScope }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">System & Store Configuration</h2>
        <p className="text-gray-600">Manage core system settings, POS appearance, and compliance rules.</p>
      </div>

      <Tabs defaultValue="pos">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="system"><Settings className="w-4 h-4 mr-2" /> System Setup</TabsTrigger>
          <TabsTrigger value="pos"><Cog className="w-4 h-4 mr-2" /> POS Configuration</TabsTrigger>
          <TabsTrigger value="quick_items"><Package className="w-4 h-4 mr-2" /> Quick Items</TabsTrigger>
          <TabsTrigger value="compliance"><Ban className="w-4 h-4 mr-2" /> Compliance</TabsTrigger>
          <TabsTrigger value="cancellation"><XCircle className="w-4 h-4 mr-2" /> Cancellations</TabsTrigger>
        </TabsList>
        <TabsContent value="system" className="mt-4">
          <SystemSetup currentScope={currentScope} />
        </TabsContent>
        <TabsContent value="pos" className="mt-4">
          <POSConfiguration />
        </TabsContent>
        <TabsContent value="quick_items" className="mt-4">
          <QuickItemsManager />
        </TabsContent>
        <TabsContent value="compliance" className="mt-4">
          <ComplianceManager currentScope={currentScope} />
        </TabsContent>
        <TabsContent value="cancellation" className="mt-4">
          <CancellationReasonsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}