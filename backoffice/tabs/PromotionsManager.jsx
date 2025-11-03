
import React, { useState, useEffect } from 'react';
import { MixMatchPromotion } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Gift, Edit, Trash2, Calendar, Tag, MapPin } from "lucide-react";
import { format } from "date-fns";
import AddPromotionModal from "../../promotions/AddPromotionModal";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PromotionsManager({ currentScope }) {
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  useEffect(() => {
    loadPromotions();
  }, [currentScope]);

  const loadPromotions = async () => {
    setIsLoading(true);
    try {
      let data;
      
      // Filter by currentScope
      if (currentScope?.type === 'location' && currentScope?.id) {
        data = await MixMatchPromotion.filter({ location_id: currentScope.id });
      } else if (currentScope?.type === 'region' && currentScope?.id) {
        const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
        const regionLocationIds = locationsData
          .filter(loc => loc.region_id === currentScope.id)
          .map(loc => loc.id);
        
        const allPromotions = await MixMatchPromotion.list();
        data = allPromotions.filter(p => 
          !p.location_id || regionLocationIds.includes(p.location_id)
        );
      } else {
        data = await MixMatchPromotion.list();
      }
      
      setPromotions(data);
    } catch (error) {
      console.error("Failed to load promotions:", error);
      setPromotions([]);
    }
    setIsLoading(false);
  };

  const handleSave = async (promoData) => {
    try {
      if (editingPromotion) {
        // Update operation
        await MixMatchPromotion.update(editingPromotion.id, promoData);
      } else {
        // Create operation
        const fullData = {
          ...promoData,
          // If currentScope is a location, force the location_id to that scope's ID
          // Otherwise, use the location_id provided by the form (or null/undefined)
          location_id: currentScope?.type === 'location' ? currentScope.id : promoData.location_id
        };
        await MixMatchPromotion.create(fullData);
      }
      loadPromotions();
      setShowAddModal(false);
      setEditingPromotion(null);
    } catch (error) {
      console.error("Failed to save promotion:", error);
      alert("Error saving promotion. Check console for details.");
    }
  };

  const handleDelete = async (promoId) => {
    if (window.confirm("Are you sure you want to delete this promotion?")) {
      try {
        await MixMatchPromotion.delete(promoId);
        loadPromotions();
      } catch (error) {
        console.error("Failed to delete promotion:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Context Indicator */}
      {currentScope && (
        <Alert className="bg-blue-50 border-blue-200">
          <MapPin className="w-4 h-4 text-blue-600" />
          <AlertDescription>
            <strong>Viewing promotions for:</strong> {currentScope.label}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Mix & Match Promotions</h2>
          <p className="text-gray-600">Create and manage CONEXXUS-compliant promotional deals.</p>
        </div>
        <Button onClick={() => { setEditingPromotion(null); setShowAddModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active & Upcoming Promotions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading promotions...</p>
          ) : (
            <div className="space-y-4">
              {promotions.map(promo => (
                <div key={promo.id} className="p-4 border rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{promo.promotion_name}</h3>
                    <p className="text-sm text-gray-500">Code: {promo.promotion_code}</p>
                    <div className="flex items-center gap-4 text-sm mt-2">
                       <span className="flex items-center gap-1"><Tag className="w-4 h-4" /> {promo.deal_structure.quantity_required} for ${promo.deal_structure.deal_price.toFixed(2)}</span>
                       <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(promo.start_date), 'MM/dd/yy')} - {format(new Date(promo.end_date), 'MM/dd/yy')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingPromotion(promo); setShowAddModal(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(promo.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {promotions.length === 0 && <p className="text-center text-gray-500 py-8">No promotions found. Create one to get started!</p>}
            </div>
          )}
        </CardContent>
      </Card>
      
      {showAddModal && (
        <AddPromotionModal 
          promotion={editingPromotion}
          onSave={handleSave}
          onClose={() => { setShowAddModal(false); setEditingPromotion(null); }}
        />
      )}
    </div>
  );
}
