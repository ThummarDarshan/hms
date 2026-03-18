import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { laboratoryService, LabRequest } from '@/services/laboratoryService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { UploadCloud, CheckCircle2, UserCheck, Play, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const LabTechnicianDashboard = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<LabRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
    const [reportFile, setReportFile] = useState<File | null>(null);
    const [resultSummary, setResultSummary] = useState('');
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingRequest, setEditingRequest] = useState<LabRequest | null>(null);
    const [editFormData, setEditFormData] = useState({ notes: '', resultSummary: '', reportFile: null as File | null });
    const [editingReport, setEditingReport] = useState<any>(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await laboratoryService.getRequests();
            setRequests(data);
        } catch (error) {
            toast.error('Failed to load lab requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            await laboratoryService.updateRequestStatus(id, status);
            toast.success(`Status updated to ${status}`);
            fetchRequests();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleUploadReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest) return;

        try {
            const formData = new FormData();
            formData.append('lab_request', selectedRequest.id.toString());
            formData.append('result_summary', resultSummary);
            if (reportFile) {
                formData.append('report_file', reportFile);
            }

            await laboratoryService.uploadReport(formData);
            toast.success('Report uploaded successfully');
            setSelectedRequest(null);
            setReportFile(null);
            setResultSummary('');
            fetchRequests();
        } catch (error) {
            toast.error('Failed to upload report');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'REQUESTED': return 'bg-yellow-100 text-yellow-800';
            case 'VISITED': return 'bg-blue-100 text-blue-800';
            case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleRowClick = (req: LabRequest) => {
        if (req.status === 'COMPLETED') {
            navigate(`/laboratory/reports/${req.id}`);
            return;
        }

        if (req.status === 'IN_PROGRESS' || req.status === 'VISITED') {
            setSelectedRequest(req);
        }
    };

    const openEditDialog = async (req: LabRequest) => {
        setEditingRequest(req);
        setEditFormData({ 
            notes: req.notes || '', 
            resultSummary: '',
            reportFile: null
        });
        
        // If completed, fetch the report details
        if (req.status === 'COMPLETED' && req.reports && req.reports.length > 0) {
            setEditingReport(req.reports[0]);
            setEditFormData(prev => ({
                ...prev,
                resultSummary: req.reports[0].result_summary || ''
            }));
        } else {
            setEditingReport(null);
        }
        
        setIsEditDialogOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRequest) return;

        try {
            // Update request notes
            await laboratoryService.updateRequest(editingRequest.id, {
                notes: editFormData.notes,
            });
            
            // Update report if it exists and has changes
            if (editingReport && editingRequest.status === 'COMPLETED') {
                const reportFormData = new FormData();
                reportFormData.append('result_summary', editFormData.resultSummary);
                if (editFormData.reportFile) {
                    reportFormData.append('report_file', editFormData.reportFile);
                }
                await laboratoryService.updateReport(editingReport.id, reportFormData);
            }
            
            toast.success('Request updated successfully');
            setIsEditDialogOpen(false);
            setEditingRequest(null);
            setEditingReport(null);
            fetchRequests();
        } catch (error) {
            toast.error('Failed to update request');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {selectedRequest ? (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Upload Report for Request #{selectedRequest.id}</h2>
                        <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                    </div>

                    <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                        <p><strong>Patient:</strong> {selectedRequest.patient_details?.user_name}</p>
                        <p><strong>Test:</strong> {selectedRequest.test_details?.test_name}</p>
                        <p><strong>Requested By:</strong> Dr. {selectedRequest.doctor_details?.user_name}</p>
                    </div>

                    <form onSubmit={handleUploadReport} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Notes (Optional)</label>
                            <textarea
                                value={resultSummary}
                                onChange={(e) => setResultSummary(e.target.value)}
                                className="mt-1 w-full p-2 border rounded-md"
                                placeholder="Enter any notes..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Report File (Optional)</label>
                            <Input
                                type="file"
                                onChange={(e) => setReportFile(e.target.files ? e.target.files[0] : null)}
                                className="mt-1"
                            />
                        </div>
                        <Button type="submit" className="w-full sm:w-auto">
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Upload Report & Complete
                        </Button>
                    </form>
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-xl font-semibold">Lab Requests Queue</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-3 font-medium">ID</th>
                                    <th className="px-6 py-3 font-medium">Patient</th>
                                    <th className="px-6 py-3 font-medium">Test</th>
                                    <th className="px-6 py-3 font-medium">Doctor</th>
                                    <th className="px-6 py-3 font-medium">Test Price (₹)</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
                                ) : requests.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No pending lab requests found</td></tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr
                                            key={req.id}
                                            className="border-b border-border/50 hover:bg-muted/20 cursor-pointer"
                                            onClick={() => handleRowClick(req)}
                                        >
                                            <td className="px-6 py-4">#{req.id}</td>
                                            <td className="px-6 py-4 font-medium">{req.patient_details?.user_name}</td>
                                            <td className="px-6 py-4">{req.test_details?.test_name}</td>
                                            <td className="px-6 py-4">Dr. {req.doctor_details?.user_name}</td>
                                            <td className="px-6 py-4 font-semibold text-green-700">
                                                ₹ {req.test_details?.price ? parseFloat(String(req.test_details.price)).toFixed(2) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={getStatusColor(req.status)} variant="outline">
                                                    {req.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEditDialog(req); }}>
                                                        <Edit className="mr-1 h-3 w-3" /> Edit
                                                    </Button>
                                                    {req.status === 'REQUESTED' && (
                                                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req.id, 'VISITED'); }}>
                                                            <UserCheck className="mr-1 h-3 w-3" /> Mark Visited
                                                        </Button>
                                                    )}
                                                    {req.status === 'VISITED' && (
                                                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleStatusUpdate(req.id, 'IN_PROGRESS'); }}>
                                                            <Play className="mr-1 h-3 w-3" /> Start Test
                                                        </Button>
                                                    )}
                                                    {(req.status === 'IN_PROGRESS' || req.status === 'VISITED') && (
                                                        <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); }}>
                                                            <UploadCloud className="mr-1 h-3 w-3" /> Upload Report
                                                        </Button>
                                                    )}
                                                    {req.status === 'COMPLETED' && (
                                                        <span className="text-sm text-green-600 flex items-center justify-end">
                                                            <CheckCircle2 className="mr-1 h-4 w-4" /> Done
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Lab Request #{editingRequest?.id}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Patient</label>
                            <p className="mt-1 p-2 rounded border border-border bg-muted/30">{editingRequest?.patient_details?.user_name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Test</label>
                            <p className="mt-1 p-2 rounded border border-border bg-muted/30">{editingRequest?.test_details?.test_name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Doctor</label>
                            <p className="mt-1 p-2 rounded border border-border bg-muted/30">Dr. {editingRequest?.doctor_details?.user_name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Status</label>
                            <p className="mt-1 p-2 rounded border border-border bg-muted/30">{editingRequest?.status}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Notes</label>
                            <textarea
                                value={editFormData.notes}
                                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                className="mt-1 w-full p-2 border rounded-md"
                                placeholder="Enter notes..."
                                rows={3}
                            />
                        </div>

                        {editingRequest?.status === 'COMPLETED' && editingReport && (
                            <>
                                <div className="border-t border-border pt-4">
                                    <h3 className="font-semibold text-sm mb-3">Report Details</h3>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Result Summary</label>
                                    <textarea
                                        value={editFormData.resultSummary}
                                        onChange={(e) => setEditFormData({ ...editFormData, resultSummary: e.target.value })}
                                        className="mt-1 w-full p-2 border rounded-md"
                                        placeholder="Enter result summary..."
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Charge (₹) - Auto-calculated from Test Price</label>
                                    <div className="mt-1 w-full p-2 border rounded-md bg-muted/50 text-sm font-semibold text-green-700">
                                        ₹ {editingRequest?.test_details?.price ? parseFloat(String(editingRequest.test_details.price)).toFixed(2) : '0.00'}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Charge is automatically calculated from the test type and cannot be manually changed.</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Report File</label>
                                    <Input
                                        type="file"
                                        onChange={(e) => setEditFormData({ ...editFormData, reportFile: e.target.files ? e.target.files[0] : null })}
                                        className="mt-1"
                                    />
                                    {editingReport.report_file && (
                                        <p className="text-xs text-muted-foreground mt-1">Current: {editingReport.report_file.split('/').pop()}</p>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="flex gap-2 pt-2">
                            <Button type="submit" className="flex-1">
                                Save Changes
                            </Button>
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
