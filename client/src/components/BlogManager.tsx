import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { FileText, Plus, PenTool, TrendingUp, Users, Calendar } from 'lucide-react';
import { BlogPostManager } from './BlogPostManager';
import type { BlogInstance, CreateBlogInstanceInput } from '../../../server/src/schema';

interface BlogManagerProps {
  organizationId: number;
}

export function BlogManager({ organizationId }: BlogManagerProps) {
  const [blogInstances, setBlogInstances] = useState<BlogInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<BlogInstance | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateBlogInstanceInput>({
    organization_id: organizationId,
    name: '',
    slug: '',
    description: null
  });

  const loadBlogInstances = useCallback(async () => {
    try {
      const instances = await trpc.getBlogInstances.query({ organizationId });
      setBlogInstances(instances);
      
      if (instances.length > 0 && !selectedInstance) {
        setSelectedInstance(instances[0]);
      }
    } catch (error) {
      console.error('Failed to load blog instances:', error);
    }
  }, [organizationId, selectedInstance]);

  useEffect(() => {
    loadBlogInstances();
  }, [loadBlogInstances]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createBlogInstance.mutate(formData);
      setBlogInstances((prev: BlogInstance[]) => [...prev, response]);
      setSelectedInstance(response);
      setFormData({
        organization_id: organizationId,
        name: '',
        slug: '',
        description: null
      });
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create blog instance:', error);
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
    setFormData((prev: CreateBlogInstanceInput) => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  if (blogInstances.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Blog Instances</h2>
          <p className="text-gray-600 mb-6">
            Create your first blog instance to start publishing articles and engaging with your audience.
          </p>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                <FileText className="h-5 w-5 mr-2" />
                Create Your First Blog
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create Blog Instance</DialogTitle>
                  <DialogDescription>
                    Set up a new blog system for your organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="name">Blog Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleNameChange(e.target.value)
                      }
                      placeholder="Company News & Updates"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateBlogInstanceInput) => ({ ...prev, slug: e.target.value }))
                      }
                      placeholder="company-news-updates"
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
                        setFormData((prev: CreateBlogInstanceInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      placeholder="Brief description of your blog..."
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
                    {isLoading ? 'Creating...' : 'Create Blog'}
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
          <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
          <p className="text-gray-600">Create and manage blog content for your audience</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {blogInstances.length > 1 && (
            <select
              value={selectedInstance?.id || ''}
              onChange={(e) => {
                const instance = blogInstances.find(i => i.id === parseInt(e.target.value));
                setSelectedInstance(instance || null);
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {blogInstances.map((instance: BlogInstance) => (
                <option key={instance.id} value={instance.id}>{instance.name}</option>
              ))}
            </select>
          )}
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Blog Instance
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create Blog Instance</DialogTitle>
                  <DialogDescription>
                    Set up a new blog system for your organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="name">Blog Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleNameChange(e.target.value)
                      }
                      placeholder="Company News & Updates"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateBlogInstanceInput) => ({ ...prev, slug: e.target.value }))
                      }
                      placeholder="company-news-updates"
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
                        setFormData((prev: CreateBlogInstanceInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                      placeholder="Brief description of your blog..."
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
                    {isLoading ? 'Creating...' : 'Create Blog'}
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
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Blog Instance Info */}
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-6 w-6" />
                  <span>{selectedInstance.name}</span>
                </CardTitle>
                <CardDescription className="text-orange-100">
                  {selectedInstance.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 text-sm text-orange-100">
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
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                  <PenTool className="h-4 w-4 text-muted-foreground" />
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
                  <CardTitle className="text-sm font-medium">Published</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
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
                  <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    +0% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
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

          <TabsContent value="posts">
            <BlogPostManager blogInstanceId={selectedInstance.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Blog Analytics</CardTitle>
                <CardDescription>
                  Insights and metrics about your blog performance
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
                <CardTitle>Blog Settings</CardTitle>
                <CardDescription>
                  Configure your blog instance settings and preferences
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