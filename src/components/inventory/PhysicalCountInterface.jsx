import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { PhysicalCountSession, InventoryItem, StoreLayoutZone } from '@/api/entities';
import { base44 } from '@/api/base44Client';
import { 
  ClipboardCheck, MapPin, Package, AlertTriangle, CheckCircle, 
  TrendingUp, TrendingDown, Play, Pause, Save, X, Eye, Scan,
  ChevronRight, List, BarChart3, FileText
} from 'lucide-react';

export default function PhysicalCountInterface({ locationId, onClose }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [zones, setZones] = useState([]);
  const [currentZone, setCurrentZone] = useState(null);
  const [zoneItems, setZoneItems] = useState([]);
  const [countProgress, setCountProgress] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('setup');
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');

  // Session setup state
  const [sessionName, setSessionName] = useState('');
  const [countType, setCountType] = useState('full_store');
  const [selectedZones, setSelectedZones] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, [locationId]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      // Load zones for this location
      const zonesData = await StoreLayoutZone.filter({ location_id: locationId });
      setZones(zonesData);

      // Check for existing in-progress session
      const sessions = await PhysicalCountSession.filter({ 
        location_id: locationId, 
        status: 'in_progress' 
      });
      
      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        setActiveSession(session);
        setActiveTab('counting');
        loadSessionProgress(session);
      } else {
        setSessionName(`Count ${new Date().toLocaleDateString()}`);
        setSelectedZones(zonesData.map(z => z.id));
      }
    } catch (error) {
      console.error('Failed to load counting data:', error);
      alert('Failed to load counting data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionProgress = (session) => {
    const progress = {};
    session.zones_to_count.forEach(zoneId => {
      const zoneCounted = session.zones_completed.includes(zoneId);
      progress[zoneId] = zoneCounted ? 'completed' : 'pending';
    });
    setCountProgress(progress);
  };

  const handleStartSession = async () => {
    if (!sessionName) {
      alert('Please enter a session name');
      return;
    }

    if (selectedZones.length === 0) {
      alert('Please select at least one zone to count');
      return;
    }

    try {
      const newSession = await PhysicalCountSession.create({
        location_id: locationId,
        session_name: sessionName,
        started_by: currentUser.full_name,
        started_by_id: currentUser.id,
        start_time: new Date().toISOString(),
        status: 'in_progress',
        count_type: countType,
        zones_to_count: selectedZones,
        zones_completed: [],
        items_counted: [],
        total_items_expected: 0,
        total_items_counted: 0,
        total_variance_items: 0,
        total_variance_value: 0
      });

      setActiveSession(newSession);
      setActiveTab('counting');
      
      const progress = {};
      selectedZones.forEach(zoneId => {
        progress[zoneId] = 'pending';
      });
      setCountProgress(progress);
    } catch (error) {
      console.error('Failed to start counting session:', error);
      alert('Failed to start counting session. Please try again.');
    }
  };

  const handleSelectZone = async (zone) => {
    setCurrentZone(zone);
    setIsLoading(true);
    
    try {
      // Load all items in this zone
      const items = await InventoryItem.filter({ 
        location_id: locationId,
        store_layout_zone_id: zone.id
      });
      
      // Add count data from active session if exists
      const itemsWithCounts = items.map(item => {
        const existingCount = activeSession.items_counted.find(c => c.inventory_item_id === item.id);
        return {
          ...item,
          physical_count: existingCount?.physical_count || null,
          counted: existingCount ? true : false,
          variance: existingCount?.variance || null
        };
      });
      
      setZoneItems(itemsWithCounts);
    } catch (error) {
      console.error('Failed to load zone items:', error);
      alert('Failed to load zone items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountItem = async (item, count) => {
    const physicalCount = parseInt(count);
    if (isNaN(physicalCount) || physicalCount < 0) {
      alert('Please enter a valid count');
      return;
    }

    const systemQuantity = item.inventory_tracking?.quantity_on_hand_singles || 0;
    const variance = physicalCount - systemQuantity;
    const varianceValue = variance * (item.inventory_tracking?.weighted_average_cost || 0);

    try {
      // Update session with this count
      const updatedItemsCounted = [...(activeSession.items_counted || [])];
      const existingIndex = updatedItemsCounted.findIndex(c => c.inventory_item_id === item.id);

      const countRecord = {
        inventory_item_id: item.id,
        zone_id: currentZone.id,
        product_name: item.product_name,
        upc_code: item.upc_code,
        system_quantity: systemQuantity,
        physical_count: physicalCount,
        variance: variance,
        variance_value: varianceValue,
        counted_by: currentUser.full_name,
        counted_at: new Date().toISOString(),
        notes: '',
        verified: false
      };

      if (existingIndex >= 0) {
        updatedItemsCounted[existingIndex] = countRecord;
      } else {
        updatedItemsCounted.push(countRecord);
      }

      // Calculate totals
      const totalVarianceValue = updatedItemsCounted.reduce((sum, c) => sum + (c.variance_value || 0), 0);
      const totalVarianceItems = updatedItemsCounted.filter(c => c.variance !== 0).length;

      await PhysicalCountSession.update(activeSession.id, {
        items_counted: updatedItemsCounted,
        total_items_counted: updatedItemsCounted.length,
        total_variance_items: totalVarianceItems,
        total_variance_value: totalVarianceValue
      });

      // Update local state
      setActiveSession({
        ...activeSession,
        items_counted: updatedItemsCounted,
        total_items_counted: updatedItemsCounted.length,
        total_variance_items: totalVarianceItems,
        total_variance_value: totalVarianceValue
      });

      // Update zone items display
      const updatedZoneItems = zoneItems.map(zi => 
        zi.id === item.id 
          ? { ...zi, physical_count: physicalCount, counted: true, variance: variance }
          : zi
      );
      setZoneItems(updatedZoneItems);

      // Check if zone is fully counted
      const allCounted = updatedZoneItems.every(zi => zi.counted);
      if (allCounted && !activeSession.zones_completed.includes(currentZone.id)) {
        handleCompleteZone();
      }

    } catch (error) {
      console.error('Failed to save count:', error);
      alert('Failed to save count. Please try again.');
    }
  };

  const handleCompleteZone = async () => {
    try {
      const updatedZonesCompleted = [...activeSession.zones_completed, currentZone.id];
      
      await PhysicalCountSession.update(activeSession.id, {
        zones_completed: updatedZonesCompleted
      });

      setActiveSession({
        ...activeSession,
        zones_completed: updatedZonesCompleted
      });

      setCountProgress({
        ...countProgress,
        [currentZone.id]: 'completed'
      });

      alert(`Zone "${currentZone.zone_name}" counting completed!`);
      setCurrentZone(null);
    } catch (error) {
      console.error('Failed to complete zone:', error);
      alert('Failed to mark zone as complete. Please try again.');
    }
  };

  const handleCompleteSession = async () => {
    if (activeSession.zones_completed.length < activeSession.zones_to_count.length) {
      if (!window.confirm('Not all zones have been counted. Are you sure you want to complete this session?')) {
        return;
      }
    }

    try {
      await PhysicalCountSession.update(activeSession.id, {
        status: 'completed',
        end_time: new Date().toISOString()
      });

      setActiveSession({
        ...activeSession,
        status: 'completed',
        end_time: new Date().toISOString()
      });

      setActiveTab('review');
    } catch (error) {
      console.error('Failed to complete session:', error);
      alert('Failed to complete session. Please try again.');
    }
  };

  const handlePostAdjustments = async () => {
    if (!window.confirm(`This will post ${activeSession.total_variance_items} inventory adjustments to the system. This action cannot be undone. Continue?`)) {
      return;
    }

    setIsLoading(true);
    try {
      // Post each variance as an inventory adjustment
      for (const count of activeSession.items_counted) {
        if (count.variance !== 0) {
          await InventoryItem.update(count.inventory_item_id, {
            'inventory_tracking.quantity_on_hand_singles': count.physical_count
          });
        }
      }

      await PhysicalCountSession.update(activeSession.id, {
        status: 'reconciled',
        adjustments_posted: true,
        reconciled_by: currentUser.full_name,
        reconciled_by_id: currentUser.id,
        reconciled_at: new Date().toISOString()
      });

      alert('Inventory adjustments posted successfully!');
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to post adjustments:', error);
      alert('Failed to post adjustments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!scanInput) return;

    const item = zoneItems.find(zi => 
      zi.upc_code === scanInput || 
      zi.product_name.toLowerCase().includes(scanInput.toLowerCase())
    );

    if (item) {
      // Auto-increment count
      const currentCount = item.physical_count || 0;
      handleCountItem(item, currentCount + 1);
      setScanInput('');
    } else {
      alert('Item not found in this zone');
      setScanInput('');
    }
  };

  const completionPercent = activeSession 
    ? (activeSession.zones_completed.length / activeSession.zones_to_count.length) * 100
    : 0;

  if (isLoading && !activeSession) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Loading counting interface...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <ClipboardCheck className="w-6 h-6" />
                Physical Inventory Count
              </CardTitle>
              {activeSession && (
                <CardDescription className="text-white/80 mt-2">
                  Session: {activeSession.session_name}
                </CardDescription>
              )}
            </div>
            <Button variant="outline" onClick={onClose} className="text-gray-900">
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup" disabled={activeSession?.status === 'completed'}>
            <Play className="w-4 h-4 mr-2" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="counting" disabled={!activeSession}>
            <Package className="w-4 h-4 mr-2" />
            Count
          </TabsTrigger>
          <TabsTrigger value="review" disabled={!activeSession || activeSession.status === 'in_progress'}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Review & Post
          </TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Start New Counting Session</CardTitle>
              <CardDescription>Configure your physical inventory count</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="session_name">Session Name</Label>
                <Input
                  id="session_name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Monthly Count - January 2025"
                />
              </div>

              <div>
                <Label htmlFor="count_type">Count Type</Label>
                <select
                  id="count_type"
                  value={countType}
                  onChange={(e) => setCountType(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="full_store">Full Store Count</option>
                  <option value="zone_specific">Zone-Specific Count</option>
                  <option value="cycle_count">Cycle Count</option>
                  <option value="spot_check">Spot Check</option>
                </select>
              </div>

              <div>
                <Label>Select Zones to Count</Label>
                <ScrollArea className="h-64 border rounded-lg p-4 mt-2">
                  <div className="space-y-2">
                    {zones.map(zone => (
                      <div key={zone.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`zone-${zone.id}`}
                          checked={selectedZones.includes(zone.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedZones([...selectedZones, zone.id]);
                            } else {
                              setSelectedZones(selectedZones.filter(id => id !== zone.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`zone-${zone.id}`} className="flex items-center gap-2 cursor-pointer">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>{zone.zone_name}</span>
                          <Badge variant="outline">{zone.zone_type}</Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedZones.length} zone(s) selected
                </p>
              </div>

              <Button onClick={handleStartSession} className="w-full" size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Counting Session
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Counting Tab */}
        <TabsContent value="counting" className="space-y-4">
          {activeSession && (
            <>
              {/* Progress Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-gray-600">
                        {activeSession.zones_completed.length} / {activeSession.zones_to_count.length} zones
                      </span>
                    </div>
                    <Progress value={completionPercent} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{activeSession.total_items_counted} items counted</span>
                      <span>{completionPercent.toFixed(0)}% complete</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Zone Selection or Current Zone */}
              {!currentZone ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Zone to Count</CardTitle>
                    <CardDescription>Choose a zone to begin counting items</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {zones
                        .filter(z => activeSession.zones_to_count.includes(z.id))
                        .map(zone => {
                          const status = countProgress[zone.id] || 'pending';
                          return (
                            <Card 
                              key={zone.id}
                              className={`cursor-pointer transition-all hover:shadow-lg ${
                                status === 'completed' ? 'border-green-500 bg-green-50' : ''
                              }`}
                              onClick={() => handleSelectZone(zone)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <MapPin className={`w-6 h-6 ${
                                      status === 'completed' ? 'text-green-600' : 'text-blue-600'
                                    }`} />
                                    <div>
                                      <p className="font-semibold">{zone.zone_name}</p>
                                      <p className="text-sm text-gray-600">{zone.zone_type}</p>
                                    </div>
                                  </div>
                                  {status === 'completed' ? (
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                  ) : (
                                    <ChevronRight className="w-6 h-6 text-gray-400" />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Button onClick={handleCompleteSession} variant="outline">
                        Complete Session & Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Current Zone Header */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-6 h-6 text-blue-600" />
                          <div>
                            <p className="font-bold text-lg">{currentZone.zone_name}</p>
                            <p className="text-sm text-gray-600">
                              {zoneItems.filter(zi => zi.counted).length} / {zoneItems.length} items counted
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setScanMode(!scanMode)}
                          >
                            <Scan className="w-4 h-4 mr-2" />
                            {scanMode ? 'List Mode' : 'Scan Mode'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setCurrentZone(null)}>
                            Back to Zones
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scan Mode */}
                  {scanMode && (
                    <Card>
                      <CardContent className="p-6">
                        <form onSubmit={handleScanSubmit} className="flex gap-2">
                          <Input
                            value={scanInput}
                            onChange={(e) => setScanInput(e.target.value)}
                            placeholder="Scan UPC or type product name..."
                            className="text-lg"
                            autoFocus
                          />
                          <Button type="submit">
                            <Scan className="w-4 h-4 mr-2" />
                            Scan
                          </Button>
                        </form>
                        <p className="text-xs text-gray-500 mt-2">
                          Tip: Use a barcode scanner for faster counting
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Items List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Items in {currentZone.zone_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px]">
                        <div className="space-y-3">
                          {zoneItems.map(item => {
                            const systemQty = item.inventory_tracking?.quantity_on_hand_singles || 0;
                            return (
                              <Card 
                                key={item.id}
                                className={`${item.counted ? 'border-green-300 bg-green-50' : ''}`}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <p className="font-semibold">{item.product_name}</p>
                                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                        <span>UPC: {item.upc_code}</span>
                                        <span>System Qty: <strong>{systemQty}</strong></span>
                                        {item.variance !== null && (
                                          <Badge className={
                                            item.variance === 0 ? 'bg-green-100 text-green-800' :
                                            item.variance > 0 ? 'bg-blue-100 text-blue-800' :
                                            'bg-red-100 text-red-800'
                                          }>
                                            {item.variance > 0 ? '+' : ''}{item.variance} variance
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        placeholder="Count"
                                        value={item.physical_count || ''}
                                        onChange={(e) => {
                                          const updatedItems = zoneItems.map(zi =>
                                            zi.id === item.id 
                                              ? { ...zi, physical_count: e.target.value }
                                              : zi
                                          );
                                          setZoneItems(updatedItems);
                                        }}
                                        className="w-24"
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => handleCountItem(item, item.physical_count)}
                                        disabled={!item.physical_count}
                                      >
                                        <Save className="w-4 h-4 mr-1" />
                                        Save
                                      </Button>
                                      {item.counted && (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-4">
          {activeSession && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">{activeSession.total_items_counted}</p>
                      <p className="text-sm text-gray-600 mt-1">Items Counted</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-orange-600">{activeSession.total_variance_items}</p>
                      <p className="text-sm text-gray-600 mt-1">Variances Found</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className={`text-3xl font-bold ${
                        activeSession.total_variance_value >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${Math.abs(activeSession.total_variance_value || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Variance Value</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">
                        {activeSession.zones_completed.length} / {activeSession.zones_to_count.length}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Zones Completed</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Variances Detail */}
              <Card>
                <CardHeader>
                  <CardTitle>Variance Details</CardTitle>
                  <CardDescription>Items with quantity discrepancies</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeSession.total_variance_items > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {activeSession.items_counted
                          .filter(item => item.variance !== 0)
                          .sort((a, b) => Math.abs(b.variance_value) - Math.abs(a.variance_value))
                          .map(item => (
                            <Card key={item.inventory_item_id} className="border-l-4 border-orange-500">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold">{item.product_name}</p>
                                    <p className="text-sm text-gray-600">UPC: {item.upc_code}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="flex items-center gap-4">
                                      <div>
                                        <p className="text-xs text-gray-500">System</p>
                                        <p className="font-semibold">{item.system_quantity}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Physical</p>
                                        <p className="font-semibold">{item.physical_count}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Variance</p>
                                        <div className="flex items-center gap-1">
                                          {item.variance > 0 ? (
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                          ) : (
                                            <TrendingDown className="w-4 h-4 text-red-600" />
                                          )}
                                          <p className={`font-bold ${
                                            item.variance > 0 ? 'text-green-600' : 'text-red-600'
                                          }`}>
                                            {item.variance > 0 ? '+' : ''}{item.variance}
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">Value</p>
                                        <p className={`font-bold ${
                                          item.variance_value >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          ${Math.abs(item.variance_value).toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <p className="text-gray-600">No variances found. Perfect count!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              {!activeSession.adjustments_posted && (
                <Card className="border-2 border-orange-300 bg-orange-50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">Ready to Post Adjustments</h3>
                        <p className="text-sm text-gray-700 mb-4">
                          This will update system inventory quantities to match your physical count. 
                          {activeSession.total_variance_items} item(s) will be adjusted with a total variance value of 
                          ${Math.abs(activeSession.total_variance_value || 0).toFixed(2)}.
                        </p>
                        <Button 
                          onClick={handlePostAdjustments}
                          size="lg"
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Post Inventory Adjustments
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSession.adjustments_posted && (
                <Alert className="border-green-300 bg-green-50">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription>
                    <strong>Adjustments Posted Successfully!</strong><br />
                    Inventory has been updated to reflect physical counts.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}