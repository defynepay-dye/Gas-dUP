import React, { useState, useEffect } from 'react';
import { DeliveryOrder } from '@/api/entities';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, AlertCircle } from 'lucide-react';

export default function DeliveryOrderAlert({ locationId, onOpenManagement }) {
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [hasNewOrder, setHasNewOrder] = useState(false);

  useEffect(() => {
    loadNewOrders();
    
    // Poll for new orders every 10 seconds
    const interval = setInterval(loadNewOrders, 10000);
    
    return () => clearInterval(interval);
  }, [locationId]);

  const loadNewOrders = async () => {
    try {
      const orders = await DeliveryOrder.filter({
        location_id: locationId,
        order_status: 'new'
      });
      
      const currentCount = orders?.length || 0;
      
      // If count increased, trigger alert
      if (currentCount > newOrdersCount) {
        setHasNewOrder(true);
        playAlertSound();
        
        // Reset flash after 3 seconds
        setTimeout(() => setHasNewOrder(false), 3000);
      }
      
      setNewOrdersCount(currentCount);
    } catch (error) {
      console.error('Error loading delivery orders:', error);
    }
  };

  const playAlertSound = () => {
    // Simple beep sound for new orders
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Could not play alert sound:', error);
    }
  };

  if (newOrdersCount === 0) {
    return null;
  }

  return (
    <Button
      onClick={onOpenManagement}
      className={`relative ${hasNewOrder ? 'animate-pulse bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}
      size="lg"
    >
      <ShoppingBag className="w-5 h-5 mr-2" />
      Delivery Orders
      <Badge className="ml-2 bg-white text-green-900 font-bold">
        {newOrdersCount}
      </Badge>
      {hasNewOrder && (
        <AlertCircle className="w-4 h-4 ml-2 animate-bounce text-yellow-300" />
      )}
    </Button>
  );
}