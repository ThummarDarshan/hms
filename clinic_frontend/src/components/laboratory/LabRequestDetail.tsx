import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  FileText,
  FlaskConical,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Printer,
  Save,
} from 'lucide-react';
import { laboratoryService, LabTestRequest, LabTestResult } from '@/services/laboratoryService';
import { useToast } from '@/hooks/use-toast';

interface ResultFormData {
  request_item: number;
  test_catalog: number;
  result_value: string;
  result_text: string;
  interpretation: string;
  remarks: string;
}

export function LabRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<LabTestRequest | null>(null);
  const [results, setResults] = useState<LabTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [currentTestId, setCurrentTestId] = useState<number | null>(null);
  const [currentTestName, setCurrentTestName] = useState<string>('');
  const [resultFormData, setResultFormData] = useState<ResultFormData>({
    request_item: 0,
    test_catalog: 0,
    result_value: '',
    result_text: '',
    interpretation: 'NORMAL',
    remarks: '',
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchRequest = async () => {
    if (!id || isNaN(Number(id))) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await laboratoryService.getRequest(Number(id));
      setRequest(data);
    } catch (err) {
      console.error('Failed to fetch request:', err);
      toast({
        title: 'Error',
        description: 'Failed to load request details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const data = await laboratoryService.getResults({ request_id: Number(id) });
      setResults(data);
    } catch (err) {
      console.error('Failed to fetch results:', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRequest();
      fetchResults();
    }
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!request) return;
    try {
      await laboratoryService.updateRequestStatus(request.id, newStatus);
      toast({ title: `Status updated to ${newStatus}` });
      fetchRequest();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const openResultModal = (itemId: number, testId: number, testName: string) => {
    const existingResult = results.find(r => r.request_item === itemId);
    
    if (existingResult) {
      setResultFormData({
        request_item: itemId,
        test_catalog: testId,
        result_value: existingResult.result_value || '',
        result_text: existingResult.result_text || '',
        interpretation: existingResult.interpretation || 'NORMAL',
        remarks: existingResult.remarks || '',
      });
    } else {
      setResultFormData({
        request_item: itemId,
        test_catalog: testId,
        result_value: '',
        result_text: '',
        interpretation: 'NORMAL',
        remarks: '',
      });
    }
    
    setCurrentItemId(itemId);
    setCurrentTestId(testId);
    setCurrentTestName(testName);
    setIsResultModalOpen(true);
  };

  const handleSaveResult = async () => {
    if (!currentItemId) return;
    
    setSaving(true);
    try {
      const existingResult = results.find(r => r.request_item === currentItemId);
      
      const data = {
        request_item: resultFormData.request_item,
        test_catalog: resultFormData.test_catalog,
        result_value: resultFormData.result_value || null,
        result_text: resultFormData.result_text || null,
        interpretation: resultFormData.interpretation,
        remarks: resultFormData.remarks || null,
      };

      if (existingResult) {
        await laboratoryService.updateResult(existingResult.id, data);
        toast({ title: 'Result updated successfully' });
      } else {
        await laboratoryService.createResult(data);
        toast({ title: 'Result saved successfully' });
      }

      setIsResultModalOpen(false);
      fetchResults();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save result',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      PENDING: { variant: 'outline', icon: Clock },
      SAMPLE_COLLECTED: { variant: 'secondary', icon: FlaskConical },
      IN_PROGRESS: { variant: 'default', icon: RefreshCw },
      COMPLETED: { variant: 'default', icon: CheckCircle },
      CANCELLED: { variant: 'destructive', icon: AlertTriangle },
    };
    const { variant, icon: Icon } = config[status] || config.PENDING;
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      ROUTINE: 'bg-gray-100 text-gray-800',
      URGENT: 'bg-orange-100 text-orange-800',
      STAT: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[priority] || colors.ROUTINE}`}>
        {priority}
      </span>
    );
  };

  const getResultForItem = (itemId: number) => {
    return results.find(r => r.request_item === itemId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Request not found</p>
        <Button variant="link" onClick={() => navigate('/laboratory/requests')}>
          Go back to requests
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">LAB-{String(request.id).padStart(5, '0')}</h1>
              {getStatusBadge(request.status)}
              {getPriorityBadge(request.priority)}
            </div>
            <p className="text-muted-foreground">
              Requested on {new Date(request.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          {request.status === 'COMPLETED' && (
            <Button onClick={() => navigate(`/laboratory/reports/${request.id}`)}>
              <FileText className="h-4 w-4 mr-2" /> View Report
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Request Info */}
        <div className="space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" /> Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{request.patient_name || 'N/A'}</p>
                {request.patient_phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-4 w-4" /> {request.patient_phone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Referring Doctor</p>
                  <p className="font-medium">{request.doctor_name || 'Self'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Case Type</p>
                  <p className="font-medium">{request.case_type || 'OPD'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-medium text-lg">₹{request.total_amount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Collected At</p>
                  <p className="font-medium">
                    {request.sample_collection_date
                      ? new Date(request.sample_collection_date).toLocaleString()
                      : 'Not yet'}
                  </p>
                </div>
              </div>
              {request.clinical_notes && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-sm">Clinical Notes</p>
                  <p className="text-sm">{request.clinical_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={request.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="PENDING">Pending</option>
                <option value="SAMPLE_COLLECTED">Sample Collected</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tests & Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" /> Tests & Results
              </CardTitle>
              <CardDescription>
                {request.items?.length || 0} tests in this request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {request.items?.map((item: any) => {
                  const result = getResultForItem(item.id);
                  return (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {item.test_name}
                            {result && (
                              <Badge 
                                variant={result.is_abnormal ? 'destructive' : 'default'}
                                className="text-xs"
                              >
                                {result.is_abnormal ? 'Abnormal' : 'Normal'}
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {item.test_code} | {item.category}
                          </p>
                          <p className="text-sm">₹{item.price}</p>
                        </div>
                        <Button
                          size="sm"
                          variant={result ? 'outline' : 'default'}
                          onClick={() => openResultModal(item.id, item.test_catalog, item.test_name)}
                        >
                          {result ? 'Edit Result' : 'Enter Result'}
                        </Button>
                      </div>

                      {result && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Result Value</p>
                              <p className={`font-medium ${result.is_abnormal ? 'text-red-600' : ''}`}>
                                {result.result_value} {result.unit}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Normal Range</p>
                              <p>{result.normal_range || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Interpretation</p>
                              <p className="font-medium">{result.interpretation}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Verified</p>
                              <p>{result.is_verified ? 'Yes' : 'No'}</p>
                            </div>
                          </div>
                          {result.remarks && (
                            <div>
                              <p className="text-muted-foreground text-sm">Remarks</p>
                              <p className="text-sm">{result.remarks}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {(!request.items || request.items.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No tests in this request
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Result Entry Modal */}
      <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enter Result: {currentTestName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="result_value">Numeric Result</Label>
                <Input
                  id="result_value"
                  value={resultFormData.result_value}
                  onChange={(e) => setResultFormData({ ...resultFormData, result_value: e.target.value })}
                  placeholder="95.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="result_text">Text Result</Label>
                <Input
                  id="result_text"
                  value={resultFormData.result_text}
                  onChange={(e) => setResultFormData({ ...resultFormData, result_text: e.target.value })}
                  placeholder="Negative"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interpretation">Interpretation</Label>
              <select
                id="interpretation"
                value={resultFormData.interpretation}
                onChange={(e) => setResultFormData({ ...resultFormData, interpretation: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="NORMAL">Normal</option>
                <option value="ABNORMAL_HIGH">Abnormal - High</option>
                <option value="ABNORMAL_LOW">Abnormal - Low</option>
                <option value="CRITICAL_HIGH">Critical - High</option>
                <option value="CRITICAL_LOW">Critical - Low</option>
                <option value="INCONCLUSIVE">Inconclusive</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={resultFormData.remarks}
                onChange={(e) => setResultFormData({ ...resultFormData, remarks: e.target.value })}
                placeholder="Additional notes or observations..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResultModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveResult} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save Result
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LabRequestDetail;
