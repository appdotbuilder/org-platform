import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { trpc } from '@/utils/trpc';
import { Plus, BookOpen, Eye, EyeOff, Lock, Calendar, MoreHorizontal } from 'lucide-react';
import { ModuleManager } from './ModuleManager';
import type { Course, CreateCourseInput } from '../../../server/src/schema';

interface CourseManagerProps {
  lmsInstanceId: number;
}

export function CourseManager({ lmsInstanceId }: CourseManagerProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showModuleManager, setShowModuleManager] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateCourseInput>({
    lms_instance_id: lmsInstanceId,
    title: '',
    slug: '',
    description: null,
    content: null,
    visibility: 'public',
    created_by: 1 // TODO: Replace with actual user ID
  });

  const loadCourses = useCallback(async () => {
    try {
      const result = await trpc.getCourses.query({ lmsInstanceId });
      setCourses(result);
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  }, [lmsInstanceId]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createCourse.mutate(formData);
      setCourses((prev: Course[]) => [...prev, response]);
      setFormData({
        lms_instance_id: lmsInstanceId,
        title: '',
        slug: '',
        description: null,
        content: null,
        visibility: 'public',
        created_by: 1
      });
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create course:', error);
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
    setFormData((prev: CreateCourseInput) => ({
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

  if (showModuleManager && selectedCourse) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={() => {
                setShowModuleManager(false);
                setSelectedCourse(null);
              }}
            >
              ← Back to Courses
            </Button>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-semibold">{selectedCourse.title}</h3>
            <p className="text-sm text-gray-600">Managing modules and lessons</p>
          </div>
        </div>
        <ModuleManager courseId={selectedCourse.id} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Courses</h3>
          <p className="text-gray-600">Create and manage your learning content</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Set up a new course with modules and lessons for your learners.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Course Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleTitleChange(e.target.value)
                      }
                      placeholder="Introduction to Web Development"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateCourseInput) => ({ ...prev, slug: e.target.value }))
                      }
                      placeholder="intro-web-development"
                      pattern="[a-z0-9-]+"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Course Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateCourseInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    placeholder="Brief description of what students will learn..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="content">Course Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateCourseInput) => ({
                        ...prev,
                        content: e.target.value || null
                      }))
                    }
                    placeholder="Detailed course content, objectives, and requirements..."
                    rows={5}
                  />
                </div>
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={formData.visibility || 'public'}
                    onValueChange={(value: 'public' | 'private' | 'restricted') =>
                      setFormData((prev: CreateCourseInput) => ({ ...prev, visibility: value }))
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
                  {isLoading ? 'Creating...' : 'Create Course'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 text-center mb-6">
              Create your first course to start building learning experiences for your audience.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course: Course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {course.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={getVisibilityBadgeVariant(course.visibility)}
                    className="ml-2 flex items-center space-x-1"
                  >
                    {getVisibilityIcon(course.visibility)}
                    <span className="capitalize">{course.visibility}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Created {course.created_at.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowModuleManager(true);
                      }}
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      Modules
                    </Button>
                    <Button size="sm" variant="outline">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}