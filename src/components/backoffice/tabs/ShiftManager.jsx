
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shift } from "@/api/entities";
import { User } from "@/api/entities";
import { Clock, DollarSign, CheckCircle, AlertCircle, Eye, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import ShiftReconciliation from '../../shifts/ShiftReconciliation';

export default function ShiftManager({ currentScope }) {
  const [shifts, setShifts] = useState([]);
  const [filteredShifts, setFilteredShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadShifts();
  }, [currentScope]); // Added currentScope to dependencies

  useEffect(() => {
    filterShifts();
  }, [dateFilter, statusFilter, shifts]);

  const loadShifts = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Load shifts based on currentScope
      let shiftData;
      
      if (!currentScope || currentScope.type === 'location') {
        // Single location view
        const locationId = currentScope?.id || user.assigned_location_id;
        if (locationId) {
          shiftData = await Shift.filter({ location_id: locationId }, '-start_time', 100);
        } else {
          // If no specific location is provided or derived, load all shifts (e.g., for an admin in 'all locations' view)
          shiftData = await Shift.list('-start_time', 100);
        }
      } else if (currentScope.type === 'region') {
        // Region view - load all locations in region
        const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
        const regionLocationIds = locationsData
          .filter(loc => loc.region_id === currentScope.id)
          .map(loc => loc.id);
        
        // Fetch a larger set of shifts and then filter them by region location IDs
        const allShifts = await Shift.list('-start_time', 500); // Increased limit for regional view
        shiftData = allShifts.filter(s => regionLocationIds.includes(s.location_id));
      } else {
        // Enterprise view - all shifts (e.g., currentScope.type === 'enterprise')
        shiftData = await Shift.list('-start_time', 500); // Increased limit for enterprise view
      }

      setShifts(shiftData);
      setFilteredShifts(shiftData);
    } catch (error) {
      console.error('Error loading shifts:', error);
      // Optionally, set an error state to display to the user
    } finally {
      setIsLoading(false);
    }
  };

  const filterShifts = () => {
    let filtered = [...shifts];

    if (dateFilter) {
      filtered = filtered.filter(shift => {
        const shiftDate = format(new Date(shift.start_time), 'yyyy-MM-dd');
        return shiftDate === dateFilter;
      });
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'unreconciled') {
        filtered = filtered.filter(s => s.status === 'completed' && !s.reconciled);
      } else if (statusFilter === 'reconciled') {
        filtered = filtered.filter(s => s.reconciled);
      } else {
        filtered = filtered.filter(s => s.status === statusFilter);
      }
    }

    setFilteredShifts(filtered);
  };

  const canReconcile = () => {
    return currentUser && ['admin', 'store_manager', 'regional_manager', 'corporate_manager'].includes(currentUser.role);
  };

  const getVarianceColor = (variance) => {
    if (Math.abs(variance) <= 0.01) return 'text-green-600';
    if (Math.abs(variance) <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Loading shifts...</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedShift) {
    return (
      <ShiftReconciliation
        shift={selectedShift}
        onClose={() => setSelectedShift(null)}
        onReconciled={loadShifts}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Context Indicator */}
      {currentScope && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Viewing shifts for:</strong> {currentScope.label}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Shift Management
            </span>
            <Badge>{filteredShifts.length} Shifts</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="date_filter">Filter by Date</Label>
              <Input
                id="date_filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="status_filter">Status</Label>
              <select
                id="status_filter"
                className="w-full p-2 border rounded"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Shifts</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="unreconciled">Needs Reconciliation</option>
                <option value="reconciled">Reconciled</option>
              </select>
            </div>
            <Button variant="outline" onClick={() => { setDateFilter(''); setStatusFilter('all'); }}>
              Clear Filters
            </Button>
            <Button onClick={loadShifts}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shifts Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {shifts.filter(s => s.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Active Shifts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {shifts.filter(s => s.status === 'completed' && !s.reconciled).length}
              </p>
              <p className="text-sm text-gray-600">Needs Reconciliation</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {shifts.filter(s => s.reconciled).length}
              </p>
              <p className="text-sm text-gray-600">Reconciled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                ${shifts.filter(s => s.status === 'completed').reduce((sum, s) => sum + (s.total_sales || 0), 0).toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">Total Sales</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shifts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Shift ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Terminal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Start Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cash Variance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm">{shift.shift_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{shift.employee_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{shift.terminal_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        {format(new Date(shift.start_time), 'MMM d, h:mm a')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={shift.status === 'active' ? 'default' : 'secondary'}>
                          {shift.status}
                        </Badge>
                        {shift.status === 'completed' && (
                          <Badge variant={shift.reconciled ? 'default' : 'destructive'}>
                            {shift.reconciled ? (
                              <><CheckCircle className="w-3 h-3 mr-1" />Reconciled</>
                            ) : (
                              <><AlertCircle className="w-3 h-3 mr-1" />Pending</>
                            )}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {shift.cash_variance !== undefined && shift.cash_variance !== null ? (
                        <span className={`font-bold ${getVarianceColor(shift.cash_variance)}`}>
                          {shift.cash_variance >= 0 ? '+' : ''}${shift.cash_variance.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {shift.status === 'completed' && canReconcile() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedShift(shift)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {shift.reconciled ? 'View' : 'Reconcile'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
