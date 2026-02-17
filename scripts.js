// ========================================
// Particle Background Animation
// ========================================
class ParticleBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 80;

        this.resize();
        this.init();
        this.animate();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2 + 1,
                vx: Math.random() * 0.5 - 0.25,
                vy: Math.random() * 0.5 - 0.25,
                color: `rgba(99, 102, 241, ${Math.random() * 0.5 + 0.2})`
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((particle, i) => {
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();

            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = particle.x - this.particles[j].x;
                const dy = particle.y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 150) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(99, 102, 241, ${0.2 * (1 - distance / 150)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        });

        requestAnimationFrame(() => this.animate());
    }
}

const LANG_CONTENT = {
    en: {
        pageTitle: 'RUY.APP | WE RUN YOUR APP',
        metaDescription: 'Next Generation Application Execution and Publishing Library - Run Your App',
        metaKeywords: 'RUY.APP, app platform, application execution, software publishing, AI apps, DevOps tools, open source',
        nav: ['Home', 'Apps', 'Features', 'Contact'],
        heroBadge: 'Next Generation App Platform',
        heroTitle: 'WE RUN YOUR APP',
        heroSubtitle: 'Next Generation Application Execution and Publishing Library',
        heroDescription: '(Ru)n (Y)our (App) - The most modern way to bring your applications to life',
        heroButtons: ['Explore Apps', 'Get in Touch'],
        heroStats: ['Active Apps', 'Users', '% Satisfaction'],
        scroll: 'Scroll Down',
        appSection: ['App Library', 'Discover modern solutions'],
        searchPlaceholder: 'Search applications...',
        filters: ['All', 'AI', 'Business', 'DevOps', 'Framework', 'Tools', 'Community'],
        launchApp: 'Launch App',
        viewDocs: 'View Documentation',
        featuresSection: ['Why RUY.APP?', 'Platform features'],
        featureTitles: ['Fast & Reliable', 'Secure', 'Scalable', 'Cloud Native', 'AI Powered', '24/7 Support', 'Open Source', 'Multi-Platform'],
        featureDescriptions: [
            'Your projects run smoothly and efficiently. High performance guarantee with optimized infrastructure.',
            'Your data security is protected with top-level measures. SSL encryption and firewall.',
            'Easily scale as your projects grow. Automatic load balancing and resource management.',
            'Access from anywhere with modern cloud infrastructure. Global CDN support.',
            'Smart solutions with artificial intelligence integration. Machine learning infrastructure.',
            "We're always here for you. Fast and professional support team ready to help.",
            'Transparent development with open source projects. Community-driven innovation and collaboration.',
            'Cross-platform compatibility for web, mobile, and desktop. Build once, deploy everywhere.'
        ],
        cta: ['Ready to Launch Your App?', 'Bring your projects to life with RUY.APP and make a difference', 'Get Started', 'Learn More'],
        footerQuickLinks: 'Quick Links',
        footerLinks: ['Applications', 'Features', 'Contact', 'Donate'],
        footerContact: 'Contact',
        footerBottom: '© 2024 RUY.APP - All rights reserved | Powered by',
        popups: {
            featuresTitle: 'Detailed Features',
            features: [
                ['High Performance', 'Optimized infrastructure with loading and processing times in seconds'],
                ['Enterprise Security', 'SSL/TLS encryption, DDoS protection and firewall'],
                ['Auto Scaling', 'Automatic resource scaling as your traffic increases'],
                ['Mobile First', 'Responsive design that works perfectly on all devices']
            ],
            contactTitle: 'Contact Us',
            contactLabels: ['Email', 'WhatsApp', 'Address'],
            sendMessage: 'Send Message',
            form: ['Your Name', 'Email', 'Your Message', 'Send'],
            success: 'Your message has been sent successfully! We will get back to you as soon as possible.'
        },
        seoLocale: 'en_US'
    },
    tr: {
        pageTitle: 'RUY.APP | UYGULAMANIZI ÇALIŞTIRIYORUZ',
        metaDescription: 'Yeni nesil uygulama çalıştırma ve yayınlama kütüphanesi - Run Your App',
        metaKeywords: 'RUY.APP, uygulama platformu, uygulama çalıştırma, yazılım yayınlama, yapay zeka uygulamaları, DevOps araçları, açık kaynak',
        nav: ['Ana Sayfa', 'Uygulamalar', 'Özellikler', 'İletişim'],
        heroBadge: 'Yeni Nesil Uygulama Platformu',
        heroTitle: 'UYGULAMANIZI ÇALIŞTIRIYORUZ',
        heroSubtitle: 'Yeni Nesil Uygulama Çalıştırma ve Yayınlama Kütüphanesi',
        heroDescription: '(Ru)n (Y)our (App) - Uygulamalarınızı hayata geçirmenin en modern yolu',
        heroButtons: ['Uygulamaları Keşfet', 'İletişime Geç'],
        heroStats: ['Aktif Uygulama', 'Kullanıcı', '% Memnuniyet'],
        scroll: 'Aşağı Kaydır',
        appSection: ['Uygulama Kütüphanesi', 'Modern çözümleri keşfedin'],
        searchPlaceholder: 'Uygulama ara...',
        filters: ['Tümü', 'YZ', 'İş', 'DevOps', 'Framework', 'Araçlar', 'Topluluk'],
        launchApp: 'Uygulamayı Aç',
        viewDocs: 'Dokümantasyonu Gör',
        featuresSection: ['Neden RUY.APP?', 'Platform özellikleri'],
        featureTitles: ['Hızlı ve Güvenilir', 'Güvenli', 'Ölçeklenebilir', 'Bulut Doğal', 'Yapay Zeka Destekli', '7/24 Destek', 'Açık Kaynak', 'Çoklu Platform'],
        featureDescriptions: [
            'Projeleriniz sorunsuz ve verimli çalışır. Optimize altyapı ile yüksek performans garantisi.',
            'Veri güvenliğiniz üst düzey önlemlerle korunur. SSL şifreleme ve güvenlik duvarı.',
            'Projeleriniz büyüdükçe kolayca ölçeklenin. Otomatik yük dengeleme ve kaynak yönetimi.',
            'Modern bulut altyapısıyla her yerden erişim. Küresel CDN desteği.',
            'Yapay zeka entegrasyonuyla akıllı çözümler. Makine öğrenmesi altyapısı.',
            'Her zaman yanınızdayız. Yardıma hazır hızlı ve profesyonel destek ekibi.',
            'Açık kaynak projelerle şeffaf geliştirme. Topluluk odaklı inovasyon ve iş birliği.',
            'Web, mobil ve masaüstü için çapraz platform uyumluluğu. Bir kez geliştir, her yerde yayınla.'
        ],
        cta: ['Uygulamanızı Yayınlamaya Hazır mısınız?', 'Projelerinizi RUY.APP ile hayata geçirin ve fark oluşturun', 'Başlayın', 'Daha Fazla Bilgi'],
        footerQuickLinks: 'Hızlı Linkler',
        footerLinks: ['Uygulamalar', 'Özellikler', 'İletişim', 'Bağış'],
        footerContact: 'İletişim',
        footerBottom: '© 2024 RUY.APP - Tüm hakları saklıdır | Destekleyen',
        popups: {
            featuresTitle: 'Detaylı Özellikler',
            features: [
                ['Yüksek Performans', 'Saniyeler içinde yükleme ve işlem süresi sunan optimize altyapı'],
                ['Kurumsal Güvenlik', 'SSL/TLS şifreleme, DDoS koruması ve güvenlik duvarı'],
                ['Otomatik Ölçekleme', 'Trafiğiniz arttıkça otomatik kaynak ölçeklendirmesi'],
                ['Mobil Öncelikli', 'Tüm cihazlarda kusursuz çalışan duyarlı tasarım']
            ],
            contactTitle: 'Bize Ulaşın',
            contactLabels: ['E-posta', 'WhatsApp', 'Adres'],
            sendMessage: 'Mesaj Gönder',
            form: ['Adınız', 'E-posta', 'Mesajınız', 'Gönder'],
            success: 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.'
        },
        seoLocale: 'tr_TR'
    }
};

