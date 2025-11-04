import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalMediaChannel } from "@/api/entities";
import { Monitor, Plus, Trash2, ExternalLink, CheckCircle, XCircle, AlertCircle, Play } from "lucide-react";

const platforms = [
  { value: 'yodeck', label: 'Yodeck', url: 'https://yodeck.com', free: true },
  { value: 'easy_signage', label: 'Easy Signage', url: 'https://easysignage.com', free: true },
  { value: 'open_signage', label: 'Open Signage', url: 'https://opensignage.com', free: true },
  { value: 'castit', label: 'Cast.it', url: 'https://cast.it', free: true },
  { value: 'screencloud', label: 'ScreenCloud', url: 'https://screencloud.com', free: false },
  { value: 'rise_vision', label: 'Rise Vision', url: 'https://risevision.com', free: true },
  { value: 'xibo', label: 'Xibo', url: 'https://xibo.org.uk', free: true },
  { value: 'custom_url', label: 'Custom URL / Web Page', url: null, free: true }
];

export default function ExternalChannelsTab() {
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [formData, setFormData] = useState({
    channel_name: '',
    platform: 'yodeck',
    embed_url: '',
    api_key: '',
    channel_id: '',
    description: '',
    display_duration_seconds: 60
  });

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setIsLoading(true);
    try {
      const data = await ExternalMediaChannel.list();
      setChannels(data || []);
    } catch (error) {
      console.error('Failed to load external channels:', error);
    }
    setIsLoading(false);
  };

  const handleSaveChannel = async () => {
    try {
      const platformInfo = platforms.find(p => p.value === formData.platform);
      const channelData = {
        ...formData,
        platform_display_name: platformInfo?.label || formData.platform,
        status: 'active',
        last_status_check: new Date().toISOString()
      };

      if (editingChannel) {
        await ExternalMediaChannel.update(editingChannel.id, channelData);
      } else {
        await ExternalMediaChannel.create(channelData);
      }

      setShowAddDialog(false);
      setEditingChannel(null);
      setFormData({
        channel_name: '',
        platform: 'yodeck',
        embed_url: '',
        api_key: '',
        channel_id: '',
        description: '',
        display_duration_seconds: 60
      });
      loadChannels();
    } catch (error) {
      console.error('Failed to save channel:', error);
      alert('Failed to save channel. Please try again.');
    }
  };

  const handleEditChannel = (channel) => {
    setEditingChannel(channel);
    setFormData({
      channel_name: channel.channel_name,
      platform: channel.platform,
      embed_url: channel.embed_url,
      api_key: channel.api_key || '',
      channel_id: channel.channel_id || '',
      description: channel.description || '',
      display_duration_seconds: channel.display_duration_seconds || 60
    });
    setShowAddDialog(true);
  };

  const handleDeleteChannel = async (channelId) => {
    if (!confirm('Are you sure you want to delete this external channel?')) return;
    
    try {
      await ExternalMediaChannel.delete(channelId);
      loadChannels();
    } catch (error) {
      console.error('Failed to delete channel:', error);
      alert('Failed to delete channel. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">External Digital Signage Channels</h2>
          <p className="text-gray-600">Integrate free digital signage platforms for customer displays</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingChannel(null); setFormData({ channel_name: '', platform: 'yodeck', embed_url: '', api_key: '', channel_id: '', description: '', display_duration_seconds: 60 }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add External Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingChannel ? 'Edit' : 'Add'} External Channel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({...formData, platform: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map(platform => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label} {platform.free && <Badge variant="outline" className="ml-2 text-xs">FREE</Badge>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {platforms.find(p => p.value === formData.platform)?.url && (
                  <Button variant="link" size="sm" className="mt-1 p-0 h-auto" onClick={() => window.open(platforms.find(p => p.value === formData.platform).url, '_blank')}>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Visit {platforms.find(p => p.value === formData.platform).label} Website
                  </Button>
                )}
              </div>

              <div>
                <Label htmlFor="channel_name">Channel Name</Label>
                <Input
                  id="channel_name"
                  placeholder="e.g., Store Front Promotions"
                  value={formData.channel_name}
                  onChange={(e) => setFormData({...formData, channel_name: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="embed_url">Embed URL or Stream URL *</Label>
                <Input
                  id="embed_url"
                  placeholder="https://player.yodeck.com/embed/YOUR_CHANNEL_ID"
                  value={formData.embed_url}
                  onChange={(e) => setFormData({...formData, embed_url: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the URL provided by your digital signage platform for embedding or streaming content
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="channel_id">Channel ID (Optional)</Label>
                  <Input
                    id="channel_id"
                    placeholder="12345"
                    value={formData.channel_id}
                    onChange={(e) => setFormData({...formData, channel_id: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Display Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="10"
                    value={formData.display_duration_seconds}
                    onChange={(e) => setFormData({...formData, display_duration_seconds: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="api_key">API Key (Optional)</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="For advanced integrations"
                  value={formData.api_key}
                  onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this channel displays..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <Alert>
                <AlertDescription>
                  <strong>How to use:</strong> Once saved, this external channel will be available for use in your customer display campaigns.
                  You can add it to a campaign's media rotation in the Campaign Editor.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingChannel(null); }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveChannel} disabled={!formData.channel_name || !formData.embed_url}>
                  {editingChannel ? 'Update' : 'Add'} Channel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Free Platforms Quick Links */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-lg">🎉 Recommended Free Digital Signage Platforms</CardTitle>
          <CardDescription>
            Click any platform below to create a free account and get your embed URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {platforms.filter(p => p.free).map(platform => (
              <Button
                key={platform.value}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1"
                onClick={() => platform.url && window.open(platform.url, '_blank')}
              >
                <Monitor className="w-5 h-5" />
                <span className="text-sm font-semibold">{platform.label}</span>
                <Badge variant="secondary" className="text-xs">FREE</Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Channels List */}
      {isLoading ? (
        <div className="text-center py-12">Loading channels...</div>
      ) : channels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No External Channels Yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first external digital signage channel to get started
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Channel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map(channel => (
            <Card key={channel.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{channel.channel_name}</CardTitle>
                  </div>
                  {getStatusIcon(channel.status)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{channel.platform_display_name || channel.platform}</Badge>
                  <Badge variant="outline">{channel.display_duration_seconds}s</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {channel.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{channel.description}</p>
                )}
                
                <div className="text-xs text-gray-500 space-y-1">
                  {channel.channel_id && (
                    <p><strong>Channel ID:</strong> {channel.channel_id}</p>
                  )}
                  <p className="truncate"><strong>URL:</strong> {channel.embed_url}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(channel.embed_url, '_blank')}>
                    <Play className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditChannel(channel)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteChannel(channel.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Alert>
        <AlertDescription>
          <strong>💡 Pro Tip:</strong> After adding external channels here, you can include them in your customer display campaigns by going to Media Manager → Campaigns → Edit Campaign → Add Media Item → External Channel.
        </AlertDescription>
      </Alert>
    </div>
  );
}