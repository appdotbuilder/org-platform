import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { Plus, FileText, Calendar, Edit, Trash2 } from 'lucide-react';
import type { Lesson, CreateLessonInput } from '../../../server/src/schema';

interface LessonManagerProps {
  moduleId: number;
}

export function LessonManager({ moduleId }: LessonManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateLessonInput>({
    module_id: moduleId,
    title: '',
    slug: '',
    content: null,
    order_index: 0
  });

  const loadLessons = useCallback(async () => {
    try {
      const result = await trpc.getLessons.query({ moduleId });
      setLessons(result);
    } catch (error) {
      console.error('Failed to load lessons:', error);
    }
  }, [moduleId]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createLesson.mutate({
        ...formData,
        order_index: lessons.length
      });
      setLessons((prev: Lesson[]) => [...prev, response]);
      setFormData({
        module_id: moduleId,
        title: '',
        slug: '',
        content: null,
        order_index: 0
      });
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create lesson:', error);
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
    setFormData((prev: CreateLessonInput) => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Module Lessons</h3>
          <p className="text-gray-600">Create and manage individual lessons within this module</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Lesson</DialogTitle>
                <DialogDescription>
                  Add a new lesson with content to your module.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Lesson Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleTitleChange(e.target.value)
                      }
                      placeholder="Introduction to Variables"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateLessonInput) => ({ ...prev, slug: e.target.value }))
                      }
                      placeholder="intro-variables"
                      pattern="[a-z0-9-]+"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="content">Lesson Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateLessonInput) => ({
                        ...prev,
                        content: e.target.value || null
                      }))
                    }
                    placeholder="Write your lesson content here. You can use markdown for formatting..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports Markdown formatting for rich content creation.
                  </p>
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
                  {isLoading ? 'Creating...' : 'Create Lesson'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No lessons yet</h3>
            <p className="text-gray-600 text-center mb-6">
              Create your first lesson to start building the learning content for this module.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Lesson
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Lessons Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lessons.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">With Content</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {lessons.filter(lesson => lesson.content && lesson.content.length > 0).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {lessons.length > 0 
                    ? Math.round((lessons.filter(lesson => lesson.content && lesson.content.length > 0).length / lessons.length) * 100)
                    : 0
                  }%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lessons List */}
          <Card>
            <CardHeader>
              <CardTitle>Lessons</CardTitle>
              <CardDescription>
                Manage the order and content of your lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessons
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((lesson: Lesson) => (
                      <TableRow key={lesson.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {lesson.order_index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-indigo-600" />
                            <span className="font-medium">{lesson.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {lesson.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          {lesson.content && lesson.content.length > 0 ? (
                            <Badge variant="default">
                              {lesson.content.length} chars
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Empty
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {lesson.created_at.toLocaleDateString()}
                          </div>
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
        </div>
      )}
    </div>
  );
}