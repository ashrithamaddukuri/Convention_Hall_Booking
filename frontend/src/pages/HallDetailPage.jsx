import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

// ─── helpers ────────────────────────────────────────────────────────────────

function toLocalMin(dt) {
  const d = new Date(dt)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

// KEY FIX: send datetime string as-is (local time), never convert to UTC
function toLocalIso(val) {
  // val is "2026-12-15T09:30" from datetime-local input — just append :00
  return val.length === 16 ? val + ':00' : val
}

function fmt(dt) {
  // dt arrives from backend as "2026-12-15T09:30:00" (local, no Z)
  // Parse without timezone shift by replacing T with space
  const d = new Date(dt.replace('T', ' '))
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function rupee(n) {
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })
}

// ─── Menu catalogue (kept in frontend — no extra API round-trip needed) ──────

const MENU_CATALOGUE = {
  Starters: [
    { id: 's1', name: 'Paneer Tikka',       type: 'VEG',     price: 80 },
    { id: 's2', name: 'Hara Bhara Kabab',   type: 'VEG',     price: 70 },
    { id: 's3', name: 'Veg Manchurian',     type: 'VEG',     price: 65 },
    { id: 's4', name: 'Sweet Corn Soup',    type: 'VEG',     price: 50 },
    { id: 's5', name: 'Chicken Tikka',      type: 'NON_VEG', price: 100 },
    { id: 's6', name: 'Fish Amritsari',     type: 'NON_VEG', price: 110 },
    { id: 's7', name: 'Mutton Seekh Kabab', type: 'NON_VEG', price: 120 },
    { id: 's8', name: 'Chicken Manchurian', type: 'NON_VEG', price: 95 },
  ],
  Mains: [
    { id: 'm1', name: 'Paneer Butter Masala',        type: 'VEG',     price: 90 },
    { id: 'm2', name: 'Dal Makhani',                 type: 'VEG',     price: 70 },
    { id: 'm3', name: 'Veg Biryani',                 type: 'VEG',     price: 85 },
    { id: 'm4', name: 'Jeera Rice',                  type: 'VEG',     price: 45 },
    { id: 'm5', name: 'Butter Naan',                 type: 'VEG',     price: 20 },
    { id: 'm6', name: 'Hyderabadi Chicken Biryani',  type: 'NON_VEG', price: 120 },
    { id: 'm7', name: 'Butter Chicken',              type: 'NON_VEG', price: 110 },
    { id: 'm8', name: 'Mutton Rogan Josh',           type: 'NON_VEG', price: 140 },
  ],
  Desserts: [
    { id: 'd1', name: 'Gulab Jamun',       type: 'VEG', price: 40 },
    { id: 'd2', name: 'Rasmalai',          type: 'VEG', price: 50 },
    { id: 'd3', name: 'Chocolate Brownie', type: 'VEG', price: 55 },
    { id: 'd4', name: 'Vanilla Ice Cream', type: 'VEG', price: 35 },
  ],
  Beverages: [
    { id: 'b1', name: 'Masala Chai',       type: 'VEG', price: 20 },
    { id: 'b2', name: 'Filter Coffee',     type: 'VEG', price: 25 },
    { id: 'b3', name: 'Fresh Fruit Juice', type: 'VEG', price: 40 },
    { id: 'b4', name: 'Sweet Lassi',       type: 'VEG', price: 35 },
  ],
}

const DECORATION_PACKAGES = [
  { id: 'dp0', name: 'None',            description: 'No decoration',                                                                     price: 0 },
  { id: 'dp1', name: 'Classic Setup',   description: 'Entrance arch, stage draping, basic lighting, aisle runners',                      price: 2500 },
  { id: 'dp2', name: 'Floral Elegance', description: 'Fresh flower arrangements, floral arch, centerpieces, soft lighting',             price: 5000 },
  { id: 'dp3', name: 'Royal Theme',     description: 'Premium themed decor, chandeliers, stage mandap, LED walls, entrance pathway',    price: 9000 },
  { id: 'dp4', name: 'Wedding Grand',   description: 'Full venue theming, flower walls, customized stage, photo booth, lighting effects', price: 15000 },
]

