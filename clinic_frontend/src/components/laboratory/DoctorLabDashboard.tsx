import { useState, useEffect } from 'react';
import { laboratoryService, LabRequest } from '@/services/laboratoryService';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const DoctorLabDashboard = () => {
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
                <h2 className="text-xl font-semibold">Tests requested by you</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 font-medium">Test Name</th>
                            <th className="px-6 py-3 font-medium">Patient</th>
                            <th className="px-6 py-3 font-medium">Date Requested</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No lab tests requested yet</td></tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id} className="border-b border-border/50 hover:bg-muted/20">
                                    <td className="px-6 py-4 font-medium">{req.test_details?.test_name}</td>
                                    <td className="px-6 py-4">{req.patient_details?.user?.first_name} {req.patient_details?.user?.last_name}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{format(new Date(req.requested_at), 'PPPp')}</td>
                                    <td className="px-6 py-4">
                                        <Badge className={getStatusColor(req.status)} variant="outline">
                                            {req.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 truncate max-w-xs">{req.notes || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
