import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  FlaskConical
} from 'lucide-react';
import { laboratoryService, LabTestCatalog } from '@/services/laboratoryService';
import { useToast } from '@/hooks/use-toast';

export function LabTestCatalogList() {
  const [tests, setTests] = useState<LabTestCatalog[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTestCatalog | null>(null);
  const [formData, setFormData] = useState({
    test_name: '',
    category: 'BLOOD',
    description: '',
    normal_range_min: '',
    normal_range_max: '',
    normal_range_text: '',
    unit: '',
    price: '',
    sample_type: '',
    preparation_instructions: '',
    turnaround_time: '',
    status: 'ACTIVE',
  });
  const { toast } = useToast();

  const fetchTests = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await laboratoryService.getTestCatalog(params);
      setTests(data);
    } catch (err) {
      console.error('Failed to fetch tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await laboratoryService.getTestCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchTests();
    fetchCategories();
  }, [categoryFilter, statusFilter]);

  const handleOpenModal = (test?: LabTestCatalog) => {
    if (test) {
      setEditingTest(test);
      setFormData({
        test_name: test.test_name,
        category: test.category,
        description: test.description || '',
        normal_range_min: test.normal_range_min?.toString() || '',
        normal_range_max: test.normal_range_max?.toString() || '',
        normal_range_text: test.normal_range_text || '',
        unit: test.unit || '',
        price: test.price.toString(),
        sample_type: test.sample_type || '',
        preparation_instructions: test.preparation_instructions || '',
        turnaround_time: test.turnaround_time || '',
        status: test.status,
      });
    } else {
      setEditingTest(null);
      setFormData({
        test_name: '',
        category: 'BLOOD',
        description: '',
        normal_range_min: '',
        normal_range_max: '',
        normal_range_text: '',
        unit: '',
        price: '',
        sample_type: '',
        preparation_instructions: '',
        turnaround_time: '',
        status: 'ACTIVE',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const data: any = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        normal_range_min: formData.normal_range_min ? parseFloat(formData.normal_range_min) : null,
        normal_range_max: formData.normal_range_max ? parseFloat(formData.normal_range_max) : null,
      };

      if (editingTest) {
        await laboratoryService.updateTest(editingTest.id, data);
        toast({ title: 'Test updated successfully' });
      } else {
        await laboratoryService.createTest(data);
        toast({ title: 'Test created successfully' });
      }

      setIsModalOpen(false);
      fetchTests();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to save test',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this test?')) return;
    
    try {
      await laboratoryService.deleteTest(id);
      toast({ title: 'Test deleted successfully' });
      fetchTests();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete test',
        variant: 'destructive',
      });
    }
  };

  const filteredTests = tests.filter(test => {
    const searchLower = searchTerm.toLowerCase();
    return (
      test.test_name.toLowerCase().includes(searchLower) ||
      test.test_code.toLowerCase().includes(searchLower) ||
      test.description?.toLowerCase().includes(searchLower)
    );
  });

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      BLOOD: 'bg-red-100 text-red-800',
      URINE: 'bg-yellow-100 text-yellow-800',
      IMAGING: 'bg-blue-100 text-blue-800',
      CARDIO: 'bg-pink-100 text-pink-800',
      PATHOLOGY: 'bg-purple-100 text-purple-800',
      MICROBIOLOGY: 'bg-green-100 text-green-800',
      BIOCHEMISTRY: 'bg-orange-100 text-orange-800',
      SEROLOGY: 'bg-indigo-100 text-indigo-800',
      HORMONE: 'bg-cyan-100 text-cyan-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };
    const label = categories.find(c => c.value === category)?.label || category;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[category] || 'bg-gray-100 text-gray-800'}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lab Test Catalog</h1>
          <p className="text-muted-foreground">Manage available laboratory tests</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" /> Add Test
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
                  placeholder="Search tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchTests}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tests Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map((test) => (
            <Card key={test.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base">{test.test_name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">{test.test_code}</p>
                    </div>
                  </div>
                  <Badge variant={test.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {test.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    {getCategoryBadge(test.category)}
                    <span className="font-bold text-lg">₹{test.price}</span>
                  </div>
                  
                  {test.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{test.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {test.sample_type && (
                      <div>
                        <span className="text-muted-foreground">Sample: </span>
                        <span>{test.sample_type}</span>
                      </div>
                    )}
                    {test.turnaround_time && (
                      <div>
                        <span className="text-muted-foreground">TAT: </span>
                        <span>{test.turnaround_time}</span>
                      </div>
                    )}
                  </div>

                  {(test.normal_range_min !== null || test.normal_range_text) && (
                    <div className="text-sm bg-muted/50 p-2 rounded">
                      <span className="text-muted-foreground">Normal Range: </span>
                      {test.normal_range_min !== null && test.normal_range_max !== null ? (
                        <span>{test.normal_range_min} - {test.normal_range_max} {test.unit}</span>
                      ) : (
                        <span>{test.normal_range_text}</span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenModal(test)}
                    >
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(test.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredTests.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No tests found matching your criteria
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTest ? 'Edit Test' : 'Add New Test'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test_name">Test Name *</Label>
                <Input
                  id="test_name"
                  value={formData.test_name}
                  onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                  placeholder="Complete Blood Count"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the test..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="mg/dL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sample_type">Sample Type</Label>
                <Input
                  id="sample_type"
                  value={formData.sample_type}
                  onChange={(e) => setFormData({ ...formData, sample_type: e.target.value })}
                  placeholder="Blood (EDTA)"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="normal_range_min">Normal Range Min</Label>
                <Input
                  id="normal_range_min"
                  type="number"
                  step="0.01"
                  value={formData.normal_range_min}
                  onChange={(e) => setFormData({ ...formData, normal_range_min: e.target.value })}
                  placeholder="70"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="normal_range_max">Normal Range Max</Label>
                <Input
                  id="normal_range_max"
                  type="number"
                  step="0.01"
                  value={formData.normal_range_max}
                  onChange={(e) => setFormData({ ...formData, normal_range_max: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="normal_range_text">Or Text Range</Label>
                <Input
                  id="normal_range_text"
                  value={formData.normal_range_text}
                  onChange={(e) => setFormData({ ...formData, normal_range_text: e.target.value })}
                  placeholder="Negative"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="turnaround_time">Turnaround Time</Label>
                <Input
                  id="turnaround_time"
                  value={formData.turnaround_time}
                  onChange={(e) => setFormData({ ...formData, turnaround_time: e.target.value })}
                  placeholder="4-6 hours"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preparation_instructions">Preparation Instructions</Label>
              <Textarea
                id="preparation_instructions"
                value={formData.preparation_instructions}
                onChange={(e) => setFormData({ ...formData, preparation_instructions: e.target.value })}
                placeholder="Fasting for 8-12 hours required..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingTest ? 'Update Test' : 'Add Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LabTestCatalogList;
