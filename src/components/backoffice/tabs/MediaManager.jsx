
import React, { useState, useEffect } from 'react';
import { CustomerDisplay } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutTemplate, Film, Clapperboard, StopCircle, Monitor, MapPin } from 'lucide-react'; // Added Monitor and MapPin icon
import CampaignCard from '../../media/CampaignCard';
import MediaLibrary from '../../media/MediaLibrary';
import TemplateBrowser from '../../media/TemplateBrowser';
import CampaignEditor from '../../media/CampaignEditor';
import { Alert, AlertDescription } from '@/components/ui/alert'; // Added Alert components

// Placeholder for the ExternalChannelsTab component
// In a real application, this would likely be in its own file: ./external/ExternalChannelsTab.jsx
const ExternalChannelsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>External Channels</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Manage integrations with external display channels here.</p>
        {/* Further implementation for external channels will go here */}
        <div className="mt-4 p-4 border rounded-md bg-gray-50 text-gray-700">
          <p className="font-semibold">Coming Soon:</p>
          <ul className="list-disc pl-5">
            <li>Integration with various smart display platforms.</li>
            <li>Configuration for third-party digital signage providers.</li>
            <li>Real-time status and control of external screens.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};


export default function MediaManager({ currentScope }) {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCampaign, setEditingCampaign] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, [currentScope]);

  const loadCampaigns = async () => {
    setIsLoading(true);
    try {
      let data;
      
      // Filter by currentScope
      if (currentScope?.type === 'location' && currentScope?.id) {
        // Fetch campaigns specific to this location OR global campaigns (location_id === null)
        const allCampaigns = await CustomerDisplay.list();
        data = allCampaigns.filter(c => 
          c.location_id === currentScope.id || c.location_id === null
        );
      } else if (currentScope?.type === 'region' && currentScope?.id) {
        const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
        const regionLocationIds = locationsData
          .filter(loc => loc.region_id === currentScope.id)
          .map(loc => loc.id);
        
        const allCampaigns = await CustomerDisplay.list();
        data = allCampaigns.filter(c => 
          c.location_id === null || regionLocationIds.includes(c.location_id)
        );
      } else {
        // Default to loading all campaigns if no specific scope or a global scope
        data = await CustomerDisplay.list();
      }
      
      setCampaigns(data || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      setCampaigns([]);
    }
    setIsLoading(false);
  };
  
  const createNewCampaign = async () => {
    const newCampaign = await CustomerDisplay.create({
      display_name: 'Untitled Campaign',
      media_items: [],
      rotation_enabled: true,
      default_duration: 15,
      active: false,
      location_id: currentScope?.type === 'location' ? currentScope.id : null
    });
    loadCampaigns();
    setEditingCampaign(newCampaign);
  };

  const handlePlayCampaign = async (campaignId) => {
    setIsLoading(true);
    await Promise.all(
      campaigns.map(c => 
        CustomerDisplay.update(c.id, { active: c.id === campaignId })
      )
    );
    loadCampaigns();
  };

  const handleStopCampaign = async (campaignId) => {
    setIsLoading(true);
    await CustomerDisplay.update(campaignId, { active: false });
    loadCampaigns();
  };
  
  const handleStopAll = async () => {
    setIsLoading(true);
    await Promise.all(
      campaigns.map(c => CustomerDisplay.update(c.id, { active: false }))
    );
    loadCampaigns();
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    await CustomerDisplay.delete(campaignId);
    loadCampaigns();
  };
  
  const handleSaveCampaign = async (campaignData) => {
    try {
      // Check if this is an existing campaign (has an id) or a new one
      if (campaignData.id) {
        await CustomerDisplay.update(campaignData.id, {
          display_name: campaignData.display_name,
          media_items: campaignData.media_items,
          rotation_enabled: campaignData.rotation_enabled,
          default_duration: campaignData.default_duration,
          active: campaignData.active,
          location_id: campaignData.location_id // Ensure location_id is preserved on update
        });
      } else {
        // This shouldn't happen since we create first, but handle it just in case
        await CustomerDisplay.create({
          display_name: campaignData.display_name,
          media_items: campaignData.media_items,
          rotation_enabled: campaignData.rotation_enabled,
          default_duration: campaignData.default_duration,
          active: campaignData.active,
          location_id: campaignData.location_id
        });
      }
      setEditingCampaign(null);
      loadCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert(`Failed to save campaign: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Location Context Indicator */}
      {currentScope && (currentScope.type === 'location' || currentScope.type === 'region') && (
        <Alert className="bg-blue-50 border-blue-200">
          <MapPin className="w-4 h-4 text-blue-600" />
          <AlertDescription>
            <strong>Viewing media campaigns for:</strong> {currentScope.label}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Media Manager</h2>
          <p className="text-gray-600 mt-1">Central command for all customer-facing media and displays</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={handleStopAll} variant="outline">
                <StopCircle className="w-4 h-4 mr-2" />
                Stop All
            </Button>
            <Button onClick={createNewCampaign}>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
        </div>
      </div>
      
      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="campaigns"><Clapperboard className="w-4 h-4 mr-2" />Campaigns</TabsTrigger>
          <TabsTrigger value="library"><Film className="w-4 h-4 mr-2" />Media Library</TabsTrigger>
          <TabsTrigger value="templates"><LayoutTemplate className="w-4 h-4 mr-2" />Templates</TabsTrigger>
          <TabsTrigger value="external">
            <Monitor className="w-4 h-4 mr-2" />
            External Channels
          </TabsTrigger>
        </TabsList>
        <TabsContent value="campaigns" className="mt-6">
            {isLoading ? <p>Loading campaigns...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {campaigns.map(campaign => (
                        <CampaignCard 
                            key={campaign.id}
                            campaign={campaign}
                            onPlay={handlePlayCampaign}
                            onStop={handleStopCampaign}
                            onEdit={setEditingCampaign}
                            onDelete={handleDeleteCampaign}
                            isLoading={isLoading}
                        />
                    ))}
                </div>
            )}
        </TabsContent>
        <TabsContent value="library" className="mt-6">
            <MediaLibrary />
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
            <TemplateBrowser />
        </TabsContent>
        <TabsContent value="external" className="mt-6">
          <ExternalChannelsTab />
        </TabsContent>
      </Tabs>
      
      {editingCampaign && (
        <CampaignEditor 
            campaign={editingCampaign}
            onSave={handleSaveCampaign}
            onClose={() => setEditingCampaign(null)}
        />
      )}
    </div>
  );
}
