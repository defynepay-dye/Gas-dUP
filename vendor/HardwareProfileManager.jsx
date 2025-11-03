import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Cpu, Copy, Plus, Edit, Trash2, CheckCircle, RefreshCw } from 'lucide-react';

export default function HardwareProfileManager() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    profile_name: '',
    profile_description: '',
    profile_type: 'medium_site',
    default_forecourt_controller: 'allied_electronics_nexgen',
    default_communication_protocol: 'rs485',
    recommended_pump_count: 8,
    default_atg_vendor: 'veeder_root_tls350',
    includes_car_wash: false,
    includes_qsr: false,
    default_payment_terminal_vendor: 'ingenico'
  });

  const queryClient = useQueryClient();

  // Fetch hardware profiles
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['hardware_profiles'],
    queryFn: async () => {
      const data = await base44.entities.HardwareProfile.list('-usage_count');
      return data || [];
    }
  });

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      return await base44.entities.HardwareProfile.create({
        ...profileData,
        is_active: true,
        usage_count: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['hardware_profiles']);
      setShowCreateModal(false);
      resetForm();
      alert('✅ Hardware profile created successfully!');
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.HardwareProfile.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['hardware_profiles']);
      setShowEditModal(false);
      setSelectedProfile(null);
      alert('✅ Hardware profile updated successfully!');
    }
  });

  // Delete profile mutation
  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId) => {
      return await base44.entities.HardwareProfile.delete(profileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['hardware_profiles']);
      alert('Hardware profile deleted');
    }
  });

  // Duplicate profile mutation
  const duplicateProfileMutation = useMutation({
    mutationFn: async (profile) => {
      const { id, created_date, updated_date, created_by, usage_count, ...profileData } = profile;
      return await base44.entities.HardwareProfile.create({
        ...profileData,
        profile_name: `${profileData.profile_name} (Copy)`,
        usage_count: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['hardware_profiles']);
      alert('✅ Hardware profile duplicated!');
    }
  });

  const resetForm = () => {
    setProfileForm({
      profile_name: '',
      profile_description: '',
      profile_type: 'medium_site',
      default_forecourt_controller: 'allied_electronics_nexgen',
      default_communication_protocol: 'rs485',
      recommended_pump_count: 8,
      default_atg_vendor: 'veeder_root_tls350',
      includes_car_wash: false,
      includes_qsr: false,
      default_payment_terminal_vendor: 'ingenico'
    });
  };

  const handleCreate = () => {
    if (!profileForm.profile_name) {
      alert('Please enter a profile name');
      return;
    }
    createProfileMutation.mutate(profileForm);
  };

  const handleEdit = (profile) => {
    setSelectedProfile(profile);
    setProfileForm({
      profile_name: profile.profile_name,
      profile_description: profile.profile_description || '',
      profile_type: profile.profile_type,
      default_forecourt_controller: profile.default_forecourt_controller,
      default_communication_protocol: profile.default_communication_protocol,
      recommended_pump_count: profile.recommended_pump_count || 8,
      default_atg_vendor: profile.default_atg_vendor || 'veeder_root_tls350',
      includes_car_wash: profile.includes_car_wash || false,
      includes_qsr: profile.includes_qsr || false,
      default_payment_terminal_vendor: profile.default_payment_terminal_vendor || 'ingenico'
    });
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (!selectedProfile) return;
    updateProfileMutation.mutate({
      id: selectedProfile.id,
      data: profileForm
    });
  };

  const getProfileTypeColor = (type) => {
    switch (type) {
      case 'small_site': return 'bg-blue-100 text-blue-800';
      case 'medium_site': return 'bg-green-100 text-green-800';
      case 'large_site': return 'bg-purple-100 text-purple-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><RefreshCw className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Hardware Profiles</h2>
          <p className="text-gray-600">Pre-configured hardware templates for quick LSS deployment</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Profile
        </Button>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map(profile => (
          <Card key={profile.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{profile.profile_name}</CardTitle>
                  <Badge className={`mt-2 ${getProfileTypeColor(profile.profile_type)}`}>
                    {profile.profile_type.replace('_', ' ')}
                  </Badge>
                </div>
                {profile.is_active && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {profile.profile_description || 'No description'}
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Forecourt Controller:</span>
                  <span className="font-medium">{profile.default_forecourt_controller}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Protocol:</span>
                  <span className="font-medium">{profile.default_communication_protocol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recommended Pumps:</span>
                  <span className="font-medium">{profile.recommended_pump_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ATG:</span>
                  <span className="font-medium">{profile.default_atg_vendor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Terminal:</span>
                  <span className="font-medium">{profile.default_payment_terminal_vendor}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {profile.includes_car_wash && (
                  <Badge variant="secondary" className="text-xs">Car Wash</Badge>
                )}
                {profile.includes_qsr && (
                  <Badge variant="secondary" className="text-xs">QSR</Badge>
                )}
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Times Used:</span>
                  <span className="font-bold text-purple-600">{profile.usage_count || 0}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEdit(profile)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => duplicateProfileMutation.mutate(profile)}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Duplicate
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm('Delete this hardware profile?')) {
                      deleteProfileMutation.mutate(profile.id);
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {profiles.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Cpu className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Hardware Profiles</h3>
            <p className="text-gray-600 mb-4">Create your first hardware profile to streamline LSS deployments</p>
            <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create First Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedProfile(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showEditModal ? 'Edit Hardware Profile' : 'Create Hardware Profile'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 py-4 pr-4">
              <div>
                <Label>Profile Name *</Label>
                <Input
                  value={profileForm.profile_name}
                  onChange={(e) => setProfileForm({ ...profileForm, profile_name: e.target.value })}
                  placeholder="e.g., Standard 8-Pump Station"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={profileForm.profile_description}
                  onChange={(e) => setProfileForm({ ...profileForm, profile_description: e.target.value })}
                  placeholder="Describe this hardware configuration..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Profile Type</Label>
                  <Select
                    value={profileForm.profile_type}
                    onValueChange={(value) => setProfileForm({ ...profileForm, profile_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small_site">Small Site (1-4 pumps)</SelectItem>
                      <SelectItem value="medium_site">Medium Site (5-8 pumps)</SelectItem>
                      <SelectItem value="large_site">Large Site (9+ pumps)</SelectItem>
                      <SelectItem value="custom">Custom Configuration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Recommended Pump Count</Label>
                  <Input
                    type="number"
                    value={profileForm.recommended_pump_count}
                    onChange={(e) => setProfileForm({ ...profileForm, recommended_pump_count: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Forecourt Controller</Label>
                  <Select
                    value={profileForm.default_forecourt_controller}
                    onValueChange={(value) => setProfileForm({ ...profileForm, default_forecourt_controller: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allied_electronics_nexgen">Allied Electronics NexGen</SelectItem>
                      <SelectItem value="technotrade_pts2">Technotrade PTS2</SelectItem>
                      <SelectItem value="progressive_fuel_direct">Progressive Fuel Direct</SelectItem>
                      <SelectItem value="gilbarco_passport">Gilbarco Passport</SelectItem>
                      <SelectItem value="wayne_nucleus">Wayne Nucleus</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Communication Protocol</Label>
                  <Select
                    value={profileForm.default_communication_protocol}
                    onValueChange={(value) => setProfileForm({ ...profileForm, default_communication_protocol: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rs485">RS-485</SelectItem>
                      <SelectItem value="current_loop">Current Loop</SelectItem>
                      <SelectItem value="gilbarco_loop">Gilbarco Loop</SelectItem>
                      <SelectItem value="dart">DART</SelectItem>
                      <SelectItem value="ethernet_tcp">Ethernet TCP/IP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ATG System</Label>
                  <Select
                    value={profileForm.default_atg_vendor}
                    onValueChange={(value) => setProfileForm({ ...profileForm, default_atg_vendor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veeder_root_tls350">Veeder-Root TLS-350</SelectItem>
                      <SelectItem value="veeder_root_tls450">Veeder-Root TLS-450</SelectItem>
                      <SelectItem value="opw_sitesentry">OPW SiteSentry</SelectItem>
                      <SelectItem value="franklin_fueling_ts550">Franklin Fueling TS-550</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Payment Terminal</Label>
                  <Select
                    value={profileForm.default_payment_terminal_vendor}
                    onValueChange={(value) => setProfileForm({ ...profileForm, default_payment_terminal_vendor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingenico">Ingenico</SelectItem>
                      <SelectItem value="verifone">VeriFone</SelectItem>
                      <SelectItem value="pax">PAX Technology</SelectItem>
                      <SelectItem value="dejavoo">Dejavoo</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileForm.includes_car_wash}
                    onChange={(e) => setProfileForm({ ...profileForm, includes_car_wash: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Includes Car Wash Integration</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileForm.includes_qsr}
                    onChange={(e) => setProfileForm({ ...profileForm, includes_qsr: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Includes QSR Integration</span>
                </label>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedProfile(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={showEditModal ? handleUpdate : handleCreate}
              disabled={createProfileMutation.isLoading || updateProfileMutation.isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {showEditModal ? 'Update Profile' : 'Create Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}