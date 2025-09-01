import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { UserPlus, Users, Mail, Shield, Calendar } from 'lucide-react';
import type { CreateUserInput, OrganizationUser } from '../../../server/src/schema';

interface TeamManagerProps {
  organizationId: number;
}



export function TeamManager({ organizationId }: TeamManagerProps) {
  const [teamMembers, setTeamMembers] = useState<OrganizationUser[]>([]);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  
  const [newUserForm, setNewUserForm] = useState<CreateUserInput>({
    email: '',
    name: '',
    password: ''
  });



  const loadTeamMembers = useCallback(async () => {
    try {
      const members = await trpc.getOrganizationUsers.query({ organizationId });
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  }, [organizationId]);

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const newUser = await trpc.createUser.mutate(newUserForm);
      
      // Automatically add the new user to the organization
      await trpc.createOrganizationUser.mutate({
        organization_id: organizationId,
        user_id: newUser.id,
        role: 'member'
      });
      
      await loadTeamMembers();
      setNewUserForm({ email: '', name: '', password: '' });
      setIsCreateUserOpen(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'destructive';
      case 'member': return 'secondary';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return '👑';
      case 'admin': return '🛡️';
      case 'member': return '👤';
      case 'viewer': return '👁️';
      default: return '👤';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-600">Manage users and their permissions within your organization</p>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Create & Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleCreateUser}>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account and add them to your organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserForm.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewUserForm((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newUserForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewUserForm((prev: CreateUserInput) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUserForm.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewUserForm((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateUserOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create & Add User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Team Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owners</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(member => member.role === 'owner').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(member => member.role === 'admin').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(member => member.role === 'member').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage user roles and permissions within your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-600 mb-4">
                Start building your team by creating and adding users to your organization.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member: OrganizationUser) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {member.user_id.toString().slice(-2)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">User #{member.user_id}</div>
                          <div className="text-sm text-gray-500">
                            <Mail className="h-3 w-3 inline mr-1" />
                            user{member.user_id}@example.com
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">
                        <span className="mr-1">{getRoleIcon(member.role)}</span>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {member.created_at.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {member.updated_at.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}