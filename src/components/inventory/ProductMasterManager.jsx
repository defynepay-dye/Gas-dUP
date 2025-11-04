import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { base44 } from '@/api/base44Client';
import { 
  Plus, Search, Edit, Trash2, Store, CheckCircle, 
  AlertTriangle, Sparkles, Package, Loader2 
} from 'lucide-react';
import AIUPCLookup from './AIUPCLookup';

export default function ProductMasterManager() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, products]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.ProductMaster.list('product_name');
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading ProductMaster:', error);
      setProducts([]);
    }
    setIsLoading(false);
  };

  const filterProducts = () => {
    if (!searchTerm) {
      setFilteredProducts(products);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = products.filter(p =>
      p.product_name?.toLowerCase().includes(term) ||
      p.upc_code?.includes(term) ||
      p.brand?.toLowerCase().includes(term) ||
      p.manufacturer?.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product from the Master Catalog? This will NOT delete location-specific inventory items.')) {
      return;
    }

    try {
      await base44.entities.ProductMaster.delete(productId);
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Universal Product Catalog</h2>
          <p className="text-gray-500">Master pricebook for all locations</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Product with AI
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Package className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-sm text-gray-500">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Sparkles className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.ai_enrichment_metadata?.source === 'ai_lookup').length}
                </p>
                <p className="text-sm text-gray-500">AI-Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {products.filter(p => p.ai_enrichment_metadata?.verified_by_user).length}
                </p>
                <p className="text-sm text-gray-500">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Store className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {products.reduce((sum, p) => sum + (p.usage_stats?.locations_using || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Total Uses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by product name, UPC, brand, or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading products...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-600 mb-2">No products found</p>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm ? 'Try a different search term' : 'Start by adding products to your master catalog'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3">Product</th>
                <th scope="col" className="px-4 py-3">UPC</th>
                <th scope="col" className="px-4 py-3">Category</th>
                <th scope="col" className="px-4 py-3">Price</th>
                <th scope="col" className="px-4 py-3">Cost</th>
                <th scope="col" className="px-4 py-3">Source</th>
                <th scope="col" className="px-4 py-3">Usage</th>
                <th scope="col" className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.product_name}
                          className="w-10 h-10 object-cover rounded"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.product_name}</p>
                        {product.brand && <p className="text-xs text-gray-500">{product.brand}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{product.upc_code}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="capitalize">
                      {product.category?.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    ${product.default_cash_price?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    ${product.default_cost?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    {product.ai_enrichment_metadata?.source === 'ai_lookup' ? (
                      <Badge className="bg-purple-100 text-purple-800">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    ) : (
                      <Badge variant="outline">Manual</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs">
                      {product.usage_stats?.locations_using || 0} locations
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Product to Master Catalog</DialogTitle>
            </DialogHeader>
            <AIUPCLookup
              onProductCreated={() => {
                setShowAddModal(false);
                loadProducts();
              }}
              onClose={() => setShowAddModal(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}