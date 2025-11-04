import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  GraduationCap, 
  MessageCircle, 
  Phone,
  FileText,
  Video,
  Users,
  Award,
  Clock,
  Search,
  Download,
  ExternalLink,
  Lightbulb
} from "lucide-react";
import { SupportTicket, TrainingModule, SystemNotification } from "@/api/entities";

export default function BackOfficeSupportHub() {
  const [trainingModules, setTrainingModules] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadTrainingModules();
    loadNotifications();
    loadUserProgress();
  }, []);

  const loadTrainingModules = async () => {
    try {
      const modules = await TrainingModule.filter({ active: true });
      setTrainingModules(modules);
    } catch (error) {
      console.error("Error loading training modules:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      const activeNotifications = await SystemNotification.filter({
        target_audience: 'admin_only',
        expiry_date: { $gte: new Date().toISOString() }
      });
      setNotifications(activeNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const loadUserProgress = async () => {
    // This would load actual user progress from a UserProgress entity
    setUserProgress({
      completedModules: 8,
      totalModules: 12,
      certificates: 3,
      hoursCompleted: 24
    });
  };

  const resources = [
    {
      title: "FuelStation Pro Operations Manual",
      description: "Complete guide to all system features and best practices",
      type: "PDF Guide",
      icon: FileText,
      url: "#",
      category: "Documentation"
    },
    {
      title: "Regulatory Compliance Handbook",
      description: "Stay compliant with fuel retail regulations and safety standards",
      type: "PDF Guide",
      icon: BookOpen,
      url: "#",
      category: "Compliance"
    },
    {
      title: "Troubleshooting Quick Reference",
      description: "Common issues and their solutions",
      type: "Quick Reference",
      icon: Lightbulb,
      url: "#",
      category: "Troubleshooting"
    },
    {
      title: "API Integration Guide",
      description: "Connect third-party services and custom integrations",
      type: "Technical Guide",
      icon: ExternalLink,
      url: "#",
      category: "Development"
    }
  ];

  const expertServices = [
    {
      title: "Business Optimization Consultation",
      description: "One-on-one session to optimize your operations and increase profits",
      duration: "60 minutes",
      price: "Included in Pro Plan"
    },
    {
      title: "Custom Training Session",
      description: "Tailored training for your team on specific features or workflows",
      duration: "45 minutes",
      price: "Included in Enterprise Plan"
    },
    {
      title: "Implementation Support",
      description: "Guided setup and configuration for new locations or features",
      duration: "90 minutes",
      price: "Contact Sales"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Support & Training Center</h1>
          <p className="text-gray-500">Master FuelStation Pro with comprehensive resources and expert support</p>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{((userProgress.completedModules / userProgress.totalModules) * 100).toFixed(0)}%</div>
          <div className="text-sm text-gray-500">Training Complete</div>
        </div>
      </div>

      {/* Critical Notifications */}
      {notifications.filter(n => n.priority === 'critical').map(notification => (
        <div key={notification.id} className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-red-800">{notification.title}</h3>
              <p className="text-red-700 text-sm mt-1">{notification.message}</p>
            </div>
            {notification.action_required && (
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                Take Action
              </Button>
            )}
          </div>
        </div>
      ))}

      <Tabs defaultValue="training" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="support">Get Support</TabsTrigger>
          <TabsTrigger value="experts">Expert Services</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-6">
          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <GraduationCap className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <div className="text-2xl font-bold">{userProgress.completedModules}</div>
                <div className="text-sm text-gray-500">Modules Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                <div className="text-2xl font-bold">{userProgress.certificates}</div>
                <div className="text-sm text-gray-500">Certificates Earned</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <div className="text-2xl font-bold">{userProgress.hoursCompleted}</div>
                <div className="text-sm text-gray-500">Hours Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{userProgress.totalModules - userProgress.completedModules}</div>
                <div className="text-sm text-gray-500">Modules Remaining</div>
                <Progress value={(userProgress.completedModules / userProgress.totalModules) * 100} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Training Modules */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Training Modules</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search training modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {trainingModules
                  .filter(module => module.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(module => (
                  <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Video className="w-8 h-8 text-blue-500" />
                      <div>
                        <h3 className="font-medium">{module.title}</h3>
                        <p className="text-sm text-gray-500">Duration: {module.duration_minutes} minutes</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">{module.category}</Badge>
                          <Badge variant="outline">{module.content_type}</Badge>
                        </div>
                      </div>
                    </div>
                    <Button>Start Module</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid gap-4">
            {resources.map((resource, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <resource.icon className="w-8 h-8 text-blue-500 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg">{resource.title}</h3>
                        <p className="text-gray-600 mt-1">{resource.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{resource.type}</Badge>
                          <Badge variant="secondary">{resource.category}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm">
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Live Chat Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">Get instant help from our support team</p>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Available 24/7
                </div>
                <Button className="w-full">Start Chat</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Phone Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">Speak directly with a technical expert</p>
                <div className="text-sm">
                  <div className="font-medium">1-800-FUEL-PRO</div>
                  <div className="text-gray-500">Mon-Fri: 8AM-8PM EST</div>
                </div>
                <Button variant="outline" className="w-full">Call Now</Button>
              </CardContent>
            </Card>
          </div>

          {/* Create Support Ticket */}
          <Card>
            <CardHeader>
              <CardTitle>Create Support Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Issue Category</label>
                  <select className="w-full mt-1 p-2 border rounded-md">
                    <option>Select category...</option>
                    <option>Technical Issue</option>
                    <option>Billing Question</option>
                    <option>Feature Request</option>
                    <option>Training Request</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <select className="w-full mt-1 p-2 border rounded-md">
                    <option>Medium</option>
                    <option>Low</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input className="mt-1" placeholder="Brief description of your issue" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea className="w-full mt-1 p-2 border rounded-md h-32" placeholder="Please provide detailed information about your issue..."></textarea>
              </div>
              <Button className="w-full">Submit Ticket</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experts" className="space-y-6">
          <div className="grid gap-6">
            {expertServices.map((service, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{service.title}</h3>
                      <p className="text-gray-600 mt-2">{service.description}</p>
                      <div className="flex gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {service.duration}
                        </div>
                        <div className="font-medium text-green-600">{service.price}</div>
                      </div>
                    </div>
                    <Button>Schedule Session</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                FuelStation Pro Community
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">Connect with other FuelStation Pro users, share best practices, and get peer support.</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col">
                  <MessageCircle className="w-8 h-8 mb-2" />
                  <span className="font-medium">Discussion Forums</span>
                  <span className="text-sm text-gray-500">Ask questions and share tips</span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col">
                  <Video className="w-8 h-8 mb-2" />
                  <span className="font-medium">Monthly Webinars</span>
                  <span className="text-sm text-gray-500">Learn about new features</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}