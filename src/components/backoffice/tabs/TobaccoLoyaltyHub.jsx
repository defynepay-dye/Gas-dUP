
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert"; // New import
import {
  TobaccoLoyaltyMember, TobaccoScanData, PersonalizedOffer,
  ScanDataSubscription, CPGScanData, AlcoholScanData
} from "@/api/entities";
import {
  Shield, Users, BarChart3, FileText, Settings,
  TrendingUp, Target, Zap, CheckCircle, DollarSign,
  ShoppingBag, Package, AlertCircle, ExternalLink, MapPin // MapPin new import
} from "lucide-react";

export default function TobaccoLoyaltyHub({ currentScope }) { // Modified function signature
  const [members, setMembers] = useState([]);
  const [scanData, setScanData] = useState([]);
  const [offers, setOffers] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState({
    totalMembers: 0,
    eaivVerified: 0,
    altriaPlusEnrolled: 0,
    offersRedeemed: 0,
    scanDataReports: 0,
    complianceRate: 100
  });

  useEffect(() => {
    loadData();
  }, [currentScope]); // Added currentScope to dependency array

  const loadData = async () => {
    setIsLoading(true);
    try {
      let fetchedMembers = [];
      let fetchedScanData = [];
      let fetchedOffers = [];

      // Always load subscription, it's typically not scope-dependent
      const subscriptionDataList = await ScanDataSubscription.list();
      const fetchedSubscription = subscriptionDataList?.[0] || null;

      if (currentScope?.type === 'location' && currentScope?.id) {
        // Filter by location_id
        [fetchedMembers, fetchedScanData, fetchedOffers] = await Promise.all([
          TobaccoLoyaltyMember.filter({ location_id: currentScope.id }),
          TobaccoScanData.filter({ location_id: currentScope.id }, '-reporting_period_start', 10),
          PersonalizedOffer.filter({ location_id: currentScope.id, active: true }),
        ]);
      } else if (currentScope?.type === 'region' && currentScope?.id) {
        // Filter by region, requires fetching all data and then filtering by location_ids
        const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
        const regionLocationIds = locationsData
          .filter(loc => loc.region_id === currentScope.id)
          .map(loc => loc.id);

        const [allMembers, allScanData, allOffers] = await Promise.all([
          TobaccoLoyaltyMember.list(),
          TobaccoScanData.list('-reporting_period_start', 20), // Outline specified 20 for region
          PersonalizedOffer.filter({ active: true }),
        ]);

        fetchedMembers = allMembers.filter(m => regionLocationIds.includes(m.location_id));
        fetchedScanData = allScanData.filter(s => regionLocationIds.includes(s.location_id));
        fetchedOffers = allOffers.filter(o => regionLocationIds.includes(o.location_id));
      } else {
        // Default: No specific scope, load all global data
        [fetchedMembers, fetchedScanData, fetchedOffers] = await Promise.all([
          TobaccoLoyaltyMember.list('-created_date', 50), // Original limit
          TobaccoScanData.list('-reporting_period_start', 10), // Original limit
          PersonalizedOffer.filter({ category: 'tobacco', active: true }), // Original filter
        ]);
      }

      setMembers(fetchedMembers || []);
      setScanData(fetchedScanData || []);
      setOffers(fetchedOffers || []);
      setSubscription(fetchedSubscription); // Set subscription here

      // Calculate stats based on potentially filtered data
      const eaivCount = fetchedMembers.filter(m => m.eaiv_verified).length;
      const altriaPlusCount = fetchedMembers.filter(m => m.altria_personalization_plus?.enrolled).length;

      setStats({
        totalMembers: fetchedMembers.length,
        eaivVerified: eaivCount,
        altriaPlusEnrolled: altriaPlusCount,
        offersRedeemed: fetchedOffers.reduce((sum, o) => sum + (o.performance_metrics?.redemptions || 0), 0),
        scanDataReports: fetchedScanData.length,
        complianceRate: fetchedMembers.length > 0 ? ((eaivCount / fetchedMembers.length) * 100).toFixed(1) : 100 // Corrected calculation if no members
      });
    } catch (error) {
      console.error("Error loading tobacco loyalty data:", error);
      // Ensure state is reset on error to avoid displaying stale data or errors
      setMembers([]);
      setScanData([]);
      setOffers([]);
      setSubscription(null);
      setStats({ // Reset stats as well
        totalMembers: 0,
        eaivVerified: 0,
        altriaPlusEnrolled: 0,
        offersRedeemed: 0,
        scanDataReports: 0,
        complianceRate: 100
      });
    }
    setIsLoading(false);
  };

  const TierFeaturesList = ({ tier }) => {
    const tierFeatures = {
      basic: [
        "Basic tobacco scan data",
        "Weekly reporting",
        "EAIV compliance tracking",
        "Standard analytics"
      ],
      professional: [
        "Full tobacco scan data",
        "CPG scan data included",
        "Daily reporting",
        "EAIV + basic LID segmentation",
        "Email support"
      ],
      enterprise: [
        "Full tobacco + CPG + alcohol scan data",
        "Real-time reporting",
        "Advanced LID segmentation",
        "Altria Personalization+ integration",
        "AI-powered insights",
        "Priority support",
        "Custom reporting"
      ],
      ultimate: [
        "Everything in Enterprise",
        "Tier 4 Altria 2026 Digital Trade Program",
        "Full manufacturer portal access",
        "Personalized offer engine",
        "Rebate management automation",
        "Dedicated account manager",
        "API access"
      ]
    };

    return (
      <ul className="space-y-2">
        {tierFeatures[tier]?.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tobacco loyalty data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Location Context Indicator */}
      {currentScope && (
        <Alert className="bg-blue-50 border-blue-200">
          <MapPin className="w-4 h-4 text-blue-600" />
          <AlertDescription>
            <strong>Viewing tobacco loyalty for:</strong> {currentScope.label}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tobacco & CPG Loyalty Hub</h1>
          <p className="text-gray-600 mt-1">
            Full-stack compliance, scan data, and personalized offers - CONEXXUS certified
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Settings className="w-4 h-4 mr-2" />
          Configure
        </Button>
      </div>

      {/* Subscription Tier Card */}
      {subscription && (
        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">
                  {subscription.subscription_tier.toUpperCase()} Tier
                </CardTitle>
                <p className="text-purple-100 mt-1">
                  Active subscription - {subscription.data_transmission_schedule} reporting
                </p>
              </div>
              <Badge className="bg-white text-purple-600 text-lg px-3 py-1">
                ${subscription.pricing?.monthly_fee || 0}/mo
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Members
            </CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.eaivVerified} EAIV verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Altria P+ Enrolled
            </CardTitle>
            <Target className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.altriaPlusEnrolled}</div>
            <p className="text-xs text-gray-500 mt-1">
              Tier 4 eligible
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Compliance Rate
            </CardTitle>
            <Shield className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.complianceRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              EAIV verification rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Offers Redeemed
            </CardTitle>
            <ShoppingBag className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.offersRedeemed}</div>
            <p className="text-xs text-gray-500 mt-1">
              Personalized offers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Scan Data Reports
            </CardTitle>
            <FileText className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.scanDataReports}</div>
            <p className="text-xs text-gray-500 mt-1">
              CONEXXUS certified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Offers
            </CardTitle>
            <Zap className="w-5 h-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{offers.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              AI-targeted campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="scan-data">Scan Data</TabsTrigger>
          <TabsTrigger value="offers">Personalized Offers</TabsTrigger>
          <TabsTrigger value="upgrade">Upgrade Tier</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  EAIV Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Electronic Age & Identity Verification ensures 100% legal compliance for tobacco sales
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Verifications:</span>
                    <span className="font-semibold">{stats.eaivVerified}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Compliance Rate:</span>
                    <span className="font-semibold text-green-600">{stats.complianceRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Altria 2026 Digital Trade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Tier 4 eligibility with LID segmentation and Personalization+
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">P+ Enrolled:</span>
                    <span className="font-semibold">{stats.altriaPlusEnrolled}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">LID Segments:</span>
                    <span className="font-semibold">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Scan Data Transmissions</CardTitle>
            </CardHeader>
            <CardContent>
              {scanData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No scan data reports yet</p>
                  <p className="text-sm">Reports will appear after first transmission</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scanData.slice(0, 5).map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{report.manufacturer?.toUpperCase() || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(report.reporting_period_start).toLocaleDateString()} -
                          {new Date(report.reporting_period_end).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        className={
                          report.report_status === 'acknowledged' ? 'bg-green-100 text-green-800' :
                          report.report_status === 'transmitted' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {report.report_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Loyalty Members</CardTitle>
                <Button>
                  <Users className="w-4 h-4 mr-2" />
                  Enroll New Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No members yet</p>
                  <p className="text-sm">Start enrolling customers to build your loyalty program</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Phone</th>
                        <th className="text-left p-3">EAIV Status</th>
                        <th className="text-left p-3">LID Segment</th>
                        <th className="text-left p-3">Altria P+</th>
                        <th className="text-left p-3">Last Purchase</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.slice(0, 10).map((member, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-mono">{member.phone_number}</td>
                          <td className="p-3">
                            {member.eaiv_verified ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td className="p-3">
                            {member.lid_segmentation?.primary_segment || 'N/A'}
                          </td>
                          <td className="p-3">
                            {member.altria_personalization_plus?.enrolled ? (
                              <Badge className="bg-purple-100 text-purple-800">Enrolled</Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {member.purchase_history?.last_purchase_date
                              ? new Date(member.purchase_history.last_purchase_date).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className="p-3">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
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

        <TabsContent value="scan-data" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  Tobacco Scan Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {scanData.filter(r => r.manufacturer).length}
                </div>
                <p className="text-sm text-gray-600">Reports transmitted</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  CPG Scan Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">0</div>
                <p className="text-sm text-gray-600">Reports transmitted</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Alcohol Rebates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">$0</div>
                <p className="text-sm text-gray-600">Rebates earned</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Scan Data Reports</CardTitle>
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                CONEXXUS 4.0 certified scan data reporting for all manufacturers
              </p>
              {scanData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No scan data yet</p>
                  <p className="text-sm">Sales data will be collected and reported automatically</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scanData.map((report, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{report.manufacturer?.toUpperCase()}</h4>
                          <p className="text-sm text-gray-600">
                            Period: {new Date(report.reporting_period_start).toLocaleDateString()} -
                            {new Date(report.reporting_period_end).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          className={
                            report.report_status === 'acknowledged' ? 'bg-green-100 text-green-800' :
                            report.report_status === 'transmitted' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {report.report_status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                        <div>
                          <p className="text-xs text-gray-500">Products</p>
                          <p className="font-semibold">{report.product_sales?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">CONEXXUS Version</p>
                          <p className="font-semibold">{report.conexxus_metadata?.standard_version || '4.0'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tier</p>
                          <p className="font-semibold">{report.tier_subscription?.toUpperCase() || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Personalized Offers</CardTitle>
                <Button>
                  <Zap className="w-4 h-4 mr-2" />
                  Create Offer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {offers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Target className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No personalized offers yet</p>
                  <p className="text-sm">Create targeted offers based on LID segmentation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {offers.map((offer, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{offer.offer_name}</h4>
                          <p className="text-sm text-gray-600">{offer.offer_type}</p>
                          <div className="flex gap-2 mt-2">
                            {offer.targeting_criteria?.lid_segments?.map((seg, i) => (
                              <Badge key={i} variant="outline">{seg}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            {offer.performance_metrics?.redemptions || 0} redeemed
                          </p>
                          <p className="text-sm text-gray-500">
                            {offer.performance_metrics?.redemption_rate
                              ? `${(offer.performance_metrics.redemption_rate * 100).toFixed(1)}% rate`
                              : 'No data yet'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upgrade" className="space-y-6">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-2xl">Choose Your Subscription Tier</CardTitle>
              <p className="text-gray-600">
                Select the plan that best fits your business needs
              </p>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Basic Tier */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-xl">Basic</CardTitle>
                <div className="text-3xl font-bold mt-2">$99<span className="text-lg font-normal text-gray-600">/mo</span></div>
              </CardHeader>
              <CardContent>
                <TierFeaturesList tier="basic" />
                <Button className="w-full mt-6" variant="outline">
                  Select Basic
                </Button>
              </CardContent>
            </Card>

            {/* Professional Tier */}
            <Card className="relative border-2 border-blue-500">
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                POPULAR
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Professional</CardTitle>
                <div className="text-3xl font-bold mt-2">$299<span className="text-lg font-normal text-gray-600">/mo</span></div>
              </CardHeader>
              <CardContent>
                <TierFeaturesList tier="professional" />
                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
                  Select Professional
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-xl">Enterprise</CardTitle>
                <div className="text-3xl font-bold mt-2">$699<span className="text-lg font-normal text-gray-600">/mo</span></div>
              </CardHeader>
              <CardContent>
                <TierFeaturesList tier="enterprise" />
                <Button className="w-full mt-6" variant="outline">
                  Select Enterprise
                </Button>
              </CardContent>
            </Card>

            {/* Ultimate Tier */}
            <Card className="relative bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-500">
              <div className="absolute top-0 right-0 bg-purple-500 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                TIER 4
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Ultimate</CardTitle>
                <div className="text-3xl font-bold mt-2">$1,499<span className="text-lg font-normal text-gray-600">/mo</span></div>
              </CardHeader>
              <CardContent>
                <TierFeaturesList tier="ultimate" />
                <Button className="w-full mt-6 bg-purple-600 hover:bg-purple-700">
                  Select Ultimate
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Why Upgrade?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Maximize Manufacturer Incentives
                  </h4>
                  <p className="text-sm text-gray-600">
                    Unlock full Tier 4 incentives from Altria's 2026 Digital Trade Program, including Personalization+ and advanced LID targeting
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Ensure Compliance
                  </h4>
                  <p className="text-sm text-gray-600">
                    Full EAIV integration and automated compliance reporting keeps you audit-ready and penalty-free
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    AI-Powered Insights
                  </h4>
                  <p className="text-sm text-gray-600">
                    Machine learning analyzes purchase patterns to automatically generate personalized offers that drive incremental sales
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Capture Every Rebate
                  </h4>
                  <p className="text-sm text-gray-600">
                    Automated rebate tracking and submission ensures you never miss manufacturer incentives or supplier rebates
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
