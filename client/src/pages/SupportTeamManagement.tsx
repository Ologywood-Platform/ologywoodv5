import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit2, Trash2, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  expertise: string[];
  activeTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  availabilityStart: string;
  availabilityEnd: string;
  isActive: boolean;
}

export default function SupportTeamManagement() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah@ologywood.com',
      role: 'Senior Support Specialist',
      expertise: ['Booking Issues', 'Payments', 'General Support'],
      activeTickets: 3,
      resolvedTickets: 127,
      avgResolutionTime: 4.2,
      availabilityStart: '09:00',
      availabilityEnd: '17:00',
      isActive: true,
    },
    {
      id: 2,
      name: 'Mike Chen',
      email: 'mike@ologywood.com',
      role: 'Technical Support Specialist',
      expertise: ['Technical Issues', 'Riders', 'API Integration'],
      activeTickets: 2,
      resolvedTickets: 89,
      avgResolutionTime: 5.1,
      availabilityStart: '10:00',
      availabilityEnd: '18:00',
      isActive: true,
    },
    {
      id: 3,
      name: 'Emma Davis',
      email: 'emma@ologywood.com',
      role: 'Support Specialist',
      expertise: ['Contracts', 'Disputes', 'General Support'],
      activeTickets: 4,
      resolvedTickets: 156,
      avgResolutionTime: 3.8,
      availabilityStart: '08:00',
      availabilityEnd: '16:00',
      isActive: true,
    },
  ]);

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    expertise: '',
    availabilityStart: '09:00',
    availabilityEnd: '17:00',
  });

  const handleAddMember = () => {
    if (!formData.name || !formData.email || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newMember: TeamMember = {
      id: Math.max(...teamMembers.map(m => m.id), 0) + 1,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      expertise: formData.expertise.split(',').map(e => e.trim()).filter(e => e),
      activeTickets: 0,
      resolvedTickets: 0,
      avgResolutionTime: 0,
      availabilityStart: formData.availabilityStart,
      availabilityEnd: formData.availabilityEnd,
      isActive: true,
    };

    setTeamMembers([...teamMembers, newMember]);
    setFormData({
      name: '',
      email: '',
      role: '',
      expertise: '',
      availabilityStart: '09:00',
      availabilityEnd: '17:00',
    });
    setIsAddingMember(false);
    toast.success('Team member added successfully');
  };

  const handleDeleteMember = (id: number) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      setTeamMembers(teamMembers.filter(m => m.id !== id));
      toast.success('Team member removed');
    }
  };

  const getPerformanceColor = (avgTime: number) => {
    if (avgTime < 4) return 'text-green-600';
    if (avgTime < 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalActiveTickets = teamMembers.reduce((sum, m) => sum + m.activeTickets, 0);
  const totalResolvedTickets = teamMembers.reduce((sum, m) => sum + m.resolvedTickets, 0);
  const avgResolutionTime = (teamMembers.reduce((sum, m) => sum + m.avgResolutionTime, 0) / teamMembers.length).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-900">Support Team Management</h1>
            </div>
            <Button onClick={() => setIsAddingMember(!isAddingMember)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Team Member
            </Button>
          </div>
          <p className="text-slate-600">Manage your support team, expertise areas, and availability</p>
        </div>

        {/* Team Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Active Tickets</p>
                <p className="text-3xl font-bold text-blue-600">{totalActiveTickets}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Resolved This Month</p>
                <p className="text-3xl font-bold text-green-600">{totalResolvedTickets}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Avg Resolution Time</p>
                <p className="text-3xl font-bold text-orange-600">{avgResolutionTime}h</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Member Form */}
        {isAddingMember && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Team Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                  placeholder="Role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
                <Input
                  placeholder="Expertise (comma-separated)"
                  value={formData.expertise}
                  onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                />
                <div>
                  <label className="text-sm font-medium">Availability Start</label>
                  <Input
                    type="time"
                    value={formData.availabilityStart}
                    onChange={(e) => setFormData({ ...formData, availabilityStart: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Availability End</label>
                  <Input
                    type="time"
                    value={formData.availabilityEnd}
                    onChange={(e) => setFormData({ ...formData, availabilityEnd: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddMember}>Add Member</Button>
                <Button variant="outline" onClick={() => setIsAddingMember(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members List */}
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{member.name}</h3>
                      <Badge variant={member.isActive ? 'default' : 'secondary'}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{member.role}</p>
                    <p className="text-sm text-slate-500">{member.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteMember(member.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Expertise */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Expertise</p>
                  <div className="flex flex-wrap gap-2">
                    {member.expertise.map((exp) => (
                      <Badge key={exp} variant="secondary">
                        {exp}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-slate-200">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Active Tickets</p>
                    <p className="text-lg font-semibold text-slate-900">{member.activeTickets}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Resolved</p>
                    <p className="text-lg font-semibold text-green-600">{member.resolvedTickets}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Avg Resolution
                    </p>
                    <p className={`text-lg font-semibold ${getPerformanceColor(member.avgResolutionTime)}`}>
                      {member.avgResolutionTime}h
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Availability</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {member.availabilityStart} - {member.availabilityEnd}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Message */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">Team Management Tips</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Set expertise areas to enable smart ticket routing</li>
                  <li>• Configure availability hours for accurate SLA tracking</li>
                  <li>• Monitor average resolution time to identify training needs</li>
                  <li>• Assign tickets based on expertise and current workload</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
