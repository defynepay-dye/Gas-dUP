import React, { useState, useEffect } from 'react';
import { DeliveryOrder, InventoryItem, User } from '@/api/entities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  X,
  AlertCircle,
  Phone,
  MapPin,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

const platformLogos = {
  grubhub: '🍔',
  ubereats: '🚗',
  doordash: '🏃',
  drizly: '🍷',
  vroom: '⚡',
  instacart: '🛒',
  postmates: '📦'
};

const statusColors = {
  new: 'bg-red-100 text-red-800 border-red-300',
  accepted: 'bg-blue-100 text-blue-800 border-blue-300',
  preparing: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ready_for_pickup: 'bg-green-100 text-green-800 border-green-300',
  out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-300',
  delivered: 'bg-gray-100 text-gray-800 border-gray-300',
  cancelled: 'bg-gray-300 text-gray-700 border-gray-400'
};

export default function DeliveryOrderManagementModal({ isOpen, onClose, locationId }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('active');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadOrders();
      loadUser();
      
      // Refresh orders every 15 seconds while modal is open
      const interval = setInterval(loadOrders, 15000);
      return () => clearInterval(interval);
    }
  }, [isOpen, locationId]);

  useEffect(() => {
    filterOrders();
  }, [orders, activeFilter]);

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const allOrders = await DeliveryOrder.filter({
        location_id: locationId
      }, '-placed_at', 50);
      
      setOrders(allOrders || []);
    } catch (error) {
      console.error('Error loading delivery orders:', error);
    }
    setIsLoading(false);
  };

  const filterOrders = () => {
    let filtered = [];
    
    switch (activeFilter) {
      case 'new':
        filtered = orders.filter(o => o.order_status === 'new');
        break;
      case 'active':
        filtered = orders.filter(o => ['new', 'accepted', 'preparing', 'ready_for_pickup'].includes(o.order_status));
        break;
      case 'completed':
        filtered = orders.filter(o => ['delivered', 'cancelled'].includes(o.order_status));
        break;
      default:
        filtered = orders;
    }
    
    setFilteredOrders(filtered);
  };

  const handleAcceptOrder = async (order) => {
    try {
      // Deduct inventory for all items
      let inventorySuccess = true;
      const inventoryErrors = [];
      
      for (const item of order.items) {
        if (item.upc_code) {
          try {
            const inventoryItems = await InventoryItem.filter({ upc_code: item.upc_code, location_id: locationId });
            
            if (inventoryItems && inventoryItems.length > 0) {
              const inventoryItem = inventoryItems[0];
              const currentQty = inventoryItem.inventory_tracking?.quantity_on_hand_singles || 0;
              
              if (currentQty >= item.quantity) {
                await InventoryItem.update(inventoryItem.id, {
                  'inventory_tracking.quantity_on_hand_singles': currentQty - item.quantity
                });
              } else {
                inventorySuccess = false;
                inventoryErrors.push(`${item.product_name}: Only ${currentQty} available`);
              }
            }
          } catch (error) {
            console.error(`Error updating inventory for ${item.product_name}:`, error);
          }
        }
      }
      
      if (!inventorySuccess) {
        alert(`⚠️ Inventory Warning:\n\n${inventoryErrors.join('\n')}\n\nPlease check stock before accepting.`);
        return;
      }
      
      // Update order status
      await DeliveryOrder.update(order.id, {
        order_status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: currentUser?.full_name || 'Staff',
        inventory_deducted: true
      });
      
      await loadOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order. Please try again.');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus, additionalData = {}) => {
    try {
      const updateData = {
        order_status: newStatus,
        ...additionalData
      };
      
      if (newStatus === 'preparing') {
        updateData.prepared_by = currentUser?.full_name || 'Staff';
      } else if (newStatus === 'ready_for_pickup') {
        updateData.ready_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }
      
      await DeliveryOrder.update(orderId, updateData);
      await loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order. Please try again.');
    }
  };

  const handleCancelOrder = async (order) => {
    const reason = prompt('Please enter cancellation reason:');
    if (!reason) return;
    
    try {
      // Reverse inventory deduction if it was done
      if (order.inventory_deducted) {
        for (const item of order.items) {
          if (item.upc_code) {
            try {
              const inventoryItems = await InventoryItem.filter({ upc_code: item.upc_code, location_id: locationId });
              
              if (inventoryItems && inventoryItems.length > 0) {
                const inventoryItem = inventoryItems[0];
                const currentQty = inventoryItem.inventory_tracking?.quantity_on_hand_singles || 0;
                
                await InventoryItem.update(inventoryItem.id, {
                  'inventory_tracking.quantity_on_hand_singles': currentQty + item.quantity
                });
              }
            } catch (error) {
              console.error(`Error reversing inventory for ${item.product_name}:`, error);
            }
          }
        }
      }
      
      await DeliveryOrder.update(order.id, {
        order_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        inventory_deducted: false
      });
      
      await loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
    }
  };

  const getStatusActions = (order) => {
    const actions = [];
    
    switch (order.order_status) {
      case 'new':
        actions.push(
          <Button
            key="accept"
            onClick={() => handleAcceptOrder(order)}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Accept Order
          </Button>
        );
        actions.push(
          <Button
            key="reject"
            onClick={() => handleCancelOrder(order)}
            variant="destructive"
            className="flex-1"
            size="lg"
          >
            <X className="w-5 h-5 mr-2" />
            Reject
          </Button>
        );
        break;
      
      case 'accepted':
        actions.push(
          <Button
            key="preparing"
            onClick={() => handleUpdateStatus(order.id, 'preparing')}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700"
            size="lg"
          >
            <Package className="w-5 h-5 mr-2" />
            Start Preparing
          </Button>
        );
        break;
      
      case 'preparing':
        actions.push(
          <Button
            key="ready"
            onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Mark Ready
          </Button>
        );
        break;
      
      case 'ready_for_pickup':
        if (order.delivery_type === 'pickup') {
          actions.push(
            <Button
              key="picked-up"
              onClick={() => handleUpdateStatus(order.id, 'delivered')}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Customer Picked Up
            </Button>
          );
        } else {
          actions.push(
            <Badge key="waiting" className="bg-purple-600 text-white text-lg p-3">
              <Truck className="w-5 h-5 mr-2" />
              Waiting for Driver
            </Badge>
          );
        }
        break;
    }
    
    // Always show cancel button for active orders
    if (['accepted', 'preparing'].includes(order.order_status)) {
      actions.push(
        <Button
          key="cancel"
          onClick={() => handleCancelOrder(order)}
          variant="outline"
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      );
    }
    
    return actions;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl">Delivery Order Management</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="new" className="flex-1">
              New Orders
              <Badge className="ml-2 bg-red-600">
                {orders.filter(o => o.order_status === 'new').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1">
              Active
              <Badge className="ml-2 bg-blue-600">
                {orders.filter(o => ['accepted', 'preparing', 'ready_for_pickup'].includes(o.order_status)).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">
              Completed
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 py-6">
              {isLoading ? (
                <div className="text-center py-12 text-gray-500">Loading orders...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No orders in this category</p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <Card key={order.id} className={`${statusColors[order.order_status]} border-2 ${order.order_status === 'new' ? 'animate-pulse' : ''}`}>
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">{platformLogos[order.platform] || '📦'}</div>
                          <div>
                            <h3 className="text-xl font-bold">{order.customer_name}</h3>
                            <p className="text-sm opacity-75 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {format(new Date(order.placed_at), 'h:mm a')}
                              {order.requested_delivery_time && (
                                <span>• Requested: {format(new Date(order.requested_delivery_time), 'h:mm a')}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${statusColors[order.order_status]} text-base px-3 py-1`}>
                            {order.order_status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <p className="text-2xl font-bold mt-2">${order.total_amount.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {/* Customer Info */}
                      {(order.customer_phone || order.customer_address) && (
                        <div className="mb-4 p-3 bg-white/50 rounded-lg space-y-1">
                          {order.customer_phone && (
                            <p className="text-sm flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {order.customer_phone}
                            </p>
                          )}
                          {order.customer_address && (
                            <p className="text-sm flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {order.customer_address}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Items */}
                      <div className="mb-4 space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between p-2 bg-white/50 rounded">
                            <div className="flex-1">
                              <p className="font-medium">{item.quantity}x {item.product_name}</p>
                              {item.modifiers && item.modifiers.length > 0 && (
                                <p className="text-xs opacity-75">+ {item.modifiers.join(', ')}</p>
                              )}
                              {item.special_instructions && (
                                <p className="text-xs text-red-700 font-semibold">⚠️ {item.special_instructions}</p>
                              )}
                            </div>
                            <p className="font-bold">${item.total_price.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      
                      {/* Special Instructions */}
                      {order.special_instructions && (
                        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                          <p className="font-semibold text-yellow-900 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Special Instructions:
                          </p>
                          <p className="text-sm text-yellow-800 mt-1">{order.special_instructions}</p>
                        </div>
                      )}
                      
                      {/* Driver Info */}
                      {order.driver_info && order.driver_info.name && (
                        <div className="mb-4 p-3 bg-purple-100 border border-purple-300 rounded-lg">
                          <p className="font-semibold text-purple-900 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Driver: {order.driver_info.name}
                          </p>
                          {order.driver_info.eta_minutes && (
                            <p className="text-sm text-purple-800 mt-1">ETA: {order.driver_info.eta_minutes} minutes</p>
                          )}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        {getStatusActions(order)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}