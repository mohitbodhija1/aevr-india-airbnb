import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, MessageCircle, Mail, PhoneCall, HelpCircle, Shield, CreditCard, Home as HomeIcon, UserCheck, FileText } from 'lucide-react';
import styles from './HelpCenter.module.css';

interface FAQ {
    question: string;
    answer: string;
}

interface Section {
    id: string;
    label: string;
    icon: React.ReactNode;
    description: string;
    faqs: FAQ[];
}

const SECTIONS_DATA: Section[] = [
    {
        id: 'booking',
        label: '1. Booking & Reservations',
        icon: <HomeIcon size={18} />,
        description: 'How to reserve, modification requests, and check-in procedures',
        faqs: [
            {
                question: 'How do I make a reservation for a luxury villa?',
                answer: 'Reservations can be made directly on AEVR by choosing your villa, preferred check-in/check-out dates, and guest count. Once submitted, our host and concierge team verifies availability and confirms your stay within 2 hours.'
            },
            {
                question: 'What is the check-in process for AEVR stays?',
                answer: 'Every AEVR property includes personal check-in. A dedicated villa host welcomes you, provides a walkthrough, hands over the keys, and ensures your complete comfort.'
            },
            {
                question: 'Can I modify my booking dates after confirmation?',
                answer: 'Date modification requests are subject to villa availability and seasonal rates. You can request changes by contacting host support or emailing support@aevr.in.'
            }
        ]
    },
    {
        id: 'payments',
        label: '2. Payments & Pricing',
        icon: <CreditCard size={18} />,
        description: 'Payment methods, invoices, security deposits, and billing',
        faqs: [
            {
                question: 'Which payment methods are accepted on AEVR?',
                answer: 'We accept all major credit/debit cards (Visa, Mastercard, American Express), Net Banking, and UPI payments (Google Pay, PhonePe, Paytm).'
            },
            {
                question: 'Are there any hidden service or cleaning fees?',
                answer: 'No. AEVR operates with 100% pricing transparency. The price displayed during checkout covers the rental, standard housekeeping, and applicable taxes.'
            },
            {
                question: 'What is the refund processing timeline?',
                answer: 'Approved refunds are processed immediately. UPI refunds reflect within 24–48 hours, while Card and Net Banking refunds take 5–7 business days depending on your bank.'
            }
        ]
    },
    {
        id: 'hosting',
        label: '3. Host & Property Owners',
        icon: <UserCheck size={18} />,
        description: 'Listing your estate, payouts, host standards, and approval',
        faqs: [
            {
                question: 'How do I list my villa or heritage property on AEVR?',
                answer: 'Click "Host Your Home" in the navigation, complete the property details form, and submit your listing. Our curation team will inspect your property to ensure it meets AEVR luxury standards before publishing.'
            },
            {
                question: 'When do hosts receive payouts for completed bookings?',
                answer: 'Payouts are released 24 hours after guest check-in to ensure mutual security and satisfaction. Funds are transferred directly to your bank account.'
            }
        ]
    },
    {
        id: 'security',
        label: '4. Account & Safety',
        icon: <Shield size={18} />,
        description: 'Account security, verified guests, and emergency assistance',
        faqs: [
            {
                question: 'What guest verification is required on AEVR?',
                answer: 'To maintain estate safety, all guests are required to upload a valid government-issued ID (Aadhaar, Passport, or Driving License) prior to check-in.'
            },
            {
                question: 'What should I do in case of an on-stay emergency?',
                answer: 'Your villa host is available 24/7. Additionally, you can reach the AEVR emergency concierge line via WhatsApp or phone at +91 88908 07482.'
            }
        ]
    },
    {
        id: 'cancellation',
        label: '5. Cancellations & Policies',
        icon: <FileText size={18} />,
        description: 'Cancellation windows, refund tiers, and host policies',
        faqs: [
            {
                question: 'What is the standard cancellation policy on AEVR?',
                answer: 'Cancellations made 14 days before check-in receive a 100% refund. Cancellations made 7–13 days prior receive a 50% refund. Cancellations within 7 days of check-in are non-refundable.'
            }
        ]
    },
    {
        id: 'contact',
        label: '6. Direct Contact Support',
        icon: <MessageCircle size={18} />,
        description: 'WhatsApp concierge, email support, and helpline numbers',
        faqs: [
            {
                question: 'How can I connect with a live concierge agent?',
                answer: 'You can message us on WhatsApp at +91 88908 07482 or email us at support@aevr.in. Our travel advisors operate 24 hours a day, 7 days a week.'
            }
        ]
    }
];

