
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Percent, Settings, MapPin } from 'lucide-react';
import TenderConfigurationManager from './TenderConfigurationManager';
import MultiTierTaxManager from './MultiTierTaxManager';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Assume POSTerminal is an API utility for interacting with terminal data
// This import path is a placeholder and should be adjusted to your project structure
// Example: import POSTerminal from '@/lib/api/posterminal';
// For demonstration, a mock implementation is used here. In a real application, remove this mock.
const mockTerminals = [
  { id: 'term1', name: 'Main POS 01', location_id: 'loc1' },
  { id: 'term2', name: 'Main POS 02', location_id: 'loc1' },
  { id: 'term3', name: 'Kiosk 01', location_id: 'loc2' },
  { id: 'term4', name: 'Drive-Thru 01', location_id: 'loc3' },
  { id: 'term5', name: 'Main POS 03', location_id: 'loc2' },
];

const mockLocations = [
  { id: 'loc1', name: 'Downtown Store', region_id: 'reg1' },
  { id: 'loc2', name: 'Uptown Store', region_id: 'reg1' },
  { id: 'loc3', name: 'Warehouse Outlet', region_id: 'reg2' },
  { id: 'loc4', name: 'Suburb Kiosk', region_id: 'reg2' },
];

// Mock POSTerminal API service
const POSTerminal = {
  list: async () => {
    return new Promise(resolve => setTimeout(() => resolve(mockTerminals), 300));
  },
  filter: async (criteria) => {
    return new Promise(resolve => {
      setTimeout(() => {
        let filtered = mockTerminals;
        if (criteria.location_id) {
          filtered = filtered.filter(t => t.location_id === criteria.location_id);
        }
        resolve(filtered);
      }, 300);
    });
  }
};
// End Mock POSTerminal API service

export default function POSConfiguration({ currentScope }) {
  const [config, setConfig] = useState(null);
  const [terminals, setTerminals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Populate mock locations to sessionStorage for testing purposes,
    // in a real app, this would be set elsewhere.
    if (!sessionStorage.getItem('app_locations')) {
      sessionStorage.setItem('app_locations', JSON.stringify(mockLocations));
    }
    loadConfiguration();
  }, [currentScope]);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      let terminalsData;
      
      // Filter by currentScope
      if (currentScope?.type === 'location' && currentScope?.id) {
        terminalsData = await POSTerminal.filter({ location_id: currentScope.id });
      } else if (currentScope?.type === 'region' && currentScope?.id) {
        const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
        const regionLocationIds = locationsData
          .filter(loc => loc.region_id === currentScope.id)
          .map(loc => loc.id);
        
        const allTerminals = await POSTerminal.list();
        terminalsData = allTerminals.filter(t => regionLocationIds.includes(t.location_id));
      } else {
        // If no specific scope, load all terminals
        terminalsData = await POSTerminal.list();
      }
      
      setTerminals(terminalsData);
      
      // Load POS configuration settings (could be location-specific in the future)
      // This is mock data for now.
      setConfig({
        receipt_footer: "Thank you for your business!",
        auto_print_receipt: true,
        show_customer_display: true,
        sound_enabled: true
      });
    } catch (error) {
      console.error("Failed to load POS configuration:", error);
      setTerminals([]); // Ensure terminals array is reset on error
      setConfig({ // Provide default config on error
        receipt_footer: "Thank you for your business!",
        auto_print_receipt: true,
        show_customer_display: true,
        sound_enabled: true
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">POS Configuration</h2>
        <p className="text-gray-600">Configure POS behavior, payment methods, and tax settings</p>
      </div>

      {/* Location Context Indicator */}
      {currentScope && (
        <Alert className="bg-blue-50 border-blue-200">
          <MapPin className="w-4 h-4 text-blue-600" />
          <AlertDescription>
            <strong>Configuring POS for:</strong> {currentScope.label}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="tenders">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tenders">
            <DollarSign className="w-4 h-4 mr-2" />
            Tender Types
          </TabsTrigger>
          <TabsTrigger value="taxes">
            <Percent className="w-4 h-4 mr-2" />
            Multi-Tier Tax
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tenders" className="mt-4">
          <TenderConfigurationManager />
        </TabsContent>

        <TabsContent value="taxes" className="mt-4">
          <MultiTierTaxManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
