
import React, { useState, useEffect } from "react";
import { Product } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Fuel,
  Plus,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  MapPin
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Import Alert components

import ProductTable from "../../products/ProductTable";
import AddProductModal from "../../products/AddProductModal";
import EditProductModal from "../../products/EditProductModal";

export default function ProductManager({ currentScope }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, [currentScope]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      let data;

      // Filter by currentScope
      if (currentScope?.type === 'location' && currentScope?.id) {
        data = await Product.filter({ location_id: currentScope.id }, "product_code");
      } else if (currentScope?.type === 'region' && currentScope?.id) {
        const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
        const regionLocationIds = locationsData
          .filter(loc => loc.region_id === currentScope.id)
          .map(loc => loc.id);

        const allProducts = await Product.list("product_code");
        data = allProducts.filter(p => regionLocationIds.includes(p.location_id));
      } else {
        data = await Product.list("product_code");
      }

      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]); // Clear products on error
    }
    setIsLoading(false);
  };

  const handleAddProduct = async (productData) => {
    // Add location_id if currentScope is a specific location
    const basePriceForCredit = productData.current_price || productData.self_service_cash_price || 0;

    const fullProductData = {
      ...productData,
      location_id: currentScope?.type === 'location' ? currentScope.id : productData.location_id,
      self_service_credit_price: basePriceForCredit,
      full_service_credit_price: basePriceForCredit + 0.1,
      full_service_cash_price: (basePriceForCredit + 0.1) * 0.97,
    };

    // Assuming self_service_cash_price is always 3% less than self_service_credit_price
    fullProductData.self_service_cash_price = basePriceForCredit * 0.97;

    await Product.create(fullProductData);
    setShowAddModal(false);
    loadProducts();
  };

  const handleEditProduct = async (productData) => {
    await Product.update(editingProduct.id, productData);
    setEditingProduct(null);
    loadProducts();
  };

  const averagePrice = products.length > 0
    ? products.reduce((sum, p) => sum + (p.self_service_credit_price || 0), 0) / products.length
    : 0;

  const totalInventoryValue = products.reduce((sum, p) =>
    sum + ((p.inventory_gallons || 0) * (p.cost || 0)), 0
  );

  return (
    <div className="space-y-6">
      {/* Location Context Indicator */}
      {currentScope && (
        <Alert className="bg-blue-50 border-blue-200">
          <MapPin className="w-4 h-4 text-blue-600" />
          <AlertDescription>
            <strong>Viewing products for:</strong> {currentScope.label}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Fuel Products & Pricing</h2>
            <p className="text-gray-500">Manage all fuel products and pricing.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Fuel Product
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
                <Fuel className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-sm text-gray-500">Total Products</p>
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
                <DollarSign className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">${averagePrice.toFixed(3)}</p>
                  <p className="text-sm text-gray-500">Average Price (SS Credit)</p>
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">${totalInventoryValue.toFixed(0)}</p>
                  <p className="text-sm text-gray-500">Inventory Value</p>
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {products.filter(p => (p.inventory_gallons || 0) < (p.low_inventory_threshold || 0)).length}
                  </p>
                  <p className="text-sm text-gray-500">Low Inventory</p>
                </div>
            </CardContent>
          </Card>
        </div>

        <ProductTable
          products={products}
          isLoading={isLoading}
          onEdit={setEditingProduct}
          onRefresh={loadProducts}
        />

        {showAddModal && <AddProductModal onAdd={handleAddProduct} onClose={() => setShowAddModal(false)} />}
        {editingProduct && <EditProductModal product={editingProduct} onEdit={handleEditProduct} onClose={() => setEditingProduct(null)} />}
    </div>
  );
}
