
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert"; // New import for Alert
import {
  Calendar as CalendarIcon,
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  Shield,
  Edit,
  Brain,
  RotateCcw,
  Download,
  Droplets, // New icon for fuel
  Package, // New icon for c-store
  CreditCard, // New icon for credit card transactions
  FileText, // New icon for sales tax
  MapPin // New icon for location context
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { POSTransaction, Shift, TaxSettings, CashManagement, Location, Transaction } from "@/api/entities"; // Added Location and Transaction

// Advanced Shift Report Component with Theft Detection
const DetailedShiftReport = ({ shift, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [editedShift, setEditedShift] = useState(shift);
  const [theftAnalysis, setTheftAnalysis] = useState(null);

  const analyzeShiftForTheft = useCallback(async (shiftData) => {
    try {
      // Simulate AI theft detection analysis
      const analysis = {
        risk_score: Math.random() * 100,
        red_flags: [],
        patterns: {
          unusual_voids: shiftData.transaction_count > 0 ? Math.random() * 5 : 0,
          discount_frequency: Math.random() * 10,
          cash_shortage_pattern: Math.abs(shiftData.closing_cash - shiftData.opening_cash) > 20,
          no_sale_frequency: Math.random() * 8
        }
      };

      // Add red flags based on patterns
      if (analysis.patterns.cash_shortage_pattern) {
        analysis.red_flags.push("Significant cash variance detected");
      }
      if (analysis.patterns.unusual_voids > 3) {
        analysis.red_flags.push("High number of voided transactions");
      }
      if (analysis.patterns.no_sale_frequency > 5) {
        analysis.red_flags.push("Excessive no-sale transactions");
      }

      setTheftAnalysis(analysis);
    } catch (error) {
      console.error("Error analyzing shift for theft:", error);
    }
  }, [setTheftAnalysis]); // Dependency: setTheftAnalysis

  useEffect(() => {
    // AI-powered theft detection analysis
    analyzeShiftForTheft(shift);
  }, [shift, analyzeShiftForTheft]); // Dependencies: shift, analyzeShiftForTheft

  const handleSaveShift = async () => {
    try {
      await Shift.update(shift.id, {
        opening_cash: Number(editedShift.opening_cash),
        closing_cash: Number(editedShift.closing_cash),
        notes: editedShift.notes,
        cash_adjustments: [...(shift.cash_adjustments || []), {
          adjusted_by: "Manager", // This would come from current user
          timestamp: new Date().toISOString(),
          field_adjusted: "closing_cash",
          old_value: shift.closing_cash,
          new_value: Number(editedShift.closing_cash),
          reason: "Manual adjustment for balancing"
        }]
      });
      onUpdate();
      setEditMode(false);
    } catch (error) {
      console.error("Error updating shift:", error);
    }
  };

  const expectedCash = (shift.opening_cash || 0) + (shift.total_sales || 0);
  const actualCash = editMode ? Number(editedShift.closing_cash) : (shift.closing_cash || 0);
  const variance = actualCash - expectedCash;

  return (
    <div className="space-y-6">
      {/* Shift Summary Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Shift {shift.shift_id} - {shift.employee_name}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={editMode ? "default" : "outline"}
                onClick={() => setEditMode(!editMode)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {editMode ? "Cancel" : "Edit"}
              </Button>
              {editMode && (
                <Button onClick={handleSaveShift} className="bg-green-600">
                  Save Changes
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Opening Cash</Label>
              {editMode ? (
                <Input
                  type="number"
                  value={editedShift.opening_cash}
                  onChange={(e) => setEditedShift({...editedShift, opening_cash: e.target.value})}
                />
              ) : (
                <p className="text-lg font-bold">${(shift.opening_cash || 0).toFixed(2)}</p>
              )}
            </div>
            <div>
              <Label>Total Sales</Label>
              <p className="text-lg font-bold">${(shift.total_sales || 0).toFixed(2)}</p>
            </div>
            <div>
              <Label>Closing Cash</Label>
              {editMode ? (
                <Input
                  type="number"
                  value={editedShift.closing_cash}
                  onChange={(e) => setEditedShift({...editedShift, closing_cash: e.target.value})}
                />
              ) : (
                <p className="text-lg font-bold">${(shift.closing_cash || 0).toFixed(2)}</p>
              )}
            </div>
            <div>
              <Label>Variance</Label>
              <p className={`text-lg font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {variance >= 0 ? '+' : ''}${variance.toFixed(2)}
              </p>
            </div>
          </div>

          {editMode && (
            <div className="mt-4">
              <Label>Adjustment Notes</Label>
              <Textarea
                value={editedShift.notes || ''}
                onChange={(e) => setEditedShift({...editedShift, notes: e.target.value})}
                placeholder="Enter reason for adjustments..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Theft Detection Analysis */}
      {theftAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              AI Theft Detection Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Risk Score</Label>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${
                    theftAnalysis.risk_score < 30 ? 'bg-green-500' :
                    theftAnalysis.risk_score < 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="font-bold">{theftAnalysis.risk_score.toFixed(1)}/100</span>
                </div>
              </div>
              <div>
                <Label>Red Flags ({theftAnalysis.red_flags.length})</Label>
                {theftAnalysis.red_flags.length > 0 ? (
                  <ul className="list-disc list-inside text-red-600 text-sm">
                    {theftAnalysis.red_flags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-green-600 text-sm">No significant red flags detected</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjustment History */}
      {shift.cash_adjustments && shift.cash_adjustments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Adjustment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Adjusted By</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Old Value</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shift.cash_adjustments.map((adj, i) => (
                  <TableRow key={i}>
                    <TableCell>{format(new Date(adj.timestamp), 'MMM d, h:mm a')}</TableCell>
                    <TableCell>{adj.adjusted_by}</TableCell>
                    <TableCell className="capitalize">{adj.field_adjusted.replace('_', ' ')}</TableCell>
                    <TableCell>${adj.old_value.toFixed(2)}</TableCell>
                    <TableCell>${adj.new_value.toFixed(2)}</TableCell>
                    <TableCell>{adj.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// New Profit & Loss Report Component
const ProfitLossReport = ({ dateRange, currentScope }) => {
  const [locations, setLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hierarchyLevel, setHierarchyLevel] = useState("store"); // store, region, state

  const loadLocations = useCallback(async () => {
    try {
      let locationData = await Location.list();
      // Filter locations based on currentScope if it's a region
      if (currentScope?.type === 'region' && currentScope?.id) {
          locationData = locationData.filter(loc => loc.region_id === currentScope.id);
      } else if (currentScope?.type === 'location' && currentScope?.id) {
          // If a single location is selected, only show that location in the dropdown
          locationData = locationData.filter(loc => loc.id === currentScope.id);
      }
      setLocations(locationData);
      if (locationData.length > 0) {
        // If currentScope is a single location, pre-select it
        if (currentScope?.type === 'location' && currentScope?.id) {
            setSelectedLocations([currentScope.id]);
        } else {
            // Otherwise, default to first location or none
            setSelectedLocations([]);
        }
      }
    } catch (error) {
      console.error("Error loading locations:", error);
    }
  }, [currentScope, setLocations, setSelectedLocations]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const generateProfitLossReport = useCallback(async () => {
    if (selectedLocations.length === 0 || !dateRange.from || !dateRange.to) {
        setReportData([]);
        return;
    }

    setIsLoading(true);
    try {
      const fromDate = dateRange.from.toISOString();
      const toDate = dateRange.to.toISOString();

      const reportPromises = selectedLocations.map(async (locationId) => {
        // Get location details
        const location = locations.find(l => l.id === locationId);

        // Get fuel transactions
        const fuelTransactions = await Transaction.filter({
          location_id: locationId,
          product_code: { "$in": ["regular", "midgrade", "premium", "diesel", "e85"] }, // Example product codes
          status: "completed",
          created_date: { "$gte": fromDate, "$lte": toDate }
        });

        // Get convenience store transactions
        const cstoreTransactions = await POSTransaction.filter({
          location_id: locationId,
          status: "completed",
          created_date: { "$gte": fromDate, "$lte": toDate }
        });

        // Calculate fuel metrics
        const fuelMetrics = fuelTransactions.reduce((acc, t) => {
          acc.volume += t.quantity_gallons || 0;
          acc.sales += t.total_amount || 0;
          acc.cost += (t.quantity_gallons || 0) * (t.cost_per_gallon || 0); // Assuming cost_per_gallon exists
          return acc;
        }, { volume: 0, sales: 0, cost: 0 });

        // Calculate c-store metrics
        const cstoreMetrics = cstoreTransactions.reduce((acc, t) => {
          acc.sales += t.total_amount || 0;
          // Estimate cost based on typical c-store margins (e.g., 40% margin, so 60% cost)
          // This is a simplification; in a real system, you'd use actual COGS for each item.
          acc.cost += (t.total_amount || 0) * 0.6;
          return acc;
        }, { sales: 0, cost: 0 });

        return {
          location_id: locationId,
          location_name: location?.location_name || "Unknown",
          region: location?.region_id || "Unknown", // Assuming a region_id field
          fuel: {
            volume: fuelMetrics.volume,
            sales: fuelMetrics.sales,
            cost: fuelMetrics.cost,
            gross_profit: fuelMetrics.sales - fuelMetrics.cost
          },
          cstore: {
            sales: cstoreMetrics.sales,
            cost: cstoreMetrics.cost,
            gross_profit: cstoreMetrics.sales - cstoreMetrics.cost
          }
        };
      });

      const data = await Promise.all(reportPromises);
      setReportData(data);
    } catch (error) {
      console.error("Error generating P&L report:", error);
      alert("Failed to generate Profit & Loss report.");
    }
    setIsLoading(false);
  }, [selectedLocations, dateRange, locations, setIsLoading, setReportData]);

  useEffect(() => {
    // Only auto-generate if there are selected locations and a date range
    if (selectedLocations.length > 0 && dateRange.from && dateRange.to) {
      generateProfitLossReport();
    } else {
        setReportData([]);
    }
  }, [selectedLocations, dateRange, generateProfitLossReport]);

  const addLocation = () => {
    // Only allow adding if there are unselected locations AND current scope allows adding
    const availableLocations = locations.filter(l => !selectedLocations.includes(l.id));
    if (availableLocations.length > 0) {
      setSelectedLocations([...selectedLocations, availableLocations[0].id]);
    }
  };

  const removeLocation = (locationId) => {
    setSelectedLocations(selectedLocations.filter(id => id !== locationId));
  };

  // Calculate totals
  const totals = reportData.reduce((acc, location) => {
    acc.fuel.volume += location.fuel.volume;
    acc.fuel.sales += location.fuel.sales;
    acc.fuel.cost += location.fuel.cost;
    acc.fuel.gross_profit += location.fuel.gross_profit;
    acc.cstore.sales += location.cstore.sales;
    acc.cstore.cost += location.cstore.cost;
    acc.cstore.gross_profit += location.cstore.gross_profit;
    return acc;
  }, {
    fuel: { volume: 0, sales: 0, cost: 0, gross_profit: 0 },
    cstore: { sales: 0, cost: 0, gross_profit: 0 }
  });

  return (
    <div className="space-y-6">
      {/* Location Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss by Location Comparative</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Label>Locations:</Label>
              {(!currentScope || currentScope.type === 'region' || currentScope.type === 'all') && ( // Only allow adding if not scoped to a single location
                <Button onClick={addLocation} variant="outline" size="sm" disabled={selectedLocations.length === locations.length}>
                  Add Location
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label>Hierarchy Level:</Label>
              <Select value={hierarchyLevel} onValueChange={setHierarchyLevel}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store">Store</SelectItem>
                  <SelectItem value="region">Region</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {selectedLocations.map(locationId => {
              const location = locations.find(l => l.id === locationId);
              return (
                <Badge key={locationId} variant="outline" className="flex items-center gap-1 pr-1">
                  <Select value={locationId} onValueChange={(newId) => {
                      // Ensure the newId is valid and not already selected
                      if (!selectedLocations.includes(newId)) {
                        setSelectedLocations(selectedLocations.map(id => id === locationId ? newId : id));
                      }
                  }}>
                    <SelectTrigger className="border-none shadow-none h-auto px-1 py-0.5 max-w-[150px]">
                      <SelectValue>{location?.location_name || "Select Location"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {locations.filter(l => !selectedLocations.includes(l.id) || l.id === locationId).map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.location_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(selectedLocations.length > 1 || currentScope?.type !== 'location') && ( // Don't allow removing if it's the only selected and it's from currentScope
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => removeLocation(locationId)}
                    >
                      ×
                    </Button>
                  )}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* P&L Report Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8">Generating profit & loss report...</div>
          ) : selectedLocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Please select at least one location to generate the report.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Fuel Volume</TableHead>
                    <TableHead className="text-right">Fuel Sales</TableHead>
                    <TableHead className="text-right">Fuel Cost</TableHead>
                    <TableHead className="text-right">Fuel Gross Profit</TableHead>
                    <TableHead className="text-right">C-Store Sales</TableHead>
                    <TableHead className="text-right">C-Store Cost</TableHead>
                    <TableHead className="text-right">C-Store Gross Profit</TableHead>
                    <TableHead className="text-right">Total Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((location) => (
                    <TableRow key={location.location_id}>
                      <TableCell className="font-medium">{location.location_name}</TableCell>
                      <TableCell className="text-right">{location.fuel.volume.toFixed(1)} gal</TableCell>
                      <TableCell className="text-right">${location.fuel.sales.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${location.fuel.cost.toFixed(2)}</TableCell>
                      <TableCell className={`text-right ${location.fuel.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${location.fuel.gross_profit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">${location.cstore.sales.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${location.cstore.cost.toFixed(2)}</TableCell>
                      <TableCell className={`text-right ${location.cstore.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${location.cstore.gross_profit.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-bold text-right">
                        ${(location.fuel.gross_profit + location.cstore.gross_profit).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell>TOTALS</TableCell>
                    <TableCell className="text-right">{totals.fuel.volume.toFixed(1)} gal</TableCell>
                    <TableCell className="text-right">${totals.fuel.sales.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${totals.fuel.cost.toFixed(2)}</TableCell>
                    <TableCell className={`text-right ${totals.fuel.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${totals.fuel.gross_profit.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">${totals.cstore.sales.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${totals.cstore.cost.toFixed(2)}</TableCell>
                    <TableCell className={`text-right ${totals.cstore.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${totals.cstore.gross_profit.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-lg text-right">
                      ${(totals.fuel.gross_profit + totals.cstore.gross_profit).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total Fuel Profit</p>
                <p className={`text-lg font-bold ${totals.fuel.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totals.fuel.gross_profit.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Total C-Store Profit</p>
                <p className={`text-lg font-bold ${totals.cstore.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totals.cstore.gross_profit.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Combined Gross Profit</p>
                <p className={`text-lg font-bold ${(totals.fuel.gross_profit + totals.cstore.gross_profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(totals.fuel.gross_profit + totals.cstore.gross_profit).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Locations Analyzed</p>
                <p className="text-lg font-bold">{selectedLocations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Credit Card Transaction Report Component
const CreditCardTransactionReport = ({ dateRange, currentScope }) => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    amount_min: '',
    amount_max: '',
    category: 'all', // all, fuel, dry_stock
    fuel_type: 'all', // all, regular, midgrade, premium, diesel
    card_type: 'all', // all, credit_card, debit_card
    status: 'all', // all, completed, refunded, partial_refund
    search_text: '' // for searching card last 4, auth codes, etc.
  });
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundingTransaction, setRefundingTransaction] = useState(null);

  const checkFuelRefundEligibility = useCallback((transaction) => {
    // Auto-refund logic: if authorized amount > actual amount dispensed
    const authorizedAmount = transaction.preauth_amount || transaction.total_amount;
    const actualAmount = transaction.total_amount;
    return authorizedAmount > actualAmount && (authorizedAmount - actualAmount) > 0.05; // Only if difference > 5 cents
  }, []);

  const loadCreditCardTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const fromDate = dateRange.from?.toISOString();
      const toDate = dateRange.to?.toISOString();

      let commonFilter = {
        created_date: { "$gte": fromDate, "$lte": toDate }
      };

      // Apply scope filtering
      if (currentScope?.type === 'location' && currentScope?.id) {
        commonFilter.location_id = currentScope.id;
      } else if (currentScope?.type === 'region' && currentScope?.id) {
        const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
        const regionLocationIds = locationsData
          .filter(loc => loc.region_id === currentScope.id)
          .map(loc => loc.id);
        if (regionLocationIds.length > 0) {
          commonFilter.location_id = { "$in": regionLocationIds }; // Assuming filter supports $in
        } else {
          // No locations in this region, so no data
          setTransactions([]);
          setIsLoading(false);
          return;
        }
      }

      // Load fuel transactions
      const fuelTransactions = await Transaction.filter({
        ...commonFilter,
        payment_method: { "$in": ["credit_card", "debit_card"] },
      }, "-created_date");

      // Load POS transactions
      const posTransactions = await POSTransaction.filter({
        ...commonFilter,
        "payments.method": { "$in": ["credit_card", "debit_card"] },
      }, "-created_date");

      // Combine and standardize transactions
      const combinedTransactions = [
        ...fuelTransactions.map(t => ({
          ...t,
          transaction_type: 'fuel',
          display_items: `${t.product_code} Fuel - ${t.quantity_gallons?.toFixed(2) || 0} gal`,
          payment_amount: t.total_amount,
          refund_eligible: checkFuelRefundEligibility(t),
          card_info: {
            last_four: t.card_last_four,
            auth_code: t.authorization_code,
            method: t.payment_method
          }
        })),
        ...posTransactions.map(t => {
          const cardPayment = t.payments?.find(p => ['credit_card', 'debit_card'].includes(p.method));
          return {
            ...t,
            transaction_type: 'dry_stock',
            display_items: t.items?.map(item => `${item.product_name} x${item.quantity}`).join(', ') || 'N/A',
            payment_amount: t.total_amount,
            refund_eligible: t.status === 'completed',
            card_info: {
              last_four: cardPayment?.last_four,
              auth_code: cardPayment?.authorization_code,
              method: cardPayment?.method
            }
          };
        })
      ];

      setTransactions(combinedTransactions);
    } catch (error) {
      console.error("Error loading credit card transactions:", error);
      alert("Failed to load credit card transactions.");
    }
    setIsLoading(false);
  }, [dateRange, currentScope, setIsLoading, setTransactions, checkFuelRefundEligibility]);

  useEffect(() => {
    loadCreditCardTransactions();
  }, [loadCreditCardTransactions]);

  const applyFilters = useCallback(() => {
    let filtered = [...transactions];

    // Amount filters
    if (filters.amount_min) {
      filtered = filtered.filter(t => t.payment_amount >= parseFloat(filters.amount_min));
    }
    if (filters.amount_max) {
      filtered = filtered.filter(t => t.payment_amount <= parseFloat(filters.amount_max));
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(t =>
        (filters.category === 'fuel' && t.transaction_type === 'fuel') ||
        (filters.category === 'dry_stock' && t.transaction_type === 'dry_stock')
      );
    }

    // Fuel type filter
    if (filters.fuel_type !== 'all') {
      filtered = filtered.filter(t =>
        t.transaction_type === 'fuel' && t.product_code === filters.fuel_type
      );
    }

    // Card type filter
    if (filters.card_type !== 'all') {
      filtered = filtered.filter(t =>
        t.card_info?.method === filters.card_type || t.payment_method === filters.card_type
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    // Text search
    if (filters.search_text) {
      const searchLower = filters.search_text.toLowerCase();
      filtered = filtered.filter(t =>
        t.card_info?.last_four?.includes(searchLower) ||
        t.card_info?.auth_code?.toLowerCase().includes(searchLower) ||
        t.display_items?.toLowerCase().includes(searchLower) ||
        t.transaction_number?.toLowerCase().includes(searchLower) ||
        t.transaction_id?.toLowerCase().includes(searchLower) // For fuel transactions that might use transaction_id instead of number
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, filters, setFilteredTransactions]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const processRefund = useCallback(async (transaction, refundAmount, reason) => {
    try {
      const updateData = {
        status: refundAmount < transaction.payment_amount ? 'partial_refund' : 'refunded',
        refund_amount: (transaction.refund_amount || 0) + refundAmount,
        refund_reason: reason,
        refunded_date: new Date().toISOString()
      };

      if (transaction.transaction_type === 'fuel') {
        await Transaction.update(transaction.id, updateData);
      } else {
        await POSTransaction.update(transaction.id, updateData);
      }

      // Create cash management record for refund
      await CashManagement.create({
        transaction_type: 'refund',
        amount: -refundAmount, // Negative for outgoing
        reference_number: transaction.transaction_number || transaction.transaction_id,
        notes: `Refund: ${reason} for transaction ${transaction.transaction_number || transaction.transaction_id}`,
        cashier_name: 'System', // This would be current user
        manager_authorization: 'Manager' // This would be current manager
      });

      alert('Refund processed successfully!');
      await loadCreditCardTransactions(); // Directly call the data-fetching function to refresh
      setShowRefundModal(false);
      setRefundingTransaction(null);
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Error processing refund. Please try again.');
    }
  }, [loadCreditCardTransactions, setShowRefundModal, setRefundingTransaction]);

  const processAutomaticRefunds = useCallback(async () => {
    setIsLoading(true);
    const eligibleTransactions = transactions.filter(t =>
      t.transaction_type === 'fuel' && t.refund_eligible && t.status === 'completed'
    );

    let processedCount = 0;
    for (const transaction of eligibleTransactions) {
      const refundAmount = (transaction.preauth_amount || 0) - (transaction.total_amount || 0);
      if (refundAmount > 0.05) { // Only refund if difference is significant
        try {
          await processRefund(transaction, refundAmount, 'Automatic refund - under-pump authorization correction');
          processedCount++;
        } catch (error) {
          console.error(`Failed to process auto-refund for transaction ${transaction.id}:`, error);
        }
      }
    }

    if (processedCount > 0) {
      alert(`Processed ${processedCount} automatic fuel refunds.`);
      // Refresh data after all auto-refunds are attempted.
      // processRefund already calls loadCreditCardTransactions, but this ensures a final refresh
      // even if individual refunds failed but some succeeded.
      await loadCreditCardTransactions();
    } else {
      alert("No eligible automatic fuel refunds found or processed.");
    }
    setIsLoading(false);
  }, [transactions, setIsLoading, processRefund, loadCreditCardTransactions]);


  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Card Transaction Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-text">Search</Label>
              <Input
                id="search-text"
                placeholder="Card #, Auth Code, Item..."
                value={filters.search_text}
                onChange={(e) => setFilters({...filters, search_text: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount-min">Min Amount</Label>
              <Input
                id="amount-min"
                type="number"
                step="0.01"
                placeholder="$0.00"
                value={filters.amount_min}
                onChange={(e) => setFilters({...filters, amount_min: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount-max">Max Amount</Label>
              <Input
                id="amount-max"
                type="number"
                step="0.01"
                placeholder="$999.99"
                value={filters.amount_max}
                onChange={(e) => setFilters({...filters, amount_max: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="fuel">Fuel Only</SelectItem>
                  <SelectItem value="dry_stock">Dry Stock Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuel-type">Fuel Type</Label>
              <Select value={filters.fuel_type} onValueChange={(value) => setFilters({...filters, fuel_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fuel Types</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="midgrade">Midgrade</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-type">Card Type</Label>
              <Select value={filters.card_type} onValueChange={(value) => setFilters({...filters, card_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Card Types</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="partial_refund">Partial Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={processAutomaticRefunds} className="w-full" disabled={isLoading}>
                Process Auto-Refunds
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Credit Card Transactions ({filteredTransactions.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadCreditCardTransactions} disabled={isLoading}>
                <RotateCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Items/Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Card Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-4">No transactions found for the selected filters.</TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={`${transaction.transaction_type}-${transaction.id}`}>
                        <TableCell>
                          {format(new Date(transaction.created_date), 'MM/dd/yy HH:mm')}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {transaction.transaction_number || transaction.transaction_id}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.transaction_type === 'fuel' ? 'default' : 'secondary'}>
                            {transaction.transaction_type === 'fuel' ? 'Fuel' : 'Dry Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {transaction.display_items}
                        </TableCell>
                        <TableCell className="font-mono">
                          ${transaction.payment_amount?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>**** {transaction.card_info?.last_four || 'N/A'}</div>
                            <div className="text-gray-500">{transaction.card_info?.auth_code || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            transaction.status === 'completed' ? 'default' :
                            transaction.status === 'refunded' ? 'destructive' :
                            transaction.status === 'partial_refund' ? 'warning' : 'secondary'
                          }>
                            {transaction.status}
                          </Badge>
                          {transaction.refund_eligible && transaction.status === 'completed' && (
                            <Badge variant="outline" className="ml-2">Auto-Refund Eligible</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {transaction.status === 'completed' || transaction.status === 'partial_refund' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRefundingTransaction(transaction);
                                setShowRefundModal(true);
                              }}
                            >
                              Refund
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled>Refunded</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Modal */}
      {showRefundModal && refundingTransaction && (
        <RefundModal
          transaction={refundingTransaction}
          onRefund={processRefund}
          onClose={() => {
            setShowRefundModal(false);
            setRefundingTransaction(null);
          }}
        />
      )}
    </div>
  );
};

// Refund Modal Component
const RefundModal = ({ transaction, onRefund, onClose }) => {
  const [refundAmount, setRefundAmount] = useState(transaction.payment_amount - (transaction.refund_amount || 0));
  const [refundReason, setRefundReason] = useState('');

  const handleRefund = () => {
    if (!refundReason.trim()) {
      alert('Please provide a reason for the refund.');
      return;
    }
    if (refundAmount <= 0 || refundAmount > (transaction.payment_amount - (transaction.refund_amount || 0))) {
      alert(`Invalid refund amount. Must be between $0.01 and $${(transaction.payment_amount - (transaction.refund_amount || 0)).toFixed(2)}.`);
      return;
    }
    onRefund(transaction, refundAmount, refundReason);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Transaction</Label>
            <p className="text-sm text-gray-600">
              {transaction.transaction_number || transaction.transaction_id} - Original: ${transaction.payment_amount?.toFixed(2)}
              {transaction.refund_amount > 0 && ` (Refunded: $${transaction.refund_amount.toFixed(2)})`}
            </p>
            <p className="text-sm text-gray-600">{transaction.display_items}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund-amount">Refund Amount</Label>
            <Input
              id="refund-amount"
              type="number"
              step="0.01"
              max={(transaction.payment_amount - (transaction.refund_amount || 0)).toFixed(2)}
              value={refundAmount}
              onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund-reason">Reason for Refund</Label>
            <Textarea
              id="refund-reason"
              placeholder="Enter reason for refund..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleRefund}>Process Refund</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ReportContent = ({ isLoading, data, reportType, onShiftUpdate, dateRange }) => {
  // P&L and Credit Card reports handle their own loading and 'no data' states
  const handledInternally = ["profit_loss_report", "credit_card_transactions"];

  if (isLoading && !handledInternally.includes(reportType)) {
    return <div className="text-center py-8">Generating report...</div>;
  }

  if ((!data || data.length === 0) && !handledInternally.includes(reportType)) {
    return <div className="text-center py-8 text-gray-500">No data found for the selected period.</div>;
  }

  switch (reportType) {
    case "daily_sales_summary":
      const totalSales = data.reduce((sum, item) => sum + (item.total_amount || 0), 0);
      const totalTransactions = data.length;
      const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Total Sales</p>
                    <p className="text-xl font-bold">${totalSales.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Transactions</p>
                    <p className="text-xl font-bold">{totalTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-500">Average Ticket</p>
                    <p className="text-xl font-bold">${averageTicket.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction #</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.transaction_number}</TableCell>
                  <TableCell>{format(new Date(transaction.created_date), 'h:mm a')}</TableCell>
                  <TableCell>{transaction.cashier_name}</TableCell>
                  <TableCell>{transaction.items?.length || 0}</TableCell>
                  <TableCell>${(transaction.subtotal || 0).toFixed(2)}</TableCell>
                  <TableCell>${(transaction.tax_total || 0).toFixed(2)}</TableCell>
                  <TableCell>${(transaction.total_amount || 0).toFixed(2)}</TableCell>
                  <TableCell className="capitalize">{transaction.payments?.[0]?.method || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.status === 'completed' ? 'default' : 'destructive'}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );

    case "monthly_sales_summary":
      // Group data by day for monthly view
      const dailyTotals = data.reduce((acc, transaction) => {
        const date = format(new Date(transaction.created_date), 'yyyy-MM-dd');
        if (!acc[date]) {
          acc[date] = { sales: 0, transactions: 0, tax: 0 };
        }
        acc[date].sales += transaction.total_amount || 0;
        acc[date].transactions += 1;
        acc[date].tax += transaction.tax_total || 0;
        return acc;
      }, {});

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-xl font-bold">
                  ${Object.values(dailyTotals).reduce((sum, day) => sum + day.sales, 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Tax</p>
                <p className="text-xl font-bold">
                  ${Object.values(dailyTotals).reduce((sum, day) => sum + day.tax, 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-xl font-bold">
                  {Object.values(dailyTotals).reduce((sum, day) => sum + day.transactions, 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Trading Days</p>
                <p className="text-xl font-bold">{Object.keys(dailyTotals).length}</p>
              </CardContent>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Tax Collected</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Average Ticket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(dailyTotals).map(([date, totals]) => (
                <TableRow key={date}>
                  <TableCell>{format(new Date(date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>${totals.sales.toFixed(2)}</TableCell>
                  <TableCell>${totals.tax.toFixed(2)}</TableCell>
                  <TableCell>{totals.transactions}</TableCell>
                  <TableCell>${(totals.sales / totals.transactions).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );

    case "sales_tax_report":
      const taxSummary = data.reduce((acc, transaction) => {
        acc.totalSales += transaction.subtotal || 0;
        acc.totalTax += transaction.tax_total || 0;
        acc.transactions += 1;
        return acc;
      }, { totalSales: 0, totalTax: 0, transactions: 0 });

      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Tax Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Taxable Sales</Label>
                  <p className="text-xl font-bold">${taxSummary.totalSales.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Tax Collected</Label>
                  <p className="text-xl font-bold">${taxSummary.totalTax.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Effective Tax Rate</Label>
                  <p className="text-xl font-bold">
                    {taxSummary.totalSales > 0 ? ((taxSummary.totalTax / taxSummary.totalSales) * 100).toFixed(2) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Tax Amount</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Tax Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.transaction_number}</TableCell>
                  <TableCell>{format(new Date(transaction.created_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>${(transaction.subtotal || 0).toFixed(2)}</TableCell>
                  <TableCell>${(transaction.tax_total || 0).toFixed(2)}</TableCell>
                  <TableCell>${(transaction.total_amount || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    {transaction.subtotal > 0 ? ((transaction.tax_total / transaction.subtotal) * 100).toFixed(2) : 0}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    // P&L and Credit Card reports are handled directly in SalesReport's renderReportContent
    default:
      return <div className="text-center py-8">Report type not implemented yet or handled externally.</div>;
  }
};

export default function SalesReport({ currentScope }) {
  const [activeReport, setActiveReport] = useState("daily_sales_summary");
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });

  const generateReport = useCallback(async (reportTypeParam) => {
    // For reports handled by their own components, we don't fetch data here.
    if (reportTypeParam === "profit_loss_report" || reportTypeParam === "credit_card_transactions") {
      setReportData([]); // Clear data as these components handle their own fetching
      setIsLoading(false);
      return;
    }

    if (!dateRange.from || !dateRange.to) {
        alert('Please select a valid date range.');
        setReportData([]);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setReportData([]);

    try {
      let data = [];
      const fromDate = dateRange.from?.toISOString();
      const toDate = dateRange.to?.toISOString();

      let commonFilter = {
        status: "completed", // Most reports are on completed transactions
        created_date: { "$gte": fromDate, "$lte": toDate }
      };

      // Apply scope filtering
      if (currentScope?.type === 'location' && currentScope?.id) {
        commonFilter.location_id = currentScope.id;
      } else if (currentScope?.type === 'region' && currentScope?.id) {
        const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
        const regionLocationIds = locationsData
          .filter(loc => loc.region_id === currentScope.id)
          .map(loc => loc.id);
        if (regionLocationIds.length > 0) {
          commonFilter.location_id = { "$in": regionLocationIds }; // Assuming filter supports $in
        } else {
          // No locations in this region, so no data
          setIsLoading(false);
          setReportData([]);
          return;
        }
      }

      switch (reportTypeParam) {
        case "daily_sales_summary":
        case "sales_tax_report":
          data = await POSTransaction.filter(commonFilter, "-created_date");
          break;

        case "monthly_sales_summary":
          // Monthly sales summary uses a fixed date range (start/end of current month for display purposes)
          // but still needs scope filtering. Override date range part of commonFilter.
          const monthStart = startOfMonth(dateRange.from).toISOString(); // Use dateRange.from month
          const monthEnd = endOfMonth(dateRange.from).toISOString(); // Use dateRange.from month
          const monthlyFilter = {
            ...commonFilter,
            created_date: { "$gte": monthStart, "$lte": monthEnd }
          };
          // Remove specific `created_date` from original commonFilter if it was there
          // (not strictly necessary here as it's overwritten but good practice)
          delete commonFilter.created_date;
          data = await POSTransaction.filter(monthlyFilter, "-created_date");
          break;

        case "detailed_shift_report":
          // Shifts also need location scope. Shift entity needs a location_id.
          // CommonFilter applied here for created_date range and location_id
          const shiftFilter = {
            start_time: commonFilter.created_date, // Map created_date range to start_time for shifts
          };
          if (commonFilter.location_id) {
              shiftFilter.location_id = commonFilter.location_id;
          }
          data = await Shift.filter(shiftFilter, "-start_time");
          break;

        default:
          data = [];
      }

      setReportData(data);
    } catch (error) {
      console.error(`Error generating ${reportTypeParam} report:`, error);
      alert(`Failed to generate ${reportTypeParam.replace(/_/g, ' ')} report.`);
    }
    setIsLoading(false);
  }, [dateRange, currentScope, setIsLoading, setReportData]); // Add currentScope to dependencies

  useEffect(() => {
    generateReport(activeReport);
  }, [activeReport, dateRange, generateReport, currentScope]); // Added currentScope

  const handleRefreshReport = () => {
    // For P&L and Credit Card reports, simply trigger their internal refresh by updating dateRange reference
    // or by calling their internal load functions (which will react to currentScope/dateRange changes)
    if (activeReport === "profit_loss_report" || activeReport === "credit_card_transactions") {
        setDateRange(prev => ({ ...prev })); // Force re-render/effect trigger
    } else {
        // For other reports, the useEffect (which depends on activeReport and dateRange) will handle it
        generateReport(activeReport);
    }
  };

  const handleShiftUpdate = () => {
    // Reload shift data after edits
    handleRefreshReport();
  };

  const salesReports = [
    { id: "daily_sales_summary", name: "Daily Sales Summary", icon: BarChart3, color: "text-blue-500" },
    { id: "monthly_sales_summary", name: "Monthly Sales Summary", icon: TrendingUp, color: "text-green-500" },
    { id: "detailed_shift_report", name: "Detailed Shift Report", icon: Users, color: "text-purple-500" },
    { id: "sales_tax_report", name: "Sales Tax Report", icon: FileText, color: "text-orange-500" },
    { id: "profit_loss_report", name: "Profit & Loss by Location", icon: DollarSign, color: "text-green-600" },
    { id: "credit_card_transactions", name: "Credit Card Transactions", icon: CreditCard, color: "text-red-500" },
  ];

  const needsDateRange = ["daily_sales_summary", "detailed_shift_report", "sales_tax_report", "profit_loss_report", "credit_card_transactions"];

  const renderReportContent = () => {
    switch (activeReport) {
      case "credit_card_transactions":
        return <CreditCardTransactionReport dateRange={dateRange} currentScope={currentScope} />;
      case "detailed_shift_report":
        // Assuming detailed_shift_report always expects a single shift, take the first one from reportData
        if (reportData.length === 0 && !isLoading) {
            return <div className="text-center py-8 text-gray-500">No shift data found for the selected period or scope.</div>;
        }
        return reportData.map((shift) => (
            <DetailedShiftReport key={shift.id} shift={shift} onUpdate={handleShiftUpdate} />
        ));
      case "profit_loss_report":
        return <ProfitLossReport dateRange={dateRange} currentScope={currentScope} />;
      default:
        return <ReportContent isLoading={isLoading} data={reportData} reportType={activeReport} dateRange={dateRange} />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Reports</CardTitle>
        {/* Location Context Indicator */}
        {currentScope && (
            <Alert className="bg-blue-50 border-blue-200 mt-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <AlertDescription>
                    <strong>Sales report for:</strong> {currentScope.label}
                </AlertDescription>
            </Alert>
        )}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center pt-4">
          <div className="w-full md:w-1/3">
            <Select value={activeReport} onValueChange={setActiveReport}>
              <SelectTrigger>
                <SelectValue placeholder="Select a report..." />
              </SelectTrigger>
              <SelectContent>
                {salesReports.map((report) => (
                  <SelectItem key={report.id} value={report.id}>
                    <div className="flex items-center gap-2">
                      <report.icon className={`w-4 h-4 ${report.color}`} />
                      <span>{report.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {needsDateRange.includes(activeReport) && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}
            <Button onClick={handleRefreshReport} variant="outline" disabled={isLoading && !["profit_loss_report", "credit_card_transactions"].includes(activeReport)}>
              <RotateCcw className={`w-4 h-4 mr-2 ${isLoading && !["profit_loss_report", "credit_card_transactions"].includes(activeReport) ? 'animate-spin' : ''}`} />
              Generate
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderReportContent()}
      </CardContent>
    </Card>
  );
}
