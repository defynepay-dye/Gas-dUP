import React, { useState, useEffect } from 'react';
import { RestockingTask } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListTodo, Check, AlertCircle, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function RestockingTasks() {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setIsLoading(true);
        const taskData = await RestockingTask.filter({ status: 'pending' }, '-priority');
        setTasks(taskData);
        setIsLoading(false);
    };

    const handleCompleteTask = async (taskId) => {
        await RestockingTask.update(taskId, { status: 'completed' });
        loadTasks();
    };

    if (isLoading) {
        return <p>Loading restocking tasks...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListTodo /> AI-Generated Restocking Tasks</CardTitle>
                <CardDescription>
                    These tasks are automatically created by the shelf-monitoring AI when it detects an out-of-stock or low-stock product.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {tasks.length === 0 ? (
                    <div className="text-center py-12">
                        <Check className="mx-auto h-12 w-12 text-green-500" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">All shelves are stocked!</h3>
                        <p className="mt-1 text-sm text-gray-500">No pending restocking tasks from the AI.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map(task => (
                            <div key={task.id} className="p-4 border rounded-lg flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <Package className="w-8 h-8 text-blue-500" />
                                    <div>
                                        <p className="font-bold">{task.product_name}</p>
                                        <p className="text-sm text-gray-600">Location: {task.zone_name}</p>
                                        <p className="text-xs text-gray-500">
                                            Needs {task.quantity_needed} units. Detected {formatDistanceToNow(new Date(task.created_date), { addSuffix: true })}.
                                        </p>
                                    </div>
                                </div>
                                <Button size="sm" onClick={() => handleCompleteTask(task.id)}>
                                    <Check className="w-4 h-4 mr-2" />
                                    Mark as Done
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}