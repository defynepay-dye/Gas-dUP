import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, Bell } from "lucide-react";
import { format } from "date-fns";

const priorityConfig = {
  critical: { icon: AlertTriangle, color: "bg-red-100 text-red-800" },
  high: { icon: AlertTriangle, color: "bg-orange-100 text-orange-800" },
  medium: { icon: Info, color: "bg-blue-100 text-blue-800" },
  low: { icon: Info, color: "bg-gray-100 text-gray-800" },
};

export default function AlertsModal({ notifications, onClose }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            System Alerts &amp; Notifications
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-4 p-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No new alerts.</p>
            </div>
          ) : (
            notifications.map(notification => {
              const config = priorityConfig[notification.priority] || priorityConfig.low;
              const Icon = config.icon;
              return (
                <div key={notification.id} className={`p-4 rounded-lg border ${config.color.replace('bg-', 'border-').replace('text-', 'border-opacity-30 ')} ${config.color}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-1 flex-shrink-0 ${config.color.replace('bg-','text-')}`} />
                    <div>
                      <div className="flex items-center gap-2">
                         <Badge className={config.color}>{notification.priority}</Badge>
                         <p className="font-bold">{notification.title}</p>
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-600 mt-2">
                        {format(new Date(notification.created_date), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}