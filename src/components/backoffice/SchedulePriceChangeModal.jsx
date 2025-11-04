import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

export default function SchedulePriceChangeModal({ recommendation, onClose, onConfirm }) {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("05:00"); // Default to 5 AM

  const handleConfirm = () => {
    const [hours, minutes] = time.split(':').map(Number);
    const scheduleTime = new Date(date);
    scheduleTime.setHours(hours, minutes, 0, 0);
    onConfirm(recommendation.id, scheduleTime);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Fuel Price Change</DialogTitle>
          <DialogDescription>
            Select a date and time to automatically apply the new prices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="p-3 bg-gray-100 rounded-lg text-sm">
            <p>The following recommended prices will be applied:</p>
            <ul className="list-disc list-inside mt-2">
              {recommendation.recommendations.map(r => (
                <li key={r.product_code}>
                  <strong>{r.product_name}:</strong> ${r.recommended_price.toFixed(3)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}