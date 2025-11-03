
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format, subDays } from 'date-fns';
import { FuelReconciliation, Transaction, FuelReceiving, FuelTank } from '@/api/entities';

export default function FuelReconciliationModal({ tank, onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 1), to: new Date() });
  const [startLevel, setStartLevel] = useState('');
  const [endLevel, setEndLevel] = useState('');
  const [calculation, setCalculation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Pre-fill start level if available
    setStartLevel(tank.current_physical_level?.toString() || '');
  }, [tank]);
  
  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const from = dateRange.from.toISOString();
      const to = dateRange.to.toISOString();

      // Fetch Sales
      const transactions = await Transaction.filter({
        status: "completed",
        product_code: tank.product_code,
        created_date: { "$gte": from, "$lte": to }
      });
      const totalSales = transactions.reduce((sum, t) => sum + (t.quantity_gallons || 0), 0);
      
      // Fetch Deliveries
      const deliveries = await FuelReceiving.filter({
          "fuel_deliveries.product_code": tank.product_code,
          delivery_date: { "$gte": from, "$lte": to }
      });
      const totalDeliveries = deliveries.flatMap(d => d.fuel_deliveries)
        .filter(fd => fd.product_code === tank.product_code)
        .reduce((sum, fd) => sum + (fd.gallons_delivered || 0), 0);

      const startingInv = parseFloat(startLevel);
      const endingInv = parseFloat(endLevel);
      const calculatedEnd = startingInv + totalDeliveries - totalSales;
      const variance = endingInv - calculatedEnd;
      
      setCalculation({
        totalSales,
        totalDeliveries,
        calculatedEnd,
        variance,
        startingInv,
        endingInv,
      });
      setStep(2);
    } catch (error) {
      console.error("Reconciliation calculation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await FuelReconciliation.create({
        tank_id: tank.id,
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
        starting_physical_inventory: calculation.startingInv,
        ending_physical_inventory: calculation.endingInv,
        total_sales_gallons: calculation.totalSales,
        total_deliveries_gallons: calculation.totalDeliveries,
        calculated_ending_inventory: calculation.calculatedEnd,
        variance_gallons: calculation.variance,
      });
      // Optionally update the tank's main physical level
      await FuelTank.update(tank.id, {
          current_physical_level: calculation.endingInv,
          last_physical_reading_date: new Date().toISOString()
      });
      onSave();
    } catch (error) {
       console.error("Failed to save reconciliation:", error);
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fuel Reconciliation for {tank.tank_name}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <DialogDescription>Enter the physical inventory readings and date range for this reconciliation period.</DialogDescription>
            <div className="space-y-2">
              <Label>Reconciliation Period</Label>
               <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? `${format(dateRange.from, 'PPp')} - ${format(dateRange.to, 'PPp')}`: "Select date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="range" selected={dateRange} onSelect={setDateRange} />
                </PopoverContent>
              </Popover>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="start-level">Start Physical Level (Gallons)</Label>
                    <Input id="start-level" type="number" value={startLevel} onChange={e => setStartLevel(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="end-level">End Physical Level (Gallons)</Label>
                    <Input id="end-level" type="number" value={endLevel} onChange={e => setEndLevel(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleCalculate} disabled={isLoading || !startLevel || !endLevel}>
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Calculate Variance
                </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && calculation && (
            <div className="space-y-4 py-4">
                 <DialogDescription>Review the calculated variance and save the reconciliation record.</DialogDescription>
                 <div className="p-6 border rounded-lg bg-gray-50/50 space-y-4">
                     <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div><span className="font-medium text-gray-500">Starting Inventory:</span> {calculation.startingInv.toFixed(2)} gal</div>
                        <div><span className="font-medium text-gray-500">Ending Inventory:</span> {calculation.endingInv.toFixed(2)} gal</div>
                        <div><span className="font-medium text-gray-500">(+) Deliveries:</span> <span className="text-green-600">{calculation.totalDeliveries.toFixed(2)} gal</span></div>
                        <div><span className="font-medium text-gray-500">(-) Sales:</span> <span className="text-red-600">{calculation.totalSales.toFixed(2)} gal</span></div>
                     </div>
                     <div className="border-t pt-4">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Calculated Ending Inventory:</span>
                            <span className="font-bold">{calculation.calculatedEnd.toFixed(2)} gal</span>
                        </div>
                         <div className="flex justify-between items-center mt-4">
                            <span className="text-lg font-bold">Variance (Over/Short):</span>
                            <span className={`text-lg font-bold ${calculation.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {calculation.variance.toFixed(2)} gal
                            </span>
                        </div>
                     </div>
                 </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Reconciliation
                    </Button>
                 </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
