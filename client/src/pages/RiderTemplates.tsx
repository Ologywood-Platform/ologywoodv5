import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../_core/hooks/useAuth';
import { trpc } from '../lib/trpc';
import { RyderContractForm } from '../components/RyderContractForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertCircle, Edit2, Trash2, Plus, Download } from 'lucide-react';

interface RiderTemplate {
  id: number;
  artistId: number | null;
  templateName: string | null;
  templateData: Record<string, any> | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export function RiderTemplates() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [riders, setRiders] = useState<RiderTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch rider templates
  const { data: riderData, isLoading: riderLoading, refetch } = trpc.rider.getMyTemplates.useQuery(
    undefined,
    { enabled: !!user && user.role === 'artist' }
  );

  // Create/Update rider mutation
  const createRiderMutation = trpc.rider.createTemplate.useMutation();
  const updateRiderMutation = trpc.rider.updateTemplate.useMutation();
  const deleteRiderMutation = trpc.rider.deleteTemplate.useMutation();

  // Role check
  useEffect(() => {
    if (!loading && user && user.role !== 'artist') {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Update riders when data changes
  useEffect(() => {
    if (riderData) {
      setRiders(riderData);
    }
  }, [riderData]);

  if (loading || riderLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rider templates...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'artist') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>This page is only for artists.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateRider = async (formData: any) => {
    setIsLoading(true);
    try {
      await createRiderMutation.mutateAsync({
        templateName: formData.templateName,
        templateData: formData,
      });
      setShowForm(false);
      refetch();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRider = async (formData: any) => {
    if (!editingId) return;
    setIsLoading(true);
    try {
      await updateRiderMutation.mutateAsync({
        templateId: editingId,
        templateName: formData.templateName,
        templateData: formData,
      });
      setEditingId(null);
      setShowForm(false);
      refetch();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRider = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rider template?')) {
      return;
    }
    try {
      await deleteRiderMutation.mutateAsync({ templateId: id });
      refetch();
    } catch (error) {
    }
  };

  const handleDownloadRider = (rider: RiderTemplate) => {
    const content = JSON.stringify(rider.templateData, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `${rider.templateName}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Rider Templates</h1>
          <p className="text-gray-600">Create and manage your performance requirements</p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base">What is a Rider?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700">
            <p>
              A rider is a document that outlines your technical requirements, hospitality needs, and equipment for performances.
              Create templates to quickly share your requirements with venues and streamline the booking process.
            </p>
          </CardContent>
        </Card>

        {/* Show Form or List */}
        {showForm ? (
          <div className="mb-6">
            <Button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              variant="outline"
              className="mb-4"
            >
              ← Back to Templates
            </Button>
            <RyderContractForm
              onSubmit={editingId ? handleUpdateRider : handleCreateRider}
              initialData={editingId ? (riders.find(r => r.id === editingId)?.templateData || undefined) : undefined}
              isLoading={isLoading}
              isEditing={!!editingId}
            />
          </div>
        ) : (
          <>
            {/* Create Button */}
            <div className="mb-6">
              <Button
                onClick={() => {
                  setEditingId(null);
                  setShowForm(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New Rider Template
              </Button>
            </div>

            {/* Riders List */}
            {riders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No rider templates yet</p>
                    <Button
                      onClick={() => setShowForm(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Create Your First Rider
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {riders.map((rider) => (
                  <Card key={rider.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{rider.templateName || 'Unnamed Rider'}</CardTitle>
                      <CardDescription>
                        {rider.templateData?.performanceType || 'Performance'} •{' '}
                        {rider.updatedAt ? new Date(rider.updatedAt).toLocaleDateString() : 'Recently created'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4 text-sm">
                        {rider.templateData?.performanceDuration && (
                          <div>
                            <span className="text-gray-600">Duration:</span>{' '}
                            <span className="font-medium">{rider.templateData.performanceDuration}</span>
                          </div>
                        )}
                        {rider.templateData?.numPerformers && (
                          <div>
                            <span className="text-gray-600">Performers:</span>{' '}
                            <span className="font-medium">{rider.templateData.numPerformers}</span>
                          </div>
                        )}
                        {rider.templateData?.touringPartySize && (
                          <div>
                            <span className="text-gray-600">Touring Party:</span>{' '}
                            <span className="font-medium">{rider.templateData.touringPartySize}</span>
                          </div>
                        )}
                        {rider.templateData?.stageSize && (
                          <div>
                            <span className="text-gray-600">Stage Size:</span>{' '}
                            <span className="font-medium">{rider.templateData.stageSize}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setEditingId(rider.id);
                            setShowForm(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1 flex items-center gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDownloadRider(rider)}
                          variant="outline"
                          size="sm"
                          className="flex-1 flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          onClick={() => handleDeleteRider(rider.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
