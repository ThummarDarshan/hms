import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, Activity, ChevronDown, ArrowRight, HeartPulse, ShieldCheck, Stethoscope, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { validators } from '@/utils/validation';
import { ButtonLoader } from '@/components/common/Loader';
import { toast } from '@/hooks/use-toast';
import { ROLES, ROLE_LABELS } from '@/utils/constants';

export const Register = () => {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [ekgPath, setEkgPath] = useState('');
  const [backendErrors, setBackendErrors] = useState<Record<string, string>>({});

  const validationRules = {
    first_name: [
      { validator: (val: string) => validators.isRequired(val), message: 'First name is required' },
      { validator: (val: string) => validators.isValidName(val), message: 'First name must be 2-100 characters (letters, spaces, hyphens)' }
    ],
    last_name: [
      { validator: (val: string) => validators.isRequired(val), message: 'Last name is required' },
      { validator: (val: string) => validators.isValidName(val), message: 'Last name must be 2-100 characters (letters, spaces, hyphens)' }
    ],
    email: [
      { validator: (val: string) => validators.isRequired(val), message: 'Email is required' },
      { validator: (val: string) => validators.isValidEmail(val), message: 'Please enter a valid email address' }
    ],
    phone: [
      { validator: (val: string) => validators.isRequired(val), message: 'Phone is required' },
      { validator: (val: string) => validators.isValidPhone(val), message: 'Phone must be exactly 10 digits' }
    ],
    password: [
      { validator: (val: string) => validators.isRequired(val), message: 'Password is required' },
      { validator: (val: string) => validators.isPasswordStrong(val), message: 'Password must be 8+ chars with letters and numbers' }
    ],
    confirm_password: [
      { validator: (val: string, formData) => val === formData.password, message: 'Passwords must match' }
    ]
  };

  const { 
    formData, 
    errors, 
    touched, 
    isSubmitting, 
    handleChange, 
    handleBlur, 
    handleSubmit,
    setFieldError 
  } = useFormValidation(
    {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
      role: 'PATIENT',
    },
    handleRegisterSubmit,
    validationRules
  );

  async function handleRegisterSubmit(values: any) {
    try {
      setBackendErrors({});
      await authRegister(values);
      toast({
        title: 'Account Created!',
        description: 'Welcome to HealthCare Pro. Your account has been created successfully.',
      });
      navigate('/dashboard');
    } catch (error: any) {
      // Handle backend validation errors
      if (error.response?.data) {
        const backendErrs = error.response.data;
        Object.entries(backendErrs).forEach(([field, messages]: [string, any]) => {
          const message = Array.isArray(messages) ? messages[0] : messages;
          setFieldError(field, message);
          setBackendErrors(prev => ({ ...prev, [field]: message }));
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: error.message || 'Something went wrong. Please try again.',
        });
      }
    }
  }

  // Generate a dynamic EKG path 
  useEffect(() => {
    const width = 2000;
    const height = 200;
    const baseline = height / 2;
    let path = `M 0 ${baseline}`;
    let x = 0;

    while (x < width) {
      x += Math.random() * 30 + 20;
      path += ` L ${x} ${baseline}`;
      const spikeHeight = Math.random() * 100 + 30;
      path += ` L ${x + 5} ${baseline - spikeHeight} L ${x + 10} ${baseline + spikeHeight * 0.6} L ${x + 15} ${baseline}`;
      x += 20;
    }
    setEkgPath(path);
  }, []);



  const allowedRoles = [ROLES.PATIENT, ROLES.DOCTOR];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 text-slate-900 flex items-center justify-center font-sans selection:bg-emerald-100 selection:text-emerald-900">

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft Gradient Blobs */}
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-teal-100/50 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-blue-50/50 rounded-full blur-[80px]" />

        {/* EKG Animation (Subtle Green) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <svg className="w-full h-64 overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="ekg-light" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="10%" stopColor="#10b981" />
                <stop offset="90%" stopColor="#10b981" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d={ekgPath || "M0 100 L2000 100"}
              stroke="url(#ekg-light)"
              strokeWidth="2"
              fill="none"
              className="animate-ekg-scroll"
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-5 gap-12 p-6 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:col-span-2 flex-col justify-center space-y-8 animate-fade-in pl-8">
          <div className="flex flex-col items-start justify-center space-y-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 rounded-full" />
              <div className="relative w-20 h-20 bg-white rounded-2xl border border-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-100/50">
                <HeartPulse className="w-10 h-10 text-emerald-500" />
              </div>
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3 leading-tight">
                Join <span className="text-emerald-600">HealthCare Pro</span> <br />
                <span className="text-2xl font-normal text-slate-500">Advanced Medical Care</span>
              </h1>
              <p className="text-slate-600 text-lg max-w-sm mt-2 leading-relaxed font-medium">
                Secure patient records, instant appointments, and AI-powered diagnostics.
              </p>
            </div>

            <div className="space-y-4 pt-4 w-full">
              <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm border border-emerald-100/50 rounded-xl p-4 transition-all hover:bg-white hover:shadow-md group cursor-default">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">Expert Care</p>
                  <p className="text-sm text-slate-500">Connect with top specialists</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm border border-emerald-100/50 rounded-xl p-4 transition-all hover:bg-white hover:shadow-md group cursor-default">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">Secure Records</p>
                  <p className="text-sm text-slate-500">HIPAA Compliant & Encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="lg:col-span-3 w-full max-w-xl mx-auto">
          {/* Glass Card - Light version */}
          <div className="relative backdrop-blur-xl bg-white/80 border border-white/60 rounded-[2rem] shadow-2xl shadow-emerald-900/5 p-8 md:p-10 overflow-hidden ring-1 ring-black/5">

            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
              <p className="text-slate-500 mt-1 text-sm bg-slate-100 inline-block px-3 py-1 rounded-full border border-slate-200">
                Get started with your free account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">First Name</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full bg-white border rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder-slate-400 pl-10 pr-4 py-3 outline-none text-sm font-medium transition-all shadow-sm ${
                        errors.first_name && touched.has('first_name') ? 'border-red-500' : 'border-slate-200'
                      }`}
                      placeholder="John"
                    />
                  </div>
                  {errors.first_name && touched.has('first_name') && <p className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.first_name}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full bg-white border rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder-slate-400 px-4 py-3 outline-none text-sm font-medium transition-all shadow-sm ${
                      errors.last_name && touched.has('last_name') ? 'border-red-500' : 'border-slate-200'
                    }`}
                    placeholder="Doe"
                  />
                  {errors.last_name && touched.has('last_name') && <p className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.last_name}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full bg-white border rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder-slate-400 pl-10 pr-4 py-3 outline-none text-sm font-medium transition-all shadow-sm ${
                      errors.email && touched.has('email') ? 'border-red-500' : 'border-slate-200'
                    }`}
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && touched.has('email') && <p className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Phone</label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full bg-white border rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder-slate-400 pl-10 pr-4 py-3 outline-none text-sm font-medium transition-all shadow-sm ${
                      errors.phone && touched.has('phone') ? 'border-red-500' : 'border-slate-200'
                    }`}
                    placeholder="9876543210"
                  />
                </div>
                {errors.phone && touched.has('phone') && <p className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full bg-white border rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder-slate-400 pl-10 pr-10 py-3 outline-none text-sm font-medium transition-all shadow-sm ${
                        errors.password && touched.has('password') ? 'border-red-500' : 'border-slate-200'
                      }`}
                      placeholder="Min 8 chars, letters + numbers"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400 hover:text-emerald-600 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && touched.has('password') && <p className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Confirm</label>
                  <div className="relative group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full bg-white border rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 placeholder-slate-400 px-4 pr-10 py-3 outline-none text-sm font-medium transition-all shadow-sm ${
                        errors.confirm_password && touched.has('confirm_password') ? 'border-red-500' : 'border-slate-200'
                      }`}
                      placeholder="Confirm password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 text-slate-400 hover:text-emerald-600 transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && touched.has('confirm_password') && <p className="text-xs text-red-500 font-medium ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirm_password}</p>}
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <div className="relative flex items-center h-5">
                  <input
                    type="checkbox"
                    required
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <span className="text-sm text-slate-500">
                  I agree to the{' '}
                  <Link to="/terms" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-[1px] shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.01] hover:shadow-emerald-500/40 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative h-full w-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3.5 transition-all">
                  <div className="flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <ButtonLoader className="text-white" />
                    ) : (
                      <>
                        <span className="font-bold text-white tracking-wide">Create Account</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </>
                    )}
                  </div>
                </div>
              </button>

            </form>

            <p className="mt-8 text-center text-sm text-slate-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors hover:underline">
                Sign In
              </Link>
            </p>

          </div>
        </div>
      </div>

      <style>{`
        /* Remove default password reveal on Edge/IE */
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
        @keyframes ekg-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animate-ekg-scroll {
            animation: ekg-scroll 20s linear infinite;
        }
      `}</style>
    </div>
  );
};
