
import React, { useEffect, useRef } from 'react';

const PHONE = '816-972-3232';
const API_BASE =  'https://blue-flamingo-376671.hostingersite.com/api/clicks';

export default function TrackPage() {
  const animatedRefs = useRef([]);

  useEffect(() => {
    // Intersection observer for simple fade/slide-in
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('opacity-0', 'translate-y-6');
        }
      });
    }, observerOptions);

    animatedRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // helper to register refs
  const ref = (el) => {
    if (el && !animatedRefs.current.includes(el)) animatedRefs.current.push(el);
  };

  const trackClick = async (buttonName) => {
    const payload = {
      timestamp: new Date().toISOString(),
      button: buttonName,
      page: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      sessionId: localStorage.getItem('regency_session') || generateSessionId(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      metadata: {
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled,
        online: navigator.onLine
      }
    };

    try {
      await fetch(`${API_BASE}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // ignore for now; in production save fallback locally
      console.warn('Click track failed', err);
    }
  };

  const generateSessionId = () => {
    const s = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem('regency_session', s);
    return s;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-x-hidden"
    style={{
  backgroundImage:
    "linear-gradient(rgba(7, 5, 5, 0.9), rgba(19, 14, 14, 0.9)), url('https://regencyautorepairkc.com/wp-content/uploads/2025/10/016bba3d2c79ffd20603c90a382cd224.webp')",
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}}
>
      {/* Background image + overlay */}
      <div
        className="fixed inset-0 bg-cover bg-center -z-10">
        <div className="absolute inset-0"></div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <main className="max-w-4xl mx-auto">
            <img
              src="https://regencyautorepairkc.com/wp-content/uploads/2025/10/REG.png"
              alt="Regency Auto Repair Logo"
              className="mx-auto w-48 h-auto opacity-0 translate-y-6 transition-all duration-700"
              ref={ref}
            />
          <h1 ref={ref} className="text-5xl md:text-6xl font-extrabold text-amber-400 leading-tight opacity-0 translate-y-6 transition-all duration-700">
            Your Trusted Local Auto Repair Shop
          </h1>

          <h2 ref={ref} className="text-2xl md:text-3xl font-medium text-white/90 mt-4 mb-8 opacity-0 translate-y-6 transition-all duration-700 delay-100">
            Call Us Now and Get a Free Quote Today!
          </h2>

          <div className="space-x-0 md:space-x-4">
            <a
              href={`tel:${PHONE.replace(/[^0-9]/g, '')}`}
              onClick={() => trackClick('Call Button')}
              className="inline-block bg-amber-400 text-gray-900 font-bold text-lg md:text-xl rounded-full px-8 py-4 shadow-lg border-4 border-amber-400 hover:bg-amber-300 transform hover:-translate-y-1 transition"
              ref={ref}
            >
              {PHONE}
            </a>

            <button
              id="book-btn"
              onClick={(e) => {
                e.preventDefault();
                trackClick('Book Now');
                alert(`Booking form would open here! For now, please call us at ${PHONE} to book an appointment.`);
              }}
              className="ml-3 mt-4 mb-4  md:mt-0 inline-block bg-transparent text-amber-400 font-bold text-lg md:text-xl rounded-full px-6 py-3 shadow-md border-4 border-amber-400 hover:bg-white/5 transform hover:-translate-y-1 transition"
              ref={ref}
            >
              Book now
            </button>

            <a
              href={`https://maps.app.goo.gl/iofpKTfzrG4SCf7Z6`}
              onClick={() => trackClick('Get Directions Button')}
              className="inline-block bg-amber-400 text-gray-900 font-bold text-lg md:text-xl rounded-full px-8 py-4 shadow-lg border-4 border-amber-400 hover:bg-amber-300 transform hover:-translate-y-1 transition"
              ref={ref}
            >
              Get Directions
            </a>
          </div>

          <section className="mt-8 bg-amber-400 text-gray-900 rounded-lg p-6 shadow-xl opacity-0 translate-y-6 transition-all duration-700 delay-200" ref={ref}>
            <h3 className="text-2xl font-semibold">Auto Repair And Service Expert!</h3>
            <p className="mt-3 text-base leading-relaxed">We provide professional auto service, from engine diagnostics to brake repair, ensuring your vehicle's optimal function.</p>

            <h4 className="mt-4 font-semibold">OUR SERVICES:</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 list-none">
              <li className="pl-4 relative before:content-['✓'] before:absolute before:left-0 before:text-black font-medium">Wheel Alignment</li>
              <li className="pl-4 relative before:content-['✓'] before:absolute before:left-0 before:text-black font-medium">Brake Services</li>
              <li className="pl-4 relative before:content-['✓'] before:absolute before:left-0 before:text-black font-medium">Engine Diagnostics & Repairs</li>
              <li className="pl-4 relative before:content-['✓'] before:absolute before:left-0 before:text-black font-medium">Complete Auto Repair Services</li>
            </ul>
          </section>

          <footer className="mt-12 text-center text-gray-300 border-t border-white pt-6">
            <p>Contact Us: {PHONE} | <a href="https://maps.app.goo.gl/iofpKTfzrG4SCf7Z6" className="text-amber-400 hover:text-amber-300">Get Direction</a></p>
            <p className="mt-1">&copy; 2026 Regency Auto Repair. All rights reserved.</p>
          </footer>
        </main>
      </div>

      {/* Phone floating icon */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="group relative">
          <a
            href={`tel:${PHONE.replace(/[^0-9]/g, '')}`}
            onClick={() => trackClick('Floating Phone')}
            className="w-20 h-20 bg-[#E87234] rounded-full flex items-center justify-center shadow-2xl transform transition group-hover:scale-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.654 4.328a.678.678 0 00-.848-.06l-2 1.5A1.01 1.01 0 000 6.5C0 14.046 9.954 24 18.5 24c.379 0 .736-.195.915-.52l1.5-2a.678.678 0 00-.06-.848l-3.1-3.1a.678.678 0 00-.757-.144l-2.2.9a12.042 12.042 0 01-6.03-6.03l.9-2.2c.1-.263.03-.56-.144-.757l-3.1-3.1z" />
            </svg>
          </a>

          <div className="absolute bottom-24 right-0 bg-black/80 text-white px-3 py-2 rounded-md font-semibold opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
            Call: {PHONE}
          </div>
        </div>
      </div>
    </div>
  );
}
