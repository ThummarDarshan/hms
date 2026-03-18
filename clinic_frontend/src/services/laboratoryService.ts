import api from './api';

export interface LabTestType {
    id: number;
    test_name: string;
    description: string;
    price: string;
    created_at: string;
}

export interface LabRequest {
    id: number;
    patient: number;
    doctor: number;
    appointment: number | null;
    test: number;
    status: 'REQUESTED' | 'VISITED' | 'IN_PROGRESS' | 'COMPLETED';
    notes: string;
    requested_at: string;
    patient_details?: any;
    doctor_details?: any;
    appointment_details?: any;
    test_details?: LabTestType;
    reports?: any[];
}

export interface LabReport {
    id: number;
    lab_request: number;
    report_file: string | null;
    result_summary: string;
    charge: number | null;
    technician: number | null;
    uploaded_at: string;
    lab_request_details?: LabRequest;
    technician_details?: any;
}

// Helper to extract results from paginated responses
const extractResults = (data: any): any[] => {
    if (Array.isArray(data)) {
        return data;
    }
    if (data && data.results && Array.isArray(data.results)) {
        return data.results;
    }
    return [];
};

const isRetryableLabError = (error: any): boolean => {
    const status = error?.response?.status;
    const code = error?.code;
    return status === 502 || status === 503 || status === 504 || code === 'ECONNABORTED' || !error?.response;
};

const fetchLabListWithRetry = async (url: string, retries = 1) => {
    try {
        const response = await api.get(url, { timeout: 30000 });
        return extractResults(response.data);
    } catch (error) {
        if (retries > 0 && isRetryableLabError(error)) {
            return fetchLabListWithRetry(url, retries - 1);
        }
        throw error;
    }
};

export const laboratoryService = {
    // Lab Test Types
    getTestTypes: async () => {
        const response = await api.get('/laboratory/test-types/');
        return extractResults(response.data);
    },
    createTestType: async (data: Partial<LabTestType>) => {
        const response = await api.post('/laboratory/test-types/', data);
        return response.data;
    },
    updateTestType: async (id: number, data: Partial<LabTestType>) => {
        const response = await api.put(`/laboratory/test-types/${id}/`, data);
        return response.data;
    },
    deleteTestType: async (id: number) => {
        const response = await api.delete(`/laboratory/test-types/${id}/`);
        return response.data;
    },

    // Lab Requests
    getRequests: async () => {
        return fetchLabListWithRetry('/laboratory/requests/');
    },
    createRequest: async (data: Partial<LabRequest>) => {
        const response = await api.post('/laboratory/requests/', data);
        return response.data;
    },
    updateRequest: async (id: number, data: Partial<LabRequest>) => {
        const response = await api.patch(`/laboratory/requests/${id}/`, data);
        return response.data;
    },
    updateRequestStatus: async (id: number, status: string) => {
        const response = await api.patch(`/laboratory/requests/${id}/update_status/`, { status });
        return response.data;
    },

    // Lab Reports
    getReports: async () => {
        return fetchLabListWithRetry('/laboratory/reports/');
    },
    uploadReport: async (data: FormData) => {
        const response = await api.post('/laboratory/reports/', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
    updateReport: async (id: number, data: FormData) => {
        const response = await api.patch(`/laboratory/reports/${id}/`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
