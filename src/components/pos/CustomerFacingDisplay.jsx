import React, { useEffect, useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingCart, Star, Cloud, Droplets, Wind } from "lucide-react";
import { WeatherData } from "@/api/entities";

export default function CustomerFacingDisplay({ cart, total, mediaConfig, customer, location, promotions }) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [displayContent, setDisplayContent] = useState(null);
  const [weather, setWeather] = useState(null);

  // ONLY FIX: Extract cart items array properly to fix cart.slice error
  const cartItems = useMemo(() => {
    if (!cart) return [];
    if (Array.isArray(cart)) return cart;
    return cart.items || [];
  }, [cart]);

  // Load weather data
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

  // Media rotation logic
  useEffect(() => {
    if (!mediaConfig || !mediaConfig.media_items || mediaConfig.media_items.length === 0) {
      setDisplayContent(null);
      return;
    }

    setDisplayContent(mediaConfig.media_items[currentMediaIndex]);

    if (!mediaConfig.rotation_enabled || mediaConfig.media_items.length === 1) {
      return;
    }

    const duration = (mediaConfig.media_items[currentMediaIndex]?.duration_seconds || mediaConfig.default_duration || 15) * 1000;
    
    const interval = setInterval(() => {
      setCurrentMediaIndex((prevIndex) => 
        (prevIndex + 1) % mediaConfig.media_items.length
      );
    }, duration);

    return () => clearInterval(interval);
  }, [mediaConfig, currentMediaIndex]);

  // Render cart view if items in cart
  if (cartItems.length > 0) {
    return (
      <Card className="h-full bg-gradient-to-br from-blue-600 to-purple-600 text-white p-8 flex flex-col">
        {/* Header with Loyalty Badge */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            <h2 className="text-3xl font-bold">Your Purchase</h2>
          </div>
          {customer && (
            <Badge className="bg-yellow-400 text-purple-900 px-3 py-1">
              <Star className="w-4 h-4 mr-1 fill-current" />
              {customer.tier_status?.toUpperCase() || 'MEMBER'}
            </Badge>
          )}
        </div>

        {/* Cart Items - FIXED: Use cartItems instead of cart.slice */}
        <div className="flex-1 space-y-3 overflow-y-auto">
          {cartItems.slice(-5).map((item, index) => (
            <div key={index} className="flex justify-between items-center bg-white/10 rounded-lg p-3">
              <span className="text-lg">{item.product_name || item.name}</span>
              <span className="text-xl font-bold">${(item.total_price || item.price || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t-2 border-white/30 pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">Total:</span>
            <span className="text-4xl font-bold flex items-center">
              <DollarSign className="w-8 h-8" />
              {(total || 0).toFixed(2)}
            </span>
          </div>
          {customer && customer.available_points > 0 && (
            <p className="text-sm text-yellow-200 mt-2 text-right">
              +{Math.floor(total || 0)} points earning today
            </p>
          )}
        </div>

        {/* Weather Widget at Bottom */}
        {weather && weather.current_conditions && (
          <div className="mt-4 bg-white/10 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              <span className="text-sm">{weather.current_conditions.condition}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">{weather.current_conditions.temperature_f}°F</span>
              {weather.current_conditions.precipitation_chance > 30 && (
                <div className="flex items-center gap-1 text-xs">
                  <Droplets className="w-4 h-4" />
                  {weather.current_conditions.precipitation_chance}%
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  }

  // Render media content or attract screen
  if (displayContent) {
    return (
      <Card className="h-full bg-black overflow-hidden relative">
        {/* Media Content */}
        {displayContent.type === 'image' && (
          <img 
            src={displayContent.source_url} 
            alt={displayContent.title || 'Display content'}
            className="w-full h-full object-cover"
          />
        )}
        {displayContent.type === 'video' && (
          <video 
            key={displayContent.source_url}
            src={displayContent.source_url} 
            autoPlay 
            muted 
            loop
            className="w-full h-full object-cover"
          />
        )}
        {displayContent.type === 'web_page' && (
          <iframe 
            src={displayContent.source_url} 
            className="w-full h-full border-0"
            title={displayContent.title || 'Web content'}
          />
        )}

        {/* Weather Overlay */}
        {weather && weather.current_conditions && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              <span className="text-sm">{weather.current_conditions.condition}</span>
              <span className="text-lg font-bold ml-2">{weather.current_conditions.temperature_f}°F</span>
            </div>
          </div>
        )}

        {/* Rotation Indicator */}
        {mediaConfig && mediaConfig.media_items && mediaConfig.media_items.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {mediaConfig.media_items.map((_, index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full ${index === currentMediaIndex ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        )}
      </Card>
    );
  }

  // Default attract screen when no media configured
  return (
    <Card className="h-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-8 flex flex-col justify-between">
      <div className="text-center flex-1 flex flex-col justify-center">
        <ShoppingCart className="w-24 h-24 mx-auto mb-6 opacity-80" />
        <h2 className="text-4xl font-bold mb-4">Welcome!</h2>
        <p className="text-xl opacity-90">Ready to scan items</p>
      </div>

      {/* Featured Promotions */}
      {promotions && promotions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xl font-semibold mb-2">Today's Deals</h3>
          {promotions.slice(0, 2).map((promo, index) => (
            <div key={index} className="bg-white/10 rounded-lg p-3">
              <p className="font-semibold">{promo.promotion_name}</p>
              <p className="text-sm opacity-90">
                {promo.deal_structure.quantity_required} for ${promo.deal_structure.deal_price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Weather */}
      {weather && weather.current_conditions && (
        <div className="mt-4 bg-white/10 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-80">Current Weather</p>
              <p className="font-semibold">{weather.current_conditions.condition}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{weather.current_conditions.temperature_f}°F</p>
            {weather.current_conditions.precipitation_chance > 30 && (
              <p className="text-xs flex items-center gap-1 justify-end mt-1">
                <Droplets className="w-3 h-3" />
                {weather.current_conditions.precipitation_chance}% rain
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}