import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'donor') return '/donor';
    if (user.role === 'volunteer') return '/volunteer';
    if (user.role === 'admin') return '/admin';
    return '/';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to={getDashboardLink()} className="nav-logo">
          🍲 Food Rescue
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              <span className="nav-user">
                Hi, <strong>{user.name}</strong>
                <span className={`role-badge role-${user.role}`}>{user.role}</span>
              </span>
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
