import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    longitude: user?.location?.coordinates?.[0] || '',
    latitude: user?.location?.coordinates?.[1] || '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          longitude: pos.coords.longitude.toFixed(6),
          latitude: pos.coords.latitude.toFixed(6),
        }));
      },
      (err) => setError('Location error: ' + err.message)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await api.put('/auth/profile', formData);
      updateUser(res.data.user);
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getDashboardLink = () => {
    if (user?.role === 'donor') return '/donor';
    if (user?.role === 'volunteer') return '/volunteer';
    if (user?.role === 'admin') return '/admin';
    return '/';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>My Profile</h1>
          <p>Update your personal information</p>
        </div>
        <button onClick={() => navigate(getDashboardLink())} className="btn btn-outline">
          ← Back to Dashboard
        </button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-group">
          <label>Email (cannot change)</label>
          <input type="email" value={user?.email || ''} disabled />
        </div>

        <div className="form-group">
          <label>Role</label>
          <input type="text" value={user?.role || ''} disabled className="capitalize" />
        </div>

        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="longitude">Longitude</label>
            <input
              type="text"
              id="longitude"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="latitude">Latitude</label>
            <input
              type="text"
              id="latitude"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="button" onClick={getCurrentLocation} className="btn btn-outline">
              📍 Get Location
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
