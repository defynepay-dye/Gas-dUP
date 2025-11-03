import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RegionSelector({ regions, selectedRegion, onSelectRegion }) {
    return (
        <div className="max-w-xs">
            <Select value={selectedRegion} onValueChange={onSelectRegion}>
                <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select a region..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {regions.map(region => (
                        <SelectItem key={region.id} value={region.id}>{region.region_name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}