import { useState, useEffect } from 'react';
import { laboratoryService, LabTestType, LabRequest, LabReport } from '@/services/laboratoryService';
import { patientService, Patient } from '@/services/patientService';
import { doctorService, Doctor } from '@/services/doctorService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, DownloadCloud, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const AdminLabDashboard = () => {
    const [activeTab, setActiveTab] = useState('tests');
    const [testTypes, setTestTypes] = useState<LabTestType[]>([]);
    const [requests, setRequests] = useState<LabRequest[]>([]);
    const [reports, setReports] = useState<LabReport[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<Partial<LabTestType>>({ test_name: '', description: '', price: '' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isTestTypeDialogOpen, setIsTestTypeDialogOpen] = useState(false);
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isPatientDetailOpen, setIsPatientDetailOpen] = useState(false);
    const [requestFormData, setRequestFormData] = useState({
        patient: '',
        doctor: '',
        test: '',
        notes: '',
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [typesRes, reqRes, repRes, patientRes, doctorRes] = await Promise.allSettled([
                laboratoryService.getTestTypes(),
                laboratoryService.getRequests(),
                laboratoryService.getReports(),
                patientService.getAll(),
                doctorService.getAll(),
            ]);

            setTestTypes(typesRes.status === 'fulfilled' ? typesRes.value : []);
            setRequests(reqRes.status === 'fulfilled' ? reqRes.value : []);
            setReports(repRes.status === 'fulfilled' ? repRes.value : []);
            setPatients(patientRes.status === 'fulfilled' ? patientRes.value : []);
            setDoctors(doctorRes.status === 'fulfilled' ? doctorRes.value : []);

            const failedSources: string[] = [];
            if (typesRes.status === 'rejected') failedSources.push('Test Types');
            if (reqRes.status === 'rejected') failedSources.push('Requests');
            if (repRes.status === 'rejected') failedSources.push('Reports');
            if (patientRes.status === 'rejected') failedSources.push('Patients');
            if (doctorRes.status === 'rejected') failedSources.push('Doctors');

            if (failedSources.length > 0) {
                console.error('Laboratory dashboard partial load failure:', {
                    testTypes: typesRes.status === 'rejected' ? typesRes.reason : null,
                    requests: reqRes.status === 'rejected' ? reqRes.reason : null,
                    reports: repRes.status === 'rejected' ? repRes.reason : null,
                    patients: patientRes.status === 'rejected' ? patientRes.reason : null,
                    doctors: doctorRes.status === 'rejected' ? doctorRes.reason : null,
                });
                toast.warning(`Some laboratory data could not load: ${failedSources.join(', ')}`);
            }
        } catch (error) {
            toast.error('Failed to load lab data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchTestTypes = async () => {
        const typesData = await laboratoryService.getTestTypes();
        setTestTypes(typesData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await laboratoryService.updateTestType(editingId, formData);
                toast.success('Lab Test Type updated');
            } else {
                await laboratoryService.createTestType(formData);
                toast.success('Lab Test Type created');
            }
            setFormData({ test_name: '', description: '', price: '' });
            setEditingId(null);
            setIsTestTypeDialogOpen(false);
            fetchTestTypes();
        } catch (error) {
            toast.error('Failed to save Lab Test Type');
        }
    };

    const openCreateTestTypeDialog = () => {
        setEditingId(null);
        setFormData({ test_name: '', description: '', price: '' });
        setIsTestTypeDialogOpen(true);
    };

    const openEditTestTypeDialog = (test: LabTestType) => {
        setEditingId(test.id);
        setFormData(test);
        setIsTestTypeDialogOpen(true);
    };

    const openPatientDetail = (patient: Patient) => {
        setSelectedPatient(patient);
        setIsPatientDetailOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this test type?')) return;
        try {
            await laboratoryService.deleteTestType(id);
            toast.success('Test deleted successfully');
            fetchTestTypes();
        } catch (error) {
            toast.error('Failed to delete test');
        }
    };

    const handleDownload = async (fileUrl: string) => {
        try {
            const currentHost = window.location.hostname;
            const backendBase =
                currentHost === 'localhost' || currentHost === '127.0.0.1'
                    ? 'http://localhost:8000'
                    : `http://${currentHost}:8000`;

            const isAbsoluteUrl = /^https?:\/\//i.test(fileUrl);
            let normalizedPath = fileUrl.trim();

            if (!isAbsoluteUrl) {
                if (!normalizedPath.startsWith('/')) {
                    normalizedPath = normalizedPath.startsWith('media/')
                        ? `/${normalizedPath}`
                        : `/media/lab_reports/${normalizedPath}`;
                }
            }

            const resolvedUrl = new URL(isAbsoluteUrl ? fileUrl : normalizedPath, backendBase);
            if (
                (resolvedUrl.hostname === 'localhost' || resolvedUrl.hostname === '127.0.0.1') &&
                currentHost !== 'localhost' &&
                currentHost !== '127.0.0.1'
            ) {
                resolvedUrl.hostname = currentHost;
                resolvedUrl.port = '8000';
            }

            // Fetch the file and force download
            const response = await fetch(resolvedUrl.toString());
            if (!response.ok) throw new Error('Failed to download file');

            const blob = await response.blob();
            const fileName = resolvedUrl.pathname.split('/').pop() || 'lab_report.pdf';

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download report');
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

    const goToAddReportFlow = () => {
        setActiveTab('requests');
        toast.info('Select a request and click Add Report');
    };

    const openRequestDialog = () => {
        setRequestFormData({
            patient: '',
            doctor: '',
            test: '',
            notes: '',
        });
        setIsRequestDialogOpen(true);
    };

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!requestFormData.patient || !requestFormData.doctor || !requestFormData.test) {
            toast.error('Please select patient, doctor, and test');
            return;
        }

        try {
            await laboratoryService.createRequest({
                patient: Number(requestFormData.patient),
                doctor: Number(requestFormData.doctor),
                test: Number(requestFormData.test),
                notes: requestFormData.notes,
            });

            toast.success('Lab entry created and sent to lab technician queue');
            setIsRequestDialogOpen(false);
            setActiveTab('requests');
            fetchData();
        } catch (error) {
            toast.error('Failed to create lab entry');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="tests">Test Types</TabsTrigger>
                    <TabsTrigger value="requests">Lab Requests</TabsTrigger>
                    <TabsTrigger value="reports">Lab Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="tests">
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">Available Lab Tests</h2>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" onClick={goToAddReportFlow}>
                                            <UploadCloud className="mr-2 h-4 w-4" /> Add Patient Report
                                        </Button>
                                        <Button onClick={openCreateTestTypeDialog}>
                                            <Plus className="mr-2 h-4 w-4" /> Add Test Type
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-0">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Name</th>
                                            <th className="px-6 py-3 font-medium">Price</th>
                                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={3} className="text-center py-8">Loading...</td></tr>
                                        ) : testTypes.length === 0 ? (
                                            <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">No lab test types defined</td></tr>
                                        ) : (
                                            testTypes.map((test) => (
                                                <tr key={test.id} className="border-b border-border/50 hover:bg-muted/20 odd:bg-background even:bg-muted/10">
                                                    <td className="px-6 py-4 font-medium">{test.test_name}</td>
                                                    <td className="px-6 py-4">₹{test.price}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => openEditTestTypeDialog(test)}>
                                                            <Edit className="h-4 w-4 text-blue-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(test.id)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                    </div>

                    <Dialog open={isTestTypeDialogOpen} onOpenChange={setIsTestTypeDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Edit' : 'Add'} Lab Test Type</DialogTitle>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Test Name</label>
                                    <Input
                                        value={formData.test_name || ''}
                                        onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                                        required
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Price (₹)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.price || ''}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        required
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Description</label>
                                    <Input
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="submit" className="w-full">
                                        {editingId ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                                        {editingId ? 'Update' : 'Add'} Test Type
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => {
                                            setIsTestTypeDialogOpen(false);
                                            setEditingId(null);
                                            setFormData({ test_name: '', description: '', price: '' });
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                <TabsContent value="requests">
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">All Lab Requests</h2>
                                <Button onClick={openRequestDialog}>
                                    <Plus className="mr-2 h-4 w-4" /> New Patient Lab Entry
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">ID</th>
                                        <th className="px-6 py-3 font-medium">Patient</th>
                                        <th className="px-6 py-3 font-medium">Test</th>
                                        <th className="px-6 py-3 font-medium">Doctor</th>
                                        <th className="px-6 py-3 font-medium">Date</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
                                    ) : requests.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No lab requests found</td></tr>
                                    ) : (
                                        requests.map((req) => (
                                            <tr 
                                                key={req.id} 
                                                onClick={() => req.patient_details && openPatientDetail(req.patient_details as unknown as Patient)}
                                                className="border-b border-border/50 hover:bg-muted/20 odd:bg-background even:bg-muted/10 cursor-pointer transition-colors"
                                            >
                                                <td className="px-6 py-4">#{req.id}</td>
                                                <td className="px-6 py-4 font-medium">{req.patient_details?.user_name}</td>
                                                <td className="px-6 py-4">{req.test_details?.test_name}</td>
                                                <td className="px-6 py-4">Dr. {req.doctor_details?.user_name}</td>
                                                <td className="px-6 py-4 text-muted-foreground">{format(new Date(req.requested_at), 'PPPp')}</td>
                                                <td className="px-6 py-4">
                                                    <Badge className={getStatusColor(req.status)} variant="outline">
                                                        {req.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {req.reports && req.reports.length > 0 ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const reportFileUrl = req.reports?.[0]?.report_file;
                                                                if (reportFileUrl) {
                                                                    handleDownload(reportFileUrl);
                                                                }
                                                            }}
                                                        >
                                                            <DownloadCloud className="mr-2 h-4 w-4" /> Download
                                                        </Button>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">No report yet</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Patient Lab Entry</DialogTitle>
                            </DialogHeader>

                            <form onSubmit={handleCreateRequest} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Patient</label>
                                    <select
                                        value={requestFormData.patient}
                                        onChange={(e) => setRequestFormData({ ...requestFormData, patient: e.target.value })}
                                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        required
                                    >
                                        <option value="">Select patient</option>
                                        {patients.map((patient) => (
                                            <option key={patient.id} value={patient.id}>
                                                {patient.user_name || `Patient #${patient.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Referring Doctor</label>
                                    <select
                                        value={requestFormData.doctor}
                                        onChange={(e) => setRequestFormData({ ...requestFormData, doctor: e.target.value })}
                                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        required
                                    >
                                        <option value="">Select doctor</option>
                                        {doctors.map((doctor) => (
                                            <option key={doctor.id} value={doctor.id}>
                                                Dr. {doctor.user_name || `Doctor #${doctor.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Test Type</label>
                                    <select
                                        value={requestFormData.test}
                                        onChange={(e) => setRequestFormData({ ...requestFormData, test: e.target.value })}
                                        className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        required
                                    >
                                        <option value="">Select test</option>
                                        {testTypes.map((testType) => (
                                            <option key={testType.id} value={testType.id}>
                                                {testType.test_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Notes (Optional)</label>
                                    <textarea
                                        value={requestFormData.notes}
                                        onChange={(e) => setRequestFormData({ ...requestFormData, notes: e.target.value })}
                                        className="mt-1 w-full p-2 border rounded-md"
                                        placeholder="Any notes for lab technician..."
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button type="submit" className="w-full">
                                        <Plus className="mr-2 h-4 w-4" /> Create Entry
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setIsRequestDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                <TabsContent value="reports">
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-semibold">All Lab Reports</h2>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Report ID</th>
                                        <th className="px-6 py-3 font-medium">Test Name</th>
                                        <th className="px-6 py-3 font-medium">Patient</th>
                                        <th className="px-6 py-3 font-medium">Uploaded By</th>
                                        <th className="px-6 py-3 font-medium">Uploaded At</th>
                                        <th className="px-6 py-3 font-medium">Charge (₹)</th>
                                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
                                    ) : reports.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No lab reports found</td></tr>
                                    ) : (
                                        reports.map((report) => (
                                            <tr key={report.id} className="border-b border-border/50 hover:bg-muted/20 odd:bg-background even:bg-muted/10">
                                                <td className="px-6 py-4">#{report.id}</td>
                                                <td className="px-6 py-4 font-medium">{report.lab_request_details?.test_details?.test_name}</td>
                                                <td className="px-6 py-4">{report.lab_request_details?.patient_details?.user_name}</td>
                                                <td className="px-6 py-4 font-medium">{report.technician_details?.full_name || `${report.technician_details?.first_name} ${report.technician_details?.last_name}`}</td>
                                                <td className="px-6 py-4 text-muted-foreground">{format(new Date(report.uploaded_at), 'PPPp')}</td>
                                                <td className="px-6 py-4 font-semibold text-green-700">₹ {parseFloat(String(report.lab_request_details?.test_details?.price || 0)).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    {report.report_file ? (
                                                        <Button size="sm" variant="outline" onClick={() => handleDownload(report.report_file as string)}>
                                                            <DownloadCloud className="mr-2 h-4 w-4" /> Download
                                                        </Button>
                                                    ) : (
                                                        <Badge variant="secondary">Done (No file)</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
