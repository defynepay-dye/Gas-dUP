import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SalesRestrictionRule, Location } from "@/api/entities";
import { Plus, Trash2, Clock, MapPin, AlertTriangle, Loader2 } from "lucide-react";

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

export default function SalesRestrictionManager({ currentScope }) {
  const [rules, setRules] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    rule_name: '',
    category: 'alcohol',
    days_of_week: [],
    start_time: '00:00',
    end_time: '23:59',
    jurisdiction_details: '',
    is_active: true
  });

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (currentScope?.id) {
      setSelectedLocationId(currentScope.id);
    }
  }, [currentScope]);

  useEffect(() => {
    if (selectedLocationId) {
      loadRules();
    }
  }, [selectedLocationId]);

  const loadLocations = async () => {
    try {
      const locs = await Location.list();
      setLocations(locs);
    } catch (error) {
      console.error("Failed to load locations:", error);
    }
  };

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const data = await SalesRestrictionRule.filter({ location_id: selectedLocationId });
      setRules(data || []);
    } catch (error) {
      console.error("Failed to load sales restriction rules:", error);
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRule = async () => {
    if (!selectedLocationId) {
      alert("Please select a location first");
      return;
    }

    try {
      await SalesRestrictionRule.create({
        ...formData,
        location_id: selectedLocationId
      });
      setShowAddDialog(false);
      setFormData({
        rule_name: '',
        category: 'alcohol',
        days_of_week: [],
        start_time: '00:00',
        end_time: '23:59',
        jurisdiction_details: '',
        is_active: true
      });
      loadRules();
    } catch (error) {
      console.error("Failed to save rule:", error);
      alert("Error saving rule. Please try again.");
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (confirm("Are you sure you want to delete this restriction rule?")) {
      try {
        await SalesRestrictionRule.delete(ruleId);
        loadRules();
      } catch (error) {
        console.error("Failed to delete rule:", error);
        alert("Error deleting rule. Please try again.");
      }
    }
  };

  const toggleDay = (dayValue) => {
    const days = [...formData.days_of_week];
    const index = days.indexOf(dayValue);
    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(dayValue);
    }
    setFormData({...formData, days_of_week: days});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3">Loading sales restrictions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <MapPin className="w-4 h-4 text-blue-600" />
        <AlertDescription>
          <strong>Location-Specific Compliance:</strong> You are managing sales restrictions for{' '}
          <strong>{currentScope?.label || 'a specific location'}</strong>. 
          These rules comply with local laws and regulations for this location only.
        </AlertDescription>
      </Alert>

      {(!currentScope || currentScope.type === 'enterprise') && locations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Location</CardTitle>
            <CardDescription>Choose which location's sales restrictions to manage</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.location_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Sales Restriction Rules</CardTitle>
              <CardDescription>Manage time-based sales restrictions for age-restricted categories</CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Sales Restriction Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Rule Name</Label>
                    <Input
                      value={formData.rule_name}
                      onChange={(e) => setFormData({...formData, rule_name: e.target.value})}
                      placeholder="e.g., Sunday Morning Alcohol Ban"
                    />
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alcohol">Alcohol</SelectItem>
                        <SelectItem value="tobacco">Tobacco</SelectItem>
                        <SelectItem value="lottery">Lottery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Days of Week (when restriction applies)</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {daysOfWeek.map(day => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={formData.days_of_week.includes(day.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleDay(day.value)}
                        >
                          {day.label.substring(0, 3)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Restriction Start Time</Label>
                      <Input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Restriction End Time</Label>
                      <Input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Jurisdiction Details</Label>
                    <Input
                      value={formData.jurisdiction_details}
                      onChange={(e) => setFormData({...formData, jurisdiction_details: e.target.value})}
                      placeholder="e.g., Texas State Law, Harris County Ordinance"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveRule}>Save Rule</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No sales restriction rules configured for this location.</p>
              <p className="text-sm">Click "Add Rule" to create your first restriction.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map(rule => (
                <div key={rule.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{rule.rule_name}</h4>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="capitalize">{rule.category}</Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            Restricted: {rule.start_time} - {rule.end_time}
                          </span>
                        </div>
                        <div>
                          <strong>Days:</strong>{' '}
                          {rule.days_of_week.map(d => daysOfWeek.find(day => day.value === d)?.label).join(', ')}
                        </div>
                        {rule.jurisdiction_details && (
                          <div>
                            <strong>Jurisdiction:</strong> {rule.jurisdiction_details}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}