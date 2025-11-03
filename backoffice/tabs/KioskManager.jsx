
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, ClipboardList } from "lucide-react";

export default function KioskManager() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2"><ClipboardList /> Menu Board & Kiosk Manager</h2>
                <p className="text-gray-600">Design and manage layouts for your digital menu boards and self-service kiosks.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Monitor /> Digital Menu Boards</CardTitle>
                        <CardDescription>Configure what menus and promotions appear on your in-store screens.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-8 border-dashed border-2 rounded-lg text-center">
                            <h3 className="text-sm font-medium text-gray-900">Menu Board Designer Coming Soon</h3>
                            <p className="mt-1 text-sm text-gray-500">A visual drag-and-drop editor for your menu boards is on the way.</p>
                            <Button className="mt-4">Design Layout</Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Smartphone /> Self-Service Kiosks</CardTitle>
                        <CardDescription>Manage the user interface, available items, and payment options for kiosks.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-8 border-dashed border-2 rounded-lg text-center">
                            <h3 className="text-sm font-medium text-gray-900">Kiosk Configuration Coming Soon</h3>
                            <p className="mt-1 text-sm text-gray-500">Control the entire self-service experience from here.</p>
                            <Button className="mt-4">Configure Kiosk</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
