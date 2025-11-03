
import React, { useState, useEffect, useCallback } from 'react';
import { Supplier } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2 } from "lucide-react";
import AddSupplierModal from "../../suppliers/AddSupplierModal";
import SupplierDetailView from "../../suppliers/SupplierDetailView";

export default function SupplierManager() {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const supplierData = await Supplier.list("supplier_name");
      setSuppliers(supplierData);
      // This part of the logic needs to be careful not to create loops.
      // We check if there's no selected supplier *at all* before setting a default.
      if (supplierData.length > 0) {
        setSelectedSupplier(currentSelected => currentSelected ? currentSelected : supplierData[0]);
      }
    } catch (error) {
      console.error("Error loading supplier data:", error);
    }
    setIsLoading(false);
  }, []); // Empty dependency array is correct as it has no external dependencies

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const filtered = suppliers.filter(s =>
      s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.supplier_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSuppliers(filtered);
  }, [searchTerm, suppliers]);

  const handleAddSupplier = async (supplierData) => {
    const newSupplier = await Supplier.create(supplierData);
    setShowAddModal(false);
    await loadData();
    setSelectedSupplier(newSupplier);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Supplier Configuration</h2>
          <p className="text-gray-500">Manage vendors, procurement, and connectivity.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Supplier List */}
        <Card className="md:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 /> Suppliers</CardTitle>
            <div className="relative pt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto space-y-2">
            {isLoading ? <p>Loading...</p> : (
              filteredSuppliers.map(supplier => (
                <Button
                  key={supplier.id}
                  variant={selectedSupplier?.id === supplier.id ? "default" : "outline"}
                  className="w-full justify-start text-left h-auto"
                  onClick={() => setSelectedSupplier(supplier)}
                >
                  <div>
                    <p className="font-semibold">{supplier.supplier_name}</p>
                    <p className="text-xs text-muted-foreground">{supplier.supplier_code}</p>
                  </div>
                </Button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Supplier Detail View */}
        <div className="md:col-span-2 overflow-y-auto">
          {selectedSupplier ? (
            <SupplierDetailView supplierId={selectedSupplier.id} key={selectedSupplier.id} />
          ) : (
            <Card className="flex items-center justify-center h-full">
              <div className="text-center">
                <Building2 className="w-16 h-16 mx-auto text-gray-300" />
                <p className="mt-4 text-gray-500">Select a supplier to see details</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddSupplierModal
          onAdd={handleAddSupplier}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
