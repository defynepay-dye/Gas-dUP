import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ActiveCashDrawersOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Cash Drawers</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          No active drawers at this time
        </p>
      </CardContent>
    </Card>
  );
}
