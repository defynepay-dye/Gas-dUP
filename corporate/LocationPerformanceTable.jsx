import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function LocationPerformanceTable({ locations, transactions, isLoading }) {
    const performanceData = useMemo(() => {
        return locations.map(location => {
            // Again, this is a placeholder for location-based filtering
            const locationSales = transactions.reduce((sum, t) => {
                 if (parseInt(t.id, 16) % locations.length === locations.indexOf(location)) {
                    return sum + (t.total_amount || 0);
                }
                return sum;
            }, 0);
            
            return {
                id: location.id,
                name: location.location_name,
                sales: locationSales,
                change: (Math.random() - 0.4) * 20, // Random change for demo
            };
        }).sort((a, b) => b.sales - a.sales);
    }, [locations, transactions]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="flex justify-between py-2">
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-5 w-1/4" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Performing Locations</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Sales</TableHead>
                            <TableHead className="text-right">Change</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {performanceData.slice(0, 7).map(loc => (
                            <TableRow key={loc.id}>
                                <TableCell className="font-medium">{loc.name}</TableCell>
                                <TableCell className="text-right">${loc.sales.toLocaleString()}</TableCell>
                                <TableCell className={`text-right font-medium flex justify-end items-center ${loc.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {loc.change > 0 ? <ArrowUp className="w-4 h-4 mr-1"/> : <ArrowDown className="w-4 h-4 mr-1"/>}
                                    {loc.change.toFixed(1)}%
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}