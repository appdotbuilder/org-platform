import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/utils/trpc';
import { 
  Plus, 
  StickyNote, 
  FolderPlus, 
  Folder, 
  FileText, 
  Search,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2
} from 'lucide-react';
import type { NotesFolder, Note, CreateNotesFolderInput, CreateNoteInput } from '../../../server/src/schema';

interface NotesManagerProps {
  organizationId: number;
}

export function NotesManager({ organizationId }: NotesManagerProps) {
  const [folders, setFolders] = useState<NotesFolder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<NotesFolder | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [folderFormData, setFolderFormData] = useState<CreateNotesFolderInput>({
    organization_id: organizationId,
    parent_id: null,
    name: '',
    created_by: 1 // TODO: Replace with actual user ID
  });

  const [noteFormData, setNoteFormData] = useState<CreateNoteInput>({
    folder_id: null,
    organization_id: organizationId,
    title: '',
    content: null,
    created_by: 1 // TODO: Replace with actual user ID
  });

  const loadFolders = useCallback(async () => {
    try {
      const result = await trpc.getNotesFolders.query({ 
        organizationId,
        parentId: null 
      });
      setFolders(result);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }, [organizationId]);

  const loadNotes = useCallback(async (folderId?: number) => {
    try {
      const result = await trpc.getNotes.query({ 
        organizationId,
        folderId: folderId || null
      });
      setNotes(result);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }, [organizationId]);

  useEffect(() => {
    loadFolders();
    loadNotes();
  }, [loadFolders, loadNotes]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createNotesFolder.mutate(folderFormData);
      setFolders((prev: NotesFolder[]) => [...prev, response]);
      setFolderFormData({
        organization_id: organizationId,
        parent_id: null,
        name: '',
        created_by: 1
      });
      setIsCreateFolderOpen(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await trpc.createNote.mutate({
        ...noteFormData,
        folder_id: selectedFolder?.id || null
      });
      setNotes((prev: Note[]) => [...prev, response]);
      setNoteFormData({
        folder_id: null,
        organization_id: organizationId,
        title: '',
        content: null,
        created_by: 1
      });
      setSelectedNote(response);
      setIsCreateNoteOpen(false);
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (expandedFolders.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const filteredNotes = notes.filter((note: Note) => {
    if (!searchQuery) return true;
    return note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const renderNote = (note: Note) => (
    <div
      key={note.id}
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        selectedNote?.id === note.id 
          ? 'bg-indigo-50 border-indigo-200' 
          : 'hover:bg-gray-50 border-gray-200'
      }`}
      onClick={() => setSelectedNote(note)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{note.title}</h4>
          {note.content && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {note.content.substring(0, 100)}...
            </p>
          )}
        </div>
        <div className="ml-2 text-xs text-gray-400">
          {note.updated_at.toLocaleDateString()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[800px] flex bg-white rounded-lg border overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">📝 Notes</h2>
            <div className="flex space-x-2">
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <form onSubmit={handleCreateFolder}>
                    <DialogHeader>
                      <DialogTitle>Create New Folder</DialogTitle>
                      <DialogDescription>
                        Organize your notes into folders for better structure.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="folder-name">Folder Name</Label>
                        <Input
                          id="folder-name"
                          value={folderFormData.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFolderFormData((prev: CreateNotesFolderInput) => ({ 
                              ...prev, 
                              name: e.target.value 
                            }))
                          }
                          placeholder="My Project Notes"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateFolderOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Folder'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <form onSubmit={handleCreateNote}>
                    <DialogHeader>
                      <DialogTitle>Create New Note</DialogTitle>
                      <DialogDescription>
                        Add a new note {selectedFolder ? `to "${selectedFolder.name}" folder` : 'to your workspace'}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="note-title">Note Title</Label>
                        <Input
                          id="note-title"
                          value={noteFormData.title}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNoteFormData((prev: CreateNoteInput) => ({ 
                              ...prev, 
                              title: e.target.value 
                            }))
                          }
                          placeholder="Meeting Notes - Project Alpha"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="note-content">Content (Optional)</Label>
                        <Textarea
                          id="note-content"
                          value={noteFormData.content || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setNoteFormData((prev: CreateNoteInput) => ({
                              ...prev,
                              content: e.target.value || null
                            }))
                          }
                          placeholder="Start writing your note content..."
                          rows={10}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateNoteOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Note'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Folders */}
          <div className="p-3">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Folders
            </h3>
            <div className="space-y-1">
              <div
                className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                  !selectedFolder ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100'
                }`}
                onClick={() => {
                  setSelectedFolder(null);
                  loadNotes();
                }}
              >
                <StickyNote className="h-4 w-4 mr-2" />
                <span className="text-sm">All Notes</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {notes.filter(note => !note.folder_id).length}
                </Badge>
              </div>
              
              {folders.map((folder: NotesFolder) => (
                <div key={folder.id}>
                  <div
                    className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                      selectedFolder?.id === folder.id 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setSelectedFolder(folder);
                      loadNotes(folder.id);
                      toggleFolder(folder.id);
                    }}
                  >
                    {expandedFolders.has(folder.id) ? (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-1" />
                    )}
                    <Folder className="h-4 w-4 mr-2" />
                    <span className="text-sm flex-1 truncate">{folder.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {notes.filter(note => note.folder_id === folder.id).length}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Notes List */}
          <div className="flex-1 p-3 overflow-hidden">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              {selectedFolder ? `Notes in ${selectedFolder.name}` : 'Recent Notes'}
            </h3>
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {filteredNotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">
                      {searchQuery ? 'No notes match your search' : 'No notes yet'}
                    </p>
                  </div>
                ) : (
                  filteredNotes
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    .map(renderNote)
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Note Header */}
            <div className="p-6 border-b bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {selectedNote.title}
                  </h1>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>
                      Created {selectedNote.created_at.toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>
                      Updated {selectedNote.updated_at.toLocaleDateString()}
                    </span>
                    {selectedNote.folder_id && (
                      <>
                        <span>•</span>
                        <span>
                          In folder: {folders.find(f => f.id === selectedNote.folder_id)?.name || 'Unknown'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Note Content */}
            <div className="flex-1 p-6 overflow-auto">
              {selectedNote.content ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                    {selectedNote.content}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>This note is empty. Click Edit to add content.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <StickyNote className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to Notes
              </h2>
              <p className="text-gray-600 mb-6 max-w-sm">
                Select a note from the sidebar to view and edit it, or create a new note to get started.
              </p>
              <Button onClick={() => setIsCreateNoteOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}