import React from 'react';
import styles from './Footer.module.css';
import { Globe } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.content}>
                <div className={styles.section}>
                    <h3>Support</h3>
                    <ul>
                        <li><a href="#">Help Center</a></li>
                        <li><a href="#">AirCover</a></li>
                        <li><a href="#">Anti-discrimination</a></li>
                        <li><a href="#">Disability support</a></li>
                    </ul>
                </div>
                <div className={styles.section}>
                    <h3>Hosting</h3>
                    <ul>
                        <li><a href="#">Aevr your home</a></li>
                        <li><a href="#">AirCover for Hosts</a></li>
                        <li><a href="#">Hosting resources</a></li>
                        <li><a href="#">Community forum</a></li>
                    </ul>
                </div>
                <div className={styles.section}>
                    <h3>Aevr</h3>
                    <ul>
                        <li><a href="#">Newsroom</a></li>
                        <li><a href="#">New features</a></li>
                        <li><a href="#">Careers</a></li>
                        <li><a href="#">Investors</a></li>
                    </ul>
                </div>
            </div>
            <div className={styles.bottomBar}>
                <div className={styles.left}>
                    <span>© 2026 Aevr, Inc.</span>
                    <span>·</span>
                    <a href="#">Privacy</a>
                    <span>·</span>
                    <a href="#">Terms</a>
                    <span>·</span>
                    <a href="#">Sitemap</a>
                </div>
                <div className={styles.right}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={16} /> English (IN)</span>
                    <span>₹ INR</span>
                </div>
            </div>
        </footer>
    );
};
