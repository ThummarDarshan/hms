import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  FlaskConical,
  RefreshCw,
  User,
} from 'lucide-react';
import { laboratoryService, LabTestCatalog, CreateLabRequestData } from '@/services/laboratoryService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { useToast } from '@/hooks/use-toast';

interface SelectedTest {
  id: number;
  test_name: string;
  test_code: string;
  price: number;
  category: string;
}

export function LabRequestForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [tests, setTests] = useState<LabTestCatalog[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [formData, setFormData] = useState({
    patient: '',
    doctor: 'none',
    priority: 'NORMAL',
    clinical_notes: '',
  });
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [testsData, categoriesData, doctorsData, patientsData] = await Promise.all([
        laboratoryService.getActiveTests(),
        laboratoryService.getTestCategories(),
        doctorService.getDoctors(),
        patientService.getAll(),
      ]);
      setTests(testsData);
      setCategories(categoriesData);
      setDoctors(doctorsData);
      setAllPatients(patientsData);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    }
  };

  // Filter patients based on search input
  const filteredPatients = allPatients.filter((p: any) => {
    if (!patientSearch || patientSearch.length < 1) return true;
    const q = patientSearch.toLowerCase();
    const name = (p.user_name || p.user_details?.full_name || '').toLowerCase();
    const phone = (p.user_phone || p.user_details?.phone || '').toLowerCase();
    const uhid = (p.uhid || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || uhid.includes(q);
  });

  const handlePatientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatientSearch(e.target.value);
    setShowPatientDropdown(true);
    // If user clears input, deselect patient
    if (!e.target.value) {
      setFormData({ ...formData, patient: '' });
      setSelectedPatient(null);
    }
  };

  const selectPatient = (patient: any) => {
    setFormData({ ...formData, patient: patient.id.toString() });
    setPatientSearch(patient.user_name || patient.user_details?.full_name || `Patient #${patient.id}`);
    setSelectedPatient(patient);
    setShowPatientDropdown(false);
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.test_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || test.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const addTest = (test: LabTestCatalog) => {
    if (!selectedTests.find(t => t.id === test.id)) {
      setSelectedTests([...selectedTests, {
        id: test.id,
        test_name: test.test_name,
        test_code: test.test_code,
        price: parseFloat(String(test.price)) || 0,
        category: test.category,
      }]);
    }
  };

  const removeTest = (testId: number) => {
    setSelectedTests(selectedTests.filter(t => t.id !== testId));
  };

  const totalAmount = selectedTests.reduce((sum, test) => sum + test.price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient) {
      toast({
        title: 'Error',
        description: 'Please select a patient',
        variant: 'destructive',
      });
      return;
    }

    if (selectedTests.length === 0) {
      toast({
        title: 'Error', 
        description: 'Please select at least one test',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const data: CreateLabRequestData = {
        patient: parseInt(formData.patient),
        doctor: formData.doctor && formData.doctor !== 'none' ? parseInt(formData.doctor) : null,
        priority: formData.priority as any,
        clinical_notes: formData.clinical_notes,
        test_ids: selectedTests.map(t => t.id),
      };

      const response = await laboratoryService.createRequest(data);
      toast({ title: 'Lab request created successfully' });
      navigate(`/laboratory/requests/${response.id}`);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create lab request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      BLOOD: 'bg-red-100 text-red-800',
      URINE: 'bg-yellow-100 text-yellow-800',
      IMAGING: 'bg-blue-100 text-blue-800',
      CARDIO: 'bg-pink-100 text-pink-800',
      PATHOLOGY: 'bg-purple-100 text-purple-800',
      MICROBIOLOGY: 'bg-green-100 text-green-800',
      BIOCHEMISTRY: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Lab Request</h1>
          <p className="text-muted-foreground">Create a new laboratory test request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient & Request Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" /> Patient Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="patient">Search Patient *</Label>
                  <Input
                    id="patient"
                    value={patientSearch}
                    onChange={handlePatientSearchChange}
                    placeholder="Search by name, phone or UHID..."
                    onFocus={() => setShowPatientDropdown(true)}
                    onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                  />
                  {showPatientDropdown && filteredPatients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {filteredPatients.map((patient: any) => (
                        <div
                          key={patient.id}
                          className={`px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer border-b last:border-b-0 ${
                            selectedPatient?.id === patient.id ? 'bg-blue-50 dark:bg-blue-950' : ''
                          }`}
                          onMouseDown={() => selectPatient(patient)}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">
                              {patient.user_name || patient.user_details?.full_name || `Patient #${patient.id}`}
                            </p>
                            {patient.uhid && (
                              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full font-mono">
                                {patient.uhid}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {(patient.user_phone || patient.user_details?.phone) && (
                              <span>📞 {patient.user_phone || patient.user_details?.phone}</span>
                            )}
                            {patient.gender && (
                              <span>👤 {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</span>
                            )}
                            {patient.blood_group && (
                              <span className="text-red-600 font-medium">🩸 {patient.blood_group}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showPatientDropdown && patientSearch && filteredPatients.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
                      No patients found matching "{patientSearch}"
                    </div>
                  )}
                </div>

                {/* Selected Patient Info Card */}
                {selectedPatient && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">
                        {selectedPatient.user_name || selectedPatient.user_details?.full_name}
                      </p>
                      <button
                        type="button"
                        className="text-xs text-red-500 hover:text-red-700"
                        onClick={() => {
                          setSelectedPatient(null);
                          setFormData({ ...formData, patient: '' });
                          setPatientSearch('');
                        }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {selectedPatient.uhid && (
                        <span><strong>UHID:</strong> {selectedPatient.uhid}</span>
                      )}
                      {(selectedPatient.user_phone || selectedPatient.user_details?.phone) && (
                        <span><strong>Phone:</strong> {selectedPatient.user_phone || selectedPatient.user_details?.phone}</span>
                      )}
                      {selectedPatient.gender && (
                        <span><strong>Gender:</strong> {selectedPatient.gender === 'M' ? 'Male' : selectedPatient.gender === 'F' ? 'Female' : 'Other'}</span>
                      )}
                      {selectedPatient.blood_group && (
                        <span><strong>Blood:</strong> {selectedPatient.blood_group}</span>
                      )}
                      {selectedPatient.date_of_birth && (
                        <span><strong>DOB:</strong> {new Date(selectedPatient.date_of_birth).toLocaleDateString()}</span>
                      )}
                      {(selectedPatient.user_email || selectedPatient.user_details?.email) && (
                        <span><strong>Email:</strong> {selectedPatient.user_email || selectedPatient.user_details?.email}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="doctor">Referring Doctor</Label>
                  <select
                    id="doctor"
                    value={formData.doctor}
                    onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="none">None (Self-request)</option>
                    {doctors.map((doc: any) => (
                      <option key={doc.id} value={doc.id.toString()}>
                        Dr. {doc.user_name || doc.user_details?.full_name || doc.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinical_notes">Clinical Notes</Label>
                  <Textarea
                    id="clinical_notes"
                    value={formData.clinical_notes}
                    onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
                    placeholder="Relevant clinical history, symptoms, etc."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No tests selected
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedTests.map((test) => (
                      <div key={test.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{test.test_name}</p>
                          <p className="text-xs text-muted-foreground">{test.test_code}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">₹{test.price}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500"
                            onClick={() => removeTest(test.id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-lg">₹{totalAmount}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4 mr-2" /> Create Lab Request
                </>
              )}
            </Button>
          </div>

          {/* Right Column - Test Selection */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" /> Select Tests
                </CardTitle>
                <div className="flex flex-wrap gap-3 mt-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-2">
                  {filteredTests.map((test) => {
                    const isSelected = selectedTests.some(t => t.id === test.id);
                    return (
                      <div
                        key={test.id}
                        className={`p-3 border rounded-lg cursor-pointer transition ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:border-gray-300'
                        }`}
                        onClick={() => isSelected ? removeTest(test.id) : addTest(test)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm truncate">{test.test_name}</span>
                              <span className="font-semibold text-sm">₹{test.price}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground font-mono">{test.test_code}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${getCategoryBadge(test.category)}`}>
                                {test.category}
                              </span>
                            </div>
                            {test.sample_type && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Sample: {test.sample_type}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredTests.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No tests found matching your criteria
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

export default LabRequestForm;
