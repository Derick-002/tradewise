import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Loginimage from '../assets/Login.jpg';
import { Eye, EyeOff, Sparkles, ArrowRight, ArrowLeft, Moon, Sun } from 'lucide-react';
import { toast } from '../utils/toast';
import { handleError } from '../utils/handleError';
import { useDispatch, useSelector } from 'react-redux';
import { signupUser } from '../features/auth/authThuck';

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    enterpriseName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [dark, setDark] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsSigningUp(true);
    try {
      const resultAction = await dispatch(signupUser({
        enterpriseName: formData.enterpriseName,
        email: formData.email,
        password: formData.password,
      }));

      if (signupUser.fulfilled.match(resultAction)) {
        toast.success('Account created successfully! Starting onboarding...');
        setTimeout(() => navigate('/email'), 1000);
      } else {
        const fullError = resultAction.payload;
        toast.error(fullError);
      }
    } catch (err) {
      const fullError = handleError(err);
      toast.error(fullError.message);
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <>

      <div className={`${dark ? 'dark' : ''}`}>
        <div className="min-h-screen flex items-center justify-center overflow-hidden relative bg-gradient-to-b from-white to-brand-50 dark:from-[#0B0B10] dark:to-[#0B0B10]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("${Loginimage}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(12px) brightness(0.9)',
            }}
          ></div>

          <button
            onClick={() => setDark(!dark)}
            aria-label="Toggle theme"
            className="z-10 fixed top-5 right-5 p-2 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur border border-white/30 dark:border-white/10 shadow-soft hover:shadow-glow transition"
          >
            {dark ? <Sun size={18} className="text-amber-300" /> : <Moon size={18} className="text-gray-700" />}
          </button>

          <div className="relative flex w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10">
            {/* Form Section */}
            <div className="w-1/2 flex flex-col justify-center p-10 bg-gradient-to-b from-white/90 to-brand-50/60 dark:from-white/[0.06] dark:to-white/[0.02] relative">
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-20 h-20 bg-brand-500/10 rounded-full -mr-10 animate-float"></div>

              <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 dark:bg-white/10 dark:text-white/90">
                    <Sparkles size={16} /> Let's build something brilliant
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-brand-500 to-amber-600 bg-clip-text text-transparent">
                    Create your account
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    A few details and you’re in.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:space-x-4 gap-4 md:gap-0">
                    <div className="space-y-2 w-full md:w-1/2">
                      <label className="text-md font-medium text-gray-700">Enterprise Name</label>
                      <input
                        type="text"
                        name="enterpriseName"
                        placeholder="Enterprise Name"
                        required
                        value={formData.enterpriseName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent text-sm bg-white/80 dark:bg-white/5 dark:text-white"
                      />
                    </div>

                    <div className="space-y-2 w-full md:w-1/2">
                      <label className="text-md font-medium text-gray-700">Business Email</label>
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent text-sm bg-white/80 dark:bg-white/5 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <label className="text-md font-medium text-gray-700">Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent text-sm bg-white/80 dark:bg-white/5 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2/3 transform -translate-y-3 text-gray-500 hover:text-brand-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="agree"
                      className="w-4 h-4 rounded border-gray-300 accent-brand-500 focus:ring-brand-500/40"
                    />
                    <label htmlFor="agree" className="text-sm text-gray-600 cursor-pointer select-none">
                      I agree to the <span className="text-brand-600 underline">terms and conditions</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSigningUp}
                  className="w-full py-3 mt-1 bg-gradient-to-r from-brand-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-500 hover:to-brand-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSigningUp ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating account...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Create account <ArrowRight size={18} />
                    </span>
                  )}
                </button>

                <div className="grid grid-cols-3 items-center gap-3 mt-1">
                  <div className="h-[1px] bg-gray-200 dark:bg-white/10"></div>
                  <div className="text-xs text-gray-400 text-center">or</div>
                  <div className="h-[1px] bg-gray-200 dark:bg-white/10"></div>
                </div>

                <p className="text-center text-sm text-gray-500 dark:text-gray-300">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-brand-600 font-semibold underline hover:text-amber-600"
                  >
                    Login
                  </Link>
                </p>
                <p className="text-center text-sm text-gray-500 dark:text-gray-300 mt-1 flex items-center justify-center gap-4">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1 text-brand-600 font-semibold underline hover:text-amber-600"
                  >
                    <ArrowLeft size={16} />
                    <span>Go to home</span>
                  </Link>
                  {user && (
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-1 text-brand-600 font-semibold underline hover:text-amber-600"
                    >
                      <ArrowLeft size={16} />
                      <span>Go to dashboard</span>
                    </Link>
                  )}
                </p>
              </form>
            </div>

            <div className="w-1/2 relative overflow-hidden">
              <img
                src={Loginimage}
                alt="Creative signup illustration"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              <div className="absolute top-20 right-10 w-24 h-24 bg-white/20 rounded-full blur-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
