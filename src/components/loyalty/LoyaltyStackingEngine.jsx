import { groupBy } from 'lodash';

/**
 * Applies active mix-and-match promotions and loyalty discounts to a shopping cart.
 * This is a foundational engine that combines all applicable discounts.
 *
 * @param {Array} cartItems - The raw list of items in the cart.
 * @param {Array} promotions - List of active MixMatchPromotion entities.
 * @param {Object} customer - The CustomerProfile object, including loyalty_status and any digital coupons.
 * @returns {Object} An object containing:
 *   - items: Updated cart items with discounts applied.
 *   - totalLoyaltyDiscount: Total monetary discount from loyalty points/offers.
 *   - appliedDeals: List of names of promotions/offers that were applied.
 */
export function applyLoyaltyStacking(cartItems, promotions, customer) {
  let itemsWithDiscounts = cartItems.map(item => ({ ...item, discount: 0, applied_offers: [] }));
  const appliedDeals = [];
  let totalLoyaltyDiscount = 0;

  // 1. Apply Mix & Match Promotions (as previously implemented)
  // This engine now serves as the central point, so we integrate the existing mixMatch logic.
  if (promotions && promotions.length > 0) {
    for (const promo of promotions) {
      if (!promo.active || !promo.deal_structure || !promo.eligible_products) continue;

      const { quantity_required, deal_price } = promo.deal_structure;
      const eligibleUpcs = promo.eligible_products.map(p => p.upc_code);

      const itemsForPromo = itemsWithDiscounts.filter(item => eligibleUpcs.includes(item.upc_code));
      const totalEligibleQuantity = itemsForPromo.reduce((sum, item) => sum + (item.quantity || 0), 0);

      if (totalEligibleQuantity >= quantity_required) {
        const timesApplied = Math.floor(totalEligibleQuantity / quantity_required);
        const sortedEligibleItems = itemsForPromo
          .flatMap(item => Array(item.quantity).fill({ ...item, original_price: item.unit_price || item.price || 0 }))
          .sort((a, b) => b.original_price - a.original_price);

        let dealDiscount = 0;
        for (let i = 0; i < timesApplied; i++) {
          const itemsForThisDeal = sortedEligibleItems.slice(i * quantity_required, (i + 1) * quantity_required);
          const originalPriceSum = itemsForThisDeal.reduce((sum, item) => sum + item.original_price, 0);
          const discountForThisInstance = originalPriceSum - deal_price;

          if (discountForThisInstance > 0) {
            dealDiscount += discountForThisInstance;
          }
        }

        if (dealDiscount > 0) {
          // Distribute discount proportionally across eligible items
          const itemsToApplyDiscount = itemsWithDiscounts.filter(item => eligibleUpcs.includes(item.upc_code));
          const totalOriginalPriceEligible = itemsToApplyDiscount.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

          itemsWithDiscounts = itemsWithDiscounts.map(item => {
            if (eligibleUpcs.includes(item.upc_code) && totalOriginalPriceEligible > 0) {
              const proportion = (item.unit_price * item.quantity) / totalOriginalPriceEligible;
              return {
                ...item,
                discount: (item.discount || 0) + (dealDiscount * proportion),
                applied_offers: [...item.applied_offers, { offer_id: promo.id, offer_name: promo.promotion_name, discount_amount: (dealDiscount * proportion) }]
              };
            }
            return item;
          });
          appliedDeals.push(promo.promotion_name);
        }
      }
    }
  }

  // 2. Apply Loyalty Program Benefits (e.g., points redemption, fixed discounts)
  // For simplicity, we'll assume a direct monetary redemption is available from loyalty lookup.
  // The 'redemption_amount' is assumed to come from a prior loyalty lookup and might be stored on the customer object.
  if (customer && customer.loyalty_status && customer.loyalty_status.redemption_amount > 0) {
    totalLoyaltyDiscount = customer.loyalty_status.redemption_amount;
    appliedDeals.push("Loyalty Redemption");
  }


  // 3. Apply Digital Coupons / Personalized Offers (Customer-specific)
  // This would typically involve iterating through customer.digital_coupons or customer.personalized_offers
  // and checking if any item's UPC matches and if the coupon is valid.
  // For now, this is a placeholder to show where it would go.
  if (customer && customer.digital_coupons && customer.digital_coupons.length > 0) {
    // Example: Find a digital coupon for an item
    for (const coupon of customer.digital_coupons) {
      if (coupon.active && !coupon.used && new Date() < new Date(coupon.expiration_date)) {
        for (let i = 0; i < itemsWithDiscounts.length; i++) {
          const item = itemsWithDiscounts[i];
          if (coupon.eligible_upcs.includes(item.upc_code)) {
            // Apply coupon discount to this item
            const itemDiscount = Math.min(item.total_price, coupon.discount_amount); // Ensure discount doesn't exceed item price
            itemsWithDiscounts[i] = {
              ...item,
              discount: (item.discount || 0) + itemDiscount,
              applied_offers: [...item.applied_offers, { offer_id: coupon.id, offer_name: `Digital Coupon: ${coupon.description}`, discount_amount: itemDiscount }]
            };
            appliedDeals.push(coupon.description);
            coupon.used = true; // Mark coupon as used within this cart context
            // If coupon is single-use per transaction, break or adjust logic
            break; // Apply coupon to first matching item and move to next coupon
          }
        }
      }
    }
  }

  // Ensure total_price and discount are correctly calculated
  itemsWithDiscounts = itemsWithDiscounts.map(item => ({
    ...item,
    // Recalculate total_price based on unit_price * quantity and then apply discount
    total_price: (item.unit_price * item.quantity) - (item.discount || 0)
  }));


  return {
    items: itemsWithDiscounts,
    totalLoyaltyDiscount: totalLoyaltyDiscount,
    appliedDeals: Array.from(new Set(appliedDeals)) // Ensure unique deal names
  };
}