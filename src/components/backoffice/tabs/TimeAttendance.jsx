
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TimeClockEntry } from "@/api/entities";
import { User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import {
  Clock, Edit, Save, X, AlertTriangle, CheckCircle,
  Brain, Lock, Calendar, MapPin
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";


export default function TimeAttendance({ currentScope }) {
  const [timeEntries, setTimeEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [aiAnomalies, setAiAnomalies] = useState(null);
  const [users, setUsers] = useState([]); // New state for users in current scope

  useEffect(() => {
    loadData();
  }, [currentScope]); // Reload data when currentScope changes

  useEffect(() => {
    if (timeEntries.length > 0) { // Filter based on timeEntries
      filterEntries();
    } else if (dateFilter && timeEntries.length === 0) {
      setFilteredEntries([]); // If no timeEntries, then filtered should also be empty
    }
  }, [dateFilter, timeEntries]); // Re-filter when dateFilter or timeEntries change

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      let entriesData;
      let usersData;

      // Filter data based on currentScope
      if (currentScope?.type === 'location' && currentScope?.id) {
        entriesData = await TimeClockEntry.filter({ location_id: currentScope.id }, '-clock_in_time', 100);
        usersData = await User.filter({ assigned_location_id: currentScope.id });
      } else if (currentScope?.type === 'region' && currentScope?.id) {
        const locationsData = JSON.parse(sessionStorage.getItem('app_locations') || '[]');
        const regionLocationIds = locationsData
          .filter(loc => loc.region_id === currentScope.id)
          .map(loc => loc.id);

        const allEntries = await TimeClockEntry.list('-clock_in_time', 200); // Fetch more for regional scope
        const allUsers = await User.list();

        entriesData = allEntries.filter(e => regionLocationIds.includes(e.location_id));
        usersData = allUsers.filter(u => regionLocationIds.includes(u.assigned_location_id));
      } else { // No specific scope, load all or user's default if not admin
        // For admin/corporate without specific scope, show all.
        // For others, if currentScope is null, default to their own location or user.
        if (['admin', 'corporate_manager', 'regional_manager'].includes(user.role)) {
          entriesData = await TimeClockEntry.list('-clock_in_time', 100);
          usersData = await User.list();
        } else if (user.role === 'store_manager' && user.assigned_location_id) {
          entriesData = await TimeClockEntry.filter(
            { location_id: user.assigned_location_id },
            '-clock_in_time',
            100
          );
          usersData = await User.filter({ assigned_location_id: user.assigned_location_id });
        } else {
          entriesData = await TimeClockEntry.filter(
            { user_id: user.id },
            '-clock_in_time',
            50
          );
          usersData = await User.filter({ id: user.id });
        }
      }

      setTimeEntries(entriesData);
      setFilteredEntries(entriesData); // Initialize filtered entries
      setUsers(usersData); // Set the users state

      // Get AI anomaly detection for managers, using the fetched entries
      if (['admin', 'store_manager', 'regional_manager', 'corporate_manager'].includes(user.role)) {
        await detectAnomalies(entriesData);
      }
    } catch (error) {
      console.error('Error loading time entries:', error);
      setTimeEntries([]);
      setFilteredEntries([]);
      setUsers([]);
      setAiAnomalies(null);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEntries = () => {
    if (!dateFilter) {
      setFilteredEntries(timeEntries); // Filter based on timeEntries
      return;
    }

    const filtered = timeEntries.filter(entry => { // Filter based on timeEntries
      const entryDate = format(new Date(entry.clock_in_time), 'yyyy-MM-dd');
      return entryDate === dateFilter;
    });
    setFilteredEntries(filtered);
  };

  const detectAnomalies = async (entriesToAnalyze) => {
    try {
      // Analyze a reasonable subset of entries for performance
      const recentEntries = entriesToAnalyze.slice(0, 20);
      const analysisData = recentEntries.map(e => ({
        employee: e.user_name,
        clockIn: e.clock_in_time,
        clockOut: e.clock_out_time,
        totalHours: e.total_hours,
        status: e.status,
        isEdited: e.is_edited
      }));

      const prompt = `Analyze these time clock entries for anomalies:

${JSON.stringify(analysisData, null, 2)}

Identify:
1. Forgotten clock-outs (status still 'clocked_in' and old entries)
2. Unusual shift lengths (too long or too short)
3. Patterns of manual edits
4. Any other concerning patterns

Provide a brief summary of key findings and recommendations.`;

      const response = await InvokeLLM({ prompt });
      setAiAnomalies(response);
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      setAiAnomalies("Failed to detect anomalies. Please try again.");
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry({
      ...entry,
      originalEntry: { ...entry }
    });
  };

  const canEdit = () => {
    return currentUser && ['admin', 'store_manager', 'regional_manager', 'corporate_manager'].includes(currentUser.role);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Loading time entries...</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate stats based on the full list of timeEntries, not filtered
  const clockedIn = timeEntries.filter(e => e.status === 'clocked_in').length;
  const totalHoursToday = timeEntries
    .filter(e => new Date(e.clock_in_time).toDateString() === new Date().toDateString())
    .reduce((sum, e) => sum + (e.total_hours || 0), 0);

  return (
    <div className="space-y-6">
      {/* Location Context Indicator */}
      {currentScope && (
        <Alert className="bg-blue-50 border-blue-200">
          <MapPin className="w-4 h-4 text-blue-600" />
          <AlertDescription>
            <strong>Viewing time & attendance for:</strong> {currentScope.label}
          </AlertDescription>
        </Alert>
      )}

      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time & Attendance
            </span>
            <Badge>{filteredEntries.length} Entries</Badge>
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
            <Button variant="outline" onClick={() => setDateFilter('')}>
              Clear Filter
            </Button>
            <Button onClick={loadData}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Anomaly Detection */}
      {aiAnomalies && canEdit() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Anomaly Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {aiAnomalies}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Entries Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Clock In
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Clock Out
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Hours
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  {canEdit() && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{entry.user_name}</p>
                        {entry.is_edited && (
                          <Badge variant="secondary" className="mt-1">
                            <Edit className="w-3 h-3 mr-1" />
                            Edited
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {format(new Date(entry.clock_in_time), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-4 py-3">
                      {entry.clock_out_time ? (
                        format(new Date(entry.clock_out_time), 'MMM d, h:mm a')
                      ) : (
                        <Badge variant="destructive">Still Clocked In</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {entry.total_hours ? (
                        <span className="font-medium">{entry.total_hours.toFixed(2)} hrs</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={entry.status === 'clocked_in' ? 'default' : 'secondary'}>
                        {entry.status === 'clocked_in' ? (
                          <><Clock className="w-3 h-3 mr-1" />Active</>
                        ) : (
                          <><CheckCircle className="w-3 h-3 mr-1" />Completed</>
                        )}
                      </Badge>
                    </td>
                    {canEdit() && (
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingEntry && (
        <EditTimeEntryModal
          entry={editingEntry}
          currentUser={currentUser}
          onClose={() => setEditingEntry(null)}
          onSaved={() => {
            setEditingEntry(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function EditTimeEntryModal({ entry, currentUser, onClose, onSaved }) {
  const [clockInTime, setClockInTime] = useState(
    format(new Date(entry.clock_in_time), "yyyy-MM-dd'T'HH:mm")
  );
  const [clockOutTime, setClockOutTime] = useState(
    entry.clock_out_time ? format(new Date(entry.clock_out_time), "yyyy-MM-dd'T'HH:mm") : ''
  );
  const [editReason, setEditReason] = useState('');
  const [managerPin, setManagerPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const calculateTotalHours = () => {
    if (!clockInTime || !clockOutTime) return null;
    const clockIn = new Date(clockInTime);
    const clockOut = new Date(clockOutTime);
    const hours = (clockOut - clockIn) / (1000 * 60 * 60);
    return hours > 0 ? hours.toFixed(2) : 0;
  };

  const handleSave = async () => {
    if (!editReason.trim()) {
      setError('Please provide a reason for editing this time entry');
      return;
    }

    if (!managerPin || managerPin.length !== 4) {
      setError('Please enter your 4-digit manager PIN');
      return;
    }

    // Verify PIN
    if (currentUser.pin && currentUser.pin !== managerPin) {
      setError('Invalid PIN. Please try again.');
      setManagerPin('');
      return;
    }

    setIsSaving(true);

    try {
      const totalHours = calculateTotalHours();

      await TimeClockEntry.update(entry.id, {
        clock_in_time: new Date(clockInTime).toISOString(),
        clock_out_time: clockOutTime ? new Date(clockOutTime).toISOString() : null,
        total_hours: totalHours ? parseFloat(totalHours) : null,
        status: clockOutTime ? 'clocked_out' : 'clocked_in',
        is_edited: true,
        edited_by: currentUser.full_name,
        edited_at: new Date().toISOString(),
        edit_reason: editReason.trim()
      });

      alert('Time entry updated successfully');
      onSaved();
    } catch (error) {
      console.error('Failed to update time entry:', error);
      setError('Failed to update time entry. Please try again.');
      setIsSaving(false);
    }
  };

  const totalHours = calculateTotalHours();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Time Entry
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Employee:</strong> {entry.user_name}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Original Clock In:</strong> {format(new Date(entry.originalEntry.clock_in_time), 'MMM d, h:mm a')}
            </p>
            {entry.originalEntry.clock_out_time && (
              <p className="text-sm text-blue-800">
                <strong>Original Clock Out:</strong> {format(new Date(entry.originalEntry.clock_out_time), 'MMM d, h:mm a')}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="clock_in_time">Clock In Time</Label>
            <Input
              id="clock_in_time"
              type="datetime-local"
              value={clockInTime}
              onChange={(e) => setClockInTime(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="clock_out_time">Clock Out Time</Label>
            <Input
              id="clock_out_time"
              type="datetime-local"
              value={clockOutTime}
              onChange={(e) => setClockOutTime(e.target.value)}
            />
          </div>

          {totalHours && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Calculated Total Hours:</strong> {totalHours} hours
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="edit_reason">Reason for Edit *</Label>
            <Textarea
              id="edit_reason"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              rows={3}
              placeholder="e.g., Employee forgot to clock out, adjusted to actual departure time"
            />
          </div>

          <div>
            <Label htmlFor="manager_pin">Your Manager PIN *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="manager_pin"
                type="password"
                maxLength={4}
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit PIN"
                className="pl-10"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Audit Trail:</strong> All edits are logged with your name, timestamp, and reason. This information will appear on reports and payroll exports.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !editReason.trim() || !managerPin || managerPin.length !== 4}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
