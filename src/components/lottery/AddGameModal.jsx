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
import { Ticket, DollarSign, Hash, Package, Percent } from "lucide-react";

export default function AddGameModal({ onAdd, onClose }) {
  const [gameData, setGameData] = useState({
    game_name: '',
    game_number: '',
    ticket_price: '',
    roll_size: '300',
    commission_rate: '5'
  });

  const handleSubmit = () => {
    if (gameData.game_name && gameData.game_number && gameData.ticket_price) {
      onAdd({
        ...gameData,
        ticket_price: parseFloat(gameData.ticket_price),
        roll_size: parseInt(gameData.roll_size),
        commission_rate: parseFloat(gameData.commission_rate),
        active: true
      });
    }
  };

  const handleInputChange = (field, value) => {
    setGameData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Add New Lottery Game
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="game_name">Game Name</Label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="game_name"
                value={gameData.game_name}
                onChange={(e) => handleInputChange('game_name', e.target.value)}
                placeholder="e.g., Lucky 7s"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="game_number">Game Number</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="game_number"
                value={gameData.game_number}
                onChange={(e) => handleInputChange('game_number', e.target.value)}
                placeholder="e.g., 1234"
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticket_price">Ticket Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="ticket_price"
                  type="number"
                  step="0.01"
                  value={gameData.ticket_price}
                  onChange={(e) => handleInputChange('ticket_price', e.target.value)}
                  placeholder="1.00"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roll_size">Roll Size</Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="roll_size"
                  type="number"
                  value={gameData.roll_size}
                  onChange={(e) => handleInputChange('roll_size', e.target.value)}
                  placeholder="300"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_rate">Commission Rate (%)</Label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="commission_rate"
                type="number"
                step="0.1"
                value={gameData.commission_rate}
                onChange={(e) => handleInputChange('commission_rate', e.target.value)}
                placeholder="5.0"
                className="pl-10"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={!gameData.game_name || !gameData.game_number || !gameData.ticket_price}
          >
            Add Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}