const APPS_I18N = {
    racy: {
        category: 'BusinessApplication',
        en: { badge: 'Business', description: 'Next-generation solution for technical service management with stock, customer, and work order automation', tags: ['Business', 'Management', 'SaaS'] },
        tr: { badge: 'İş', description: 'Stok, müşteri ve iş emri otomasyonuyla teknik servis yönetimi için yeni nesil çözüm', tags: ['İş', 'Yönetim', 'SaaS'] }
    },
    ucloud: {
        category: 'UtilitiesApplication',
        en: { badge: 'Monitoring', description: 'iOS and Android network monitoring and tools application with real-time diagnostics', tags: ['Networking', 'Mobile', 'Tools'] },
        tr: { badge: 'İzleme', description: 'Gerçek zamanlı teşhis özellikli iOS ve Android ağ izleme ve araç uygulaması', tags: ['Ağ', 'Mobil', 'Araçlar'] }
    },
    iyzico: {
        category: 'FinanceApplication',
        en: { badge: 'B2B Payment', description: 'B2B payment panel enabling free amount payments and balance management through dealers', tags: ['B2B', 'Payment', 'Dealer'] },
        tr: { badge: 'B2B Ödeme', description: 'Bayiler üzerinden serbest tutarlı ödeme ve bakiye yönetimi sağlayan B2B ödeme paneli', tags: ['B2B', 'Ödeme', 'Bayi'] }
    },
    vcenterium: {
        category: 'DeveloperApplication',
        en: { badge: 'Infrastructure', description: 'vCenter virtual device management platform for external client administration (vCenter 7 & 8 compatible)', tags: ['DevOps', 'vCenter', 'ESXi'] },
        tr: { badge: 'Altyapı', description: 'Dış müşteri yönetimi için vCenter sanal cihaz yönetim platformu (vCenter 7 ve 8 uyumlu)', tags: ['DevOps', 'vCenter', 'ESXi'] }
    },
    smartnest: {
        category: 'DeveloperApplication',
        en: { badge: 'Open Source', description: 'AI-Powered advanced nesting solution for professional CNC and laser cutting optimization', tags: ['AI', 'CNC', 'Open Source'] },
        tr: { badge: 'Açık Kaynak', description: 'Profesyonel CNC ve lazer kesim optimizasyonu için yapay zeka destekli gelişmiş yerleşim çözümü', tags: ['YZ', 'CNC', 'Açık Kaynak'] }
    },
    restechef: {
        category: 'LifestyleApplication',
        en: { badge: 'AI Powered', description: 'AI-powered recipe generator using leftover ingredients with smart recommendations', tags: ['AI', 'Food Tech', 'Mobile'] },
        tr: { badge: 'YZ Destekli', description: 'Artan malzemeleri akıllı önerilerle kullanan yapay zeka destekli tarif üreticisi', tags: ['YZ', 'Gıda Teknolojisi', 'Mobil'] }
    },
    coff: {
        category: 'DeveloperApplication',
        en: { badge: 'Framework', description: 'Modern PHP framework designed for speed and efficiency with lightweight architecture', tags: ['PHP', 'Framework', 'Open Source'] },
        tr: { badge: 'Framework', description: 'Hafif mimarisiyle hız ve verimlilik için tasarlanmış modern PHP frameworkü', tags: ['PHP', 'Framework', 'Açık Kaynak'] }
    },
    logitech: {
        category: 'BusinessApplication',
        en: { badge: 'Open Source', description: 'VDA standards labeling, ASN and order management in one platform. Demo: demo@demo.com / demo', tags: ['VDA', 'Logistics', 'Open Source'] },
        tr: { badge: 'Açık Kaynak', description: 'VDA standart etiketleme, ASN ve sipariş yönetimi tek platformda. Demo: demo@demo.com / demo', tags: ['VDA', 'Lojistik', 'Açık Kaynak'] }
    },
    qrmenu: {
        category: 'BusinessApplication',
        en: { badge: 'Restaurant', description: 'Database-free, instantly active mobile-friendly QR menu system for restaurants', tags: ['QR Code', 'Restaurant', 'Mobile'] },
        tr: { badge: 'Restoran', description: 'Veritabanı gerektirmeyen, anında aktif olan mobil uyumlu restoran QR menü sistemi', tags: ['QR Kod', 'Restoran', 'Mobil'] }
    },
    imposter: {
        category: 'GameApplication',
        en: { badge: 'Gaming', description: 'Real-time social deduction game where players uncover imposters in fast multiplayer rounds', tags: ['Gaming', 'Multiplayer', 'Browser'] },
        tr: { badge: 'Oyun', description: 'Oyuncuların hızlı çok oyunculu turlarda sahtekarları bulduğu gerçek zamanlı sosyal çıkarım oyunu', tags: ['Oyun', 'Çok Oyunculu', 'Tarayıcı'] }
    },
    lawassist: {
        category: 'BusinessApplication',
        en: { badge: '⭐ Favorite', description: 'AI-powered, multilingual legal case preparation and lawyer panel application that can be self-hosted', tags: ['AI', 'Multilingual', 'Self-Hosted'] },
        tr: { badge: '⭐ Favori', description: 'Yapay zeka destekli, çok dilli hukuk dava dosyası hazırlama ve avukat paneli sunan, self-host edilebilir hukuk uygulaması', tags: ['Yapay Zeka', 'Çok Dilli', 'Self-Hosted'] }
    },
    ubden: {
        category: 'SocialNetworkingApplication',
        en: { badge: 'Community', description: 'Developer community platform with forums, discussions, and knowledge sharing', tags: ['Community', 'Forum', 'Discussion'] },
        tr: { badge: 'Topluluk', description: 'Forumlar, tartışmalar ve bilgi paylaşımı içeren geliştirici topluluk platformu', tags: ['Topluluk', 'Forum', 'Tartışma'] }
    }
};

