import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CustomerProfile, LoyaltyProgram } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, CheckCircle, Gift, Sparkles } from "lucide-react";

export default function EnrollmentPage() {
  const location = useLocation();
  const [enrollmentData, setEnrollmentData] = useState({
    full_name: '',
    phone: '',
    email: '',
    birthdate: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    marketing_consent: false,
    terms_accepted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(location.search);
    const phone = params.get('phone');
    
    if (phone) {
      setEnrollmentData(prev => ({ ...prev, phone: decodeURIComponent(phone) }));
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!enrollmentData.terms_accepted) {
      alert('Please accept the terms and conditions to continue');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create CustomerProfile
      const newProfile = await CustomerProfile.create({
        customer_id: `CUST-${Date.now()}`,
        phone_number: enrollmentData.phone,
        email: enrollmentData.email || null,
        full_name: enrollmentData.full_name,
        purchase_history: {
          total_visits: 0,
          total_spent: 0,
          favorite_items: [],
          last_visit: null,
          average_basket_size: 0
        },
        privacy_settings: {
          data_sharing_consent: enrollmentData.marketing_consent,
          marketing_consent: enrollmentData.marketing_consent,
          location_tracking_consent: false
        }
      });

      // Create LoyaltyProgram entry
      await LoyaltyProgram.create({
        program_name: 'FuelFlow Rewards',
        customer_phone: enrollmentData.phone,
        customer_email: enrollmentData.email || null,
        points_balance: 100, // Welcome bonus
        tier_status: 'bronze',
        total_spent: 0,
        last_visit: new Date().toISOString(),
        active: true
      });

      // Generate QR code
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(enrollmentData.phone)}`;
      setQrCodeUrl(qrUrl);

      // Send confirmation email
      if (enrollmentData.email) {
        try {
          await SendEmail({
            from_name: 'FuelFlow Rewards',
            to: enrollmentData.email,
            subject: 'Welcome to FuelFlow Rewards - Enrollment Complete!',
            body: `Hi ${enrollmentData.full_name},\n\nCongratulations! Your FuelFlow Rewards enrollment is complete.\n\n🎁 You've earned 100 welcome bonus points ($1.00 value)!\n\nYour loyalty phone number: ${enrollmentData.phone}\n\nHow to use your rewards:\n• Provide your phone number at checkout\n• Scan your QR code (attached to this email)\n• Earn 1 point per $1 spent\n• Redeem points for discounts\n\nTier Benefits:\n• Bronze: 1x points\n• Silver: 1.5x points (spend $500+)\n• Gold: 2x points + exclusive offers (spend $1000+)\n• Platinum: 3x points + VIP perks (spend $2500+)\n\nThank you for joining FuelFlow Rewards!\n\nHave questions? Contact us at support@fuelflow.com\n\nThe FuelFlow Team`
          });
        } catch (emailError) {
          console.warn('Could not send confirmation email:', emailError);
        }
      }

      setIsComplete(true);

    } catch (error) {
      console.error('Error completing enrollment:', error);
      alert('Failed to complete enrollment. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Enrollment Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-6 text-center">
              <Gift className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Welcome Bonus</h3>
              <p className="text-3xl font-bold">100 Points</p>
              <p className="text-sm opacity-90">$1.00 value</p>
            </div>

            <div className="text-center">
              <p className="font-semibold mb-2">Your Loyalty ID</p>
              <p className="text-2xl font-bold text-purple-600">{enrollmentData.phone}</p>
            </div>

            {qrCodeUrl && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">Save or screenshot your QR code</p>
                <div className="bg-white p-4 rounded-lg inline-block border-2 border-gray-200">
                  <img src={qrCodeUrl} alt="Your Loyalty QR Code" className="w-48 h-48" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Show this at checkout to earn points</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                How to Use Your Rewards
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Provide phone number at checkout</li>
                <li>✓ Scan your QR code</li>
                <li>✓ Earn 1 point per $1 spent</li>
                <li>✓ Redeem points for discounts</li>
              </ul>
            </div>

            {enrollmentData.email && (
              <p className="text-sm text-center text-gray-600">
                📧 A confirmation email with your QR code has been sent to <strong>{enrollmentData.email}</strong>
              </p>
            )}

            <Button
              onClick={() => window.location.href = '/'}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Start Shopping & Earning Points
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Star className="w-10 h-10 text-purple-600 fill-purple-600" />
          </div>
          <CardTitle className="text-2xl">Complete Your FuelFlow Rewards Enrollment</CardTitle>
          <p className="text-gray-600 mt-2">Join thousands of members earning rewards on every purchase!</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={enrollmentData.full_name}
                  onChange={(e) => setEnrollmentData({ ...enrollmentData, full_name: e.target.value })}
                  placeholder="John Doe"
                  required
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
                  required
                  disabled
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={enrollmentData.email}
                  onChange={(e) => setEnrollmentData({ ...enrollmentData, email: e.target.value })}
                  placeholder="john@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="birthdate">Birthdate (Optional)</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={enrollmentData.birthdate}
                  onChange={(e) => setEnrollmentData({ ...enrollmentData, birthdate: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  value={enrollmentData.address}
                  onChange={(e) => setEnrollmentData({ ...enrollmentData, address: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>

              <div>
                <Label htmlFor="city">City (Optional)</Label>
                <Input
                  id="city"
                  value={enrollmentData.city}
                  onChange={(e) => setEnrollmentData({ ...enrollmentData, city: e.target.value })}
                  placeholder="Springfield"
                />
              </div>

              <div>
                <Label htmlFor="state">State (Optional)</Label>
                <Input
                  id="state"
                  value={enrollmentData.state}
                  onChange={(e) => setEnrollmentData({ ...enrollmentData, state: e.target.value })}
                  placeholder="CA"
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="zip_code">ZIP Code (Optional)</Label>
                <Input
                  id="zip_code"
                  value={enrollmentData.zip_code}
                  onChange={(e) => setEnrollmentData({ ...enrollmentData, zip_code: e.target.value })}
                  placeholder="12345"
                  maxLength={5}
                />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Welcome Bonus
              </h4>
              <p className="text-sm text-green-800">
                🎁 <strong>100 Points ($1.00 value)</strong> will be added to your account upon enrollment!
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="marketing_consent"
                  checked={enrollmentData.marketing_consent}
                  onCheckedChange={(checked) => setEnrollmentData({ ...enrollmentData, marketing_consent: checked })}
                />
                <label htmlFor="marketing_consent" className="text-sm text-gray-700 cursor-pointer">
                  I want to receive exclusive offers, promotions, and updates via email and SMS
                </label>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms_accepted"
                  checked={enrollmentData.terms_accepted}
                  onCheckedChange={(checked) => setEnrollmentData({ ...enrollmentData, terms_accepted: checked })}
                />
                <label htmlFor="terms_accepted" className="text-sm text-gray-700 cursor-pointer">
                  I accept the <a href="#" className="text-purple-600 underline">Terms & Conditions</a> and <a href="#" className="text-purple-600 underline">Privacy Policy</a> *
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !enrollmentData.terms_accepted}
              className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? 'Completing Enrollment...' : 'Complete Enrollment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}