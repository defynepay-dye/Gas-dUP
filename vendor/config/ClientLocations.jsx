import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Wifi, WifiOff, Plus, Settings } from 'lucide-react';

export default function ClientLocations({ locations, lssConfigs, onAddLocation, onConfigureLSS }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Locations ({locations.length})</CardTitle>
          <Button size="sm" onClick={onAddLocation}>
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {locations.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No locations configured yet</p>
            <Button size="sm" onClick={onAddLocation}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Location
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map(location => {
              const lss = lssConfigs.find(lss => lss.location_id === location.id);
              const isOnline = lss?.health_status?.overall_status === 'healthy';
              
              return (
                <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isOnline ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {isOnline ? (
                        <Wifi className="w-5 h-5 text-green-600" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{location.location_name}</p>
                      <p className="text-sm text-gray-600">
                        {location.city}, {location.state}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onConfigureLSS(location)}
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      LSS Config
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}