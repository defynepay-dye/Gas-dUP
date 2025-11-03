import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Ticket, DollarSign, Package, Calculator } from "lucide-react";

export default function SellTicketModal({ game, onSell, onClose }) {
  const [ticketCount, setTicketCount] = useState('1');

  const handleSubmit = () => {
    const count = parseInt(ticketCount);
    if (count > 0 && count <= game.tickets_remaining) {
      onSell(game, count);
    }
  };

  const totalPrice = (parseInt(ticketCount) || 0) * (game.ticket_price || 0);
  const maxTickets = Math.min(game.tickets_remaining, 50); // Limit to 50 tickets per transaction

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Sell {game.game_name} Tickets
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Game Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Game:</p>
                <p className="font-semibold">{game.game_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Price:</p>
                <p className="font-semibold">${game.ticket_price?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Available:</p>
                <p className="font-semibold">{game.tickets_remaining} tickets</p>
              </div>
              <div>
                <p className="text-gray-600">Game #:</p>
                <p className="font-semibold">{game.game_number}</p>
              </div>
            </div>
          </div>

          {/* Ticket Count Input */}
          <div className="space-y-2">
            <Label htmlFor="ticket_count">Number of Tickets</Label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="ticket_count"
                type="number"
                min="1"
                max={maxTickets}
                value={ticketCount}
                onChange={(e) => setTicketCount(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500">
              Maximum: {maxTickets} tickets
            </p>
          </div>

          {/* Quick Selection Buttons */}
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 5, 10, 20].filter(num => num <= maxTickets).map(num => (
                <Button
                  key={num}
                  size="sm"
                  variant="outline"
                  onClick={() => setTicketCount(num.toString())}
                  className="text-xs"
                >
                  {num}
                </Button>
              ))}
              {maxTickets > 20 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTicketCount(maxTickets.toString())}
                  className="text-xs"
                >
                  Max ({maxTickets})
                </Button>
              )}
            </div>
          </div>

          {/* Total Calculation */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-green-600" />
                <span className="font-medium">Total:</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            {parseInt(ticketCount) > 1 && (
              <p className="text-xs text-green-600 mt-1">
                {ticketCount} × ${game.ticket_price?.toFixed(2)} = ${totalPrice.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={!ticketCount || parseInt(ticketCount) <= 0 || parseInt(ticketCount) > maxTickets}
            className="bg-green-600 hover:bg-green-700"
          >
            <DollarSign className="w-4 h-4 mr-1" />
            Sell for ${totalPrice.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}