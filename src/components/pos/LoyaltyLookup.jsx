import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoyaltyProgram, CustomerProfile, CustomerCart } from "@/api/entities"; // NEW: Import CustomerCart
import { SendEmail } from "@/api/integrations";
import { Phone, QrCode, Star, Gift, TrendingUp, Sparkles, X, DollarSign, UserPlus, Mail, Zap } from "lucide-react";

export default function LoyaltyLookup({ onCustomerSelected, onClose, currentCart = [], currentLocationId }) { // NEW: currentLocationId
  const [lookupMethod, setLookupMethod] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [customer, setCustomer] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // Enrollment states
  const [showEnrollmentOptions, setShowEnrollmentOptions] = useState(false);
  const [enrollmentMode, setEnrollmentMode] = useState(null); // 'quick' or 'link'
  const [enrollmentData, setEnrollmentData] = useState({
    full_name: '',
    phone: '',
    email: ''
  });
  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleLookup = async () => {
    setIsSearching(true);
    setShowEnrollmentOptions(false);
    
    try {
      const searchValue = lookupMethod === 'phone' ? phoneNumber : qrInput;
      
      const loyaltyResults = await LoyaltyProgram.filter({ customer_phone: searchValue });
      
      if (loyaltyResults && loyaltyResults.length > 0) {
        const loyaltyCustomer = loyaltyResults[0];
        
        const profileResults = await CustomerProfile.filter({ phone_number: searchValue });
        const profile = profileResults && profileResults.length > 0 ? profileResults[0] : null;
        
        const fullCustomer = {
          ...loyaltyCustomer,
          profile: profile,
          available_points: loyaltyCustomer.points_balance || 0,
          available_dollars: ((loyaltyCustomer.points_balance || 0) * 0.01),
          // NEW: Add a placeholder for redemption_amount from loyalty settings if available
          redemption_amount: 0 // This would come from a redemption choice or an active offer
        };

        // NEW: Check for existing active/held CustomerCart
        let activeCustomerCart = null;
        if (fullCustomer.id && currentLocationId) {
            const customerCarts = await CustomerCart.filter({
                customer_id: fullCustomer.id,
                cart_status: ['active', 'held'],
                location_id: currentLocationId
            });
            activeCustomerCart = customerCarts.find(cart => cart.cart_status === 'active') || customerCarts[0]; // Prioritize active, then any held
        }
        
        setCustomer(fullCustomer);
        
        if (fullCustomer.customer_phone) {
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullCustomer.customer_phone)}`;
          setQrCodeUrl(qrUrl);
        }
        
        await loadAIRecommendations(fullCustomer, currentCart);
        
        if (onCustomerSelected) {
          onCustomerSelected(fullCustomer, activeCustomerCart); // NEW: Pass activeCustomerCart
        }
      } else {
        // Customer not found - show enrollment options
        setShowEnrollmentOptions(true);
        setEnrollmentData(prev => ({ ...prev, phone: searchValue }));
      }
    } catch (error) {
      console.error('Error looking up customer:', error);
      alert('Error looking up customer');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickEnroll = async () => {
    if (!enrollmentData.full_name || !enrollmentData.phone) {
      alert('Please enter customer name and phone number');
      return;
    }

    setIsEnrolling(true);
    
    try {
      // Create CustomerProfile
      const newProfile = await CustomerProfile.create({
        customer_id: `CUST-${Date.now()}`,
        phone_number: enrollmentData.phone,
        email: enrollmentData.email || null,
        full_name: enrollmentData.full_name,
        purchase_history: {
          total_visits: 1,
          total_spent: 0,
          favorite_items: [],
          last_visit: new Date().toISOString(),
          average_basket_size: 0
        }
      });

      // Create LoyaltyProgram entry
      const newLoyalty = await LoyaltyProgram.create({
        program_name: 'FuelFlow Rewards',
        customer_phone: enrollmentData.phone,
        customer_email: enrollmentData.email || null,
        points_balance: 100, // Welcome bonus
        tier_status: 'bronze',
        total_spent: 0,
        last_visit: new Date().toISOString(),
        active: true
      });

      const fullCustomer = {
        ...newLoyalty,
        profile: newProfile,
        available_points: 100,
        available_dollars: 1.00,
        redemption_amount: 0 // Default for new enrollment
      };

      // Generate QR code
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(enrollmentData.phone)}`;
      setQrCodeUrl(qrUrl);

      // AI-driven welcome offer based on cart
      await loadAIRecommendations(fullCustomer, currentCart);

      setCustomer(fullCustomer);
      setShowEnrollmentOptions(false);
      setEnrollmentMode(null);

      // Send welcome email if email provided
      if (enrollmentData.email) {
        try {
          await SendEmail({
            to: enrollmentData.email,
            subject: 'Welcome to FuelFlow Rewards!',
            body: `Hi ${enrollmentData.full_name},\n\nWelcome to FuelFlow Rewards! You've been enrolled and earned 100 welcome bonus points ($1.00 value).\n\nYour phone number is your loyalty ID: ${enrollmentData.phone}\n\nStart earning points on every purchase!\n\nThank you for choosing FuelFlow.`
          });
        } catch (emailError) {
          console.warn('Could not send welcome email:', emailError);
        }
      }

      if (onCustomerSelected) {
        onCustomerSelected(fullCustomer);
      }

      alert(`✅ ${enrollmentData.full_name} enrolled successfully!\n\n🎁 100 Welcome Bonus Points Added ($1.00 value)`);
      
    } catch (error) {
      console.error('Error enrolling customer:', error);
      alert('Failed to enroll customer. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleSendEnrollmentLink = async () => {
    if (!enrollmentData.phone && !enrollmentData.email) {
      alert('Please enter phone number or email to send enrollment link');
      return;
    }

    if (!enrollmentData.email) {
      alert('Email is required to send enrollment link');
      return;
    }

    setIsEnrolling(true);

    try {
      const enrollmentToken = `${enrollmentData.phone}-${Date.now()}`;
      const enrollmentLink = `${window.location.origin}/EnrollmentPage?token=${enrollmentToken}&phone=${encodeURIComponent(enrollmentData.phone)}`;

      await SendEmail({
        from_name: 'FuelFlow Rewards',
        to: enrollmentData.email,
        subject: 'Complete Your FuelFlow Rewards Enrollment',
        body: `Hi there,\n\nThank you for your interest in FuelFlow Rewards!\n\nClick the link below to complete your enrollment and start earning points:\n\n${enrollmentLink}\n\n🎁 You'll receive 100 welcome bonus points just for signing up!\n\nThis link will expire in 24 hours.\n\nThank you for choosing FuelFlow.`
      });

      alert(`✅ Enrollment link sent to ${enrollmentData.email}\n\nCustomer can complete registration at their convenience.`);
      
      setShowEnrollmentOptions(false);
      setEnrollmentMode(null);
      onClose();

    } catch (error) {
      console.error('Error sending enrollment link:', error);
      alert('Failed to send enrollment link. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const loadAIRecommendations = async (customer, cart) => {
    const recommendations = [];
    
    const history = customer.profile?.purchase_history;
    if (history && history.favorite_items && history.favorite_items.length > 0) {
      recommendations.push({
        type: 'favorite',
        title: 'Your Favorites',
        items: history.favorite_items.slice(0, 3),
        icon: Star,
        color: 'text-yellow-600'
      });
    }
    
    if (cart && cart.length > 0) {
      const hasFuel = cart.some(item => item.is_fuel);
      if (hasFuel) {
        recommendations.push({
          type: 'upsell',
          title: 'Perfect for Your Trip',
          items: [
            { product_name: 'Premium Coffee - Large', discount: '10% off' },
            { product_name: 'Energy Drink 2-Pack', discount: '15% off' }
          ],
          icon: TrendingUp,
          color: 'text-green-600'
      });
      }
    }
    
    if (customer.tier_status === 'gold' || customer.tier_status === 'platinum') {
      recommendations.push({
        type: 'vip',
        title: `${customer.tier_status.toUpperCase()} Member Exclusive`,
        items: [
          { product_name: 'Free Car Wash Upgrade', discount: 'Today Only' },
          { product_name: 'Double Points on Fuel', discount: 'This Week' }
        ],
        icon: Sparkles,
        color: 'text-purple-600'
      });
    }
    
    // New customer welcome offer
    if (!customer.profile || customer.profile.purchase_history?.total_visits === 1) {
      recommendations.push({
        type: 'welcome',
        title: '🎉 Welcome Offer!',
        items: [
          { product_name: '100 Bonus Points Added', discount: '$1.00 value' },
          { product_name: 'Free Coffee', discount: 'Next Visit' }
        ],
        icon: Zap,
        color: 'text-blue-600'
      });
    }
    
    setAiRecommendations(recommendations);
  };

  // Customer found view
  if (customer) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                Loyalty Member
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">
                      {customer.profile?.full_name || customer.customer_phone}
                    </h3>
                    <Badge className="bg-yellow-400 text-purple-900 mb-2">
                      {customer.tier_status?.toUpperCase() || 'MEMBER'}
                    </Badge>
                    <p className="text-sm opacity-90">{customer.customer_phone}</p>
                    {customer.customer_email && (
                      <p className="text-sm opacity-90">{customer.customer_email}</p>
                    )}
                  </div>
                  {qrCodeUrl && (
                    <div className="bg-white p-2 rounded-lg">
                      <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <p className="text-sm opacity-90">Points Balance</p>
                    <p className="text-3xl font-bold">{customer.available_points}</p>
                    <p className="text-xs opacity-75">= ${customer.available_dollars.toFixed(2)} value</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <p className="text-sm opacity-90">Lifetime Savings</p>
                    <p className="text-3xl font-bold">${((customer.total_spent || 0) * 0.05).toFixed(2)}</p>
                    <p className="text-xs opacity-75">You've saved 5%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-green-600" />
                  Quick Redemption
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 20, 50].map(amount => (
                    <Button
                      key={amount}
                      onClick={() => {
                        /* redemption logic handled in parent */
                      }}
                      disabled={customer.available_dollars < amount}
                      className="h-16 flex flex-col"
                      variant={customer.available_dollars >= amount ? "default" : "outline"}
                    >
                      <DollarSign className="w-5 h-5" />
                      <span className="text-lg font-bold">${amount}</span>
                      <span className="text-xs">{amount * 100} pts</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {aiRecommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI Recommendations for You
                </h4>
                {aiRecommendations.map((rec, index) => {
                  const Icon = rec.icon;
                  return (
                    <Card key={index} className="border-l-4 border-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 ${rec.color}`} />
                          <h5 className="font-semibold text-sm">{rec.title}</h5>
                        </div>
                        <div className="space-y-1">
                          {rec.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.product_name}</span>
                              {item.discount && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.discount}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {customer.profile?.purchase_history && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Your Activity</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">
                        {customer.profile.purchase_history.total_visits || 0}
                      </p>
                      <p className="text-xs text-gray-600">Total Visits</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        ${(customer.profile.purchase_history.total_spent || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-600">Total Spent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        ${(customer.profile.purchase_history.average_basket_size || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-600">Avg. Basket</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button onClick={onClose} className="flex-1 bg-purple-600 hover:bg-purple-700">
              Continue to Checkout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Enrollment options view (when customer not found)
  if (showEnrollmentOptions) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Customer Not Found - Enroll Now
            </DialogTitle>
          </DialogHeader>

          {!enrollmentMode ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-800 mb-1">
                  <strong>Phone: {enrollmentData.phone}</strong>
                </p>
                <p className="text-xs text-blue-600">Not found in loyalty program</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => setEnrollmentMode('quick')}
                  className="w-full h-20 bg-green-600 hover:bg-green-700 flex flex-col"
                >
                  <Zap className="w-6 h-6 mb-1" />
                  <span className="font-bold">Quick Enroll</span>
                  <span className="text-xs opacity-90">Sign them up now (30 seconds)</span>
                </Button>

                <Button
                  onClick={() => setEnrollmentMode('link')}
                  className="w-full h-20 bg-blue-600 hover:bg-blue-700 flex flex-col"
                  variant="outline"
                >
                  <Mail className="w-6 h-6 mb-1" />
                  <span className="font-bold">Send Enrollment Link</span>
                  <span className="text-xs opacity-90">Customer completes later</span>
                </Button>
              </div>

              <div className="text-center">
                <Button variant="ghost" onClick={onClose} className="text-sm">
                  Skip for now
                </Button>
              </div>
            </div>
          ) : enrollmentMode === 'quick' ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={enrollmentData.full_name}
                    onChange={(e) => setEnrollmentData({ ...enrollmentData, full_name: e.target.value })}
                    placeholder="Enter customer's full name"
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={enrollmentData.phone}
                    onChange={(e) => setEnrollmentData({ ...enrollmentData, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="(555) 123-4567"
                    maxLength={10}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={enrollmentData.email}
                    onChange={(e) => setEnrollmentData({ ...enrollmentData, email: e.target.value })}
                    placeholder="customer@email.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">For digital receipts and offers</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>🎁 Welcome Bonus:</strong> 100 points ($1.00 value)
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEnrollmentMode(null);
                    setEnrollmentData({ full_name: '', phone: enrollmentData.phone, email: '' });
                  }}
                  disabled={isEnrolling}
                >
                  Back
                </Button>
                <Button
                  onClick={handleQuickEnroll}
                  disabled={isEnrolling || !enrollmentData.full_name || !enrollmentData.phone}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isEnrolling ? 'Enrolling...' : 'Enroll Customer'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="link_email">Customer Email *</Label>
                  <Input
                    id="link_email"
                    type="email"
                    value={enrollmentData.email}
                    onChange={(e) => setEnrollmentData({ ...enrollmentData, email: e.target.value })}
                    placeholder="customer@email.com"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">We'll send enrollment link here</p>
                </div>

                <div>
                  <Label htmlFor="link_phone">Phone Number</Label>
                  <Input
                    id="link_phone"
                    type="tel"
                    value={enrollmentData.phone}
                    onChange={(e) => setEnrollmentData({ ...enrollmentData, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="(555) 123-4567"
                    maxLength={10}
                    disabled
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  📧 Customer will receive an email with a secure link to complete their enrollment at their convenience.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEnrollmentMode(null);
                    setEnrollmentData({ full_name: '', phone: enrollmentData.phone, email: '' });
                  }}
                  disabled={isEnrolling}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSendEnrollmentLink}
                  disabled={isEnrolling || !enrollmentData.email}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isEnrolling ? 'Sending...' : 'Send Link'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Initial lookup view
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Loyalty Member Lookup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={lookupMethod === 'phone' ? 'default' : 'outline'}
              onClick={() => setLookupMethod('phone')}
              className="h-12"
            >
              <Phone className="w-4 h-4 mr-2" />
              Phone Number
            </Button>
            <Button
              variant={lookupMethod === 'qr' ? 'default' : 'outline'}
              onClick={() => setLookupMethod('qr')}
              className="h-12"
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </Button>
          </div>

          {lookupMethod === 'phone' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Phone Number</label>
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                className="text-lg h-12"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter 10-digit phone number
              </p>
            </div>
          )}

          {lookupMethod === 'qr' && (
            <div>
              <label className="text-sm font-medium mb-2 block">QR Code Scanner</label>
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-3">
                  Scan customer's loyalty QR code
                </p>
                <Input
                  type="text"
                  placeholder="Or paste QR code data"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  className="max-w-xs mx-auto"
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleLookup}
            disabled={isSearching || (lookupMethod === 'phone' && phoneNumber.length < 10) || (lookupMethod === 'qr' && !qrInput)}
            className="w-full h-12 text-base bg-purple-600 hover:bg-purple-700"
          >
            {isSearching ? 'Searching...' : 'Look Up Customer'}
          </Button>

          <div className="text-center">
            <Button variant="link" className="text-sm" onClick={() => setShowEnrollmentOptions(true)}>
              Not a member? Sign up now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}