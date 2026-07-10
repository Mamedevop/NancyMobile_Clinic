import { Link } from 'react-router-dom'
import { FaMobileAlt, FaShieldAlt, FaCheckCircle, FaTruck, FaHeadset,
  FaTag, FaExchangeAlt, FaAward, FaCreditCard, FaSearch, FaShoppingCart,
  FaTools, FaStar, FaArrowRight } from 'react-icons/fa'

export default function Landing() {
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: '#f5f3ff', minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 60px', background: 'white',
        boxShadow: '0 2px 12px rgba(100,60,220,0.07)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaMobileAlt style={{ color: '#7c3aed', fontSize: 26 }} />
          <div>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#1a1a2e' }}>Nancy</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: '#7c3aed', display: 'block', lineHeight: 1 }}>Mobile</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {['Home', 'Shop', 'Brands', 'Accessories', 'Offers', 'About Us', 'Contact'].map((item, i) => (
            <a key={item} href={i === 0 ? '#' : `#${item.toLowerCase().replace(' ', '-')}`}
              style={{ textDecoration: 'none', color: i === 0 ? '#7c3aed' : '#444', fontWeight: i === 0 ? 700 : 500, fontSize: 15,
                borderBottom: i === 0 ? '2px solid #7c3aed' : 'none', paddingBottom: 2 }}>
              {item}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <FaSearch style={{ color: '#555', fontSize: 18, cursor: 'pointer' }} />
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <FaShoppingCart style={{ color: '#555', fontSize: 20 }} />
            <span style={{ position: 'absolute', top: -8, right: -8, background: '#7c3aed', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>0</span>
          </div>
          <Link to="/login" style={{ background: '#7c3aed', color: 'white', padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center',
        padding: '60px 60px 40px', maxWidth: 1200, margin: '0 auto', gap: 40
      }}>
        {/* Left */}
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(124,58,237,0.1)', color: '#7c3aed', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 700, marginBottom: 20, letterSpacing: 1 }}>
            NEW ARRIVALS
          </div>
          <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.1, margin: '0 0 8px', color: '#1a1a2e' }}>
            Nancy <span style={{ color: '#7c3aed' }}>Mobile</span>
          </h1>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e', margin: '0 0 16px' }}>
            Your World. Connected.
          </h2>
          <p style={{ fontSize: 16, color: '#666', lineHeight: 1.7, marginBottom: 32, maxWidth: 420 }}>
            Discover the latest smartphones, gadgets and accessories from top brands at the best prices.
          </p>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 24, background: 'white', borderRadius: 16, padding: '16px 24px', marginBottom: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', width: 'fit-content' }}>
            {[
              { icon: <FaShieldAlt />, label: '100%', sub: 'Original Products' },
              { icon: <FaCheckCircle />, label: 'Trusted', sub: 'Quality' },
              { icon: <FaTruck />, label: 'Fast & Safe', sub: 'Delivery' },
              { icon: <FaHeadset />, label: 'Dedicated', sub: 'Support' },
            ].map(b => (
              <div key={b.label} style={{ textAlign: 'center', minWidth: 70 }}>
                <div style={{ color: '#7c3aed', fontSize: 20, marginBottom: 4 }}>{b.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#1a1a2e' }}>{b.label}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{b.sub}</div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 14 }}>
            <Link to="/register" style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              color: 'white', padding: '14px 28px', borderRadius: 12,
              textDecoration: 'none', fontWeight: 700, fontSize: 15,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 6px 20px rgba(124,58,237,0.4)'
            }}>
              <FaShoppingCart /> Shop Now <FaArrowRight style={{ fontSize: 12 }} />
            </Link>
            <Link to="/login" style={{
              background: 'white', color: '#7c3aed', padding: '14px 28px', borderRadius: 12,
              textDecoration: 'none', fontWeight: 700, fontSize: 15, border: '2px solid #e9d5ff',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <FaTag /> Explore Offers
            </Link>
          </div>
        </div>

        {/* Right — phone visual */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          {/* Glowing circle background */}
          <div style={{
            width: 420, height: 420, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(124,58,237,0.1) 60%, transparent 100%)',
            position: 'absolute'
          }} />
          {/* Phone emojis as placeholder (replace with real images if available) */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: -20 }}>
            <div style={{ fontSize: 120, filter: 'drop-shadow(-8px 8px 20px rgba(124,58,237,0.4))', transform: 'rotate(-8deg) translateY(20px)' }}>📱</div>
            <div style={{ fontSize: 150, filter: 'drop-shadow(0 12px 30px rgba(124,58,237,0.5))', zIndex: 2 }}>📱</div>
            <div style={{ fontSize: 120, filter: 'drop-shadow(8px 8px 20px rgba(0,0,0,0.3))', transform: 'rotate(8deg) translateY(20px)' }}>📱</div>
          </div>
          {/* Glowing platform */}
          <div style={{
            position: 'absolute', bottom: 20, width: 280, height: 20, borderRadius: '50%',
            background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.6), transparent)',
            filter: 'blur(8px)'
          }} />
        </div>
      </section>

      {/* ── BRANDS ── */}
      <section style={{ background: 'white', padding: '24px 60px', margin: '0 auto', maxWidth: 1200, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          {[
            { name: '🍎', label: '', color: '#000', fontSize: 32 },
            { name: 'SAMSUNG', label: '', color: '#1428A0', fontSize: 18, fontWeight: 800 },
            { name: 'mi', label: '', color: '#FF6900', fontSize: 28, fontWeight: 900, bg: '#FF6900', textColor: 'white', pad: '4px 12px', radius: 8 },
            { name: 'realme', label: '', color: '#FFD700', fontSize: 18, fontWeight: 800, bg: '#FFD700', textColor: '#000', pad: '4px 14px', radius: 6 },
            { name: 'vivo', label: '', color: '#415FFF', fontSize: 22, fontWeight: 800 },
            { name: '1+ONEPLUS', label: '', color: '#EB0028', fontSize: 16, fontWeight: 800 },
            { name: 'OPPO', label: '', color: '#1D8348', fontSize: 20, fontWeight: 800 },
          ].map(b => (
            <div key={b.name} style={{ cursor: 'pointer', opacity: 0.8, transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.8}>
              <span style={{
                fontSize: b.fontSize || 18, fontWeight: b.fontWeight || 700, color: b.textColor || b.color,
                background: b.bg || 'transparent', padding: b.pad || 0, borderRadius: b.radius || 0,
                letterSpacing: b.name === 'SAMSUNG' ? 2 : 0
              }}>{b.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES BAR ── */}
      <section style={{
        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
        padding: '28px 60px', display: 'flex', justifyContent: 'space-around',
        alignItems: 'center', flexWrap: 'wrap', gap: 20
      }}>
        {[
          { icon: <FaTag />, title: 'Best Prices', sub: 'Unbeatable deals on top brands' },
          { icon: <FaExchangeAlt />, title: 'Easy Exchange', sub: 'Hassle-free exchange on eligible products' },
          { icon: <FaAward />, title: 'Warranty', sub: 'Official brand warranty' },
          { icon: <FaCreditCard />, title: 'Secure Payments', sub: '100% secure & multiple payment options' },
        ].map(f => (
          <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'white' }}>
            <div style={{ fontSize: 28, opacity: 0.9 }}>{f.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{f.title}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{f.sub}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ── SERVICES ── */}
      <section style={{ padding: '60px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#1a1a2e' }}>Our <span style={{ color: '#7c3aed' }}>Services</span></h2>
          <p style={{ color: '#666', fontSize: 16 }}>Everything you need for your mobile devices</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
          {[
            { icon: '📱', title: 'Latest Phones', desc: 'Top brands, best prices', color: '#7c3aed' },
            { icon: '🔧', title: 'Repair Services', desc: 'Expert technicians, fast turnaround', color: '#a855f7' },
            { icon: '🎧', title: 'Accessories', desc: 'Cases, chargers, earphones & more', color: '#7c3aed' },
            { icon: '🚚', title: 'Fast Delivery', desc: 'Delivered to your doorstep', color: '#a855f7' },
          ].map(s => (
            <div key={s.title} style={{ background: 'white', borderRadius: 16, padding: '28px 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', transition: 'transform 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{s.icon}</div>
              <h3 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{s.title}</h3>
              <p style={{ color: '#888', fontSize: 14 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1a2e, #7c3aed)',
        margin: '0 60px 60px', borderRadius: 24, padding: '50px 60px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24
      }}>
        <div>
          <h2 style={{ color: 'white', fontSize: 32, fontWeight: 800, margin: '0 0 8px' }}>Ready to get started?</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 16, margin: 0 }}>Join thousands of happy customers today.</p>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <Link to="/register" style={{ background: 'white', color: '#7c3aed', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
            Create Account
          </Link>
          <Link to="/login" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '14px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 15, border: '1px solid rgba(255,255,255,0.3)' }}>
            Sign In
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1a1a2e', color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '24px', fontSize: 14 }}>
        © 2025 NancyMobile. All rights reserved. · Mobile Accessories & Repair Services
      </footer>
    </div>
  )
}
