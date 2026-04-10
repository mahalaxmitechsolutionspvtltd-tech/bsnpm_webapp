import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, FileText, PieChart, HelpCircle, ArrowRight, Menu,
  CreditCard, Bell, Landmark, LockIcon, Search, X, TrendingUp
} from 'lucide-react';

const AppleIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.546,12.763c0.024-1.87,1.004-3.597,2.597-4.576c-1.009-1.442-2.64-2.323-4.399-2.378c-1.851-0.194-3.645,1.107-4.588,1.107c-0.961,0-2.413-1.088-3.977-1.056C6.122,5.927,4.25,7.068,3.249,8.867c-2.131,3.69-0.542,9.114,1.5,12.097c1.022,1.461,2.215,3.092,3.778,3.035c1.529-0.063,2.1-0.975,3.945-0.975c1.828,0,2.364,0.975,3.958,0.938c1.64-0.027,2.674-1.467,3.66-2.942c0.734-1.041,1.299-2.191,1.673-3.408C19.815,16.788,18.548,14.879,18.546,12.763z" />
    <path d="M15.535,3.847C16.429,2.773,16.87,1.393,16.763,0c-1.366,0.144-2.629,0.797-3.535,1.829c-0.895,1.019-1.349,2.351-1.261,3.705C13.352,5.548,14.667,4.926,15.535,3.847z" />
  </svg>
);

const PlayStoreIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="m21.762,9.942L4.67.378c-.721-.466-1.635-.504-2.393-.099-.768.411-1.246,1.208-1.246,2.08v19.282c0,.872.477,1.668,1.246,2.079.755.404,1.668.37,2.393-.098l17.092-9.564c.756-.423,1.207-1.192,1.207-2.058s-.451-1.635-1.207-2.058Zm-5.746-1.413l-2.36,2.36L5.302,2.534l10.714,5.995ZM2.604,21.906V2.094l9.941,9.906L2.604,21.906Zm2.698-.439l8.355-8.355,2.36,2.36-10.714,5.995Zm15.692-8.78l-3.552,1.987-2.674-2.674,2.674-2.674,3.552,1.987c.363.203.402.548.402.686s-.039.483-.402.686Z" />
  </svg>
);

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);
const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="2" width="20" height="20" rx="10" ry="10"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
);
const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12" rx="2" ry="2"/><circle cx="4" cy="4" r="2"/></svg>
);
const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-[#0a192f] text-white hover:bg-[#112240] shadow-sm",
    outline: "border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-900",
    ghost: "hover:bg-slate-100 text-slate-700",
    link: "text-[#0a192f] underline-offset-4 hover:underline",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-[10px] px-3 text-xs",
    lg: "h-12 rounded-[10px] px-8 text-base",
    icon: "h-10 w-10",
  };
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a192f] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

const Badge = ({ className, variant = "default", ...props }) => {
  const variants = {
    default: "bg-[#0a192f] text-white",
    secondary: "bg-slate-200 text-[#0a192f]",
    outline: "text-slate-700 border border-slate-300",
  };
  return (
    <div className={cn("inline-flex items-center rounded-[10px] px-3 py-1 text-xs font-medium transition-colors", variants[variant], className)} {...props} />
  );
};

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-[10px] border border-slate-200 bg-white text-slate-950 shadow-sm", className)} {...props} />
));
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("relative flex h-12 w-12 shrink-0 overflow-hidden rounded-[10px]", className)} {...props} />
));
const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <img ref={ref} className={cn("aspect-square h-full w-full object-cover", className)} {...props} />
));
const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex h-full w-full items-center justify-center rounded-[10px] bg-slate-100", className)} {...props} />
));

const AuroraBackground = ({ className, children, showRadialGradient = true, ...props }) => {
  return (
    <div className={cn("relative flex flex-col min-h-[100vh] items-center justify-center bg-slate-50 text-slate-950 transition-bg", className)} {...props}>
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            `
            [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
            [--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)]
            [background-image:var(--white-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px] invert-0
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-overlay
            pointer-events-none
            absolute -inset-[10px] opacity-40 will-change-transform`,
            showRadialGradient && `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`
          )}
        ></div>
      </div>
      {children}
    </div>
  );
};

const Warp = ({ colors }) => (
  <motion.div
    animate={{
      backgroundPosition: ["0% 0%", "100% 100%", "0% 100%", "100% 0%", "0% 0%"],
    }}
    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
    style={{
      background: `radial-gradient(circle at 50% 50%, ${colors[0]}, transparent 60%), radial-gradient(circle at 80% 20%, ${colors[1]}, transparent 50%), radial-gradient(circle at 20% 80%, ${colors[2]}, transparent 50%), radial-gradient(circle at 10% 20%, ${colors[3] || colors[0]}, transparent 50%)`,
      backgroundSize: "200% 200%",
      width: "100%",
      height: "100%",
      opacity: 0.85
    }}
  />
);

