import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">🏛️ HallBook</Link>
        <div className="navbar-links">
          <Link to="/">Halls</Link>
          {user && user.role !== 'ADMIN' && <Link to="/bookings">My Bookings</Link>}
          {user?.role === 'ADMIN' && <Link to="/admin">Admin</Link>}
          {user ? (
            <>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                Hi, {user.name.split(' ')[0]}
              </span>
              <button onClick={handleLogout} className="nav-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="nav-btn">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
