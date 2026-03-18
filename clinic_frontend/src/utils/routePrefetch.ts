type PrefetchFn = () => Promise<unknown>;

const prefetchModuleData: Record<string, PrefetchFn> = {
  '/beds': async () => {
    const { bedService } = await import('@/services/bedService');
    await Promise.allSettled([
      bedService.getWards(),
      bedService.getBeds(),
      bedService.getBedRequests(),
    ]);
  },
  '/laboratory': async () => {
    const { laboratoryService } = await import('@/services/laboratoryService');
    const { patientService } = await import('@/services/patientService');
    const { doctorService } = await import('@/services/doctorService');
    await Promise.allSettled([
      laboratoryService.getTestTypes(),
      laboratoryService.getRequests(),
      laboratoryService.getReports(),
      patientService.getAll(),
      doctorService.getAll(),
    ]);
  },
  '/records': async () => {
    const { recordService } = await import('@/services/recordService');
    await Promise.allSettled([
      recordService.getAll(),
    ]);
  },
  '/billing': async () => {
    const { billingService } = await import('@/services/billingService');
    await Promise.allSettled([
      billingService.getAll(),
    ]);
  },
};

const routePrefetchers: Record<string, PrefetchFn> = {
  '/dashboard': () => import('@/components/dashboard/Dashboard'),
  '/appointments': () => Promise.all([
    import('@/components/appointments/AppointmentList'),
    import('@/components/appointments/AppointmentDetail'),
    import('@/components/appointments/AppointmentForm'),
  ]),
  '/patients': () => Promise.all([
    import('@/components/patients/PatientList'),
    import('@/components/patients/PatientDetail'),
    import('@/components/patients/PatientForm'),
  ]),
  '/doctors': () => Promise.all([
    import('@/components/doctors/DoctorList'),
    import('@/components/doctors/DoctorForm'),
  ]),
  '/departments': () => import('@/components/departments/DepartmentList'),
  '/beds': () => import('@/components/beds/BedDashboard'),
  '/laboratory': () => Promise.all([
    import('@/components/laboratory/LabDashboard'),
    import('@/components/laboratory/LabReportDetail'),
  ]),
  '/records': () => Promise.all([
    import('@/components/records/PrescriptionList'),
    import('@/components/records/PrescriptionDetail'),
  ]),
  '/billing': () => Promise.all([
    import('@/components/billing/BillingList'),
    import('@/components/billing/BillingDetail'),
    import('@/components/billing/BillingForm'),
  ]),
  '/notifications': () => import('@/components/notifications/NotificationList'),
  '/support': () => import('@/components/support/SupportList'),
};

const prefetched = new Set<string>();

export const prefetchRoute = (path: string): void => {
  if (prefetched.has(path)) {
    return;
  }

  const fn = routePrefetchers[path];
  if (!fn) {
    return;
  }

  prefetched.add(path);
  Promise.allSettled([
    fn(),
    prefetchModuleData[path]?.(),
  ]).then((results) => {
    const [routeResult] = results;
    if (routeResult.status === 'rejected') {
      prefetched.delete(path);
    }
  }).catch(() => {
    prefetched.delete(path);
  });
};
