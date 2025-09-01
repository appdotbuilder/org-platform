import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { Plus, PenTool, Eye, EyeOff, Lock, Calendar, Edit, Trash2, Clock } from 'lucide-react';
import type { BlogPost, CreateBlogPostInput } from '../../../server/src/schema';

interface BlogPostManagerProps {
  blogInstanceId: number;
}

export function BlogPostManager({ blogInstanceId }: BlogPostManagerProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [publishNow, setPublishNow] = useState(true);
  
  const [formData, setFormData] = useState<CreateBlogPostInput>({
    blog_instance_id: blogInstanceId,
    title: '',
    slug: '',
    content: null,
    excerpt: null,
    visibility: 'public',
    created_by: 1, // TODO: Replace with actual user ID
    published_at: null
  });

  const loadPosts = useCallback(async () => {
    try {
      const result = await trpc.getBlogPosts.query({ blogInstanceId });
      setPosts(result);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
    }
  }, [blogInstanceId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const postData = {
        ...formData,
        published_at: publishNow ? new Date() : null
      };
      
      const response = await trpc.createBlogPost.mutate(postData);
      setPosts((prev: BlogPost[]) => [...prev, response]);
      
      // Reset form
      setFormData({
        blog_instance_id: blogInstanceId,
        title: '',
        slug: '',
        content: null,
        excerpt: null,
        visibility: 'public',
        created_by: 1,
        published_at: null
      });
      setPublishNow(true);
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create blog post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev: CreateBlogPostInput) => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Eye className="h-4 w-4" />;
      case 'private': return <EyeOff className="h-4 w-4" />;
      case 'restricted': return <Lock className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getVisibilityBadgeVariant = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'default';
      case 'private': return 'secondary';
      case 'restricted': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusBadge = (post: BlogPost) => {
    if (post.published_at && new Date(post.published_at) <= new Date()) {
      return <Badge variant="default">Published</Badge>;
    } else if (post.published_at && new Date(post.published_at) > new Date()) {
      return <Badge variant="outline">Scheduled</Badge>;
    } else {
      return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Blog Posts</h3>
          <p className="text-gray-600">Create and manage your blog content</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Blog Post</DialogTitle>
                <DialogDescription>
                  Write and publish a new blog post for your audience.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Post Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleTitleChange(e.target.value)
                      }
                      placeholder="How to Build Amazing Web Applications"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateBlogPostInput) => ({ ...prev, slug: e.target.value }))
                      }
                      placeholder="build-amazing-web-applications"
                      pattern="[a-z0-9-]+"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateBlogPostInput) => ({
                        ...prev,
                        excerpt: e.target.value || null
                      }))
                    }
                    placeholder="A brief summary of your post..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Post Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateBlogPostInput) => ({
                        ...prev,
                        content: e.target.value || null
                      }))
                    }
                    placeholder="Write your blog post content here. You can use markdown for formatting..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports Markdown formatting for rich content creation.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select
                      value={formData.visibility || 'public'}
                      onValueChange={(value: 'public' | 'private' | 'restricted') =>
                        setFormData((prev: CreateBlogPostInput) => ({ ...prev, visibility: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4" />
                            <span>Public - Anyone can see</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center space-x-2">
                            <EyeOff className="h-4 w-4" />
                            <span>Private - Only you can see</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="restricted">
                          <div className="flex items-center space-x-2">
                            <Lock className="h-4 w-4" />
                            <span>Restricted - Invited users only</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="publish-now"
                      checked={publishNow}
                      onCheckedChange={setPublishNow}
                    />
                    <Label htmlFor="publish-now">Publish immediately</Label>
                  </div>
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
                  {isLoading ? 'Creating...' : publishNow ? 'Publish Post' : 'Save Draft'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <PenTool className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter(post => post.published_at && new Date(post.published_at) <= new Date()).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter(post => !post.published_at).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter(post => post.published_at && new Date(post.published_at) > new Date()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <PenTool className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No blog posts yet</h3>
            <p className="text-gray-600 text-center mb-6">
              Create your first blog post to start sharing content with your audience.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Write Your First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Blog Posts</CardTitle>
            <CardDescription>
              Manage your published and draft blog posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((post: BlogPost) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <PenTool className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="font-medium line-clamp-1">{post.title}</p>
                            {post.excerpt && (
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {post.excerpt}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(post)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getVisibilityBadgeVariant(post.visibility)}
                          className="flex items-center space-x-1 w-fit"
                        >
                          {getVisibilityIcon(post.visibility)}
                          <span className="capitalize">{post.visibility}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {post.created_at.toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {post.published_at ? (
                          <div className="text-sm text-gray-500">
                            {new Date(post.published_at).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not published</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}