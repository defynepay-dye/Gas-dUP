
import React, { useState, useEffect } from "react";
import { InventoryItem, SupplierProduct, Supplier } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Search,
  AlertTriangle,
  Truck as TruckIcon,
  Calculator,
  List,
  Map,
  ListTodo,
  TrendingUp,
  Copy,
  Trash2,
  Edit,
  Printer,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  DollarSign,
  ShoppingCart,
  Upload
} from "lucide-react";

import InventoryReceivingModal from "../../inventory/InventoryReceiving";
import ProfitabilityAnalysis from "../../inventory/ProfitabilityAnalysis";
import PlanogramManager from "../../inventory/PlanogramManager";
import RestockingTasks from "../../inventory/RestockingTasks";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import EditProductModal from "../../inventory/EditProductModal";
import CopyToLocationModal from '../../inventory/CopyToLocationModal';
import BulkPriceUpdateModal from '../../inventory/BulkPriceUpdateModal';
import LabelPrintingModal from '../../inventory/LabelPrintingModal';
import VendorPricingModal from '../../inventory/VendorPricingModal';
import UniversalProductImporter from '../../inventory/UniversalProductImporter';
import PackStructureEditor from "../../inventory/PackStructureEditor";
import ProductMasterManager from '../../inventory/ProductMasterManager';
import ProductFamilyPricingManager from '../../inventory/ProductFamilyPricingManager'; // NEW IMPORT

function AgeVerificationManager({ categories, onToggle }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Age Restriction by Category</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-500">Enable age verification for all items within a category.</p>
        {categories.filter((c) => ['alcohol', 'tobacco', 'lottery'].includes(c)).map((category) =>
        <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Label htmlFor={`age-restrict-${category}`} className="capitalize">{category.replace('_', ' ')}</Label>
            <Button size="sm" onClick={() => onToggle(category, true)}>Enable for all</Button>
          </div>
        )}
      </CardContent>
    </Card>);

}

