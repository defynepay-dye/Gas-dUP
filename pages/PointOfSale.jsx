
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  InventoryItem, POSTransaction, Pump, CustomItem, Shift,
  LotteryTicket, Product, PricingSettings, CustomerDisplay,
  MixMatchPromotion, Location, CashManagement, SalesRestrictionRule, SystemNotification,
  CustomerProfile, CustomerCart, EmployeePayable
} from "@/api/entities";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Package, Wrench, Shield, Users, Printer, Truck, ArrowDown, LogOut, Ticket, HelpCircle,
  Clock, FileText, Pause, Bell, Activity, Droplets, RefreshCw, AlertCircle, Star, DollarSign
} from "lucide-react";

import TransactionCart from "../components/pos/TransactionCart";
import StartShiftModal from '../components/shifts/StartShiftModal';
import EndShiftModal from '../components/shifts/EndShiftModal';
import QuickItemsPanel from "../components/pos/QuickItemsPanel";
import ProductSearch from '../components/pos/ProductSearch';
import EnhancedCustomerDisplay from "../components/pos/EnhancedCustomerDisplay";
import PaymentProcessor from "../components/pos/PaymentProcessor";
import AgeVerificationModal from "../components/pos/AgeVerificationModal";
import HeldTransactions from "../components/pos/HeldTransactions";
import TransactionJournal from "../components/pos/TransactionJournal";
import LotteryPayoutModal from "../components/pos/LotteryPayoutModal";
import CashManagementModal from "../components/pos/CashManagementModal";
import CashAdjustmentModal from "../components/pos/CashAdjustmentModal";
import NoSaleModal from "../components/pos/NoSaleModal";
import ClerkManagerModal from "../components/pos/ClerkManagerModal";
import { applyLoyaltyStacking } from "../components/loyalty/LoyaltyStackingEngine";
import AlertsModal from "../components/pos/AlertsModal";
import POSSupportPanel from "../components/support/POSSupportPanel";
import FuelingPositionsPanel from "../components/pos/FuelingPositionsPanel";
import HealthCheckModal from "../components/pos/HealthCheckModal";
import PumpSimulator from "../components/pos/PumpSimulator";
import LoyaltyLookup from "../components/pos/LoyaltyLookup";
import DeliveryOrderAlert from '../components/delivery/DeliveryOrderAlert';
import DeliveryOrderManagementModal from '../components/delivery/DeliveryOrderManagementModal';
import CashDrawerStatusWidget from '../components/treasury/CashDrawerStatusWidget';
import EmployeeBalanceWidget from '../components/pos/EmployeeBalanceWidget';
import PayDownBalanceModal from '../components/pos/PayDownBalanceModal';
import CancelTransactionModal from '../components/pos/CancelTransactionModal';
import PackSizeSelectionModal from "../components/pos/PackSizeSelectionModal";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function PointOfSalePage() {
  const [cart, setCart] = useState({ items: [], customer: null, loyalty_discount: 0, applied_deals: [] });

  const [pumps, setPumps] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeShift, setActiveShift] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [salesRestrictions, setSalesRestrictions] = useState([]);
  const [heldTransactions, setHeldTransactions] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pricingSettings, setPricingSettings] = useState(null);
  const [customerDisplayConfig, setCustomerDisplayConfig] = useState(null);
  const [language, setLanguage] = useState(null);
  const [systemNotifications, setSystemNotifications] = useState([]);

  const [showPayment, setShowPayment] = useState(false);
  // Replaced original showAgeVerification with a boolean for modal visibility
  const [showAgeVerificationModal, setShowAgeVerificationModal] = useState(false); 
  const [showHeld, setShowHeld] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showLotteryPayout, setShowLotteryPayout] = useState(false);
  const [showCashManagement, setShowCashManagement] = useState(null);
  const [showClerkManager, setShowClerkManager] = useState(false);
  const [showEndShift, setShowEndShift] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const [showLoyaltyLookup, setShowLoyaltyLookup] = useState(false);
  const [showCashAdjustment, setShowCashAdjustment] = useState(false);
  const [showNoSale, setShowNoSale] = useState(false);
  const [activeTab, setActiveTab] = useState('quick-items');

  const [showDeliveryOrders, setShowDeliveryOrders] = useState(false);
  const [deliveryHubEnabled, setDeliveryHubEnabled] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false); // Global flag if current user session is age verified

  const [showPayDownBalance, setShowPayDownBalance] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Renamed to match outline and better reflect purpose
  const [showPackSizeModal, setShowPackSizeModal] = useState(false);
  const [pendingPackProduct, setPendingPackProduct] = useState(null);

  // New state to hold a product that's awaiting age verification or was just selected via pack size
  const [pendingItem, setPendingItem] = useState(null); 

  // Helper for tax calculation
  const defaultTaxRate = 0.07; // Example default, can be fetched from settings or product data

  const calculateTax = useCallback((amount, rate) => {
    return parseFloat((amount * rate).toFixed(2));
  }, []);

  const { subtotal, taxTotal, total, promotionDiscount, appliedDeals } = useMemo(() => {
    if (!cart || !cart.items) return { subtotal: 0, taxTotal: 0, total: 0, promotionDiscount: 0, appliedDeals: [] };
    const sub = cart.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const tax = cart.items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    const promoDiscount = cart.items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const loyaltyDiscount = cart.loyalty_discount || 0;

    return {
      subtotal: sub,
      taxTotal: tax,
      total: sub + tax - promoDiscount - loyaltyDiscount,
      promotionDiscount: promoDiscount + loyaltyDiscount,
      appliedDeals: cart.applied_deals || []
    };
  }, [cart]);

  const cartItems = useMemo(() => cart?.items || [], [cart?.items]);

  const validateTransaction = useCallback(() => {
    if (!cart || cart.items.length === 0) {
      alert('Cannot complete transaction: Cart is empty.');
      return false;
    }
    if (total <= 0) {
      alert('Cannot complete transaction: Total amount is zero or negative.');
      return false;
    }
    const requiresAgeVerification = cart.items.some(item => item.age_restricted);
    if (requiresAgeVerification && !ageVerified) {
      alert('Age verification is required for some items in the cart.');
      return false;
    }
    return true;
  }, [cart, total, ageVerified]);

  const printReceipt = useCallback((transactionData) => {
    console.log("Printing receipt for transaction:", transactionData);
  }, []);

  const clearTransaction = useCallback(() => {
    setCart({ items: [], customer: null, loyalty_discount: 0, applied_deals: [] });
    setAgeVerified(false);
    setShowPayment(false);
    setActiveTab('quick-items');
  }, []);

  const refreshPumpsOnly = useCallback(async () => {
    try {
      const pumpData = await Pump.list("pump_number");

      const pumpMap = new Map();
      (pumpData || []).forEach(pump => {
        if (!pumpMap.has(pump.pump_number) ||
            new Date(pump.updated_date) > new Date(pumpMap.get(pump.pump_number).updated_date)) {
          pumpMap.set(pump.pump_number, pump);
        }
      });
      const uniquePumps = Array.from(pumpMap.values()).sort((a, b) => a.pump_number - b.pump_number);
      setPumps(uniquePumps);
    } catch (error) {
      console.error("Failed to refresh pumps:", error);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      console.log("Loading critical data...");

      const [
        userData, productData, pumpData, pricingData, locationsData
      ] = await Promise.all([
        (base44.auth) ? base44.auth.me().catch(err => { console.error("User load failed:", err); return null; }) : null,
        Product.list().catch(err => { console.error("Products load failed:", err); return []; }),
        Pump.list("pump_number").catch(err => { console.error("Pumps load failed:", err); return []; }),
        PricingSettings.list().catch(err => { console.error("Pricing settings load failed:", err); return []; }),
        Location.list().catch(err => { console.error("Locations load failed:", err); return []; })
      ]);

      await delay(300);

      if (userData) {
        setCurrentUser(userData);
        if (userData.language) {
          setLanguage(userData.language);
        }
      }

      const savedLocationId = localStorage.getItem('current_location_id');
      if (savedLocationId && locationsData) {
        const location = locationsData.find(loc => loc.id === savedLocationId);
        setCurrentLocation(location);
      }

      if (pricingData && pricingData.length > 0) {
        setPricingSettings(pricingData[0]);
        console.log("✅ Pricing settings loaded:", pricingData[0]);
      }

      setProducts(productData || []);

      const pumpMap = new Map();
      (pumpData || []).forEach(pump => {
        if (!pumpMap.has(pump.pump_number) ||
            new Date(pump.updated_date) > new Date(pumpMap.get(pump.pump_number).updated_date)) {
          pumpMap.set(pump.pump_number, pump);
        }
      });
      const uniquePumps = Array.from(pumpMap.values()).sort((a, b) => a.pump_number - b.pump_number);
      setPumps(uniquePumps);

      console.log("Critical data loaded successfully");

      await delay(300);
      const activeShifts = await Shift.filter({ status: "active" }, "-start_time", 1).catch(err => {
        console.error("Shift load failed:", err);
        return [];
      });

      if (activeShifts && activeShifts.length > 0) {
        setActiveShift(activeShifts[0]);
      }

      setTimeout(async () => {
        try {
          await delay(500);
          const promoData = await MixMatchPromotion.filter({ active: true }).catch(() => []);
          setPromotions(promoData || []);

          await delay(500);
          const restrictionData = await SalesRestrictionRule.filter({ is_active: true }).catch(() => []);
          setSalesRestrictions(restrictionData || []);

          await delay(500);
          let customerDisplayConfigData = null;
          try {
            const displayData = await CustomerDisplay.list();
            customerDisplayConfigData = displayData.find(d => d.active) || null;
            setCustomerDisplayConfig(customerDisplayConfigData);
          } catch (error) {
            console.warn('Customer display not available:', error);
            setCustomerDisplayConfig(null);
          }

          await delay(500);
          let systemNotificationsFilteredData = [];
          try {
            const notificationsRawData = await SystemNotification.list();
            if (userData) {
              systemNotificationsFilteredData = notificationsRawData.filter(n =>
                n.target_audience === 'all_users' ||
                n.target_audience === 'cashiers_only' ||
                (n.target_audience === 'specific_user' && n.target_user_id === userData.id)
              );
            } else {
              systemNotificationsFilteredData = notificationsRawData.filter(n =>
                n.target_audience === 'all_users' || n.target_audience === 'cashiers_only'
              );
            }
            setSystemNotifications(systemNotificationsFilteredData);
          } catch (error) {
            console.warn('Unable to load system notifications:', error);
            setSystemNotifications([]);
          }

          await delay(500);
          const heldData = await CustomerCart.filter({ cart_status: 'held', location_id: savedLocationId || 'default' }).catch(() => []);
          setHeldTransactions(heldData || []);

          console.log("Background data loaded");
        } catch (error) {
          console.error("Background data load failed:", error);
        }
      }, 100);

    } catch (error) {
      console.error("Failed to load critical POS data:", error);
      setLoadError(error.message || "Failed to load data. Please try again.");
      setPumps([]);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [calculateTax, defaultTaxRate]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const deliveryEnabled = localStorage.getItem('delivery_hub_enabled') === 'true';
    setDeliveryHubEnabled(deliveryEnabled);
  }, []);

  useEffect(() => {
    if (currentUser?.employee_purchase_settings?.allow_purchases_on_credit) {
      const currentBalance = currentUser.employee_purchase_settings.current_payable_balance || 0;
      const creditLimit = currentUser.employee_purchase_settings.credit_limit || 0;
      const percentUsed = creditLimit > 0 ? (currentBalance / creditLimit * 100) : 0;

      if (percentUsed >= 90 && percentUsed < 100) {
        const warningShown = sessionStorage.getItem('credit_limit_warning_shown');
        if (!warningShown) {
          setTimeout(() => {
            alert(`⚠️ Credit Limit Warning\n\nYou have used ${percentUsed.toFixed(0)}% of your employee credit limit.\n\nCurrent Balance: $${currentBalance.toFixed(2)}\nCredit Limit: $${creditLimit.toFixed(2)}\n\nPlease pay down your balance soon.`);
            sessionStorage.setItem('credit_limit_warning_shown', 'true');
          }, 2000);
        }
      }
    }
  }, [currentUser]);

  const handleStartShift = async (shiftData) => {
    try {
      const newShift = await Shift.create({
        ...shiftData,
        shift_id: `SHIFT-${Date.now()}`,
        start_time: new Date().toISOString(),
        status: 'active',
        cash_in_drawer: shiftData.opening_cash
      });
      setActiveShift(newShift);
    } catch (error) {
      console.error("Failed to start shift:", error);
      alert("Could not start shift. Please try again.");
    }
  };

  const addItemToCart = useCallback((item, selectedConfig, quantity) => {
    setCart(prevCart => {
      let newItems;
      const customer = prevCart.customer;

      // Determine if the item is age restricted based on passed item data
      const isAgeRestrictedProduct = item.compliance_flags?.age_restricted || item.age_restricted || false;

      if (item.is_fuel) {
        newItems = [...prevCart.items, {
          ...item,
          quantity: item.quantity,
          unit_price: item.unit_price,
          cash_price: item.cash_price || item.unit_price,
          total_price: item.total_price,
          tax_amount: item.tax_amount || 0,
          discount: item.discount || 0,
          age_restricted: isAgeRestrictedProduct,
          selected_config: null,
          selected_config_name: null,
          unit_multiplier: 1
        }];
        console.log('[CART] Fuel item added:', item);
      } else {
        const cashPrice = selectedConfig
          ? selectedConfig.display_price
          : (item.cash_price || item.unit_price || item.price || 0);

        const unitMultiplier = selectedConfig ? selectedConfig.unit_multiplier : 1;
        const displayName = selectedConfig
          ? `${item.product_name} (${selectedConfig.config_name})`
          : item.product_name;

        let creditPrice = cashPrice;
        if (pricingSettings && pricingSettings.dual_pricing_enabled) {
          const markupPercent = pricingSettings.credit_markup_percent_dry_stock || 0;
          creditPrice = cashPrice * (1 + (markupPercent / 100));
        }

        const existingItemIndex = prevCart.items.findIndex(i =>
          (i.upc_code || i.product_id || i.id) === (item.upc_code || item.id) &&
          (i.selected_config_name || 'default') === (selectedConfig?.config_name || 'default') &&
          !i.is_fuel // Don't group fuel items by config
        );

        if (existingItemIndex > -1) {
          newItems = [...prevCart.items];
          newItems[existingItemIndex].quantity += quantity;
          newItems[existingItemIndex].unit_price = cashPrice;
          newItems[existingItemIndex].cash_price = cashPrice;
          newItems[existingItemIndex].credit_price = creditPrice;
          newItems[existingItemIndex].total_price = newItems[existingItemIndex].quantity * cashPrice;
          newItems[existingItemIndex].tax_amount = item.tax_amount || calculateTax(cashPrice * newItems[existingItemIndex].quantity, item.tax_rate || defaultTaxRate);
          newItems[existingItemIndex].discount = 0;
          newItems[existingItemIndex].applied_offers = [];
        } else {
          const cartItemId = `${item.id || item.upc_code}-${selectedConfig?.config_name || 'default'}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

          newItems = [...prevCart.items, {
            ...item,
            id: cartItemId,
            product_name: displayName,
            quantity,
            unit_price: cashPrice,
            cash_price: cashPrice,
            credit_price: creditPrice,
            total_price: cashPrice * quantity,
            tax_amount: item.tax_amount || calculateTax(cashPrice * quantity, item.tax_rate || defaultTaxRate),
            discount: 0,
            inventory_item_id: selectedConfig?.inventory_item_id || item.inventory_item_id || null,
            track_inventory: item.track_inventory || false,
            age_restricted: isAgeRestrictedProduct,
            selected_config: selectedConfig,
            selected_config_name: selectedConfig?.config_name || 'default',
            unit_multiplier: unitMultiplier
          }];
        }

        if (item.category_name && item.category_name.toLowerCase() === 'lottery') {
          (async () => {
            try {
              const lotteryTickets = await LotteryTicket.filter({
                game_number: item.upc_code
              });

              if (lotteryTickets && lotteryTickets.length > 0) {
                const ticket = lotteryTickets[0];
                if (ticket.tickets_remaining >= quantity) {
                  await LotteryTicket.update(ticket.id, {
                    tickets_remaining: ticket.tickets_remaining - quantity,
                    last_ticket_sold: new Date().toISOString()
                  });
                  console.log(`✅ Decremented lottery ticket: ${ticket.game_name} - ${quantity} sold, ${ticket.tickets_remaining - quantity} remaining`);
                } else {
                  console.warn(`⚠️ Lottery ticket ${ticket.game_name} has insufficient stock! Requested: ${quantity}, Remaining: ${ticket.tickets_remaining}`);
                  alert(`Warning: Not enough ${ticket.game_name} tickets available! Only ${ticket.tickets_remaining} remaining.`);
                }
              } else {
                console.warn(`⚠️ No LotteryTicket found for UPC/Game Number: ${item.upc_code}`);
              }
            } catch (error) {
              console.error('Error updating lottery ticket inventory:', error);
            }
          })();
        }
      }

      const { items, totalLoyaltyDiscount, appliedDeals } = applyLoyaltyStacking(newItems, promotions, customer);

      return {
        ...prevCart,
        items: items,
        loyalty_discount: totalLoyaltyDiscount,
        applied_deals: appliedDeals
      };
    });
  }, [promotions, pricingSettings, calculateTax, defaultTaxRate]);


  const handlePackSizeSelected = useCallback((config) => {
    if (!pendingPackProduct) return;

    const item = pendingPackProduct;
    const quantity = pendingPackProduct.pendingQuantity || 1;

    // Determine if the item is age restricted based on product properties
    const isAgeRestricted = item.compliance_flags?.age_restricted || item.age_restricted || false;

    // Check for age restriction AFTER pack selection
    if (isAgeRestricted && !ageVerified) {
      setShowPackSizeModal(false); // Close pack size modal
      setShowAgeVerificationModal(true); // Open age verification modal
      setPendingItem({
        ...item,
        pendingQuantity: quantity,
        selectedConfig: config // Store the selected config with the pending item
      });
      return;
    }

    // If age is verified or not restricted, add to cart
    addItemToCart(item, config, quantity);

    setShowPackSizeModal(false);
    setPendingPackProduct(null);
  }, [pendingPackProduct, ageVerified, addItemToCart]);

  const handleAddToCart = useCallback(async (item, quantity = 1) => {
    // Determine age restriction status based on product properties
    const isAgeRestricted = item.compliance_flags?.age_restricted || item.age_restricted || false;

    // 1. Check if this item has multiple selling configurations (Pack Size selection)
    if (item.selling_configurations && item.selling_configurations.length > 1) {
      setPendingPackProduct({ ...item, pendingQuantity: quantity });
      setShowPackSizeModal(true);
      return;
    }

    // 2. If single/no config, check for age restriction
    if (isAgeRestricted && !ageVerified) {
      setShowAgeVerificationModal(true); // Show age verification modal
      setPendingItem({ ...item, pendingQuantity: quantity }); // Store the item for later addition
      return;
    }

    // 3. If no pack selection needed and age is verified (or not restricted), add to cart directly
    const selectedConfig = item.selling_configurations && item.selling_configurations.length === 1
      ? item.selling_configurations[0]
      : null;
    addItemToCart(item, selectedConfig, quantity);
  }, [ageVerified, addItemToCart]);

  const handleAgeVerifiedConfirm = useCallback(() => {
    setAgeVerified(true); // Set global ageVerified state
    setShowAgeVerificationModal(false); // Close the age verification modal

    // If there's a pending item, add it to the cart now
    if (pendingItem) {
      const item = pendingItem;
      const quantity = pendingItem.pendingQuantity || 1;
      const selectedConfig = pendingItem.selectedConfig; // Might be null if no pack selection occurred

      addItemToCart(item, selectedConfig, quantity);
      setPendingItem(null); // Clear pending item
    }
  }, [pendingItem, addItemToCart]);

  const handleUpdateQuantity = useCallback((cartItemId, newQuantity) => {
    setCart(prevCart => {
      let newItems = prevCart.items.map(item => {
        if (item.is_fuel) return item;

        if (item.id === cartItemId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);

      newItems = newItems.map(item => {
        const cashPrice = item.selected_config?.display_price || item.cash_price || item.unit_price || item.price || 0;
        let creditPrice = cashPrice;
        if (pricingSettings && pricingSettings.dual_pricing_enabled) {
          const markupPercent = pricingSettings.credit_markup_percent_dry_stock || 0;
          creditPrice = cashPrice * (1 + (markupPercent / 100));
        }
        return {
          ...item,
          unit_price: cashPrice,
          cash_price: cashPrice,
          credit_price: creditPrice,
          total_price: cashPrice * item.quantity,
          tax_amount: item.tax_amount || calculateTax(cashPrice * item.quantity, item.tax_rate || defaultTaxRate),
          discount: 0,
          applied_offers: []
        };
      });

      const { items, totalLoyaltyDiscount, appliedDeals } = applyLoyaltyStacking(newItems, promotions, prevCart.customer);

      return {
        ...prevCart,
        items: items,
        loyalty_discount: totalLoyaltyDiscount,
        applied_deals: appliedDeals
      };
    });
  }, [promotions, pricingSettings, calculateTax, defaultTaxRate]);

  const handleRemoveItem = useCallback((cartItemId) => {
    setCart(prevCart => {
      const newItems = prevCart.items.filter(item => item.id !== cartItemId);

      const { items, totalLoyaltyDiscount, appliedDeals } = applyLoyaltyStacking(newItems, promotions, prevCart.customer);

      return {
        ...prevCart,
        items: items,
        loyalty_discount: totalLoyaltyDiscount,
        applied_deals: appliedDeals
      };
    });
  }, [promotions]);

  const handleAddFuelToCart = useCallback((fuelItem) => {
    handleAddToCart(fuelItem, 1);
  }, [handleAddToCart]);

  const handleEndShift = async (shiftData) => {
      if(!activeShift) return;
      try {
        await (base44.entities ? base44.entities.Shift.update(activeShift.id, {
            ...shiftData,
            end_time: new Date().toISOString(),
            status: 'completed'
        }) : Shift.update(activeShift.id, {
            ...shiftData,
            end_time: new Date().toISOString(),
            status: 'completed'
        }));
        setActiveShift(null);
        setShowEndShift(false);
        loadInitialData();
      } catch (error) {
        console.error("Failed to end shift:", error);
        alert("Could not end shift. Please try again.");
      }
  };

  const handleTransactionComplete = useCallback(async (payments) => {
    if (!validateTransaction()) return;

    setIsProcessing(true);

    try {
        let transactionItems = [...cart.items];
        let currentSubtotal = subtotal;
        let currentTaxTotal = taxTotal;
        let currentPromotionDiscount = promotionDiscount;
        let currentTotal = total;

        const hasCardPayment = payments.some(p =>
            ['credit_card', 'debit_card', 'mobile_payment'].includes(p.method)
        );

        if (pricingSettings && pricingSettings.dual_pricing_enabled && hasCardPayment) {
            transactionItems = cart.items.map(item => {
                let creditUnitPrice = item.unit_price;

                if (item.is_fuel) {
                  const creditMarkupCents = pricingSettings.credit_markup_cents_fuel || 0;
                  creditUnitPrice = (item.cash_price || item.unit_price) + (creditMarkupCents / 100);
                } else {
                  const creditMarkupPercent = pricingSettings.credit_markup_percent_dry_stock || 0;
                  creditUnitPrice = (item.cash_price || item.unit_price) * (1 + (creditMarkupPercent / 100));
                }

                return {
                  ...item,
                  unit_price: parseFloat(creditUnitPrice.toFixed(2)),
                  total_price: parseFloat((creditUnitPrice * item.quantity).toFixed(2)),
                  price_type: 'credit'
                };
            });

            currentSubtotal = transactionItems.reduce((sum, item) => sum + item.total_price, 0);
            currentTaxTotal = transactionItems.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
            currentPromotionDiscount = transactionItems.reduce((sum, item) => sum + (item.discount || 0), 0);
            const loyaltyDiscountApplied = cart.loyalty_discount || 0;
            currentTotal = currentSubtotal + currentTaxTotal - currentPromotionDiscount - loyaltyDiscountApplied;

            currentSubtotal = parseFloat(currentSubtotal.toFixed(2));
            currentTaxTotal = parseFloat(currentTaxTotal.toFixed(2));
            currentTotal = parseFloat(currentTotal.toFixed(2));
        } else {
          transactionItems = cart.items.map(item => ({...item, price_type: 'cash'}));
        }

        const transactionData = {
            transaction_number: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            items: transactionItems.map(item => ({
              upc_code: item.upc_code,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              tax_amount: item.tax_amount || 0,
              is_fuel: item.is_fuel || false,
              pump_number: item.pump_number || null,
              is_custom_item: item.is_custom_item || false,
              price_type: item.price_type,
              discount: item.discount || 0,
              applied_offers: item.applied_offers || [],
              selected_config_name: item.selected_config_name || null,
              unit_multiplier: item.unit_multiplier || 1
            })),
            subtotal: currentSubtotal,
            tax_total: currentTaxTotal,
            total_amount: currentTotal,
            payments: payments.map(p => ({
              method: p.method,
              amount: p.amount,
              tendered: p.tendered || p.amount,
              change: p.change || 0,
              card_last_four: p.card_last_four || null,
              authorization_code: p.authorization_code || null,
              employee_id: p.employee_id || null,
              employee_name: p.employee_name || null
            })),
            cashier_name: currentUser?.full_name || 'Unknown',
            shift_id: activeShift?.id || null,
            age_verification_required: cart.items.some(item => item.age_restricted),
            age_verified: ageVerified,
            status: 'completed',
            customer_id: cart.customer?.id || null,
            loyalty_discount_applied: cart.loyalty_discount || 0,
            applied_deals: cart.applied_deals || [],
            location_id: currentLocation?.id || null,
            pump_number: cart.items.find(item => item.is_fuel)?.pump_number || null
        };

        const transaction = await (base44.entities ? base44.entities.POSTransaction.create(transactionData) : POSTransaction.create(transactionData));

        const clerkTenderPayment = payments.find(p => p.method === 'clerk_tender');
        if (clerkTenderPayment && currentUser && currentUser.employee_purchase_settings) {
          const now = new Date();
          const payPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const payPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

          const payableData = {
            employee_id: clerkTenderPayment.employee_id,
            employee_name: clerkTenderPayment.employee_name,
            location_id: currentLocation?.id || currentUser.assigned_location_id,
            pos_transaction_id: transaction.id,
            transaction_number: transaction.transaction_number,
            items: transactionItems,
            original_amount: currentTotal,
            amount_paid_down: 0,
            amount_remaining: currentTotal,
            status: 'active',
            pay_period_start: payPeriodStart.toISOString().split('T')[0],
            pay_period_end: payPeriodEnd.toISOString().split('T')[0],
            purchase_date: now.toISOString(),
            payment_history: [],
            deducted_from_payroll: false
          };

          await (base44.entities ? base44.entities.EmployeePayable.create(payableData) : EmployeePayable.create(payableData));

          const newBalance = (currentUser.employee_purchase_settings.current_payable_balance || 0) + currentTotal;
          await (base44.auth ? base44.auth.updateMe({
            employee_purchase_settings: {
              ...currentUser.employee_purchase_settings,
              current_payable_balance: newBalance
            }
          }) : null);

          const updatedUser = await (base44.auth ? base44.auth.me() : null);
          if (updatedUser) {
            setCurrentUser(updatedUser);
          }
        }

        if (activeShift && activeShift.id) {
          const cashPayments = payments.filter(p => p.method === 'cash');
          const totalCashIn = cashPayments.reduce((sum, p) => sum + p.amount, 0);
          const totalCashOut = cashPayments.reduce((sum, p) => sum + (p.change || 0), 0);
          const netCashChange = totalCashIn - totalCashOut;

          if (netCashChange !== 0) {
            const currentDrawerBalance = activeShift.cash_in_drawer || 0;
            const newDrawerBalance = currentDrawerBalance + netCashChange;

            await (base44.entities ? base44.entities.Shift.update(activeShift.id, {
              cash_in_drawer: newDrawerBalance
            }) : Shift.update(activeShift.id, {
              cash_in_drawer: newDrawerBalance
            }));

            setActiveShift(prev => ({
              ...prev,
              cash_in_drawer: newDrawerBalance
            }));
            console.log(`Cash drawer updated: previous ${currentDrawerBalance}, change ${netCashChange}, new ${newDrawerBalance}`);
          }
        }

        const fuelItems = cart.items.filter(item => item.is_fuel && item.pending_authorization);

        if (fuelItems.length > 0) {
          console.log('[POS] ===== PAYMENT COMPLETE - AUTHORIZING FUEL PUMPS =====');

          for (const fuelItem of fuelItems) {
            console.log(`[POS] Authorizing Pump ID: ${fuelItem.pump_id}`);
            console.log(`[POS] Amount: $${fuelItem.total_price}`);
            console.log(`[POS] Gallons: ${fuelItem.quantity}`);

            let productCode = 'regular';
            if (fuelItem.product_name.includes('Premium')) productCode = 'premium';
            else if (fuelItem.product_name.includes('Midgrade')) productCode = 'midgrade';
            else if (fuelItem.product_name.includes('Diesel')) productCode = 'diesel';

            await (base44.entities ? base44.entities.Pump.update(fuelItem.pump_id, {
              status: 'authorized',
              payment_completed: true,
              preauth_amount: fuelItem.total_price,
              preauth_gallons: fuelItem.quantity,
              is_prepaid: true,
              active_product_code: productCode,
              current_gallons: 0,
              current_amount: 0,
              last_transaction_amount: fuelItem.total_price,
              last_transaction_gallons: fuelItem.quantity
            }) : Pump.update(fuelItem.pump_id, {
              status: 'authorized',
              payment_completed: true,
              preauth_amount: fuelItem.total_price,
              preauth_gallons: fuelItem.quantity,
              is_prepaid: true,
              active_product_code: productCode,
              current_gallons: 0,
              current_amount: 0,
              last_transaction_amount: fuelItem.total_price,
              last_transaction_gallons: fuelItem.quantity
            }));

            console.log(`[POS] ✅ Pump ${fuelItem.pump_number} updated with payment_completed=true`);

            await new Promise(resolve => setTimeout(resolve, 200));
          }

          console.log('[POS] All pumps authorized. Refreshing...');

          await new Promise(resolve => setTimeout(resolve, 500));
          await refreshPumpsOnly();

          console.log('[POS] ✅ Refresh complete. Simulator should start fueling.');
        }

        for (const item of cart.items) {
          if (item.inventory_item_id && item.track_inventory) {
            const inventoryItem = await (base44.entities ? base44.entities.InventoryItem.get(item.inventory_item_id) : InventoryItem.get(item.inventory_item_id));
            if (inventoryItem) {
              const currentQty = inventoryItem.inventory_tracking?.quantity_on_hand_singles || 0;
              const unitsToDeduct = item.quantity * (item.unit_multiplier || 1);
              const newQty = Math.max(0, currentQty - unitsToDeduct);

              await (base44.entities ? base44.entities.InventoryItem.update(item.inventory_item_id, {
                inventory_tracking: {
                  ...inventoryItem.inventory_tracking,
                  quantity_on_hand_singles: newQty
                }
              }) : InventoryItem.update(item.inventory_item_id, {
                inventory_tracking: {
                  ...inventoryItem.inventory_tracking,
                  quantity_on_hand_singles: newQty
                }
              }));
              console.log(`✅ Inventory updated for ${item.product_name}: deducted ${unitsToDeduct} singles, new quantity ${newQty}`);
            }
          }
        }

        if (cart.customer && cart.customer.id) {
          const pointsEarned = Math.floor(currentTotal);
          const customer = await (base44.entities ? base44.entities.CustomerProfile.get(cart.customer.id) : CustomerProfile.get(cart.customer.id));

          if (customer) {
            await (base44.entities ? base44.entities.CustomerProfile.update(cart.customer.id, {
              loyalty_status: {
                ...customer.loyalty_status,
                points_balance: (customer.loyalty_status?.points_balance || 0) + pointsEarned,
                points_earned_ytd: (customer.loyalty_status?.points_earned_ytd || 0) + pointsEarned
              },
              purchase_history: {
                ...customer.purchase_history,
                total_visits: (customer.purchase_history?.total_visits || 0) + 1,
                total_spent: (customer.purchase_history?.total_spent || 0) + currentTotal,
                last_visit: new Date().toISOString()
              }
            }) : CustomerProfile.update(cart.customer.id, {
              loyalty_status: {
                ...customer.loyalty_status,
                points_balance: (customer.loyalty_status?.points_balance || 0) + pointsEarned,
                points_earned_ytd: (customer.loyalty_status?.points_earned_ytd || 0) + pointsEarned
              },
              purchase_history: {
                ...customer.purchase_history,
                total_visits: (customer.purchase_history?.total_visits || 0) + 1,
                total_spent: (customer.purchase_history?.total_spent || 0) + currentTotal,
                last_visit: new Date().toISOString()
              }
            }));
            console.log(`✅ Loyalty points updated for customer ${cart.customer.id}: earned ${pointsEarned}`);
          }
        }

        if (cart.customer?.active_cart_id) {
          await (base44.entities ? base44.entities.CustomerCart.update(cart.customer.active_cart_id, {
            cart_status: 'converted_to_transaction'
          }) : CustomerCart.update(cart.customer.active_cart_id, {
            cart_status: 'converted_to_transaction'
          }));
        }

        printReceipt(transactionData);
        clearTransaction();

        if (clerkTenderPayment && currentUser) {
          const displayedNewBalance = currentUser.employee_purchase_settings?.current_payable_balance ?
                                      currentUser.employee_purchase_settings.current_payable_balance.toFixed(2) :
                                      ((currentUser.employee_purchase_settings?.current_payable_balance || 0) + currentTotal).toFixed(2);
          alert(`✅ Purchase charged to your employee account!\n\nAmount: $${currentTotal.toFixed(2)}\nNew Balance: $${displayedNewBalance}`);
        } else if (fuelItems.length > 0) {
          alert(`✅ Payment Complete!\n\nPump(s) ${fuelItems.map(f => `#${f.pump_number}`).join(', ')} authorized.\n\nFueling will begin in 1 second.`);
        } else {
          alert('✅ Transaction completed successfully!');
        }

    } catch(e) {
        console.error("[POS] Failed to complete transaction:", e);
        alert("Error: Could not complete transaction. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [cart, activeShift, currentUser, currentLocation, pricingSettings, total, subtotal, taxTotal, promotionDiscount, ageVerified, validateTransaction, printReceipt, clearTransaction, refreshPumpsOnly, calculateTax, defaultTaxRate]);

  const handleHoldTransaction = async () => {
    if (!cart || cart.items.length === 0) return;

    try {
        let customerCartId = cart.customer?.active_cart_id;
        const customerCartData = {
          customer_id: cart.customer?.id || 'anonymous',
          location_id: currentLocation?.id || 'default',
          cart_status: 'held',
          items: cart.items.map(item => ({
            upc_code: item.upc_code,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            is_fuel: item.is_fuel,
            pump_number: item.pump_number,
            applied_offers: item.applied_offers,
            discount: item.discount,
            selected_config_name: item.selected_config_name || null,
            unit_multiplier: item.unit_multiplier || 1
          })),
          applied_deals: cart.applied_deals || [],
          total_discount_amount: promotionDiscount + (cart.loyalty_discount || 0),
          total_estimated_amount: total,
          last_updated: new Date().toISOString(),
          notes: 'Held from POS'
        };

        if (customerCartId) {
          await (base44.entities ? base44.entities.CustomerCart.update(customerCartId, customerCartData) : CustomerCart.update(customerCartId, customerCartData));
        } else {
          const newCustomerCart = await (base44.entities ? base44.entities.CustomerCart.create(customerCartData) : CustomerCart.create(customerCartData));
          customerCartId = newCustomerCart.id;
          if (cart.customer?.id) {
            await (base44.entities ? base44.entities.CustomerProfile.update(cart.customer.id, { active_cart_id: newCustomerCart.id }) : CustomerProfile.update(cart.customer.id, { active_cart_id: newCustomerCart.id }));
          }
        }

        alert('Transaction Held to Customer Cart');
        setCart({ items: [], customer: null, loyalty_discount: 0, applied_deals: [] });
        setActiveTab('quick-items');
        await delay(250);

        const heldData = await CustomerCart.filter({ cart_status: 'held', location_id: currentLocation?.id || 'default' }).catch(() => []);
        setHeldTransactions(heldData || []);

    } catch(e) {
        console.error("Failed to hold transaction to CustomerCart", e);
        alert("Error: Could not hold transaction.");
    }
  };

  const handleExactCash = useCallback(async () => {
      if (!validateTransaction()) return;

      const payment = {
          method: 'cash',
          amount: total,
          tendered: total,
          change: 0
      };

      await handleTransactionComplete([payment]);
  }, [total, handleTransactionComplete, validateTransaction]);

  const handleQuickCash = useCallback(async (amount) => {
      if (!validateTransaction()) return;

      const change = amount - total;

      if (change < 0) {
        alert(`Insufficient payment. Total is $${total.toFixed(2)}, tendered $${amount.toFixed(2)}`);
        return;
      }

      const payment = {
          method: 'cash',
          amount: total,
          tendered: amount,
          change: change
      };

      await handleTransactionComplete([payment]);

      if (change > 0) {
        alert(`Change Due: $${change.toFixed(2)}`);
      }
  }, [total, handleTransactionComplete, validateTransaction]);

  const handleResetAllPumps = async () => {
    if (!window.confirm('Reset all pumps to IDLE status? This will clear any active transactions. This action cannot be undone!')) {
      return;
    }

    try {
      for (const pump of pumps) {
        await (base44.entities ? base44.entities.Pump.update(pump.id, {
          status: 'idle',
          active_product_code: null,
          preauth_amount: 0,
          preauth_gallons: 0,
          is_prepaid: false,
          current_gallons: 0,
          current_amount: 0,
          payment_completed: false,
          last_transaction_gallons: 0,
          last_transaction_amount: 0
        }) : Pump.update(pump.id, {
          status: 'idle',
          active_product_code: null,
          preauth_amount: 0,
          preauth_gallons: 0,
          is_prepaid: false,
          current_gallons: 0,
          current_amount: 0,
          payment_completed: false,
          last_transaction_gallons: 0,
          last_transaction_amount: 0
        }));
        await delay(100);
      }
      alert('All pumps reset successfully!');
      refreshPumpsOnly();
    } catch (error) {
      console.error('Error resetting pumps:', error);
      alert('Failed to reset pumps');
    }
  };

  const handleResetSinglePump = async (pumpId) => {
    try {
      await (base44.entities ? base44.entities.Pump.update(pumpId, {
        status: 'idle',
        active_product_code: null,
        preauth_amount: 0,
        preauth_gallons: 0,
        is_prepaid: false,
        current_gallons: 0,
        current_amount: 0,
        payment_completed: false,
        last_transaction_gallons: 0,
        last_transaction_amount: 0
      }) : Pump.update(pumpId, {
        status: 'idle',
        active_product_code: null,
        preauth_amount: 0,
        preauth_gallons: 0,
        is_prepaid: false,
        current_gallons: 0,
        current_amount: 0,
        payment_completed: false,
        last_transaction_gallons: 0,
        last_transaction_amount: 0
      }));
      alert('Pump reset successfully!');
      refreshPumpsOnly();
    } catch (error) {
      console.error('Error resetting pump:', error);
      alert('Failed to reset pump');
    }
  };

  const handleCustomerSelected = useCallback(async (customer, activeCustomerCart = null) => {
    let initialCartItems = [];
    let initialLoyaltyDiscount = 0;
    let initialAppliedDeals = [];

    if (activeCustomerCart && activeCustomerCart.items) {
      initialCartItems = activeCustomerCart.items;
      initialLoyaltyDiscount = customer?.loyalty_status?.redemption_amount || 0;
      initialAppliedDeals = activeCustomerCart.applied_deals || [];
      await (base44.entities ? base44.entities.CustomerCart.update(activeCustomerCart.id, { cart_status: 'active' }) : CustomerCart.update(activeCustomerCart.id, { cart_status: 'active' }));
    } else {
       const { items: processedItems, totalLoyaltyDiscount, appliedDeals: newAppliedDeals } = applyLoyaltyStacking([], promotions, customer);
       initialLoyaltyDiscount = totalLoyaltyDiscount;
       initialAppliedDeals = newAppliedDeals;
    }

    setCart(prevCart => ({
      ...prevCart,
      customer: { ...customer, active_cart_id: activeCustomerCart?.id },
      items: initialCartItems,
      loyalty_discount: initialLoyaltyDiscount,
      applied_deals: initialAppliedDeals
    }));
    setShowLoyaltyLookup(false);
  }, [promotions]);

  const handleRecallHeldTransaction = useCallback(async (heldCart) => {
    if (!heldCart || !heldCart.id) return;

    let customerProfile = null;
    if (heldCart.customer_id && heldCart.customer_id !== 'anonymous') {
      try {
        customerProfile = await (base44.entities ? base44.entities.CustomerProfile.get(heldCart.customer_id) : CustomerProfile.get(heldCart.customer_id));
      } catch (error) {
        console.warn("Could not load customer profile for held cart:", error);
      }
    }

    setCart({
      items: heldCart.items,
      customer: customerProfile ? { ...customerProfile, active_cart_id: heldCart.id } : { active_cart_id: heldCart.id },
      loyalty_discount: 0,
      applied_deals: heldCart.applied_deals || []
    });

    await (base44.entities ? base44.entities.CustomerCart.update(heldCart.id, { cart_status: 'active' }) : CustomerCart.update(heldCart.id, { cart_status: 'active' }));

    setShowHeld(false);
    setActiveTab('quick-items');
  }, []);

  const handleCancelTransaction = async (cancellationData) => {
    try {
      if (!cart.items.length) {
        alert("Cart is empty, nothing to cancel.");
        setShowCancelModal(false);
        return;
      }

      const user = currentUser || (base44.auth ? await base44.auth.me() : null);
      if (!user) {
        alert("User information not available. Cannot cancel transaction.");
        return;
      }

      const transactionData = {
        transaction_number: `TXN-CANCEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        items: cart.items.map(item => ({
          upc_code: item.upc_code,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          tax_amount: item.tax_amount || 0,
          is_fuel: item.is_fuel || false,
          pump_number: item.pump_number || null,
          is_custom_item: item.is_custom_item || false,
          price_type: item.price_type || 'cash',
          discount: item.discount || 0,
          applied_offers: item.applied_offers || [],
          selected_config_name: item.selected_config_name || null,
          unit_multiplier: item.unit_multiplier || 1
        })),
        subtotal: subtotal,
        tax_total: taxTotal,
        total_amount: total,
        payments: [],
        cashier_name: user.full_name || 'Unknown',
        shift_id: activeShift?.id || null,
        status: 'cancelled',
        cancellation_reason_id: cancellationData.reason.id,
        cancellation_reason_text: cancellationData.reason.reason_text,
        cancellation_note: cancellationData.note || null,
        cancelled_by: user.full_name,
        manager_override_by: cancellationData.managerOverride || null,
        location_id: currentLocation?.id || null,
      };

      await (base44.entities ? base44.entities.POSTransaction.create(transactionData) : POSTransaction.create(transactionData));

      for (const item of cart.items) {
        if (item.inventory_item_id && item.track_inventory && !item.is_fuel) {
          const inventoryItem = await (base44.entities ? base44.entities.InventoryItem.get(item.inventory_item_id) : InventoryItem.get(item.inventory_item_id));
          if (inventoryItem) {
            const currentQty = inventoryItem.inventory_tracking?.quantity_on_hand_singles || 0;
            const unitsToRevert = item.quantity * (item.unit_multiplier || 1);
            const newQty = currentQty + unitsToRevert;
            await (base44.entities ? base44.entities.InventoryItem.update(item.inventory_item_id, {
              inventory_tracking: {
                ...inventoryItem.inventory_tracking,
                quantity_on_hand_singles: newQty
              }
            }) : InventoryItem.update(item.inventory_item_id, {
              inventory_tracking: {
                ...inventoryItem.inventory_tracking,
                quantity_on_hand_singles: newQty
              }
            }));
            console.log(`✅ Inventory reverted for ${item.product_name}: new quantity ${newQty}`);
          }
        }
      }

      if (cart.customer?.active_cart_id) {
          await (base44.entities ? base44.entities.CustomerCart.update(cart.customer.active_cart_id, {
            cart_status: 'held'
          }) : CustomerCart.update(cart.customer.active_cart_id, {
            cart_status: 'held'
          }));
      }

      clearTransaction();
      setShowCancelModal(false);

      alert('Transaction cancelled successfully and recorded.');
    } catch (error) {
      console.error('Failed to cancel transaction:', error);
      alert('Failed to cancel transaction. Please try again.');
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">Loading Point of Sale...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading POS</h2>
            <p className="text-gray-600 mb-4">{loadError}</p>
            <Button onClick={loadInitialData} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeShift) {
    return <StartShiftModal onStart={handleStartShift} onClose={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col font-sans gap-4">
      <PumpSimulator pumps={pumps} onUpdate={refreshPumpsOnly} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Quick Actions
            </CardTitle>
            <div className="flex gap-2">
              {deliveryHubEnabled && currentLocation && (
                <DeliveryOrderAlert
                  locationId={currentLocation.id}
                  onOpenManagement={() => setShowDeliveryOrders(true)}
                />
              )}
              <Button variant="outline" size="sm" onClick={loadInitialData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex gap-2 px-4 pb-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowLoyaltyLookup(true)}>
              <Star className="w-4 h-4 mr-2 text-yellow-500" />Loyalty
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowJournal(true)}>
              <FileText className="w-4 h-4 mr-2" />Journal
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowHeld(true)}>
              <Pause className="w-4 h-4 mr-2" />Held ({heldTransactions.length})
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowHealthCheck(true)}>
              <Wrench className="w-4 h-4 mr-2" />Health Check
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSupport(true)}>
              <HelpCircle className="w-4 h-4 mr-2" />Support
            </Button>
            <Button variant="outline" size="sm" className="relative" onClick={() => setShowAlerts(true)}>
              <Bell className="w-4 h-4 mr-2" />Alerts
              {systemNotifications.length > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 px-1.5 py-0 text-xs">
                  {systemNotifications.length}
                </Badge>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetAllPumps}
              className="ml-auto"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Reset All Pumps
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex-shrink-0">
        <FuelingPositionsPanel
          pumps={pumps}
          onReload={refreshPumpsOnly}
          onAddFuelToCart={handleAddFuelToCart}
        />
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        <div className="col-span-12 lg:col-span-3">
            <TransactionCart
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                subtotal={subtotal}
                taxTotal={taxTotal}
                total={total}
                promotionDiscount={promotionDiscount}
                appliedDeals={appliedDeals}
                onClearCart={() => setCart({ items: [], customer: null, loyalty_discount: 0, applied_deals: [] })}
                onShowPayment={() => setShowPayment(true)}
                onHold={handleHoldTransaction}
                onExactCash={handleExactCash}
                onQuickCash={handleQuickCash}
                onLotteryPayout={() => setShowLotteryPayout(true)}
                onSafeDrop={() => setShowCashManagement({type: 'safe_drop'})}
                salesRestrictions={salesRestrictions}
                activeShift={activeShift}
                isProcessing={isProcessing}
                onCancelTransaction={() => setShowCancelModal(true)}
            />
        </div>

        <div className="col-span-12 lg:col-span-6">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="quick-items">Quick Items</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="functions">Functions</TabsTrigger>
                    <TabsTrigger value="admin">Admin</TabsTrigger>
                </TabsList>
                <TabsContent value="quick-items" className="flex-1 mt-4 overflow-hidden">
                    <QuickItemsPanel onAddToCart={handleAddToCart} />
                </TabsContent>
                <TabsContent value="products" className="flex-1 mt-4 overflow-hidden">
                   <ProductSearch onAddToCart={handleAddToCart} />
                </TabsContent>
                <TabsContent value="functions" className="flex-1 mt-4 overflow-hidden">
                   <Card className="h-full flex flex-col">
                       <CardHeader><CardTitle>POS Functions</CardTitle></CardHeader>
                       <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-grow overflow-y-auto">
                          {currentUser?.employee_purchase_settings?.allow_purchases_on_credit && (
                            <div className="col-span-full">
                              <EmployeeBalanceWidget
                                currentUser={currentUser}
                                onPayDown={() => setShowPayDownBalance(true)}
                              />
                            </div>
                          )}
                          <Button variant="outline" className="h-20" onClick={() => setShowCashAdjustment(true)}>
                            <DollarSign className="w-5 h-5 mr-2" />Cash Adjustment
                          </Button>
                          <Button variant="outline" className="h-20" onClick={() => setShowNoSale(true)}>
                            <DollarSign className="w-5 h-5 mr-2" />No Sale
                          </Button>
                          <Button variant="outline" className="h-20" onClick={() => setShowClerkManager(true)}>
                            <Users className="w-5 h-5 mr-2" />Clerks
                          </Button>
                          <Button variant="outline" className="h-20" onClick={() => setShowCashManagement({type: 'vendor_payout'})}>
                            <Truck className="w-5 h-5 mr-2" />Vendor Payout
                          </Button>
                          <Button variant="outline" className="h-20" onClick={() => setShowCashManagement({type: 'safe_drop'})}>
                            <ArrowDown className="w-5 h-5 mr-2" />Safe Drop
                          </Button>
                          <Button variant="destructive" className="h-20 col-span-full mt-4" onClick={() => setShowEndShift(true)}>
                            <LogOut className="w-5 h-5 mr-2" />End Shift
                          </Button>
                       </CardContent>
                   </Card>
                </TabsContent>
                <TabsContent value="admin" className="flex-1 mt-4 overflow-hidden">
                    <Card className="h-full flex flex-col">
                      <CardHeader><CardTitle>Admin Functions</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-grow overflow-y-auto">
                        <Button variant="outline" className="h-20" onClick={() => window.location.href = '/BackOffice'}>
                          <Package className="w-5 h-5 mr-2" />Back Office
                        </Button>
                        <Button variant="outline" className="h-20" onClick={() => setShowHealthCheck(true)}>
                          <Wrench className="w-5 h-5 mr-2" />System Health
                        </Button>
                        <Button variant="outline" className="h-20" onClick={handleResetAllPumps}>
                          <AlertCircle className="w-5 h-5 mr-2" />Reset Pumps
                        </Button>
                      </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>

        <div className="col-span-12 lg:col-span-3">
            <EnhancedCustomerDisplay
              cart={cart}
              total={total}
              mediaConfig={customerDisplayConfig}
              customer={cart.customer}
              location={currentLocation}
              promotions={promotions}
            />
            {activeShift && (
              <div className="mt-4">
                <CashDrawerStatusWidget shift={activeShift} />
              </div>
            )}
        </div>
      </div>

      {showLoyaltyLookup && (
        <LoyaltyLookup
          onCustomerSelected={handleCustomerSelected}
          onClose={() => setShowLoyaltyLookup(false)}
          currentCart={cart.items}
          currentLocationId={currentLocation?.id}
        />
      )}
      {showPayment && (
        <PaymentProcessor
          cart={cart}
          total={total}
          onClose={() => setShowPayment(false)}
          onComplete={handleTransactionComplete}
          pricingSettings={pricingSettings}
          isProcessing={isProcessing}
          currentUser={currentUser}
        />
      )}
      {/* Age Verification Modal - now controlled by showAgeVerificationModal (boolean) and passed pendingItem */}
      {showAgeVerificationModal && pendingItem && (
        <AgeVerificationModal
          item={pendingItem} // Pass the pending item for display within the modal
          onClose={() => {
            setShowAgeVerificationModal(false);
            setPendingItem(null); // Clear pending item if user closes without verifying
          }}
          onVerified={handleAgeVerifiedConfirm}
        />
      )}
      {showHeld && (
        <HeldTransactions
          transactions={heldTransactions}
          onClose={() => setShowHeld(false)}
          onRecall={handleRecallHeldTransaction}
        />
      )}
      {showJournal && (
        <TransactionJournal
          onClose={() => setShowJournal(false)}
          onRecall={() => setShowJournal(false)}
        />
      )}
      {showLotteryPayout && (
        <LotteryPayoutModal
          onClose={() => setShowLotteryPayout(false)}
          onComplete={(data) => {
            console.log('Lottery Payout:', data);
            setShowLotteryPayout(false);
          }}
          activeShift={activeShift}
          currentUser={currentUser}
        />
      )}
      {showCashManagement && (
        <CashManagementModal
          transactionType={showCashManagement.type}
          onClose={() => setShowCashManagement(null)}
          onComplete={() => setShowCashManagement(null)}
          activeShift={activeShift}
          currentUser={currentUser}
        />
      )}
      {showClerkManager && (
        <ClerkManagerModal
          onClose={() => setShowClerkManager(false)}
        />
      )}
      {showEndShift && (
        <EndShiftModal
          shift={activeShift}
          onClose={() => setShowEndShift(false)}
          onEnd={handleEndShift}
        />
      )}
      {showSupport && (
        <POSSupportPanel
          onClose={() => setShowSupport(false)}
        />
      )}
      {showAlerts && (
        <AlertsModal
          notifications={systemNotifications}
          onClose={() => setShowAlerts(false)}
        />
      )}
      {showHealthCheck && (
        <HealthCheckModal
          pumps={pumps}
          onClose={() => setShowHealthCheck(false)}
          onResetPump={handleResetSinglePump}
          onResetAll={handleResetAllPumps}
          onRefresh={refreshPumpsOnly}
        />
      )}

      {showCashAdjustment && activeShift && (
        <CashAdjustmentModal
          shift={activeShift}
          onClose={() => setShowCashAdjustment(false)}
          onAdjustmentComplete={loadInitialData}
        />
      )}

      {showNoSale && activeShift && (
        <NoSaleModal
          shift={activeShift}
          onClose={() => setShowNoSale(false)}
          onNoSaleComplete={loadInitialData}
        />
      )}

      {deliveryHubEnabled && showDeliveryOrders && currentLocation && (
        <DeliveryOrderManagementModal
          isOpen={showDeliveryOrders}
          onClose={() => setShowDeliveryOrders(false)}
          locationId={currentLocation.id}
        />
      )}

      {showPayDownBalance && (
        <PayDownBalanceModal
          employee={currentUser}
          onClose={() => setShowPayDownBalance(false)}
          onSuccess={() => {
            setShowPayDownBalance(false);
            window.location.reload(); // Refresh to update balance
          }}
        />
      )}

      {showCancelModal && (
        <CancelTransactionModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelTransaction}
          cartItemCount={cart.items.length}
          cartTotal={total}
        />
      )}

      {/* Pack Size Selection Modal - now controlled by showPackSizeModal (boolean) and passed pendingPackProduct */}
      {showPackSizeModal && pendingPackProduct && (
        <PackSizeSelectionModal
          isOpen={showPackSizeModal}
          onClose={() => {
            setShowPackSizeModal(false);
            setPendingPackProduct(null);
          }}
          product={pendingPackProduct}
          onSelectConfiguration={handlePackSizeSelected}
        />
      )}
    </div>
  );
}
