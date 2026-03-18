import { lazy, Suspense, ReactNode } from 'react';
import { PageLoader } from '@/components/common/Loader';

// Lazy loading wrapper with fallback
export const lazyLoad = (importFunc: () => Promise<any>, namedExport?: string) => {
  return lazy(() =>
    importFunc().then(module => ({
      default: namedExport ? module[namedExport] : module.default,
    }))
  );
};

// Suspense boundary component
interface LazyBoundaryProps {
  children: ReactNode;
}

export const LazyBoundary: React.FC<LazyBoundaryProps> = ({ children }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
);

// Common lazy-loaded components
export const LazyDoctorList = lazyLoad(() => import('@/components/doctors/DoctorList'));
export const LazyPatientList = lazyLoad(() => import('@/components/patients/PatientList'));
export const LazyAppointmentList = lazyLoad(() => import('@/components/appointments/AppointmentList'));
export const LazyBillingList = lazyLoad(() => import('@/components/billing/BillingList'));
export const LazyBedList = lazyLoad(() => import('@/components/beds/BedList'));
export const LazyLaboratoryDashboard = lazyLoad(() => import('@/components/laboratory/AdminLabDashboard'));
