import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User,
    Calendar,
    Phone,
    Droplet,
    MapPin,
    Clock,
    ArrowLeft,
    FileText,
    AlertCircle,
    Edit,
    Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/common/Loader';
import { ConfirmModal } from '@/components/common/Modal';
import { patientService, Patient } from '@/services/patientService';
import { laboratoryService, LabReport } from '@/services/laboratoryService';
import { calculateAge, formatDate, getInitials } from '@/utils/helpers';
import { ROLES, GENDERS } from '@/utils/constants';
import { toast } from '@/hooks/use-toast';
import { DownloadCloud, FlaskConical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const PatientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [labReports, setLabReports] = useState<LabReport[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);

    useEffect(() => {
        const fetchPatientAndReports = async () => {
            if (!id) return;
            try {
                const data = await patientService.getById(parseInt(id));
                setPatient(data);

                setLoadingReports(true);
                const reportsData = await laboratoryService.getReports();
                // Alternatively you could fetch with query param backend
                const filtered = reportsData.filter((r: any) => r.lab_request_details?.patient === parseInt(id));
                setLabReports(filtered);
            } catch (error) {
                console.error('Failed to fetch patient:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load patient details',
                });
                navigate('/patients');
            } finally {
                setIsLoading(false);
                setLoadingReports(false);
            }
        };

        fetchPatientAndReports();
    }, [id, navigate]);

    const handleDelete = async () => {
        if (!patient) return;
        setIsDeleting(true);
        try {
            await patientService.delete(patient.id);
            toast({
                title: 'Deleted',
                description: 'Patient record has been deleted',
            });
            navigate('/patients');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete patient',
            });
            setShowDeleteModal(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.STAFF;

    if (isLoading) return <PageLoader />;
    if (!patient) return null;

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/patients')}
                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-muted-foreground" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground">Patient Details</h1>
                    <p className="text-muted-foreground">View patient information</p>
                </div>
                {canManage && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/patients/${patient.id}/edit`)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors text-foreground font-medium"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors text-foreground font-medium"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </button>
                    </div>
                )}
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                {/* Banner/Profile Header */}
                <div className="bg-primary/5 p-8 border-b border-border">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="h-24 w-24 rounded-2xl gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
                            {getInitials(patient.user_name || 'Patient')}
                        </div>
                        <div className="text-center sm:text-left space-y-2">
                            <h2 className="text-3xl font-bold text-foreground">{patient.user_name}</h2>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {calculateAge(patient.date_of_birth)} years old
                                </span>
                                <span className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {GENDERS.find(g => g.value === patient.gender)?.label || patient.gender}
                                </span>
                                {patient.blood_group && (
                                    <span className="flex items-center gap-1 text-red-500 font-medium bg-red-500/10 px-2 py-0.5 rounded-md">
                                        <Droplet className="h-4 w-4" />
                                        {patient.blood_group}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Personal Information
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                                <div className="p-3 rounded-lg border border-border bg-background text-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {formatDate(patient.date_of_birth)}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                                <div className="p-3 rounded-lg border border-border bg-background text-foreground flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {patient.user_phone || 'Not provided'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                                <div className="p-3 rounded-lg border border-border bg-background text-foreground flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                    {patient.emergency_contact || 'Not provided'}
                                </div>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">Address</p>
                                <div className="p-3 rounded-lg border border-border bg-background text-foreground flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    {patient.address}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border" />

                    {/* Medical Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Medical Information
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Medical History</p>
                                <div className="p-4 rounded-xl bg-muted/30 text-foreground min-h-[100px] text-sm leading-relaxed">
                                    {patient.medical_history || <span className="text-muted-foreground italic">No medical history recorded.</span>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    Allergies
                                    {patient.allergies && <AlertCircle className="h-4 w-4 text-destructive" />}
                                </p>
                                <div className={`p-4 rounded-xl text-foreground min-h-[100px] text-sm leading-relaxed ${patient.allergies ? 'bg-destructive/5 border border-destructive/20' : 'bg-muted/30'}`}>
                                    {patient.allergies || <span className="text-muted-foreground italic">No allergies recorded.</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border" />

                    {/* Laboratory Reports */}
                    {user?.role !== ROLES.STAFF && (
                        <div>
                            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <FlaskConical className="h-5 w-5 text-primary" />
                                Laboratory Reports
                            </h3>
                            <div className="glass-card rounded-2xl overflow-hidden border border-border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Test Name</th>
                                            <th className="px-6 py-3 font-medium">Date Uploaded</th>
                                            <th className="px-6 py-3 font-medium">Status & Notes</th>
                                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingReports ? (
                                            <tr><td colSpan={4} className="text-center py-6">Loading...</td></tr>
                                        ) : labReports.length === 0 ? (
                                            <tr><td colSpan={4} className="text-center py-6 text-muted-foreground border-t border-border/50">No lab reports found.</td></tr>
                                        ) : (
                                            labReports.map((report) => (
                                                <tr key={report.id} className="border-t border-border/50 hover:bg-muted/20">
                                                    <td className="px-6 py-4 font-medium">{report.lab_request_details?.test_details?.test_name}</td>
                                                    <td className="px-6 py-4 text-muted-foreground">{formatDate(report.uploaded_at)}</td>
                                                    <td className="px-6 py-4 truncate max-w-[200px]" title={report.result_summary}>{report.result_summary}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        {report.report_file ? (
                                                            <Button size="sm" variant="outline" onClick={() => window.open(report.report_file as string, '_blank')}>
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
                    )}

                    <div className="border-t border-border pt-4">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Patient record created on {formatDate(patient.created_at)}
                        </p>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Patient"
                message="Are you sure you want to delete this patient record? This action cannot be undone."
                confirmText="Yes, Delete"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
};
