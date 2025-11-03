import React, { useState, useEffect } from 'react';
import { InventoryItem } from '@/api/entities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';

export default function ProductSearch({ onAddToCart }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoading(true);
      try {
        // This is a simplified search. A real implementation might need a dedicated search endpoint.
        const allItems = await InventoryItem.list();
        const lowerCaseSearch = searchTerm.toLowerCase();
        const filtered = allItems.filter(item =>
          item.product_name.toLowerCase().includes(lowerCaseSearch) ||
          item.upc_code?.includes(lowerCaseSearch)
        ).slice(0, 50); // Limit results
        setResults(filtered);
      } catch (error) {
        console.error("Product search failed:", error);
      }
      setIsLoading(false);
    }, 300); // Debounce search

    return () => clearTimeout(handler);
  }, [searchTerm]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search for products by name or UPC..."
        className="pl-10"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-md shadow-lg max-h-60">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
            ) : results.length > 0 ? (
              results.map(item => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start p-2 h-auto"
                  onClick={() => {
                    onAddToCart(item);
                    setSearchTerm('');
                    setResults([]);
                  }}
                >
                  <div className="text-left">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-xs text-gray-500">UPC: {item.upc_code} | Price: ${item.cash_price?.toFixed(2)}</p>
                  </div>
                </Button>
              ))
            ) : (
               !isLoading && searchTerm.length > 1 && <div className="p-4 text-center text-sm text-gray-500">No products found.</div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}