import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/utils/constants';
import { LabTechnicianDashboard } from './LabTechnicianDashboard';
import { PatientLabReports } from './PatientLabReports';
import { AdminLabDashboard } from './AdminLabDashboard';
import { DoctorLabDashboard } from './DoctorLabDashboard';
import { LayoutDashboard } from 'lucide-react';

export const LabDashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Laboratory Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage lab tests, requests, and reports.
          </p>
        </div>
      </div>

      {user.role === ROLES.ADMIN || user.role === ROLES.STAFF ? (
        <AdminLabDashboard />
      ) : user.role === ROLES.LAB_TECHNICIAN ? (
        <LabTechnicianDashboard />
      ) : user.role === ROLES.DOCTOR ? (
        <DoctorLabDashboard />
      ) : user.role === ROLES.PATIENT ? (
        <PatientLabReports />
      ) : null}
    </div>
  );
};
