import React, { useState, useEffect, useCallback } from 'react';
import { CustomItem } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// Default empty function to prevent crashes if onAddToCart is not provided
const defaultOnAddToCart = () => {
  console.error("onAddToCart function was not provided to CustomItemManager");
  alert("Error: This item cannot be added to the cart right now.");
};

export default function CustomItemManager({ onAddToCart = defaultOnAddToCart }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [showManager, setShowManager] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const loadItems = useCallback(async () => {
    try {
      const allItems = await CustomItem.list("sort_order");
      const topLevelCategories = allItems.filter(item => item.is_category && !item.parent_id);
      setCategories(topLevelCategories);
      if (topLevelCategories.length > 0) {
        const firstCategory = topLevelCategories[0];
        setActiveCategory(firstCategory);
        const categoryItems = allItems.filter(item => !item.is_category && item.parent_id === firstCategory.id);
        setItems(categoryItems);
      } else {
        // Handle case with no categories
        setActiveCategory(null);
        setItems([]);
      }
    } catch (error) {
      console.error("Failed to load custom items:", error);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleCategoryClick = async (category) => {
    setActiveCategory(category);
    const allItems = await CustomItem.list();
    const categoryItems = allItems.filter(item => !item.is_category && item.parent_id === category.id);
    setItems(categoryItems);
  };

  const handleItemClick = (item) => {
    onAddToCart({
      product_name: item.item_name,
      upc_code: `CUSTOM-${item.id}`,
      cash_price: item.price,
      is_custom_item: true,
      tax_rate: item.tax_rate || 0,
    });
  };

  const handleSaveItem = async (itemData) => {
    try {
      if (editingItem) {
        await CustomItem.update(editingItem.id, itemData);
      } else {
        await CustomItem.create(itemData);
      }
      setEditingItem(null);
      setShowManager(false);
      await loadItems();
      // Re-select the active category to refresh items list
      if (activeCategory) {
          handleCategoryClick(activeCategory);
      }
    } catch (error) {
        console.error("Failed to save custom item:", error);
        alert("Error saving item. Please try again.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await CustomItem.delete(itemId);
      await loadItems();
       if (activeCategory) {
          handleCategoryClick(activeCategory);
      }
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Custom & Quick Items</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-2">
        <div className="flex-shrink-0 flex gap-1 mb-2 border-b pb-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory?.id === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryClick(cat)}
            >
              {cat.item_name}
            </Button>
          ))}
           <Button variant="ghost" size="sm" onClick={() => { setEditingItem(null); setShowManager(true); }}><Edit className="w-4 h-4" /></Button>
        </div>
        <div className="flex-grow grid grid-cols-3 gap-2 overflow-y-auto">
          {items.map((item) => (
            <Button
              key={item.id}
              variant="secondary"
              className="h-20 text-wrap text-center"
              onClick={() => handleItemClick(item)}
            >
              {item.item_name}
            </Button>
          ))}
          {categories.length > 0 && items.length === 0 && (
            <div className="col-span-3 text-center text-gray-500 mt-8">
                <p>No items in this category.</p>
            </div>
          )}
           {categories.length === 0 && (
            <div className="col-span-3 text-center text-gray-500 mt-8">
                <p>No custom item categories configured.</p>
                <Button size="sm" variant="link" onClick={() => { setEditingItem(null); setShowManager(true); }}>Add a Category</Button>
            </div>
          )}
        </div>
      </CardContent>
      {showManager && (
        <ItemManagerDialog 
          item={editingItem} 
          categories={categories}
          onSave={handleSaveItem} 
          onDelete={handleDeleteItem}
          onClose={() => { setShowManager(false); setEditingItem(null); }} 
        />
      )}
    </Card>
  );
}

function ItemManagerDialog({ item, categories, onSave, onDelete, onClose }) {
  const [formData, setFormData] = useState(item || { item_name: '', is_category: false, price: 0, parent_id: categories[0]?.id || '' });
  
  const isNew = !item;

  const handleSubmit = () => {
    if(!formData.item_name){
        alert("Item Name is required");
        return;
    }
    onSave(formData);
  };
  
  return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNew ? 'Add' : 'Edit'} Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div>
              <label>Name</label>
              <Input value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} />
            </div>
             <div className="flex items-center gap-2">
                <input type="checkbox" id="is_category" checked={formData.is_category} onChange={e => setFormData({...formData, is_category: e.target.checked})}/>
                <label htmlFor="is_category">Is this a Category?</label>
            </div>
            {!formData.is_category && (
                <>
                <div>
                    <label>Price</label>
                    <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                    <label>Category</label>
                    <select className="w-full p-2 border rounded" value={formData.parent_id} onChange={e => setFormData({...formData, parent_id: e.target.value})}>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.item_name}</option>)}
                    </select>
                </div>
                </>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <div>
              {!isNew && <Button variant="destructive" onClick={() => onDelete(item.id)}><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSubmit}>Save Item</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}