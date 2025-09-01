import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { BookOpen, Plus, GraduationCap, Users, Award } from 'lucide-react';
import { CourseManager } from './CourseManager';
import type { LmsInstance, CreateLmsInstanceInput } from '../../../server/src/schema';

interface LmsManagerProps {
  organizationId: number;
}

export function LmsManager({ organizationId }: LmsManagerProps) {
  const [lmsInstances, setLmsInstances] = useState<LmsInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<LmsInstance | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateLmsInstanceInput>({
    organization_id: organizationId,
    name: '',
    slug: '',
    description: null
  });

  const loadLmsInstances = useCallback(async () => {
    try {
      const instances = await trpc.getLmsInstances.query({ organizationId });
      setLmsInstances(instances);
      
      if (instances.length > 0 && !selectedInstance) {
        setSelectedInstance(instances[0]);
      }
    } catch (error) {
      console.error('Failed to load LMS instances:', error);
    }
  }, [organizationId, selectedInstance]);

  useEffect(() => {
    loadLmsInstances();
  }, [loadLmsInstances]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createLmsInstance.mutate(formData);
      setLmsInstances((prev: LmsInstance[]) => [...prev, response]);
      setSelectedInstance(response);
      setFormData({
        organization_id: organizationId,
        name: '',
        slug: '',
        description: null
      });
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create LMS instance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData((prev: CreateLmsInstanceInput) => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  if (lmsInstances.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No LMS Instances</h2>
          <p className="text-gray-600 mb-6">
            Create your first Learning Management System to start organizing courses and content.
          </p>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                <BookOpen className="h-5 w-5 mr-2" />
                Create Your First LMS
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create LMS Instance</DialogTitle>
                  <DialogDescription>
                    Set up a new Learning Management System for your organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="name">LMS Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleNameChange(e.target.value)
                      }
                      placeholder="Corporate Training Hub"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateLmsInstanceInput) => ({ ...prev, slug: e.target.value }))
                      }
                      placeholder="corporate-training-hub"
                      pattern="[a-z0-9-]+"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateLmsInstanceInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      placeholder="Brief description of your LMS..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create LMS'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Learning Management System</h2>
          <p className="text-gray-600">Manage courses, modules, and learning content</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {lmsInstances.length > 1 && (
            <select
              value={selectedInstance?.id || ''}
              onChange={(e) => {
                const instance = lmsInstances.find(i => i.id === parseInt(e.target.value));
                setSelectedInstance(instance || null);
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {lmsInstances.map((instance: LmsInstance) => (
                <option key={instance.id} value={instance.id}>{instance.name}</option>
              ))}
            </select>
          )}
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New LMS Instance
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create LMS Instance</DialogTitle>
                  <DialogDescription>
                    Set up a new Learning Management System for your organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="name">LMS Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleNameChange(e.target.value)
                      }
                      placeholder="Corporate Training Hub"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateLmsInstanceInput) => ({ ...prev, slug: e.target.value }))
                      }
                      placeholder="corporate-training-hub"
                      pattern="[a-z0-9-]+"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateLmsInstanceInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      placeholder="Brief description of your LMS..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create LMS'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedInstance && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* LMS Instance Info */}
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-6 w-6" />
                  <span>{selectedInstance.name}</span>
                </CardTitle>
                <CardDescription className="text-purple-100">
                  {selectedInstance.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 text-sm text-purple-100">
                  <span>Slug: {selectedInstance.slug}</span>
                  <span>•</span>
                  <span>Created: {selectedInstance.created_at.toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    +0 from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    +0 from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0%</div>
                  <p className="text-xs text-muted-foreground">
                    +0% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Certificates</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    +0 from last month
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses">
            <CourseManager lmsInstanceId={selectedInstance.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Learning Analytics</CardTitle>
                <CardDescription>
                  Insights and metrics about your learning programs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>LMS Settings</CardTitle>
                <CardDescription>
                  Configure your Learning Management System
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}