import React, { useState, useEffect, useCallback } from 'react';
import { CurrencyRate } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coins, Plus, Save, Trash2, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function CurrencyManager() {
    const [rates, setRates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(null);

    const loadRates = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await CurrencyRate.list("-last_updated");
            setRates(data.map(rate => ({ ...rate, isEditing: false })));
        } catch (error) {
            console.error("Failed to load currency rates:", error);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadRates();
    }, [loadRates]);

    const handleAddNew = () => {
        setRates(prev => [{
            id: `new-${Date.now()}`,
            base_currency: 'USD',
            target_currency: '',
            exchange_rate: 1,
            rate_source: 'manual_entry',
            isEditing: true,
            isNew: true
        }, ...prev]);
    };

    const handleSave = async (rateToSave) => {
        setIsSaving(rateToSave.id);
        try {
            const { isEditing, isNew, id, ...dataToSave } = rateToSave;
            if (isNew) {
                await CurrencyRate.create(dataToSave);
            } else {
                await CurrencyRate.update(id, dataToSave);
            }
            await loadRates();
        } catch (error) {
            console.error("Failed to save rate:", error);
            alert("Error saving rate. Please check the values and try again.");
        } finally {
            setIsSaving(null);
        }
    };

    const handleDelete = async (id, isNew) => {
        if (!isNew && !window.confirm("Are you sure you want to delete this currency rate?")) {
            return;
        }

        if (isNew) {
            setRates(prev => prev.filter(r => r.id !== id));
            return;
        }

        try {
            await CurrencyRate.delete(id);
            await loadRates();
        } catch (error) {
            console.error("Failed to delete rate:", error);
        }
    };
    
    const handleInputChange = (id, field, value) => {
        setRates(prevRates =>
            prevRates.map(rate =>
                rate.id === id ? { ...rate, [field]: value } : rate
            )
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Coins /> Currency & Foreign Exchange (FX) Manager</CardTitle>
                        <CardDescription>Manage currency exchange rates for transactions. Base currency is USD.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={loadRates} disabled={isLoading}><RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}/> Refresh</Button>
                        <Button onClick={handleAddNew}><Plus className="w-4 h-4 mr-2" /> Add Currency</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {rates.map(rate => (
                            <div key={rate.id} className="grid grid-cols-5 gap-4 items-center p-3 border rounded-lg">
                                <Input
                                    placeholder="e.g., CAD"
                                    value={rate.target_currency}
                                    onChange={(e) => handleInputChange(rate.id, 'target_currency', e.target.value.toUpperCase())}
                                    className="font-mono"
                                />
                                <div className="flex items-center gap-2">
                                  <span>1 USD =</span>
                                  <Input
                                      type="number"
                                      step="0.0001"
                                      placeholder="e.g., 1.35"
                                      value={rate.exchange_rate}
                                      onChange={(e) => handleInputChange(rate.id, 'exchange_rate', parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{rate.rate_source}</p>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {rate.last_updated ? format(new Date(rate.last_updated), 'MMM d, yyyy h:mm a') : 'Not saved'}
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button onClick={() => handleSave(rate)} size="sm" disabled={isSaving === rate.id}>
                                        {isSaving === rate.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                                    </Button>
                                    <Button variant="destructive" size="icon" onClick={() => handleDelete(rate.id, rate.isNew)} className="w-9 h-9">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {isLoading && <p>Loading rates...</p>}
                        {!isLoading && rates.length === 0 && (
                            <p className="text-center py-8 text-gray-500">No currency rates found. Add one to get started.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-blue-800 text-base">Real-Time Exchange Rates</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-700">
                    <p>For fully automated, real-time exchange rate updates, a backend integration with a provider like Open Exchange Rates or a bank API is required. This can be enabled as an enterprise feature.</p>
                    <Button variant="outline" className="mt-3">Request Enterprise API Integration</Button>
                </CardContent>
            </Card>
        </div>
    );
}