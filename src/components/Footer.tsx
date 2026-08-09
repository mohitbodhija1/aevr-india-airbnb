import React from 'react';
import styles from './Footer.module.css';
import { Globe, Instagram, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

const INSTAGRAM_URL = 'https://www.instagram.com/aevrindia?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';
const WHATSAPP_URL = 'https://wa.me/918890807482';

const WhatsAppIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 2C6.477 2 2 6.477 2 12c0 2.148.679 4.14 1.838 5.772L2 22l4.372-1.802A9.95 9.95 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.952 7.952 0 01-4.095-1.127l-.293-.174-2.593 1.068 1.085-2.529-.191-.307A7.955 7.955 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
    </svg>
);

export const Footer: React.FC = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                {/* Main 5-Column Grid */}
                <div className={styles.mainGrid}>
                    <div className={styles.brandCol}>
                        <div className={styles.logoWrapper}>
                            <svg viewBox="0 0 100 100" className={styles.logoIcon}>
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#B88A5A" strokeWidth="4" />
                                <path d="M 20 65 L 80 65" stroke="#B88A5A" strokeWidth="4" />
                                <path d="M 50 20 L 50 65" stroke="#B88A5A" strokeWidth="4" />
                                <path d="M 30 65 A 20 20 0 0 1 70 65" fill="none" stroke="#B88A5A" strokeWidth="4" />
                            </svg>
                            <div className={styles.logoTextWrapper}>
                                <span className={styles.logoText}>AEVR</span>
                                <span className={styles.logoSubtext}>STAYS THAT STAY WITH YOU</span>
                            </div>
                        </div>
                        <p className={styles.brandTagline}>
                            AEVR is where heritage meets hospitality. We curate India's finest private villas, heritage estates and luxury stays, handpicked and professionally managed for your perfect escape.
                        </p>
                    </div>

                    <div className={styles.column}>
                        <h4 className={styles.linksTitle}>Quick Links</h4>
                        <ul className={styles.colList}>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/#explore">Explore Stays</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                        </ul>
                    </div>

                    <div className={styles.column}>
                        <h4 className={styles.linksTitle}>Customer Care</h4>
                        <ul className={styles.colList}>
                            <li><Link to="/help">FAQs</Link></li>
                            <li><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp Support</a></li>
                            <li><a href="tel:+918890807482">Call Us</a></li>
                            <li><Link to="/help">Help Center</Link></li>
                        </ul>
                    </div>

                    <div className={styles.column}>
                        <h4 className={styles.linksTitle}>Company Links</h4>
                        <ul className={styles.colList}>
                            <li><Link to="/host">Host Your Home</Link></li>
                            <li><Link to="/host/auth">Host Registration</Link></li>
                            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                            <li><Link to="/terms">Terms & Conditions</Link></li>
                        </ul>
                    </div>

                    <div className={styles.column}>
                        <h4 className={styles.linksTitle}>Connect With Us</h4>
                        <ul className={styles.contactList}>
                            <li>
                                <a href="mailto:aevrindia@gmail.com" className={styles.contactDetailLink}>
                                    aevrindia@gmail.com
                                </a>
                            </li>
                            <li>
                                <a href="tel:+918890807482" className={styles.contactDetailLink}>
                                    +91 88908 07482
                                </a>
                            </li>
                        </ul>
                        <div className={styles.socials}>
                            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={styles.socialIcon} aria-label="WhatsApp">
                                <WhatsAppIcon size={18} />
                            </a>
                            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className={styles.socialIcon} aria-label="Instagram">
                                <Instagram size={18} />
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noreferrer" className={styles.socialIcon} aria-label="Facebook">
                                <Facebook size={18} />
                            </a>
                        </div>
                    </div>
                </div>

                <div className={styles.divider} />

                {/* Row 3: Centered Copyright & Preferences */}
                <div className={styles.bottomSection}>
                    <div className={styles.copyrightText}>
                        © 2026 AEVR. All Rights Reserved.
                    </div>
                    <div className={styles.preferences}>
                        <span className={styles.prefItem}><Globe size={14} /> English (IN)</span>
                        <span className={styles.prefDot}>·</span>
                        <span className={styles.prefItem}>₹ INR</span>
                    </div>
                </div>
            </div>

            {/* Bottom Skyline Illustration */}
            <div className={styles.skylineWrapper}>
                <svg className={styles.skylineSvg} viewBox="0 0 1200 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    {/* Background Layer */}
                    <path
                        className={styles.skylineBack}
                        d="M 80 120 V 95 H 90 V 85 C 90 75, 110 75, 110 85 V 95 H 120 V 75 H 130 V 65 C 130 55, 160 55, 160 65 V 75 H 170 V 95 H 180 V 85 C 180 75, 200 75, 200 85 V 95 H 210 V 120 Z
                           M 200 120 V 85 H 220 V 75 H 230 V 65 C 230 60, 240 60, 240 65 V 75 H 260 C 260 45, 270 40, 280 25 C 290 40, 300 45, 300 75 H 320 V 65 C 320 60, 330 60, 330 65 V 75 H 340 V 85 H 360 V 120 Z
                           M 610 120 L 613 40 L 612 40 L 612 36 C 612 32, 618 32, 618 36 L 618 40 L 620 120 H 630 V 110 H 640 V 70 H 655 V 60 C 655 52, 665 52, 665 60 V 70 H 685 C 685 45, 675 40, 700 20 C 725 40, 715 45, 715 70 H 735 V 60 C 735 52, 745 52, 745 60 V 70 H 760 V 110 H 770 V 120 H 780 L 783 40 L 782 40 L 782 36 C 782 32, 788 32, 788 36 L 788 40 L 790 120 Z"
                    />
                    {/* Midground Layer */}
                    <path
                        className={styles.skylineMid}
                        d="M 30 120 H 35 L 37 80 L 36 80 L 36 76 L 38 76 L 39 50 L 38 50 L 38 46 L 40 46 L 41 24 L 40 24 L 40 20 L 42 20 L 43 5 C 43 1, 47 1, 47 5 L 48 20 L 50 20 L 50 24 L 49 24 L 50 46 L 52 46 V 50 L 51 50 L 52 76 H 54 L 53 80 L 55 120 Z
                           M 410 120 V 65 H 405 V 55 H 412 V 45 H 425 V 35 H 445 C 445 31, 455 31, 455 35 H 475 V 45 H 488 V 55 H 495 V 65 H 490 V 120 H 465 V 85 C 465 70, 435 70, 435 85 V 120 Z
                           M 1060 120 V 100 H 1075 V 75 H 1090 V 50 H 1105 V 25 C 1105 18, 1155 18, 1155 25 V 50 H 1170 V 75 H 1185 V 100 H 1200 V 120 Z"
                    />
                    {/* Foreground Layer */}
                    <path
                        className={styles.skylineFront}
                        d="M 830 120 V 90 H 835 V 95 H 840 V 90 H 845 V 95 H 850 V 90 H 855 V 95 H 860 V 90 H 865 V 95 H 870 V 90 H 875 V 95 H 880 V 90 H 885 V 95 H 890 V 90 L 895 55 H 890 V 50 C 890 40, 920 40, 920 50 V 55 H 915 L 920 90 H 930 V 70 H 960 V 90 H 970 L 975 55 H 970 V 50 C 970 40, 1000 40, 1000 50 V 55 H 995 L 1000 90 H 1005 V 95 H 1010 V 90 H 1015 V 95 H 1020 V 90 H 1025 V 95 H 1030 V 90 H 1035 V 95 H 1040 V 90 H 1045 V 95 H 1050 V 90 V 120 Z"
                    />
                    {/* Ground Line */}
                    <rect x="0" y="118" width="1200" height="2" className={styles.skylineGround} />
                </svg>
            </div>
        </footer>
    );
};

