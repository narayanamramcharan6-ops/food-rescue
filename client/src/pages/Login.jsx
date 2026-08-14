import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loginAs, setLoginAs] = useState('donor');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(formData.email, formData.password);

      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'donor') {
        navigate('/donor');
      } else if (user.role === 'volunteer') {
        navigate('/volunteer');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check email & password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Login to Food Rescue platform</p>

        <div className="login-role-tabs">
          <button
            type="button"
            className={`role-tab ${loginAs === 'donor' ? 'active' : ''}`}
            onClick={() => setLoginAs('donor')}
          >
            🍽️ Donor
          </button>
          <button
            type="button"
            className={`role-tab ${loginAs === 'volunteer' ? 'active' : ''}`}
            onClick={() => setLoginAs('volunteer')}
          >
            🚚 Volunteer
          </button>
          <button
            type="button"
            className={`role-tab ${loginAs === 'admin' ? 'active' : ''}`}
            onClick={() => setLoginAs('admin')}
          >
            🛡️ Admin
          </button>
        </div>

        {loginAs === 'admin' && (
          <div className="alert alert-success" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
            <strong>Admin Login</strong>
            <br />
            Please enter your admin email and password to continue.
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading
              ? 'Logging in...'
              : loginAs === 'admin'
                ? 'Login as Admin'
                : loginAs === 'volunteer'
                  ? 'Login as Volunteer'
                  : 'Login as Donor'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register as Donor / Volunteer</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
