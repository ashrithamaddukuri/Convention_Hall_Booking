import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function HallsPage() {
  const [halls, setHalls] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/halls').then(r => setHalls(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Loading halls...</div>

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <h1>Convention Halls</h1>
        <p>Browse and book the perfect venue for your event</p>
      </div>
      <div className="hall-grid">
        {halls.map(hall => (
          <div className="card hall-card" key={hall.id}>
            <img src={hall.imageUrl} alt={hall.name}
              onError={e => { e.target.src = 'https://via.placeholder.com/400x200?text=Hall' }} />
            <div className="hall-card-body">
              <h3>{hall.name}</h3>
              <div className="hall-meta">
                <span>📍 {hall.location}</span>
                <span>👥 {hall.capacity}</span>
              </div>
              <p style={{ fontSize: '.9rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                {hall.description?.substring(0, 90)}...
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)' }}>
                  ₹{hall.pricePerHour}/hr
                </span>
                <Link to={`/halls/${hall.id}`} className="btn btn-primary btn-sm">Book Now</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