// ─── Menu picker sub-component ───────────────────────────────────────────────

function MenuPicker({ selected, onChange, guestCount }) {
  const [activeTab, setActiveTab] = useState('Starters')
  const tabStyle = active => ({
    padding: '.35rem .9rem', border: 'none', background: 'none', cursor: 'pointer',
    fontWeight: active ? 700 : 400, fontSize: '.88rem',
    borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
    color: active ? 'var(--primary)' : 'var(--muted)',
  })

  function toggle(item) {
    const next = new Set(selected)
    next.has(item.id) ? next.delete(item.id) : next.add(item.id)
    onChange(next)
  }

  const allItems = Object.values(MENU_CATALOGUE).flat()
  const selectedItems = allItems.filter(i => selected.has(i.id))
  const totalPerPlate = selectedItems.reduce((s, i) => s + i.price, 0)

  return (
    <div style={{ border: '1.5px solid var(--border)', borderRadius: '.6rem', overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg)', overflowX: 'auto' }}>
        {Object.keys(MENU_CATALOGUE).map(cat => (
          <button key={cat} type="button" style={tabStyle(activeTab === cat)} onClick={() => setActiveTab(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '.5rem', padding: '.75rem' }}>
        {MENU_CATALOGUE[activeTab].map(item => {
          const isSelected = selected.has(item.id)
          return (
            <div key={item.id}
              role="button"
              tabIndex={0}
              onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(item) }}
              onKeyDown={e => e.key === 'Enter' && toggle(item)}
              style={{
                border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '.5rem', padding: '.6rem .75rem', cursor: 'pointer',
                background: isSelected ? '#eef2ff' : 'var(--card)', transition: 'all .15s',
                display: 'flex', flexDirection: 'column', gap: '.15rem',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{item.name}</span>
                <span style={{
                  fontSize: '.68rem', fontWeight: 700, padding: '.1rem .4rem', borderRadius: '999px',
                  background: item.type === 'VEG' ? '#dcfce7' : '#fee2e2',
                  color: item.type === 'VEG' ? '#16a34a' : '#dc2626',
                }}>{item.type === 'VEG' ? '🟢 V' : '🔴 NV'}</span>
              </div>
              <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>₹{item.price}/plate</div>
              {isSelected && <div style={{ fontSize: '.75rem', color: 'var(--primary)', fontWeight: 600 }}>✓ Selected</div>}
            </div>
          )
        })}
      </div>

      {/* Selection summary */}
      {selected.size > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '.6rem .85rem', background: '#f8faff', fontSize: '.83rem', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--muted)' }}>{selected.size} item(s) · ₹{totalPerPlate}/plate</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
            Total food: ₹{(totalPerPlate * guestCount).toLocaleString('en-IN')} for {guestCount} guests
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Decoration picker sub-component ─────────────────────────────────────────

function DecorationPicker({ selected, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
      {DECORATION_PACKAGES.map(pkg => {
        const isSelected = selected === pkg.id
        return (
          <div key={pkg.id}
            role="button"
            tabIndex={0}
            onClick={e => { e.preventDefault(); e.stopPropagation(); onChange(pkg.id) }}
            onKeyDown={e => e.key === 'Enter' && onChange(pkg.id)}
            style={{
            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: '.6rem', padding: '.85rem 1rem', cursor: 'pointer',
            background: isSelected ? '#eef2ff' : 'var(--card)', transition: 'all .15s',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  background: isSelected ? 'var(--primary)' : 'transparent', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSelected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ fontWeight: 700, fontSize: '.92rem' }}>
                  {pkg.id === 'dp0' ? '❌ ' : '🎊 '}{pkg.name}
                </span>
              </div>
              <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: '.2rem', paddingLeft: '1.6rem' }}>
                {pkg.description}
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: '.95rem', color: pkg.price === 0 ? 'var(--muted)' : 'var(--primary)', flexShrink: 0, marginLeft: '1rem' }}>
              {pkg.price === 0 ? 'Free' : rupee(pkg.price)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Booking Form ─────────────────────────────────────────────────────

function BookingForm({ hall, onQuote }) {
  const minDate = toLocalMin(new Date(Date.now() + 60 * 60 * 1000))

  const [form, setForm] = useState({
    eventName:  '',
    startTime:  '',
    endTime:    '',
    guestCount: 50,
    catering:   false,
  })
  const [selectedMenuItems,  setSelectedMenuItems]  = useState(new Set())
  const [selectedDecoration, setSelectedDecoration] = useState('dp0')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function calcFoodCharge() {
    const allItems = Object.values(MENU_CATALOGUE).flat()
    const perPlate = allItems.filter(i => selectedMenuItems.has(i.id)).reduce((s, i) => s + i.price, 0)
    return perPlate * Number(form.guestCount)
  }

  function getDecorationPkg() {
    return DECORATION_PACKAGES.find(p => p.id === selectedDecoration) || DECORATION_PACKAGES[0]
  }

  async function handleGetQuote(e) {
    e.preventDefault()
    setError('')
    if (!form.startTime || !form.endTime) { setError('Select start and end times'); return }
    if (new Date(form.endTime) <= new Date(form.startTime)) { setError('End time must be after start time'); return }
    if (form.guestCount < 1) { setError('Guest count must be at least 1'); return }

    const decorPkg   = getDecorationPkg()
    const foodCharge = calcFoodCharge()
    const allItems   = Object.values(MENU_CATALOGUE).flat()
    const menuSummary = allItems.filter(i => selectedMenuItems.has(i.id)).map(i => i.name).join(', ') || null

    setLoading(true)
    try {
      const { data } = await api.post('/bookings/quote', {
        hallId:            hall.id,
        eventName:         form.eventName,
        startTime:         toLocalIso(form.startTime),   // ← local time, no UTC shift
        endTime:           toLocalIso(form.endTime),
        guestCount:        Number(form.guestCount),
        menuSummary,
        foodCharge,
        decorationPackage: decorPkg.price > 0 ? decorPkg.name : null,
        decorationCharge:  decorPkg.price,
        catering:          form.catering,
      })
      onQuote(data, { ...form, menuSummary, foodCharge, decorPkg, selectedMenuItems })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load quote.')
    } finally {
      setLoading(false)
    }
  }

  const decorPkg   = getDecorationPkg()
  const foodCharge = calcFoodCharge()

  // Live cost preview
  const hallHours  = form.startTime && form.endTime
    ? Math.max(0, (new Date(form.endTime) - new Date(form.startTime)) / 3600000)
    : 0
  const hallCharge = hallHours * hall.pricePerHour
  const catering   = form.catering ? 5000 : 0
  const subtotal   = hallCharge + foodCharge + decorPkg.price + catering
  const total      = subtotal * 1.18

  return (
    <form onSubmit={handleGetQuote}>
      {error && <div className="alert alert-error">{error}</div>}

      {/* Event name */}
      <div className="form-group">
        <label>Event Name</label>
        <input value={form.eventName} onChange={e => set('eventName', e.target.value)}
          placeholder="e.g. Wedding Reception" required />
      </div>

      {/* Date & time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Start Date &amp; Time</label>
          <input type="datetime-local" min={minDate} value={form.startTime}
            onChange={e => set('startTime', e.target.value)} required />
        </div>
        <div className="form-group">
          <label>End Date &amp; Time</label>
          <input type="datetime-local" min={form.startTime || minDate} value={form.endTime}
            onChange={e => set('endTime', e.target.value)} required />
        </div>
      </div>

      {/* Guest count */}
      <div className="form-group">
        <label>Number of Guests</label>
        <input type="number" min="1" max={hall.capacity} value={form.guestCount}
          onChange={e => set('guestCount', e.target.value)} required />
        <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>Max capacity: {hall.capacity}</span>
      </div>

      {/* Menu picker */}
      <div className="form-group">
        <label style={{ marginBottom: '.5rem', display: 'block' }}>
          Food Menu <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '.85rem' }}>(select items — priced per plate per guest)</span>
        </label>
        <MenuPicker
          selected={selectedMenuItems}
          onChange={setSelectedMenuItems}
          guestCount={Number(form.guestCount)}
        />
      </div>

      {/* Catering */}
      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.catering} onChange={e => set('catering', e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
          <span>🍽️ Catering Setup — <strong>₹2,000 flat</strong></span>
        </label>
        <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: '.25rem', paddingLeft: '1.6rem' }}>
          Includes serving staff, table setup, cutlery &amp; linen arrangement
        </div>
      </div>

      {/* Decoration picker */}
      <div className="form-group">
        <label style={{ marginBottom: '.5rem', display: 'block' }}>Decoration Package</label>
        <DecorationPicker selected={selectedDecoration} onChange={setSelectedDecoration} />
      </div>

      {/* Live cost preview */}
      {hallHours > 0 && (
        <div style={{ background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: '.6rem', padding: '.85rem 1rem', marginBottom: '1rem', fontSize: '.88rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '.4rem', color: 'var(--primary)' }}>Estimated Cost Preview</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.15rem', color: 'var(--text)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Hall ({hallHours.toFixed(1)} hrs)</span><span>{rupee(hallCharge)}</span>
            </div>
            {foodCharge > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Food ({selectedMenuItems.size} items × {form.guestCount} guests)</span><span>{rupee(foodCharge)}</span>
              </div>
            )}
            {form.catering && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Catering Setup</span><span>{rupee(5000)}</span>
              </div>
            )}
            {decorPkg.price > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Decoration ({decorPkg.name})</span><span>{rupee(decorPkg.price)}</span>
              </div>
            )}
            <div style={{ borderTop: '1px dashed #c7d2fe', marginTop: '.25rem', paddingTop: '.25rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--primary)' }}>
              <span>Total (incl. 18% GST)</span><span>{rupee(total)}</span>
            </div>
          </div>
        </div>
      )}

      <button className="btn btn-primary" style={{ width: '100%', fontSize: '1rem', padding: '.75rem' }} disabled={loading}>
        {loading ? 'Calculating...' : '📋 Get Quote →'}
      </button>
    </form>
  )
}

// ─── Step 2: Quote Summary ────────────────────────────────────────────────────

function QuoteSummary({ quote, savedForm, hall, onConfirm, onBack, confirming, confirmError }) {
  const rows = [
    { label: 'Hall Charge', amount: quote.hallCharge,
      note: `${((new Date(savedForm.endTime) - new Date(savedForm.startTime)) / 3600000).toFixed(2)} hrs × ₹${hall.pricePerHour}/hr` },
    Number(quote.foodCharge) > 0 && { label: 'Food', amount: quote.foodCharge,
      note: `${savedForm.selectedMenuItems?.size || 0} items × ${savedForm.guestCount} guests` },
    Number(quote.cateringCharge) > 0 && { label: 'Catering Setup', amount: quote.cateringCharge, note: 'Flat rate' },
    Number(quote.decorationCharge) > 0 && { label: `Decoration — ${quote.decorationPackage}`, amount: quote.decorationCharge, note: 'Package' },
  ].filter(Boolean)

  return (
    <div>
      {/* Availability */}
      {!quote.slotAvailable ? (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '.6rem', padding: '1rem', marginBottom: '1.2rem', display: 'flex', gap: '.75rem' }}>
          <span style={{ fontSize: '1.4rem' }}>⛔</span>
          <div>
            <div style={{ fontWeight: 700, color: '#991b1b' }}>Hall Already Booked</div>
            <div style={{ fontSize: '.85rem', color: '#b91c1c' }}>
              {hall.name} is unavailable from {fmt(quote.startTime)} to {fmt(quote.endTime)}. Go back and choose a different time.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '.6rem', padding: '.75rem 1rem', marginBottom: '1.2rem', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <span>✅</span><span style={{ fontWeight: 600, color: '#166534' }}>Slot Available!</span>
        </div>
      )}

      {/* Booking details */}
      <div style={{ background: 'var(--bg)', borderRadius: '.6rem', padding: '1rem', marginBottom: '1rem', fontSize: '.88rem' }}>
        <div style={{ fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.05em', marginBottom: '.5rem' }}>Booking Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '.25rem .75rem' }}>
          <span style={{ color: 'var(--muted)' }}>Hall</span>      <span style={{ fontWeight: 600 }}>{hall.name}</span>
          <span style={{ color: 'var(--muted)' }}>Event</span>     <span style={{ fontWeight: 600 }}>{savedForm.eventName}</span>
          <span style={{ color: 'var(--muted)' }}>Start</span>     <span>{fmt(quote.startTime)}</span>
          <span style={{ color: 'var(--muted)' }}>End</span>       <span>{fmt(quote.endTime)}</span>
          <span style={{ color: 'var(--muted)' }}>Guests</span>    <span>{quote.guestCount}</span>
          <span style={{ color: 'var(--muted)' }}>Catering</span>  <span>{quote.catering ? '✅ Yes' : '❌ No'}</span>
          <span style={{ color: 'var(--muted)' }}>Decoration</span><span>{quote.decorationPackage || '—'}</span>
        </div>
        {quote.menuSummary && (
          <div style={{ marginTop: '.6rem' }}>
            <span style={{ color: 'var(--muted)' }}>Menu: </span>
            <span style={{ fontSize: '.82rem' }}>{quote.menuSummary}</span>
          </div>
        )}
      </div>

      {/* Cost breakdown */}
      <div style={{ border: '1px solid var(--border)', borderRadius: '.6rem', overflow: 'hidden', marginBottom: '1.2rem' }}>
        <div style={{ background: 'var(--bg)', padding: '.55rem 1rem', fontWeight: 700, fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Cost Breakdown</div>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '.55rem 1rem', borderTop: '1px solid var(--border)', fontSize: '.9rem' }}>
            <span>{row.label} <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{row.note}</span></span>
            <span style={{ fontWeight: 600 }}>{rupee(row.amount)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.55rem 1rem', borderTop: '1px solid var(--border)', fontSize: '.88rem', color: 'var(--muted)' }}>
          <span>Subtotal</span><span>{rupee(quote.subtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.55rem 1rem', borderTop: '1px solid var(--border)', fontSize: '.88rem', color: 'var(--muted)' }}>
          <span>GST (18%)</span><span>{rupee(quote.tax)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.8rem 1rem', borderTop: '2px solid var(--border)', background: '#eef2ff' }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Total Amount</span>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>{rupee(quote.total)}</span>
        </div>
      </div>

      {confirmError && <div className="alert alert-error">{confirmError}</div>}

      <div style={{ display: 'flex', gap: '.75rem' }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={onBack}>← Back</button>
        <button className="btn btn-primary"
          style={{ flex: 2, fontSize: '1rem', padding: '.75rem', opacity: !quote.slotAvailable ? .5 : 1 }}
          disabled={!quote.slotAvailable || confirming}
          onClick={onConfirm}>
          {confirming ? 'Booking...' : '🎉 Book Now'}
        </button>
      </div>
      {!quote.slotAvailable && (
        <p style={{ textAlign: 'center', marginTop: '.5rem', fontSize: '.82rem', color: '#dc2626' }}>Slot is taken — please go back and choose another time.</p>
      )}
    </div>
  )
}

// ─── Step 3: Confirmed ────────────────────────────────────────────────────────

function BookingConfirmed({ booking }) {
  return (
    <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
      <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>🎉</div>
      <h3 style={{ fontSize: '1.4rem', marginBottom: '.25rem' }}>Booking Confirmed!</h3>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>Booking #{booking.id} is confirmed.</p>
      <div style={{ background: 'var(--bg)', borderRadius: '.6rem', padding: '1rem', textAlign: 'left', fontSize: '.9rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '.3rem .75rem' }}>
          <span style={{ color: 'var(--muted)' }}>Hall</span>       <span style={{ fontWeight: 600 }}>{booking.hallName}</span>
          <span style={{ color: 'var(--muted)' }}>Event</span>      <span style={{ fontWeight: 600 }}>{booking.eventName}</span>
          <span style={{ color: 'var(--muted)' }}>Total Bill</span> <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>{rupee(booking.bill?.total)}</span>
        </div>
      </div>
      <a href="/bookings" className="btn btn-primary" style={{ display: 'inline-block' }}>View My Bookings →</a>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HallDetailPage() {
  const { id }   = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [hall,         setHall]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [step,         setStep]         = useState(1)
  const [quote,        setQuote]        = useState(null)
  const [savedForm,    setSavedForm]    = useState(null)
  const [confirming,   setConfirming]   = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [booking,      setBooking]      = useState(null)

  useEffect(() => {
    api.get(`/halls/${id}`).then(r => setHall(r.data)).finally(() => setLoading(false))
  }, [id])

  function handleQuote(quoteData, formData) {
    setQuote(quoteData)
    setSavedForm(formData)
    setStep(2)
  }

  async function handleConfirm() {
    if (!user) { navigate('/login'); return }
    setConfirmError('')
    setConfirming(true)
    try {
      const { data } = await api.post('/bookings', {
        hallId:            hall.id,
        eventName:         savedForm.eventName,
        startTime:         toLocalIso(savedForm.startTime),
        endTime:           toLocalIso(savedForm.endTime),
        guestCount:        Number(savedForm.guestCount),
        menuSummary:       savedForm.menuSummary,
        foodCharge:        savedForm.foodCharge,
        decorationPackage: savedForm.decorPkg?.price > 0 ? savedForm.decorPkg.name : null,
        decorationCharge:  savedForm.decorPkg?.price ?? 0,
        catering:          savedForm.catering,
      })
      setBooking(data)
      setStep(3)
    } catch (err) {
      setConfirmError(err.response?.data?.message || 'Booking failed. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return <div className="loading">Loading hall details...</div>
  if (!hall)   return <div className="loading">Hall not found.</div>

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

        {/* Hall info */}
        <div className="card">
          <img src={hall.imageUrl} alt={hall.name}
            style={{ width: '100%', height: '260px', objectFit: 'cover' }}
            onError={e => { e.target.src = 'https://via.placeholder.com/600x260?text=Hall' }} />
          <div className="card-body">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>{hall.name}</h2>
            <div className="hall-meta">
              <span>📍 {hall.location}</span>
              <span>👥 Capacity: {hall.capacity}</span>
            </div>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>{hall.description}</p>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>
              ₹{hall.pricePerHour}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--muted)' }}> / hour</span>
            </div>
            <div style={{ marginTop: '1rem', background: 'var(--bg)', borderRadius: '.6rem', padding: '.85rem', fontSize: '.82rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '.4rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em', fontSize: '.72rem' }}>Add-on Pricing</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                <span>🍽️ Food — per item per plate (see menu selector)</span>
                <span>🍽️ Catering Setup — ₹2,000 flat</span>
                <span>🎊 Decoration — ₹2,500 to ₹15,000 (4 packages)</span>
                <span style={{ color: 'var(--muted)', marginTop: '.2rem' }}>+ 18% GST on everything</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="card">
          <div className="card-body">
            {/* Step indicator */}
            {step < 3 && (
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.4rem', gap: '.5rem' }}>
                {[{ n: 1, label: 'Fill Details' }, { n: 2, label: 'Review Quote' }].map((s, i) => (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flex: i === 0 ? 'none' : 1 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: step >= s.n ? 'var(--primary)' : 'var(--border)',
                      color: step >= s.n ? '#fff' : 'var(--muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '.85rem', flexShrink: 0,
                    }}>{s.n}</div>
                    <span style={{ fontSize: '.85rem', fontWeight: step === s.n ? 700 : 400, color: step === s.n ? 'var(--text)' : 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                    {i === 0 && <div style={{ flex: 1, height: 2, background: step > 1 ? 'var(--primary)' : 'var(--border)', margin: '0 .25rem' }} />}
                  </div>
                ))}
              </div>
            )}

            {!user && step === 1 && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                Please <a href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>log in</a> to book a hall.
              </div>
            )}

            {step === 1 && <BookingForm hall={hall} onQuote={handleQuote} />}

            {step === 2 && quote && (
              <QuoteSummary
                quote={quote} savedForm={savedForm} hall={hall}
                onBack={() => setStep(1)} onConfirm={handleConfirm}
                confirming={confirming} confirmError={confirmError}
              />
            )}

            {step === 3 && booking && <BookingConfirmed booking={booking} />}
          </div>
        </div>
      </div>
    </div>
  )
}
