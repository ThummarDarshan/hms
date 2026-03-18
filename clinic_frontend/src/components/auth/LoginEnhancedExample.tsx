/**
 * EXAMPLE: Enhanced Login with Validation
 * 
 * This file demonstrates how to implement comprehensive validation.
 * Shows the pattern to apply to other forms.
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Activity, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFormValidation } from '@/hooks/useFormValidation';
import { FormField, FormInput } from '@/components/common/FormField';
import { ButtonLoader } from '@/components/common/Loader';
import { toast } from '@/hooks/use-toast';

export const EnhancedLoginExample = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [ekgPath, setEkgPath] = useState('');
  const [backendError, setBackendError] = useState<string | null>(null);

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

  // Define validation rules
  const validationRules = {
    email: {
      required: true,
      type: 'email',
    },
    password: {
      required: true,
      minLength: 8,
    },
  };

  // Use form validation hook
  const {
    formData,
    handleChange,
    handleBlur,
    handleSubmit: handleFormSubmit,
    shouldShowError,
    getFieldError,
    isSubmitting,
  } = useFormValidation({
    initialValues: {
      email: '',
      password: '',
    },
    validationRules,
    onSubmit: async (data) => {
      setBackendError(null);
      try {
        await login(data.email, data.password);
        toast({
          title: 'Welcome Back!',
          description: 'Successfully logged in to HealthCare Pro.',
        });

        // Redirect LAB_TECHNICIAN users to laboratory module
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser.role === 'LAB_TECHNICIAN') {
          navigate('/laboratory');
        } else {
          navigate('/dashboard');
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.detail ||
          'Invalid credentials. Please try again.';
        
        setBackendError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: errorMessage,
        });
      }
    },
  });

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 text-slate-900 flex items-center justify-center font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-teal-100/50 rounded-full blur-[100px]" />

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
              d={ekgPath || 'M0 100 L2000 100'}
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
                <Activity className="w-10 h-10 text-emerald-500" />
              </div>
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3 leading-tight">
                Welcome <br />
                <span className="text-emerald-600">Back</span>
              </h1>
              <p className="text-slate-600 text-lg max-w-sm mt-2 leading-relaxed font-medium">
                Access your dashboard to manage appointments, patients, and medical records.
              </p>
            </div>

            <div className="space-y-4 pt-4 w-full">
              <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm border border-emerald-100/50 rounded-xl p-4 transition-all hover:bg-white hover:shadow-md group cursor-default">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
                  <User className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">Quick Access</p>
                  <p className="text-sm text-slate-500">Secure staff login</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/60 backdrop-blur-sm border border-emerald-100/50 rounded-xl p-4 transition-all hover:bg-white hover:shadow-md group cursor-default">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">Encrypted</p>
                  <p className="text-sm text-slate-500">End-to-end protection</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="lg:col-span-3 w-full max-w-xl mx-auto">
          <div className="relative backdrop-blur-xl bg-white/80 border border-white/60 rounded-[2rem] shadow-2xl shadow-emerald-900/5 p-8 md:p-10 overflow-hidden ring-1 ring-black/5">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <Activity className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">HealthCare Pro</h1>
            </div>

            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
              <p className="text-slate-500 mt-1 text-sm">Welcome back to HealthCare Pro</p>
            </div>

            {/* Backend Error Alert */}
            {backendError && (
              <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{backendError}</p>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5">
              {/* Email Field with Validation */}
              <FormField
                label="Email"
                error={shouldShowError('email') ? getFieldError('email') : null}
                required
              >
                <div className="relative group">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <FormInput
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={shouldShowError('email')}
                    placeholder="doctor@clinic.com"
                    className="pl-10"
                  />
                </div>
              </FormField>

              {/* Password Field with Validation */}
              <FormField
                label="Password"
                error={shouldShowError('password') ? getFieldError('password') : null}
                required
              >
                <div className="relative group">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <FormInput
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={shouldShowError('password')}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormField>

              <div className="flex items-center justify-between text-sm pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-colors"
                  />
                  <span className="text-slate-500 group-hover:text-emerald-600 transition-colors font-medium">
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-emerald-600 hover:text-emerald-700 font-bold transition-all hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button - Disabled if form invalid or submitting */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-[1px] shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.01] hover:shadow-emerald-500/40 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative h-full w-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3.5 transition-all">
                  <span className="flex items-center justify-center gap-2 font-bold text-white tracking-wide">
                    {isSubmitting ? (
                      <ButtonLoader className="text-white" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="h-4 w-4 text-white" />
                      </>
                    )}
                  </span>
                </div>
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500 font-medium">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-emerald-600 font-bold hover:text-emerald-700 transition-all hover:underline"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
