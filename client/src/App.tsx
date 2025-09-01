import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { Building, Users, BookOpen, FileText, StickyNote, Settings } from 'lucide-react';

// Import components
import { OrganizationManager } from './components/OrganizationManager';
import { TeamManager } from './components/TeamManager';
import { LmsManager } from './components/LmsManager';
import { BlogManager } from './components/BlogManager';
import { NotesManager } from './components/NotesManager';

// Import types
import type { Organization } from '../../server/src/schema';

function App() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  const loadOrganizations = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getOrganizations.query();
      setOrganizations(result);
      
      // Auto-select first organization if available
      if (result.length > 0 && !selectedOrganization) {
        setSelectedOrganization(result[0]);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrganization]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const handleOrganizationCreated = (newOrganization: Organization) => {
    setOrganizations((prev: Organization[]) => [...prev, newOrganization]);
    setSelectedOrganization(newOrganization);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Building className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Enterprise Platform</h1>
                {selectedOrganization && (
                  <p className="text-sm text-gray-500">{selectedOrganization.name}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {organizations.length > 0 && (
                <select
                  value={selectedOrganization?.id || ''}
                  onChange={(e) => {
                    const org = organizations.find(o => o.id === parseInt(e.target.value));
                    setSelectedOrganization(org || null);
                  }}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {organizations.map((org: Organization) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              )}
              <OrganizationManager 
                organizations={organizations}
                onOrganizationCreated={handleOrganizationCreated}
                onOrganizationsChanged={loadOrganizations}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {organizations.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Enterprise Platform</h2>
            <p className="text-gray-600 mb-6">
              Get started by creating your first organization to manage LMS, Blogs, and Notes.
            </p>
            <OrganizationManager 
              organizations={organizations}
              onOrganizationCreated={handleOrganizationCreated}
              onOrganizationsChanged={loadOrganizations}
              triggerButton={
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  <Building className="h-5 w-5 mr-2" />
                  Create Your First Organization
                </Button>
              }
            />
          </div>
        ) : selectedOrganization ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Team</span>
              </TabsTrigger>
              <TabsTrigger value="lms" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>LMS</span>
              </TabsTrigger>
              <TabsTrigger value="blog" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Blog</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center space-x-2">
                <StickyNote className="h-4 w-4" />
                <span>Notes</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Organization</CardTitle>
                    <Building className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedOrganization.name}</div>
                    <p className="text-xs opacity-80">
                      Created {selectedOrganization.created_at.toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                    <Users className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs opacity-80">Active users</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">LMS Instances</CardTitle>
                    <BookOpen className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs opacity-80">Learning systems</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Blog Instances</CardTitle>
                    <FileText className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs opacity-80">Blog systems</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                  <CardDescription>
                    Information about your organization and recent activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-lg font-semibold">{selectedOrganization.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Slug</label>
                      <p className="text-lg font-mono bg-gray-100 px-2 py-1 rounded">
                        {selectedOrganization.slug}
                      </p>
                    </div>
                  </div>
                  {selectedOrganization.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <p className="text-gray-800">{selectedOrganization.description}</p>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Created: {selectedOrganization.created_at.toLocaleDateString()}</span>
                    <span>Updated: {selectedOrganization.updated_at.toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team">
              <TeamManager organizationId={selectedOrganization.id} />
            </TabsContent>

            <TabsContent value="lms">
              <LmsManager organizationId={selectedOrganization.id} />
            </TabsContent>

            <TabsContent value="blog">
              <BlogManager organizationId={selectedOrganization.id} />
            </TabsContent>

            <TabsContent value="notes">
              <NotesManager organizationId={selectedOrganization.id} />
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                  <CardDescription>
                    Manage your organization settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Organization settings coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}
      </main>
    </div>
  );
}

export default App;