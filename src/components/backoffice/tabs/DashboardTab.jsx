
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Droplets, Shield, Gift, Package,
  AlertTriangle, ChevronRight, Activity, ShoppingCart, Fuel, Award, FileText,
  RefreshCw, Clock, Target, Zap, BarChart3, PieChart, Calendar, Star, LayoutDashboard
} from 'lucide-react';
import { POSTransaction, SecurityIncident, LoyaltyProgram, InventoryItem, Pump, ShelfMonitoringEvent, MixMatchPromotion, Shift, TobaccoLoyaltyMember, TobaccoScanData, PersonalizedOffer, User, TimeClockEntry, AIFuelPriceRecommendation } from '@/api/entities';
import { base44 } from '@/api/base44Client';
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import TreasuryManagementDashboard from '../../treasury/TreasuryManagementDashboard';
import ActiveCashDrawersOverview from '../../treasury/ActiveCashDrawersOverview';

export default function DashboardTab({ currentScope }) {
  const [metrics, setMetrics] = useState({
    todaySales: 0,
    yesterdaySales: 0,
    weekSales: 0,
    monthSales: 0,
    transactionCount: 0,
    avgBasketSize: 0,
    salesTrend: [],
    fuelGallons: 0,
    fuelRevenue: 0,
    pumpStatus: { online: 0, offline: 0, fueling: 0 },
    fuelMargin: 0,
    totalProducts: 0,
    lowStockItems: 0,
    inventoryValue: 0,
    topSellingProducts: [],
    activePromotions: 0,
    loyaltyMembers: 0,
    tobaccoMembers: 0,
    eaivVerified: 0,
    offersRedeemed: 0,
    promotionSavings: 0,
    securityIncidents: 0,
    criticalIncidents: 0,
    shelfAlerts: 0,
    activeShifts: 0,
    clockedInEmployees: 0,
    pendingReconciliations: 0,
    totalEmployees: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [activeView, setActiveView] = useState('overview');

  const [locationPerformance, setLocationPerformance] = useState(null);
  const [aiStaffingInsights, setAiStaffingInsights] = useState(null);
  const [aiFuelInsights, setAiFuelInsights] = useState(null);
  const [scanDataInsights, setScanDataInsights] = useState(null);

  // NEW: State for active shifts data
  const [activeShiftsData, setActiveShiftsData] = useState([]);

  useEffect(() => {
    loadDashboardMetrics();
  }, [currentScope]);

  const loadDashboardMetrics = async () => {
    setIsLoading(true);
    const errorList = [];

    setLocationPerformance(null);
    setAiStaffingInsights(null);
    setAiFuelInsights(null);
    setScanDataInsights(null);
    setActiveShiftsData([]); // NEW: Reset active shifts data

    try {
      const now = new Date();
      const today = new Date(now); today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(0, 0, 0, 0);
      const yesterdayStart = yesterday.toISOString();
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7); weekAgo.setHours(0, 0, 0, 0);
      const weekStart = weekAgo.toISOString();
      const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1); monthAgo.setHours(0, 0, 0, 0);
      const monthStart = monthAgo.toISOString();

      let relevantLocationIds = [];

      if (currentScope?.type === 'location') {
        relevantLocationIds = [currentScope.id];
      } else if (currentScope?.type === 'region') {
        const regionsData = JSON.parse(sessionStorage.getItem('app_regions') || '[]');
        const region = regionsData.find(r => r.id === currentScope.id);
        if (region) {
          const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
          relevantLocationIds = locationsData
            .filter(loc => loc.region_id === currentScope.id)
            .map(loc => loc.id);
        }
      } else {
        const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
        relevantLocationIds = locationsData.map(loc => loc.id);
      }

      let transactions = [];
      let securityIncidents = [];
      let loyaltyPrograms = [];
      let inventory = [];
      let pumps = [];
      let shelfEvents = [];
      let promotions = [];
      let shifts = [];
      let tobaccoMembers = [];
      let scanData = [];
      let offers = [];
      let users = [];
      let timeEntries = [];

      try {
        if (relevantLocationIds.length === 1) {
          transactions = await base44.entities.POSTransaction.filter({ location_id: relevantLocationIds[0] }, '-created_date', 1000);
        } else {
          const allTransactions = await base44.entities.POSTransaction.list('-created_date', 2000);
          transactions = allTransactions.filter(t => relevantLocationIds.length === 0 || relevantLocationIds.includes(t.location_id));
        }
      } catch (error) {
        console.warn('Could not load transactions:', error);
        errorList.push('Transactions');
      }

      try {
        if (relevantLocationIds.length === 1) {
          securityIncidents = await base44.entities.SecurityIncident.filter({ location_id: relevantLocationIds[0] }, '-timestamp', 100);
        } else if (relevantLocationIds.length > 1) {
          const allIncidents = await base44.entities.SecurityIncident.list('-timestamp', 200);
          securityIncidents = allIncidents.filter(inc => relevantLocationIds.includes(inc.location_id));
        } else {
          securityIncidents = await base44.entities.SecurityIncident.list('-timestamp', 100);
        }
      } catch (error) {
        console.warn('Could not load security incidents:', error);
        errorList.push('Security Incidents');
      }

      try {
        loyaltyPrograms = await base44.entities.LoyaltyProgram.filter({ active: true });
      } catch (error) {
        console.warn('Could not load loyalty programs:', error);
        errorList.push('Loyalty Programs');
      }

      try {
        if (relevantLocationIds.length === 1) {
          inventory = await base44.entities.InventoryItem.filter({ location_id: relevantLocationIds[0] });
        } else if (relevantLocationIds.length > 1) {
          const allInventory = await base44.entities.InventoryItem.list();
          inventory = allInventory.filter(item => relevantLocationIds.includes(item.location_id));
        } else {
          inventory = await base44.entities.InventoryItem.list();
        }
      } catch (error) {
        console.warn('Could not load inventory:', error);
        errorList.push('Inventory');
      }

      try {
        if (relevantLocationIds.length === 1) {
          pumps = await base44.entities.Pump.filter({ location_id: relevantLocationIds[0] });
        } else if (relevantLocationIds.length > 1) {
          const allPumps = await base44.entities.Pump.list();
          pumps = allPumps.filter(pump => relevantLocationIds.includes(pump.location_id));
        } else {
          pumps = await base44.entities.Pump.list();
        }
      } catch (error) {
        console.warn('Could not load pumps:', error);
        errorList.push('Pumps');
      }

      try {
        if (relevantLocationIds.length === 1) {
          shelfEvents = await base44.entities.ShelfMonitoringEvent.filter({ location_id: relevantLocationIds[0], status: 'detected' });
        } else if (relevantLocationIds.length > 1) {
          const allShelfEvents = await base44.entities.ShelfMonitoringEvent.filter({ status: 'detected' });
          shelfEvents = allShelfEvents.filter(event => relevantLocationIds.includes(event.location_id));
        } else {
          shelfEvents = await base44.entities.ShelfMonitoringEvent.filter({ status: 'detected' });
        }
      } catch (error) {
        console.warn('Could not load shelf monitoring events:', error);
        errorList.push('Shelf Monitoring');
      }

      try {
        promotions = await base44.entities.MixMatchPromotion.filter({ active: true });
      } catch (error) {
        console.warn('Could not load promotions:', error);
        errorList.push('Promotions');
      }

      try {
        if (relevantLocationIds.length === 1) {
          shifts = await base44.entities.Shift.filter({ location_id: relevantLocationIds[0] }, '-start_time', 100);
        } else if (relevantLocationIds.length > 1) {
          const allShifts = await base44.entities.Shift.list('-start_time', 200);
          shifts = allShifts.filter(shift => relevantLocationIds.includes(shift.location_id));
        } else {
          shifts = await base44.entities.Shift.list('-start_time', 100);
        }
      } catch (error) {
        console.warn('Could not load shifts:', error);
        errorList.push('Shifts');
      }

      try {
        if (relevantLocationIds.length === 1) {
          tobaccoMembers = await base44.entities.TobaccoLoyaltyMember.filter({ location_id: relevantLocationIds[0] });
        } else if (relevantLocationIds.length > 1) {
          const allTobaccoMembers = await base44.entities.TobaccoLoyaltyMember.list();
          tobaccoMembers = allTobaccoMembers.filter(member => relevantLocationIds.includes(member.location_id));
        } else {
          tobaccoMembers = await base44.entities.TobaccoLoyaltyMember.list();
        }
      } catch (error) {
        console.warn('Could not load tobacco members:', error);
        errorList.push('Tobacco Loyalty');
      }

      try {
        if (relevantLocationIds.length === 1) {
          scanData = await base44.entities.TobaccoScanData.filter({ location_id: relevantLocationIds[0] }, '-reporting_period_start', 10);
        } else if (relevantLocationIds.length > 1) {
          const allScanData = await base44.entities.TobaccoScanData.list('-reporting_period_start', 20);
          scanData = allScanData.filter(data => relevantLocationIds.includes(data.location_id));
        } else {
          scanData = await base44.entities.TobaccoScanData.list('-reporting_period_start', 10);
        }
      } catch (error) {
        console.warn('Could not load scan data:', error);
        errorList.push('Scan Data');
      }

      try {
        if (relevantLocationIds.length === 1) {
          offers = await base44.entities.PersonalizedOffer.filter({ active: true, location_id: relevantLocationIds[0] });
        } else if (relevantLocationIds.length > 1) {
          const allOffers = await base44.entities.PersonalizedOffer.filter({ active: true });
          offers = allOffers.filter(offer => relevantLocationIds.includes(offer.location_id));
        } else {
          offers = await base44.entities.PersonalizedOffer.filter({ active: true });
        }
      } catch (error) {
        console.warn('Could not load offers:', error);
        errorList.push('Personalized Offers');
      }

      try {
        if (relevantLocationIds.length === 1) {
          users = await base44.entities.User.filter({ location_id: relevantLocationIds[0] });
        } else if (relevantLocationIds.length > 1) {
          const allUsers = await base44.entities.User.list();
          users = allUsers.filter(user => relevantLocationIds.includes(user.location_id));
        } else {
          users = await base44.entities.User.list();
        }
      } catch (error) {
        console.warn('Could not load users:', error);
        errorList.push('Users');
      }

      try {
        if (relevantLocationIds.length === 1) {
          timeEntries = await base44.entities.TimeClockEntry.filter({ status: 'clocked_in', location_id: relevantLocationIds[0] });
        } else if (relevantLocationIds.length > 1) {
          const allTimeEntries = await base44.entities.TimeClockEntry.filter({ status: 'clocked_in' });
          timeEntries = allTimeEntries.filter(entry => relevantLocationIds.includes(entry.location_id));
        } else {
          timeEntries = await base44.entities.TimeClockEntry.filter({ status: 'clocked_in' });
        }
      } catch (error) {
        console.warn('Could not load time entries:', error);
        errorList.push('Time Entries');
      }

      // NEW: Load active shifts for real-time cash drawer status
      try {
        let activeShiftsForDrawer = [];
        if (relevantLocationIds.length === 1) {
          activeShiftsForDrawer = await base44.entities.Shift.filter({
            status: 'active',
            location_id: relevantLocationIds[0]
          }, '-start_time', 50);
        } else if (relevantLocationIds.length > 1) {
          const allActiveShifts = await base44.entities.Shift.filter({ status: 'active' }, '-start_time', 100);
          activeShiftsForDrawer = allActiveShifts.filter(s => relevantLocationIds.includes(s.location_id));
        } else {
          activeShiftsForDrawer = await base44.entities.Shift.filter({ status: 'active' }, '-start_time', 100);
        }
        setActiveShiftsData(activeShiftsForDrawer);
      } catch (error) {
        console.warn('Could not load active shifts for drawer status:', error);
        errorList.push('Active Cash Drawers');
      }

      const todayTransactions = transactions.filter(t => t.created_date >= todayStart);
      const yesterdayTransactions = transactions.filter(t => t.created_date >= yesterdayStart && t.created_date < todayStart);
      const weekTransactions = transactions.filter(t => t.created_date >= weekStart);
      const monthTransactions = transactions.filter(t => t.created_date >= monthStart);

      const todaySales = todayTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const yesterdaySales = yesterdayTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const weekSales = weekTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
      const monthSales = monthTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);

      const salesTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dayStart = date.toISOString();
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        const dayEndStr = dayEnd.toISOString();

        const dayTransactions = transactions.filter(t => t.created_date >= dayStart && t.created_date <= dayEndStr);
        const daySales = dayTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);

        salesTrend.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          sales: daySales,
          transactions: dayTransactions.length
        });
      }

      const fuelTransactions = todayTransactions.filter(t => t.items?.some(item => item.is_fuel));
      const fuelGallons = fuelTransactions.reduce((sum, t) => sum + (t.items?.filter(i => i.is_fuel).reduce((s, i) => s + (i.quantity || 0), 0) || 0), 0);
      const fuelRevenue = fuelTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);

      const fuelCost = fuelGallons * 2.5; // Placeholder for actual cost
      const fuelMargin = fuelRevenue > 0 ? ((fuelRevenue - fuelCost) / fuelRevenue * 100) : 0;

      const openIncidents = securityIncidents.filter(i => i.status === 'open');
      const criticalIncidents = openIncidents.filter(i => i.severity === 'critical');

      const eaivVerified = tobaccoMembers.filter(m => m.eaiv_verified).length;

      const lowStockItems = inventory.filter(item => (item.inventory_tracking?.quantity_on_hand_singles || 0) <= (item.reorder_level || 0));
      const inventoryValue = inventory.reduce((sum, item) => sum + ((item.inventory_tracking?.quantity_on_hand_singles || 0) * (item.inventory_tracking?.weighted_average_cost || 0)), 0);

      const productSales = {};
      todayTransactions.forEach(t => {
        t.items?.forEach(item => {
          if (!item.is_fuel) {
            const key = item.product_name || item.upc_code;
            if (!productSales[key]) {
              productSales[key] = { name: key, quantity: 0, revenue: 0 };
            }
            productSales[key].quantity += item.quantity || 0;
            productSales[key].revenue += item.total_price || 0;
          }
        });
      });
      const topSellingProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      const pumpStatus = {
        online: pumps.filter(p => p.status === 'online').length,
        offline: pumps.filter(p => p.status === 'offline').length,
        fueling: pumps.filter(p => p.status === 'fueling').length
      };

      const activeShifts = shifts.filter(s => s.status === 'active').length;
      const clockedInEmployees = timeEntries.length;
      const pendingReconciliations = shifts.filter(s => s.status === 'completed' && !s.reconciled).length;

      // Placeholder for actual profit calculation logic
      const totalCost = monthSales * 0.7;
      const grossProfit = monthSales - totalCost;
      const operatingExpenses = monthSales * 0.15;
      const netProfit = grossProfit - operatingExpenses;
      const profitMargin = monthSales > 0 ? (netProfit / monthSales * 100) : 0;

      if ((currentScope?.type === 'enterprise' || currentScope?.type === 'region') && relevantLocationIds.length > 1) {
        try {
          const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
          const locationMetrics = relevantLocationIds.map(locId => {
            const location = locationsData.find(l => l.id === locId);
            const locationTransactions = transactions.filter(t => t.location_id === locId);
            const locationSales = locationTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
            const locationTransactionCount = locationTransactions.length;

            return {
              id: locId,
              name: location?.location_name || `Location ${locId.substring(0, 4)}`,
              sales: locationSales,
              transactionCount: locationTransactionCount,
              avgBasketSize: locationTransactionCount > 0 ? locationSales / locationTransactionCount : 0
            };
          });

          const sorted = [...locationMetrics].sort((a, b) => b.sales - a.sales);
          setLocationPerformance({
            topPerformers: sorted.slice(0, 3),
            bottomPerformers: sorted.slice(-3).reverse().filter(loc => loc.sales < 100 || loc.transactionCount < 5)
          });
        } catch (error) {
          console.warn('Could not calculate location performance:', error);
          errorList.push('Location Performance');
        }
      }

      try {
        const staffingPrompt = `Analyze the following shift data and identify:
1. Predicted employee shortages for the next 7 days
2. Potential no-shows based on historical patterns
3. Scheduling conflicts

Shift Data:
${JSON.stringify(shifts.slice(0, 50).map(s => ({
  employee: s.employee_name,
  status: s.status,
  start: s.start_time,
  end: s.end_time,
  reconciled: s.reconciled
})))}

Provide a concise summary with counts and actionable recommendations.`;

        const staffingAnalysis = await base44.integrations.Core.InvokeLLM({ prompt: staffingPrompt });
        setAiStaffingInsights(staffingAnalysis);
      } catch (error) {
        console.warn('Could not load AI staffing insights:', error);
        errorList.push('AI Staffing Insights');
      }

      try {
        let aiFuelRecs;
        if (relevantLocationIds.length === 1) {
          aiFuelRecs = await base44.entities.AIFuelPriceRecommendation.filter({ location_id: relevantLocationIds[0] }, '-created_date', 5);
        } else if (relevantLocationIds.length > 1) {
          const allFuelRecs = await base44.entities.AIFuelPriceRecommendation.list('-created_date', 10);
          aiFuelRecs = allFuelRecs.filter(rec => relevantLocationIds.includes(rec.location_id));
        } else {
          aiFuelRecs = await base44.entities.AIFuelPriceRecommendation.list('-created_date', 5);
        }

        if (aiFuelRecs.length > 0) {
          const pendingRecs = aiFuelRecs.filter(r => r.status === 'pending_review');
          const totalMarginImpact = pendingRecs.reduce((sum, rec) => sum + (rec.recommendations?.reduce((s, r) => s + (r.projected_margin_impact_daily || 0), 0) || 0), 0);
          setAiFuelInsights({
            pendingCount: pendingRecs.length,
            potentialMarginLift: totalMarginImpact
          });
        }
      } catch (error) {
        console.warn('Could not load AI fuel insights:', error);
        errorList.push('AI Fuel Insights');
      }

      try {
        const tobaccoData = scanData;
        const overdueReports = tobaccoData.filter(r => r.report_status === 'draft' && new Date(r.reporting_period_end) < new Date());
        const errorReports = tobaccoData.filter(r => (r.conexxus_metadata?.data_quality_score || 100) < 80);

        setScanDataInsights({
          overdueCount: overdueReports.length,
          errorCount: errorReports.length,
          totalReports: tobaccoData.length
        });
      } catch (error) {
        console.warn('Could not load scan data insights:', error);
        errorList.push('Scan Data Insights');
      }

      setMetrics({
        todaySales,
        yesterdaySales,
        weekSales,
        monthSales,
        transactionCount: todayTransactions.length,
        avgBasketSize: todayTransactions.length > 0 ? todaySales / todayTransactions.length : 0,
        salesTrend,
        fuelGallons,
        fuelRevenue,
        pumpStatus,
        fuelMargin,
        totalProducts: inventory.length,
        lowStockItems: lowStockItems.length,
        inventoryValue,
        topSellingProducts,
        activePromotions: promotions.length,
        loyaltyMembers: loyaltyPrograms.length,
        tobaccoMembers: tobaccoMembers.length,
        eaivVerified,
        offersRedeemed: offers.reduce((sum, o) => sum + (o.performance_metrics?.redemptions || 0), 0),
        promotionSavings: todayTransactions.reduce((sum, t) => sum + (t.promotion_discount || 0), 0),
        securityIncidents: openIncidents.length,
        criticalIncidents: criticalIncidents.length,
        shelfAlerts: shelfEvents.length,
        activeShifts,
        clockedInEmployees,
        pendingReconciliations,
        totalEmployees: users.filter(u => !u.is_disabled).length,
        grossProfit,
        netProfit,
        profitMargin
      });

      setErrors(errorList);
    } catch (error) {
      console.error('A general error occurred while loading dashboard metrics:', error);
      errorList.push('General Dashboard Data');
      setErrors(errorList);
    }
    setIsLoading(false);
  };

  const salesGrowth = metrics.yesterdaySales > 0 ? ((metrics.todaySales - metrics.yesterdaySales) / metrics.yesterdaySales * 100).toFixed(1) : 0;

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color, link, alert, chart }) => (
    <Card className={`hover:shadow-lg transition-all cursor-pointer ${alert ? 'border-2 border-red-500 animate-pulse' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {link && <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <p className="text-sm text-gray-600">{title}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">{subtitle}</p>
          {trend !== undefined && trend !== null && (
            <Badge className={trend > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {Math.abs(trend).toFixed(1)}%
            </Badge>
          )}
        </div>
        {chart && <div className="mt-4 h-16">{chart}</div>}
      </CardContent>
    </Card>
  );

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Executive Dashboard</h2>
          <p className="text-gray-600">
            {currentScope?.type === 'enterprise' && 'Enterprise-wide overview across all locations'}
            {currentScope?.type === 'region' && `Regional overview for ${currentScope.label}`}
            {currentScope?.type === 'location' && `Store overview for ${currentScope.label}`}
            {!currentScope && 'Enterprise-wide overview across all locations'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDashboardMetrics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Some data couldn't be loaded</p>
                <p className="text-sm text-amber-700 mt-1">
                  The following sections had issues: {errors.join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(currentScope?.type === 'enterprise' || currentScope?.type === 'region') && locationPerformance && (locationPerformance.topPerformers.length > 0 || locationPerformance.bottomPerformers.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {locationPerformance.topPerformers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="w-5 h-5" />
                  Top Performing Stores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {locationPerformance.topPerformers.map((loc, index) => (
                    <div key={loc.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{loc.name}</p>
                          <p className="text-sm text-gray-600">{loc.transactionCount} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">${loc.sales.toFixed(0)}</p>
                        <p className="text-sm text-gray-600">${loc.avgBasketSize.toFixed(2)} avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {locationPerformance.bottomPerformers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {locationPerformance.bottomPerformers.map((loc, index) => (
                    <div key={loc.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white font-bold">
                          {locationPerformance.bottomPerformers.length - index}
                        </div>
                        <div>
                          <p className="font-semibold">{loc.name}</p>
                          <p className="text-sm text-gray-600">{loc.transactionCount} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-red-600">${loc.sales.toFixed(0)}</p>
                        <p className="text-sm text-gray-600">${loc.avgBasketSize.toFixed(2)} avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {(aiFuelInsights || aiStaffingInsights || scanDataInsights) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiFuelInsights && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Zap className="w-5 h-5" />
                  AI Fuel Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-3xl font-bold text-purple-700">{aiFuelInsights.pendingCount}</p>
                    <p className="text-sm text-gray-600">Price Changes Recommended</p>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-lg font-semibold text-green-600">
                      +${aiFuelInsights.potentialMarginLift.toFixed(0)}/day
                    </p>
                    <p className="text-xs text-gray-600">Potential margin lift</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Review Recommendations →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {aiStaffingInsights && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Users className="w-5 h-5" />
                  AI Staffing Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {aiStaffingInsights.substring(0, Math.min(aiStaffingInsights.length, 200))}...
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  View Full Analysis →
                </Button>
              </CardContent>
            </Card>
          )}

          {scanDataInsights && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <FileText className="w-5 h-5" />
                  Scan Data Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Reports:</span>
                    <span className="font-semibold">{scanDataInsights.totalReports}</span>
                  </div>
                  {scanDataInsights.overdueCount > 0 && (
                    <div className="flex items-center justify-between text-red-600">
                      <span className="text-sm">Overdue:</span>
                      <span className="font-bold">{scanDataInsights.overdueCount}</span>
                    </div>
                  )}
                  {scanDataInsights.errorCount > 0 && (
                    <div className="flex items-center justify-between text-yellow-600">
                      <span className="text-sm">Quality Issues:</span>
                      <span className="font-bold">{scanDataInsights.errorCount}</span>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Scan Data →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* NEW: Active Cash Drawers Overview */}
      <ActiveCashDrawersOverview
        activeShifts={activeShiftsData}
        currentScope={currentScope}
      />

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sales">
            <BarChart3 className="w-4 h-4 mr-2" />
            Sales Analytics
          </TabsTrigger>
          <TabsTrigger value="fuel">
            <Fuel className="w-4 h-4 mr-2" />
            Fuel Management
          </TabsTrigger>
          <TabsTrigger value="treasury">
            <Shield className="w-4 h-4 mr-2" />
            Treasury
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Inventory & Products */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              Inventory & Products
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Products"
                value={metrics.totalProducts}
                subtitle="In catalog"
                icon={Package}
                color="bg-purple-500"
              />
              <MetricCard
                title="Low Stock Items"
                value={metrics.lowStockItems}
                subtitle="Need reorder"
                icon={AlertTriangle}
                color="bg-red-500"
                alert={metrics.lowStockItems > 0}
              />
              <MetricCard
                title="Inventory Value"
                value={`$${metrics.inventoryValue.toFixed(0)}`}
                subtitle="Total on hand"
                icon={DollarSign}
                color="bg-green-500"
              />
              <MetricCard
                title="Top Product Today"
                value={metrics.topSellingProducts[0]?.name?.substring(0, 15) || 'N/A'}
                subtitle={`$${metrics.topSellingProducts[0]?.revenue.toFixed(0) || 0} revenue`}
                icon={Star}
                color="bg-yellow-500"
              />
            </div>
          </div>

          {/* Promotions & Loyalty */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-600" />
              Promotions & Loyalty
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Active Promotions"
                value={metrics.activePromotions}
                subtitle="Running now"
                icon={Gift}
                color="bg-pink-500"
              />
              <MetricCard
                title="Tobacco Members"
                value={metrics.tobaccoMembers}
                subtitle={`${metrics.eaivVerified} EAIV verified`}
                icon={Shield}
                color="bg-blue-500"
              />
              <MetricCard
                title="Offers Redeemed"
                value={metrics.offersRedeemed}
                subtitle="Personalized offers"
                icon={Target}
                color="bg-purple-500"
              />
              <MetricCard
                title="Promo Savings"
                value={`$${metrics.promotionSavings.toFixed(2)}`}
                subtitle="Customer savings today"
                icon={DollarSign}
                color="bg-green-500"
              />
            </div>
          </div>

          {/* Security & Loss Prevention */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Security & Loss Prevention
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Open Incidents"
                value={metrics.securityIncidents}
                subtitle={`${metrics.criticalIncidents} critical`}
                icon={AlertTriangle}
                color="bg-red-500"
                alert={metrics.criticalIncidents > 0}
              />
              <MetricCard
                title="Shelf Alerts"
                value={metrics.shelfAlerts}
                subtitle="AI detected issues"
                icon={Package}
                color="bg-yellow-500"
                alert={metrics.shelfAlerts > 5}
              />
              <MetricCard
                title="Compliance Rate"
                value="100%"
                subtitle="Age verification"
                icon={Shield}
                color="bg-green-500"
              />
            </div>
          </div>

          {/* Employee Performance */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Employee Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Active Shifts"
                value={metrics.activeShifts}
                subtitle="Currently running"
                icon={Clock}
                color="bg-teal-500"
              />
              <MetricCard
                title="Clocked In"
                value={metrics.clockedInEmployees}
                subtitle="Employees working"
                icon={Users}
                color="bg-blue-500"
              />
              <MetricCard
                title="Pending Reconciliation"
                value={metrics.pendingReconciliations}
                subtitle="Shifts to review"
                icon={FileText}
                color="bg-orange-500"
                alert={metrics.pendingReconciliations > 0}
              />
              <MetricCard
                title="Total Staff"
                value={metrics.totalEmployees}
                subtitle="Active employees"
                icon={Users}
                color="bg-purple-500"
              />
            </div>
          </div>

          {/* Financial Health (30-Day) */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Financial Health (30-Day)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Gross Profit"
                value={`$${metrics.grossProfit.toFixed(0)}`}
                subtitle="Last 30 days"
                icon={DollarSign}
                color="bg-green-500"
              />
              <MetricCard
                title="Net Profit"
                value={`$${metrics.netProfit.toFixed(0)}`}
                subtitle="After expenses"
                icon={TrendingUp}
                color="bg-blue-500"
              />
              <MetricCard
                title="Profit Margin"
                value={`${metrics.profitMargin.toFixed(1)}%`}
                subtitle="Net margin"
                icon={Target}
                color="bg-purple-500"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          {/* Sales & Revenue */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Sales & Revenue
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Today's Sales"
                value={`$${metrics.todaySales.toFixed(2)}`}
                subtitle={`${metrics.transactionCount} transactions`}
                icon={DollarSign}
                trend={parseFloat(salesGrowth)}
                color="bg-blue-500"
              />
              <MetricCard
                title="Week Sales"
                value={`$${metrics.weekSales.toFixed(0)}`}
                subtitle="Last 7 days"
                icon={TrendingUp}
                color="bg-green-500"
              />
              <MetricCard
                title="Month Sales"
                value={`$${metrics.monthSales.toFixed(0)}`}
                subtitle="Last 30 days"
                icon={Calendar}
                color="bg-purple-500"
              />
              <MetricCard
                title="Avg Basket Size"
                value={`$${metrics.avgBasketSize.toFixed(2)}`}
                subtitle="Per transaction"
                icon={ShoppingCart}
                color="bg-indigo-500"
              />
            </div>
          </div>

          {/* Sales Trend - Last 7 Days */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Sales Trend - Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={metrics.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Sales ($)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Selling Products Today */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Top Selling Products Today</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.topSellingProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Transaction Volume - Last 7 Days */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Transaction Volume - Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="transactions" stroke="#10b981" strokeWidth={2} name="Transactions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel">
          {/* Fuel Operations */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Fuel className="w-5 h-5 text-orange-600" />
              Fuel Operations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Fuel Gallons Today"
                value={metrics.fuelGallons.toFixed(1)}
                subtitle="Total dispensed"
                icon={Droplets}
                color="bg-orange-500"
              />
              <MetricCard
                title="Fuel Revenue"
                value={`$${metrics.fuelRevenue.toFixed(2)}`}
                subtitle="Today's fuel sales"
                icon={DollarSign}
                color="bg-yellow-500"
              />
              <MetricCard
                title="Fuel Margin"
                value={`${metrics.fuelMargin.toFixed(1)}%`}
                subtitle="Current margin"
                icon={TrendingUp}
                color="bg-green-500"
              />
              <MetricCard
                title="Pumps Online"
                value={`${metrics.pumpStatus.online}/${metrics.pumpStatus.online + metrics.pumpStatus.offline}`}
                subtitle={`${metrics.pumpStatus.fueling} currently fueling`}
                icon={Fuel}
                color="bg-blue-500"
                alert={metrics.pumpStatus.offline > 0}
              />
            </div>
          </div>

          {/* Pump Status Distribution */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Pump Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={[
                      { name: 'Online', value: metrics.pumpStatus.online },
                      { name: 'Offline', value: metrics.pumpStatus.offline },
                      { name: 'Fueling', value: metrics.pumpStatus.fueling }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Online', value: metrics.pumpStatus.online },
                      { name: 'Offline', value: metrics.pumpStatus.offline },
                      { name: 'Fueling', value: metrics.pumpStatus.fueling }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treasury">
          <TreasuryManagementDashboard currentScope={currentScope} activeShiftsData={activeShiftsData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
