import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Plus,
  Eye,
  FileText,
  RefreshCw,
  Filter,
  Download,
  CheckCircle2
} from 'lucide-react';
import { laboratoryService, LabTestRequest } from '@/services/laboratoryService';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export function LabRequestList() {
  const [requests, setRequests] = useState<LabTestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      const data = await laboratoryService.getRequests(params);
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, priorityFilter]);

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await laboratoryService.updateRequestStatus(id, status);
      fetchRequests();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedRequests.length === 0) return;
    try {
      await laboratoryService.bulkUpdateStatus(selectedRequests, status);
      setSelectedRequests([]);
      fetchRequests();
    } catch (err) {
      console.error('Failed to bulk update:', err);
    }
  };

  const filteredRequests = requests.filter(request => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.patient_name?.toLowerCase().includes(searchLower) ||
      request.patient_uhid?.toLowerCase().includes(searchLower) ||
      String(request.id).includes(searchTerm)
    );
  });

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      NORMAL: 'secondary',
      URGENT: 'default',
      CRITICAL: 'destructive',
    };
    return <Badge variant={variants[priority] || 'outline'}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-blue-100 text-blue-800',
      SAMPLE_COLLECTED: 'bg-purple-100 text-purple-800',
      IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const toggleSelectRequest = (id: number) => {
    setSelectedRequests(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRequests.length === filteredRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(filteredRequests.map(r => r.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lab Test Requests</h1>
          <p className="text-muted-foreground">Manage laboratory test requests</p>
        </div>
        <Button onClick={() => navigate('/laboratory/requests/new')}>
          <Plus className="h-4 w-4 mr-2" /> New Request
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name, UHID, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="SAMPLE_COLLECTED">Sample Collected</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="flex h-10 w-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Priority</option>
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgent</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <Button variant="outline" onClick={fetchRequests}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRequests.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {selectedRequests.length} request(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('ACCEPTED')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Accept Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedRequests([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="py-3 px-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="py-3 px-4 text-left font-medium">Request ID</th>
                    <th className="py-3 px-4 text-left font-medium">Patient Info</th>
                    <th className="py-3 px-4 text-left font-medium">Doctor</th>
                    <th className="py-3 px-4 text-left font-medium">Tests</th>
                    <th className="py-3 px-4 text-left font-medium">Priority</th>
                    <th className="py-3 px-4 text-left font-medium">Status</th>
                    <th className="py-3 px-4 text-left font-medium">Amount</th>
                    <th className="py-3 px-4 text-left font-medium">Date</th>
                    <th className="py-3 px-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/laboratory/requests/${request.id}`)}
                    >
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRequests.includes(request.id)}
                          onChange={() => toggleSelectRequest(request.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm">LAB-{String(request.id).padStart(5, '0')}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{request.patient_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.patient_uhid} • {request.patient_age}Y • {request.patient_gender}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{request.doctor_name}</p>
                          <p className="text-sm text-muted-foreground">{request.doctor_department}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                          {request.tests_count} test{request.tests_count > 1 ? 's' : ''}
                        </span>
                        {request.has_abnormal_results && (
                          <Badge variant="destructive" className="ml-2 text-xs">Abnormal</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">{getPriorityBadge(request.priority)}</td>
                      <td className="py-3 px-4">{getStatusBadge(request.status)}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium">₹{request.final_amount?.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {format(new Date(request.request_date), 'dd MMM yyyy')}
                        <br />
                        <span className="text-xs">{format(new Date(request.request_date), 'hh:mm a')}</span>
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/laboratory/requests/${request.id}`)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === 'COMPLETED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/laboratory/reports/${request.id}`)}
                              title="View Report"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-muted-foreground">
                        No requests found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default LabRequestList;
