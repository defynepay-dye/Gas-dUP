
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Smartphone,
  MapPin,
  CreditCard,
  Fuel,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
  Zap,
  DollarSign,
  Droplets
} from 'lucide-react';
import { MobileFuelingSession, Pump, Product, CustomerProfile, Location } from '@/api/entities';

export default function MobileFuelingPage() {
  const [step, setStep] = useState('scan'); // scan, location, auth, payment, fueling, complete, pump_verification
  const [session, setSession] = useState(null);
  const [pump, setPump] = useState(null);
  const [products, setProducts] = useState([]);
  const [location, setLocation] = useState(null);

  // User inputs
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [maxAmount, setMaxAmount] = useState('50');

  // State
  const [userLocation, setUserLocation] = useState(null);
  const [isWithinGeofence, setIsWithinGeofence] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time fueling data
  const [currentGallons, setCurrentGallons] = useState(0);
  const [currentAmount, setCurrentAmount] = useState(0);

  const [nearbyPumps, setNearbyPumps] = useState([]);
  const [selectedPumpConfirmed, setSelectedPumpConfirmed] = useState(false);

  // Haversine formula for distance calculation
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Parse URL parameters on mount
  useEffect(() => {
    // Moved verifyGeofence inside useEffect to satisfy dependencies
    const verifyGeofence = async (userPos) => {
      if (!location) {
        setError('Location data not available for geofence verification.');
        return;
      }

      setIsLoading(true);
      try {
        // Load ALL online pumps at this location
        const allPumps = await Pump.filter({ location_id: location.id, status: 'online' });

        if (allPumps.length === 0) {
          throw new Error('No available pumps at this location.');
        }

        // Calculate distance to each pump
        const pumpsWithDistance = allPumps.map(p => {
          // Use pump-specific GPS if available, otherwise use location coordinates from the entity itself
          // Fallback to hardcoded demo coords if neither are available
          const pumpLat = p.gps_coordinates?.latitude || location.latitude || 40.7128; // Example latitude for demo
          const pumpLon = p.gps_coordinates?.longitude || location.longitude || -74.0060; // Example longitude for demo

          const distance = calculateDistance(
            userPos.latitude,
            userPos.longitude,
            pumpLat,
            pumpLon
          );

          // Dummy products_available for display in demo, would come from Pump entity in real app
          return { ...p, distance, products_available: ['Regular', 'Plus', 'Premium'] };
        });

        // Sort by distance to find the closest pump
        pumpsWithDistance.sort((a, b) => a.distance - b.distance);
        setNearbyPumps(pumpsWithDistance);

        const closestPump = pumpsWithDistance[0];
        const maxDistance = closestPump.gps_coordinates?.accuracy_meters || 15; // Default 15m tolerance

        if (closestPump.distance <= maxDistance) {
          setIsWithinGeofence(true);

          // If a specific pump was scanned (i.e., 'pump' state is set from URL params)
          if (pump) {
            const scannedPump = pumpsWithDistance.find(pItem => pItem.pump_number === pump.pump_number);

            // If the scanned pump is either not found among nearby, or it's not the closest,
            // or its distance is beyond the threshold, prompt for verification.
            if (!scannedPump || scannedPump.distance > maxDistance || closestPump.pump_number !== pump.pump_number) {
              setError(`⚠️ You scanned Pump ${pump.pump_number}, but you appear to be closer to Pump ${closestPump.pump_number} (${closestPump.distance.toFixed(1)}m away). Please verify your pump number.`);
              setStep('pump_verification');
              return;
            }
          }
          // If no specific pump was scanned, or the scanned pump is valid and close enough, proceed.
          setError(''); // Clear any previous errors
          setStep('auth');
        } else {
          setIsWithinGeofence(false);
          setError(`You must be within ${maxDistance}m of a pump. You are currently ${closestPump.distance.toFixed(1)}m from the closest pump (Pump ${closestPump.pump_number}).`);
          setStep('location'); // Stay on location step to show error and prompt re-enable
        }

      } catch (error) {
        console.error('Geofence verification error:', error);
        setError('Unable to verify your location. Please try again. ' + error.message);
        setStep('location'); // Stay on location step if there's an error
      } finally {
        setIsLoading(false);
      }
    };

    // Moved requestLocationPermission inside useEffect to satisfy dependencies
    const requestLocationPermission = () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your device');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(userPos);
          verifyGeofence(userPos); // Now verifyGeofence is defined within this useEffect scope
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Location permission denied. We need your location to verify you are at the pump.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // initializeSession logic updated from code_outline and moved inside useEffect
    const initializeSession = async (locationId, pumpNumber, sessionId) => {
      setIsLoading(true);
      try {
        const [locationData, pumpData, productsData] = await Promise.all([
          Location.filter({ id: locationId }),
          // If pumpNumber is not provided, this filter might need adjustment in a real app,
          // but for the sake of the outline, we'll assume it will either find the pump or return empty.
          // The current outline implies pumpNumber is always present from URL.
          Pump.filter({ location_id: locationId, pump_number: pumpNumber }),
          Product.list()
        ]);

        if (locationData.length === 0 || pumpData.length === 0) {
          throw new Error('Invalid pump or location');
        }

        setLocation(locationData[0]);
        setPump(pumpData[0]);
        setProducts(productsData);

        if (pumpData[0].status !== 'online') {
          throw new Error(`Pump ${pumpNumber} is currently unavailable`);
        }

        setStep('location');
        requestLocationPermission(); // Now requestLocationPermission is defined within this useEffect scope

      } catch (error) {
        console.error('Initialization error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const locationId = urlParams.get('location');
    const pumpNumber = urlParams.get('pump');
    const sessionId = urlParams.get('session'); // sessionId is now passed to initializeSession

    if (locationId && pumpNumber) { // Changed condition to require pumpNumber based on outline's initializeSession
      initializeSession(locationId, parseInt(pumpNumber), sessionId);
    } else {
      setError('Invalid QR code. Please scan again.');
    }
  }, []); // Empty dependency array as all required functions are defined within this effect scope, and state setters are stable.


  const confirmPumpSelection = (selectedPump) => {
    setPump(selectedPump);
    setSelectedPumpConfirmed(true);
    setError('');
    setStep('auth');
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      // In production, this would call Twilio/AWS SNS to send SMS
      // For demo, we'll simulate
      console.log(`📱 Sending verification code to ${phoneNumber}`);

      // Simulate SMS send
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert(`✅ Verification code sent to ${phoneNumber}\n\n(Demo mode: use code "1234")`);

    } catch (error) {
      setError('Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhone = async () => {
    if (verificationCode !== '1234') {
      setError('Invalid verification code');
      return;
    }
    if (!pump) {
      setError('No pump has been selected or verified. Please complete location verification.');
      return;
    }

    setIsLoading(true);
    try {
      // Check if customer profile exists
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      const profiles = await CustomerProfile.filter({ phone_number: cleanedPhone });

      // Create or load customer profile
      let customerProfile;
      if (profiles.length === 0) {
        customerProfile = await CustomerProfile.create({
          customer_id: `MOBILE-${Date.now()}`,
          phone_number: cleanedPhone,
          purchase_history: {
            total_visits: 0,
            total_spent: 0,
            favorite_items: []
          }
        });
      } else {
        customerProfile = profiles[0];
      }

      // Create mobile fueling session
      const newSession = await MobileFuelingSession.create({
        session_id: `SESSION-${Date.now()}`,
        customer_id: customerProfile.customer_id,
        pump_number: pump.pump_number,
        qr_code: `QR-${pump.id}-${Date.now()}`,
        session_status: 'initiated',
        location_verification: {
          customer_latitude: userLocation.latitude,
          customer_longitude: userLocation.longitude,
          pump_latitude: location.latitude || 40.7128,
          pump_longitude: location.longitude || -74.0060,
          distance_meters: calculateDistance(userLocation.latitude, userLocation.longitude, location.latitude || 40.7128, location.longitude || -74.0060),
          geofence_verified: true
        },
        session_timestamps: {
          initiated_at: new Date().toISOString()
        }
      });

      setSession(newSession);
      setStep('payment');

    } catch (error) {
      console.error('Verification error:', error);
      setError('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const authorizePayment = async () => {
    if (!selectedProduct || !maxAmount) {
      setError('Please select fuel grade and max amount');
      return;
    }
    if (!pump) {
      setError('No pump information available. Please restart the session.');
      return;
    }

    setIsLoading(true);
    try {
      const product = products.find(p => p.product_code === selectedProduct);
      if (!product) {
        setError('Selected product not found.');
        setIsLoading(false);
        return;
      }
      const maxGallons = parseFloat(maxAmount) / (product?.self_service_credit_price || 4.00);

      // Update session with fuel selection and payment
      await MobileFuelingSession.update(session.id, {
        fuel_selection: {
          product_code: selectedProduct,
          max_amount: parseFloat(maxAmount),
          max_gallons: maxGallons,
          auto_stop: true
        },
        payment_method: {
          payment_type: 'stored_card',
          last_four: '4242',
          preauthorized_amount: parseFloat(maxAmount)
        },
        session_status: 'pump_authorized'
      });

      // ACTIVATE THE PUMP
      await Pump.update(pump.id, {
        status: 'fueling',
        preauth_amount: parseFloat(maxAmount),
        active_product_code: selectedProduct,
        current_gallons: 0,
        current_amount: 0,
        is_prepaid: false // Mobile pay = post-pay
      });

      setStep('fueling');

      // Start real-time monitoring
      startFuelingMonitor();

    } catch (error) {
      console.error('Authorization error:', error);
      setError('Payment authorization failed');
    } finally {
      setIsLoading(false);
    }
  };

  const startFuelingMonitor = () => {
    const interval = setInterval(async () => {
      try {
        const updatedPump = await Pump.filter({ id: pump.id });
        if (updatedPump.length > 0) {
          const currentPump = updatedPump[0];
          setCurrentGallons(currentPump.current_gallons || 0);
          setCurrentAmount(currentPump.current_amount || 0);

          // Check if fueling is complete
          if (currentPump.status === 'payable' || currentPump.status === 'online') {
            clearInterval(interval);
            completeFueling(currentPump);
          }
        } else {
          // Pump not found, possibly removed or error
          clearInterval(interval);
          setError('Fueling pump not found or disconnected.');
          setStep('complete'); // Or an error state
        }
      } catch (error) {
        console.error('Monitor error:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Store interval ID for cleanup
    window._fuelingMonitorInterval = interval;
  };

  const completeFueling = async (finalPump) => {
    try {
      const finalAmount = finalPump.last_transaction_amount || currentAmount;
      const finalGallons = finalPump.last_transaction_gallons || currentGallons;

      // Update session
      await MobileFuelingSession.update(session.id, {
        session_status: 'completed',
        transaction_details: {
          gallons_dispensed: finalGallons,
          price_per_gallon: finalGallons > 0 ? (finalAmount / finalGallons) : 0, // Avoid division by zero
          total_amount: finalAmount,
          tax_amount: 0
        },
        session_timestamps: {
          ...session.session_timestamps,
          fueling_completed_at: new Date().toISOString()
        }
      });

      // Process payment (in production, this would charge the card)
      console.log(`💳 Charging card: $${finalAmount.toFixed(2)}`);

      // Reset pump to online
      await Pump.update(pump.id, {
        status: 'online',
        current_gallons: 0,
        current_amount: 0,
        preauth_amount: null,
        active_product_code: null,
        last_transaction_amount: null, // Clear last transaction details
        last_transaction_gallons: null,
      });

      setStep('complete');

    } catch (error) {
      console.error('Completion error:', error);
      setError('Failed to complete transaction');
    }
  };

  useEffect(() => {
    return () => {
      if (window._fuelingMonitorInterval) {
        clearInterval(window._fuelingMonitorInterval);
      }
    };
  }, []);

  // RENDER FUNCTIONS FOR EACH STEP

  const renderScanStep = () => (
    <div className="text-center py-12">
      <Smartphone className="w-24 h-24 mx-auto mb-6 text-blue-600" />
      <h2 className="text-2xl font-bold mb-4">Scan QR Code</h2>
      <p className="text-gray-600">
        Scan the QR code on your pump to begin fueling
      </p>
      {isLoading && <Loader2 className="w-8 h-8 animate-spin mx-auto mt-6" />}
    </div>
  );

  const renderAuthStep = () => (
    <div className="space-y-6 py-6">
      <div className="text-center">
        <Lock className="w-16 h-16 mx-auto mb-4 text-blue-600" />
        <h2 className="text-2xl font-bold mb-2">Phone Verification</h2>
        <p className="text-gray-600">We'll send you a code to verify your number</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Phone Number</Label>
          <Input
            type="tel"
            placeholder="(555) 123-4567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            maxLength={14}
          />
        </div>

        <Button onClick={sendVerificationCode} className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Send Code
        </Button>

        <div>
          <Label>Verification Code</Label>
          <Input
            type="text"
            placeholder="1234"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
          />
        </div>

        <Button onClick={verifyPhone} className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading || !pump}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Verify & Continue
        </Button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6 py-6">
      <div className="text-center">
        <CreditCard className="w-16 h-16 mx-auto mb-4 text-purple-600" />
        <h2 className="text-2xl font-bold mb-2">Select Fuel & Amount</h2>
        <p className="text-gray-600">Choose your fuel grade and max amount</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Fuel Grade</Label>
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger>
              <SelectValue placeholder="Select fuel grade" />
            </SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product.product_code} value={product.product_code}>
                  {product.product_name} - ${product.self_service_credit_price?.toFixed(3)}/gal
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Maximum Amount</Label>
          <Select value={maxAmount} onValueChange={setMaxAmount}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">$25.00</SelectItem>
              <SelectItem value="50">$50.00</SelectItem>
              <SelectItem value="75">$75.00</SelectItem>
              <SelectItem value="100">$100.00</SelectItem>
              <SelectItem value="125">$125.00</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Alert>
          <AlertDescription>
            You'll only be charged for the actual amount pumped.
            Maximum authorization: ${maxAmount}
          </AlertDescription>
        </Alert>

        <Button onClick={authorizePayment} className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-lg" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
          Authorize & Start Fueling
        </Button>
      </div>
    </div>
  );

  const renderFuelingStep = () => (
    <div className="text-center py-12 space-y-6">
      <div className="relative">
        <Fuel className="w-32 h-32 mx-auto text-blue-600 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Droplets className="w-16 h-16 text-blue-400 animate-bounce" />
        </div>
      </div>

      <h2 className="text-3xl font-bold">Fueling in Progress</h2>

      <div className="bg-blue-50 rounded-lg p-6 space-y-4">
        <div>
          <div className="text-sm text-gray-600 mb-2">Current Amount</div>
          <div className="text-5xl font-bold text-blue-600">
            ${currentAmount.toFixed(2)}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-2">Gallons</div>
          <div className="text-3xl font-bold text-gray-800">
            {currentGallons.toFixed(3)} gal
          </div>
        </div>

        <Progress value={(currentAmount / parseFloat(maxAmount)) * 100} className="h-3" />

        <div className="text-sm text-gray-500">
          Max: ${maxAmount} ({((currentAmount / parseFloat(maxAmount)) * 100).toFixed(0)}%)
        </div>
      </div>

      <Alert>
        <AlertDescription>
          Hang up the nozzle when finished. You'll be charged automatically.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center py-12 space-y-6">
      <div className="w-32 h-32 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-20 h-20 text-green-600" />
      </div>

      <h2 className="text-3xl font-bold text-green-600">Transaction Complete!</h2>

      <Card>
        <CardHeader>
          <CardTitle>Receipt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Pump:</span>
            <span className="font-semibold">#{pump?.pump_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Gallons:</span>
            <span className="font-semibold">{currentGallons.toFixed(3)} gal</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Price/Gal:</span>
            <span className="font-semibold">${currentGallons > 0 ? (currentAmount / currentGallons).toFixed(3) : '0.000'}</span> {/* Avoid division by zero */}
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="text-green-600">${currentAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full">
        Email Receipt
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Fuel className="w-6 h-6" />
            Mobile Fuel Payment
          </CardTitle>
          {location && (
            <p className="text-center text-sm opacity-90 mt-2">
              {location.location_name} - Pump {pump?.pump_number}
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'scan' && renderScanStep()}

          {/* STEP: Pump Verification (NEW) */}
          {step === 'pump_verification' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                  Verify Your Pump
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <MapPin className="w-4 h-4" />
                  <AlertDescription>
                    We detected you might be at a different pump than the QR code you scanned.
                    Please confirm which pump you're actually at.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {nearbyPumps.slice(0, 3).map((p) => (
                    <Card
                      key={p.id}
                      className={`cursor-pointer transition-all ${
                        p.distance <= 15 ? 'border-green-500 border-2' : 'border-gray-200'
                      }`}
                      onClick={() => confirmPumpSelection(p)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-lg">Pump {p.pump_number}</div>
                            <div className="text-sm text-gray-600">
                              Distance: {p.distance.toFixed(1)}m away
                            </div>
                          </div>
                          {p.distance <= 15 && (
                            <Badge className="bg-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Closest
                            </Badge>
                          )}
                        </div>

                        <div className="mt-2 flex gap-2">
                          {p.products_available?.map(product => (
                            <Badge key={product} variant="outline" className="text-xs">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="bg-blue-50 p-3 rounded text-sm text-gray-700">
                  <strong>Tip:</strong> Make sure you're standing next to the pump before confirming.
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP: Location Verification */}
          {step === 'location' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  Verifying Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
                    <p className="mt-4 text-gray-600">Verifying you're at Pump {pump?.pump_number || '...'}</p>
                  </div>
                ) : isWithinGeofence ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-16 h-16 mx-auto text-green-600" />
                    <p className="mt-4 font-semibold text-green-800">✓ Location Verified</p>
                    <p className="text-sm text-gray-600 mt-2">
                      You are at Pump {pump?.pump_number}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertTriangle className="w-16 h-16 mx-auto text-orange-500" />
                    <p className="mt-4 font-semibold text-orange-800">Location Required</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Allow location access to verify you're at the pump
                    </p>
                    <Button onClick={requestLocationPermission} className="mt-4">
                      Enable Location
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 'auth' && renderAuthStep()}
          {step === 'payment' && renderPaymentStep()}
          {step === 'fueling' && renderFuelingStep()}
          {step === 'complete' && renderCompleteStep()}
        </CardContent>
      </Card>
    </div>
  );
}