// ========================================
// Main Application
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    new ParticleBackground('particle-canvas');

    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 0, once: true, disable: true });
    }

    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 1000);

    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navbar = document.querySelector('.navbar');
    const langSwitch = document.getElementById('lang-switch');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    const searchInput = document.getElementById('app-search');
    const filterTags = document.querySelectorAll('.filter-tag');
    const appCards = document.querySelectorAll('.app-card');
    const appLinks = document.querySelectorAll('.app-link');

    let currentFilter = 'all';
    let currentLanguage = localStorage.getItem('ruy-lang') || 'en';

    function updateSeoSchema(lang) {
        const appItems = Array.from(document.querySelectorAll('.app-card')).map((card, index) => {
            const appId = card.dataset.appId;
            const appContent = APPS_I18N[appId];
            const name = card.querySelector('.app-title')?.textContent?.trim() || appId;
            const href = card.querySelector('.app-link')?.href || 'https://ruy.app/';

            return {
                '@type': 'ListItem',
                position: index + 1,
                item: {
                    '@type': 'SoftwareApplication',
                    name,
                    alternateName: name,
                    applicationCategory: appContent?.category || 'BusinessApplication',
                    operatingSystem: 'Web, iOS, Android',
                    url: href,
                    inLanguage: ['en', 'tr'],
                    description: appContent?.[lang]?.description || '',
                    keywords: [...(appContent?.en?.tags || []), ...(appContent?.tr?.tags || [])].join(', ')
                }
            };
        });

        const schema = {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: lang === 'tr' ? 'RUY.APP Uygulama Kütüphanesi' : 'RUY.APP App Library',
            inLanguage: ['en', 'tr'],
            itemListElement: appItems
        };

        const schemaElement = document.getElementById('apps-schema');
        if (schemaElement) schemaElement.textContent = JSON.stringify(schema, null, 2);
    }

    function applyLanguage(lang) {
        const content = LANG_CONTENT[lang] || LANG_CONTENT.en;
        currentLanguage = lang;

        document.documentElement.lang = lang;
        localStorage.setItem('ruy-lang', lang);

        document.title = content.pageTitle;
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = content.pageTitle;

        const descriptionMeta = document.querySelector('meta[name="description"]');
        const keywordsMeta = document.querySelector('meta[name="keywords"]');
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDescription = document.querySelector('meta[property="og:description"]');
        const ogLocale = document.querySelector('meta[property="og:locale"]');
        const twTitle = document.querySelector('meta[name="twitter:title"]');
        const twDescription = document.querySelector('meta[name="twitter:description"]');

        if (descriptionMeta) descriptionMeta.setAttribute('content', content.metaDescription);
        if (keywordsMeta) keywordsMeta.setAttribute('content', content.metaKeywords);
        if (ogTitle) ogTitle.setAttribute('content', content.pageTitle);
        if (ogDescription) ogDescription.setAttribute('content', content.metaDescription);
        if (ogLocale) ogLocale.setAttribute('content', content.seoLocale);
        if (twTitle) twTitle.setAttribute('content', content.pageTitle);
        if (twDescription) twDescription.setAttribute('content', content.metaDescription);

        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach((link, i) => { if (content.nav[i]) link.textContent = content.nav[i]; });

        const heroBadge = document.querySelector('.hero-badge span:last-child');
        if (heroBadge) heroBadge.textContent = content.heroBadge;
        const mainTitle = document.getElementById('main-title');
        if (mainTitle) mainTitle.textContent = content.heroTitle;
        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (heroSubtitle) heroSubtitle.innerHTML = `<code class="code-accent">&lt;#</code> ${content.heroSubtitle} <code class="code-accent">#&gt;</code>`;
        const heroDescription = document.querySelector('.hero-description');
        if (heroDescription) heroDescription.textContent = content.heroDescription;

        const heroButtons = document.querySelectorAll('.hero-actions .btn');
        heroButtons.forEach((btn, i) => {
            const icon = btn.querySelector('i')?.outerHTML || '';
            if (content.heroButtons[i]) btn.innerHTML = `${icon} ${content.heroButtons[i]}`;
        });

        const statLabels = document.querySelectorAll('.stat-label');
        statLabels.forEach((stat, i) => { if (content.heroStats[i]) stat.textContent = content.heroStats[i]; });

        const scrollText = document.querySelector('.scroll-indicator span');
        if (scrollText) scrollText.textContent = content.scroll;

        const sectionTitles = document.querySelectorAll('.apps-section .section-header .section-title, .apps-section .section-header .section-subtitle');
        if (sectionTitles[0]) sectionTitles[0].textContent = content.appSection[0];
        if (sectionTitles[1]) sectionTitles[1].textContent = content.appSection[1];

        if (searchInput) searchInput.placeholder = content.searchPlaceholder;
        filterTags.forEach((tag, i) => { if (content.filters[i]) tag.textContent = content.filters[i]; });

        appCards.forEach(card => {
            const appId = card.dataset.appId;
            const appData = APPS_I18N[appId]?.[lang];
            if (!appData) return;
            const badge = card.querySelector('.app-badge');
            const description = card.querySelector('.app-description');
            const tags = card.querySelectorAll('.tag');
            if (badge) badge.textContent = appData.badge;
            if (description) description.textContent = appData.description;
            tags.forEach((tag, i) => { if (appData.tags[i]) tag.textContent = appData.tags[i]; });
        });

        appLinks.forEach(link => {
            const icon = link.querySelector('i')?.outerHTML || '';
            link.innerHTML = `${icon} ${content.launchApp}`;
        });

        document.querySelectorAll('.app-info-btn').forEach(btn => btn.title = content.viewDocs);

        const featureHeader = document.querySelectorAll('.features-section .section-header .section-title, .features-section .section-header .section-subtitle');
        if (featureHeader[0]) featureHeader[0].textContent = content.featuresSection[0];
        if (featureHeader[1]) featureHeader[1].textContent = content.featuresSection[1];

        document.querySelectorAll('.feature-title').forEach((title, i) => { if (content.featureTitles[i]) title.textContent = content.featureTitles[i]; });
        document.querySelectorAll('.feature-description').forEach((desc, i) => { if (content.featureDescriptions[i]) desc.textContent = content.featureDescriptions[i]; });

        const ctaTitle = document.querySelector('.cta-title');
        const ctaDesc = document.querySelector('.cta-description');
        if (ctaTitle) ctaTitle.textContent = content.cta[0];
        if (ctaDesc) ctaDesc.textContent = content.cta[1];
        const ctaButtons = document.querySelectorAll('.cta-buttons .btn');
        ctaButtons.forEach((btn, i) => {
            const icon = btn.querySelector('i')?.outerHTML || '';
            if (content.cta[i + 2]) btn.innerHTML = `${icon} ${content.cta[i + 2]}`;
        });

        const footerSubtitle = document.querySelector('.footer-links').closest('.footer-section').querySelector('.footer-subtitle');
        if (footerSubtitle) footerSubtitle.textContent = content.footerQuickLinks;
        document.querySelectorAll('.footer-links a').forEach((link, i) => { if (content.footerLinks[i]) link.textContent = content.footerLinks[i]; });
        const footerContact = document.querySelectorAll('.footer-subtitle')[1];
        if (footerContact) footerContact.textContent = content.footerContact;
        const footerBottom = document.querySelector('.footer-bottom p');
        if (footerBottom) footerBottom.childNodes[0].nodeValue = `${content.footerBottom} `;

        const featuresPopupTitle = document.querySelector('#features-popup h2');
        if (featuresPopupTitle) featuresPopupTitle.textContent = content.popups.featuresTitle;
        document.querySelectorAll('.popup-feature-content').forEach((item, i) => {
            const h4 = item.querySelector('h4');
            const p = item.querySelector('p');
            if (content.popups.features[i]) {
                h4.textContent = content.popups.features[i][0];
                p.textContent = content.popups.features[i][1];
            }
        });

        const contactTitle = document.querySelector('#contact-popup h2');
        if (contactTitle) contactTitle.textContent = content.popups.contactTitle;
        document.querySelectorAll('.contact-details h4').forEach((h4, i) => { if (content.popups.contactLabels[i]) h4.textContent = content.popups.contactLabels[i]; });
        const sendMessageTitle = document.querySelector('.contact-form h3');
        if (sendMessageTitle) sendMessageTitle.textContent = content.popups.sendMessage;

        const nameInput = document.querySelector('#contact-form input[type="text"]');
        const emailInput = document.querySelector('#contact-form input[type="email"]');
        const textareaInput = document.querySelector('#contact-form textarea');
        const sendButton = document.querySelector('#contact-form button');
        if (nameInput) nameInput.placeholder = content.popups.form[0];
        if (emailInput) emailInput.placeholder = content.popups.form[1];
        if (textareaInput) textareaInput.placeholder = content.popups.form[2];
        if (sendButton) {
            const icon = sendButton.querySelector('i')?.outerHTML || '';
            sendButton.innerHTML = `${icon} ${content.popups.form[3]}`;
        }

        if (langSwitch) {
            langSwitch.textContent = lang === 'tr' ? 'EN' : 'TR';
            langSwitch.setAttribute('aria-label', lang === 'tr' ? 'Switch to English' : 'Türkçe diline geç');
        }

        updateSeoSchema(lang);
    }

    function animateCounter(element, target, duration = 2000) {
        let current = 0;
        const increment = target / (duration / 16);
        const suffix = element.dataset.target.includes('+') ? '+' : '';

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target + suffix;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 16);
    }

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.stat-number').forEach(stat => {
                    const target = parseInt(stat.dataset.target);
                    animateCounter(stat, target);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) statsObserver.observe(heroStats);

    function filterApps() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        appCards.forEach(card => {
            const category = card.dataset.category;
            const title = card.querySelector('.app-title').textContent.toLowerCase();
            const description = card.querySelector('.app-description').textContent.toLowerCase();

            const matchesFilter = currentFilter === 'all' || category === currentFilter;
            const matchesSearch = title.includes(searchTerm) || description.includes(searchTerm);

            if (matchesFilter && matchesSearch) {
                card.style.display = 'block';
                card.removeAttribute('data-hidden');
                gsap.fromTo(card, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5 });
            } else {
                card.style.display = 'none';
                card.setAttribute('data-hidden', 'true');
            }
        });
    }

    if (searchInput) searchInput.addEventListener('input', filterApps);

    filterTags.forEach(tag => {
        tag.addEventListener('click', () => {
            filterTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            currentFilter = tag.dataset.filter;
            filterApps();
        });
    });

    if (langSwitch) {
        langSwitch.addEventListener('click', () => {
            applyLanguage(currentLanguage === 'tr' ? 'en' : 'tr');
            filterApps();
        });
    }

    const featuresPopup = document.getElementById('features-popup');
    const contactPopup = document.getElementById('contact-popup');

    window.openFeaturesPopup = function () {
        featuresPopup.style.display = 'block';
        gsap.to(featuresPopup, { opacity: 1, duration: 0.3 });
        gsap.fromTo(featuresPopup.querySelector('.popup-content'), { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' });
        document.body.style.overflow = 'hidden';
    };

    window.closeFeaturesPopup = function () {
        gsap.to(featuresPopup.querySelector('.popup-content'), { scale: 0.8, opacity: 0, duration: 0.3 });
        gsap.to(featuresPopup, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                featuresPopup.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    };

    window.openContactPopup = function () {
        contactPopup.style.display = 'block';
        gsap.to(contactPopup, { opacity: 1, duration: 0.3 });
        gsap.fromTo(contactPopup.querySelector('.popup-content'), { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' });
        document.body.style.overflow = 'hidden';
    };

    window.closeContactPopup = function () {
        gsap.to(contactPopup.querySelector('.popup-content'), { scale: 0.8, opacity: 0, duration: 0.3 });
        gsap.to(contactPopup, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                contactPopup.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    };

    [featuresPopup, contactPopup].forEach(popup => {
        if (popup) {
            popup.addEventListener('click', (e) => {
                if (e.target === popup) {
                    if (popup === featuresPopup) window.closeFeaturesPopup();
                    else window.closeContactPopup();
                }
            });
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (featuresPopup.style.display === 'block') window.closeFeaturesPopup();
            if (contactPopup.style.display === 'block') window.closeContactPopup();
        }
    });

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert(LANG_CONTENT[currentLanguage].popups.success);
            contactForm.reset();
            window.closeContactPopup();
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || !href) return;
            e.preventDefault();
            const target = document.querySelector(href);

            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
        });
    });

    document.querySelectorAll('.app-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.querySelector('.app-card-inner').style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.querySelector('.app-card-inner').style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });

    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 15;
            const rotateY = (centerX - x) / 15;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });
    });

    const backgroundMusic = document.getElementById('background-music');
    if (backgroundMusic) {
        document.addEventListener('click', () => {
            if (backgroundMusic.paused) {
                backgroundMusic.play().catch(e => {
                    console.log('Audio play prevented:', e);
                });
            }
        }, { once: true });

        backgroundMusic.volume = 0.3;
    }

    const scrollProgress = document.createElement('div');
    scrollProgress.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(scrollProgress);

    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        scrollProgress.style.width = scrolled + '%';
    });

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    applyLanguage(currentLanguage);
    filterApps();

    console.log('%c🚀 RUY.APP', 'font-size: 40px; font-weight: bold; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
    console.log('%cWe Are Run Your App!', 'font-size: 20px; color: #667eea;');
    console.log('%cInterested in joining our team? Contact us at info@ruy.app', 'font-size: 14px; color: #a0aec0;');
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}
