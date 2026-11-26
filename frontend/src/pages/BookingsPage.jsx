import { useEffect, useState } from 'react'
import api from '../api/axios'

function statusBadge(status) {
  const map = { CONFIRMED: 'badge-green', PENDING: 'badge-yellow', CANCELLED: 'badge-red' }
  return <span className={`badge ${map[status] || 'badge-blue'}`}>{status}</span>
}

function fmt(dt) {
  return new Date(dt.replace('T', ' ')).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function rupee(n) {
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })
}

// ── Inline confirm dialog (replaces window.confirm which is blocked in iframes) ──
function ConfirmDialog({ bookingId, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300
    }}>
      <div style={{
        background: '#fff', borderRadius: '.75rem', padding: '2rem',
        width: 'min(400px, 92vw)', boxShadow: '0 8px 32px rgba(0,0,0,.18)'
      }}>
        <div style={{ fontSize: '1.4rem', marginBottom: '.5rem' }}>❗ Cancel Booking</div>
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '.95rem' }}>
          Are you sure you want to cancel Booking #{bookingId}? This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onCancel}>Keep Booking</button>
          <button className="btn btn-danger" onClick={onConfirm}>Yes, Cancel It</button>
        </div>
      </div>
    </div>
  )
}

// ── Expandable booking detail row ──────────────────────────────────────────────
function BookingDetail({ b }) {
  return (
    <tr>
      <td colSpan={11} style={{ background: '#f8faff', padding: '0' }}>
        <div style={{ padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

          {/* Left — booking info */}
          <div>
            <div style={{ fontWeight: 700, fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>Booking Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '.2rem .75rem', fontSize: '.88rem' }}>
              <span style={{ color: 'var(--muted)' }}>Hall</span>        <span style={{ fontWeight: 600 }}>{b.hallName}</span>
              <span style={{ color: 'var(--muted)' }}>Event</span>       <span style={{ fontWeight: 600 }}>{b.eventName}</span>
              <span style={{ color: 'var(--muted)' }}>Start</span>       <span>{fmt(b.startTime)}</span>
              <span style={{ color: 'var(--muted)' }}>End</span>         <span>{fmt(b.endTime)}</span>
              <span style={{ color: 'var(--muted)' }}>Guests</span>      <span>{b.guestCount}</span>
              <span style={{ color: 'var(--muted)' }}>Catering</span>    <span>{b.catering ? '✅ Yes' : '❌ No'}</span>
              <span style={{ color: 'var(--muted)' }}>Decoration</span>  <span>{b.decorationPackage || '—'}</span>
            </div>
            {b.menuSummary && (
              <div style={{ marginTop: '.6rem', fontSize: '.83rem' }}>
                <span style={{ color: 'var(--muted)' }}>Menu: </span>{b.menuSummary}
              </div>
            )}
          </div>

          {/* Right — bill breakdown */}
          {b.bill && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>Bill Breakdown</div>
              <div style={{ border: '1px solid var(--border)', borderRadius: '.5rem', overflow: 'hidden', fontSize: '.87rem' }}>
                {[
                  { label: 'Hall Charge',   val: b.bill.hallCharge },
                  { label: 'Food',          val: b.bill.foodCharge,       hide: !Number(b.bill.foodCharge) },
                  { label: 'Catering',      val: b.bill.cateringCharge,   hide: !Number(b.bill.cateringCharge) },
                  { label: 'Decoration',    val: b.bill.decorationCharge, hide: !Number(b.bill.decorationCharge) },
                ].filter(r => !r.hide).map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem .75rem', borderBottom: '1px solid var(--border)' }}>
                    <span>{r.label}</span><span>{rupee(r.val)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem .75rem', borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                  <span>Subtotal</span><span>{rupee(b.bill.amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem .75rem', borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                  <span>GST 18%</span><span>{rupee(b.bill.tax)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.55rem .75rem', background: '#eef2ff', fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>{rupee(b.bill.total)}</span>
                </div>
              </div>
              <div style={{ marginTop: '.4rem', fontSize: '.8rem', color: b.bill.paid ? '#16a34a' : '#b45309', fontWeight: 600 }}>
                {b.bill.paid ? '✅ Payment Received' : '⏳ Payment Pending'}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function BookingsPage() {
  const [bookings,    setBookings]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [cancelling,  setCancelling]  = useState(null)   // bookingId being cancelled
  const [confirmId,   setConfirmId]   = useState(null)   // bookingId awaiting confirm dialog
  const [expandedId,  setExpandedId]  = useState(null)   // bookingId with detail open
  const [cancelError, setCancelError] = useState('')

  useEffect(() => {
    api.get('/bookings/my').then(r => setBookings(r.data)).finally(() => setLoading(false))
  }, [])

  function toggleExpand(id) {
    setExpandedId(prev => prev === id ? null : id)
  }

  function askCancel(id) {
    setCancelError('')
    setConfirmId(id)
  }

  async function doCancel() {
    const id = confirmId
    setConfirmId(null)
    setCancelling(id)
    setCancelError('')
    try {
      const { data } = await api.patch(`/bookings/${id}/cancel`)
      setBookings(bs => bs.map(b => b.id === id ? data : b))
    } catch (err) {
      const status  = err.response?.status
      const message = err.response?.data?.message || err.response?.data || err.message || 'Unknown error'
      setCancelError(`Cancel failed (${status || 'network error'}): ${message}`)
    } finally {
      setCancelling(null)
    }
  }

  if (loading) return <div className="loading">Loading your bookings...</div>

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>Click any row to see full details and bill breakdown</p>
      </div>

      {cancelError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{cancelError}</div>}

      {/* Inline confirm dialog */}
      {confirmId && (
        <ConfirmDialog
          bookingId={confirmId}
          onConfirm={doCancel}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {bookings.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', color: 'var(--muted)' }}>
            No bookings yet. <a href="/" style={{ color: 'var(--primary)' }}>Browse halls →</a>
          </div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>#</th><th>Hall</th><th>Event</th>
                <th>Start</th><th>End</th><th>Guests</th>
                <th>Total</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <>
                  <tr key={b.id}
                    style={{ cursor: 'pointer', background: expandedId === b.id ? '#f0f4ff' : undefined }}
                  >
                    {/* Expand toggle */}
                    <td onClick={() => toggleExpand(b.id)} style={{ color: 'var(--muted)', fontWeight: 700, userSelect: 'none', textAlign: 'center' }}>
                      {expandedId === b.id ? '▲' : '▼'}
                    </td>
                    <td onClick={() => toggleExpand(b.id)}>{b.id}</td>
                    <td onClick={() => toggleExpand(b.id)}>{b.hallName}</td>
                    <td onClick={() => toggleExpand(b.id)}>{b.eventName}</td>
                    <td onClick={() => toggleExpand(b.id)}>{fmt(b.startTime)}</td>
                    <td onClick={() => toggleExpand(b.id)}>{fmt(b.endTime)}</td>
                    <td onClick={() => toggleExpand(b.id)}>{b.guestCount}</td>
                    <td onClick={() => toggleExpand(b.id)} style={{ fontWeight: 600 }}>
                      {b.bill ? rupee(b.bill.total) : '—'}
                    </td>
                    <td onClick={() => toggleExpand(b.id)}>{statusBadge(b.status)}</td>
                    <td>
                      {b.status !== 'CANCELLED' && (
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={cancelling === b.id}
                          onClick={e => { e.stopPropagation(); askCancel(b.id) }}
                        >
                          {cancelling === b.id ? '...' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === b.id && <BookingDetail key={`detail-${b.id}`} b={b} />}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