const AppStoreButton = ({ className, ...props }) => (
  <Button variant="outline" className={cn("h-12 gap-3 px-4 bg-[#0a192f] text-white hover:bg-[#112240] hover:text-white border-none rounded-[10px]", className)} {...props}>
    <AppleIcon className="size-6" />
    <div className="text-left flex flex-col items-start justify-center pr-2">
      <span className="text-[10px] leading-none tracking-tight text-slate-300">Download on the</span>
      <p className="text-base font-medium leading-none mt-0.5">App Store</p>
    </div>
  </Button>
);

const PlayStoreBtn = ({ className, ...props }) => (
  <Button variant="outline" className={cn("h-12 gap-3 px-4 bg-[#0a192f] text-white hover:bg-[#112240] hover:text-white border-none rounded-[10px]", className)} {...props}>
    <PlayStoreIcon className="size-6" />
    <div className="text-left flex flex-col items-start justify-center pr-2">
      <span className="text-[10px] leading-none font-normal tracking-tight text-slate-300">GET IT ON</span>
      <p className="text-base font-medium leading-none mt-0.5">Google Play</p>
    </div>
  </Button>
);

const ContainerScroll = ({ titleComponent, children }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scaleDimensions = () => isMobile ? [0.7, 0.9] : [1.05, 1];
  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="h-[60rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20" ref={containerRef}>
      <div className="py-10 md:py-40 w-full relative" style={{ perspective: "1000px" }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <CardScroll rotate={rotate} translate={translate} scale={scale}>
          {children}
        </CardScroll>
      </div>
    </div>
  );
};

const Header = ({ translate, titleComponent }) => (
  <motion.div style={{ translateY: translate }} className="max-w-5xl mx-auto text-center">
    {titleComponent}
  </motion.div>
);

