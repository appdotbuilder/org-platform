import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { trpc } from '@/utils/trpc';
import { Plus, FolderOpen, ChevronDown, ChevronRight, FileText, BookOpen } from 'lucide-react';
import { LessonManager } from './LessonManager';
import type { Module, CreateModuleInput, Lesson } from '../../../server/src/schema';

interface ModuleManagerProps {
  courseId: number;
}

export function ModuleManager({ courseId }: ModuleManagerProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<number, Lesson[]>>({});
  const [openModules, setOpenModules] = useState<Set<number>>(new Set());
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showLessonManager, setShowLessonManager] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateModuleInput>({
    course_id: courseId,
    title: '',
    slug: '',
    description: null,
    order_index: 0
  });

  const loadModules = useCallback(async () => {
    try {
      const result = await trpc.getModules.query({ courseId });
      setModules(result);
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  }, [courseId]);

  const loadLessonsForModule = useCallback(async (moduleId: number) => {
    try {
      const result = await trpc.getLessons.query({ moduleId });
      setLessons((prev: Record<number, Lesson[]>) => ({
        ...prev,
        [moduleId]: result
      }));
    } catch (error) {
      console.error(`Failed to load lessons for module ${moduleId}:`, error);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createModule.mutate({
        ...formData,
        order_index: modules.length
      });
      setModules((prev: Module[]) => [...prev, response]);
      setFormData({
        course_id: courseId,
        title: '',
        slug: '',
        description: null,
        order_index: 0
      });
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create module:', error);
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
    setFormData((prev: CreateModuleInput) => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const toggleModule = async (moduleId: number) => {
    const newOpenModules = new Set(openModules);
    
    if (openModules.has(moduleId)) {
      newOpenModules.delete(moduleId);
    } else {
      newOpenModules.add(moduleId);
      // Load lessons for this module if not already loaded
      if (!lessons[moduleId]) {
        await loadLessonsForModule(moduleId);
      }
    }
    
    setOpenModules(newOpenModules);
  };

  if (showLessonManager && selectedModule) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setShowLessonManager(false);
              setSelectedModule(null);
            }}
          >
            ← Back to Modules
          </Button>
          <div className="text-right">
            <h4 className="text-lg font-semibold">{selectedModule.title}</h4>
            <p className="text-sm text-gray-600">Managing lessons</p>
          </div>
        </div>
        <LessonManager moduleId={selectedModule.id} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Course Modules</h3>
          <p className="text-gray-600">Organize your course content into modules and lessons</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Module
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Module</DialogTitle>
                <DialogDescription>
                  Add a new module to organize lessons and content.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="title">Module Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleTitleChange(e.target.value)
                    }
                    placeholder="Getting Started"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateModuleInput) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="getting-started"
                    pattern="[a-z0-9-]+"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Module Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateModuleInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    placeholder="What will students learn in this module?"
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
                  {isLoading ? 'Creating...' : 'Create Module'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {modules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No modules yet</h3>
            <p className="text-gray-600 text-center mb-6">
              Create your first module to start organizing your course content into structured lessons.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules
            .sort((a, b) => a.order_index - b.order_index)
            .map((module: Module) => (
              <Card key={module.id}>
                <Collapsible
                  open={openModules.has(module.id)}
                  onOpenChange={() => toggleModule(module.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {openModules.has(module.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <FolderOpen className="h-5 w-5 text-indigo-600" />
                          <div className="text-left">
                            <CardTitle>{module.title}</CardTitle>
                            <CardDescription>
                              {module.description || 'No description provided'}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            Module {module.order_index + 1}
                          </Badge>
                          <Badge variant="secondary">
                            {lessons[module.id]?.length || 0} lessons
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="border-t pt-4">
                        {lessons[module.id] && lessons[module.id].length > 0 ? (
                          <div className="space-y-2">
                            {lessons[module.id]
                              .sort((a, b) => a.order_index - b.order_index)
                              .map((lesson: Lesson) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                >
                                  <div className="flex items-center space-x-3">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <div>
                                      <p className="font-medium">{lesson.title}</p>
                                      <p className="text-sm text-gray-600">
                                        Lesson {lesson.order_index + 1}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600 text-sm">No lessons in this module yet</p>
                          </div>
                        )}
                        
                        <div className="flex justify-between mt-4 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedModule(module);
                              setShowLessonManager(true);
                            }}
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Manage Lessons
                          </Button>
                          
                          <div className="text-xs text-gray-500">
                            Created {module.created_at.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}