import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Plus, Trash2 } from "lucide-react";
import { User as UserEntity } from "@/api/entities";

export default function ClerkManagerModal({ onClose }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newClerkEmail, setNewClerkEmail] = useState('');
  const [newClerkName, setNewClerkName] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const userList = await UserEntity.list();
      setUsers(userList);
    } catch (error) {
      console.error("Error loading users:", error);
    }
    setIsLoading(false);
  };

  const handleAddClerk = () => {
    if (!newClerkEmail || !newClerkName) {
      alert("Please enter both name and email for the new clerk.");
      return;
    }
    // In a real app, this would trigger an invite flow.
    // For this demo, we'll just log it and add it to the list visually.
    console.log(`Inviting new clerk: ${newClerkName} <${newClerkEmail}>`);
    
    setUsers([...users, { 
      id: `new-${Date.now()}`,
      full_name: newClerkName, 
      email: newClerkEmail,
      role: 'user'
    }]);

    setNewClerkEmail('');
    setNewClerkName('');
    alert("Invitation sent to new clerk!");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Clerk &amp; User Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Add New Clerk */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium mb-3">Add New Clerk</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="clerkName">Clerk Full Name</Label>
                <Input 
                  id="clerkName"
                  value={newClerkName}
                  onChange={(e) => setNewClerkName(e.target.value)}
                  placeholder="e.g., John Smith"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="clerkEmail">Clerk Email</Label>
                <Input 
                  id="clerkEmail"
                  type="email"
                  value={newClerkEmail}
                  onChange={(e) => setNewClerkEmail(e.target.value)}
                  placeholder="e.g., john.smith@example.com"
                />
              </div>
              <Button onClick={handleAddClerk} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </div>

          {/* Existing Clerks List */}
          <div>
            <h4 className="font-medium mb-3">Current Staff</h4>
            <div className="space-y-2">
              {isLoading ? (
                <p>Loading users...</p>
              ) : (
                users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <Button variant="ghost" size="icon" className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}