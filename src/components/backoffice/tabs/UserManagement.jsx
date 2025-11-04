
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Shield, DollarSign } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    loadUsers();
    loadLocations();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const usersData = await base44.entities.User.list();
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
    setIsLoading(false);
  };

  const loadLocations = async () => {
    try {
      const locationsData = await base44.entities.Location.list();
      setLocations(locationsData);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await base44.entities.User.delete(userId);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User & Role Management</h2>
        <p className="text-gray-600">Configure user roles, permissions, and access across all locations.</p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={() => setShowAddUser(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : (
        <div className="grid gap-4">
          {users.map(user => (
            <Card key={user.id}>
              <CardContent className="flex justify-between items-center p-4">
                <div>
                  <h3 className="font-semibold">{user.full_name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge>{user.role}</Badge>
                    {user.employee_purchase_settings?.allow_purchases_on_credit && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Credit: ${user.employee_purchase_settings?.credit_limit || 0}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowEditUser(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowPermissions(true);
                    }}
                  >
                    <Shield className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onSuccess={loadUsers}
          locations={locations}
        />
      )}

      {showEditUser && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditUser(false);
            setSelectedUser(null);
          }}
          onSuccess={loadUsers}
          locations={locations}
        />
      )}

      {showPermissions && selectedUser && (
        <UserPermissionsModal
          user={selectedUser}
          onClose={() => {
            setShowPermissions(false);
            setSelectedUser(null);
          }}
          onSuccess={loadUsers}
        />
      )}
    </div>
  );
}

function AddUserModal({ onClose, onSuccess, locations }) {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    role: 'cashier',
    assigned_location_id: '',
    pin: '',
    employee_purchase_settings: {
      allow_purchases_on_credit: false,
      credit_limit: 0,
      current_payable_balance: 0,
      auto_deduct_from_payroll: true
    },
    permissions: {
      user_management: false,
      management_backoffice: false,
      monitor_clock: false,
      block_store_sales: false,
      block_inventory_items: false,
      block_shift_report: false,
      block_month_sales: false,
      block_daily_sales: false,
      block_annual_sales: false,
      block_maintenance_tools: false,
      block_payout_editing: false,
      allow_delete_sale_items: false,
      allow_price_change_dry_stock: false,
      block_product_search_pos: false,
      block_accumatica_adjustments: false,
      allow_fuel_delivery_confirmation: false,
      allow_customer_payments_only: false,
      pos_cashier: true,
      allow_unsettle_batch: false,
      read_only_customer_account: false,
      block_adding_inventory_items: false,
      restrict_settlement: false,
      restrict_add_edit_drops: false,
      dont_limit_adjustments: false,
      allow_price_change_wet_stock: false,
      allow_add_loyalty_points: false,
      allow_calibration: false,
      read_only_supplier: false,
      allow_closed: false
    }
  });

  const handleSubmit = async () => {
    if (!formData.username || !formData.full_name || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await base44.entities.User.create(formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="employee">Employee Settings</TabsTrigger>
            <TabsTrigger value="security">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="store_manager">Store Manager</SelectItem>
                    <SelectItem value="regional_manager">Regional Manager</SelectItem>
                    <SelectItem value="corporate_manager">Corporate Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Assigned Location</Label>
                <Select value={formData.assigned_location_id} onValueChange={(value) => setFormData({...formData, assigned_location_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.location_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="pin">4-Digit PIN</Label>
              <Input
                id="pin"
                maxLength={4}
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})}
                placeholder="Optional PIN for quick login"
              />
            </div>
          </TabsContent>

          <TabsContent value="employee" className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Employee Purchase on Credit Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Purchases on Credit</Label>
                    <p className="text-xs text-gray-600">
                      Employee can purchase items and deduct from payroll
                    </p>
                  </div>
                  <Switch
                    checked={formData.employee_purchase_settings.allow_purchases_on_credit}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      employee_purchase_settings: {
                        ...formData.employee_purchase_settings,
                        allow_purchases_on_credit: checked
                      }
                    })}
                  />
                </div>

                {formData.employee_purchase_settings.allow_purchases_on_credit && (
                  <>
                    <div>
                      <Label htmlFor="credit_limit">Credit Limit ($)</Label>
                      <Input
                        id="credit_limit"
                        type="number"
                        step="0.01"
                        value={formData.employee_purchase_settings.credit_limit}
                        onChange={(e) => setFormData({
                          ...formData,
                          employee_purchase_settings: {
                            ...formData.employee_purchase_settings,
                            credit_limit: parseFloat(e.target.value) || 0
                          }
                        })}
                        placeholder="e.g., 200.00"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Maximum amount employee can charge per pay period
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-Deduct from Payroll</Label>
                        <p className="text-xs text-gray-600">
                          Automatically deduct balance at end of pay period
                        </p>
                      </div>
                      <Switch
                        checked={formData.employee_purchase_settings.auto_deduct_from_payroll}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          employee_purchase_settings: {
                            ...formData.employee_purchase_settings,
                            auto_deduct_from_payroll: checked
                          }
                        })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Access Permissions</h4>
              
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto p-2 border rounded">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">User Management</Label>
                    <p className="text-xs text-gray-500">Can manage other users</p>
                  </div>
                  <Switch
                    checked={formData.permissions.user_management}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, user_management: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Back Office Access</Label>
                    <p className="text-xs text-gray-500">Access to management back office</p>
                  </div>
                  <Switch
                    checked={formData.permissions.management_backoffice}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, management_backoffice: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">POS Cashier</Label>
                    <p className="text-xs text-gray-500">Can operate POS terminal</p>
                  </div>
                  <Switch
                    checked={formData.permissions.pos_cashier}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, pos_cashier: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Monitor Clock</Label>
                    <p className="text-xs text-gray-500">View time clock entries</p>
                  </div>
                  <Switch
                    checked={formData.permissions.monitor_clock}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, monitor_clock: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Delete Sale Items</Label>
                    <p className="text-xs text-gray-500">Can remove items from transactions</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_delete_sale_items}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_delete_sale_items: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Price Change (Dry Stock)</Label>
                    <p className="text-xs text-gray-500">Can override prices for store items</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_price_change_dry_stock}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_price_change_dry_stock: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Price Change (Fuel)</Label>
                    <p className="text-xs text-gray-500">Can override fuel prices</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_price_change_wet_stock}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_price_change_wet_stock: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Fuel Delivery Confirmation</Label>
                    <p className="text-xs text-gray-500">Can confirm fuel deliveries</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_fuel_delivery_confirmation}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_fuel_delivery_confirmation: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Add Loyalty Points</Label>
                    <p className="text-xs text-gray-500">Can manually add loyalty points</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_add_loyalty_points}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_add_loyalty_points: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Calibration</Label>
                    <p className="text-xs text-gray-500">Can perform pump calibration</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_calibration}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_calibration: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Unsettle Batch</Label>
                    <p className="text-xs text-gray-500">Can unsettle payment batches</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_unsettle_batch}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_unsettle_batch: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Don't Limit Adjustments</Label>
                    <p className="text-xs text-gray-500">Unlimited adjustment authority</p>
                  </div>
                  <Switch
                    checked={formData.permissions.dont_limit_adjustments}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, dont_limit_adjustments: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Closed</Label>
                    <p className="text-xs text-gray-500">Can access after store closure</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_closed}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_closed: checked}
                    })}
                  />
                </div>

                <hr className="my-2" />
                <h5 className="font-semibold text-sm text-gray-700">Restrictions (Block Access)</h5>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Store Sales Access</Label>
                    <p className="text-xs text-gray-500">Cannot view store sales data</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_store_sales}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_store_sales: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Inventory Items</Label>
                    <p className="text-xs text-gray-500">Cannot view inventory</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_inventory_items}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_inventory_items: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Adding Inventory Items</Label>
                    <p className="text-xs text-gray-500">Cannot add new inventory</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_adding_inventory_items}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_adding_inventory_items: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Shift Report</Label>
                    <p className="text-xs text-gray-500">Cannot view shift reports</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_shift_report}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_shift_report: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Daily Sales</Label>
                    <p className="text-xs text-gray-500">Cannot view daily sales</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_daily_sales}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_daily_sales: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Month Sales</Label>
                    <p className="text-xs text-gray-500">Cannot view monthly sales</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_month_sales}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_month_sales: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Annual Sales</Label>
                    <p className="text-xs text-gray-500">Cannot view annual sales</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_annual_sales}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_annual_sales: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Maintenance Tools</Label>
                    <p className="text-xs text-gray-500">Cannot access maintenance tools</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_maintenance_tools}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_maintenance_tools: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Payout Editing</Label>
                    <p className="text-xs text-gray-500">Cannot edit payouts</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_payout_editing}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_payout_editing: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Product Search in POS</Label>
                    <p className="text-xs text-gray-500">Cannot search products at POS</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_product_search_pos}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_product_search_pos: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Restrict Settlement</Label>
                    <p className="text-xs text-gray-500">Cannot settle transactions</p>
                  </div>
                  <Switch
                    checked={formData.permissions.restrict_settlement}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, restrict_settlement: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Restrict Add/Edit Drops</Label>
                    <p className="text-xs text-gray-500">Cannot add or edit safe drops</p>
                  </div>
                  <Switch
                    checked={formData.permissions.restrict_add_edit_drops}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, restrict_add_edit_drops: checked}
                    })}
                  />
                </div>

                <hr className="my-2" />
                <h5 className="font-semibold text-sm text-gray-700">Read-Only Access</h5>

                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <div>
                    <Label className="font-medium text-yellow-700">Read-Only Customer Account</Label>
                    <p className="text-xs text-gray-500">Can view but not edit customer accounts</p>
                  </div>
                  <Switch
                    checked={formData.permissions.read_only_customer_account}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, read_only_customer_account: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <div>
                    <Label className="font-medium text-yellow-700">Read-Only Supplier</Label>
                    <p className="text-xs text-gray-500">Can view but not edit suppliers</p>
                  </div>
                  <Switch
                    checked={formData.permissions.read_only_supplier}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, read_only_supplier: checked}
                    })}
                  />
                </div>

                <hr className="my-2" />
                <h5 className="font-semibold text-sm text-gray-700">Special Permissions</h5>

                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div>
                    <Label className="font-medium text-blue-700">Customer Payments Only</Label>
                    <p className="text-xs text-gray-500">Can only process customer account payments</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_customer_payments_only}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_customer_payments_only: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div>
                    <Label className="font-medium text-blue-700">Block Accumatica Adjustments</Label>
                    <p className="text-xs text-gray-500">Cannot make accounting adjustments</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_accumatica_adjustments}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_accumatica_adjustments: checked}
                    })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Create User</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserModal({ user, onClose, onSuccess, locations }) {
  const [formData, setFormData] = useState({
    ...user,
    employee_purchase_settings: user.employee_purchase_settings || {
      allow_purchases_on_credit: false,
      credit_limit: 0,
      current_payable_balance: 0,
      auto_deduct_from_payroll: true
    },
    permissions: user.permissions || {
      user_management: false,
      management_backoffice: false,
      monitor_clock: false,
      block_store_sales: false,
      block_inventory_items: false,
      block_shift_report: false,
      block_month_sales: false,
      block_daily_sales: false,
      block_annual_sales: false,
      block_maintenance_tools: false,
      block_payout_editing: false,
      allow_delete_sale_items: false,
      allow_price_change_dry_stock: false,
      block_product_search_pos: false,
      block_accumatica_adjustments: false,
      allow_fuel_delivery_confirmation: false,
      allow_customer_payments_only: false,
      pos_cashier: true,
      allow_unsettle_batch: false,
      read_only_customer_account: false,
      block_adding_inventory_items: false,
      restrict_settlement: false,
      restrict_add_edit_drops: false,
      dont_limit_adjustments: false,
      allow_price_change_wet_stock: false,
      allow_add_loyalty_points: false,
      allow_calibration: false,
      read_only_supplier: false,
      allow_closed: false
    }
  });

  const handleSubmit = async () => {
    try {
      await base44.entities.User.update(user.id, formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User: {user.full_name}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="employee">Employee Settings</TabsTrigger>
            <TabsTrigger value="security">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="store_manager">Store Manager</SelectItem>
                    <SelectItem value="regional_manager">Regional Manager</SelectItem>
                    <SelectItem value="corporate_manager">Corporate Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Assigned Location</Label>
                <Select value={formData.assigned_location_id} onValueChange={(value) => setFormData({...formData, assigned_location_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.location_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="employee" className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Employee Purchase on Credit Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.employee_purchase_settings.current_payable_balance > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <p className="text-sm font-semibold text-yellow-900">
                      Current Balance Owed: ${formData.employee_purchase_settings.current_payable_balance.toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Purchases on Credit</Label>
                    <p className="text-xs text-gray-600">
                      Employee can purchase items and deduct from payroll
                    </p>
                  </div>
                  <Switch
                    checked={formData.employee_purchase_settings.allow_purchases_on_credit}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      employee_purchase_settings: {
                        ...formData.employee_purchase_settings,
                        allow_purchases_on_credit: checked
                      }
                    })}
                  />
                </div>

                {formData.employee_purchase_settings.allow_purchases_on_credit && (
                  <>
                    <div>
                      <Label htmlFor="credit_limit">Credit Limit ($)</Label>
                      <Input
                        id="credit_limit"
                        type="number"
                        step="0.01"
                        value={formData.employee_purchase_settings.credit_limit}
                        onChange={(e) => setFormData({
                          ...formData,
                          employee_purchase_settings: {
                            ...formData.employee_purchase_settings,
                            credit_limit: parseFloat(e.target.value) || 0
                          }
                        })}
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Maximum amount employee can charge per pay period
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-Deduct from Payroll</Label>
                        <p className="text-xs text-gray-600">
                          Automatically deduct balance at end of pay period
                        </p>
                      </div>
                      <Switch
                        checked={formData.employee_purchase_settings.auto_deduct_from_payroll}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          employee_purchase_settings: {
                            ...formData.employee_purchase_settings,
                            auto_deduct_from_payroll: checked
                          }
                        })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Access Permissions</h4>
              
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto p-2 border rounded">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">User Management</Label>
                    <p className="text-xs text-gray-500">Can manage other users</p>
                  </div>
                  <Switch
                    checked={formData.permissions.user_management}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, user_management: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Back Office Access</Label>
                    <p className="text-xs text-gray-500">Access to management back office</p>
                  </div>
                  <Switch
                    checked={formData.permissions.management_backoffice}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, management_backoffice: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">POS Cashier</Label>
                    <p className="text-xs text-gray-500">Can operate POS terminal</p>
                  </div>
                  <Switch
                    checked={formData.permissions.pos_cashier}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, pos_cashier: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Monitor Clock</Label>
                    <p className="text-xs text-gray-500">View time clock entries</p>
                  </div>
                  <Switch
                    checked={formData.permissions.monitor_clock}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, monitor_clock: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Delete Sale Items</Label>
                    <p className="text-xs text-gray-500">Can remove items from transactions</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_delete_sale_items}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_delete_sale_items: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Price Change (Dry Stock)</Label>
                    <p className="text-xs text-gray-500">Can override prices for store items</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_price_change_dry_stock}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_price_change_dry_stock: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Price Change (Fuel)</Label>
                    <p className="text-xs text-gray-500">Can override fuel prices</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_price_change_wet_stock}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_price_change_wet_stock: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Fuel Delivery Confirmation</Label>
                    <p className="text-xs text-gray-500">Can confirm fuel deliveries</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_fuel_delivery_confirmation}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_fuel_delivery_confirmation: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Add Loyalty Points</Label>
                    <p className="text-xs text-gray-500">Can manually add loyalty points</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_add_loyalty_points}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_add_loyalty_points: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Calibration</Label>
                    <p className="text-xs text-gray-500">Can perform pump calibration</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_calibration}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_calibration: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Unsettle Batch</Label>
                    <p className="text-xs text-gray-500">Can unsettle payment batches</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_unsettle_batch}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_unsettle_batch: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Don't Limit Adjustments</Label>
                    <p className="text-xs text-gray-500">Unlimited adjustment authority</p>
                  </div>
                  <Switch
                    checked={formData.permissions.dont_limit_adjustments}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, dont_limit_adjustments: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <Label className="font-medium">Allow Closed</Label>
                    <p className="text-xs text-gray-500">Can access after store closure</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_closed}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_closed: checked}
                    })}
                  />
                </div>

                <hr className="my-2" />
                <h5 className="font-semibold text-sm text-gray-700">Restrictions (Block Access)</h5>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Store Sales Access</Label>
                    <p className="text-xs text-gray-500">Cannot view store sales data</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_store_sales}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_store_sales: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Inventory Items</Label>
                    <p className="text-xs text-gray-500">Cannot view inventory</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_inventory_items}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_inventory_items: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Adding Inventory Items</Label>
                    <p className="text-xs text-gray-500">Cannot add new inventory</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_adding_inventory_items}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_adding_inventory_items: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Shift Report</Label>
                    <p className="text-xs text-gray-500">Cannot view shift reports</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_shift_report}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_shift_report: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Daily Sales</Label>
                    <p className="text-xs text-gray-500">Cannot view daily sales</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_daily_sales}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_daily_sales: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Month Sales</Label>
                    <p className="text-xs text-gray-500">Cannot view monthly sales</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_month_sales}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_month_sales: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Annual Sales</Label>
                    <p className="text-xs text-gray-500">Cannot view annual sales</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_annual_sales}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_annual_sales: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Maintenance Tools</Label>
                    <p className="text-xs text-gray-500">Cannot access maintenance tools</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_maintenance_tools}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_maintenance_tools: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Payout Editing</Label>
                    <p className="text-xs text-gray-500">Cannot edit payouts</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_payout_editing}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_payout_editing: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Block Product Search in POS</Label>
                    <p className="text-xs text-gray-500">Cannot search products at POS</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_product_search_pos}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_product_search_pos: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Restrict Settlement</Label>
                    <p className="text-xs text-gray-500">Cannot settle transactions</p>
                  </div>
                  <Switch
                    checked={formData.permissions.restrict_settlement}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, restrict_settlement: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <div>
                    <Label className="font-medium text-red-700">Restrict Add/Edit Drops</Label>
                    <p className="text-xs text-gray-500">Cannot add or edit safe drops</p>
                  </div>
                  <Switch
                    checked={formData.permissions.restrict_add_edit_drops}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, restrict_add_edit_drops: checked}
                    })}
                  />
                </div>

                <hr className="my-2" />
                <h5 className="font-semibold text-sm text-gray-700">Read-Only Access</h5>

                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <div>
                    <Label className="font-medium text-yellow-700">Read-Only Customer Account</Label>
                    <p className="text-xs text-gray-500">Can view but not edit customer accounts</p>
                  </div>
                  <Switch
                    checked={formData.permissions.read_only_customer_account}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, read_only_customer_account: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <div>
                    <Label className="font-medium text-yellow-700">Read-Only Supplier</Label>
                    <p className="text-xs text-gray-500">Can view but not edit suppliers</p>
                  </div>
                  <Switch
                    checked={formData.permissions.read_only_supplier}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, read_only_supplier: checked}
                    })}
                  />
                </div>

                <hr className="my-2" />
                <h5 className="font-semibold text-sm text-gray-700">Special Permissions</h5>

                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div>
                    <Label className="font-medium text-blue-700">Customer Payments Only</Label>
                    <p className="text-xs text-gray-500">Can only process customer account payments</p>
                  </div>
                  <Switch
                    checked={formData.permissions.allow_customer_payments_only}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, allow_customer_payments_only: checked}
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div>
                    <Label className="font-medium text-blue-700">Block Accumatica Adjustments</Label>
                    <p className="text-xs text-gray-500">Cannot make accounting adjustments</p>
                  </div>
                  <Switch
                    checked={formData.permissions.block_accumatica_adjustments}
                    onCheckedChange={(checked) => setFormData({
                      ...formData,
                      permissions: {...formData.permissions, block_accumatica_adjustments: checked}
                    })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserPermissionsModal({ user, onClose, onSuccess }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Permissions: {user.full_name}</DialogTitle>
        </DialogHeader>
        {/*
          This modal is for displaying permissions, but the edit/add modals now handle editing permissions.
          For now, just display a message or perhaps read-only version of the permissions.
        */}
        <p className="text-sm text-gray-600">Permissions management is now integrated into the 'Edit User' and 'Add User' modals under the 'Permissions' tab.</p>
        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto p-2 border rounded">
          {Object.entries(user.permissions || {}).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="font-medium">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
              <Badge variant={value ? "default" : "secondary"}>
                {value ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          ))}
          {Object.keys(user.permissions || {}).length === 0 && (
            <p className="text-center text-gray-500">No specific permissions set.</p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
