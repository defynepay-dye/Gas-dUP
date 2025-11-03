
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  BookOpen, 
  Search, 
  Rocket, 
  ShoppingCart, 
  Package, 
  Fuel, 
  Shield, 
  Users, 
  BarChart2, 
  Gift, 
  Settings,
  Wrench,
  ChevronRight,
  Download,
  Play,
  FileText,
  Video,
  AlertCircle
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const guides = [
  {
    id: 'getting-started',
    title: 'Getting Started with FuelFlow Pro',
    icon: Rocket,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    sections: [
      {
        title: 'Welcome to FuelFlow Pro',
        content: `
**Welcome to the most powerful c-store management system!**

FuelFlow Pro is your all-in-one solution for:
- Point of Sale (POS) operations
- Fuel pump management
- Inventory tracking
- Security monitoring
- AI-powered analytics

**First Steps:**
1. Complete your station setup (if not done already)
2. Add your fuel pumps and products
3. Create user accounts for your staff
4. Configure your pricing and tax settings
5. Start your first shift!
        `
      },
      {
        title: 'Understanding the Dashboard',
        content: `
**Dashboard Overview:**

The BackOffice Dashboard gives you real-time insights:

📊 **Sales Metrics:**
- Today's sales and transaction count
- Average basket size
- Week and month performance
- Sales growth trends

⛽ **Fuel Operations:**
- Live pump status
- Fuel revenue and gallons sold
- Tank levels and alerts

🛡️ **Security & Loss Prevention:**
- Open security incidents
- Shelf monitoring alerts
- Low stock warnings

🎁 **Loyalty & Promotions:**
- Active members and redemptions
- Promotion performance

**Navigation Tips:**
- Click any metric card to drill down into details
- Use the refresh button to get latest data
- Set your location using the dropdown (multi-location users)
        `
      },
      {
        title: 'Setting Up Your Location',
        content: `
**Initial Location Setup:**

1. **Go to Settings Tab** → Store Settings
2. **Configure Receipt Settings:**
   - Upload your logo
   - Set header/footer text
   - Choose receipt format

3. **Set Up Tax Tiers:**
   - Go to Admin → Tax Configuration
   - Configure state, city, and special taxes
   - Set fuel tax rates

4. **Configure Dual Pricing (Cash Discount Program):**
   - Admin → Pricing Settings
   - Enable cash discount program
   - Set fuel markup (cents per gallon)
   - Set dry stock markup (percentage)

5. **Add Your Pumps:**
   - Pumps Tab → Add New Pump
   - Enter pump number and GPS coordinates
   - Enable mobile payment if desired

6. **Add Fuel Products:**
   - Products Tab → Add Fuel Product
   - Set cash prices (system calculates credit prices)
        `
      }
    ]
  },
  {
    id: 'pos-operations',
    title: 'POS Operations Manual',
    icon: ShoppingCart,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    sections: [
      {
        title: 'Processing Sales',
        content: `
**Step-by-Step Sale Process:**

1. **Scan or Search Products:**
   - Use barcode scanner for UPC codes
   - Click "Search" to manually find items
   - Products automatically add to cart

2. **Add Fuel Sales:**
   - Click the pump number when it shows "PAY" or "PAYABLE"
   - Fuel transaction details auto-populate
   - Verify gallons and amount

3. **Apply Discounts/Promotions:**
   - System auto-applies Mix & Match deals
   - Loyalty discounts applied when customer scanned
   - Manual discounts require manager approval

4. **Process Payment:**
   - Click "Pay" button
   - Select payment method:
     * **Cash**: Enter tendered amount, system calculates change
     * **Credit/Debit**: Card reader processes automatically
     * **EBT**: For eligible items only
     * **Mobile Payment**: Apple Pay, Google Pay, etc.

5. **Complete Transaction:**
   - Receipt prints automatically
   - Cash drawer opens for cash payments
   - Transaction logged in Journal

**Age-Restricted Items:**
- System prompts for ID verification
- Scan ID or enter birth date manually
- Manager override available if needed
        `
      },
      {
        title: 'Managing Fuel Sales',
        content: `
**Fuel Sale Workflow:**

**1. Customer Lifts Handle:**
- Pump status changes to "CALLING" (yellow)
- Audible alert may sound

**2. Authorize the Pump:**
- Click the calling pump number
- System prompts: "Prepay" or "Pay After"
  * **Prepay**: Customer pays first, then pumps
  * **Pay After**: Customer pumps, then pays (outdoor pay at pump)

**3. Customer Fuels:**
- Pump status shows "BUSY" (blue)
- Live gallons/amount display updates
- Stop fueling any time from POS if needed

**4. Complete Sale:**
- Pump returns to "PAYABLE" (orange)
- Click pump to add to sale
- Process payment normally

**Prepaid Fuel:**
1. Customer requests specific amount/gallons
2. Collect payment FIRST
3. Authorize pump for exact amount
4. Customer pumps up to authorized limit
5. If under-pump, issue refund for difference

**Mobile Pay-at-Pump:**
- Customer uses mobile app
- Pump authorized automatically
- Payment processed via app
- No POS interaction needed
        `
      },
      {
        title: 'Custom Items & Services',
        content: `
**Adding Custom Items:**

Custom items are for non-inventory products like:
- Propane refills
- Car washes
- Food service items
- Services

**How to Use:**
1. Click "Functions" tab in POS
2. Select category (Propane, Car Wash, Services)
3. Click specific item
4. Item adds to cart with preset price
5. Process payment normally

**Creating New Custom Items:**
1. POS Admin Panel → Custom Items
2. Click "Add New Category" or edit existing
3. Set item name, price, tax rate
4. Choose button color
5. Set sort order
6. Save and it appears immediately

**Common Use Cases:**
- **Propane**: Different sizes (5lb, 10lb, 20lb tanks)
- **Car Wash**: Basic, Deluxe, Premium packages
- **Services**: Oil changes, tire inflation, etc.
        `
      },
      {
        title: 'Held Transactions',
        content: `
**When to Hold a Transaction:**
- Customer forgot wallet
- Need manager approval
- Waiting for price check
- Customer needs to grab more items

**How to Hold:**
1. Build the sale as normal
2. Click "Hold" button (clock icon)
3. Enter customer name or identifier
4. Transaction saved temporarily

**Retrieving Held Sales:**
1. Click "Held (X)" button
2. Select customer's transaction
3. Sale loads back into cart
4. Complete payment as normal

**Important Notes:**
- Held transactions expire after 24 hours
- Fuel sales cannot be held (must complete immediately)
- Maximum 10 held transactions at once
        `
      },
      {
        title: 'Voids, Returns & Corrections',
        content: `
**Voiding Items Before Payment:**
1. Click the item in cart
2. Click "Void Item" button
3. Select reason
4. Manager approval may be required

**Processing Returns:**
1. Click "Admin" → "Return Item"
2. Search for original transaction
3. Select items to return
4. Process refund:
   - Same payment method as original
   - Cash refunds require manager approval
5. Return receipt prints

**Post-Void (After Payment):**
1. Requires manager authorization
2. Admin → Post Void
3. Enter transaction number
4. Provide reason
5. Refund processed automatically

**Important:**
- Fuel sales cannot be voided after pumping
- Returns reduce inventory counts
- All voids logged in audit trail
        `
      },
      {
        title: 'Shift Management',
        content: `
**Starting Your Shift:**

1. **Clock In:**
   - Admin → Clock In/Out
   - Scan badge or enter PIN
   - System records start time

2. **Count Cash Drawer:**
   - Count all bills and coins
   - Enter opening cash amount
   - Manager verifies if required

3. **Start Selling:**
   - POS is now active under your name
   - All sales logged to your shift

**During Your Shift:**
- **Safe Drops**: Admin → Cash Management → Safe Drop
- **Lottery Payouts**: Select tender type "Lottery Payout"
- **Vendor Payouts**: Admin → Vendor Payout
- **No-Sales**: Only open drawer with manager approval

**Ending Your Shift:**

1. **Stop Taking Sales:**
   - Inform manager you're ready to close

2. **Count Cash Drawer:**
   - Count final cash amount
   - Enter closing cash

3. **System Calculates:**
   - Expected cash = Opening + Cash Sales - Payouts - Drops
   - Over/Short = Actual - Expected

4. **Clock Out:**
   - Admin → Clock Out
   - Review shift summary
   - Manager reviews and signs off

**Shift Reports Available:**
- Sales by product category
- Payment method breakdown
- Fuel vs. store sales
- Over/short analysis
- Transaction count and average
        `
      }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory Management Guide',
    icon: Package,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    sections: [
      {
        title: 'Adding New Products',
        content: `
**Method 1: AI UPC Lookup (Recommended)**

1. Click "AI UPC Lookup" button
2. Scan or enter UPC code
3. AI fetches product information:
   - Product name
   - Category
   - Typical retail price
   - Pack structure
   - Age restrictions
4. Review and adjust prices
5. Click "Add Product"

**Method 2: Manual Entry**

1. Click "Add Manually"
2. Enter product details:
   - UPC code
   - Product name
   - Category
   - Cash price
   - Cost (for margin tracking)
   - Reorder level
   - Tax rate
3. Set pack structure (singles per box, boxes per case)
4. Enable age restriction if applicable
5. Save product

**Product Families:**
Use product families to group similar items (e.g., "20oz Pepsi Products"):
- Same pricing across family
- Bulk price updates
- Easier reporting
- Auto-categorization for new products

**Best Practices:**
- Always verify AI-suggested prices
- Set reorder levels based on sales velocity
- Use consistent naming conventions
- Add supplier information for easy reordering
        `
      },
      {
        title: 'Receiving Inventory',
        content: `
**Receiving Workflow:**

1. **Start Receiving Session:**
   - Inventory Tab → "Receive Inventory"
   - Select supplier
   - Enter invoice number

2. **Scan Products:**
   - Scan case/box UPC codes
   - System auto-converts to singles
   - Or manually enter quantities

3. **Enter Costs:**
   - Enter unit costs from invoice
   - System updates weighted average cost
   - Or FIFO layers if using FIFO costing

4. **Review & Post:**
   - Verify all items and quantities
   - Check total matches invoice
   - Click "Post to Inventory"
   - Inventory levels update immediately

**Handling Discrepancies:**
- Short shipments: Adjust quantity
- Damaged goods: Note in comments
- Price variances: AI audit flags automatically

**Multi-Unit Receiving:**
If supplier ships in cases:
1. Scan case UPC
2. System asks: "Box or Case?"
3. Select "Case"
4. Quantity multiplied automatically
   (e.g., 1 case × 12 boxes × 20 singles = 240 singles)

**Receiving Reports:**
- View receiving history
- Track supplier performance
- Identify cost trends
        `
      },
      {
        title: 'Stock Counts & Adjustments',
        content: `
**Physical Inventory Counts:**

**Preparation:**
1. Best done during slow hours or closed
2. Assign sections to staff members
3. Have count sheets or mobile devices ready

**Counting Process:**
1. Maintenance → Inventory Adjuster
2. Select location
3. Scan or enter product UPC
4. Enter actual count (in singles)
5. System calculates variance
6. Add notes for significant variances

**Adjustments:**
- System automatically adjusts inventory
- Variances logged for shrink analysis
- Manager approval for large adjustments

**Cycle Counting (Ongoing):**
Instead of full counts, do:
- High-value items: Weekly
- Fast movers: Bi-weekly  
- Everything else: Monthly

**Shrink Analysis:**
- BackOffice → Reports → Inventory Report
- View shrink by category
- Identify patterns (theft, damage, etc.)
- Implement controls for high-shrink items

**Common Adjustment Reasons:**
- Theft/shoplifting
- Damaged goods
- Expired products
- Receiving errors
- Unrecorded samples/promos
        `
      },
      {
        title: 'AI Inventory Recommendations',
        content: `
**How AI Inventory Works:**

The system analyzes:
- Historical sales patterns
- Seasonal trends
- Day-of-week variations
- Weather impact
- Shelf capacity
- Lead times

**Using AI Recommendations:**

1. **View Recommendations:**
   - Inventory Tab → AI Recommendations
   - See suggested reorder points and quantities

2. **Review Each Item:**
   - Current stock level
   - Predicted demand (daily/weekly)
   - Optimal reorder point
   - Recommended order quantity
   - Confidence score (0-100%)

3. **Take Action:**
   - **Approve**: Creates purchase order automatically
   - **Adjust**: Modify quantity then approve
   - **Reject**: If you disagree with AI

4. **Track Performance:**
   - AI learns from your decisions
   - Accuracy improves over time
   - View stockout prevention rate

**Smart Reorder Points:**
AI considers:
- Sales velocity (faster sellers = higher reorder point)
- Supplier lead time (longer = higher safety stock)
- Shelf space constraints
- Product profitability (prioritize high-margin items)

**Seasonal Intelligence:**
- AI predicts demand spikes (summer drinks, winter coffee)
- Suggests stocking up before events
- Reduces dead stock after season ends
        `
      },
      {
        title: 'Product Profitability Analysis',
        content: `
**Accessing Profitability Reports:**

Inventory Tab → Profitability Analysis

**Key Metrics:**

📊 **Gross Margin:**
- (Selling Price - Cost) / Selling Price × 100
- Goal: >25% for most products

💰 **Contribution Margin:**
- Total profit dollars per product
- Factors in sales volume
- High volume × low margin can beat low volume × high margin

📈 **Velocity Analysis:**
- Sales per day/week
- Inventory turn rate
- Identifies fast vs. slow movers

**Actions Based on Analysis:**

**High Margin + High Volume = Stars ⭐**
- Feature prominently
- Never stock out
- Consider increasing shelf space

**High Margin + Low Volume = Niche 🎯**
- Keep stocking
- May not need much shelf space
- Good for customer satisfaction

**Low Margin + High Volume = Traffic Drivers 🚗**
- Essential for competing (milk, bread, fuel)
- Use for promotions to drive traffic
- Cross-sell high-margin items

**Low Margin + Low Volume = Candidates for Elimination ❌**
- Consider discontinuing
- Or replace with better alternatives
- Frees up cash and space

**AI Insights:**
- Suggests product mix optimization
- Identifies bundle opportunities
- Recommends price adjustments
        `
      }
    ]
  },
  {
    id: 'fuel-management',
    title: 'Fuel Management Handbook',
    icon: Fuel,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    sections: [
      {
        title: 'Monitoring Tank Levels',
        content: `
**Tank Monitoring Dashboard:**

Fuel Tanks Tab shows:
- Current level in gallons
- Capacity and percentage full
- Product type
- Last reading date/time

**Color Coding:**
- 🟢 Green: Above 30% capacity
- 🟡 Yellow: 15-30% capacity (order soon)
- 🔴 Red: Below 15% capacity (urgent)

**Updating Tank Levels:**

**Method 1: Manual Stick Reading**
1. Perform physical stick reading
2. Click tank → "Update Level"
3. Enter gallons from stick
4. Add temperature reading
5. Save

**Method 2: ATG Integration (Future)**
- Automatic tank gauge systems
- Real-time level monitoring
- Automatic leak detection

**Setting Low-Level Alerts:**
1. Click tank → "Edit"
2. Set "Low Fuel Threshold"
3. System alerts when threshold reached
4. Configure email/SMS notifications

**Best Practices:**
- Check levels daily (morning routine)
- Stick tanks after each delivery
- Monitor for unusual drops (leaks)
- Plan orders to avoid running low
        `
      },
      {
        title: 'Receiving Fuel Deliveries',
        content: `
**Pre-Delivery Checklist:**
✅ Verify tank has capacity for load
✅ Clear delivery area
✅ Have delivery ticket ready
✅ Prepare to stick tanks

**During Delivery:**

1. **Meet Driver:**
   - Check delivery ticket matches order
   - Verify product types and quantities
   - Note seal numbers if applicable

2. **Monitor Delivery:**
   - Watch tank gauges
   - Listen for unusual sounds
   - Check for spills/leaks

3. **Stick Tanks Before:**
   - Record starting levels
   - Take temperature reading
   - Document in system

4. **Stick Tanks After:**
   - Wait 30 minutes for settling
   - Record ending levels
   - Take temperature reading

5. **Complete Receiving:**
   - Fuel Tanks → Receiving
   - Enter delivery details:
     * Delivery ticket number
     * Supplier
     * Product, gallons, price per gallon
     * Before/after readings
     * Temperature
   - Sign driver's ticket
   - System updates book inventory

**Discrepancy Handling:**

If delivered gallons ≠ ticket gallons:
1. Document variance on ticket
2. Have driver acknowledge
3. Note in system
4. Contact supplier immediately
5. Adjust invoice if needed

**Safety Reminders:**
- No smoking or open flames
- Fire extinguisher accessible
- Spill kit available
- Emergency contacts posted
        `
      },
      {
        title: 'Fuel Reconciliation',
        content: `
**Why Reconcile?**

Fuel reconciliation compares:
- **Book Inventory** (starting + deliveries - sales)
- **Physical Inventory** (stick readings)
- **Variance** (over/short)

**Reconciliation Schedule:**
- Daily: Quick check
- Weekly: Detailed analysis
- Monthly: Full audit

**Performing Reconciliation:**

1. **Go to Fuel Tanks Tab**
2. **Select Tank** → "Reconcile"
3. **System Shows:**
   - Starting inventory
   - Deliveries during period
   - Sales during period
   - Calculated ending (book)
   - Actual ending (physical)
   - Variance

4. **Acceptable Variance:**
   - ±0.5% is normal (temperature, measurement error)
   - ±1.0% investigate
   - >1.0% serious issue

**Common Causes of Variance:**

**Over (Book < Physical):**
- Temperature expansion
- Pump meter running slow (calibrate)
- Unrecorded sales

**Short (Book > Physical):**
- Temperature contraction
- Pump meter running fast (calibrate)
- Theft/drive-offs
- Leaks (serious - investigate immediately)
- Data entry errors

**Leak Detection:**
- Consistent daily shorts
- Increasing variance over time
- Unusual drops between readings
- If suspected: STOP selling, test tanks immediately

**AI Variance Analysis:**
- System flags unusual patterns
- Predicts expected variance ranges
- Alerts to potential theft/leaks
        `
      },
      {
        title: 'AI Fuel Pricing Strategy',
        content: `
**How AI Pricing Works:**

AI analyzes:
🌐 Competitor prices (real-time from internet)
📊 Local market trends
🛢️ Wholesale fuel costs (WTI crude, rack prices)
📍 Your location demographics
📈 Historical elasticity (how sales respond to price changes)

**Using AI Price Recommendations:**

1. **Generate Recommendations:**
   - AI Fuel Strategy Tab
   - Click "Generate New Recommendations"
   - Wait 30-60 seconds for AI analysis

2. **Review Recommendations:**
   - Current vs. recommended price per grade
   - Competitor pricing analysis
   - Market trend reasoning
   - Confidence score (0-100%)
   - Projected margin impact

3. **Take Action:**
   - **Approve & Apply Now**: Changes prices immediately
   - **Schedule**: Set specific date/time for change
   - **Reject**: Dismiss recommendation

**Price Change Strategies:**

**Aggressive (Gain Volume):**
- Price below closest competitors
- Lower margin but higher gallons
- Good when: slow period, excess supply

**Conservative (Protect Margin):
- Match or slightly above competitors
- Higher margin per gallon
- Good when: steady demand, limited supply

**Balanced (AI Default):**
- Competitive pricing with healthy margin
- Maximizes total profit (volume × margin)
- Usually AI recommendation

**Scheduling Price Changes:**
- Change prices during slow hours (avoid customer anger)
- Coordinate with competitors if possible
- Friday afternoon price increases common
- Monday morning decreases common

**Monitoring Performance:**
- Track volume response to price changes
- Compare AI predictions vs. actual results
- AI learns and improves recommendations

**Manual Overrides:**
- You can always override AI
- Use local knowledge (events, weather, competition actions)
- Document reason for future reference
        `
      }
    ]
  },
  {
    id: 'security',
    title: 'Security & Loss Prevention',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    sections: [
      {
        title: 'Understanding Security Incidents',
        content: `
**Types of Security Incidents:**

🚗 **Gas & Dash:**
- Customer fuels then drives off without paying
- AI detects vehicle leaving without POS transaction
- Captures license plate, make/model, color
- Video clip saved automatically

🛍️ **Shoplifting:**
- AI detects concealment behaviors
- Alerts staff in real-time
- Person description and clothing captured
- Video evidence preserved

🚶 **Loitering:**
- Person in area longer than normal
- May indicate casing for robbery
- Creates awareness for staff

🏢 **After-Hours Intrusion:**
- Motion detected when closed
- Immediate alert to manager/owner
- Can integrate with alarm system

🗑️ **Abandoned Objects:**
- Bag/box left unattended
- Safety concern
- Staff investigates

**Incident Alert Flow:**

1. **AI Detects Incident**
   - Camera analyzes video feed
   - Confidence score calculated
   - Severity assigned (Critical/High/Medium/Low)

2. **Staff Notified**
   - Alert bell on POS rings
   - Notification shows incident type
   - Video clip available immediately

3. **Staff Response**
   - Review incident details
   - Take appropriate action
   - Mark as "Under Review"

4. **Resolution**
   - Document outcome
   - Contact police if needed
   - Mark as "Resolved" with notes
   - Or "False Positive" if incorrect

**Best Practices:**
- Respond to all critical alerts immediately
- Review video evidence before confronting
- Follow company policy on interventions
- Let AI learn from false positives
        `
      },
      {
        title: 'Responding to Shelf Monitoring Alerts',
        content: `
**Shelf Intelligence System:**

AI cameras monitor shelves for:
- Out of stock situations
- Low stock (needs refill)
- Misplaced products
- Planogram violations

**Alert Types:**

📦 **Out of Stock - HIGH PRIORITY**
- Empty shelf space
- Lost sales opportunity
- Action: Restock from backroom immediately

📊 **Low Stock - MEDIUM PRIORITY**
- Less than 3 facings remaining
- Action: Add to restocking list

🔀 **Misplaced Product - MEDIUM**
- Product in wrong location
- Confuses customers
- Action: Move to correct spot

📋 **Planogram Violation - LOW**
- Products not arranged per plan
- Action: Reorganize per planogram

**Responding to Alerts:**

1. **Alert Appears on POS:**
   - Shows product name
   - Aisle and shelf section
   - Photo of the issue

2. **Staff Takes Action:**
   - Go to location
   - Fix the issue
   - Mark alert as "Resolved"

3. **System Tracks:**
   - Response time
   - Out of stock duration
   - Staff performance

**Performance Metrics:**
- Average response time
- Stock-out prevention rate
- Sales recovery (prevented lost sales)

**Benefits:**
- Reduce out-of-stocks by 80%+
- Improve customer satisfaction
- Increase sales (no lost opportunities)
- Better shelf presentation
        `
      },
      {
        title: 'Camera Management',
        content: `
**Camera Setup:**

1. **Add Camera:**
   - Security Tab → Camera Management
   - Click "Add Camera"
   - Enter camera details:
     * Friendly name
     * Location (Forecourt, Indoor, Shelf)
     * RTSP stream URL
   - Enable AI models:
     * Object detection
     * Person tracking
     * Shelf monitoring
     * Gas & dash detection

2. **Define Detection Zones:**
   - Click camera → "Edit Zones"
   - Draw zones on video feed
   - Set alert type per zone:
     * Intrusion (after hours)
     * Loitering (parking lot)
     * Queue monitoring (checkout)
     * Shelf monitoring (store aisles)

**AI Model Selection:**

**Forecourt Cameras:**
- ✅ Vehicle tracking
- ✅ Gas & dash detection
- ✅ License plate recognition
- ❌ Shelf monitoring (not needed)

**Indoor POS Cameras:**
- ✅ Person detection
- ✅ Queue monitoring
- ✅ Shoplifting detection
- ❌ Vehicle tracking (not needed)

**Shelf Cameras:**
- ✅ Shelf stock detection
- ✅ Planogram compliance
- ❌ Person detection (privacy)

**Storage Cameras:**
- ✅ Intrusion detection
- ✅ Motion alerts
- ❌ Advanced AI (basic monitoring)

**Video Retention:**
- Incidents: 90 days
- General footage: 30 days
- Can export clips for longer retention

**Privacy Considerations:**
- Facial recognition opt-in only
- Employee areas: reduced monitoring
- Restrooms: NO cameras
- Clear signage: "Video surveillance in use"
        `
      }
    ]
  },
  {
    id: 'users',
    title: 'User & Role Management',
    icon: Users,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    sections: [
      {
        title: 'Adding New Users',
        content: `
**User Creation Process:**

1. **Go to User Management Tab**
2. **Click "Add User"**
3. **Enter User Details:**
   - Full name
   - Username (for login)
   - Email address
   - Phone number
   - Role (see below)
   - Assigned location (if multi-location)

4. **Set Password:**
   - Temporary password
   - User must change on first login
   - Or send reset link via email

5. **Optional: Add PIN**
   - 4-digit quick login for POS
   - Faster than username/password
   - Good for cashiers

6. **Optional: RFID Badge**
   - Scan or enter badge number
   - Tap badge to clock in/out
   - Ultra-fast authentication

**User Roles:**

👤 **Cashier:**
- POS access only
- Cannot void without approval
- Cannot access BackOffice
- Time clock only

👔 **Store Manager:**
- Full POS access
- BackOffice access (single location)
- Can approve voids/returns
- Can manage staff
- Reports and analytics

🌐 **Regional Manager:**
- Multi-location access
- Cannot modify system settings
- Read-only on some areas
- Corporate reports

🏢 **Corporate Manager:**
- All locations access
- Full BackOffice
- Cannot modify core settings
- High-level analytics

⚙️ **Admin (System Administrator):**
- Full system access
- Can modify all settings
- User management
- System configuration

**Security Best Practices:**
- Use least privilege principle
- Review user access quarterly
- Disable unused accounts promptly
- Strong password requirements
- Enable two-factor auth (if available)
        `
      },
      {
        title: 'Permission Management',
        content: `
**Granular Permissions:**

Beyond roles, you can set specific permissions:

**POS Permissions:**
- ✅ Can void items
- ✅ Can process returns
- ✅ Can change prices
- ✅ Can open drawer (no-sale)
- ✅ Can view transaction journal
- ✅ Can access admin functions

**BackOffice Permissions:**
- ✅ View sales reports
- ✅ Manage inventory
- ✅ Add/edit products
- ✅ Configure pumps
- ✅ Manage users
- ✅ Access security cameras
- ✅ Modify system settings

**Shift & Cash Permissions:**
- ✅ Start/end shifts
- ✅ Perform safe drops
- ✅ Process payouts
- ✅ Adjust cash drawer
- ✅ View shift reports

**Setting Custom Permissions:**

1. User Management → Select User
2. Click "Permissions" tab
3. Toggle permissions on/off
4. Save changes
5. Takes effect immediately

**Common Permission Sets:**

**New Cashier:**
- POS cashier: ✅
- All others: ❌
- Manager approves voids

**Experienced Cashier:**
- POS cashier: ✅
- Can void items: ✅ (small amounts)
- Can process returns: ✅
- Others: ❌

**Assistant Manager:**
- Most POS permissions: ✅
- Limited BackOffice: ✅
- Cannot modify users: ❌
- Cannot change system settings: ❌

**Temporary Employee:**
- Basic POS only: ✅
- Time limited account
- Extra scrutiny on transactions
- Disable when no longer needed
        `
      },
      {
        title: 'Time & Attendance',
        content: `
**Clock In/Out System:**

**For Employees:**
1. **Clock In:**
   - POS → Admin → Clock In
   - Scan badge, enter PIN, or username/password
   - System records time and location

2. **Clock Out:**
   - POS → Admin → Clock Out
   - System calculates hours worked
   - Can review shift summary

**For Managers:**

**Monitoring Attendance:**
- Time & Attendance Tab
- See who's currently working
- View late arrivals
- Track early departures

**Editing Time Entries:**
1. Select employee
2. Find time entry
3. Click "Edit"
4. Adjust clock in/out times
5. Enter reason for change
6. Save (creates audit log)

**Payroll Export:**
1. Time & Attendance Tab
2. Select pay period
3. Click "Export for Payroll"
4. Downloads CSV file
5. Import into your payroll software

**Export Format:**
- Employee Name
- Employee ID
- Clock In Time
- Clock Out Time
- Total Hours
- Regular Hours
- Overtime Hours (if >40/week)
- Shift ID

**Overtime Calculation:**
- Automatic if >40 hours per week
- Can configure state-specific rules
- Separate overtime hours in export

**Time Off Tracking:**
- Request via mobile app
- Manager approves in BackOffice
- Counts against PTO balance
- Integrates with scheduling

**Scheduling (Future Feature):**
- Create employee schedules
- Shift templates
- Auto-fill based on needs
- Employee swap requests
        `
      }
    ]
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    icon: BarChart2,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    sections: [
      {
        title: 'Sales Reports',
        content: `
**Accessing Sales Reports:**

Reports Tab → Sales Report

**Available Reports:**

📊 **Daily Sales Summary:**
- Total sales by hour
- Transaction count
- Average basket size
- Payment method breakdown
- Busiest hours

📈 **Sales by Category:**
- Fuel vs. inside sales
- Product category breakdown
- Top selling items
- Slow movers

💰 **Payment Analysis:**
- Cash vs. credit breakdown
- Average credit transaction
- Cash tender patterns
- Payment processing fees

⛽ **Fuel Specific:**
- Gallons sold by grade
- Fuel revenue
- Fuel margin
- Price per gallon average

🏪 **Inside Store:**
- Dry stock sales
- Food service sales
- Lottery sales
- Other categories

**Customizing Reports:**

1. **Date Range:**
   - Today, Yesterday, Last 7 days
   - Last 30 days, This month, Last month
   - Custom range

2. **Filters:**
   - By location (multi-location)
   - By cashier
   - By shift
   - By product category

3. **Export Options:**
   - PDF (printable)
   - Excel (for analysis)
   - CSV (for other software)

**Key Metrics to Watch:**

📈 **Sales Trends:**
- Day-over-day growth
- Same-day-last-week comparison
- Month-over-month
- Year-over-year

🎯 **Performance Indicators:**
- Sales per transaction (basket size)
- Transactions per hour
- Sales per labor hour
- Conversion rate (traffic to sales)

**Using Data for Decisions:**
- Schedule staff based on busy hours
- Stock inventory for peak days
- Plan promotions for slow periods
- Adjust pricing based on elasticity
        `
      },
      {
        title: 'Inventory Reports',
        content: `
**Inventory Report Types:**

📦 **Current Stock Levels:**
- All products with quantities
- Filter by category
- Sort by value, quantity, velocity
- Flag low stock items

💰 **Inventory Valuation:**
- Total inventory value (at cost)
- Total inventory value (at retail)
- Potential profit
- By category breakdown

📉 **Shrink Analysis:**
- Total shrink amount
- Shrink percentage
- By category
- Trend over time
- High shrink items (investigate)

🔄 **Inventory Turnover:**
- How many times inventory sells per period
- Days of supply on hand
- Fast vs. slow movers
- Dead stock identification

📊 **ABC Analysis:**
- **A Items**: High value, tight control (20% of items, 80% of value)
- **B Items**: Moderate value, normal control
- **C Items**: Low value, simple control (80% of items, 20% of value)

**Profitability by Product:**
- Margin % by product
- Total profit contribution
- ROI (considering shelf space)
- Suggestions for discontinuation/expansion

**Receiving History:**
- All receiving transactions
- By supplier
- Cost trends over time
- Delivery performance

**Adjustment History:**
- All manual adjustments
- Reason codes
- By employee
- Shrink hotspots

**Generating Reports:**
1. Inventory Tab → Reports
2. Select report type
3. Set filters and date range
4. Click "Generate"
5. View or export

**Scheduled Reports:**
- Auto-generate weekly/monthly
- Email to managers
- Consistent tracking
        `
      },
      {
        title: 'Financial Reports',
        content: `
**Financial Overview:**

💵 **Profit & Loss (P&L):**
- Total revenue
- Cost of goods sold (COGS)
- Gross profit
- Operating expenses
- Net profit

**Revenue Breakdown:**
- Fuel sales
- Inside store sales
- Lottery commission
- Other revenue streams

**Expense Categories:**
- COGS (inventory costs)
- Labor (payroll)
- Utilities
- Rent/mortgage
- Maintenance
- Credit card fees
- Other operating expenses

📊 **Margin Analysis:**
- Gross margin % by category
- Overall store margin
- Fuel margin (cents per gallon)
- Inside store margin %

💳 **Accounts Receivable (if applicable):**
- Fleet card receivables
- Commercial accounts
- Aging report (current, 30, 60, 90+ days)

**Accounts Payable:**
- Open invoices by supplier
- Aging (current, 30, 60, 90+ days)
- Total AP balance
- Payment due dates

💰 **Cash Flow:**
- Cash position
- Daily cash flow
- Cash in drawer
- Bank deposits
- Safe contents

**Tax Reports:**
- Sales tax collected
- By tax jurisdiction
- Fuel tax (if applicable)
- Tax remittance due

**Generating Financial Reports:**
1. Reports Tab → Financial Report
2. Select report type
3. Choose period
4. Export to Excel for detailed analysis
5. Can import into accounting software

**Integration with Accounting:**
- Export to QuickBooks format
- Journal entries
- Daily sales summary
- Invoice data

**Key Financial KPIs:**
- Gross margin: >25% target
- Net margin: 2-4% typical for c-stores
- Inventory turnover: 12-24 times/year
- Labor as % of sales: <10%
- Sales per square foot
- EBITDA
        `
      },
      {
        title: 'Vendor Analytics & AP Reports',
        content: `
**Vendor Performance Tracking:**

📦 **Supplier Scorecard:**
- On-time delivery rate
- Order accuracy rate
- Average cost trend
- Total spend
- Number of orders
- Lead time consistency

💰 **Accounts Payable Dashboard:**

**Aging Buckets:**
- Current (0-30 days): Should be highest
- 31-60 days: Watch these
- 61-90 days: Concerning
- 90+ days: Critical - contact supplier

**Open Invoices:**
- Total AP balance
- Number of open invoices
- Average days outstanding
- By supplier breakdown

**Payment Performance:**
- On-time payment rate
- Early pay discounts captured
- Late payment fees incurred
- Average days to pay

**Cost Analysis:**
- Price trends by supplier
- Price variance alerts (AI flagged)
- Volume discount opportunities
- Rebate tracking

**Pending Receipts:**
- Purchase orders awaiting delivery
- Expected delivery dates
- Items on back order
- Value of pending orders

**Using Vendor Analytics:**

1. **Negotiate Better Terms:**
   - Show volume to request discounts
   - Demonstrate payment reliability
   - Request longer terms if performing well

2. **Identify Problem Suppliers:**
   - Consistent late deliveries
   - Frequent short shipments
   - Price inconsistencies
   - Poor product quality

3. **Optimize Cash Flow:**
   - Take advantage of early pay discounts
   - Time payments to maximize cash on hand
   - Avoid late fees

4. **Consolidate Suppliers:**
   - Reduce number of vendors
   - Increase volume per vendor
   - Simplify operations
   - Better pricing power

**Automated Alerts:**
- Invoice due in 3 days
- Invoice overdue
- Price increase detected
- Delivery delayed
- Unusual cost variance
        `
      }
    ]
  },
  {
    id: 'promotions',
    title: 'Promotions & Loyalty',
    icon: Gift,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    sections: [
      {
        title: 'Creating Mix & Match Promotions',
        content: `
**What is Mix & Match?**

Buy X items, get a deal (e.g., "2 for $5" or "3 for $6")

**Benefits:**
- Increase basket size
- Move slow inventory
- Compete with chain stores
- Manufacturer funded (sometimes)

**Creating a Promotion:**

1. **Go to Promotions Tab**
2. **Click "Create Promotion"**
3. **Enter Details:**

**Basic Info:**
- Promotion name (e.g., "Energy Drink 2/$5")
- Promotion code (for tracking)
- Start and end dates
- Active yes/no

**Deal Structure:**
- Quantity required (e.g., 2, 3, 4)
- Deal price (e.g., $5.00 for 2)
- Max applications per transaction (usually unlimited)

**Eligible Products:**
- Click "Add Products"
- Search by name, UPC, or category
- Select all qualifying items
- System shows regular price vs. deal price

**Manufacturer Funding (optional):**
- Manufacturer name
- Funding amount per deal
- Rebate code
- Helps track for reimbursement

4. **Save & Activate**

**Promotion Examples:**

🥤 **Beverages:**
- "2 for $3" on 20oz sodas
- "3 for $5" on energy drinks
- "4 for $5" on water bottles

🚬 **Tobacco (if legal in your state):**
- "2 for $10" on premium cigars
- "Buy 2, Save $1" on select brands

🍫 **Candy:**
- "3 for $2" on king size candy
- "5 for $5" on regular size

**Best Practices:**
- Clear signage at shelf
- Train staff to mention deals
- Update customer displays
- Track performance
- Adjust prices after promo ends
        `
      },
      {
        title: 'Managing Loyalty Members',
        content: `
**Loyalty Program Overview:**

**Member Benefits:**
- Earn points on purchases
- Redeem points for discounts
- Exclusive digital coupons
- Birthday rewards
- Tier benefits (Bronze, Silver, Gold, Platinum)

**Member Enrollment:**

**At POS:**
1. Customer provides phone number
2. Cashier enters in POS
3. If new: "Would you like to join our loyalty program?"
4. Collect: phone, email, name
5. Account created instantly
6. Start earning points immediately

**Via Mobile App (if available):**
1. Customer downloads app
2. Self-registers
3. Auto-syncs to POS

**Member Lookup:**
1. POS → Search customer
2. Enter phone number or email
3. Member profile loads
4. Shows:
   - Point balance
   - Tier status
   - Available digital coupons
   - Purchase history

**Point System:**

**Earning:**
- 1 point per $1 spent (configurable)
- Bonus points on specific items
- Double points days
- Tier multipliers

**Redeeming:**
- 100 points = $1 off (typical)
- At POS: "Redeem points?"
- Automatically applies discount
- Customer can save points if desired

**Digital Coupons:**

**Adding to Account:**
- Manufacturer offers loaded weekly
- Customer "clips" in app
- Or staff can load at POS

**Redemption:**
- Automatic at POS
- When qualifying product scanned
- Discount applied
- Coupon marked as used

**Managing Members:**

**View All Members:**
- Loyalty Tab
- Sort by: points, tier, spend, last visit
- Search by phone/email

**Member Details:**
- Total lifetime spend
- Points earned/redeemed
- Visit frequency
- Favorite products
- Churn risk score (AI)

**Member Communications:**
- Birthday rewards (auto-send)
- Points expiration warnings
- New offer notifications
- Win-back campaigns (inactive members)
        `
      }
    ]
  },
  {
    id: 'admin',
    title: 'System Administration',
    icon: Settings,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    sections: [
      {
        title: 'System Configuration',
        content: `
**Core Settings:**

**Store Information:**
- Store name and address
- Phone number
- Store hours
- Tax ID / EIN

**Tax Configuration:**
- State tax rate
- City/county tax
- Special district taxes
- Fuel tax rates
- Alcohol/tobacco taxes
- EBT exemptions

**Pricing Settings:**
- Cash discount program (on/off)
- Credit markup for fuel (cents/gallon)
- Credit markup for dry stock (%)
- Rounding rules

**Receipt Settings:**
- Header text
- Footer text
- Logo upload
- Show cashier name
- Show loyalty savings
- QR code for app download

**Payment Processing:**
- Payment terminal settings
- Gateway configuration
- Transaction fees
- Batch settlement time

**Hardware Configuration:**
- Receipt printer IP/port
- Cash drawer settings
- Scanner configuration
- Fuel controller connection

**Multi-Location Settings:**
- Regional assignments
- Central vs. local pricing
- Inventory transfers enabled
- Shared vs. local users
        `
      },
      {
        title: 'Backup & Data Management',
        content: `
**Data Backup:**

**Automatic Backups:**
- Cloud backup: Every 6 hours
- Local backup: Daily at 3 AM
- Transaction log: Real-time

**Manual Backup:**
1. Admin Tab → Data Management
2. Click "Create Backup Now"
3. Backup saved to cloud
4. Download link provided

**What's Backed Up:**
- All transactions
- Inventory data
- User accounts
- Configuration settings
- Price changes
- Video clips (security incidents)

**Backup Retention:**
- Daily backups: 30 days
- Weekly backups: 90 days
- Monthly backups: 1 year
- Critical data: Permanent

**Restoring Data:**
1. Contact support
2. Specify restore point
3. Confirm action
4. System restores from backup
5. Downtime: 15-30 minutes

**Data Export:**

**Transaction Data:**
- Export to CSV/Excel
- Date range selection
- All transaction details
- For external analysis

**Inventory Export:**
- Current stock levels
- Product master file
- Cost and price data

**User Export:**
- Employee list
- Roles and permissions
- Time & attendance data

**Compliance:**
- Data encrypted at rest and in transit
- PCI DSS compliant
- GDPR compliant (if applicable)
- SOC 2 Type II certified
- Regular security audits
        `
      },
      {
        title: 'Troubleshooting Common Issues',
        content: `
**POS Issues:**

**Problem: Scanner not working**
- Check USB connection
- Verify scanner power
- Test scanner in notepad (should type numbers)
- Restart POS terminal
- Replace scanner if still failing

**Problem: Receipt printer not printing**
- Check paper loaded correctly
- Verify power and USB/network cable
- Test print from printer settings
- Clear paper jam if present
- Check printer IP address (network printers)

**Problem: Credit card terminal not responding**
- Check terminal power and connection
- Verify network/phone line
- Reboot terminal (unplug 30 seconds)
- Confirm with payment processor
- Use manual entry as backup

**Problem: Cash drawer won't open**
- Check cable connection (usually to printer)
- Verify printer settings allow drawer kick
- Test with no-sale function
- Check for physical jam/obstruction
- Manual override: key on drawer

**Fuel Pump Issues:**

**Problem: Pump stuck in "CALLING" status**
- Click pump → "Manual Reset"
- Confirm reset action
- Pump returns to IDLE
- If persistent: check pump controller

**Problem: Pump shows offline but working**
- Forecourt controller may be disconnected
- Check network cables to controller
- Restart controller
- Contact support if persistent

**Problem: Fuel prices not updating at pump**
- Verify price change saved in system
- Send price update command to controller
- May take 5-10 minutes to propagate
- Reboot controller if still wrong

**Network Issues:**

**Problem: System running slow**
- Check internet connection speed
- Multiple large downloads?
- Restart router/modem
- Clear browser cache
- Check for system updates

**Problem: Can't access BackOffice**
- Verify internet connection
- Check login credentials
- Clear cookies and cache
- Try different browser
- VPN may be blocking (try without)

**Problem: Mobile app not syncing**
- Check customer's phone internet
- Verify app is latest version
- Log out and log back in
- Reinstall app if persistent

**When to Call Support:**
- Hardware failures
- Data corruption
- Security breaches
- Persistent software errors
- Payment processing issues
- Integration failures

**Support Contact:**
- Phone: 1-800-FUEL-SUPPORT
- Email: support@fuelflowpro.com
- Chat: Click "Support" in BackOffice
- Emergency: 24/7 on-call support
        `
      }
    ]
  }
];

export default function ResourcesTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuide, setSelectedGuide] = useState(null);

  const filteredGuides = guides.filter(guide =>
    guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guide.sections.some(section =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          Documentation & Learning Center
        </h2>
        <p className="text-gray-600 mt-1">Complete guides, manuals, and resources for FuelFlow Pro</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search guides, tutorials, and documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-6 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Guide Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGuides.map((guide) => {
          const Icon = guide.icon;
          return (
            <Card
              key={guide.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
              onClick={() => setSelectedGuide(guide)}
            >
              <CardHeader className={`${guide.bgColor} border-b`}>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-3 bg-white rounded-lg`}>
                    <Icon className={`w-6 h-6 ${guide.color}`} />
                  </div>
                  <span className="text-base">{guide.title}</span>
                </CardTitle>
                <CardDescription className="mt-2">
                  {guide.sections.length} sections
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {guide.sections.slice(0, 3).map((section, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <ChevronRight className="w-4 h-4" />
                      <span>{section.title}</span>
                    </div>
                  ))}
                  {guide.sections.length > 3 && (
                    <div className="text-sm text-gray-500 italic">
                      +{guide.sections.length - 3} more sections
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Guide Modal */}
      {selectedGuide && (
        <Dialog open={!!selectedGuide} onOpenChange={() => setSelectedGuide(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                {React.createElement(selectedGuide.icon, { className: `w-8 h-8 ${selectedGuide.color}` })}
                {selectedGuide.title}
              </DialogTitle>
            </DialogHeader>

            <Accordion type="single" collapsible className="w-full">
              {selectedGuide.sections.map((section, idx) => (
                <AccordionItem key={idx} value={`section-${idx}`}>
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-500" />
                      {section.title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg">
                      {section.content.split('\n').map((line, lineIdx) => {
                        // Bold text
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return (
                            <h3 key={lineIdx} className="font-bold text-lg mt-4 mb-2">
                              {line.replace(/\*\*/g, '')}
                            </h3>
                          );
                        }
                        // Bullet points
                        if (line.trim().startsWith('- ')) {
                          return (
                            <li key={lineIdx} className="ml-6">
                              {line.replace('- ', '')}
                            </li>
                          );
                        }
                        // Numbered lists
                        if (/^\d+\./.test(line.trim())) {
                          return (
                            <li key={lineIdx} className="ml-6">
                              {line.replace(/^\d+\.\s*/, '')}
                            </li>
                          );
                        }
                        // Emoji headers
                        if (line.includes('**') && /[\u{1F300}-\u{1F9FF}]/u.test(line)) {
                          return (
                            <h4 key={lineIdx} className="font-semibold text-base mt-3 mb-2">
                              {line.replace(/\*\*/g, '')}
                            </h4>
                          );
                        }
                        // Regular paragraphs
                        if (line.trim()) {
                          return (
                            <p key={lineIdx} className="mb-2">
                              {line}
                            </p>
                          );
                        }
                        return <br key={lineIdx} />;
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </DialogContent>
        </Dialog>
      )}

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Quick Access Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <Video className="w-6 h-6 text-purple-600" />
              <span className="font-semibold">Video Tutorials</span>
              <span className="text-xs text-gray-500">Watch how-to videos</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <Download className="w-6 h-6 text-green-600" />
              <span className="font-semibold">Download PDF Guides</span>
              <span className="text-xs text-gray-500">Print for reference</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <Play className="w-6 h-6 text-red-600" />
              <span className="font-semibold">Interactive Tours</span>
              <span className="text-xs text-gray-500">Guided walkthroughs</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
