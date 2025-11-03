import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LotteryManager() {
  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertDescription>
          <strong>Lottery Management has been streamlined!</strong><br />
          Lottery products are now managed through the unified Inventory Manager alongside all your other products.
          <br /><br />
          <strong>What you can do:</strong>
          <ul className="list-disc ml-5 mt-2">
            <li>Import lottery games using the Universal Product Importer (detects lottery automatically)</li>
            <li>Receive new lottery rolls through the standard Receiving process</li>
            <li>Sell lottery tickets at POS through Quick Items (automatically configured)</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={() => {
            const url = createPageUrl('BackOffice');
            window.location.href = `${url}?tab=list`;
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Go to Inventory Manager
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}