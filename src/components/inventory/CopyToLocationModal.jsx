
import React, { useState, useEffect } from 'react';
import { InventoryItem, Location } from '@/api/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, MapPin } from 'lucide-react';

export default function CopyToLocationModal({ item, onComplete, onClose }) {
  const [locations, setLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [isCopying, setIsCopying] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const loadLocations = async () => {
    try {
      const locationData = await Location.filter({ is_active: true });
      // Filter out the current location
      const otherLocations = locationData.filter(loc => loc.id !== item.location_id);
      setLocations(otherLocations);
    } catch (error) {
      console.error('Failed to load locations:', error);
      setLocations([]);
    }
  };

  useEffect(() => {
    loadLocations();
  }, [item]); // Added 'item' to the dependency array to fix the warning.

  const handleLocationToggle = (locationId) => {
    if (selectedLocations.includes(locationId)) {
      setSelectedLocations(selectedLocations.filter(id => id !== locationId));
    } else {
      setSelectedLocations([...selectedLocations, locationId]);
    }
  };

  const handleCopy = async () => {
    if (selectedLocations.length === 0) {
      setCopyMessage('Please select at least one location');
      return;
    }

    setIsCopying(true);
    setCopyMessage('');

    try {
      const copiedItems = [];

      for (const locationId of selectedLocations) {
        const newItem = {
          product_name: item.product_name,
          upc_code: item.upc_code,
          category: item.category,
          brand: item.brand,
          manufacturer: item.manufacturer,
          cash_price: item.cash_price,
          reorder_level: item.reorder_level,
          active: item.active,
          location_id: locationId,
          inventory_tracking: {
            quantity_on_hand_singles: 0, // Start with zero inventory at new location
            cost_method: item.inventory_tracking?.cost_method || 'weighted_average',
            weighted_average_cost: item.inventory_tracking?.weighted_average_cost || 0
          }
        };

        const created = await InventoryItem.create(newItem);
        copiedItems.push(created);
      }

      setCopyMessage(`Successfully copied product to ${copiedItems.length} location(s)!`);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Failed to copy product:', error);
      setCopyMessage('Error copying product. Please try again.');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Copy Product to Other Locations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {copyMessage && (
            <Alert className={copyMessage.includes('Error') ? 'bg-red-50' : 'bg-green-50'}>
              <AlertDescription>{copyMessage}</AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-semibold">{item.product_name}</p>
            <p className="text-xs text-gray-600">UPC: {item.upc_code}</p>
            <p className="text-xs text-gray-600">Price: ${item.cash_price?.toFixed(2)}</p>
          </div>

          <div>
            <Label className="mb-3 block">Select Locations to Copy To:</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
              {locations.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No other locations available</p>
              ) : (
                locations.map(location => (
                  <div key={location.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`location-${location.id}`}
                      checked={selectedLocations.includes(location.id)}
                      onCheckedChange={() => handleLocationToggle(location.id)}
                    />
                    <label
                      htmlFor={`location-${location.id}`}
                      className="flex items-center gap-2 text-sm font-medium cursor-pointer flex-1"
                    >
                      <MapPin className="w-4 h-4 text-blue-600" />
                      {location.location_name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              The product will be copied with all details except quantity on hand (which will start at 0 for new locations).
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCopying}>
            Cancel
          </Button>
          <Button onClick={handleCopy} disabled={isCopying || locations.length === 0}>
            <Copy className="w-4 h-4 mr-2" />
            {isCopying ? 'Copying...' : `Copy to ${selectedLocations.length} Location(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
