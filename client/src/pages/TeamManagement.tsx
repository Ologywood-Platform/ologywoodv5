import { useState } from 'react';
import { ArrowLeft, Users, Mail, Shield, UserPlus, Trash2, Clock, Crown, UserCheck, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export function TeamManagement() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'team_member'>('team_member');

  const { data: members, refetch: refetchMembers } = trpc.team.getMembers.useQuery();
  const { data: pendingInvitations, refetch: refetchInvitations } = trpc.team.getPendingInvitations.useQuery();
  const { data: activityLog } = trpc.team.getActivityLog.useQuery({ limit: 10 });

  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: () => {
      toast.success('Invitation sent!');
      setShowInviteModal(false);
      setInviteEmail('');
      refetchInvitations();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const removeMutation = trpc.team.removeMember.useMutation({
    onSuccess: () => {
      toast.success('Team member removed');
      refetchMembers();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateRoleMutation = trpc.team.updateRole.useMutation({
    onSuccess: () => {
      toast.success('Role updated');
      refetchMembers();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const cancelInviteMutation = trpc.team.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success('Invitation cancelled');
      refetchInvitations();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
            <Crown className="h-3 w-3" /> Owner
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <Shield className="h-3 w-3" /> Manager
          </span>
        );
      case 'team_member':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <UserCheck className="h-3 w-3" /> Team Member
          </span>
        );
      default:
        return null;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'team_member_invited': return 'Invited a team member';
      case 'team_member_joined': return 'Joined the team';
      case 'team_member_removed': return 'Removed a team member';
      case 'team_member_role_updated': return 'Updated a role';
      case 'profile_edited': return 'Edited the profile';
      case 'booking_accepted': return 'Accepted a booking';
      case 'media_uploaded': return 'Uploaded media';
      default: return action.replace(/_/g, ' ');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-gray-100">Team Management</h1>
              <p className="text-sm text-slate-600 dark:text-gray-400">Invite and manage your team's access</p>
            </div>
          </div>
          <Button onClick={() => setShowInviteModal(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Invite</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        {/* Helper Note */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <strong>How it works:</strong> Invite your manager, videographer, or other team members by email. 
            They'll get their own login and can help manage your profile based on the role you assign.
          </p>
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              {members?.length || 0} member{(members?.length || 0) !== 1 ? 's' : ''} with access to your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(!members || members.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No team members yet</p>
                <p className="text-sm mt-1">Invite your manager or team to help manage your profile</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {member.userAvatar ? (
                        <img src={member.userAvatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-primary">
                            {(member.userName || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{member.userName}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getRoleBadge(member.role)}
                      {member.role !== 'owner' && (
                        <div className="flex items-center gap-1">
                          <select
                            value={member.role}
                            onChange={(e) => updateRoleMutation.mutate({ memberId: member.id, role: e.target.value as 'manager' | 'team_member' })}
                            className="text-xs border rounded px-1.5 py-1 bg-background"
                          >
                            <option value="manager">Manager</option>
                            <option value="team_member">Team Member</option>
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Remove ${member.userName} from your team?`)) {
                                removeMutation.mutate({ memberId: member.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {pendingInvitations && pendingInvitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-5 w-5" />
                Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingInvitations.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {invite.role === 'manager' ? 'Manager' : 'Team Member'} · Expires {new Date(invite.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive flex-shrink-0"
                      onClick={() => cancelInviteMutation.mutate({ invitationId: invite.id })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role Permissions Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role Permissions</CardTitle>
            <CardDescription>What each role can do</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Manager</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ Edit profile & bio</li>
                  <li>✓ Accept/decline bookings</li>
                  <li>✓ Send messages</li>
                  <li>✓ Manage calendar</li>
                  <li>✓ Upload media</li>
                  <li>✓ View earnings</li>
                  <li>✗ Manage team members</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">Team Member</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ Upload media</li>
                  <li>✗ Edit profile</li>
                  <li>✗ Manage bookings</li>
                  <li>✗ Send messages</li>
                  <li>✗ View earnings</li>
                  <li>✗ Manage team</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        {activityLog && activityLog.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activityLog.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary/50 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{log.userName}</span>{' '}
                        <span className="text-muted-foreground">{getActionLabel(log.action)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Invite Team Member</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowInviteModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="team@example.com"
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  They'll receive an email invitation to join your team
                </p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInviteRole('manager')}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      inviteRole === 'manager'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Manager</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Full access except team management</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteRole('team_member')}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      inviteRole === 'team_member'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Team Member</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Upload media only</p>
                  </button>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleInvite}
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
