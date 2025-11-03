import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Plus } from "lucide-react";

export default function LotteryPanel({ lotteryGames, onAddToCart, isLoading }) {

  const handleSellOne = (game) => {
    onAddToCart(game, 1);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Lottery Tickets
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto">
            {lotteryGames.map((game) => (
              <div key={game.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{game.game_name}</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">${game.ticket_price.toFixed(2)}</Badge>
                    <span className="text-gray-500">
                      {game.tickets_remaining} left
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSellOne(game)}
                  disabled={game.tickets_remaining <= 0}
                >
                  <Plus className="w-4 h-4 mr-1" /> Sell
                </Button>
              </div>
            ))}
            
            {lotteryGames.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                <Ticket className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No active lottery games</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}