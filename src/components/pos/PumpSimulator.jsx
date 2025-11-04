import React, { useEffect, useRef } from 'react';
import { Pump } from '@/api/entities';

export default function PumpSimulator({ pumps, onUpdate }) {
  const simulationRef = useRef({});

  useEffect(() => {
    if (!pumps || pumps.length === 0) {
      console.log('[SIMULATOR] No pumps to simulate');
      return;
    }

    console.log(`[SIMULATOR] Monitoring ${pumps.length} pumps...`);

    const interval = setInterval(async () => {
      let needsUpdate = false;
      const updatesToMake = [];

      for (const pump of pumps) {
        try {
          const pumpKey = `pump_${pump.pump_number}`;
          
          // STATE 1A: PREPAID - AUTHORIZED + PAYMENT_COMPLETED → Start fueling
          if (pump.status === 'authorized' && pump.is_prepaid === true && pump.payment_completed === true && pump.preauth_amount > 0) {
            
            console.log(`[SIMULATOR] ✅ Pump ${pump.pump_number}: PREPAID - Ready to fuel!`);
            
            if (!simulationRef.current[pumpKey]?.authorizedAt) {
              simulationRef.current[pumpKey] = {
                authorizedAt: Date.now(),
                startedFueling: false,
                targetAmount: pump.preauth_amount,
                targetGallons: pump.preauth_gallons,
                isPrepaid: true
              };
              console.log(`[SIMULATOR] Pump ${pump.pump_number}: Initialized PREPAID - Target $${pump.preauth_amount} / ${pump.preauth_gallons}gal`);
            }
            
            const timeSinceAuth = Date.now() - simulationRef.current[pumpKey].authorizedAt;
            
            if (timeSinceAuth > 1000 && !simulationRef.current[pumpKey].startedFueling) {
              const pricePerGallon = pump.preauth_amount / pump.preauth_gallons;
              console.log(`[SIMULATOR] 🚀 Pump ${pump.pump_number}: STARTING PREPAID FUELING - $${pricePerGallon.toFixed(3)}/gal`);
              
              updatesToMake.push({
                id: pump.id,
                data: {
                  status: 'fueling',
                  current_gallons: 0.1,
                  current_amount: 0.1 * pricePerGallon
                }
              });
              
              simulationRef.current[pumpKey].startedFueling = true;
              needsUpdate = true;
            }
          }
          
          // STATE 1B: FILL UP (POST-PAY) - AUTHORIZED WITHOUT PAYMENT → Start fueling immediately
          if (pump.status === 'authorized' && pump.is_prepaid === false && pump.preauth_amount > 0) {
            
            console.log(`[SIMULATOR] ✅ Pump ${pump.pump_number}: FILL UP - Ready to fuel!`);
            
            if (!simulationRef.current[pumpKey]?.authorizedAt) {
              simulationRef.current[pumpKey] = {
                authorizedAt: Date.now(),
                startedFueling: false,
                targetAmount: pump.preauth_amount,
                targetGallons: pump.preauth_gallons,
                isPrepaid: false
              };
              console.log(`[SIMULATOR] Pump ${pump.pump_number}: Initialized FILL UP - Max $${pump.preauth_amount} / ${pump.preauth_gallons}gal`);
            }
            
            const timeSinceAuth = Date.now() - simulationRef.current[pumpKey].authorizedAt;
            
            if (timeSinceAuth > 1000 && !simulationRef.current[pumpKey].startedFueling) {
              const pricePerGallon = pump.preauth_amount / pump.preauth_gallons;
              console.log(`[SIMULATOR] 🚀 Pump ${pump.pump_number}: STARTING FILL UP FUELING - $${pricePerGallon.toFixed(3)}/gal`);
              
              updatesToMake.push({
                id: pump.id,
                data: {
                  status: 'fueling',
                  current_gallons: 0.1,
                  current_amount: 0.1 * pricePerGallon
                }
              });
              
              simulationRef.current[pumpKey].startedFueling = true;
              needsUpdate = true;
            }
          }

          // STATE 2: FUELING → Dispense fuel
          if (pump.status === 'fueling' && pump.preauth_amount > 0) {
            const currentGallons = pump.current_gallons || 0;
            const pricePerGallon = pump.preauth_amount / pump.preauth_gallons;
            
            const incrementGallons = 0.5;
            const newGallons = Math.min(currentGallons + incrementGallons, pump.preauth_gallons);
            const newAmount = newGallons * pricePerGallon;

            console.log(`[SIMULATOR] ⛽ Pump ${pump.pump_number}: FUELING ${newGallons.toFixed(2)}gal / $${newAmount.toFixed(2)}`);

            if (newGallons >= pump.preauth_gallons || newAmount >= pump.preauth_amount) {
              console.log(`[SIMULATOR] ✅ Pump ${pump.pump_number}: FUELING COMPLETE - Moving to ${pump.is_prepaid ? 'FINISHED' : 'PAYABLE'}`);
              
              updatesToMake.push({
                id: pump.id,
                data: {
                  status: pump.is_prepaid ? 'finished' : 'payable',
                  current_gallons: 0,
                  current_amount: 0,
                  last_transaction_gallons: pump.preauth_gallons,
                  last_transaction_amount: pump.preauth_amount
                }
              });
              
              simulationRef.current[pumpKey] = { finishedAt: Date.now(), isPrepaid: pump.is_prepaid };
              needsUpdate = true;
            } else {
              updatesToMake.push({
                id: pump.id,
                data: {
                  current_gallons: newGallons,
                  current_amount: newAmount
                }
              });
              needsUpdate = true;
            }
          }

          // STATE 3A: FINISHED (PREPAID) → Auto-reset after 3 seconds
          // CRITICAL FIX: Check for finished status properly and ensure reset works
          if (pump.status === 'finished') {
            if (!simulationRef.current[pumpKey]?.finishedAt) {
              simulationRef.current[pumpKey] = { 
                finishedAt: Date.now(), 
                isPrepaid: pump.is_prepaid,
                lastGallons: pump.last_transaction_gallons || 0,
                lastAmount: pump.last_transaction_amount || 0
              };
              console.log(`[SIMULATOR] 📝 Pump ${pump.pump_number}: FINISHED recorded at ${new Date().toLocaleTimeString()}`);
            }
            
            const timeSinceFinished = Date.now() - simulationRef.current[pumpKey].finishedAt;
            
            // CRITICAL: Reset after 3 seconds for ALL finished pumps
            if (timeSinceFinished > 3000) {
              console.log(`[SIMULATOR] 🔄 Pump ${pump.pump_number}: Auto-resetting to IDLE (${timeSinceFinished}ms since finished)`);
              
              updatesToMake.push({
                id: pump.id,
                data: {
                  status: 'idle',
                  preauth_amount: 0,
                  preauth_gallons: 0,
                  is_prepaid: false,
                  payment_completed: false,
                  active_product_code: null,
                  current_gallons: 0,
                  current_amount: 0
                  // CRITICAL FIX: DO NOT reset last_transaction data - keep it for history
                  // last_transaction_gallons and last_transaction_amount stay unchanged
                }
              });
              
              delete simulationRef.current[pumpKey];
              needsUpdate = true;
            }
          }
          
          // STATE 3B: PAYABLE (FILL UP) → Wait for cashier to add to cart
          if (pump.status === 'payable' && pump.is_prepaid === false) {
            console.log(`[SIMULATOR] 💳 Pump ${pump.pump_number}: PAYABLE - Waiting for cashier to add $${pump.last_transaction_amount?.toFixed(2)} to cart`);
          }

        } catch (error) {
          console.error(`[SIMULATOR] Error on pump ${pump.pump_number}:`, error);
        }
      }

      // Apply updates
      if (updatesToMake.length > 0) {
        for (const update of updatesToMake) {
          await Pump.update(update.id, update.data);
        }
        
        if (onUpdate && needsUpdate) {
          onUpdate();
        }
      }

    }, 500);

    return () => clearInterval(interval);
  }, [pumps, onUpdate]);

  return null;
}