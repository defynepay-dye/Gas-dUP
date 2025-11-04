import React, { useState, useEffect } from 'react';
import { LoyaltyProgram, CustomerProfile, PersonalizedOffer, POSTransaction } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search, Plus, User, Users, Phone, Mail, Star, TrendingUp, Gift,
  Edit, FileText, Download, BarChart3, Calendar, DollarSign, MapPin,
  Award, Sparkles, History, Settings, Filter
} from "lucide-react";
import { format } from "date-fns";
import CustomerDetailModal from "../../loyalty/CustomerDetailModal";
import AddPointsModal from "../../loyalty/AddPointsModal";
import LoyaltyAnalyticsDashboard from "../../loyalty/LoyaltyAnalyticsDashboard";

export default function LoyaltyManager({ currentScope }) {
  const [loyaltyPrograms, setLoyaltyPrograms] = useState([]);
  const [filteredLoyaltyPrograms, setFilteredLoyaltyPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddPointsModal, setShowAddPointsModal] = useState(null);
  const [activeView, setActiveView] = useState("customers");

  useEffect(() => {
    loadLoyaltyPrograms();
  }, [currentScope]);

  useEffect(() => {
    let filtered = [...loyaltyPrograms];

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.customer_phone?.includes(searchTerm) ||
        c.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (tierFilter !== "all") {
      filtered = filtered.filter(c => c.tier_status === tierFilter);
    }

    setFilteredLoyaltyPrograms(filtered);
  }, [searchTerm, loyaltyPrograms, tierFilter]);

  const loadLoyaltyPrograms = async () => {
    setIsLoading(true);
    try {
      let loyaltyData = [];
      const customerProfiles = await CustomerProfile.list().catch(() => []);

      if (currentScope?.type === 'location' && currentScope?.id) {
        loyaltyData = await LoyaltyProgram.filter({ location_id: currentScope.id });
      } else if (currentScope?.type === 'region' && currentScope?.id) {
        const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
        const regionLocationIds = locationsData
          .filter(loc => loc.region_id === currentScope.id)
          .map(loc => loc.id);

        const allPrograms = await LoyaltyProgram.list("-last_visit");
        loyaltyData = allPrograms.filter(p =>
          !p.location_id || regionLocationIds.includes(p.location_id)
        );
      } else {
        loyaltyData = await LoyaltyProgram.list("-last_visit");
      }

      const enrichedCustomers = loyaltyData.map(loyalty => {
        const profile = customerProfiles.find(p => p.phone_number === loyalty.customer_phone);
        return {
          ...loyalty,
          profile: profile
        };
      });

      setLoyaltyPrograms(enrichedCustomers);
    } catch (error) {
      console.error("Failed to load loyalty programs:", error);
      setLoyaltyPrograms([]);
    }
    setIsLoading(false);
  };

  const handleExportCustomers = () => {
    const csvContent = [
      ["Name", "Phone", "Email", "Tier", "Points", "Total Spent", "Last Visit"].join(","),
      ...filteredLoyaltyPrograms.map(c => [
        c.program_name || c.profile?.full_name || "N/A",
        c.customer_phone,
        c.customer_email || "N/A",
        c.tier_status,
        c.points_balance,
        c.total_spent.toFixed(2),
        c.last_visit ? format(new Date(c.last_visit), 'MM/dd/yyyy') : "N/A"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loyalty_customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: "bg-orange-100 text-orange-800",
      silver: "bg-gray-100 text-gray-800",
      gold: "bg-yellow-100 text-yellow-800",
      platinum: "bg-purple-100 text-purple-800"
    };
    return colors[tier] || "bg-gray-100 text-gray-800";
  };

  const tierStats = {
    bronze: loyaltyPrograms.filter(c => c.tier_status === 'bronze').length,
    silver: loyaltyPrograms.filter(c => c.tier_status === 'silver').length,
    gold: loyaltyPrograms.filter(c => c.tier_status === 'gold').length,
    platinum: loyaltyPrograms.filter(c => c.tier_status === 'platinum').length
  };

  return (
    <div className="space-y-6">
      {currentScope && (
        <Alert className="bg-blue-50 border-blue-200">
          <MapPin className="w-4 h-4 text-blue-600" />
          <AlertDescription>
            <strong>Viewing loyalty members for:</strong> {currentScope.label}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Loyalty Program Management</h2>
          <p className="text-gray-600">Manage members, track promotions, and analyze engagement</p>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customers">
            <Users className="w-4 h-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Program Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold">{loyaltyPrograms.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTierFilter(tierFilter === 'bronze' ? 'all' : 'bronze')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bronze</p>
                    <p className="text-2xl font-bold">{tierStats.bronze}</p>
                  </div>
                  <Award className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTierFilter(tierFilter === 'silver' ? 'all' : 'silver')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Silver</p>
                    <p className="text-2xl font-bold">{tierStats.silver}</p>
                  </div>
                  <Award className="w-8 h-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTierFilter(tierFilter === 'gold' ? 'all' : 'gold')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Gold</p>
                    <p className="text-2xl font-bold">{tierStats.gold}</p>
                  </div>
                  <Award className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTierFilter(tierFilter === 'platinum' ? 'all' : 'platinum')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Platinum</p>
                    <p className="text-2xl font-bold">{tierStats.platinum}</p>
                  </div>
                  <Award className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by phone, email, or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {tierFilter !== "all" && (
                    <Button variant="outline" size="sm" onClick={() => setTierFilter("all")}>
                      <Filter className="w-4 h-4 mr-2" />
                      Clear Filter
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleExportCustomers}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button size="sm" onClick={loadLoyaltyPrograms}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8">Loading customers...</p>
              ) : filteredLoyaltyPrograms.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || tierFilter !== "all" ? "No customers match your filters" : "No loyalty members yet"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="p-3 text-sm font-semibold">Customer</th>
                        <th className="p-3 text-sm font-semibold">Contact</th>
                        <th className="p-3 text-sm font-semibold">Tier</th>
                        <th className="p-3 text-sm font-semibold">Points</th>
                        <th className="p-3 text-sm font-semibold">Total Spent</th>
                        <th className="p-3 text-sm font-semibold">Last Visit</th>
                        <th className="p-3 text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLoyaltyPrograms.map((customer) => (
                        <tr key={customer.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                                {(customer.profile?.full_name || customer.program_name || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {customer.profile?.full_name || customer.program_name || 'Unnamed Customer'}
                                </p>
                                <p className="text-xs text-gray-500">ID: {customer.id.substring(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              <p className="text-sm flex items-center gap-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                {customer.customer_phone}
                              </p>
                              {customer.customer_email && (
                                <p className="text-sm flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  {customer.customer_email}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={getTierColor(customer.tier_status)}>
                              {customer.tier_status?.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-bold text-purple-600">{customer.points_balance}</p>
                              <p className="text-xs text-gray-500">${(customer.points_balance * 0.01).toFixed(2)} value</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="font-semibold">${customer.total_spent.toFixed(2)}</p>
                          </td>
                          <td className="p-3">
                            <p className="text-sm">
                              {customer.last_visit ? format(new Date(customer.last_visit), 'MMM d, yyyy') : 'Never'}
                            </p>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedCustomer(customer)}
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                Details
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowAddPointsModal(customer)}
                              >
                                <Gift className="w-4 h-4 mr-1" />
                                Points
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <LoyaltyAnalyticsDashboard customers={loyaltyPrograms} />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Program Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <h4 className="font-semibold">Points & Rewards</h4>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Points per dollar spent:</span>
                      <strong>1 point</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Point value:</span>
                      <strong>$0.01</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Welcome bonus:</span>
                      <strong>100 points</strong>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Settings
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h4 className="font-semibold">Tier Requirements</h4>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span>🥉 Bronze:</span>
                      <strong>$0+</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>🥈 Silver:</span>
                      <strong>$500+</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>🥇 Gold:</span>
                      <strong>$1,000+</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>💎 Platinum:</span>
                      <strong>$2,500+</strong>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-4">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Tiers
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <h4 className="font-semibold">Tier Benefits</h4>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-orange-600 mb-2">Bronze</p>
                      <ul className="space-y-1 text-xs">
                        <li>• 1x points on purchases</li>
                        <li>• Standard offers</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600 mb-2">Silver</p>
                      <ul className="space-y-1 text-xs">
                        <li>• 1.5x points on purchases</li>
                        <li>• Birthday bonus</li>
                        <li>• Exclusive offers</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-yellow-600 mb-2">Gold</p>
                      <ul className="space-y-1 text-xs">
                        <li>• 2x points on purchases</li>
                        <li>• Priority customer service</li>
                        <li>• Premium offers</li>
                        <li>• Free car wash monthly</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-purple-600 mb-2">Platinum</p>
                      <ul className="space-y-1 text-xs">
                        <li>• 3x points on purchases</li>
                        <li>• VIP customer service</li>
                        <li>• Exclusive VIP events</li>
                        <li>• Free car wash weekly</li>
                        <li>• Personalized offers</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={loadLoyaltyPrograms}
        />
      )}

      {showAddPointsModal && (
        <AddPointsModal
          customer={showAddPointsModal}
          onClose={() => setShowAddPointsModal(null)}
          onUpdate={loadLoyaltyPrograms}
        />
      )}
    </div>
  );
}