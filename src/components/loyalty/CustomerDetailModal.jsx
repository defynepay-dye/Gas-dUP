import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoyaltyProgram, CustomerProfile, POSTransaction, PersonalizedOffer } from "@/api/entities";
import { User, Phone, Mail, MapPin, Calendar, DollarSign, ShoppingCart, Gift, History, Edit, Save, X } from "lucide-react";
import { format } from "date-fns";

export default function CustomerDetailModal({ customer, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState({
    program_name: customer.profile?.full_name || customer.program_name || '',
    customer_email: customer.customer_email || '',
    tier_status: customer.tier_status || 'bronze'
  });
  const [transactions, setTransactions] = useState([]);
  const [offers, setOffers] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  useEffect(() => {
    loadCustomerActivity();
  }, [customer]);

  const loadCustomerActivity = async () => {
    setIsLoadingTransactions(true);
    try {
      // Load recent transactions
      const txnData = await POSTransaction.filter({ 
        customer_id: customer.customer_phone 
      }, '-created_date', 10);
      setTransactions(txnData || []);

      // Load personalized offers for this customer
      const offerData = await PersonalizedOffer.list();
      setOffers(offerData || []);
    } catch (error) {
      console.error("Error loading customer activity:", error);
    }
    setIsLoadingTransactions(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await LoyaltyProgram.update(customer.id, {
        program_name: editedData.program_name,
        customer_email: editedData.customer_email,
        tier_status: editedData.tier_status
      });

      if (customer.profile) {
        await CustomerProfile.update(customer.profile.id, {
          full_name: editedData.program_name,
          email: editedData.customer_email
        });
      }

      alert('Customer information updated successfully!');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating customer:", error);
      alert('Failed to update customer information');
    }
    setIsSaving(false);
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: "bg-orange-100 text-orange-800",
      silver: "bg-gray-100 text-gray-800",
      gold: "bg-yellow-100 text-yellow-800",
      platinum: "bg-purple-100 text-purple-800"
    };
    return colors[tier] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Profile</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg mb-4">Basic Information</h4>
                    
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={editedData.program_name}
                          onChange={(e) => setEditedData({ ...editedData, program_name: e.target.value })}
                        />
                      ) : (
                        <p className="mt-1 text-sm">{customer.profile?.full_name || customer.program_name || 'N/A'}</p>
                      )}
                    </div>

                    <div>
                      <Label>Phone Number</Label>
                      <p className="mt-1 text-sm flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {customer.customer_phone}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={editedData.customer_email}
                          onChange={(e) => setEditedData({ ...editedData, customer_email: e.target.value })}
                        />
                      ) : (
                        <p className="mt-1 text-sm flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {customer.customer_email || 'Not provided'}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="tier">Membership Tier</Label>
                      {isEditing ? (
                        <select
                          id="tier"
                          value={editedData.tier_status}
                          onChange={(e) => setEditedData({ ...editedData, tier_status: e.target.value })}
                          className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2"
                        >
                          <option value="bronze">Bronze</option>
                          <option value="silver">Silver</option>
                          <option value="gold">Gold</option>
                          <option value="platinum">Platinum</option>
                        </select>
                      ) : (
                        <div className="mt-1">
                          <Badge className={getTierColor(customer.tier_status)}>
                            {customer.tier_status?.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {customer.profile?.birthdate && (
                      <div>
                        <Label>Birthday</Label>
                        <p className="mt-1 text-sm flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {format(new Date(customer.profile.birthdate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Loyalty Stats */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg mb-4">Loyalty Statistics</h4>
                    
                    <Card className="bg-gradient-to-br from-purple-100 to-pink-100">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-700">Points Balance</span>
                          <Gift className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-3xl font-bold text-purple-600">{customer.points_balance}</p>
                        <p className="text-sm text-gray-600">${(customer.points_balance * 0.01).toFixed(2)} value</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-100 to-blue-100">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-700">Total Spent</span>
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-green-600">${customer.total_spent.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Lifetime value</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-100 to-indigo-100">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-700">Last Visit</span>
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-lg font-semibold text-blue-600">
                          {customer.last_visit ? format(new Date(customer.last_visit), 'MMM d, yyyy') : 'Never'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {customer.profile?.purchase_history?.total_visits || 0} total visits
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-lg mb-4">Purchase Activity</h4>
                {isLoadingTransactions ? (
                  <p className="text-center py-8">Loading transactions...</p>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((txn, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">Transaction #{txn.transaction_number}</p>
                            <p className="text-sm text-gray-600">
                              {format(new Date(txn.created_date), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <p className="text-lg font-bold text-green-600">${txn.total_amount.toFixed(2)}</p>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{txn.items?.length || 0} items</p>
                          {txn.promotion_discount > 0 && (
                            <p className="text-purple-600">
                              Saved: ${txn.promotion_discount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-lg mb-4">Personalized Offers</h4>
                {offers.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No offers available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {offers.slice(0, 5).map((offer, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{offer.offer_name}</p>
                            <p className="text-sm text-gray-600">{offer.offer_type}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            {offer.offer_value?.discount_type === 'fixed_amount' 
                              ? `$${offer.offer_value.discount_amount} off`
                              : `${offer.offer_value?.discount_amount}% off`
                            }
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Valid until: {format(new Date(offer.valid_until), 'MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-lg mb-4">Points History</h4>
                <div className="space-y-3">
                  {customer.profile?.purchase_history?.total_visits > 0 ? (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-600">Points earned from purchases</p>
                      <p className="text-2xl font-bold text-green-600">+{Math.floor(customer.total_spent)}</p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No points history yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}