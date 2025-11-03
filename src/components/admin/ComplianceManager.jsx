import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SalesRestrictionRule, Location } from "@/api/entities";
import { Shield, Plus, Edit, Trash2, AlertTriangle, MapPin, Loader2 } from "lucide-react";

export default function ComplianceManager({ currentScope }) {
  const [rules, setRules] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRule, setEditingRule] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    initializeComponent();
  }, []);

  useEffect(() => {
    if (currentScope?.id && currentScope.type === 'location') {
      setSelectedLocationId(currentScope.id);
    }
  }, [currentScope]);

  useEffect(() => {
    if (selectedLocationId) {
      loadRules();
    }
  }, [selectedLocationId]);

  const initializeComponent = async () => {
    try {
      const locs = await Location.list();
      setLocations(locs);
      
      if (currentScope?.id && currentScope.type === 'location') {
        setSelectedLocationId(currentScope.id);
      } else if (locs.length > 0) {
        setSelectedLocationId(locs[0].id);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to load locations:", error);
      setIsLoading(false);
    }
  };

  const loadRules = async () => {
    if (!selectedLocationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await SalesRestrictionRule.filter({ location_id: selectedLocationId });
      setRules(data);
    } catch (error) {
      console.error("Failed to load restriction rules:", error);
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRule = async (ruleData) => {
    try {
      const saveData = {
        ...ruleData,
        location_id: selectedLocationId
      };

      if (editingRule) {
        await SalesRestrictionRule.update(editingRule.id, saveData);
      } else {
        await SalesRestrictionRule.create(saveData);
      }

      setShowAddModal(false);
      setEditingRule(null);
      loadRules();
      alert("Restriction rule saved successfully!");
    } catch (error) {
      console.error("Failed to save restriction rule:", error);
      alert("Error saving rule. Please try again.");
    }
  };

  const handleDelete = async (ruleId) => {
    if (!confirm("Are you sure you want to delete this restriction rule?")) return;

    try {
      await SalesRestrictionRule.delete(ruleId);
      loadRules();
    } catch (error) {
      console.error("Failed to delete rule:", error);
      alert("Error deleting rule.");
    }
  };

  const getDayName = (dayNum) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3">Loading compliance rules...</span>
      </div>
    );
  }

  if (!selectedLocationId || locations.length === 0) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="w-4 h-4 text-yellow-600" />
        <AlertDescription>
          <strong>No Locations Found:</strong> Please create at least one location before configuring compliance rules.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <MapPin className="w-4 h-4 text-blue-600" />
        <AlertDescription>
          <strong>Location-Specific Compliance Rules:</strong> You are managing rules for{' '}
          <strong>{currentScope?.label || locations.find(l => l.id === selectedLocationId)?.location_name || 'this location'}</strong>. 
          These rules enforce local, county, and state laws for restricted product sales.
        </AlertDescription>
      </Alert>

      {(!currentScope || currentScope.type === 'enterprise') && locations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Location</CardTitle>
            <CardDescription>Choose which location's compliance rules to manage</CardDescription>
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

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Sales Restriction Rules</h3>
          <p className="text-sm text-gray-600">Configure time-based restrictions for age-restricted products</p>
        </div>
        <Button onClick={() => { setEditingRule(null); setShowAddModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No restriction rules configured for this location.</p>
            <p className="text-sm mt-2">Add rules to enforce local sales restrictions (e.g., no alcohol sales on Sunday mornings).</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map(rule => (
            <Card key={rule.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">{rule.rule_name}</h4>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Category:</strong> {rule.category}</p>
                      <p><strong>Days:</strong> {rule.days_of_week.map(d => getDayName(d)).join(', ')}</p>
                      <p><strong>Restricted Time:</strong> {rule.start_time} - {rule.end_time}</p>
                      {rule.jurisdiction_details && (
                        <p><strong>Jurisdiction:</strong> {rule.jurisdiction_details}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditingRule(rule); setShowAddModal(true); }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && (
        <RuleEditorModal
          rule={editingRule}
          locationId={selectedLocationId}
          onSave={handleSaveRule}
          onClose={() => { setShowAddModal(false); setEditingRule(null); }}
        />
      )}
    </div>
  );
}

function RuleEditorModal({ rule, locationId, onSave, onClose }) {
  const [formData, setFormData] = useState(rule || {
    rule_name: '',
    category: 'alcohol',
    days_of_week: [],
    start_time: '00:00',
    end_time: '06:00',
    is_active: true,
    jurisdiction_details: ''
  });

  const categories = [
    { value: 'alcohol', label: 'Alcohol' },
    { value: 'tobacco', label: 'Tobacco' },
    { value: 'lottery', label: 'Lottery' },
    { value: 'other', label: 'Other' }
  ];

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  const toggleDay = (dayNum) => {
    const days = [...formData.days_of_week];
    if (days.includes(dayNum)) {
      setFormData({ ...formData, days_of_week: days.filter(d => d !== dayNum) });
    } else {
      setFormData({ ...formData, days_of_week: [...days, dayNum].sort() });
    }
  };

  const handleSubmit = () => {
    if (!formData.rule_name || formData.days_of_week.length === 0) {
      alert("Please fill in all required fields.");
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit' : 'Add'} Sales Restriction Rule</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="rule_name">Rule Name *</Label>
            <Input
              id="rule_name"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              placeholder="e.g., Sunday Morning Alcohol Ban"
            />
          </div>

          <div>
            <Label htmlFor="category">Product Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Days of Week *</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {daysOfWeek.map(day => (
                <Button
                  key={day.value}
                  type="button"
                  size="sm"
                  variant={formData.days_of_week.includes(day.value) ? "default" : "outline"}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label.substring(0, 3)}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time (24-hour)</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time (24-hour)</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="jurisdiction">Jurisdiction Details (Optional)</Label>
            <Input
              id="jurisdiction"
              value={formData.jurisdiction_details}
              onChange={(e) => setFormData({ ...formData, jurisdiction_details: e.target.value })}
              placeholder="e.g., Texas State Law, Harris County Ordinance"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Rule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}