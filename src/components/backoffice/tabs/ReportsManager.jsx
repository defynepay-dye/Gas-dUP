
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BarChart2, Fuel, Archive, User, Shield, DollarSign } from "lucide-react";
import SalesReport from '../../reports/SalesReport';
import FuelReport from '../../reports/FuelReport';
import InventoryReport from '../../reports/InventoryReport';
import FinancialReport from '../../reports/FinancialReport';
import ManagementReport from '../../reports/ManagementReport';
import TreasuryReportsTab from './TreasuryReportsTab';
import EmployeePayablesReport from '../../reports/EmployeePayablesReport';

export default function ReportsManager({ currentScope, activeShiftsData }) {
    const [activeTab, setActiveTab] = useState('sales');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
                <p className="text-sm text-gray-500 mt-1">Comprehensive reporting across all operations</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="sales">Sales Reports</TabsTrigger>
                    <TabsTrigger value="fuel">Fuel Reports</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory Reports</TabsTrigger>
                    <TabsTrigger value="financial">Financial Reports</TabsTrigger>
                    <TabsTrigger value="payroll">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Payroll Liability
                    </TabsTrigger>
                    <TabsTrigger value="treasury">
                        <Shield className="w-4 h-4 mr-2" />
                        Treasury
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sales" className="mt-4">
                    <SalesReport />
                </TabsContent>
                <TabsContent value="fuel" className="mt-4">
                    <FuelReport />
                </TabsContent>
                <TabsContent value="inventory" className="mt-4">
                    <InventoryReport />
                </TabsContent>
                <TabsContent value="financial" className="mt-4">
                    <FinancialReport />
                </TabsContent>
                <TabsContent value="payroll" className="mt-4">
                    <EmployeePayablesReport currentScope={currentScope} />
                </TabsContent>
                <TabsContent value="treasury" className="mt-4">
                    <TreasuryReportsTab currentScope={currentScope} activeShiftsData={activeShiftsData} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
