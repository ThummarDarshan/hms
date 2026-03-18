import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ArrowLeft, DownloadCloud, FileText } from 'lucide-react';
import { laboratoryService, LabRequest, LabReport } from '@/services/laboratoryService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const LabReportDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState<LabRequest | null>(null);
    const [report, setReport] = useState<LabReport | null>(null);

    useEffect(() => {
        const requestId = Number(id);
        if (!requestId || Number.isNaN(requestId)) {
            toast.error('Invalid lab request ID');
            navigate('/laboratory');
            return;
        }

        const fetchDetail = async () => {
            try {
                setLoading(true);
                const [requests, reports] = await Promise.all([
                    laboratoryService.getRequests(),
                    laboratoryService.getReports(),
                ]);

                const matchedRequest = requests.find((req) => req.id === requestId) || null;
                if (!matchedRequest) {
                    toast.error('Lab request not found');
                    navigate('/laboratory');
                    return;
                }

                const requestReport = matchedRequest.reports && matchedRequest.reports.length > 0
                    ? (matchedRequest.reports[0] as LabReport)
                    : null;

                const matchedReport = requestReport || reports.find((rep) => rep.lab_request === requestId) || null;

                setRequest(matchedRequest);
                setReport(matchedReport);
            } catch (error) {
                toast.error('Failed to load lab report details');
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id, navigate]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'REQUESTED': return 'bg-yellow-100 text-yellow-800';
            case 'VISITED': return 'bg-blue-100 text-blue-800';
            case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleDownload = async () => {
        if (!report?.report_file) return;

        try {
            const fileUrl = report.report_file;
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

    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <p className="text-sm text-muted-foreground">Loading report details...</p>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <p className="text-sm text-muted-foreground">Lab request not found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => navigate('/laboratory')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Laboratory
                </Button>
                <Badge className={getStatusColor(request.status)} variant="outline">
                    {request.status}
                </Badge>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold">Lab Report for Request #{request.id}</h2>
                        <p className="text-sm text-muted-foreground">
                            Requested on {format(new Date(request.requested_at), 'PPPp')}
                        </p>
                    </div>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <p className="text-sm text-muted-foreground">Patient</p>
                        <p className="font-medium">
                            {request.patient_details?.user_name}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Doctor</p>
                        <p className="font-medium">
                            Dr. {request.doctor_details?.user_name}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Test</p>
                        <p className="font-medium">{request.test_details?.test_name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Uploaded At</p>
                        <p className="font-medium">
                            {report?.uploaded_at ? format(new Date(report.uploaded_at), 'PPPp') : '-'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Charge</p>
                        <p className="font-medium text-green-700">
                            ₹ {request.test_details?.price ? parseFloat(String(request.test_details.price)).toFixed(2) : '0.00'}
                        </p>
                    </div>
                </div>

                <div>
                    <p className="text-sm text-muted-foreground mb-1">Result Summary</p>
                    <p className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
                        {report?.result_summary?.trim() || 'No summary provided.'}
                    </p>
                </div>

                <div className="pt-2">
                    {report?.report_file ? (
                        <Button onClick={handleDownload}>
                            <DownloadCloud className="mr-2 h-4 w-4" /> Download Report File
                        </Button>
                    ) : (
                        <Badge variant="secondary">No report file uploaded</Badge>
                    )}
                </div>
            </div>
        </div>
    );
};
