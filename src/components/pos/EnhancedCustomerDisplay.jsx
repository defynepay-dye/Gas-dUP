
import React, { useEffect, useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, ShoppingCart, Star, Cloud, Phone, Gift } from "lucide-react";
import { WeatherData, LoyaltyProgram, PricingSettings } from "@/api/entities";
import { Ticket } from "lucide-react";

export default function EnhancedCustomerDisplay({ cart, total, mediaConfig, customer, location, promotions }) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [allMediaItems, setAllMediaItems] = useState([]);
  const [weather, setWeather] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [loyaltyCustomer, setLoyaltyCustomer] = useState(customer);
  const [pricingSettings, setPricingSettings] = useState(null);
  const [winningNumbers, setWinningNumbers] = useState(null);
  const [newsItems] = useState([
    "Local gas prices down 5% this week",
    "New payment options now available",
    "Rewards program: Double points this weekend"
  ]);
  const [stockTicker] = useState([
    { symbol: "AAPL", price: 178.25, change: +2.3 },
    { symbol: "TSLA", price: 245.60, change: -1.2 },
    { symbol: "GOOGL", price: 140.50, change: +0.8 }
  ]);

  const cartItems = useMemo(() => {
    if (!cart) return [];
    if (Array.isArray(cart)) return cart;
    return cart.items || [];
  }, [cart]);

  useEffect(() => {
    loadPricingSettings();
  }, []);

  const loadPricingSettings = async () => {
    try {
      const settings = await PricingSettings.list();
      if (settings && settings.length > 0) {
        setPricingSettings(settings[0]);
      }
    } catch (error) {
      console.error("Failed to load pricing settings:", error);
    }
  };

  // Calculate both cash and credit totals
  const { cashTotal, creditTotal } = useMemo(() => {
    if (!pricingSettings || !pricingSettings.dual_pricing_enabled) {
      return { cashTotal: total, creditTotal: total };
    }

    let cashSubtotal = 0;
    let creditSubtotal = 0;

    cartItems.forEach(item => {
      const cashPrice = item.cash_price || item.unit_price;
      cashSubtotal += cashPrice * item.quantity;

      let creditPrice = cashPrice;
      if (item.is_fuel) {
        const markup = (pricingSettings.credit_markup_cents_fuel || 0) / 100;
        creditPrice = cashPrice + markup;
      } else {
        const markupPercent = (pricingSettings.credit_markup_percent_dry_stock || 0) / 100;
        creditPrice = cashPrice * (1 + markupPercent);
      }
      creditSubtotal += creditPrice * item.quantity;
    });

    const taxAmount = cartItems.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    const promoDiscount = cartItems.reduce((sum, item) => sum + (item.discount || 0), 0);
    const loyaltyDiscount = cart?.loyalty_discount || 0;

    const cashFinal = cashSubtotal + taxAmount - promoDiscount - loyaltyDiscount;
    const creditFinal = creditSubtotal + taxAmount - promoDiscount - loyaltyDiscount;

    return {
      cashTotal: parseFloat(cashFinal.toFixed(2)),
      creditTotal: parseFloat(creditFinal.toFixed(2))
    };
  }, [pricingSettings, cartItems, total, cart]);

  // NEW: Load winning lottery numbers
  useEffect(() => {
    loadWinningNumbers();
    // Refresh winning numbers every 5 minutes
    const interval = setInterval(loadWinningNumbers, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadWinningNumbers = async () => {
    try {
      // In production, this would call your backend function that fetches from state lottery API
      // For now, check localStorage for demo/cached data
      const cached = localStorage.getItem('lottery_winning_numbers');
      if (cached) {
        const data = JSON.parse(cached);
        setWinningNumbers(data);
      }
      
      // In production:
      // const response = await base44.integrations.StateLottery.GetWinningNumbers();
      // setWinningNumbers(response);
    } catch (error) {
      console.warn('Unable to load winning numbers:', error);
    }
  };

  // Combine media items + promotions + winning numbers into one rotation
  useEffect(() => {
    let combinedMedia = [];

    if (mediaConfig && mediaConfig.media_items) {
      combinedMedia = [...mediaConfig.media_items];
    }

    if (promotions && promotions.length > 0) {
      promotions.forEach(promo => {
        combinedMedia.push({
          type: 'promotion',
          promotion: promo,
          duration_seconds: 10,
          title: promo.promotion_name
        });
      });
    }

    // NEW: Add winning numbers as a media item
    if (winningNumbers && winningNumbers.games && winningNumbers.games.length > 0) {
      combinedMedia.push({
        type: 'lottery_winners',
        winning_data: winningNumbers,
        duration_seconds: 15,
        title: 'Winning Numbers!'
      });
    }

    setAllMediaItems(combinedMedia);
  }, [mediaConfig, promotions, winningNumbers]);

  useEffect(() => {
    const loadWeather = async () => {
      if (!location) return;
      try {
        const weatherData = await WeatherData.filter({ location_id: location.id }, '-timestamp', 1);
        if (weatherData && weatherData.length > 0) {
          setWeather(weatherData[0]);
        }
      } catch (error) {
        console.warn('Weather data not available:', error);
      }
    };
    loadWeather();
  }, [location]);

  // Media rotation
  useEffect(() => {
    if (!allMediaItems || allMediaItems.length === 0) {
      return;
    }

    if (allMediaItems.length === 1) {
      return;
    }

    const currentItem = allMediaItems[currentMediaIndex];
    const duration = (currentItem?.duration_seconds || mediaConfig?.default_duration || 15) * 1000;
    
    const interval = setInterval(() => {
      setCurrentMediaIndex((prevIndex) => 
        (prevIndex + 1) % allMediaItems.length
      );
    }, duration);

    return () => clearInterval(interval);
  }, [allMediaItems, currentMediaIndex, mediaConfig]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phoneInput.length < 10) return;

    try {
      const customers = await LoyaltyProgram.filter({ customer_phone: phoneInput });
      if (customers && customers.length > 0) {
        setLoyaltyCustomer(customers[0]);
      } else {
        alert("Phone number not found in loyalty program");
      }
    } catch (error) {
      console.error("Error looking up loyalty customer:", error);
    }
  };

  // Cart view
  if (cartItems.length > 0) {
    return (
      <Card className="h-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex flex-col">
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Your Purchase</h2>
            </div>
            {loyaltyCustomer && (
              <Badge className="bg-yellow-400 text-purple-900 px-3 py-1">
                <Star className="w-4 h-4 mr-1 fill-current" />
                {loyaltyCustomer.tier_status?.toUpperCase() || 'MEMBER'}
              </Badge>
            )}
          </div>

          {pricingSettings && pricingSettings.dual_pricing_enabled && (
            <div className="mb-4 p-3 bg-white/20 rounded-lg text-center">
              <p className="text-sm font-semibold">⚖️ DUAL PRICING - Pay Cash or Credit</p>
            </div>
          )}

          <div className="flex-1 space-y-2 overflow-y-auto mb-4">
            {cartItems.slice(-5).map((item, index) => {
              const cashPrice = item.cash_price || item.unit_price;
              let creditPrice = cashPrice;
              
              if (pricingSettings && pricingSettings.dual_pricing_enabled) {
                if (item.is_fuel) {
                  const markup = (pricingSettings.credit_markup_cents_fuel || 0) / 100;
                  creditPrice = cashPrice + markup;
                } else {
                  const markupPercent = (pricingSettings.credit_markup_percent_dry_stock || 0) / 100;
                  creditPrice = cashPrice * (1 + markupPercent);
                }
              }

              return (
                <div key={index} className="bg-white/10 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-base font-medium flex-1">{item.product_name || item.name}</span>
                  </div>
                  {pricingSettings && pricingSettings.dual_pricing_enabled ? (
                    <div className="grid grid-cols-2 gap-2 text-sm font-bold">
                      <div className="bg-green-500/30 rounded px-2 py-1 text-center">
                        <div className="text-[10px] opacity-75">CASH</div>
                        <div>${(cashPrice * item.quantity).toFixed(2)}</div>
                      </div>
                      <div className="bg-blue-500/30 rounded px-2 py-1 text-center">
                        <div className="text-[10px] opacity-75">CREDIT</div>
                        <div>${(creditPrice * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-lg font-bold">${(item.total_price || item.price || 0).toFixed(2)}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t-2 border-white/30 pt-3">
            {pricingSettings && pricingSettings.dual_pricing_enabled ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/30 rounded-lg p-3 text-center">
                  <div className="text-sm font-semibold mb-1">💵 CASH TOTAL</div>
                  <div className="text-3xl font-bold">${cashTotal.toFixed(2)}</div>
                </div>
                <div className="bg-blue-500/30 rounded-lg p-3 text-center">
                  <div className="text-sm font-semibold mb-1">💳 CREDIT TOTAL</div>
                  <div className="text-3xl font-bold">${creditTotal.toFixed(2)}</div>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Total:</span>
                <span className="text-3xl font-bold flex items-center">
                  <DollarSign className="w-6 h-6" />
                  {(total || 0).toFixed(2)}
                </span>
              </div>
            )}
            {loyaltyCustomer && loyaltyCustomer.points_balance > 0 && (
              <div className="mt-2 text-sm text-yellow-200 text-right">
                <p>Points: {loyaltyCustomer.points_balance}</p>
                <p>+{Math.floor(cashTotal || 0)} points earning today</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-black/40 text-white py-2 px-4 text-sm overflow-hidden">
          <div className="flex gap-8 animate-scroll whitespace-nowrap">
            {weather && weather.current_conditions && (
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                <span>{weather.current_conditions.temperature_f}°F - {weather.current_conditions.condition}</span>
              </div>
            )}
            {newsItems.map((news, idx) => (
              <span key={idx}>• {news}</span>
            ))}
            {stockTicker.map((stock, idx) => (
              <span key={idx} className={stock.change > 0 ? 'text-green-400' : 'text-red-400'}>
                {stock.symbol}: ${stock.price} ({stock.change > 0 ? '+' : ''}{stock.change}%)
              </span>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const currentItem = allMediaItems[currentMediaIndex];

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="flex-[3] bg-black relative">
        {currentItem ? (
          <>
            {currentItem.type === 'image' && (
              <img 
                src={currentItem.source_url} 
                alt={currentItem.title || 'Display content'}
                className="w-full h-full object-cover"
              />
            )}
            {currentItem.type === 'video' && (
              <video 
                key={currentItem.source_url}
                src={currentItem.source_url} 
                autoPlay 
                muted 
                loop
                className="w-full h-full object-cover"
              />
            )}
            {currentItem.type === 'web_page' && (
              <iframe 
                src={currentItem.source_url} 
                className="w-full h-full border-0"
                title={currentItem.title || 'Web content'}
              />
            )}

            {currentItem.type === 'promotion' && (
              <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-12">
                <div className="bg-white rounded-3xl p-12 shadow-2xl max-w-2xl text-center">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <Gift className="w-16 h-16 text-orange-600" />
                    <h2 className="text-5xl font-bold text-gray-900">Special Deal!</h2>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-4">{currentItem.promotion.promotion_name}</h3>
                  <div className="text-7xl font-bold text-orange-600 mb-4">
                    {currentItem.promotion.deal_structure.quantity_required} for ${currentItem.promotion.deal_structure.deal_price.toFixed(2)}
                  </div>
                  <p className="text-2xl text-gray-700">
                    Save ${(currentItem.promotion.deal_structure.discount_amount || 0).toFixed(2)}!
                  </p>
                </div>
              </div>
            )}

            {/* NEW: Lottery Winning Numbers Display */}
            {currentItem.type === 'lottery_winners' && currentItem.winning_data && (
              <div className="w-full h-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center p-12">
                <div className="bg-white rounded-3xl p-12 shadow-2xl max-w-4xl">
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <Ticket className="w-20 h-20 text-yellow-600" />
                      <h2 className="text-6xl font-bold text-gray-900">🎉 WINNING NUMBERS! 🎉</h2>
                    </div>
                    <p className="text-2xl text-gray-700">Check your tickets! Could you be a winner?</p>
                  </div>
                  
                  <div className="space-y-6">
                    {currentItem.winning_data.games.slice(0, 3).map((game, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-4 border-yellow-400">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">{game.name}</h3>
                        <div className="flex items-center justify-center gap-4 flex-wrap">
                          {game.numbers.map((num, numIdx) => (
                            <div key={numIdx} className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                              <span className="text-2xl font-bold text-white">{num}</span>
                            </div>
                          ))}
                          {game.powerball && (
                            <>
                              <span className="text-3xl text-gray-400 mx-2">+</span>
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
                                <span className="text-2xl font-bold text-white">{game.powerball}</span>
                              </div>
                            </>
                          )}
                        </div>
                        {game.jackpot && (
                          <p className="text-center mt-4 text-2xl font-bold text-orange-600">
                            Jackpot: ${game.jackpot.toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 text-center">
                    <p className="text-3xl font-bold text-gray-900 mb-2">
                      🎫 Buy Your Tickets Today! 🎫
                    </p>
                    <p className="text-xl text-gray-600">
                      Available at the counter
                    </p>
                  </div>
                </div>
              </div>
            )}

            {allMediaItems.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                {allMediaItems.map((_, index) => (
                  <div 
                    key={index}
                    className={`h-3 rounded-full transition-all ${
                      index === currentMediaIndex ? 'bg-white w-8' : 'bg-white/40 w-3'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex flex-col items-center justify-center text-white">
            <ShoppingCart className="w-24 h-24 mb-6 opacity-80 animate-pulse" />
            <h2 className="text-5xl font-bold mb-4">Welcome!</h2>
            <p className="text-2xl opacity-90">Ready to scan items</p>
          </div>
        )}
      </div>

      <div className="flex-[1] bg-gradient-to-r from-purple-700 to-indigo-700 p-6 flex items-center">
        {loyaltyCustomer ? (
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Star className="w-12 h-12 text-yellow-400 fill-yellow-400" />
              <div>
                <p className="text-white text-sm opacity-90">Rewards Member</p>
                <p className="text-white font-bold text-xl">{loyaltyCustomer.customer_phone}</p>
                <p className="text-white text-sm">{loyaltyCustomer.points_balance} points • {loyaltyCustomer.tier_status} tier</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => { setLoyaltyCustomer(null); setPhoneInput(''); }}
              className="bg-white text-purple-700 hover:bg-gray-100"
            >
              Change
            </Button>
          </div>
        ) : (
          <div className="w-full">
            <div className="text-white text-center mb-3">
              <p className="text-xl font-bold">💰 EARN REWARDS - Enter Your Phone Number</p>
            </div>
            <form onSubmit={handlePhoneSubmit} className="flex gap-3">
              <div className="flex-1 flex items-center gap-3 bg-white/20 rounded-xl px-4">
                <Phone className="w-6 h-6 text-white" />
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                  maxLength={10}
                  className="bg-transparent border-none text-white text-xl placeholder-white/60 focus:ring-0"
                />
              </div>
              <Button 
                type="submit" 
                className="bg-white text-purple-700 hover:bg-gray-100 px-8 text-lg font-bold"
                disabled={phoneInput.length < 10}
              >
                Apply Rewards
              </Button>
            </form>
          </div>
        )}
      </div>

      <div className="bg-black text-white py-2 px-4 text-sm overflow-hidden">
        <div className="flex gap-8 animate-scroll whitespace-nowrap">
          {weather && weather.current_conditions && (
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              <span>{weather.current_conditions.temperature_f}°F {weather.current_conditions.condition}</span>
            </div>
          )}
          {newsItems.map((news, idx) => (
            <span key={idx}>• {news}</span>
          ))}
          {stockTicker.map((stock, idx) => (
            <span key={idx} className={stock.change > 0 ? 'text-green-400' : 'text-red-400'}>
              {stock.symbol}: ${stock.price} ({stock.change > 0 ? '+' : ''}{stock.change}%)
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
      `}</style>
    </Card>
  );
}
