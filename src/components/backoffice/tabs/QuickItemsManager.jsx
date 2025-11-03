import React, { useState, useEffect } from 'react';
import { Category, CategoryItem } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function QuickItemsManager() {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryItems, setCategoryItems] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            loadCategoryItems(selectedCategory.id);
        }
    }, [selectedCategory]);

    const loadCategories = async () => {
        const data = await Category.list("display_order");
        setCategories(data);
    };

    const loadCategoryItems = async (categoryId) => {
        const items = await CategoryItem.filter({ category_id: categoryId }, "display_order");
        setCategoryItems(items);
    };

    const handleSaveCategory = async (categoryData) => {
        if (editingCategory) {
            await Category.update(editingCategory.id, categoryData);
        } else {
            await Category.create(categoryData);
        }
        setShowCategoryModal(false);
        setEditingCategory(null);
        loadCategories();
    };

    const handleSaveItem = async (itemData) => {
        if (editingItem) {
            await CategoryItem.update(editingItem.id, itemData);
        } else {
            await CategoryItem.create({ ...itemData, category_id: selectedCategory.id });
        }
        setShowItemModal(false);
        setEditingItem(null);
        loadCategoryItems(selectedCategory.id);
    };

    const handleDeleteCategory = async (categoryId) => {
        if (confirm("Delete this category? This will NOT delete the items, only remove the category.")) {
            await Category.delete(categoryId);
            if (selectedCategory?.id === categoryId) setSelectedCategory(null);
            loadCategories();
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (confirm("Delete this item?")) {
            await CategoryItem.delete(itemId);
            loadCategoryItems(selectedCategory.id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Quick Items & Category Manager</h2>
                    <p className="text-gray-600">Manage categories and items for POS, Kiosk, and QSR</p>
                </div>
                <Button onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Category
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Categories List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {categories.map(category => (
                            <div
                                key={category.id}
                                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${selectedCategory?.id === category.id ? 'bg-blue-50 border-blue-500' : ''}`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">{category.category_name}</span>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingCategory(category); setShowCategoryModal(true); }}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    {category.show_in_pos && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">POS</span>}
                                    {category.show_in_kiosk && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Kiosk</span>}
                                    {category.show_in_qsr && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">QSR</span>}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Items in Selected Category */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{selectedCategory ? `Items in ${selectedCategory.category_name}` : 'Select a category'}</CardTitle>
                            {selectedCategory && (
                                <Button size="sm" onClick={() => { setEditingItem(null); setShowItemModal(true); }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Item
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {selectedCategory ? (
                            <div className="space-y-2">
                                {categoryItems.map(item => (
                                    <div key={item.id} className="p-4 border rounded-lg">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold">{item.item_name}</h4>
                                                <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                                                {item.upc_code && <p className="text-xs text-gray-500">UPC: {item.upc_code}</p>}
                                                {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => { setEditingItem(item); setShowItemModal(true); }}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">Select a category to view items</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {showCategoryModal && (
                <CategoryModal
                    category={editingCategory}
                    onSave={handleSaveCategory}
                    onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
                />
            )}

            {showItemModal && selectedCategory && (
                <ItemModal
                    item={editingItem}
                    onSave={handleSaveItem}
                    onClose={() => { setShowItemModal(false); setEditingItem(null); }}
                />
            )}
        </div>
    );
}

function CategoryModal({ category, onSave, onClose }) {
    const [formData, setFormData] = useState(category || {
        category_name: "",
        color: "blue",
        display_order: 0,
        tax_settings: {
            tier_1_enabled: true,
            tier_1_rate: 6.25,
            tier_2_enabled: false,
            tier_2_rate: 0,
            tier_3_enabled: false,
            tier_3_rate: 0
        },
        show_in_pos: true,
        show_in_kiosk: true,
        show_in_qsr: false,
        active: true
    });

    const handleSubmit = () => {
        if (!formData.category_name) {
            alert("Please enter category name");
            return;
        }
        onSave(formData);
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{category ? 'Edit' : 'New'} Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div>
                        <Label>Category Name *</Label>
                        <Input
                            value={formData.category_name}
                            onChange={(e) => setFormData({...formData, category_name: e.target.value})}
                            placeholder="e.g., Car Wash, Food Service"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Button Color</Label>
                            <Select value={formData.color} onValueChange={(value) => setFormData({...formData, color: value})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="blue">Blue</SelectItem>
                                    <SelectItem value="green">Green</SelectItem>
                                    <SelectItem value="orange">Orange</SelectItem>
                                    <SelectItem value="purple">Purple</SelectItem>
                                    <SelectItem value="red">Red</SelectItem>
                                    <SelectItem value="yellow">Yellow</SelectItem>
                                    <SelectItem value="pink">Pink</SelectItem>
                                    <SelectItem value="indigo">Indigo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Display Order</Label>
                            <Input
                                type="number"
                                value={formData.display_order}
                                onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div className="border rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold">Tax Settings</h4>
                        {[1, 2, 3].map(tier => (
                            <div key={tier} className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <Switch
                                        checked={formData.tax_settings[`tier_${tier}_enabled`]}
                                        onCheckedChange={(checked) => setFormData({
                                            ...formData,
                                            tax_settings: {...formData.tax_settings, [`tier_${tier}_enabled`]: checked}
                                        })}
                                    />
                                    <Label>Tier {tier}</Label>
                                </div>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="w-24"
                                    value={formData.tax_settings[`tier_${tier}_rate`]}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        tax_settings: {...formData.tax_settings, [`tier_${tier}_rate`]: parseFloat(e.target.value) || 0}
                                    })}
                                    disabled={!formData.tax_settings[`tier_${tier}_enabled`]}
                                    placeholder="0.00"
                                />
                                <span className="ml-2">%</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Show in POS</Label>
                            <Switch checked={formData.show_in_pos} onCheckedChange={(checked) => setFormData({...formData, show_in_pos: checked})} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Show in Kiosk</Label>
                            <Switch checked={formData.show_in_kiosk} onCheckedChange={(checked) => setFormData({...formData, show_in_kiosk: checked})} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Show in QSR Menu</Label>
                            <Switch checked={formData.show_in_qsr} onCheckedChange={(checked) => setFormData({...formData, show_in_qsr: checked})} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Active</Label>
                            <Switch checked={formData.active} onCheckedChange={(checked) => setFormData({...formData, active: checked})} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Category</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ItemModal({ item, onSave, onClose }) {
    const [formData, setFormData] = useState(item || {
        item_name: "",
        price: "",
        cost: "",
        upc_code: "",
        sku: "",
        description: "",
        display_order: 0,
        track_inventory: false,
        quantity_on_hand: 0,
        active: true
    });

    const handleSubmit = () => {
        if (!formData.item_name || !formData.price) {
            alert("Please enter item name and price");
            return;
        }
        onSave({
            ...formData,
            price: parseFloat(formData.price),
            cost: formData.cost ? parseFloat(formData.cost) : 0
        });
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{item ? 'Edit' : 'New'} Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label>Item Name *</Label>
                        <Input
                            value={formData.item_name}
                            onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Price *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>Cost</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.cost}
                                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>UPC Code</Label>
                            <Input
                                value={formData.upc_code}
                                onChange={(e) => setFormData({...formData, upc_code: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label>SKU</Label>
                            <Input
                                value={formData.sku}
                                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Track Inventory</Label>
                        <Switch checked={formData.track_inventory} onCheckedChange={(checked) => setFormData({...formData, track_inventory: checked})} />
                    </div>
                    {formData.track_inventory && (
                        <div>
                            <Label>Quantity on Hand</Label>
                            <Input
                                type="number"
                                value={formData.quantity_on_hand}
                                onChange={(e) => setFormData({...formData, quantity_on_hand: parseInt(e.target.value) || 0})}
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Item</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}