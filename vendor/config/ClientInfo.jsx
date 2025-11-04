import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, MapPin, Calendar, Edit } from 'lucide-react';
import { format } from 'date-fns';

export default function ClientInfo({ client, onEdit }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>Client Information</CardTitle>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{client.client_name}</h3>
            <Badge className={
              client.account_status === 'active' ? 'bg-green-100 text-green-800' :
              client.account_status === 'trial' ? 'bg-blue-100 text-blue-800' :
              'bg-red-100 text-red-800'
            }>
              {client.account_status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Client Type</p>
            <p className="font-medium">{client.client_type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Subscription Tier</p>
            <Badge variant="outline" className="text-sm">
              {client.subscription_tier}
            </Badge>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Contact Information</h4>
          <div className="space-y-3">
            {client.contact_info?.primary_contact_name && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Contact:</span>
                <span className="font-medium">{client.contact_info.primary_contact_name}</span>
              </div>
            )}
            {client.contact_info?.primary_contact_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{client.contact_info.primary_contact_email}</span>
              </div>
            )}
            {client.contact_info?.primary_contact_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{client.contact_info.primary_contact_phone}</span>
              </div>
            )}
            {client.contact_info?.billing_address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-gray-600">Address:</span>
                  <p className="font-medium">
                    {client.contact_info.billing_address}<br />
                    {client.contact_info.billing_city}, {client.contact_info.billing_state} {client.contact_info.billing_zip}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">License Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Max Locations</p>
              <p className="text-lg font-bold">{client.license_info?.max_locations || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Max Terminals/Location</p>
              <p className="text-lg font-bold">{client.license_info?.max_terminals_per_location || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Max Users</p>
              <p className="text-lg font-bold">{client.license_info?.max_users || 0}</p>
            </div>
            {client.license_info?.license_expiration_date && (
              <div>
                <p className="text-sm text-gray-600">License Expires</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(client.license_info.license_expiration_date), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </div>

        {client.created_date && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              Client since {format(new Date(client.created_date), 'MMMM d, yyyy')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}