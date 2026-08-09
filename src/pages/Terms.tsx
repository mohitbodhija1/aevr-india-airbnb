import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import styles from './Terms.module.css';

export const Terms: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('acceptance');

    const sections = [
        { id: 'acceptance', label: '1. Acceptance of Terms' },
        { id: 'booking', label: '2. Guest Responsibilities' },
        { id: 'pricing', label: '3. Pricing & Payments' },
        { id: 'cancellation', label: '4. Cancellations & Refunds' },
        { id: 'hosting', label: '5. Host Obligations' },
        { id: 'liability', label: '6. Limitation of Liability' },
        { id: 'contact', label: '7. Contact & Support' }
    ];

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 160;
            for (const section of sections) {
                const el = document.getElementById(section.id);
                if (el) {
                    const top = el.offsetTop;
                    const height = el.offsetHeight;
                    if (scrollPosition >= top && scrollPosition < top + height) {
                        setActiveSection(section.id);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            window.scrollTo({
                top: el.offsetTop - 120,
                behavior: 'smooth'
            });
            setActiveSection(id);
        }
    };

    return (
        <div className={styles.pageContainer}>
            {/* Hero Section */}
            <div className={styles.heroSection}>
                <div className={styles.heroContent}>
                    <div className={styles.breadcrumbRow}>
                        <Link to="/" className={styles.breadcrumbLink}>Home</Link>
                        <span className={styles.breadcrumbSeparator}>/</span>
                        <span className={styles.breadcrumbCurrent}>Terms & Conditions</span>
                    </div>

                    <span className={styles.preTitle}>Legal Agreement</span>
                    <h1 className={styles.title}>Terms & Conditions</h1>
                    <p className={styles.subtitle}>
                        Please read these terms and conditions carefully before booking or hosting properties on AEVR.
                    </p>

                    <div className={styles.metaRow}>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Document</span>
                            <span className={styles.metaValue}>Guest & Host Agreement</span>
                        </div>
                        <div className={styles.metaDivider} />
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Last Updated</span>
                            <span className={styles.metaValue}>January 2026</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Two-Column Grid Layout */}
            <div className={styles.mainContainer}>
                {/* Sticky Sidebar Navigation */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarTitle}>Table of Contents</div>
                    <nav className={styles.nav}>
                        {sections.map((sec) => (
                            <button
                                key={sec.id}
                                onClick={() => scrollToSection(sec.id)}
                                className={`${styles.navItem} ${activeSection === sec.id ? styles.activeNavItem : ''}`}
                            >
                                <span>{sec.label}</span>
                                {activeSection === sec.id && <ChevronRight size={14} className={styles.activeIndicator} />}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className={styles.content}>
                    <section id="acceptance" className={styles.sectionCard}>
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using the AEVR platform ("Platform"), including browsing listings, making reservations, or registering as a host, you agree to comply with and be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, you may not use the Platform.
                        </p>
                    </section>

                    <section id="booking" className={styles.sectionCard}>
                        <h2>2. Guest Responsibilities & Conduct</h2>
                        <p>
                            When you make a booking through AEVR, you enter into a direct contractual relationship with the property host. As a guest, you agree to:
                        </p>
                        <ul>
                            <li>Provide accurate personal details and government-issued identification during check-in.</li>
                            <li>Respect property rules, maximum guest capacities, and check-in/check-out timings.</li>
                            <li>Treat the property, amenities, staff, and surrounding neighborhood with care.</li>
                            <li>Notify the host or AEVR support immediately in case of any damages or safety concerns.</li>
                        </ul>
                    </section>

                    <section id="pricing" className={styles.sectionCard}>
                        <h2>3. Pricing & Payment Terms</h2>
                        <p>
                            All prices displayed on AEVR are in Indian Rupees (INR) and include applicable taxes unless explicitly stated otherwise. Full payment or required deposit must be made via authorized payment methods (UPI, Cards, Net Banking) to confirm a reservation.
                        </p>
                    </section>

                    <section id="cancellation" className={styles.sectionCard}>
                        <h2>4. Cancellations & Refund Policy</h2>
                        <p>
                            Cancellation policies are clearly stated prior to booking confirmation. In general:
                        </p>
                        <ul>
                            <li><strong>Full Refund:</strong> Cancellations made 14 days or more before check-in receive a 100% refund.</li>
                            <li><strong>Partial Refund:</strong> Cancellations made between 7 to 13 days before check-in receive a 50% refund.</li>
                            <li><strong>Non-Refundable:</strong> Cancellations made less than 7 days prior to check-in are non-refundable.</li>
                        </ul>
                    </section>

                    <section id="hosting" className={styles.sectionCard}>
                        <h2>5. Host Standards & Obligations</h2>
                        <p>
                            Hosts offering properties on AEVR agree to maintain strict hospitality standards, provide accurate listing details, ensure physical safety and hygiene, and honor confirmed bookings.
                        </p>
                    </section>

                    <section id="liability" className={styles.sectionCard}>
                        <h2>6. Limitation of Liability</h2>
                        <p>
                            AEVR acts as a curated platform connecting guests with verified properties. AEVR is not liable for indirect, incidental, or consequential damages resulting from third-party services, host defaults, or unforeseen acts of nature.
                        </p>
                    </section>

                    <section id="contact" className={styles.sectionCard}>
                        <h2>7. Contact & Legal Support</h2>
                        <p>
                            For queries regarding these Terms & Conditions, please contact us at <a href="mailto:support@aevr.in">support@aevr.in</a> or visit our <Link to="/help">Help Center</Link>.
                        </p>
                    </section>
                </main>
            </div>
        </div>
    );
};
