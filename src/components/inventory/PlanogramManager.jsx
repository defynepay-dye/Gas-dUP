
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Location, StoreLayoutZone, Department } from '@/api/entities';
import { Map, Grid, Upload, ClipboardCheck, MapPin, AlertCircle } from 'lucide-react';
import LocationMapViewer from '../planogram/LocationMapViewer';
import AIFloorPlanGenerator from '../planogram/AIFloorPlanGenerator';
import PhysicalCountInterface from './PhysicalCountInterface';

export default function PlanogramManager() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [zones, setZones] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('map');
  const [showFloorPlanGenerator, setShowFloorPlanGenerator] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const locationsData = await Location.list();
      setLocations(locationsData);

      const departmentsData = await Department.list();
      setDepartments(departmentsData);

      if (locationsData.length > 0) {
        setSelectedLocation(locationsData[0]);
        await loadZonesForLocation(locationsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load planogram data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadZonesForLocation = async (locationId) => {
    try {
      const zonesData = await StoreLayoutZone.filter({ location_id: locationId });
      setZones(zonesData);
    } catch (error) {
      console.error('Failed to load zones:', error);
      setZones([]);
    }
  };

  const handleLocationChange = async (locationId) => {
    const location = locations.find(l => l.id === locationId);
    setSelectedLocation(location);
    if (location) {
      await loadZonesForLocation(location.id);
    }
  };

  const handleFloorPlanGenerated = async () => {
    setShowFloorPlanGenerator(false);
    if (selectedLocation) {
      await loadZonesForLocation(selectedLocation.id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Loading planogram manager...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Map className="w-6 h-6" />
            Visual Store Management & Planogram
          </CardTitle>
          <CardDescription className="text-white/80">
            AI-powered floor plans, zone mapping, and inventory organization
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Location Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">Select Location</Label>
              <Select
                value={selectedLocation?.id || ''}
                onValueChange={handleLocationChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.location_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedLocation && (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                {zones.length} zones configured
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedLocation ? (
        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="map">
              <Map className="w-4 h-4 mr-2" />
              Store Layout
            </TabsTrigger>
            <TabsTrigger value="planogram">
              <Grid className="w-4 h-4 mr-2" />
              Planogram
            </TabsTrigger>
            <TabsTrigger value="count">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Physical Count
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-4">
            <div className="space-y-4">
              {zones.length === 0 ? (
                <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
                  <CardContent className="p-8 text-center">
                    <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Floor Plan Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Upload photos of your store to generate an AI-powered floor plan
                    </p>
                    <Button onClick={() => setShowFloorPlanGenerator(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Generate Floor Plan
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <LocationMapViewer
                  locationId={selectedLocation.id}
                  zones={zones}
                  departments={departments}
                  onZonesUpdated={() => loadZonesForLocation(selectedLocation.id)}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="planogram" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Planogram Management</CardTitle>
                <CardDescription>Configure product placement and shelf layouts</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Planogram features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="count" className="mt-4">
            <PhysicalCountInterface 
              locationId={selectedLocation.id}
              onClose={() => setActiveView('map')}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="border-2 border-yellow-300 bg-yellow-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Locations Found</h3>
            <p className="text-gray-600">
              Please create a location in the Location Manager before configuring planograms.
            </p>
          </CardContent>
        </Card>
      )}

      {showFloorPlanGenerator && (
        <AIFloorPlanGenerator
          locationId={selectedLocation.id}
          onClose={() => setShowFloorPlanGenerator(false)}
          onComplete={handleFloorPlanGenerated}
        />
      )}
    </div>
  );
}