export const HelpCenter: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('booking');
    const [openFaqIndex, setOpenFaqIndex] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 160;
            for (const section of SECTIONS_DATA) {
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

    const toggleFaq = (key: string) => {
        setOpenFaqIndex(openFaqIndex === key ? null : key);
    };

    return (
        <div className={styles.pageContainer}>
            {/* Hero Section */}
            <div className={styles.heroSection}>
                <div className={styles.heroContent}>
                    <div className={styles.breadcrumbRow}>
                        <Link to="/" className={styles.breadcrumbLink}>Home</Link>
                        <span className={styles.breadcrumbSeparator}>/</span>
                        <span className={styles.breadcrumbCurrent}>Help Center & FAQs</span>
                    </div>

                    <span className={styles.preTitle}>Support & Concierge</span>
                    <h1 className={styles.title}>How Can We Assist You?</h1>
                    <p className={styles.subtitle}>
                        Find answers regarding luxury villa bookings, payment policies, check-in, and 24/7 guest support.
                    </p>

                    {/* Search Bar */}
                    <div className={styles.searchWrapper}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search questions (e.g. cancellation, check-in, payments...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className={styles.mainContainer}>
                {/* Sidebar Navigation */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarTitle}>Navigation</div>
                    <nav className={styles.nav}>
                        {SECTIONS_DATA.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`${styles.navItem} ${activeSection === section.id ? styles.activeNavItem : ''}`}
                            >
                                <span className={styles.navLabelGroup}>
                                    {section.icon}
                                    <span>{section.label}</span>
                                </span>
                                {activeSection === section.id && <ChevronRight size={14} className={styles.activeIndicator} />}
                            </button>
                        ))}
                    </nav>

                    {/* Contact Box */}
                    <div className={styles.sidebarContactBox}>
                        <HelpCircle size={20} className={styles.contactBoxIcon} />
                        <h4>Need Immediate Help?</h4>
                        <p>Our dedicated travel concierge is active 24/7 on WhatsApp.</p>
                        <a
                            href="https://wa.me/918890807482"
                            target="_blank"
                            rel="noreferrer"
                            className={styles.contactWhatsappBtn}
                        >
                            <MessageCircle size={16} /> Chat on WhatsApp
                        </a>
                    </div>
                </aside>

                {/* Content Section */}
                <main className={styles.content}>
                    {SECTIONS_DATA.map((section) => {
                        const filteredFaqs = searchQuery.trim()
                            ? section.faqs.filter(
                                  (f) =>
                                      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                            : section.faqs;

                        if (searchQuery.trim() && filteredFaqs.length === 0) return null;

                        return (
                            <section key={section.id} id={section.id} className={styles.sectionCard}>
                                <div className={styles.sectionHeader}>
                                    <div className={styles.sectionIconBadge}>{section.icon}</div>
                                    <div>
                                        <h2 className={styles.sectionTitle}>{section.label.replace(/^\d+\.\s*/, '')}</h2>
                                        <p className={styles.sectionDesc}>{section.description}</p>
                                    </div>
                                </div>

                                <div className={styles.faqList}>
                                    {filteredFaqs.map((faq, idx) => {
                                        const faqKey = `${section.id}-${idx}`;
                                        const isOpen = openFaqIndex === faqKey || Boolean(searchQuery.trim());

                                        return (
                                            <div key={faqKey} className={styles.faqItem}>
                                                <button
                                                    onClick={() => toggleFaq(faqKey)}
                                                    className={styles.faqQuestionBtn}
                                                >
                                                    <span>{faq.question}</span>
                                                    <span className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}>
                                                        +
                                                    </span>
                                                </button>
                                                {isOpen && (
                                                    <div className={styles.faqAnswerBody}>
                                                        <p>{faq.answer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}

                    {/* Direct Channels Footer Card */}
                    <div className={styles.channelsCard}>
                        <h3>Direct Support Channels</h3>
                        <p>Prefer calling or emailing? Reach out directly to our luxury support team.</p>
                        <div className={styles.channelsGrid}>
                            <a href="https://wa.me/918890807482" target="_blank" rel="noreferrer" className={styles.channelLink}>
                                <MessageCircle size={20} />
                                <div>
                                    <span className={styles.channelLabel}>WhatsApp Concierge</span>
                                    <span className={styles.channelVal}>+91 88908 07482</span>
                                </div>
                            </a>

                            <a href="mailto:support@aevr.in" className={styles.channelLink}>
                                <Mail size={20} />
                                <div>
                                    <span className={styles.channelLabel}>Email Support</span>
                                    <span className={styles.channelVal}>support@aevr.in</span>
                                </div>
                            </a>

                            <a href="tel:+918890807482" className={styles.channelLink}>
                                <PhoneCall size={20} />
                                <div>
                                    <span className={styles.channelLabel}>Phone Helpline</span>
                                    <span className={styles.channelVal}>+91 88908 07482</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default HelpCenter;
