import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TreasuryManagementDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Treasury Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Treasury management dashboard - Coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