function MasterInventoryList({ refreshTrigger = 0 }) { // Added refreshTrigger prop
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  // Removed showReceiving, setShowReceiving - now a top-level tab
  const [showProfitability, setShowProfitability] = useState(false); // Profitability remains a modal
  const [editingItem, setEditingItem] = useState(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [itemToCopy, setItemToCopy] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  // Removed showLabelPrinting, setSelectedForLabels - now a top-level tab
  // Removed showImporter, setShowImporter - now a top-level tab
  
  // Drill-down and sorting states
  const [activeFilter, setActiveFilter] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'product_name', direction: 'asc' });
  const [showVendorPricing, setShowVendorPricing] = useState(false);
  const [selectedItemForPricing, setSelectedItemForPricing] = useState(null);
  // NEW: State for PackStructureEditor
  const [editingPackStructure, setEditingPackStructure] = useState(null);

  useEffect(() => {
    loadInventory();
  }, [refreshTrigger]); // Reload inventory when refreshTrigger changes

  const loadInventory = async () => {
    setIsLoading(true);
    const data = await InventoryItem.list("product_name");
    setInventory(data);
    setIsLoading(false);
  };

  const filterInventory = () => {
    let filtered = [...inventory];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.upc_code?.includes(searchTerm) ||
        item.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }
    
    // Apply drill-down filter
    if (activeFilter === 'low_stock') {
      filtered = filtered.filter((item) =>
        (item.inventory_tracking?.quantity_on_hand_singles || 0) <= item.reorder_level && item.active
      );
    } else if (activeFilter === 'age_restricted') {
      filtered = filtered.filter((item) => item.compliance_flags?.age_restricted);
    } else if (activeFilter === 'all') {
      // Show all active items
      filtered = filtered.filter((item) => item.active);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal, bVal;
        
        switch(sortConfig.key) {
          case 'product_name':
            aVal = a.product_name?.toLowerCase() || '';
            bVal = b.product_name?.toLowerCase() || '';
            break;
          case 'category':
            aVal = a.category?.toLowerCase() || '';
            bVal = b.category?.toLowerCase() || '';
            break;
          case 'upc_code':
            aVal = a.upc_code || '';
            bVal = b.upc_code || '';
            break;
          case 'stock':
            aVal = a.inventory_tracking?.quantity_on_hand_singles || 0;
            bVal = b.inventory_tracking?.quantity_on_hand_singles || 0;
            break;
          case 'vendor':
            aVal = a.vendor?.toLowerCase() || '';
            bVal = b.vendor?.toLowerCase() || '';
            break;
          case 'price':
            aVal = a.selling_units?.[0]?.unit_price || 0;
            bVal = b.selling_units?.[0]?.unit_price || 0;
            break;
          default:
            return 0;
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    setFilteredInventory(filtered);
  };

  useEffect(() => {
    filterInventory();
  }, [inventory, searchTerm, categoryFilter, activeFilter, sortConfig]);

  // Handle metric card click for drill-down
  const handleMetricClick = (filterType) => {
    if (activeFilter === filterType) {
      setActiveFilter(null); // Toggle off
    } else {
      setActiveFilter(filterType);
    }
  };

  // Handle column sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sort icon for column
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-30" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 inline text-blue-600" />
      : <ArrowDown className="w-3 h-3 ml-1 inline text-blue-600" />;
  };

  // Generate PO from low stock items
  const handleGeneratePO = () => {
    const lowStockItems = filteredInventory.filter((item) =>
      (item.inventory_tracking?.quantity_on_hand_singles || 0) <= item.reorder_level
    );
    
    if (lowStockItems.length === 0) {
      alert('No low stock items to order');
      return;
    }
    
    // Group by vendor
    const byVendor = lowStockItems.reduce((acc, item) => {
      const vendor = item.vendor || 'Unknown';
      if (!acc[vendor]) acc[vendor] = [];
      acc[vendor].push(item);
      return acc;
    }, {});
    
    alert(`Ready to create PO for ${lowStockItems.length} items across ${Object.keys(byVendor).length} vendors.\n\nVendors: ${Object.keys(byVendor).join(', ')}`);
  };

  // View vendor pricing comparison
  const handleViewPricing = (item) => {
    setSelectedItemForPricing(item);
    setShowVendorPricing(true);
  };

  const handleEditProduct = async () => {
    setEditingItem(null);
    loadInventory();
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await InventoryItem.delete(itemId);
      loadInventory();
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
  };

  const handleCopyToLocation = (item) => {
    setItemToCopy(item);
    setShowCopyModal(true);
  };

  const lowStockItems = inventory.filter((item) =>
    (item.inventory_tracking?.quantity_on_hand_singles || 0) <= item.reorder_level && item.active
  );
  const categories = [...new Set(inventory.map((item) => item.category))];

  const handleToggleAgeRestriction = async (category, shouldBeRestricted) => {
    if (!window.confirm(`Are you sure you want to ${shouldBeRestricted ? 'enable' : 'disable'} age restriction for all items in the "${category}" category?`)) {
      return;
    }

    setIsLoading(true);
    try {
      // Find all items in this category that need updating
      // Only update if the current state of age_restricted is different from the target state
      const itemsToUpdate = inventory.filter((item) =>
        item.category === category &&
        !!item.compliance_flags?.age_restricted !== shouldBeRestricted
      );
      
      if (itemsToUpdate.length === 0) {
        alert(`No items in "${category}" category require this update.`);
        return;
      }

      // Update each item in the database
      const updatePromises = itemsToUpdate.map((item) =>
        InventoryItem.update(item.id, { 
          compliance_flags: {
            ...(item.compliance_flags || {}), 
            age_restricted: shouldBeRestricted
          }
        })
      );

      await Promise.all(updatePromises);
      
      // Reload inventory from database to reflect changes
      await loadInventory();
      
      alert(`Successfully updated ${itemsToUpdate.length} items in the "${category}" category.`);
    } catch (error) {
      console.error('Failed to update age restrictions:', error);
      alert('Failed to update age restrictions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectItem = (itemId, isChecked) => {
    if (isChecked) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleSelectAllItems = (isChecked) => {
    if (isChecked) {
      setSelectedItems(filteredInventory.map((item) => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  // Removed handlePrintLabels - now handled by top-level tab
  // Removed handleSendToPrinter - now handled by top-level tab (or LabelPrintingModal itself)
  
  const isAllSelected = filteredInventory.length > 0 && selectedItems.length === filteredInventory.length;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < filteredInventory.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Store Inventory List</h2>
          <p className="text-gray-500">Unified inventory management for all products—tobacco, lottery, general merchandise.</p>
          {activeFilter && (
            <div className="mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setActiveFilter(null)}
                className="text-xs"
              >
                Clear Filter ({activeFilter.replace('_', ' ')})
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          {/* Removed Import Products Button - now a top-level tab */}
          {/* Removed Receive Stock Button - now a top-level tab */}
          <Button onClick={() => setShowProfitability(true)} variant="outline" className="bg-green-600 text-white hover:bg-green-700">
            <Calculator className="w-4 h-4 mr-2" />
            Profitability
          </Button>
          <Button variant="outline" onClick={() => setShowBulkPriceModal(true)}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Bulk Price Update
          </Button>
          {/* Removed Print Labels Button - now a top-level tab */}
          {activeFilter === 'low_stock' && lowStockItems.length > 0 && (
            <Button onClick={handleGeneratePO} className="bg-orange-600 hover:bg-orange-700">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Generate PO ({lowStockItems.length} items)
            </Button>
          )}
        </div>
      </div>

      {/* Interactive Metric Cards with Drill-Down */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${activeFilter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => handleMetricClick('all')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <Package className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{inventory.length}</p>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-xs text-blue-600 mt-1">Click to view all</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${activeFilter === 'low_stock' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => handleMetricClick('low_stock')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
              <p className="text-sm text-gray-500">Low Stock Items</p>
              <p className="text-xs text-red-600 mt-1">Click to view & order</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-all hover:shadow-lg">
          <CardContent className="p-6 flex items-center gap-4">
            <TruckIcon className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">
                ${inventory.reduce((sum, item) => sum + (item.inventory_tracking?.quantity_on_hand_singles || 0) * (item.inventory_tracking?.weighted_average_cost || 0), 0).toFixed(0)}
              </p>
              <p className="text-sm text-gray-500">Inventory Value</p>
              <p className="text-xs text-green-600 mt-1">Total cost basis</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${activeFilter === 'age_restricted' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => handleMetricClick('age_restricted')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">
                {inventory.filter((item) => item.compliance_flags?.age_restricted).length}
              </p>
              <p className="text-sm text-gray-500">Age Restricted Items</p>
              <p className="text-xs text-yellow-600 mt-1">Click to view compliance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products by name, UPC, or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant={categoryFilter === "all" ? "default" : "outline"} onClick={() => setCategoryFilter("all")}>All</Button>
              {categories.slice(0, 5).map((category) =>
                <Button key={category} size="sm" variant={categoryFilter === category ? "default" : "outline"} onClick={() => setCategoryFilter(category)} className="capitalize">
                  {category.replace('_', ' ')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Sortable Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="p-4">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAllItems(e.target.checked)}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                />
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('product_name')}
              >
                Product Name {getSortIcon('product_name')}
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('category')}
              >
                Category {getSortIcon('category')}
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('upc_code')}
              >
                UPC {getSortIcon('upc_code')}
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('price')}
              >
                Price {getSortIcon('price')}
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('stock')}
              >
                Stock (Singles) {getSortIcon('stock')}
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('vendor')}
              >
                Vendor {getSortIcon('vendor')}
              </th>
              <th scope="col" className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8" className="text-center py-4">Loading inventory...</td>
              </tr>
            ) : filteredInventory.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4">No products found.</td>
              </tr>
            ) : (
              filteredInventory.map((item) => (
                <tr key={item._id} className="bg-white border-b hover:bg-gray-50">
                  <td className="w-4 p-4">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                      checked={selectedItems.includes(item._id)}
                      onChange={(e) => handleSelectItem(item._id, e.target.checked)}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {item.product_name}
                    {item.compliance_flags?.age_restricted &&
                      <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-red-100 text-red-800">Age Rest.</span>
                    }
                  </td>
                  <td className="px-4 py-3 capitalize">{item.category?.replace('_', ' ')}</td>
                  <td className="px-4 py-3">{item.upc_code}</td>
                  <td className="px-4 py-3">${item.selling_units?.[0]?.unit_price?.toFixed(2) || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`${(item.inventory_tracking?.quantity_on_hand_singles || 0) <= item.reorder_level ? 'text-red-600 font-semibold' : ''}`}>
                      {item.inventory_tracking?.quantity_on_hand_singles || 0}
                    </span>
                    {(item.inventory_tracking?.quantity_on_hand_singles || 0) <= item.reorder_level && (
                      <span className="ml-2 text-xs text-red-600">(Low)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{item.vendor}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleViewPricing(item)}>
                        <DollarSign className="w-3 h-3 mr-1" />
                        Pricing
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCopyToLocation(item)}>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      {/* Removed Print Labels Button for individual item - now a top-level tab */}
                      {/* NEW: Pack Structure Button */}
                      <Button size="sm" variant="outline" onClick={() => setEditingPackStructure(item)}>
                        <Package className="w-3 h-3 mr-1" />
                        Pack
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(item._id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AgeVerificationManager categories={categories} onToggle={handleToggleAgeRestriction} />

      {/* Removed UniversalProductImporter modal JSX - now a top-level tab */}
      {showProfitability && <ProfitabilityAnalysis inventory={inventory} onClose={() => setShowProfitability(false)} />}
      {editingItem && <EditProductModal item={editingItem} onSave={handleEditProduct} onClose={() => setEditingItem(null)} />}

      {showCopyModal && itemToCopy && (
        <CopyToLocationModal
          item={itemToCopy}
          onComplete={() => {
            setShowCopyModal(false);
            setItemToCopy(null);
            loadInventory();
          }}
          onClose={() => {
            setShowCopyModal(false);
            setItemToCopy(null);
          }}
        />
      )}

      {showBulkPriceModal && (
        <BulkPriceUpdateModal
          allInventory={inventory}
          categories={categories}
          onComplete={() => {
            setShowBulkPriceModal(false);
            loadInventory();
          }}
          onClose={() => setShowBulkPriceModal(false)}
        />
      )}

      {/* Removed LabelPrintingModal modal JSX - now a top-level tab */}

      {showVendorPricing && selectedItemForPricing && (
        <VendorPricingModal
          item={selectedItemForPricing}
          onClose={() => {
            setShowVendorPricing(false);
            setSelectedItemForPricing(null);
          }}
        />
      )}

      {/* NEW: PackStructureEditor Modal */}
      {editingPackStructure && (
        <PackStructureEditor
          item={editingPackStructure}
          onClose={() => setEditingPackStructure(null)}
          onSave={() => {
            setEditingPackStructure(null);
            loadInventory();
          }}
        />
      )}
    </div>
  );
}

export default function InventoryManager() {
  const [activeSubTab, setActiveSubTab] = useState("list");
  const [currentLocationId] = useState("LOC001"); // Placeholder, in a real app this might come from context or props
  const [refreshListTrigger, setRefreshListTrigger] = useState(0);

  const handleListRefresh = () => {
    setRefreshListTrigger(prev => prev + 1);
  };

  // Dummy print handler for the Label Printing tab as items are not selected in this context
  const handleSendToPrinter = async (printJobs) => {
    try {
      alert(`Print job created!\n\nPrinting ${printJobs.length} label(s) across ${printJobs[0].quantity} copies each.\n\nTotal labels: ${printJobs.length * printJobs[0].quantity}\n\nLabels will be sent to the configured label printer.`);
      // No need to clear selected items here as selection is handled within MasterInventoryList
    } catch (error) {
      console.error('Print error:', error);
      alert('Failed to send labels to printer. Please check printer connection.');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-5"> {/* Adjusted grid-cols to 5 */}
          <TabsTrigger value="list"><List className="w-4 h-4 mr-2" /> Inventory List</TabsTrigger>
          <TabsTrigger value="receiving"><TruckIcon className="w-4 h-4 mr-2" /> Receiving</TabsTrigger>
          <TabsTrigger value="families"><Package className="w-4 h-4 mr-2" /> Product Families</TabsTrigger>
          <TabsTrigger value="labels"><Printer className="w-4 h-4 mr-2" /> Label Printing</TabsTrigger>
          <TabsTrigger value="importer"><Upload className="w-4 h-4 mr-2" /> Product Importer</TabsTrigger>
          {/* Removed Universal Catalog, Planogram, Restocking Tasks tabs as per outline */}
        </TabsList>
        
        <TabsContent value="list" className="mt-4">
          <MasterInventoryList refreshTrigger={refreshListTrigger} />
        </TabsContent>
        <TabsContent value="receiving" className="mt-4">
          <InventoryReceivingModal 
            onClose={() => setActiveSubTab("list")} // Navigate back to list after closing/action
            onRefresh={handleListRefresh} 
          />
        </TabsContent>
        <TabsContent value="families" className="mt-4">
          <ProductFamilyPricingManager locationId={currentLocationId} />
        </TabsContent>
        <TabsContent value="labels" className="mt-4">
          {/* LabelPrintingModal here will not receive pre-selected items from MasterInventoryList directly. 
              It would need to implement its own item selection or fetch items within this tab context.
              For now, it's rendered with an empty items array and a placeholder print handler. */}
          <LabelPrintingModal 
            items={[]} // Items need to be selected within this component or passed from a shared state
            onClose={() => setActiveSubTab("list")} 
            onPrint={handleSendToPrinter} // Using the dummy handler defined above
          />
        </TabsContent>
        <TabsContent value="importer" className="mt-4">
          <UniversalProductImporter
            onImportComplete={handleListRefresh}
            onClose={() => setActiveSubTab("list")} // Navigate back to list after closing/action
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
