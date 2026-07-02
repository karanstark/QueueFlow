import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Database, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Register() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      await authRegister({ username: data.username, email: data.email, password: data.password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4" style={{ backgroundImage: 'radial-gradient(circle at 70% 20%, rgba(99,102,241,0.08), transparent 500px), radial-gradient(circle at 30% 80%, rgba(139,92,246,0.08), transparent 500px)' }}>
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-accent/15 p-4 rounded-2xl border border-accent/20 mb-4 animate-pulse-glow">
            <Database className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">QueueFlow</h1>
          <p className="text-text-secondary text-sm mt-1">Create your account to get started</p>
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-xl font-semibold text-text-primary mb-1">Create Account</h2>
          <p className="text-text-secondary text-sm mb-6">Join thousands of engineers using QueueFlow</p>

          {error && (
            <div className="bg-error/10 border border-error/30 text-error text-sm rounded-lg p-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Username</label>
              <input
                {...register('username', { required: 'Username is required', minLength: { value: 3, message: 'Min 3 characters' } })}
                type="text"
                placeholder="Choose a username"
                className="glass-input w-full"
              />
              {errors.username && <p className="text-error text-xs mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <input
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
                type="email"
                placeholder="Enter your email"
                className="glass-input w-full"
              />
              {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className="glass-input w-full pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="glass-btn glass-btn-primary w-full py-3 mt-2 text-base font-semibold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
