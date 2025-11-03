import React, { useState, useEffect } from 'react';
import { ModifierGroup, InventoryItem, Location } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ChevronRight, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ModifierManager() {
  const [modifierGroups, setModifierGroups] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [groupsData, itemsData] = await Promise.all([
        ModifierGroup.list('group_name'),
        InventoryItem.list('product_name', 200)
      ]);
      setModifierGroups(groupsData);
      setInventoryItems(itemsData);
    } catch (error) {
      console.error('Error loading modifier data:', error);
    }
    setIsLoading(false);
  };

  const handleSaveGroup = async (groupData) => {
    try {
      if (editingGroup?.id) {
        await ModifierGroup.update(editingGroup.id, groupData);
      } else {
        await ModifierGroup.create(groupData);
      }
      setEditingGroup(null);
      loadData();
    } catch (error) {
      console.error('Error saving modifier group:', error);
      alert('Failed to save modifier group');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this modifier group?')) return;
    try {
      await ModifierGroup.delete(groupId);
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
      loadData();
    } catch (error) {
      console.error('Error deleting modifier group:', error);
      alert('Failed to delete modifier group');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading modifiers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Modifier Groups Manager</h3>
          <p className="text-sm text-gray-500">Create modifier groups for customizable menu items (e.g., "Add Cheese", "Extra Bacon")</p>
        </div>
        <Button onClick={() => setEditingGroup({})}>
          <Plus className="w-4 h-4 mr-2" />
          New Modifier Group
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Modifier Groups ({modifierGroups.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {modifierGroups.map(group => {
              const isSelected = selectedGroup?.id === group.id;
              return (
                <div
                  key={group.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="font-medium">{group.group_name}</span>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {group.selection_type === 'single' ? 'Single' : 'Multiple'} Select
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {group.modifiers?.length || 0} options
                        </Badge>
                      </div>
                    </div>
                    {isSelected && <ChevronRight className="w-4 h-4 text-blue-600" />}
                  </div>
                </div>
              );
            })}
            {modifierGroups.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No modifier groups yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Group Details */}
        <Card className="lg:col-span-2">
          {selectedGroup ? (
            <>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedGroup.group_name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedGroup.selection_type === 'single' ? 'Single selection' : 'Multiple selections allowed'} 
                      {' • '}
                      Min: {selectedGroup.min_selection || 0}, Max: {selectedGroup.max_selection || 'unlimited'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingGroup(selectedGroup)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteGroup(selectedGroup.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-semibold">Modifier Options</h4>
                  {selectedGroup.modifiers && selectedGroup.modifiers.length > 0 ? (
                    <div className="space-y-2">
                      {selectedGroup.modifiers.map((modifier, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{modifier.name}</span>
                            {modifier.inventory_item_id && (
                              <p className="text-xs text-gray-500">Linked to inventory</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold">{modifier.price_adjustment >= 0 ? '+' : ''}{modifier.price_adjustment?.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                      <p className="text-sm">No modifiers defined yet</p>
                      <Button size="sm" className="mt-3" onClick={() => setEditingGroup(selectedGroup)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Modifiers
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-20">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium">Select a modifier group to view details</p>
                <p className="text-sm mt-1">or create a new group to get started</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Edit Modal */}
      {editingGroup && (
        <ModifierGroupEditModal
          group={editingGroup}
          inventoryItems={inventoryItems}
          onSave={handleSaveGroup}
          onClose={() => setEditingGroup(null)}
        />
      )}
    </div>
  );
}

function ModifierGroupEditModal({ group, inventoryItems, onSave, onClose }) {
  const [formData, setFormData] = useState({
    group_name: group.group_name || '',
    selection_type: group.selection_type || 'single',
    min_selection: group.min_selection || 0,
    max_selection: group.max_selection || 1,
    modifiers: group.modifiers || []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleAddModifier = () => {
    setFormData({
      ...formData,
      modifiers: [
        ...formData.modifiers,
        { name: '', price_adjustment: 0, inventory_item_id: '' }
      ]
    });
  };

  const handleUpdateModifier = (index, field, value) => {
    const updated = [...formData.modifiers];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, modifiers: updated });
  };

  const handleRemoveModifier = (index) => {
    setFormData({
      ...formData,
      modifiers: formData.modifiers.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{group.id ? 'Edit Modifier Group' : 'New Modifier Group'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Group Name *</Label>
              <Input
                value={formData.group_name}
                onChange={(e) => setFormData({...formData, group_name: e.target.value})}
                placeholder="e.g., Cheese Options, Toppings"
                required
              />
            </div>

            <div>
              <Label>Selection Type</Label>
              <Select value={formData.selection_type} onValueChange={(value) => setFormData({...formData, selection_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Selection</SelectItem>
                  <SelectItem value="multiple">Multiple Selections</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Min Selections</Label>
              <Input
                type="number"
                value={formData.min_selection}
                onChange={(e) => setFormData({...formData, min_selection: parseInt(e.target.value) || 0})}
              />
            </div>

            <div className="col-span-2">
              <Label>Max Selections</Label>
              <Input
                type="number"
                value={formData.max_selection}
                onChange={(e) => setFormData({...formData, max_selection: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold">Modifier Options</h4>
              <Button type="button" size="sm" onClick={handleAddModifier}>
                <Plus className="w-4 h-4 mr-1" />
                Add Option
              </Button>
            </div>

            <div className="space-y-3">
              {formData.modifiers.map((modifier, idx) => (
                <div key={idx} className="flex gap-2 items-start p-3 border rounded-lg bg-gray-50">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Option name (e.g., Extra Cheese)"
                      value={modifier.name}
                      onChange={(e) => handleUpdateModifier(idx, 'name', e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price adjustment"
                        value={modifier.price_adjustment}
                        onChange={(e) => handleUpdateModifier(idx, 'price_adjustment', parseFloat(e.target.value) || 0)}
                      />
                      <Select 
                        value={modifier.inventory_item_id || ''} 
                        onValueChange={(value) => handleUpdateModifier(idx, 'inventory_item_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Link to inventory (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>None</SelectItem>
                          {inventoryItems.slice(0, 50).map(item => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.product_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveModifier(idx)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ))}
              {formData.modifiers.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  <p className="text-sm">No options yet. Click "Add Option" to create modifiers.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Modifier Group</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}