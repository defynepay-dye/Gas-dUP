
import React, { useState, useEffect } from 'react';
import { Category, CategoryItem, LotteryTicket } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Plus, Search, ArrowLeft, Settings, Ticket, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const colorClasses = {
    blue: "bg-blue-500 hover:bg-blue-600 text-white",
    green: "bg-green-500 hover:bg-green-600 text-white",
    orange: "bg-orange-500 hover:bg-orange-600 text-white",
    purple: "bg-purple-500 hover:bg-purple-600 text-white",
    red: "bg-red-500 hover:bg-red-600 text-white",
    yellow: "bg-yellow-500 hover:bg-yellow-600 text-white",
    pink: "bg-pink-500 hover:bg-pink-600 text-white",
    indigo: "bg-indigo-500 hover:bg-indigo-600 text-white"
};

export default function QuickItemsPanel({ onAddToCart }) {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryItems, setCategoryItems] = useState([]);
    const [lotteryTickets, setLotteryTickets] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddItem, setShowAddItem] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCategories();
        loadLotteryTickets();
    }, []);

    useEffect(() => {
        if (selectedCategory && selectedCategory.category_name !== 'Lottery') {
            loadCategoryItems(selectedCategory.id);
        } else if (!selectedCategory) {
            // Reset search term when going back to category list
            setSearchTerm("");
        }
    }, [selectedCategory]);

    const loadCategories = async () => {
        setIsLoading(true);
        try {
            const data = await Category.filter({ active: true, show_in_pos: true }, "display_order");
            setCategories(data);
        } catch (error) {
            console.error("Failed to load categories:", error);
            setCategories([]);
        }
        setIsLoading(false);
    };

    const loadLotteryTickets = async () => {
        try {
            const tickets = await LotteryTicket.filter({ active: true });
            setLotteryTickets(tickets);
        } catch (error) {
            console.error("Failed to load lottery tickets:", error);
            setLotteryTickets([]);
        }
    };

    const loadCategoryItems = async (categoryId) => {
        try {
            const items = await CategoryItem.filter({ category_id: categoryId, active: true }, "display_order");
            setCategoryItems(items);
        } catch (error) {
            console.error("Failed to load category items:", error);
            setCategoryItems([]);
        }
    };

    const handleAddItem = async (itemData) => {
        if (!selectedCategory || selectedCategory.category_name === 'Lottery') return; // Cannot add regular items to Lottery category
        
        try {
            const newItem = await CategoryItem.create({
                ...itemData,
                category_id: selectedCategory.id
            });
            setShowAddItem(false);
            loadCategoryItems(selectedCategory.id);
        } catch (error) {
            console.error("Failed to add item:", error);
            alert("Could not add item.");
        }
    };

    const handleItemClick = (item) => {
        const category = categories.find(c => c.id === item.category_id);
        const taxSettings = category?.tax_settings || {};
        
        let totalTaxRate = 0;
        if (taxSettings.tier_1_enabled) totalTaxRate += taxSettings.tier_1_rate || 0;
        if (taxSettings.tier_2_enabled) totalTaxRate += taxSettings.tier_2_rate || 0;
        if (taxSettings.tier_3_enabled) totalTaxRate += taxSettings.tier_3_rate || 0;
        
        const taxAmount = (item.price * totalTaxRate) / 100;

        const cartItem = {
            ...item,
            product_name: item.item_name,
            upc_code: item.upc_code || `CAT-${item.id}`,
            unit_price: item.price,
            cash_price: item.price,
            total_price: item.price,
            tax_amount: taxAmount,
            quantity: 1,
            category_name: category?.category_name
        };

        onAddToCart(cartItem);
    };

    const handleLotteryTicketClick = (ticket) => {
        if (ticket.tickets_remaining <= 0) {
            alert(`${ticket.game_name} is out of stock!`);
            return;
        }

        const cartItem = {
            product_name: ticket.game_name,
            upc_code: ticket.game_number,
            unit_price: ticket.ticket_price,
            cash_price: ticket.ticket_price,
            total_price: ticket.ticket_price,
            tax_amount: 0, // Lottery is usually tax-exempt
            quantity: 1,
            category_name: 'Lottery',
            is_lottery: true,
            lottery_game_id: ticket.id // Pass ID to link to ticket for decrement
        };

        onAddToCart(cartItem);
    };

    const filteredItems = categoryItems.filter(item =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredLotteryTickets = lotteryTickets.filter(ticket =>
        ticket.game_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return <div className="p-4">Loading categories...</div>;
    }

    // Show lottery tickets view
    if (selectedCategory && selectedCategory.category_name === 'Lottery') {
        return (
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <CardTitle className="flex items-center gap-2">
                            <Ticket className="w-5 h-5" />
                            Lottery Tickets
                        </CardTitle>
                        <Button size="sm" onClick={() => window.location.href = '/BackOffice?tab=lottery_manager'}>
                            <Settings className="w-4 h-4 mr-2" />
                            Manage
                        </Button>
                    </div>
                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search lottery games..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full">
                        {filteredLotteryTickets.length === 0 ? (
                            <div className="text-center py-12">
                                <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p className="text-gray-600 mb-2">No lottery games available</p>
                                <p className="text-sm text-gray-500 mb-4">Set up lottery games in Back Office</p>
                                <Button size="sm" onClick={() => window.location.href = '/BackOffice?tab=lottery_manager'}>
                                    Go to Lottery Manager
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {filteredLotteryTickets.map(ticket => (
                                    <Button
                                        key={ticket.id}
                                        onClick={() => handleLotteryTicketClick(ticket)}
                                        disabled={ticket.tickets_remaining <= 0}
                                        className={`h-24 text-base flex flex-col justify-center relative ${
                                            ticket.tickets_remaining <= 0 
                                                ? 'bg-gray-300 hover:bg-gray-300 text-gray-600 cursor-not-allowed opacity-70' 
                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                    >
                                        <span className="font-semibold">{ticket.game_name}</span>
                                        <span className="text-sm">${ticket.ticket_price.toFixed(2)}</span>
                                        <Badge 
                                            className={`mt-1 text-xs px-2 py-0.5 rounded-full ${
                                                ticket.tickets_remaining > 10 
                                                    ? 'bg-white text-green-700' 
                                                    : 'bg-red-500 text-white'
                                            }`}
                                        >
                                            {ticket.tickets_remaining} left
                                        </Badge>
                                        {ticket.tickets_remaining <= 0 && (
                                            <span className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-lg font-bold">
                                                SOLD OUT
                                            </span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        );
    }

    // Show category list
    if (!selectedCategory) {
        return (
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Quick Items</span>
                        <Button size="sm" variant="outline" onClick={() => window.location.href = '/BackOffice?tab=quick_items_manager'}>
                            <Settings className="w-4 h-4 mr-2" />
                            Manage
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="grid grid-cols-2 gap-3">
                            {/* Lottery Category - Always show if lottery tickets exist */}
                            {lotteryTickets.length > 0 && (
                                <Button
                                    onClick={() => setSelectedCategory({ id: 'lottery_placeholder', category_name: 'Lottery', color: 'green' })} // Using a placeholder ID
                                    className="h-24 text-lg font-semibold flex flex-col justify-center bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Ticket className="w-6 h-6 mb-1" />
                                    Lottery
                                    <Badge className="mt-1 text-xs bg-white text-green-700">
                                        {lotteryTickets.length} games
                                    </Badge>
                                </Button>
                            )}

                            {/* Regular Categories */}
                            {categories.map(category => (
                                <Button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`h-24 text-lg font-semibold flex flex-col justify-center ${colorClasses[category.color] || colorClasses.blue}`}
                                >
                                    {category.category_name}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        );
    }

    // Show items in selected category
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <CardTitle>{selectedCategory.category_name}</CardTitle>
                    <Button size="sm" onClick={() => setShowAddItem(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                    </Button>
                </div>
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
                <ScrollArea className="h-full">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                            <p>No items found for this category.</p>
                            <p className="text-sm">Click 'Add' to create a new item.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filteredItems.map(item => (
                                <Button
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className={`h-20 text-base flex flex-col justify-center ${colorClasses[selectedCategory.color] || colorClasses.blue}`}
                                >
                                    <span className="font-semibold">{item.item_name}</span>
                                    <span className="text-sm">${item.price.toFixed(2)}</span>
                                </Button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>

            {showAddItem && (
                <AddItemModal
                    category={selectedCategory}
                    onAdd={handleAddItem}
                    onClose={() => setShowAddItem(false)}
                />
            )}
        </Card>
    );
}

function AddItemModal({ category, onAdd, onClose }) {
    const [formData, setFormData] = useState({
        item_name: "",
        price: "",
        upc_code: "",
        sku: "",
        description: "",
        cost: ""
    });

    const handleSubmit = () => {
        if (!formData.item_name || formData.price === "") {
            alert("Please enter item name and price");
            return;
        }
        if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
            alert("Price must be a valid non-negative number.");
            return;
        }
        if (formData.cost !== "" && (isNaN(parseFloat(formData.cost)) || parseFloat(formData.cost) < 0)) {
            alert("Cost must be a valid non-negative number.");
            return;
        }

        onAdd({
            ...formData,
            price: parseFloat(formData.price),
            cost: formData.cost ? parseFloat(formData.cost) : 0,
            active: true // New items are active by default
        });
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Item to {category.category_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="item_name">Item Name *</Label>
                        <Input
                            id="item_name"
                            value={formData.item_name}
                            onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                            placeholder="e.g., Large Car Wash"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="price">Price *</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="cost">Cost</Label>
                            <Input
                                id="cost"
                                type="number"
                                step="0.01"
                                value={formData.cost}
                                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="upc_code">UPC Code (Optional)</Label>
                            <Input
                                id="upc_code"
                                value={formData.upc_code}
                                onChange={(e) => setFormData({...formData, upc_code: e.target.value})}
                                placeholder="Scan or enter UPC"
                            />
                        </div>
                        <div>
                            <Label htmlFor="sku">SKU (Optional)</Label>
                            <Input
                                id="sku"
                                value={formData.sku}
                                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                                placeholder="Internal code"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Optional description"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Add Item</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
