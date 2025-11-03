import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Location, Region } from "@/api/entities";
import { Plus, Edit, Trash2, MapPin, Building2, Loader2, Settings } from "lucide-react";
import LocationSetupWizard from "./LocationSetupWizard";

export default function SystemSetup({ currentScope }) {
  const [locations, setLocations] = useState([]);
  const [regions, setRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [locationsData, regionsData] = await Promise.all([
        Location.list(),
        Region.list().catch(() => [])
      ]);
      setLocations(locationsData);
      setRegions(regionsData);
    } catch (error) {
      console.error("Failed to load locations/regions:", error);
    }
    setIsLoading(false);
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    setEditingLocation(null);
    loadData();
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setShowWizard(true);
  };

  const handleDeleteLocation = async (locationId) => {
    if (!confirm("Are you sure you want to delete this location? This will also delete all associated data (pumps, tanks, terminals, etc.). This action cannot be undone.")) {
      return;
    }

    try {
      await Location.delete(locationId);
      alert("Location deleted successfully!");
      loadData();
      
      const updatedLocations = await Location.list();
      sessionStorage.setItem('app_locations', JSON.stringify(updatedLocations));
    } catch (error) {
      console.error("Failed to delete location:", error);
      alert("Failed to delete location. It may be in use by other records.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3">Loading system configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Settings className="w-4 h-4" />
        <AlertDescription>
          Configure your enterprise locations, regions, and initial settings. Use the comprehensive setup wizard to configure all aspects of a new location including taxes, pricing, tanks, pumps, and terminals.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Locations</CardTitle>
              <CardDescription>Manage your store locations and their complete configuration</CardDescription>
            </div>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No locations configured yet.</p>
              <p className="text-sm">Click "Add New Location" to set up your first store.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map(location => {
                const region = regions.find(r => r.id === location.region_id);
                return (
                  <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-semibold">{location.location_name}</div>
                        <div className="text-sm text-gray-600">
                          {location.address && `${location.address}, `}
                          {location.city && `${location.city}, `}
                          {location.state} {location.zip_code}
                        </div>
                        {region && (
                          <div className="text-xs text-gray-500 mt-1">
                            Region: {region.region_name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditLocation(location)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteLocation(location.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showWizard && (
        <LocationSetupWizard
          editingLocation={editingLocation}
          onComplete={handleWizardComplete}
          onCancel={() => {
            setShowWizard(false);
            setEditingLocation(null);
          }}
        />
      )}
    </div>
  );
}