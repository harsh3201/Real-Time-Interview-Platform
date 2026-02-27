import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '../components/Navbar';

gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
    const navigate = useNavigate();
    const heroRef = useRef(null);
    const [activeFaq, setActiveFaq] = useState(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.hero-title span', {
                y: 50,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: 'back.out(1.7)'
            });

            gsap.from('.hero-subtitle-text', {
                opacity: 0,
                x: -30,
                duration: 1,
                delay: 0.8,
                ease: 'power3.out'
            });

            gsap.from('.hero-btns', {
                y: 30,
                opacity: 0,
                duration: 1,
                delay: 1,
                ease: 'power3.out'
            });

            gsap.utils.toArray('.reveal').forEach((el) => {
                gsap.to(el, {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse'
                    }
                });
            });

            gsap.from('.bento-item', {
                scale: 0.9,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                scrollTrigger: {
                    trigger: '.bento-grid',
                    start: 'top 80%'
                }
            });
        });

        return () => ctx.revert();
    }, []);

    const handleHover = (enter) => {
        const follower = document.querySelector('.custom-cursor-follower');
        if (!follower) return;
        if (enter) {
            gsap.to(follower, { scale: 2, background: 'rgba(59, 130, 246, 0.1)', borderColor: 'transparent' });
        } else {
            gsap.to(follower, { scale: 1, background: 'transparent', borderColor: 'var(--accent-primary)' });
        }
    };

    const testimonials = [
        { name: "Rahul S.", role: "SDE-2 @ Amazon", text: "Interview-fy helped me crack my dream job. The real-time coding workspace is a game changer." },
        { name: "Priya M.", role: "Frontend Dev @ Swiggy", text: "The AI profile analysis gave me insights I never considered. My resume went from 0 to hero." },
        { name: "Kevin D.", role: "Fresh Graduate", text: "As a fresher, I was terrified of interviews. 10 sessions here and I felt like a pro." }
    ];

    const faqs = [
        { q: "Is it really interactive?", a: "Yes! Our platform features a real-time collaborative code editor and integrated video calls." },
        { q: "How does AI analysis work?", a: "It uses Gemini Pro to scan your profile against industry standards and gives you a market readiness score." },
        { q: "Can I use it for free?", a: "Absolutely. Our free tier includes 5 full sessions to get you started." }
    ];

    return (
        <div style={{ position: 'relative', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
            <Navbar />

            <section className="hero-section" ref={heroRef}>
                <div className="hero-tagline">
                    <span style={{ color: 'var(--accent-blue)' }}>★</span> [ interview-fy ] <span style={{ cursor: 'pointer' }}>🔊</span>
                </div>

                <h1 className="hero-title" style={{ fontSize: 'clamp(4rem, 12vw, 8rem)', letterSpacing: '-2px', textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0 }}>
                    <span style={{ color: 'var(--accent-blue)' }}>INTERVIEW-FY*</span><br />
                    <span>YOUR FUTURE</span><br />
                    <span>NOW!</span>
                </h1>

                <div className="hero-subtitle-text" style={{ maxWidth: '400px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '20px' }}>
                    verb (interview-fies, interview-fying) <br />
                    Prepare for greatness without the hassle. "My career is finally interview-fied!"
                </div>

                <div className="hero-btns" style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button className="btn btn-primary"
                        style={{ borderRadius: '100px', padding: '20px 40px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '15px' }}
                        onClick={() => navigate('/login')}
                        onMouseEnter={() => handleHover(true)}
                        onMouseLeave={() => handleHover(false)}>
                        How it works <div style={{ background: '#fff', color: 'var(--accent-blue)', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👁</div>
                    </button>
                    <button className="btn btn-outline" style={{ borderRadius: '100px', padding: '20px 40px' }} onClick={() => navigate('/register')}>
                        Get Started
                    </button>
                </div>
            </section>

            <div className="ticker-wrap">
                <div className="ticker-content">
                    {[1, 2].map(id => (
                        <React.Fragment key={id}>
                            <span className="ticker-item">FAANG READY</span>
                            <span className="ticker-item" style={{ color: 'var(--accent-blue)' }}>✦</span>
                            <span className="ticker-item">ALGO EXPERT</span>
                            <span className="ticker-item" style={{ color: 'var(--accent-blue)' }}>✦</span>
                            <span className="ticker-item">HIRED AT GOOGLE</span>
                            <span className="ticker-item" style={{ color: 'var(--accent-blue)' }}>✦</span>
                            <span className="ticker-item">META SLAYER</span>
                            <span className="ticker-item" style={{ color: 'var(--accent-blue)' }}>✦</span>
                            <span className="ticker-item">SYSTEM DESIGN PRO</span>
                            <span className="ticker-item" style={{ color: 'var(--accent-blue)' }}>✦</span>
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <section style={{ padding: '150px 10%', background: 'var(--text-primary)', color: 'var(--bg-primary)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }} className="reveal">
                        <div className="live-dot"></div>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>Live Activity</span>
                    </div>
                    <h2 className="reveal" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1, marginBottom: '80px', fontWeight: 800 }}>
                        THE <span style={{ color: 'var(--accent-primary)' }}>OS</span> FOR YOUR <br />
                        <span style={{ color: 'var(--accent-secondary)' }}>PREPARATION.</span>
                    </h2>

                    <div className="bento-grid">
                        <div className="bento-item bento-large" style={{ background: '#fff', color: '#000' }}>
                            <span style={{ fontSize: '3rem' }}>🧠</span>
                            <h3 style={{ fontSize: '1.8rem', marginTop: '20px' }}>AI Profile Analysis</h3>
                            <p style={{ opacity: 0.7, marginTop: '10px' }}>Get scanned by Gemini Pro to find gaps in your skills and boost your market value.</p>
                        </div>
                        <div className="bento-item" style={{ background: 'var(--accent-primary)', color: '#000' }}>
                            <span style={{ fontSize: '2rem' }}>🎥</span>
                            <h3 style={{ fontSize: '1.4rem', marginTop: '15px' }}>Video Calls</h3>
                        </div>
                        <div className="bento-item" style={{ background: 'var(--accent-secondary)', color: '#000' }}>
                            <span style={{ fontSize: '2rem' }}>💻</span>
                            <h3 style={{ fontSize: '1.4rem', marginTop: '15px' }}>Live Coding</h3>
                        </div>
                        <div className="bento-item bento-medium" style={{ background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ fontSize: '1.6rem' }}>Dashboard for Winners</h3>
                            <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '8px' }}>Track scheduling, feedback and progress in one sleek view.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section style={{ padding: '150px 10%' }}>
                <h2 className="reveal" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, marginBottom: '60px', textAlign: 'center' }}>
                    Wall of <span style={{ color: 'var(--accent-blue)' }}>Love.</span>
                </h2>
                <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    {testimonials.map((t, i) => (
                        <div key={i} className="testimonial-card reveal">
                            <p style={{ fontSize: '1.2rem', fontWeight: 500, fontStyle: 'italic', marginBottom: '25px' }}>"{t.text}"</p>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{t.name}</div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', opacity: 0.6 }}>{t.role}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section style={{ padding: '150px 10%', backgroundColor: 'var(--bg-secondary)' }}>
                <h2 className="reveal" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, marginBottom: '60px', textTransform: 'uppercase' }}>
                    Pick your <span style={{ color: 'var(--accent-blue)' }}>Speed.</span>
                </h2>
                <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    <div className="card reveal" onMouseEnter={() => handleHover(true)} onMouseLeave={() => handleHover(false)} style={{ border: '3px solid var(--border)', boxShadow: '12px 12px 0px var(--border)' }}>
                        <h4 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '10px' }}>Free</h4>
                        <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '20px' }}>$0 <span style={{ fontSize: '1rem', opacity: 0.6 }}>/mo</span></div>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontWeight: 600 }}>
                            <li>✓ 5 Practice Sessions</li>
                            <li>✓ Basic Analytics</li>
                            <li>✓ Community Access</li>
                        </ul>
                        <button className="btn btn-outline" style={{ marginTop: '30px', width: '100%', borderRadius: '100px' }}>Start Free</button>
                    </div>
                    <div className="card reveal" onMouseEnter={() => handleHover(true)} onMouseLeave={() => handleHover(false)} style={{ border: '3px solid var(--border)', background: 'var(--accent-blue)', color: '#fff', transform: 'scale(1.05)', boxShadow: '12px 12px 0px var(--border)' }}>
                        <h4 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '10px' }}>Pro</h4>
                        <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '20px' }}>$19 <span style={{ fontSize: '1rem', opacity: 0.8 }}>/mo</span></div>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontWeight: 600 }}>
                            <li>✓ Unlimited Sessions</li>
                            <li>✓ AI Feedback</li>
                            <li>✓ Priority Scheduling</li>
                            <li>✓ Custom Resume Review</li>
                        </ul>
                        <button className="btn" style={{ marginTop: '30px', width: '100%', background: '#fff', color: 'var(--accent-blue)', borderRadius: '100px' }}>Get Started</button>
                    </div>
                </div>
            </section>

            <section style={{ padding: '150px 10%' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 className="reveal" style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '60px', textAlign: 'center' }}>Questions?</h2>
                    <div className="faq-container">
                        {faqs.map((f, i) => (
                            <div key={i} className={`faq-item reveal ${activeFaq === i ? 'active' : ''}`} onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                                <div className="faq-question">
                                    {f.q}
                                    <span>{activeFaq === i ? '−' : '+'}</span>
                                </div>
                                <div className="faq-answer">{f.a}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer style={{ padding: '80px 10%', background: 'var(--bg-primary)', borderTop: '4px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-1px' }}>interview<span style={{ color: 'var(--accent-blue)' }}>fy*</span></div>
                    <p style={{ fontWeight: 600, opacity: 0.6, marginTop: '8px' }}>Helping 10k+ candidates monthly.</p>
                </div>
                <div style={{ display: 'flex', gap: '40px', fontWeight: 700, fontSize: '0.9rem' }}>
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Twitter</Link>
                    <a href="https://www.linkedin.com/in/harsh3201/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>LinkedIn</a>
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Privacy</Link>
                </div>
                <p style={{ fontWeight: 600 }}>© 2026. THE FUTURE IS HERE.</p>
            </footer>
        </div>
    );
};

export default Landing;

