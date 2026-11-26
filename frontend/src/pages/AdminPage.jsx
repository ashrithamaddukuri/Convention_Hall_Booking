import { useEffect, useState, useMemo } from 'react'
import api from '../api/axios'

// ── helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status) {
  const map = { CONFIRMED: 'badge-green', PENDING: 'badge-yellow', CANCELLED: 'badge-red' }
  return <span className={`badge ${map[status] || 'badge-blue'}`}>{status}</span>
}

function fmt(dt) {
  return new Date(dt.replace('T', ' ')).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function fmtDate(dt) {
  return new Date(dt.replace('T', ' ')).toLocaleDateString('en-IN', { dateStyle: 'medium' })
}

function fmtTime(dt) {
  return new Date(dt.replace('T', ' ')).toLocaleTimeString('en-IN', { timeStyle: 'short' })
}

function rupee(n) {
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })
}

// Returns "2026-12-15" from a LocalDateTime string
function dateOnly(dt) { return dt?.slice(0, 10) }

// Today's date as "YYYY-MM-DD"
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// ── Expandable booking detail row ─────────────────────────────────────────────

function BookingDetail({ b, colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ background: '#f8faff', padding: 0 }}>
        <div style={{ padding: '1.2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>

          <div>
            <Label>Customer</Label>
            <Grid2>
              <M>Name</M>  <B>{b.userName}</B>
              <M>Email</M> <span>{b.userEmail}</span>
            </Grid2>
          </div>

          <div>
            <Label>Event Details</Label>
            <Grid2>
              <M>Hall</M>        <B>{b.hallName}</B>
              <M>Event</M>       <span>{b.eventName}</span>
              <M>Guests</M>      <span>{b.guestCount}</span>
              <M>Start</M>       <span>{fmt(b.startTime)}</span>
              <M>End</M>         <span>{fmt(b.endTime)}</span>
              <M>Catering</M>    <span>{b.catering ? '✅ Yes' : '❌ No'}</span>
              <M>Decoration</M>  <span>{b.decorationPackage || '—'}</span>
            </Grid2>
            {b.menuSummary && (
              <div style={{ marginTop: '.5rem', fontSize: '.82rem' }}>
                <span style={{ color: 'var(--muted)' }}>Menu: </span>{b.menuSummary}
              </div>
            )}
          </div>

          {b.bill && (
            <div>
              <Label>Bill</Label>
              <div style={{ border: '1px solid var(--border)', borderRadius: '.5rem', overflow: 'hidden', fontSize: '.87rem' }}>
                {[
                  { l: 'Hall',       v: b.bill.hallCharge },
                  { l: 'Food',       v: b.bill.foodCharge,       hide: !Number(b.bill.foodCharge) },
                  { l: 'Catering',   v: b.bill.cateringCharge,   hide: !Number(b.bill.cateringCharge) },
                  { l: 'Decoration', v: b.bill.decorationCharge, hide: !Number(b.bill.decorationCharge) },
                ].filter(r => !r.hide).map((r, i) => (
                  <Row key={i}><span>{r.l}</span><span>{rupee(r.v)}</span></Row>
                ))}
                <Row muted><span>GST 18%</span><span>{rupee(b.bill.tax)}</span></Row>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'.45rem .7rem', background:'#eef2ff', fontWeight:700 }}>
                  <span>Total</span><span style={{ color:'var(--primary)' }}>{rupee(b.bill.total)}</span>
                </div>
              </div>
              <div style={{ marginTop:'.35rem', fontSize:'.8rem', fontWeight:600, color: b.bill.paid ? '#16a34a' : '#b45309' }}>
                {b.bill.paid ? '✅ Paid' : '⏳ Payment Pending'}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── tiny style helpers ────────────────────────────────────────────────────────
const Label = ({ children }) => (
  <div style={{ fontWeight:700, fontSize:'.72rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'.5rem' }}>{children}</div>
)
const Grid2 = ({ children }) => (
  <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'.2rem .6rem', fontSize:'.88rem' }}>{children}</div>
)
const M = ({ children }) => <span style={{ color:'var(--muted)' }}>{children}</span>
const B = ({ children }) => <span style={{ fontWeight:600 }}>{children}</span>
const Row = ({ children, muted }) => (
  <div style={{ display:'flex', justifyContent:'space-between', padding:'.35rem .7rem', borderBottom:'1px solid var(--border)', color: muted ? 'var(--muted)' : undefined }}>
    {children}
  </div>
)

// ── Bookings table (reused in multiple tabs) ──────────────────────────────────

function BookingsTable({ rows, expandedId, setExpandedId, colCount = 9 }) {
  if (rows.length === 0) {
    return <div style={{ textAlign:'center', color:'var(--muted)', padding:'2rem' }}>No bookings found.</div>
  }
  return (
    <div className="card table-wrap">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>#</th><th>Customer</th><th>Hall</th><th>Event</th>
            <th>Guests</th><th>Start</th><th>End</th><th>Total</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(b => (
            <>
              <tr key={b.id}
                style={{ cursor:'pointer', background: expandedId === b.id ? '#f0f4ff' : undefined }}
                onClick={() => setExpandedId(p => p === b.id ? null : b.id)}
              >
                <td style={{ color:'var(--muted)', fontWeight:700, textAlign:'center', userSelect:'none' }}>
                  {expandedId === b.id ? '▲' : '▼'}
                </td>
                <td>{b.id}</td>
                <td>
                  <div style={{ fontWeight:600, fontSize:'.88rem' }}>{b.userName}</div>
                  <div style={{ fontSize:'.76rem', color:'var(--muted)' }}>{b.userEmail}</div>
                </td>
                <td>{b.hallName}</td>
                <td>{b.eventName}</td>
                <td>{b.guestCount}</td>
                <td style={{ fontSize:'.85rem', whiteSpace:'nowrap' }}>{fmt(b.startTime)}</td>
                <td style={{ fontSize:'.85rem', whiteSpace:'nowrap' }}>{fmt(b.endTime)}</td>
                <td style={{ fontWeight:600 }}>{b.bill ? rupee(b.bill.total) : '—'}</td>
                <td>{statusBadge(b.status)}</td>
              </tr>
              {expandedId === b.id && <BookingDetail key={`d-${b.id}`} b={b} colSpan={10} />}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab,        setTab]        = useState('overview')
  const [halls,      setHalls]      = useState([])
  const [bookings,   setBookings]   = useState([])
  const [bills,      setBills]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  // Filters for Bookings tab
  const [filterHall,   setFilterHall]   = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('CONFIRMED')
  const [filterFrom,   setFilterFrom]   = useState('')
  const [filterTo,     setFilterTo]     = useState('')

  // Hall form
  const [hallModal, setHallModal] = useState(false)
  const [editHall,  setEditHall]  = useState(null)
  const [hallForm,  setHallForm]  = useState({ name:'', location:'', capacity:'', pricePerHour:'', description:'', imageUrl:'' })
  const [hallError, setHallError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/admin/halls'),
      api.get('/admin/bookings'),
      api.get('/admin/bills'),
    ]).then(([h, b, bi]) => {
      setHalls(h.data); setBookings(b.data); setBills(bi.data)
    }).finally(() => setLoading(false))
  }, [])

  // ── derived data ────────────────────────────────────────────────────────────

  const today   = todayStr()

  const todaysBookings = useMemo(() =>
    bookings
      .filter(b => b.status === 'CONFIRMED' && dateOnly(b.startTime) === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [bookings, today]
  )

  const upcomingBookings = useMemo(() => {
    const in7days = new Date(); in7days.setDate(in7days.getDate() + 7)
    const in7Str  = in7days.toISOString().slice(0, 10)
    return bookings
      .filter(b => b.status === 'CONFIRMED' && dateOnly(b.startTime) > today && dateOnly(b.startTime) <= in7Str)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [bookings, today])

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (filterHall   !== 'ALL' && b.hallName !== filterHall) return false
      if (filterStatus !== 'ALL' && b.status   !== filterStatus) return false
      if (filterFrom && dateOnly(b.startTime) < filterFrom) return false
      if (filterTo   && dateOnly(b.startTime) > filterTo)   return false
      return true
    })
  }, [bookings, filterHall, filterStatus, filterFrom, filterTo])

  // Booking count per hall
  const hallBookingCounts = useMemo(() => {
    const counts = {}
    bookings.filter(b => b.status === 'CONFIRMED').forEach(b => {
      counts[b.hallName] = (counts[b.hallName] || 0) + 1
    })
    return counts
  }, [bookings])

  const confirmedCount  = bookings.filter(b => b.status === 'CONFIRMED').length
  const revenue         = bills.filter(b => b.paid).reduce((s, b) => s + Number(b.total), 0)
  const pendingPayments = bills.filter(b => !b.paid && bookings.find(bk => bk.id === b.bookingId && bk.status !== 'CANCELLED')).length

  // ── hall form handlers ──────────────────────────────────────────────────────

  function openCreate() {
    setEditHall(null)
    setHallForm({ name:'', location:'', capacity:'', pricePerHour:'', description:'', imageUrl:'' })
    setHallError(''); setHallModal(true)
  }
  function openEdit(h) {
    setEditHall(h)
    setHallForm({ name:h.name, location:h.location, capacity:h.capacity, pricePerHour:h.pricePerHour, description:h.description||'', imageUrl:h.imageUrl||'' })
    setHallError(''); setHallModal(true)
  }
  async function saveHall(e) {
    e.preventDefault(); setHallError('')
    const payload = { ...hallForm, capacity: Number(hallForm.capacity), pricePerHour: Number(hallForm.pricePerHour) }
    try {
      if (editHall) {
        const { data } = await api.put(`/admin/halls/${editHall.id}`, payload)
        setHalls(hs => hs.map(h => h.id === editHall.id ? data : h))
      } else {
        const { data } = await api.post('/admin/halls', payload)
        setHalls(hs => [data, ...hs])
      }
      setHallModal(false)
    } catch (err) { setHallError(err.response?.data?.message || 'Failed to save hall') }
  }
  async function deactivateHall(id) {
    await api.delete(`/admin/halls/${id}`)
    setHalls(hs => hs.map(h => h.id === id ? { ...h, active: false } : h))
  }
  async function markPaid(id) {
    const { data } = await api.patch(`/admin/bills/${id}/pay`)
    setBills(bs => bs.map(b => b.id === id ? data : b))
  }

  const tabStyle = active => ({
    padding:'.5rem 1.2rem', border:'none', background:'none', cursor:'pointer',
    fontWeight: active ? 700 : 400,
    borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
    color: active ? 'var(--primary)' : 'var(--muted)', fontSize:'.95rem',
  })

  if (loading) return <div className="loading">Loading admin dashboard...</div>

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Everything the convention hall team needs in one place</p>
      </div>

      {/* ── Stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Active Halls',       value: halls.filter(h=>h.active).length, color:'var(--primary)' },
          { label:'Confirmed Bookings', value: confirmedCount,                    color:'#16a34a' },
        ].map(s => (
          <div className="card" key={s.label}>
            <div className="card-body" style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.6rem', fontWeight:700, color:s.color }}>{s.value}</div>
              <div style={{ color:'var(--muted)', fontSize:'.82rem', marginTop:'.2rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:'1.5rem', overflowX:'auto' }}>
        {[
          { key:'overview',  label:'📅 Overview' },
          { key:'bookings',  label:'📋 All Bookings' },
          { key:'halls',     label:'🏛️ Halls' },
          { key:'bills',     label:'💰 Bills' },
        ].map(t => (
          <button key={t.key} type="button" style={tabStyle(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          TAB 1: OVERVIEW — Today + Upcoming 7 days
          ══════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div>
          {/* TODAY */}
          <div style={{ marginBottom:'2rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'1rem' }}>
              <div style={{ fontSize:'1.2rem', fontWeight:700 }}>📅 Today's Events</div>
              <span style={{ background: todaysBookings.length > 0 ? '#dcfce7' : '#f1f5f9', color: todaysBookings.length > 0 ? '#16a34a' : 'var(--muted)', borderRadius:'999px', padding:'.15rem .7rem', fontSize:'.82rem', fontWeight:700 }}>
                {todaysBookings.length} booking{todaysBookings.length !== 1 ? 's' : ''}
              </span>
            </div>

            {todaysBookings.length === 0 ? (
              <div className="card">
                <div className="card-body" style={{ textAlign:'center', color:'var(--muted)', padding:'1.5rem' }}>
                  🎉 No bookings today — hall is free!
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
                {todaysBookings.map(b => (
                  <div key={b.id} className="card" style={{ borderLeft:`4px solid var(--primary)` }}>
                    <div className="card-body" style={{ padding:'1rem 1.25rem' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'.5rem', alignItems:'center' }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:'.95rem' }}>{b.eventName}</div>
                          <div style={{ fontSize:'.82rem', color:'var(--muted)' }}>{b.hallName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:'.8rem', color:'var(--muted)' }}>Time</div>
                          <div style={{ fontWeight:600, fontSize:'.92rem' }}>
                            {fmtTime(b.startTime)} – {fmtTime(b.endTime)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize:'.8rem', color:'var(--muted)' }}>Customer</div>
                          <div style={{ fontWeight:600, fontSize:'.88rem' }}>{b.userName}</div>
                          <div style={{ fontSize:'.76rem', color:'var(--muted)' }}>{b.userEmail}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:'.8rem', color:'var(--muted)' }}>Guests / Amount</div>
                          <div style={{ fontWeight:700 }}>{b.guestCount} guests</div>
                          <div style={{ color:'var(--primary)', fontWeight:700 }}>
                            {b.bill ? rupee(b.bill.total) : '—'}
                          </div>
                        </div>
                      </div>
                      {/* services row */}
                      <div style={{ display:'flex', gap:'.5rem', marginTop:'.6rem', flexWrap:'wrap' }}>
                        {b.catering          && <span className="badge badge-blue">🍽️ Catering</span>}
                        {b.decorationPackage && <span className="badge badge-blue">🎊 {b.decorationPackage}</span>}
                        {b.menuSummary       && <span style={{ fontSize:'.78rem', color:'var(--muted)' }}>Menu: {b.menuSummary}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UPCOMING 7 DAYS */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'1rem' }}>
              <div style={{ fontSize:'1.2rem', fontWeight:700 }}>📆 Next 7 Days</div>
              <span style={{ background:'#dbeafe', color:'#1d4ed8', borderRadius:'999px', padding:'.15rem .7rem', fontSize:'.82rem', fontWeight:700 }}>
                {upcomingBookings.length} upcoming
              </span>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="card">
                <div className="card-body" style={{ textAlign:'center', color:'var(--muted)', padding:'1.5rem' }}>
                  No upcoming bookings in the next 7 days.
                </div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
                {upcomingBookings.map(b => (
                  <div key={b.id} className="card" style={{ borderLeft:'4px solid #60a5fa' }}>
                    <div className="card-body" style={{ padding:'1rem 1.25rem' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'.5rem', alignItems:'center' }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:'.95rem' }}>{b.eventName}</div>
                          <div style={{ fontSize:'.82rem', color:'var(--muted)' }}>{b.hallName}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:'.8rem', color:'var(--muted)' }}>Date & Time</div>
                          <div style={{ fontWeight:600, fontSize:'.88rem' }}>
                            {fmtDate(b.startTime)}
                          </div>
                          <div style={{ fontSize:'.82rem', color:'var(--muted)' }}>
                            {fmtTime(b.startTime)} – {fmtTime(b.endTime)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize:'.8rem', color:'var(--muted)' }}>Customer</div>
                          <div style={{ fontWeight:600, fontSize:'.88rem' }}>{b.userName}</div>
                          <div style={{ fontSize:'.76rem', color:'var(--muted)' }}>{b.userEmail}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontWeight:700 }}>{b.guestCount} guests</div>
                          <div style={{ color:'var(--primary)', fontWeight:700 }}>
                            {b.bill ? rupee(b.bill.total) : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 2: ALL BOOKINGS — with filters
          ══════════════════════════════════════════════ */}
      {tab === 'bookings' && (
        <div>
          {/* Filter bar */}
          <div className="card" style={{ marginBottom:'1rem' }}>
            <div className="card-body" style={{ padding:'.85rem 1.25rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:'.75rem', alignItems:'end' }}>

                <div className="form-group" style={{ marginBottom:0 }}>
                  <label>Hall</label>
                  <select value={filterHall} onChange={e => setFilterHall(e.target.value)}>
                    <option value="ALL">All Halls</option>
                    {halls.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom:0 }}>
                  <label>Status</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="ALL">All Statuses</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom:0 }}>
                  <label>From Date</label>
                  <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
                </div>

                <div className="form-group" style={{ marginBottom:0 }}>
                  <label>To Date</label>
                  <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
                </div>

                <button type="button" className="btn btn-outline btn-sm"
                  onClick={() => { setFilterHall('ALL'); setFilterStatus('CONFIRMED'); setFilterFrom(''); setFilterTo('') }}
                  style={{ alignSelf:'end' }}>
                  Clear Filters
                </button>
              </div>
              <div style={{ marginTop:'.5rem', fontSize:'.82rem', color:'var(--muted)' }}>
                Showing <strong>{filteredBookings.length}</strong> of {bookings.length} bookings
              </div>
            </div>
          </div>

          <BookingsTable
            rows={filteredBookings}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB 3: HALLS — with booking counts
          ══════════════════════════════════════════════ */}
      {tab === 'halls' && (
        <>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1rem' }}>
            <button className="btn btn-primary" onClick={openCreate}>+ Add Hall</button>
          </div>
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Location</th><th>Capacity</th>
                  <th>Price/hr</th><th>Bookings</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {halls.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontWeight:600 }}>{h.name}</td>
                    <td>{h.location}</td>
                    <td>{h.capacity}</td>
                    <td>₹{h.pricePerHour}</td>
                    <td>
                      <span style={{
                        background:'#dbeafe', color:'#1d4ed8',
                        borderRadius:'999px', padding:'.15rem .7rem',
                        fontWeight:700, fontSize:'.82rem'
                      }}>
                        {hallBookingCounts[h.name] || 0} confirmed
                      </span>
                    </td>
                    <td>
                      {h.active
                        ? <span className="badge badge-green">Active</span>
                        : <span className="badge badge-red">Inactive</span>}
                    </td>
                    <td style={{ display:'flex', gap:'.5rem' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(h)}>Edit</button>
                      {h.active && (
                        <button className="btn btn-danger btn-sm" onClick={() => deactivateHall(h.id)}>
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          TAB 4: BILLS
          ══════════════════════════════════════════════ */}
      {tab === 'bills' && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bill#</th><th>Customer</th><th>Hall</th>
                <th>Subtotal</th><th>GST</th><th>Total</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(b => {
                const bk = bookings.find(bk => bk.id === b.bookingId)
                return (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>
                      <div style={{ fontWeight:600, fontSize:'.88rem' }}>{bk?.userName || '—'}</div>
                      <div style={{ fontSize:'.76rem', color:'var(--muted)' }}>{bk?.userEmail}</div>
                    </td>
                    <td>{b.hallName}</td>
                    <td>{rupee(b.amount)}</td>
                    <td>{rupee(b.tax)}</td>
                    <td style={{ fontWeight:700 }}>{rupee(b.total)}</td>
                    <td>
                      {b.paid
                        ? <span className="badge badge-green">Paid</span>
                        : <span className="badge badge-yellow">Unpaid</span>}
                    </td>
                    <td>
                      {!b.paid && (
                        <button className="btn btn-primary btn-sm" onClick={() => markPaid(b.id)}>
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Hall Modal ── */}
      {hallModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setHallModal(false) }}>
          <div className="modal">
            <h3>{editHall ? 'Edit Hall' : 'Add New Hall'}</h3>
            {hallError && <div className="alert alert-error">{hallError}</div>}
            <form onSubmit={saveHall}>
              {[
                { label:'Name',           key:'name',         placeholder:'Grand Ballroom' },
                { label:'Location',       key:'location',     placeholder:'Level 1, Main Wing' },
                { label:'Capacity',       key:'capacity',     placeholder:'500',  type:'number' },
                { label:'Price per Hour', key:'pricePerHour', placeholder:'5000', type:'number' },
                { label:'Image URL',      key:'imageUrl',     placeholder:'https://...' },
              ].map(f => (
                <div className="form-group" key={f.key}>
                  <label>{f.label}</label>
                  <input type={f.type||'text'} placeholder={f.placeholder}
                    value={hallForm[f.key]}
                    onChange={e => setHallForm({ ...hallForm, [f.key]: e.target.value })}
                    required={f.key !== 'imageUrl'} />
                </div>
              ))}
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={hallForm.description}
                  onChange={e => setHallForm({ ...hallForm, description: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setHallModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Hall</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
