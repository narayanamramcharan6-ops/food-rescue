import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const DonationDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const res = await api.get(`/donations/${id}`);
        setDonation(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Donation not found');
      } finally {
        setLoading(false);
      }
    };
    fetchDonation();
  }, [id]);

  const handleAccept = async () => {
    try {
      await api.put(`/donations/${id}/accept`);
      const res = await api.get(`/donations/${id}`);
      setDonation(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleStatus = async (status) => {
    try {
      await api.put(`/donations/${id}/status`, { status });
      const res = await api.get(`/donations/${id}`);
      setDonation(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this donation?')) return;
    try {
      await api.put(`/donations/${id}/cancel`);
      navigate(user.role === 'donor' ? '/donor' : '/volunteer');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  if (loading) return <div className="dashboard"><div className="loading">Loading...</div></div>;
  if (error) return <div className="dashboard"><div className="alert alert-error">{error}</div></div>;
  if (!donation) return null;

  const getStatusClass = (status) => {
    const map = {
      pending: 'status-pending',
      accepted: 'status-accepted',
      picked: 'status-picked',
      delivered: 'status-delivered',
      expired: 'status-expired',
      cancelled: 'status-cancelled',
    };
    return map[status] || '';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Donation Details</h1>
          <p>ID: {donation._id}</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-outline">
          ← Back
        </button>
      </div>

      <div className="detail-card">
        <div className="detail-header">
          <h2>{donation.foodType}</h2>
          <span className={`status-badge ${getStatusClass(donation.status)}`}>
            {donation.status}
          </span>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <label>Quantity</label>
            <p>{donation.quantity}</p>
          </div>
          <div className="detail-item">
            <label>Description</label>
            <p>{donation.description || '-'}</p>
          </div>
          <div className="detail-item">
            <label>Pickup Address</label>
            <p>{donation.pickupLocation?.address}</p>
          </div>
          <div className="detail-item">
            <label>Coordinates</label>
            <p>
              {donation.pickupLocation?.coordinates?.[1]},{' '}
              {donation.pickupLocation?.coordinates?.[0]}
            </p>
          </div>
          <div className="detail-item">
            <label>Available Until</label>
            <p>
              {donation.availableUntil
                ? format(new Date(donation.availableUntil), 'dd MMM yyyy, hh:mm a')
                : '-'}
            </p>
          </div>
          <div className="detail-item">
            <label>Expiry Time</label>
            <p>
              {donation.expiryTime
                ? format(new Date(donation.expiryTime), 'dd MMM yyyy, hh:mm a')
                : '-'}
            </p>
          </div>
          <div className="detail-item">
            <label>Donor</label>
            <p>
              {donation.donor?.name}
              {donation.donor?.phone && ` • ${donation.donor.phone}`}
              <br />
              <span className="text-muted">{donation.donor?.email}</span>
            </p>
          </div>
          <div className="detail-item">
            <label>Assigned Volunteer</label>
            <p>
              {donation.assignedVolunteer ? (
                <>
                  {donation.assignedVolunteer.name}
                  {donation.assignedVolunteer.phone &&
                    ` • ${donation.assignedVolunteer.phone}`}
                </>
              ) : (
                '-'
              )}
            </p>
          </div>
          {donation.notes && (
            <div className="detail-item full">
              <label>Notes</label>
              <p>{donation.notes}</p>
            </div>
          )}
        </div>

        {donation.qrCode && (
          <div className="qr-section">
            <label>QR Code</label>
            <img src={donation.qrCode} alt="Donation QR" className="qr-image" />
          </div>
        )}

        <div className="detail-actions">
          {user.role === 'volunteer' && donation.status === 'pending' && (
            <button onClick={handleAccept} className="btn btn-primary">
              Accept Donation
            </button>
          )}
          {user.role === 'volunteer' &&
            donation.assignedVolunteer?._id === user.id &&
            donation.status === 'accepted' && (
              <button onClick={() => handleStatus('picked')} className="btn btn-primary">
                Mark as Picked
              </button>
            )}
          {user.role === 'volunteer' &&
            donation.assignedVolunteer?._id === user.id &&
            donation.status === 'picked' && (
              <button onClick={() => handleStatus('delivered')} className="btn btn-success">
                Mark as Delivered
              </button>
            )}
          {(user.role === 'donor' || user.role === 'admin') &&
            ['pending', 'accepted'].includes(donation.status) && (
              <button onClick={handleCancel} className="btn btn-danger">
                Cancel Donation
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default DonationDetail;
