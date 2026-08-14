import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  const getDashboard = () => {
    if (!user) return null;
    if (user.role === 'donor') return '/donor';
    if (user.role === 'volunteer') return '/volunteer';
    if (user.role === 'admin') return '/admin';
    return '/';
  };

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>
            Rescue Food.
            <br />
            Feed People.
          </h1>
          <p>
            Connect surplus food from restaurants, hotels & events with volunteers
            who deliver it to those in need — before it expires.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to={getDashboard()} className="btn btn-primary btn-lg">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="features">
        <h2>How It Works</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🍽️</div>
            <h3>Donors Post Surplus</h3>
            <p>
              Restaurants, hotels, supermarkets and event organizers quickly post
              leftover edible food with quantity, location and expiry time.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚚</div>
            <h3>Volunteers Accept</h3>
            <p>
              Nearby volunteers receive the request, accept it, pick up the food
              and deliver it to people in need before it goes to waste.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Track & Impact</h3>
            <p>
              Real-time status tracking, donation history, QR codes and dashboards
              show how much food was rescued and meals served.
            </p>
          </div>
        </div>
      </section>

      <section className="impact">
        <h2>Why Food Rescue?</h2>
        <div className="impact-stats">
          <div>
            <span className="big-number">1/3</span>
            <p>of all food produced is wasted globally</p>
          </div>
          <div>
            <span className="big-number">828M</span>
            <p>people still go hungry every day</p>
          </div>
          <div>
            <span className="big-number">You</span>
            <p>can help change that — starting today</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
