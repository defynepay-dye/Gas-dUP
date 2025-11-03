import React, { useState, useEffect } from 'react';
import { QSRMenu, ModifierGroup, InventoryItem } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, UtensilsCrossed, Pizza, Sandwich } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock Components - these would be complex in a real app
const MenuBuilder = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Menu Builder</CardTitle>
                <CardDescription>Drag and drop items to build your menus for POS and Kiosk.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="p-8 border-dashed border-2 rounded-lg text-center">
                    <Sandwich className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Visual Menu Builder Coming Soon</h3>
                    <p className="mt-1 text-sm text-gray-500">Manage QSRMenu entities below for now.</p>
                </div>
            </CardContent>
        </Card>
    )
}

const ModifierManager = () => {
    const [modifierGroups, setModifierGroups] = useState([]);

    useEffect(() => {
        const loadGroups = async () => {
            const data = await ModifierGroup.list();
            setModifierGroups(data);
        };
        loadGroups();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Modifier Manager</CardTitle>
                <CardDescription>Create and manage modifier groups like "Toppings" or "Cheese Options".</CardDescription>
            </CardHeader>
            <CardContent>
                <Button>
                    <Plus className="w-4 h-4 mr-2" /> Add Modifier Group
                </Button>
                <div className="mt-4 space-y-2">
                    {modifierGroups.map(group => (
                        <div key={group.id} className="p-3 border rounded-lg">
                            <p className="font-semibold">{group.group_name}</p>
                            <p className="text-sm text-gray-500">
                                {group.modifiers?.length || 0} options
                            </p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const RecipeEditor = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recipe Editor & Costing</CardTitle>
                <CardDescription>Define recipes for your QSR items and analyze cost-per-serving in real-time.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="p-8 border-dashed border-2 rounded-lg text-center">
                    <Pizza className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Advanced Recipe Editor Coming Soon</h3>
                    <p className="mt-1 text-sm text-gray-500">You can manage recipes on the Inventory Item detail page.</p>
                </div>
            </CardContent>
        </Card>
    )
}

export default function QSRManager() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2"><UtensilsCrossed /> QSR / Food Service Management</h2>
                <p className="text-gray-600">Manage menus, modifiers, and recipes for your food service operations.</p>
            </div>
            <Tabs defaultValue="menu_builder">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="menu_builder">Menu Builder</TabsTrigger>
                    <TabsTrigger value="modifiers">Modifier Manager</TabsTrigger>
                    <TabsTrigger value="recipes">Recipe Editor</TabsTrigger>
                </TabsList>
                <TabsContent value="menu_builder" className="mt-4">
                    <MenuBuilder />
                </TabsContent>
                <TabsContent value="modifiers" className="mt-4">
                    <ModifierManager />
                </TabsContent>
                <TabsContent value="recipes" className="mt-4">
                    <RecipeEditor />
                </TabsContent>
            </Tabs>
        </div>
    );
}