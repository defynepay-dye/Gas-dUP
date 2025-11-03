
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Location, Region, TaxSettings, PricingSettings, SalesRestrictionRule, Pump, Product, FuelTank, POSTerminal } from "@/api/entities";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, Save, Loader2, AlertTriangle, Info, Plus } from "lucide-react";

export default function LocationSetupWizard({ onComplete, onCancel, editingLocation = null }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [regions, setRegions] = useState([]);

  // Step 1: Basic Info
  const [locationData, setLocationData] = useState({
    location_name: editingLocation?.location_name || '',
    region_id: editingLocation?.region_id || '',
    address: editingLocation?.address || '',
    city: editingLocation?.city || '',
    state: editingLocation?.state || '',
    zip_code: editingLocation?.zip_code || '',
    phone_number: editingLocation?.phone_number || '',
    is_active: editingLocation?.is_active !== false
  });

  // Step 2: Tax Settings
  const [taxSettings, setTaxSettings] = useState({
    tier_1_name: "State Tax",
    tier_1_rate: 6.25,
    tier_1_active: true,
    tier_2_name: "City Tax",
    tier_2_rate: 2,
    tier_2_active: true,
    tier_3_name: "Special Tax",
    tier_3_rate: 0,
    tier_3_active: false,
    fuel_tax_rate: 8.25,
    prepared_food_rate: 8.25,
    alcohol_tax_rate: 10.25,
    tobacco_tax_rate: 12
  });

  // Step 3: Pricing Settings
  const [pricingSettings, setPricingSettings] = useState({
    dual_pricing_enabled: true,
    credit_markup_cents_fuel: 10,
    credit_markup_percent_dry_stock: 3.5
  });

  // Step 4: Compliance/Sales Restrictions
  const [complianceSettings, setComplianceSettings] = useState({
    alcohol_restriction_enabled: false,
    alcohol_days: [0], // Sunday
    alcohol_start_time: "00:00",
    alcohol_end_time: "12:00",
    tobacco_restriction_enabled: false
  });

  // Step 5: Fuel Tanks
  const [fuelTanks, setFuelTanks] = useState([
    {
      tank_number: 1,
      tank_name: "Regular Tank 1",
      product_code: "regular",
      capacity_gallons: 10000,
      tank_type: "double_wall",
      atg_configuration: {
        atg_installed: false,
        atg_manufacturer: "",
        atg_model: "",
        atg_alias: "Tank1",
        leak_detection_enabled: true,
        overfill_alarm_enabled: true
      }
    }
  ]);

  // Step 6: Pumps/Dispensers
  const [pumps, setPumps] = useState([
    {
      pump_number: 1,
      pump_name: "Pump 1",
      dispenser_brand: "gilbarco",
      dispenser_model: "",
      dispenser_type: "multi_product",
      communication_protocol: "rs485",
      network_configuration: {
        connection_type: "private_router",
        ip_address: "",
        subnet_mask: "255.255.255.0",
        gateway: "",
        controller_serial: ""
      },
      status: "online",
      products_available: ["regular", "midgrade", "premium", "diesel"],
      mobile_payment_enabled: false,
      gps_coordinates: {
        latitude: null,
        longitude: null
      }
    }
  ]);

  // Step 7: POS Terminals
  const [posTerminals, setPosTerminals] = useState([
    {
      terminal_id: "POS1",
      terminal_name: "Front Counter 1",
      network_configuration: {
        ip_address: "",
        subnet_mask: "255.255.255.0",
        gateway: "",
        connection_type: "ethernet",
        mac_address: ""
      },
      peripherals: {
        receipt_printer: { model: "", connection: "usb" },
        cash_drawer: { model: "", connection: "usb" },
        barcode_scanner: { model: "", connection: "usb" },
        payment_terminal: { model: "", processor: "worldpay", connection: "ethernet", ip_address: "" }
      },
      status: "online"
    }
  ]);

  // Step 8: Fuel Products/Pricing
  const [fuelProducts, setFuelProducts] = useState([
    { product_code: "regular", product_name: "Regular", self_service_cash_price: 2.99, cost: 2.50, inventory_gallons: 10000 },
    { product_code: "midgrade", product_name: "Mid-Grade", self_service_cash_price: 3.29, cost: 2.75, inventory_gallons: 8000 },
    { product_code: "premium", product_name: "Premium", self_service_cash_price: 3.59, cost: 3.00, inventory_gallons: 8000 },
    { product_code: "diesel", product_name: "Diesel", self_service_cash_price: 3.19, cost: 2.65, inventory_gallons: 12000 }
  ]);

  const steps = [
    { number: 1, title: "Basic Info", description: "Location details" },
    { number: 2, title: "Tax Settings", description: "Configure taxes" },
    { number: 3, title: "Pricing", description: "Cash discount program" },
    { number: 4, title: "Compliance", description: "Sales restrictions" },
    { number: 5, title: "Fuel Tanks", description: "Tank configuration & ATG" },
    { number: 6, title: "Dispensers", description: "Pump/dispenser setup" },
    { number: 7, title: "POS Terminals", description: "Terminal & network config" },
    { number: 8, title: "Fuel Pricing", description: "Initial fuel prices" }
  ];

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const regionsData = await Region.list();
      setRegions(regionsData);
    } catch (error) {
      console.error("Failed to load regions:", error);
    }
  };

  const validateStep = () => {
    switch(currentStep) {
      case 1:
        if (!locationData.location_name.trim()) {
          alert("Please enter a location name");
          return false;
        }
        break;
      case 6:
        // Validate pump network config if needed
        const invalidPumps = pumps.filter(p => 
          p.network_configuration.connection_type !== "mnsp" && !p.network_configuration.ip_address
        );
        if (invalidPumps.length > 0) {
          alert("Please configure IP addresses for all pumps using private router configuration");
          return false;
        }
        break;
      case 7:
        // Validate POS terminal config
        const invalidTerminals = posTerminals.filter(t => !t.network_configuration.ip_address);
        if (invalidTerminals.length > 0) {
          alert("Please configure IP addresses for all POS terminals");
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const addTank = () => {
    const newTankNumber = Math.max(...fuelTanks.map(t => t.tank_number), 0) + 1;
    setFuelTanks([...fuelTanks, {
      tank_number: newTankNumber,
      tank_name: `Tank ${newTankNumber}`,
      product_code: "regular",
      capacity_gallons: 10000,
      tank_type: "double_wall",
      atg_configuration: {
        atg_installed: false,
        atg_manufacturer: "",
        atg_model: "",
        atg_alias: `Tank${newTankNumber}`,
        leak_detection_enabled: true,
        overfill_alarm_enabled: true
      }
    }]);
  };

  const removeTank = (index) => {
    setFuelTanks(fuelTanks.filter((_, i) => i !== index));
  };

  const updateTank = (index, field, value) => {
    const updated = [...fuelTanks];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index][parent] = { ...updated[index][parent], [child]: value };
    } else {
      updated[index][field] = value;
    }
    setFuelTanks(updated);
  };

  const addPump = () => {
    const newPumpNumber = Math.max(...pumps.map(p => p.pump_number), 0) + 1;
    setPumps([...pumps, {
      pump_number: newPumpNumber,
      pump_name: `Pump ${newPumpNumber}`,
      dispenser_brand: "gilbarco",
      dispenser_model: "",
      dispenser_type: "multi_product",
      communication_protocol: "rs485",
      network_configuration: {
        connection_type: "private_router",
        ip_address: "",
        subnet_mask: "255.255.255.0",
        gateway: "",
        controller_serial: ""
      },
      status: "online",
      products_available: ["regular", "midgrade", "premium", "diesel"],
      mobile_payment_enabled: false,
      gps_coordinates: { latitude: null, longitude: null }
    }]);
  };

  const removePump = (index) => {
    setPumps(pumps.filter((_, i) => i !== index));
  };

  const updatePump = (index, field, value) => {
    const updated = [...pumps];
    if (field.includes('.')) {
      const parts = field.split('.');
      if (parts.length === 2) {
        updated[index][parts[0]] = { ...updated[index][parts[0]], [parts[1]]: value };
      } else if (parts.length === 3) {
        updated[index][parts[0]] = {
          ...updated[index][parts[0]],
          [parts[1]]: { ...updated[index][parts[0]][parts[1]], [parts[2]]: value }
        };
      }
    } else {
      updated[index][field] = value;
    }
    setPumps(updated);
  };

  const addPOSTerminal = () => {
    const newTerminalNumber = posTerminals.length + 1;
    setPosTerminals([...posTerminals, {
      terminal_id: `POS${newTerminalNumber}`,
      terminal_name: `POS Terminal ${newTerminalNumber}`,
      network_configuration: {
        ip_address: "",
        subnet_mask: "255.255.255.0",
        gateway: "",
        connection_type: "ethernet",
        mac_address: ""
      },
      peripherals: {
        receipt_printer: { model: "", connection: "usb" },
        cash_drawer: { model: "", connection: "usb" },
        barcode_scanner: { model: "", connection: "usb" },
        payment_terminal: { model: "", processor: "worldpay", connection: "ethernet", ip_address: "" }
      },
      status: "online"
    }]);
  };

  const removePOSTerminal = (index) => {
    setPosTerminals(posTerminals.filter((_, i) => i !== index));
  };

  const updatePOSTerminal = (index, field, value) => {
    const updated = [...posTerminals];
    if (field.includes('.')) {
      const parts = field.split('.');
      if (parts.length === 2) {
        updated[index][parts[0]] = { ...updated[index][parts[0]], [parts[1]]: value };
      } else if (parts.length === 3) {
        updated[index][parts[0]] = {
          ...updated[index][parts[0]],
          [parts[1]]: { ...updated[index][parts[0]][parts[1]], [parts[2]]: value }
        };
      }
    } else {
      updated[index][field] = value;
    }
    setPosTerminals(updated);
  };

  const updateFuelProduct = (index, field, value) => {
    const updated = [...fuelProducts];
    updated[index][field] = value;
    setFuelProducts(updated);
  };

  const handleComplete = async () => {
    if (!validateStep()) return;
    
    setIsSaving(true);
    try {
      // Step 1: Create/Update Location
      let locationId;
      if (editingLocation) {
        await Location.update(editingLocation.id, locationData);
        locationId = editingLocation.id;
      } else {
        const newLoc = await Location.create(locationData);
        locationId = newLoc.id;
      }

      // Step 2: Create Tax Settings
      await TaxSettings.create({
        location_id: locationId,
        ...taxSettings
      });

      // Step 3: Create Pricing Settings
      await PricingSettings.create({
        location_id: locationId,
        ...pricingSettings
      });

      // Step 4: Create Compliance Rules
      if (complianceSettings.alcohol_restriction_enabled) {
        await SalesRestrictionRule.create({
          location_id: locationId,
          rule_name: "Alcohol Sunday Morning Restriction",
          category: "alcohol",
          days_of_week: complianceSettings.alcohol_days,
          start_time: complianceSettings.alcohol_start_time,
          end_time: complianceSettings.alcohol_end_time,
          is_active: true
        });
      }

      // Step 5: Create Fuel Tanks
      for (const tank of fuelTanks) {
        await FuelTank.create({
          ...tank,
          location_id: locationId
        });
      }

      // Step 6: Create Pumps
      for (const pump of pumps) {
        await Pump.create({
          ...pump,
          location_id: locationId
        });
      }

      // Step 7: Create POS Terminals
      for (const terminal of posTerminals) {
        await POSTerminal.create({
          ...terminal,
          location_id: locationId
        });
      }

      // Step 8: Create Fuel Products
      for (const product of fuelProducts) {
        // Calculate credit prices based on dual pricing settings
        const creditPriceAddition = pricingSettings.dual_pricing_enabled 
          ? (pricingSettings.credit_markup_cents_fuel / 100)
          : 0;

        await Product.create({
          ...product,
          location_id: locationId,
          self_service_credit_price: product.self_service_cash_price + creditPriceAddition,
          full_service_cash_price: product.self_service_cash_price + 0.10,
          full_service_credit_price: product.self_service_cash_price + 0.10 + creditPriceAddition,
          supplier: "Default Supplier",
          tax_rate: taxSettings.fuel_tax_rate,
          low_inventory_threshold: product.inventory_gallons * 0.2
        });
      }

      // Refresh session storage
      const updatedLocations = await Location.list();
      sessionStorage.setItem('app_locations', JSON.stringify(updatedLocations));

      alert(editingLocation ? "Location updated successfully!" : "Location created successfully! All settings, tanks, pumps, and terminals have been configured.");
      onComplete();
    } catch (error) {
      console.error("Failed to complete setup:", error);
      alert(`Failed to complete setup: ${error.message || 'Unknown error'}. Please check the console for details.`);
    }
    setIsSaving(false);
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="location_name">Location Name *</Label>
              <Input
                id="location_name"
                value={locationData.location_name}
                onChange={(e) => setLocationData({...locationData, location_name: e.target.value})}
                placeholder="e.g., Downtown Houston Station"
              />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Select value={locationData.region_id} onValueChange={(val) => setLocationData({...locationData, region_id: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No Region</SelectItem>
                  {regions.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.region_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input id="address" value={locationData.address} onChange={(e) => setLocationData({...locationData, address: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={locationData.city} onChange={(e) => setLocationData({...locationData, city: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" value={locationData.state} onChange={(e) => setLocationData({...locationData, state: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" value={locationData.zip_code} onChange={(e) => setLocationData({...locationData, zip_code: e.target.value})} />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={locationData.phone_number} onChange={(e) => setLocationData({...locationData, phone_number: e.target.value})} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="is_active" checked={locationData.is_active} onCheckedChange={(val) => setLocationData({...locationData, is_active: val})} />
              <Label htmlFor="is_active">Location is Active</Label>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>Configure the tax rates that will apply to transactions at this location.</AlertDescription>
            </Alert>
            
            <div className="border rounded p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={taxSettings.tier_1_active}
                  onCheckedChange={(val) => setTaxSettings({...taxSettings, tier_1_active: val})}
                />
                <Label className="flex-1">
                  <Input
                    value={taxSettings.tier_1_name}
                    onChange={(e) => setTaxSettings({...taxSettings, tier_1_name: e.target.value})}
                    className="mb-2"
                  />
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taxSettings.tier_1_rate}
                  onChange={(e) => setTaxSettings({...taxSettings, tier_1_rate: parseFloat(e.target.value)})}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={taxSettings.tier_2_active}
                  onCheckedChange={(val) => setTaxSettings({...taxSettings, tier_2_active: val})}
                />
                <Label className="flex-1">
                  <Input
                    value={taxSettings.tier_2_name}
                    onChange={(e) => setTaxSettings({...taxSettings, tier_2_name: e.target.value})}
                    className="mb-2"
                  />
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taxSettings.tier_2_rate}
                  onChange={(e) => setTaxSettings({...taxSettings, tier_2_rate: parseFloat(e.target.value)})}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={taxSettings.tier_3_active}
                  onCheckedChange={(val) => setTaxSettings({...taxSettings, tier_3_active: val})}
                />
                <Label className="flex-1">
                  <Input
                    value={taxSettings.tier_3_name}
                    onChange={(e) => setTaxSettings({...taxSettings, tier_3_name: e.target.value})}
                    className="mb-2"
                  />
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taxSettings.tier_3_rate}
                  onChange={(e) => setTaxSettings({...taxSettings, tier_3_rate: parseFloat(e.target.value)})}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fuel Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taxSettings.fuel_tax_rate}
                  onChange={(e) => setTaxSettings({...taxSettings, fuel_tax_rate: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Prepared Food Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taxSettings.prepared_food_rate}
                  onChange={(e) => setTaxSettings({...taxSettings, prepared_food_rate: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Alcohol Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taxSettings.alcohol_tax_rate}
                  onChange={(e) => setTaxSettings({...taxSettings, alcohol_tax_rate: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Tobacco Tax Rate (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={taxSettings.tobacco_tax_rate}
                  onChange={(e) => setTaxSettings({...taxSettings, tobacco_tax_rate: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>Configure the cash discount program (dual pricing) for this location.</AlertDescription>
            </Alert>

            <div className="flex items-center gap-2 p-4 border rounded">
              <Switch
                checked={pricingSettings.dual_pricing_enabled}
                onCheckedChange={(val) => setPricingSettings({...pricingSettings, dual_pricing_enabled: val})}
              />
              <Label>Enable Cash Discount Program (Dual Pricing)</Label>
            </div>

            {pricingSettings.dual_pricing_enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fuel Credit Markup (cents per gallon)</Label>
                  <Input
                    type="number"
                    value={pricingSettings.credit_markup_cents_fuel}
                    onChange={(e) => setPricingSettings({...pricingSettings, credit_markup_cents_fuel: parseFloat(e.target.value)})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Added to cash price for credit card purchases</p>
                </div>
                <div>
                  <Label>In-Store Credit Markup (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={pricingSettings.credit_markup_percent_dry_stock}
                    onChange={(e) => setPricingSettings({...pricingSettings, credit_markup_percent_dry_stock: parseFloat(e.target.value)})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Percentage added to cash price for in-store items</p>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>Configure sales restrictions based on local compliance requirements.</AlertDescription>
            </Alert>

            <div className="border rounded p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={complianceSettings.alcohol_restriction_enabled}
                  onCheckedChange={(val) => setComplianceSettings({...complianceSettings, alcohol_restriction_enabled: val})}
                />
                <Label>Enable Alcohol Sales Time Restrictions</Label>
              </div>

              {complianceSettings.alcohol_restriction_enabled && (
                <div className="ml-6 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Restriction Start Time</Label>
                      <Input
                        type="time"
                        value={complianceSettings.alcohol_start_time}
                        onChange={(e) => setComplianceSettings({...complianceSettings, alcohol_start_time: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Restriction End Time</Label>
                      <Input
                        type="time"
                        value={complianceSettings.alcohol_end_time}
                        onChange={(e) => setComplianceSettings({...complianceSettings, alcohol_end_time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Restricted Days</Label>
                    <div className="flex gap-2 mt-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <Button
                          key={day}
                          type="button"
                          size="sm"
                          variant={complianceSettings.alcohol_days.includes(index) ? "default" : "outline"}
                          onClick={() => {
                            const days = complianceSettings.alcohol_days.includes(index)
                              ? complianceSettings.alcohol_days.filter(d => d !== index)
                              : [...complianceSettings.alcohol_days, index];
                            setComplianceSettings({...complianceSettings, alcohol_days: days});
                          }}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>Configure underground storage tanks and optional ATG (Automatic Tank Gauge) systems.</AlertDescription>
            </Alert>

            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Fuel Tanks</h3>
              <Button type="button" onClick={addTank} size="sm"><Plus className="w-4 h-4 mr-1" /> Add Tank</Button>
            </div>

            <div className="space-y-4">
              {fuelTanks.map((tank, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Tank {tank.tank_number}</CardTitle>
                      {fuelTanks.length > 1 && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeTank(index)}>Remove</Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Tank Name</Label>
                        <Input value={tank.tank_name} onChange={(e) => updateTank(index, 'tank_name', e.target.value)} />
                      </div>
                      <div>
                        <Label>Product Type</Label>
                        <Select value={tank.product_code} onValueChange={(val) => updateTank(index, 'product_code', val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="midgrade">Mid-Grade</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="e85">E85</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Capacity (gallons)</Label>
                        <Input type="number" value={tank.capacity_gallons} onChange={(e) => updateTank(index, 'capacity_gallons', parseFloat(e.target.value))} />
                      </div>
                      <div>
                        <Label>Tank Type</Label>
                        <Select value={tank.tank_type} onValueChange={(val) => updateTank(index, 'tank_type', val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single_wall">Single Wall</SelectItem>
                            <SelectItem value="double_wall">Double Wall</SelectItem>
                            <SelectItem value="fiberglass">Fiberglass</SelectItem>
                            <SelectItem value="steel">Steel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Switch
                          checked={tank.atg_configuration.atg_installed}
                          onCheckedChange={(val) => updateTank(index, 'atg_configuration.atg_installed', val)}
                        />
                        <Label>ATG (Automatic Tank Gauge) Installed</Label>
                      </div>

                      {tank.atg_configuration.atg_installed && (
                        <div className="ml-6 grid grid-cols-2 gap-3">
                          <div>
                            <Label>ATG Manufacturer</Label>
                            <Select value={tank.atg_configuration.atg_manufacturer} onValueChange={(val) => updateTank(index, 'atg_configuration.atg_manufacturer', val)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select manufacturer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="veeder_root">Veeder-Root</SelectItem>
                                <SelectItem value="opis">OPIS</SelectItem>
                                <SelectItem value="incon">Incon</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>ATG Model</Label>
                            <Input value={tank.atg_configuration.atg_model} onChange={(e) => updateTank(index, 'atg_configuration.atg_model', e.target.value)} placeholder="e.g., TLS-350" />
                          </div>
                          <div>
                            <Label>ATG Tank Alias</Label>
                            <Input value={tank.atg_configuration.atg_alias} onChange={(e) => updateTank(index, 'atg_configuration.atg_alias', e.target.value)} />
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={tank.atg_configuration.leak_detection_enabled}
                                onCheckedChange={(val) => updateTank(index, 'atg_configuration.leak_detection_enabled', val)}
                              />
                              <Label className="text-sm">Leak Detection</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={tank.atg_configuration.overfill_alarm_enabled}
                                onCheckedChange={(val) => updateTank(index, 'atg_configuration.overfill_alarm_enabled', val)}
                              />
                              <Label className="text-sm">Overfill Alarm</Label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>Configure fuel dispensers including hardware type, communication protocol, and network settings.</AlertDescription>
            </Alert>

            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Fuel Dispensers/Pumps</h3>
              <Button type="button" onClick={addPump} size="sm"><Plus className="w-4 h-4 mr-1" /> Add Pump</Button>
            </div>

            <div className="space-y-4">
              {pumps.map((pump, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Pump {pump.pump_number}</CardTitle>
                      {pumps.length > 1 && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => removePump(index)}>Remove</Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Pump Name</Label>
                        <Input value={pump.pump_name} onChange={(e) => updatePump(index, 'pump_name', e.target.value)} />
                      </div>
                      <div>
                        <Label>Dispenser Brand</Label>
                        <Select value={pump.dispenser_brand} onValueChange={(val) => updatePump(index, 'dispenser_brand', val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="wayne">Wayne</SelectItem>
                            <SelectItem value="gilbarco">Gilbarco</SelectItem>
                            <SelectItem value="tokheim">Tokheim</SelectItem>
                            <SelectItem value="bennett">Bennett</SelectItem>
                            <SelectItem value="tatsuno">Tatsuno</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Dispenser Model</Label>
                        <Input value={pump.dispenser_model} onChange={(e) => updatePump(index, 'dispenser_model', e.target.value)} placeholder="e.g., Encore 700S" />
                      </div>
                      <div>
                        <Label>Dispenser Type</Label>
                        <Select value={pump.dispenser_type} onValueChange={(val) => updatePump(index, 'dispenser_type', val)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single_hose">Single Hose</SelectItem>
                            <SelectItem value="multi_product">Multi-Product</SelectItem>
                            <SelectItem value="blender">Blender</SelectItem>
                            <SelectItem value="high_flow_diesel">High Flow Diesel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <h4 className="font-semibold text-sm mb-3">Communication & Network</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Communication Protocol</Label>
                          <Select value={pump.communication_protocol} onValueChange={(val) => updatePump(index, 'communication_protocol', val)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rs485">RS-485</SelectItem>
                              <SelectItem value="cl">CL (Crind Link)</SelectItem>
                              <SelectItem value="gl">GL (Gilbarco Link)</SelectItem>
                              <SelectItem value="dart">DART</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Network Connection Type</Label>
                          <Select value={pump.network_configuration.connection_type} onValueChange={(val) => updatePump(index, 'network_configuration.connection_type', val)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mnsp">MNSP (Managed Network Service)</SelectItem>
                              <SelectItem value="private_router">Private Router</SelectItem>
                              <SelectItem value="direct_ethernet">Direct Ethernet</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {pump.network_configuration.connection_type !== "mnsp" && (
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div>
                            <Label>IP Address *</Label>
                            <Input value={pump.network_configuration.ip_address} onChange={(e) => updatePump(index, 'network_configuration.ip_address', e.target.value)} placeholder="192.168.1.10" />
                          </div>
                          <div>
                            <Label>Subnet Mask</Label>
                            <Input value={pump.network_configuration.subnet_mask} onChange={(e) => updatePump(index, 'network_configuration.subnet_mask', e.target.value)} />
                          </div>
                          <div>
                            <Label>Gateway</Label>
                            <Input value={pump.network_configuration.gateway} onChange={(e) => updatePump(index, 'network_configuration.gateway', e.target.value)} placeholder="192.168.1.1" />
                          </div>
                        </div>
                      )}

                      <div className="mt-3">
                        <Label>Controller Serial Number</Label>
                        <Input value={pump.network_configuration.controller_serial} onChange={(e) => updatePump(index, 'network_configuration.controller_serial', e.target.value)} placeholder="Optional" />
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <h4 className="font-semibold text-sm mb-3">Mobile Pay-at-Pump (Optional)</h4>
                      <div className="flex items-center gap-2 mb-3">
                        <Switch
                          checked={pump.mobile_payment_enabled}
                          onCheckedChange={(val) => updatePump(index, 'mobile_payment_enabled', val)}
                        />
                        <Label>Enable Mobile Pay-at-Pump</Label>
                      </div>

                      {pump.mobile_payment_enabled && (
                        <div className="ml-6 grid grid-cols-2 gap-3">
                          <div>
                            <Label>GPS Latitude</Label>
                            <Input
                              type="number"
                              step="0.000001"
                              value={pump.gps_coordinates.latitude || ''}
                              onChange={(e) => updatePump(index, 'gps_coordinates.latitude', parseFloat(e.target.value) || null)}
                              placeholder="40.712800"
                            />
                          </div>
                          <div>
                            <Label>GPS Longitude</Label>
                            <Input
                              type="number"
                              step="0.000001"
                              value={pump.gps_coordinates.longitude || ''}
                              onChange={(e) => updatePump(index, 'gps_coordinates.longitude', parseFloat(e.target.value) || null)}
                              placeholder="-74.006000"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>Configure POS terminals and their network settings. Payment terminals and peripherals can be configured after initial setup.</AlertDescription>
            </Alert>

            <div className="flex justify-between items-center">
              <h3 className="font-semibold">POS Terminals</h3>
              <Button type="button" onClick={addPOSTerminal} size="sm"><Plus className="w-4 h-4 mr-1" /> Add Terminal</Button>
            </div>

            <div className="space-y-4">
              {posTerminals.map((terminal, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">{terminal.terminal_name}</CardTitle>
                      {posTerminals.length > 1 && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => removePOSTerminal(index)}>Remove</Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Terminal ID</Label>
                        <Input value={terminal.terminal_id} onChange={(e) => updatePOSTerminal(index, 'terminal_id', e.target.value)} />
                      </div>
                      <div>
                        <Label>Terminal Name</Label>
                        <Input value={terminal.terminal_name} onChange={(e) => updatePOSTerminal(index, 'terminal_name', e.target.value)} />
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <h4 className="font-semibold text-sm mb-3">Network Configuration</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Connection Type</Label>
                          <Select value={terminal.network_configuration.connection_type} onValueChange={(val) => updatePOSTerminal(index, 'network_configuration.connection_type', val)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ethernet">Ethernet</SelectItem>
                              <SelectItem value="wifi">Wi-Fi</SelectItem>
                              <SelectItem value="cellular">Cellular</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>MAC Address</Label>
                          <Input value={terminal.network_configuration.mac_address} onChange={(e) => updatePOSTerminal(index, 'network_configuration.mac_address', e.target.value)} placeholder="00:1B:63:84:45:E6" />
                        </div>
                        <div>
                          <Label>IP Address *</Label>
                          <Input value={terminal.network_configuration.ip_address} onChange={(e) => updatePOSTerminal(index, 'network_configuration.ip_address', e.target.value)} placeholder="192.168.1.100" />
                        </div>
                        <div>
                          <Label>Subnet Mask</Label>
                          <Input value={terminal.network_configuration.subnet_mask} onChange={(e) => updatePOSTerminal(index, 'network_configuration.subnet_mask', e.target.value)} />
                        </div>
                        <div>
                          <Label>Gateway</Label>
                          <Input value={terminal.network_configuration.gateway} onChange={(e) => updatePOSTerminal(index, 'network_configuration.gateway', e.target.value)} placeholder="192.168.1.1" />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <h4 className="font-semibold text-sm mb-3">Peripherals (Optional - Configure Later)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Receipt Printer Model</Label>
                          <Input value={terminal.peripherals.receipt_printer.model} onChange={(e) => updatePOSTerminal(index, 'peripherals.receipt_printer.model', e.target.value)} placeholder="e.g., Epson TM-T88VI" />
                        </div>
                        <div>
                          <Label>Payment Terminal Model</Label>
                          <Input value={terminal.peripherals.payment_terminal.model} onChange={(e) => updatePOSTerminal(index, 'peripherals.payment_terminal.model', e.target.value)} placeholder="e.g., Ingenico iCT250" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>Set initial fuel prices. Credit prices will be calculated based on your dual pricing settings.</AlertDescription>
            </Alert>

            <div className="space-y-3">
              {fuelProducts.map((product, index) => (
                <Card key={product.product_code}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <div className="font-semibold">{product.product_name}</div>
                      <div>
                        <Label className="text-xs">Cash Price ($/gal)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={product.self_service_cash_price}
                          onChange={(e) => updateFuelProduct(index, 'self_service_cash_price', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Cost ($/gal)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={product.cost}
                          onChange={(e) => updateFuelProduct(index, 'cost', parseFloat(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Credit Price ($/gal)</Label>
                        <div className="text-sm font-semibold p-2 bg-gray-100 rounded">
                          ${(product.self_service_cash_price + (pricingSettings.dual_pricing_enabled ? pricingSettings.credit_markup_cents_fuel / 100 : 0)).toFixed(3)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription>
                <strong>Ready to Complete Setup</strong><br />
                All configuration is complete. Click "Complete Setup" to create this location with all settings, tanks, pumps, and terminals.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle>{editingLocation ? 'Edit Location' : 'New Location Setup'}</CardTitle>
          <CardDescription>Complete setup wizard for full location configuration</CardDescription>
        </CardHeader>

        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 flex-1 ${index < steps.length - 1 ? 'mr-2' : ''}`}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step.number === currentStep ? 'bg-blue-600 text-white' :
                    step.number < currentStep ? 'bg-green-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {step.number < currentStep ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                  </div>
                  <div className="hidden md:block flex-1">
                    <div className={`text-xs font-semibold ${step.number === currentStep ? 'text-blue-600' : 'text-gray-600'}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 ${step.number < currentStep ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {renderStepContent()}
        </div>

        <div className="border-t p-6 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            disabled={isSaving}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Button>

          <div className="text-sm text-gray-600">
            Step {currentStep} of {steps.length}
          </div>

          {currentStep < steps.length ? (
            <Button onClick={handleNext} disabled={isSaving}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Complete Setup
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
