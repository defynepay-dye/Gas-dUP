import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function SalesByRegionChart({ regions, locations, transactions, isLoading }) {
    const chartData = useMemo(() => {
        if (!regions.length || !locations.length || !transactions.length) return [];
        
        return regions.map(region => {
            const locationIdsInRegion = locations
                .filter(loc => loc.region_id === region.id)
                .map(loc => loc.id);
            
            // This is a placeholder for location-based transaction filtering
            // In a real app, transactions would have a location_id
            const regionSales = transactions.reduce((sum, t) => {
                // Mock logic: assume every 4th transaction belongs to this region for demo
                if (parseInt(t.id, 16) % regions.length === regions.indexOf(region)) {
                    return sum + (t.total_amount || 0);
                }
                return sum;
            }, 0);

            return {
                name: region.region_name,
                sales: regionSales,
            };
        });
    }, [regions, locations, transactions]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-80 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sales by Region</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey="sales" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}