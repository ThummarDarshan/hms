import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  DollarSign,
  Calendar,
  Stethoscope,
} from 'lucide-react';
import { Doctor } from '@/services/doctorService';
import { formatCurrency, getInitials } from '@/utils/helpers';
import { ROLES } from '@/utils/constants';

interface DoctorCardProps {
  doctor: Doctor;
  userRole?: string;
}

// Memoized DoctorCard to prevent unnecessary re-renders
const DoctorCard: React.FC<DoctorCardProps> = React.memo(({ doctor, userRole }) => {
  const navigate = useNavigate();

  const handleBookAppointment = () => {
    navigate('/appointments/new', { state: { doctorId: doctor.id } });
  };

  return (
    <div className="glass-card rounded-2xl p-6 card-hover transition-all">
      {/* Avatar & Name */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary text-lg font-bold text-primary-foreground">
            {getInitials(doctor.user_name || 'Dr')}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Dr. {doctor.user_name || `Doctor #${doctor.id}`}
            </h3>
            <p className="text-sm text-primary font-medium">{doctor.specialization}</p>
          </div>
        </div>
        {doctor.is_available && (
          <span className="badge badge-approved shadow-sm shadow-success/20">Available</span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-muted-foreground group/item">
          <div className="p-2 rounded-full bg-primary/5 text-primary group-hover/item:bg-primary/10 transition-colors">
            <Stethoscope className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">{doctor.department_name || 'General'}</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground group/item">
          <div className="p-2 rounded-full bg-primary/5 text-primary group-hover/item:bg-primary/10 transition-colors">
            <Clock className="h-4 w-4" />
          </div>
          <span className="text-sm">{doctor.experience_years} years experience</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground group/item">
          <div className="p-2 rounded-full bg-primary/5 text-primary group-hover/item:bg-primary/10 transition-colors">
            <DollarSign className="h-4 w-4" />
          </div>
          <span className="text-sm">{formatCurrency(doctor.consultation_fee)}</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground group/item">
          <div className="p-2 rounded-full bg-warning/5 text-warning group-hover/item:bg-warning/10 transition-colors">
            <Star className="h-4 w-4 fill-warning" />
          </div>
          <span className="text-sm">4.8 (120 reviews)</span>
        </div>
      </div>

      {/* Bio */}
      {doctor.bio && (
        <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
          {doctor.bio}
        </p>
      )}

      {/* Actions */}
      {userRole === ROLES.PATIENT && (
        <div className="flex gap-3">
          <button
            onClick={handleBookAppointment}
            className="btn-gradient flex-1 text-sm py-2 hover:shadow-lg transition-shadow"
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            Book Appointment
          </button>
        </div>
      )}
    </div>
  );
});

DoctorCard.displayName = 'DoctorCard';

export default DoctorCard;