const CardScroll = ({ rotate, scale, children }) => (
  <motion.div
    style={{
      rotateX: rotate,
      scale,
      boxShadow: "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
    }}
    className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border border-slate-200 p-2 md:p-6 bg-white rounded-[10px] shadow-2xl"
  >
    <div className="h-full w-full overflow-hidden rounded-[10px] bg-slate-50 md:p-4">
      {children}
    </div>
  </motion.div>
);

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menu = [
    { title: "Features", url: "#features" },
    { title: "Testimonials", url: "#testimonials" },
    { title: "Notices", url: "#notices" },
    { title: "Help", url: "#help" },
  ];

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 transition-all duration-300",
      scrolled ? "bg-white/90 backdrop-blur-md border-b border-slate-200 py-3 shadow-sm" : "bg-transparent py-5"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-[#0a192f] rounded-[10px] flex items-center justify-center text-white">
              <Landmark size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-lg text-[#0a192f] leading-tight tracking-tight">BSNP Portal</span>
              <span className="text-[9px] font-medium uppercase tracking-widest text-slate-500">Official Patasanstha</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-6">
            {menu.map((item) => (
              <a
                key={item.title}
                href={item.url}
                className="text-sm font-medium text-slate-600 hover:text-[#0a192f] transition-colors"
              >
                {item.title}
              </a>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-slate-600 rounded-[10px]">
              <Search className="size-4" />
            </Button>
            <Button className="rounded-[10px] px-6">
              Secure Login
            </Button>
          </div>
          <div className="lg:hidden flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-slate-900 rounded-[10px]" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-4/5 max-w-sm bg-white z-50 shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0a192f] rounded-[10px] flex items-center justify-center text-white">
                    <Landmark size={20} />
                  </div>
                  <span className="font-semibold text-lg text-slate-900">BSNP Portal</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-slate-500 rounded-[10px]">
                  <X className="size-5" />
                </Button>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                {menu.map((item) => (
                  <a
                    key={item.title}
                    href={item.url}
                    className="px-4 py-4 rounded-[10px] text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {item.title}
                  </a>
                ))}
              </div>
              <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
                <Button variant="outline" className="w-full h-12 rounded-[10px]">
                  <Search className="size-4 mr-2" /> Search
                </Button>
                <Button className="w-full h-12 rounded-[10px]">
                  Secure Login
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

const HeroSection = () => {
  return (
    <AuroraBackground className="pt-36 md:pt-48 pb-24 md:pb-32">
      <ContainerScroll
        titleComponent={
          <div className="mb-20 md:mb-28 relative z-10">
            <Badge variant="outline" className="mb-6 bg-white/50 backdrop-blur-sm shadow-sm font-medium">
              <Shield size={12} className="mr-2 text-[#0a192f]" />
              100% Secure & MCS Act Compliant
            </Badge>
            <h1 className="text-4xl md:text-6xl font-semibold text-slate-900 tracking-tight leading-tight">
              Babarwadi Snehbandh <br />
              <span className="text-[#0a192f]">Nokardaranchi</span> Patasanstha
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-700 font-medium max-w-2xl mx-auto tracking-tight">
              Official digital gateway for management. Manage deposits, track loans, and stay updated securely.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Button size="lg" className="w-full sm:w-auto">
                Admin Login
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/50 backdrop-blur-sm">
                <Users size={16} className="mr-2" />
                Sanchalak Login
              </Button>
            </div>
          </div>
        }
      >
        <div className="bg-white rounded-[10px] shadow-sm border border-slate-200 h-full w-full overflow-hidden flex flex-col">
          <div className="h-12 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-2 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-[10px] bg-slate-300"></div>
              <div className="w-3 h-3 rounded-[10px] bg-slate-300"></div>
              <div className="w-3 h-3 rounded-[10px] bg-slate-300"></div>
            </div>
            <div className="mx-auto bg-white border border-slate-200 rounded-[10px] px-24 py-1 text-[10px] text-slate-500 font-medium flex items-center gap-2">
              <LockIcon size={10} /> bsnp.org/dashboard
            </div>
          </div>
          <div className="flex-1 p-6 md:p-10 bg-slate-50 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
              <div className="col-span-1 md:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-[10px] shadow-sm border border-slate-200">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Society Assets</p>
                      <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">₹78.2 Cr</h3>
                    </div>
                    <div className="w-12 h-12 bg-slate-100 text-[#0a192f] rounded-[10px] flex items-center justify-center">
                      <PieChart size={24} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium text-slate-600">
                      <span>Deposit Growth (YTD)</span>
                      <span className="text-[#0a192f] bg-slate-100 px-2 py-0.5 rounded-[10px]">+12.5%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-[10px] overflow-hidden">
                      <div className="h-full bg-[#0a192f] rounded-[10px] w-[75%]"></div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-[10px] shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 text-[#0a192f] rounded-[10px] flex items-center justify-center"><Shield size={18} /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Audited Status</p>
                      <p className="text-lg font-semibold text-slate-900 tracking-tight">Class 'A'</p>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-[10px] shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 text-[#0a192f] rounded-[10px] flex items-center justify-center"><Users size={18} /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-0.5">Active Members</p>
                      <p className="text-lg font-semibold text-slate-900 tracking-tight">1,250+</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-1 bg-white p-6 rounded-[10px] shadow-sm border border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">Recent Activity</p>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[10px] bg-slate-50 flex items-center justify-center border border-slate-100">
                        <FileText size={14} className="text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-24 bg-slate-200 rounded-[10px] mb-2"></div>
                        <div className="h-1.5 w-16 bg-slate-100 rounded-[10px]"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContainerScroll>
    </AuroraBackground>
  );
};

const FeaturesCards = () => {
  const features = [
    {
      title: "Manage Deposits",
      description: "Open or renew RD, FD, and Term Deposits. Download statements and check balances instantly.",
      icon: <CreditCard className="w-8 h-8 text-[#0a192f]" strokeWidth={1.5} />,
    },
    {
      title: "Loan Services",
      description: "Check loan eligibility, apply online, track your application status, and view EMI schedules.",
      icon: <Landmark className="w-8 h-8 text-[#0a192f]" strokeWidth={1.5} />,
    },
    {
      title: "Official Notices",
      description: "Access AGM/EGM notices, board circulars, meeting minutes, and policy updates centrally.",
      icon: <Bell className="w-8 h-8 text-[#0a192f]" strokeWidth={1.5} />,
    },
    {
      title: "Statements & Reports",
      description: "Download digital passbook copies, deposit receipts, and your annual dividend statements.",
      icon: <FileText className="w-8 h-8 text-[#0a192f]" strokeWidth={1.5} />,
    },
    {
      title: "Bank-Grade Security",
      description: "Your financial data is protected and accessible only via strict role-based verified permissions.",
      icon: <LockIcon className="w-8 h-8 text-[#0a192f]" strokeWidth={1.5} />,
    },
    {
      title: "Helpdesk & Support",
      description: "Submit complaints, suggestions, or queries and track their resolution status in real-time.",
      icon: <HelpCircle className="w-8 h-8 text-[#0a192f]" strokeWidth={1.5} />,
    },
  ];

  const getShaderConfig = (index) => {
    const configs = [
      { colors: ["#dbeafe", "#bfdbfe", "#e0e7ff", "#f3e8ff"] },
      { colors: ["#e0f2fe", "#bae6fd", "#f1f5f9", "#e2e8f0"] },
      { colors: ["#f1f5f9", "#e2e8f0", "#dbeafe", "#f8fafc"] },
      { colors: ["#e0e7ff", "#dbeafe", "#f1f5f9", "#e0f2fe"] },
      { colors: ["#f3e8ff", "#e0e7ff", "#e2e8f0", "#dbeafe"] },
      { colors: ["#bae6fd", "#e0f2fe", "#f3e8ff", "#f1f5f9"] },
    ];
    return configs[index % configs.length];
  };

  return (
    <section className="py-24 px-4 bg-white" id="features">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">Core Capabilities</Badge>
          <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-6 tracking-tight">Digital Banking Capabilities</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium tracking-tight">
            Fast, organized, and transparent digital services tailored for all our society members.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const shaderConfig = getShaderConfig(index);
            return (
              <div key={index} className="relative h-80 group">
                <div className="absolute inset-0 rounded-[10px] overflow-hidden bg-slate-50">
                  <Warp colors={shaderConfig.colors} />
                </div>
                <div className="relative z-10 p-8 rounded-[10px] h-full flex flex-col bg-white/70 border border-slate-200 backdrop-blur-sm transition-all group-hover:bg-white/80">
                  <div className="mb-6">{feature.icon}</div>
                  <h3 className="text-2xl font-semibold mb-3 text-slate-900 tracking-tight">{feature.title}</h3>
                  <p className="leading-relaxed flex-grow text-slate-600 font-medium text-sm">{feature.description}</p>
                  <div className="mt-6 flex items-center text-sm font-semibold text-[#0a192f] transition-opacity">
                    <span className="mr-2">Access module</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  return (
    <section className="py-16 md:py-32 bg-slate-50 border-t border-slate-200" id="testimonials">
      <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
          <Badge variant="outline" className="mb-6 bg-white">Member Stories</Badge>
          <h2 className="text-4xl font-semibold lg:text-5xl text-slate-900 tracking-tight">Trusted by Thousands of Members</h2>
          <p className="text-slate-600 font-medium">See what our society members have to say about their seamless digital banking experience with BSNP.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-rows-2">
          <Card className="grid grid-rows-[auto_1fr] gap-8 sm:col-span-2 sm:p-6 lg:row-span-2 rounded-[10px] shadow-sm border-slate-200">
            <CardHeader>
              <Landmark className="size-8 text-[#0a192f]" />
            </CardHeader>
            <CardContent>
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p className="text-xl font-medium text-slate-900">BSNP's digital portal has transformed how I manage my deposits. The interface is seamless, and the transparency is unmatched. A true game-changer for cooperative societies.</p>
                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src="https://i.pravatar.cc/150?u=1" alt="Ramesh Patil" loading="lazy" />
                    <AvatarFallback>RP</AvatarFallback>
                  </Avatar>
                  <div>
                    <cite className="text-sm font-semibold text-slate-900 not-italic">Ramesh Patil</cite>
                    <span className="text-slate-500 block text-sm font-medium">Senior Teacher</span>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>
          <Card className="md:col-span-2 rounded-[10px] shadow-sm border-slate-200">
            <CardContent className="h-full pt-6">
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p className="text-lg font-medium text-slate-900">Applying for a loan used to be a hassle. With the new system, I tracked my application online and got approved in days without visiting the branch!</p>
                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src="https://i.pravatar.cc/150?u=2" alt="Sunita Kadam" loading="lazy" />
                    <AvatarFallback>SK</AvatarFallback>
                  </Avatar>
                  <div>
                    <cite className="text-sm font-semibold text-slate-900 not-italic">Sunita Kadam</cite>
                    <span className="text-slate-500 block text-sm font-medium">School Principal</span>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>
          <Card className="rounded-[10px] shadow-sm border-slate-200 bg-white">
            <CardContent className="h-full pt-6">
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p className="text-sm font-medium text-slate-900">The best digital initiative by any Patasanstha. Accessing my dividend reports and AGM notices is so easy now.</p>
                <div className="grid items-center gap-3 [grid-template-columns:auto_1fr]">
                  <Avatar className="size-12">
                    <AvatarImage src="https://i.pravatar.cc/150?u=3" alt="Vijay Deshmukh" loading="lazy" />
                    <AvatarFallback>VD</AvatarFallback>
                  </Avatar>
                  <div>
                    <cite className="text-sm font-semibold text-slate-900 not-italic">Vijay Deshmukh</cite>
                    <span className="text-slate-500 block text-xs font-medium">Society Member</span>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>
          <Card className="rounded-[10px] shadow-sm border-none bg-[#0a192f] text-white">
            <CardContent className="h-full pt-6">
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p className="text-sm font-medium text-slate-100">Secure, fast, and incredibly user-friendly. BSNP has truly stepped into the modern era of banking.</p>
                <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                  <Avatar className="size-12">
                    <AvatarImage src="https://i.pravatar.cc/150?u=4" alt="Anjali More" loading="lazy" />
                    <AvatarFallback className="bg-slate-800 text-white">AM</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-white">Anjali More</p>
                    <span className="text-slate-400 block text-xs font-medium">Professor</span>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  const footerLinks = [
    {
      title: "Organization",
      links: [
        { href: "#", label: "About BSNP" },
        { href: "#", label: "Board of Directors" },
        { href: "#", label: "Annual Reports" },
        { href: "#", label: "Careers" },
        { href: "#", label: "Contact Us" },
      ],
    },
    {
      title: "Services",
      links: [
        { href: "#", label: "Deposit Schemes" },
        { href: "#", label: "Loan Products" },
        { href: "#", label: "Interest Rates" },
        { href: "#", label: "Member Forms" },
        { href: "#", label: "Dividend History" },
      ],
    },
    {
      title: "Support",
      links: [
        { href: "#", label: "Help Center" },
        { href: "#", label: "FAQs" },
        { href: "#", label: "Grievance Redressal" },
        { href: "#", label: "Branch Locator" },
        { href: "#", label: "Download App" },
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "#", label: "Terms & Conditions" },
        { href: "#", label: "Privacy Policy" },
        { href: "#", label: "MCS Act Guidelines" },
        { href: "#", label: "Audit Reports" },
        { href: "#", label: "Cyber Security Tips" },
      ],
    },
  ];

  const socialLinks = [
    { icon: FacebookIcon, href: "#" },
    { icon: InstagramIcon, href: "#" },
    { icon: LinkedinIcon, href: "#" },
    { icon: TwitterIcon, href: "#" },
  ];

  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16">
          {footerLinks.map((item, i) => (
            <div key={i}>
              <h3 className="mb-6 text-xs font-semibold text-slate-900 uppercase tracking-wider">{item.title}</h3>
              <ul className="space-y-3 text-slate-600 text-sm font-medium">
                {item.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="hover:text-[#0a192f] transition-colors tracking-tight">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="h-px bg-slate-200" />
        <div className="py-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0a192f] rounded-[10px] flex items-center justify-center text-white shadow-sm">
              <Landmark size={20} />
            </div>
            <span className="font-semibold text-2xl text-slate-900 tracking-tight">BSNP</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex gap-2 items-center mr-0 lg:mr-6 border-r-0 lg:border-r border-slate-200 pr-0 lg:pr-6">
              {socialLinks.map(({ icon: Icon, href }, i) => (
                <a
                  href={href}
                  className="flex items-center justify-center w-10 h-10 rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors"
                  key={i}
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
            <div className="flex gap-3">
              <AppStoreButton />
              <PlayStoreBtn />
            </div>
          </div>
        </div>
        <div className="h-px bg-slate-200" />
        <div className="text-center text-xs font-medium text-slate-500 py-6 flex flex-col md:flex-row justify-between items-center gap-4 tracking-tight">
          <p>© {new Date().getFullYear()} Babarwadi Snehbandh Nokardaranchi Patasanstha. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><Shield size={12} className="text-slate-400"/> Secure Connection</span>
            <span className="flex items-center gap-1.5"><TrendingUp size={12} className="text-slate-400"/> Ver. 2.1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --white: #ffffff;
          --black: #000000;
          --transparent: transparent;
          --blue-300: #93c5fd;
          --blue-400: #60a5fa;
          --blue-500: #3b82f6;
          --indigo-300: #a5b4fc;
          --violet-200: #ddd6fe;
        }
        @keyframes aurora {
          from {
            background-position: 50% 50%, 50% 50%;
          }
          to {
            background-position: 350% 50%, 350% 50%;
          }
        }
        .animate-aurora {
          animation: aurora 60s linear infinite;
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          background-color: #f8fafc;
          color: #0f172a;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}} />
      <div className="min-h-screen selection:bg-slate-200 selection:text-slate-900">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesCards />
          <TestimonialsSection />
        </main>
        <Footer />
      </div>
    </>
  );
}