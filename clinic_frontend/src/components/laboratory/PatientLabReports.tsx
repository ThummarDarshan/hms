import { useState, useEffect } from 'react';
import { laboratoryService, LabRequest } from '@/services/laboratoryService';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DownloadCloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const PatientLabReports = () => {
    const [requests, setRequests] = useState<LabRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const data = await laboratoryService.getRequests();
                setRequests(data);
            } catch (error) {
                toast.error('Failed to load lab requests');
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

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

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold">My Laboratory Tests</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 font-medium">Test Name</th>
                            <th className="px-6 py-3 font-medium">Requested By</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium">Charge (₹)</th>
                            <th className="px-6 py-3 font-medium text-right">Report</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No laboratory tests found</td></tr>
                        ) : (
                            requests.map((req) => {
                                const report = req.reports && req.reports.length > 0 ? req.reports[0] : null;

                                return (
                                    <tr key={req.id} className="border-b border-border/50 hover:bg-muted/20">
                                        <td className="px-6 py-4 font-medium">{req.test_details?.test_name}</td>
                                        <td className="px-6 py-4">Dr. {req.doctor_details?.user_name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{format(new Date(req.requested_at), 'PPPp')}</td>
                                        <td className="px-6 py-4">
                                            <Badge className={getStatusColor(req.status)} variant="outline">
                                                {req.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-green-700">
                                            ₹ {req.test_details?.price ? parseFloat(String(req.test_details.price)).toFixed(2) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'COMPLETED' ? (
                                                report?.report_file ? (
                                                    <Button size="sm" variant="outline" onClick={() => handleDownload(report.report_file as string)}>
                                                        <DownloadCloud className="mr-2 h-4 w-4" /> Download
                                                    </Button>
                                                ) : (
                                                    <Badge variant="secondary">Done (No file)</Badge>
                                                )
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
