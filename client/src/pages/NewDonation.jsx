import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const NewDonation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    foodType: '',
    quantity: '',
    description: '',
    address: '',
    longitude: '',
    latitude: '',
    availableUntil: '',
    expiryTime: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          longitude: position.coords.longitude.toFixed(6),
          latitude: position.coords.latitude.toFixed(6),
        }));
        setLocating(false);
      },
      (err) => {
        setError('Unable to get location: ' + err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.longitude || !formData.latitude) {
      setError('Please provide pickup coordinates (use "Get Current Location")');
      return;
    }

    setLoading(true);
    try {
      await api.post('/donations', formData);
      navigate('/donor');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  // Helper to set datetime-local min to now
  const nowLocal = new Date();
  nowLocal.setMinutes(nowLocal.getMinutes() - nowLocal.getTimezoneOffset());
  const minDateTime = nowLocal.toISOString().slice(0, 16);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Post New Donation</h1>
          <p>Share surplus food so volunteers can pick it up quickly.</p>
        </div>
        <button onClick={() => navigate('/donor')} className="btn btn-outline">
          ← Back
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="foodType">Food Type *</label>
            <input
              type="text"
              id="foodType"
              name="foodType"
              value={formData.foodType}
              onChange={handleChange}
              placeholder="e.g. Cooked Rice, Bread, Vegetables"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="quantity">Quantity *</label>
            <input
              type="text"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="e.g. 10 kg, 50 packets, 20 meals"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Any extra details about the food..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Pickup Address *</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Full address for pickup"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="longitude">Longitude *</label>
            <input
              type="text"
              id="longitude"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              placeholder="e.g. 78.4867"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="latitude">Latitude *</label>
            <input
              type="text"
              id="latitude"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              placeholder="e.g. 17.3850"
              required
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="btn btn-outline"
              disabled={locating}
            >
              {locating ? 'Locating...' : '📍 Get Current Location'}
            </button>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="availableUntil">Available Until *</label>
            <input
              type="datetime-local"
              id="availableUntil"
              name="availableUntil"
              value={formData.availableUntil}
              onChange={handleChange}
              min={minDateTime}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="expiryTime">Food Expiry Time *</label>
            <input
              type="datetime-local"
              id="expiryTime"
              name="expiryTime"
              value={formData.expiryTime}
              onChange={handleChange}
              min={minDateTime}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes for Volunteer</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Gate code, contact person, special instructions..."
            rows={2}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/donor')} className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Posting...' : 'Post Donation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewDonation;
