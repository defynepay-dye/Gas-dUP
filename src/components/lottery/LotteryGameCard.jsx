import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, DollarSign, Package } from "lucide-react";

export default function LotteryGameCard({ game, onSellTicket, onRefresh }) {
  const getStockColor = (remaining, total) => {
    const percentage = (remaining / total) * 100;
    if (percentage <= 10) return "text-red-600";
    if (percentage <= 30) return "text-yellow-600";
    return "text-green-600";
  };

  const getStockBadgeColor = (remaining, total) => {
    const percentage = (remaining / total) * 100;
    if (percentage <= 10) return "bg-red-100 text-red-800";
    if (percentage <= 30) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{game.game_name}</CardTitle>
            <p className="text-sm text-gray-500">Game #{game.game_number}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">
              ${game.ticket_price?.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">per ticket</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stock Information */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Stock:</span>
            </div>
            <div className="text-right">
              <Badge className={getStockBadgeColor(game.tickets_remaining, game.roll_size)}>
                {game.tickets_remaining} / {game.roll_size}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                (game.tickets_remaining / game.roll_size) * 100 <= 10 ? 'bg-red-500' :
                (game.tickets_remaining / game.roll_size) * 100 <= 30 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${(game.tickets_remaining / game.roll_size) * 100}%` }}
            />
          </div>

          {/* Game Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Last Ticket:</p>
              <p className="font-medium">#{game.last_ticket_sold || '000'}</p>
            </div>
            <div>
              <p className="text-gray-500">Commission:</p>
              <p className="font-medium">{game.commission_rate || 5}%</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => onSellTicket(game)}
              disabled={game.tickets_remaining <= 0}
              className="flex-1"
              size="sm"
            >
              <Ticket className="w-4 h-4 mr-1" />
              Sell Tickets
            </Button>
            <Button 
              onClick={onRefresh}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
          </div>

          {/* Low Stock Warning */}
          {game.tickets_remaining <= 10 && game.tickets_remaining > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-xs text-yellow-800 font-medium">
                ⚠️ Low Stock Alert: Only {game.tickets_remaining} tickets remaining
              </p>
            </div>
          )}

          {/* Out of Stock */}
          {game.tickets_remaining <= 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs text-red-800 font-medium">
                🚫 Out of Stock: Roll completed
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}