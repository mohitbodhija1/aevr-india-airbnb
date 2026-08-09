import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Heart, Sparkles, MapPin, Compass, PhoneCall } from 'lucide-react';
import styles from './AboutUs.module.css';

export const AboutUs: React.FC = () => {
    return (
        <div className={styles.container}>
            {/* Hero Banner */}
            <div className={styles.heroSection}>
                <div className={styles.heroOverlay} />
                <div className={styles.heroContent}>
                    <span className={styles.heroBadge}>
                        <Sparkles size={14} /> About AEVR
                    </span>
                    <h1 className={styles.heroTitle}>Where Heritage Meets Hospitality</h1>
                    <p className={styles.heroSubtitle}>
                        We curate India's finest private villas, heritage estates, and luxury stays — handpicked and professionally managed for your perfect escape.
                    </p>
                </div>
            </div>

            <div className={styles.contentWrapper}>
                {/* Our Story */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.subLabel}>OUR STORY</span>
                        <h2>Redefining Luxury Travel in India</h2>
                    </div>
                    <div className={styles.storyGrid}>
                        <div className={styles.storyText}>
                            <p>
                                AEVR was born out of a passion for extraordinary spaces and authentic Indian hospitality. We noticed that discerning travelers were seeking more than just standard hotel rooms — they wanted character, privacy, and immersive local heritage without compromising on world-class luxury standards.
                            </p>
                            <p>
                                Every property in the AEVR portfolio undergoes a strict 50-point physical verification process before being welcomed into our collection. From restored 200-year-old Rajasthani havelis to cliffside Goan villas with private infinity pools, we bring you stays that create lifelong memories.
                            </p>
                        </div>
                        <div className={styles.statsCard}>
                            <div className={styles.statItem}>
                                <span className={styles.statNumber}>100+</span>
                                <span className={styles.statLabel}>Curated Luxury Villas</span>
                            </div>
                            <div className={styles.statDivider} />
                            <div className={styles.statItem}>
                                <span className={styles.statNumber}>15+</span>
                                <span className={styles.statLabel}>Heritage Destinations</span>
                            </div>
                            <div className={styles.statDivider} />
                            <div className={styles.statItem}>
                                <span className={styles.statNumber}>4.9 ★</span>
                                <span className={styles.statLabel}>Average Guest Rating</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Pillars */}
                <section className={styles.pillarsSection}>
                    <div className={styles.sectionHeaderCentered}>
                        <span className={styles.subLabel}>THE AEVR DIFFERENCE</span>
                        <h2>Why Stay With Us</h2>
                    </div>

                    <div className={styles.pillarsGrid}>
                        <div className={styles.pillarCard}>
                            <div className={styles.iconCircle}>
                                <ShieldCheck size={28} />
                            </div>
                            <h3>100% Verified Stays</h3>
                            <p>
                                Every villa, estate, and cottage is personally inspected by our curation team to ensure clean, accurate listings and top-tier amenities.
                            </p>
                        </div>

                        <div className={styles.pillarCard}>
                            <div className={styles.iconCircle}>
                                <Award size={28} />
                            </div>
                            <h3>Private Butler & Chef</h3>
                            <p>
                                Indulge in authentic regional cuisine prepared by on-site private chefs, accompanied by warm, discreet hospitality services.
                            </p>
                        </div>

                        <div className={styles.pillarCard}>
                            <div className={styles.iconCircle}>
                                <Heart size={28} />
                            </div>
                            <h3>Heritage & Character</h3>
                            <p>
                                Experience authentic architecture, handcrafted interiors, and breathtaking natural settings unique to each handpicked region.
                            </p>
                        </div>

                        <div className={styles.pillarCard}>
                            <div className={styles.iconCircle}>
                                <PhoneCall size={28} />
                            </div>
                            <h3>24/7 Concierge Care</h3>
                            <p>
                                From local transfers and itinerary planning to last-minute requests, our dedicated guest support team is always a call or WhatsApp away.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className={styles.ctaCard}>
                    <h2>Ready to Experience AEVR?</h2>
                    <p>Discover our handpicked collection of luxury stays across India's most serene destinations.</p>
                    <div className={styles.ctaBtnGroup}>
                        <Link to="/map" className={styles.primaryBtn}>
                            <Compass size={18} /> Explore Stays
                        </Link>
                        <Link to="/host" className={styles.secondaryBtn}>
                            <MapPin size={18} /> Host Your Home
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
};
