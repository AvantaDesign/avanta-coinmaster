import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { showSuccess, showError } from '../utils/notifications';
import { authFetch } from '../utils/auth';

/**
 * AdminDashboard component
 * Provides comprehensive account management for users
 */
export default function AdminDashboard() {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  
  // Profile update state
  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  /**
   * Fetch user profile from API
   */
  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const response = await authFetch('/api/user-profile');

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data.user);
      setName(data.user.name || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
      showError('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile name
   */
  const handleUpdateName = async () => {
    try {
      setLoading(true);
      
      const response = await authFetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setProfile(data.user);
      setEditingName(false);
      showSuccess('Profile updated successfully');
      
      // Refresh auth context
      await checkAuth();
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate password change form
   */
  const validatePasswordForm = () => {
    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(newPassword)) {
      errors.newPassword = 'Password must contain at least one number';
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle password change
   */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await authFetch('/api/user-profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
      
      showSuccess('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      showError(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Panel de Administración</h1>

      {/* Account Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de la Cuenta</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Avatar */}
          <div className="flex items-center space-x-4">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.name} 
                className="h-20 w-20 rounded-full"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {(profile.name || profile.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">{profile.name || 'Usuario'}</h3>
              <p className="text-sm text-gray-600">{profile.email}</p>
              {profile.role === 'admin' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                  Administrador
                </span>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Usuario ID</p>
              <p className="text-sm font-mono text-gray-900">{profile.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha de Registro</p>
              <p className="text-sm text-gray-900">
                {new Date(profile.created_at).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {profile.last_login_at && (
              <div>
                <p className="text-sm text-gray-600">Último Inicio de Sesión</p>
                <p className="text-sm text-gray-900">
                  {new Date(profile.last_login_at).toLocaleString('es-MX')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuración del Perfil</h2>
        
        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            {editingName ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tu nombre"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setName(profile.name || '');
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-gray-900">{profile.name || 'No especificado'}</p>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Editar
                </button>
              </div>
            )}
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <p className="text-gray-900">{profile.email}</p>
            <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Cambiar Contraseña</h2>
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña Actual
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`w-full px-3 py-2 border ${
                passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Ingresa tu contraseña actual"
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Contraseña
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full px-3 py-2 border ${
                passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Mínimo 8 caracteres, con mayúsculas, minúsculas y números"
            />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nueva Contraseña
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-3 py-2 border ${
                passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Confirma tu nueva contraseña"
            />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
            )}
          </div>

          {/* Show Passwords Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPasswords"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showPasswords" className="ml-2 block text-sm text-gray-700">
              Mostrar contraseñas
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          🔒 Seguridad de tu Cuenta
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Tus contraseñas están protegidas con hash SHA-256 y salt único</li>
          <li>• Las sesiones expiran automáticamente después de 24 horas</li>
          <li>• Todos los datos financieros están cifrados en tránsito</li>
          <li>• Tu información está aislada de otros usuarios</li>
        </ul>
      </div>
    </div>
  );
}
