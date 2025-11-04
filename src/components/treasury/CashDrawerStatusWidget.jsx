import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export default function CashDrawerStatusWidget({ drawerData }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4" />
          Cash Drawer Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${drawerData?.total || '0.00'}
        </div>
        <p className="text-xs text-muted-foreground">Current balance</p>
      </CardContent>
    </Card>
  );
}
