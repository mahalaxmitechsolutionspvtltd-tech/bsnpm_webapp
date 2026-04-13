'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type SVGProps,
} from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  type MotionValue,
  type Variants,
} from 'framer-motion';
import {
  Shield,
  Users,
  FileText,
  PieChart,
  HelpCircle,
  ArrowRight,
  Menu,
  CreditCard,
  Bell,
  Landmark,
  LockIcon,
  X,
  TrendingUp,
  Sun,
  Moon,
  Briefcase,
  LineChart,
  ShieldCheck,
  Scale,
  ChevronRight,
} from 'lucide-react';

type ClassValue = string | false | null | undefined;

const cn = (...classes: ClassValue[]) => classes.filter(Boolean).join(' ');

const AppleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.546,12.763c0.024-1.87,1.004-3.597,2.597-4.576c-1.009-1.442-2.64-2.323-4.399-2.378c-1.851-0.194-3.645,1.107-4.588,1.107c-0.961,0-2.413-1.088-3.977-1.056C6.122,5.927,4.25,7.068,3.249,8.867c-2.131,3.69-0.542,9.114,1.5,12.097c1.022,1.461,2.215,3.092,3.778,3.035c1.529-0.063,2.1-0.975,3.945-0.975c1.828,0,2.364,0.975,3.958,0.938c1.64-0.027,2.674-1.467,3.66-2.942c0.734-1.041,1.299-2.191,1.673-3.408C19.815,16.788,18.548,14.879,18.546,12.763z" />
    <path d="M15.535,3.847C16.429,2.773,16.87,1.393,16.763,0c-1.366,0.144-2.629,0.797-3.535,1.829c-0.895,1.019-1.349,2.351-1.261,3.705C13.352,5.548,14.667,4.926,15.535,3.847z" />
  </svg>
);

const PlayStoreIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="m21.762,9.942L4.67.378c-.721-.466-1.635-.504-2.393-.099-.768.411-1.246,1.208-1.246,2.08v19.282c0,.872.477,1.668,1.246,2.079.755.404,1.668.37,2.393-.098l17.092-9.564c.756-.423,1.207-1.192,1.207-2.058s-.451-1.635-1.207-2.058Zm-5.746-1.413l-2.36,2.36L5.302,2.534l10.714,5.995ZM2.604,21.906V2.094l9.941,9.906L2.604,21.906Zm2.698-.439l8.355-8.355,2.36,2.36-10.714,5.995Zm15.692-8.78l-3.552,1.987-2.674-2.674,2.674-2.674,3.552,1.987c.363.203.402.548.402.686s-.039.483-.402.686Z" />
  </svg>
);

const FacebookIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="10" ry="10" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const LinkedinIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" rx="2" ry="2" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => {
    const variants: Record<ButtonVariant, string> = {
      default: 'bg-[#0a192f] dark:bg-blue-600 text-white hover:bg-[#112240] dark:hover:bg-blue-700 shadow-sm',
      outline: 'border border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white',
      ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
      link: 'text-[#0a192f] dark:text-blue-400 underline-offset-4 hover:underline',
    };

    const sizes: Record<ButtonSize, string> = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-[10px] px-3 text-xs',
      lg: 'h-12 rounded-[10px] px-8 text-base',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a192f] disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

type BadgeVariant = 'default' | 'secondary' | 'outline';

type BadgeProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
  variant?: BadgeVariant;
};

const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-[#0a192f] dark:bg-blue-600 text-white',
    secondary: 'bg-slate-200 dark:bg-slate-800 text-[#0a192f] dark:text-white',
    outline: 'text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

type DivProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

const Card = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('rounded-[14px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 shadow-sm', className)}
    {...props}
  />
));

Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
));

CardHeader.displayName = 'CardHeader';

const CardContent = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));

CardContent.displayName = 'CardContent';

const Avatar = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('relative flex h-12 w-12 shrink-0 overflow-hidden rounded-[12px]', className)} {...props} />
));

Avatar.displayName = 'Avatar';

type AvatarImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  className?: string;
};

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(({ className, alt = '', ...props }, ref) => (
  <img ref={ref} alt={alt} className={cn('aspect-square h-full w-full object-cover', className)} {...props} />
));

AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex h-full w-full items-center justify-center rounded-[12px] bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100', className)}
    {...props}
  />
));

AvatarFallback.displayName = 'AvatarFallback';

type Beam = {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  hue: number;
  pulse: number;
  pulseSpeed: number;
};

function createBeam(width: number, height: number): Beam {
  const angle = -35 + Math.random() * 8;

  return {
    x: Math.random() * width * 1.25 - width * 0.125,
    y: Math.random() * height * 1.25 - height * 0.125,
    width: 24 + Math.random() * 34,
    length: height * 1.9,
    angle,
    speed: 0.25 + Math.random() * 0.45,
    opacity: 0.08 + Math.random() * 0.08,
    hue: 200 + Math.random() * 40,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.01 + Math.random() * 0.012,
  };
}

type BeamsBackgroundProps = {
  className?: string;
  children: ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
};

const BeamsBackground = ({ className, children, intensity = 'medium' }: BeamsBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const beamsRef = useRef<Beam[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const resizeFrameRef = useRef<number | null>(null);

  const beamCount = intensity === 'strong' ? 18 : intensity === 'medium' ? 12 : 8;

  const opacityMap: Record<'subtle' | 'medium' | 'strong', number> = {
    subtle: 0.5,
    medium: 0.7,
    strong: 0.9,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      beamsRef.current = Array.from({ length: beamCount }, () => createBeam(width, height));
    };

    const handleResize = () => {
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
      }
      resizeFrameRef.current = requestAnimationFrame(updateCanvasSize);
    };

    const resetBeam = (beam: Beam, index: number, totalBeams: number, width: number, height: number) => {
      const column = index % 3;
      const spacing = width / 3;

      beam.y = height + 80;
      beam.x = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.45;
      beam.width = 36 + Math.random() * 48;
      beam.length = height * 1.9;
      beam.speed = 0.22 + Math.random() * 0.35;
      beam.hue = 200 + (index * 40) / totalBeams;
      beam.opacity = 0.08 + Math.random() * 0.08;

      return beam;
    };

    const drawBeam = (context: CanvasRenderingContext2D, beam: Beam) => {
      context.save();
      context.translate(beam.x, beam.y);
      context.rotate((beam.angle * Math.PI) / 180);

      const pulsingOpacity = beam.opacity * (0.85 + Math.sin(beam.pulse) * 0.15) * opacityMap[intensity];
      const gradient = context.createLinearGradient(0, 0, 0, beam.length);

      gradient.addColorStop(0, `hsla(${beam.hue}, 90%, 68%, 0)`);
      gradient.addColorStop(0.12, `hsla(${beam.hue}, 90%, 68%, ${pulsingOpacity * 0.35})`);
      gradient.addColorStop(0.45, `hsla(${beam.hue}, 90%, 68%, ${pulsingOpacity})`);
      gradient.addColorStop(0.72, `hsla(${beam.hue}, 90%, 68%, ${pulsingOpacity * 0.8})`);
      gradient.addColorStop(1, `hsla(${beam.hue}, 90%, 68%, 0)`);

      context.fillStyle = gradient;
      context.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      context.restore();
    };

    const animate = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);
      ctx.filter = 'blur(24px)';

      const totalBeams = beamsRef.current.length;

      beamsRef.current.forEach((beam, index) => {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;

        if (beam.y + beam.length < -80) {
          resetBeam(beam, index, totalBeams, width, height);
        }

        drawBeam(ctx, beam);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    updateCanvasSize();
    animate();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
      }
    };
  }, [beamCount, intensity]);

  return (
    <div className={cn('relative min-h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950', className)}>
      <canvas ref={canvasRef} className="absolute inset-0" style={{ filter: 'blur(10px)' }} />
      <motion.div
        className="absolute inset-0 bg-white/70 dark:bg-slate-950/70"
        animate={{ opacity: [0.62, 0.72, 0.62] }}
        transition={{ duration: 14, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
        style={{ backdropFilter: 'blur(36px)' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.12),transparent_45%)]" />
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">{children}</div>
    </div>
  );
};

type WarpProps = {
  colors: [string, string, string, string?];
};

const Warp = ({ colors }: WarpProps) => (
  <motion.div
    animate={{
      backgroundPosition: ['0% 0%', '100% 100%', '0% 100%', '100% 0%', '0% 0%'],
    }}
    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    style={{
      background: `radial-gradient(circle at 50% 50%, ${colors[0]}, transparent 60%), radial-gradient(circle at 80% 20%, ${colors[1]}, transparent 50%), radial-gradient(circle at 20% 80%, ${colors[2]}, transparent 50%), radial-gradient(circle at 10% 20%, ${colors[3] || colors[0]}, transparent 50%)`,
      backgroundSize: '200% 200%',
      width: '100%',
      height: '100%',
      opacity: 0.65,
    }}
  />
);

type PlayStoreBtnProps = ButtonProps;

const PlayStoreBtn = ({ className, ...props }: PlayStoreBtnProps) => (
  <Button className={cn('h-12 gap-3 rounded-[12px] px-6', className)} {...props}>
    <PlayStoreIcon className="size-6 text-white" />
    <div className="flex flex-col items-start justify-center text-left">
      <span className="text-[10px] leading-none font-normal tracking-tight text-slate-300">GET IT ON</span>
      <p className="mt-0.5 text-base font-medium leading-none text-white">Google Play</p>
    </div>
  </Button>
);

type ContainerScrollProps = {
  titleComponent: ReactNode;
  children: ReactNode;
};

const ContainerScroll = ({ titleComponent, children }: ContainerScrollProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scaleDimensions = (): [number, number] => (isMobile ? [0.86, 0.96] : [1.02, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], [12, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <div className="relative flex h-224 items-center justify-center p-2 md:h-[72rem] md:p-20" ref={containerRef}>
      <div className="relative w-full py-10 md:py-32" style={{ perspective: '1000px' }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <CardScroll rotate={rotate} translate={translate} scale={scale}>
          {children}
        </CardScroll>
      </div>
    </div>
  );
};

type HeaderProps = {
  translate: MotionValue<number>;
  titleComponent: ReactNode;
};

const Header = ({ translate, titleComponent }: HeaderProps) => (
  <motion.div style={{ translateY: translate }} className="mx-auto max-w-5xl text-center">
    {titleComponent}
  </motion.div>
);

type CardScrollProps = {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: ReactNode;
};

const CardScroll = ({ rotate, scale, children }: CardScrollProps) => (
  <motion.div
    style={{
      rotateX: rotate,
      scale,
      boxShadow:
        '0 8px 20px rgba(15,23,42,0.06), 0 24px 60px rgba(15,23,42,0.08), 0 60px 100px rgba(15,23,42,0.08)',
    }}
    className="mx-auto -mt-12 h-[28rem] w-full max-w-5xl rounded-[16px] border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 md:h-[38rem] md:p-6"
  >
    <div className="h-full w-full overflow-hidden rounded-[14px] bg-slate-50 dark:bg-slate-950 md:p-4">{children}</div>
  </motion.div>
);

type NavbarProps = {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
};

const Navbar = ({ isDark, setIsDark }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menu = useMemo(
    () => [
      { title: 'Features', url: '#features' },
      { title: 'Highlights', url: '#highlights' },
      { title: 'Testimonials', url: '#testimonials' },
      { title: 'Notices', url: '#notices' },
    ],
    []
  );

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-slate-200 bg-white/85 py-3 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85'
          : 'bg-transparent py-5'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-lg leading-tight font-semibold tracking-tight text-[#0a192f] dark:text-white">BSNP Portal</span>
              <span className="text-[9px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">Official Patasanstha</span>
            </div>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            {menu.map((item) => (
              <a
                key={item.title}
                href={item.url}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0a192f] dark:text-slate-300 dark:hover:text-white"
              >
                {item.title}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Button variant="ghost" size="icon" onClick={() => setIsDark((prev) => !prev)} className="rounded-[12px]" aria-label="Toggle theme">
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Link href="/admin/login">
              <Button className="rounded-[12px] px-6">Secure Login</Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsDark((prev) => !prev)} className="rounded-[12px]" aria-label="Toggle theme">
              {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-[12px] text-slate-900 dark:text-white"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
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
              onClick={closeMobileMenu}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed top-0 right-0 z-50 flex h-full w-[84%] max-w-sm flex-col border-l border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">BSNP Portal</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMobileMenu}
                  className="rounded-[12px] text-slate-500 dark:text-slate-400"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </Button>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                {menu.map((item) => (
                  <a
                    key={item.title}
                    href={item.url}
                    onClick={closeMobileMenu}
                    className="rounded-[12px] px-4 py-4 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    {item.title}
                  </a>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                <Link href="/admin/login" onClick={closeMobileMenu}>
                  <Button className="h-12 w-full rounded-[12px]">Secure Login</Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

type HeroSectionProps = {
  isDark: boolean;
};

const HeroSection = ({ isDark }: HeroSectionProps) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: 'easeOut',
      },
    },
  };

  return (
    <BeamsBackground className="pt-32 pb-20 md:pt-44 md:pb-28" intensity={isDark ? 'medium' : 'subtle'}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex min-h-[500px] flex-col items-center justify-center px-4 text-center"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <Badge variant="outline" className="border-slate-300 bg-white/60 font-medium text-[#0a192f] shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-blue-400">
            <Shield size={14} className="mr-2" />
            100% Secure & MCS Act Compliant
          </Badge>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="mb-6 max-w-5xl text-4xl leading-[1.05] font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-7xl"
        >
          Babarwadi Snehbandh
          <br />
          <span className="bg-gradient-to-r from-[#0a192f] to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-600">
            Nokardaranchi
          </span>{' '}
          Patasanstha
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mb-8 max-w-2xl text-base font-medium tracking-tight text-slate-600 dark:text-slate-400 md:text-xl"
        >
          Official digital gateway for management. Manage deposits, track loans, and stay updated securely with a clean and modern cooperative banking experience.
        </motion.p>

        <motion.div variants={itemVariants} className="flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row">
          <Link href="/admin/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2 sm:w-auto">
              Admin Login
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sanchalak/login" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full bg-white/50 backdrop-blur-sm dark:bg-slate-900/50 sm:w-auto">
              <Users size={16} className="mr-2" />
              Sanchalak Login
            </Button>
          </Link>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-3 sm:gap-6"
        >
          <div className="rounded-[16px] border border-white/60 bg-white/55 p-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50">
            <div className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">1,250+</div>
            <div className="mt-1 font-medium">Active Members</div>
          </div>
          <div className="rounded-[16px] border border-white/60 bg-white/55 p-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50">
            <div className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">12.5%</div>
            <div className="mt-1 font-medium">Annual Growth</div>
          </div>
          <div className="rounded-[16px] border border-white/60 bg-white/55 p-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50">
            <div className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">10k+</div>
            <div className="mt-1 font-medium">Trusted Members</div>
          </div>
        </motion.div>
      </motion.div>
    </BeamsBackground>
  );
};

const FeaturesCards = () => {
  const features: Array<{
    title: string;
    description: string;
    icon: ReactNode;
  }> = [
    {
      title: 'Manage Deposits',
      description: 'Open or renew RD, FD, and term deposits. Download statements and check balances instantly.',
      icon: <CreditCard className="h-8 w-8 text-[#0a192f] dark:text-white" strokeWidth={1.5} />,
    },
    {
      title: 'Loan Services',
      description: 'Check loan eligibility, apply online, track your application status, and view EMI schedules.',
      icon: <Landmark className="h-8 w-8 text-[#0a192f] dark:text-white" strokeWidth={1.5} />,
    },
    {
      title: 'Official Notices',
      description: 'Access AGM and EGM notices, board circulars, meeting minutes, and policy updates centrally.',
      icon: <Bell className="h-8 w-8 text-[#0a192f] dark:text-white" strokeWidth={1.5} />,
    },
    {
      title: 'Statements & Reports',
      description: 'Download digital passbook copies, deposit receipts, and annual dividend statements.',
      icon: <FileText className="h-8 w-8 text-[#0a192f] dark:text-white" strokeWidth={1.5} />,
    },
    {
      title: 'Bank-Grade Security',
      description: 'Your financial data is protected and accessible only via strict role-based verified permissions.',
      icon: <LockIcon className="h-8 w-8 text-[#0a192f] dark:text-white" strokeWidth={1.5} />,
    },
    {
      title: 'Helpdesk & Support',
      description: 'Submit complaints, suggestions, or queries and track their resolution status in real time.',
      icon: <HelpCircle className="h-8 w-8 text-[#0a192f] dark:text-white" strokeWidth={1.5} />,
    },
  ];

  const getShaderConfig = (index: number): WarpProps => {
    const configs: WarpProps[] = [
      { colors: ['#dbeafe', '#bfdbfe', '#e0e7ff', '#f3e8ff'] },
      { colors: ['#e0f2fe', '#bae6fd', '#f1f5f9', '#e2e8f0'] },
      { colors: ['#f1f5f9', '#e2e8f0', '#dbeafe', '#f8fafc'] },
      { colors: ['#e0e7ff', '#dbeafe', '#f1f5f9', '#e0f2fe'] },
      { colors: ['#f3e8ff', '#e0e7ff', '#e2e8f0', '#dbeafe'] },
      { colors: ['#bae6fd', '#e0f2fe', '#f3e8ff', '#f1f5f9'] },
    ];

    return configs[index % configs.length];
  };

  return (
    <section className="bg-white px-4 py-24 dark:bg-slate-950" id="features">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <Badge variant="outline" className="mb-4">
            Core Capabilities
          </Badge>
          <h2 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-5xl">Digital Banking Capabilities</h2>
          <p className="mx-auto max-w-2xl text-lg font-medium tracking-tight text-slate-600 dark:text-slate-400">
            Fast, organized, and transparent digital services tailored for all our society members.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const shaderConfig = getShaderConfig(index);

            return (
              <div key={feature.title} className="group relative h-80">
                <div className="absolute inset-0 overflow-hidden rounded-[16px] bg-slate-50 opacity-40 dark:bg-slate-900 dark:opacity-20">
                  <Warp colors={shaderConfig.colors} />
                </div>
                <div className="relative z-10 flex h-full flex-col rounded-[16px] border border-slate-200 bg-white/75 p-8 backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-white/90 dark:border-slate-800 dark:bg-slate-900/65 dark:group-hover:bg-slate-900/90">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[14px] bg-white/80 shadow-sm dark:bg-slate-950/60">
                    {feature.icon}
                  </div>
                  <h3 className="mb-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="flex-grow text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-400">{feature.description}</p>
                  <div className="mt-6 flex items-center text-sm font-semibold text-[#0a192f] transition-opacity dark:text-blue-400">
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

const CoreValuesSection = () => {
  return (
    <section className="border-t border-slate-200 bg-slate-50 py-24 dark:border-slate-800 dark:bg-slate-900" id="highlights">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <Badge variant="outline" className="mb-4">
            Why Choose Us
          </Badge>
          <h2 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-5xl">Excellence in Cooperative Banking</h2>
          <p className="mx-auto max-w-2xl text-lg font-medium tracking-tight text-slate-600 dark:text-slate-400">
            Built on a foundation of trust, technology, and transparency, ensuring the highest standards of financial management for our members.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="flex flex-col items-center border-slate-200 bg-white p-8 text-center transition-transform duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[14px] bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <ShieldCheck size={28} />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Absolute Security</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Military-grade encryption protecting your assets and personal data around the clock.</p>
          </Card>

          <Card className="flex flex-col items-center border-slate-200 bg-white p-8 text-center transition-transform duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <LineChart size={28} />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Consistent Growth</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Competitive interest rates and strong dividend history ensuring wealth multiplication.</p>
          </Card>

          <Card className="flex flex-col items-center border-slate-200 bg-white p-8 text-center transition-transform duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[14px] bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Scale size={28} />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Complete Transparency</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Clear policies, immediate access to reports, and compliant operations throughout the system.</p>
          </Card>

          <Card className="flex flex-col items-center border-slate-200 bg-white p-8 text-center transition-transform duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-[14px] bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Briefcase size={28} />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">Expert Management</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Governed by experienced professionals dedicated to the collective success of every member.</p>
          </Card>
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  return (
    <section className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950 md:py-32" id="testimonials">
      <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
          <Badge variant="outline" className="mb-6">
            Member Stories
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white lg:text-5xl">Trusted by Thousands of Members</h2>
          <p className="font-medium text-slate-600 dark:text-slate-400">See what our society members have to say about their seamless digital banking experience with BSNP.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-rows-2">
          <Card className="grid grid-rows-[auto_1fr] gap-8 rounded-[16px] border-slate-200 bg-slate-50 shadow-sm sm:col-span-2 dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:row-span-2">
            <CardHeader>
              <Landmark className="size-8 text-[#0a192f] dark:text-white" />
            </CardHeader>
            <CardContent>
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p className="text-xl font-medium text-slate-900 dark:text-white">
                  BSNP&apos;s digital portal has transformed how I manage my deposits. The interface is seamless, and the transparency is unmatched. A true game-changer for cooperative societies.
                </p>
                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src="https://i.pravatar.cc/150?u=1" alt="Ramesh Patil" loading="lazy" />
                    <AvatarFallback>RP</AvatarFallback>
                  </Avatar>
                  <div>
                    <cite className="not-italic text-sm font-semibold text-slate-900 dark:text-white">Ramesh Patil</cite>
                    <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">Senior Teacher</span>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>

          <Card className="rounded-[16px] border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 md:col-span-2">
            <CardContent className="h-full pt-6">
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p className="text-lg font-medium text-slate-900 dark:text-white">
                  Applying for a loan used to be a hassle. With the new system, I tracked my application online and got approved in days without visiting the branch.
                </p>
                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src="https://i.pravatar.cc/150?u=2" alt="Sunita Kadam" loading="lazy" />
                    <AvatarFallback>SK</AvatarFallback>
                  </Avatar>
                  <div>
                    <cite className="not-italic text-sm font-semibold text-slate-900 dark:text-white">Sunita Kadam</cite>
                    <span className="block text-sm font-medium text-slate-500 dark:text-slate-400">School Principal</span>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>

          <Card className="rounded-[16px] border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <CardContent className="h-full pt-6">
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  The best digital initiative by any Patasanstha. Accessing dividend reports and AGM notices has become very easy now.
                </p>
                <div className="grid items-center gap-3 [grid-template-columns:auto_1fr]">
                  <Avatar className="size-12">
                    <AvatarImage src="https://i.pravatar.cc/150?u=3" alt="Vijay Deshmukh" loading="lazy" />
                    <AvatarFallback>VD</AvatarFallback>
                  </Avatar>
                  <div>
                    <cite className="not-italic text-sm font-semibold text-slate-900 dark:text-white">Vijay Deshmukh</cite>
                    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Society Member</span>
                  </div>
                </div>
              </blockquote>
            </CardContent>
          </Card>

          <Card className="rounded-[16px] border-none bg-[#0a192f] text-white shadow-sm dark:bg-blue-900">
            <CardContent className="h-full pt-6">
              <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                <p className="text-sm font-medium text-slate-100">
                  Secure, fast, and incredibly user-friendly. BSNP has truly stepped into the modern era of banking.
                </p>
                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src="https://i.pravatar.cc/150?u=4" alt="Anjali More" loading="lazy" />
                    <AvatarFallback className="bg-slate-800 text-white">AM</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-white">Anjali More</p>
                    <span className="block text-xs font-medium text-slate-300">Professor</span>
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

const NoticesSection = () => {
  const notices = [
    {
      title: 'Annual General Meeting Notice',
      description: 'Review the latest AGM schedule, agenda summary, and official member communication updates.',
    },
    {
      title: 'Board Circulars & Resolutions',
      description: 'Stay updated with policy revisions, board approvals, and society-level operational notices.',
    },
    {
      title: 'Scheme & Interest Updates',
      description: 'Track important changes related to deposit schemes, loan offerings, and announced rates.',
    },
  ];

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-24 dark:border-slate-800 dark:bg-slate-900" id="notices">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <Badge variant="outline" className="mb-4">
            Notices
          </Badge>
          <h2 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-5xl">Important Updates & Announcements</h2>
          <p className="mx-auto max-w-2xl text-lg font-medium tracking-tight text-slate-600 dark:text-slate-400">
            Important circulars, board updates, and society notices available in one organized place.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {notices.map((notice) => (
            <Card key={notice.title} className="rounded-[16px] border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Bell size={22} />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-slate-900 dark:text-white">{notice.title}</h3>
              <p className="mb-6 text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-400">{notice.description}</p>
              <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a192f] dark:text-blue-400">
                View details <ChevronRight size={16} />
              </button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  const footerLinks: Array<{
    title: string;
    links: Array<{ href: string; label: string }>;
  }> = [
    {
      title: 'Organization',
      links: [
        { href: '#', label: 'About BSNP' },
        { href: '#', label: 'Board of Directors' },
        { href: '#', label: 'Annual Reports' },
        { href: '#', label: 'Careers' },
        { href: '#', label: 'Contact Us' },
      ],
    },
    {
      title: 'Services',
      links: [
        { href: '#', label: 'Deposit Schemes' },
        { href: '#', label: 'Loan Products' },
        { href: '#', label: 'Interest Rates' },
        { href: '#', label: 'Member Forms' },
        { href: '#', label: 'Dividend History' },
      ],
    },
    {
      title: 'Support',
      links: [
        { href: '#', label: 'Help Center' },
        { href: '#', label: 'FAQs' },
        { href: '#', label: 'Grievance Redressal' },
        { href: '#', label: 'Branch Locator' },
        { href: '#', label: 'Download App' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { href: '#', label: 'Terms & Conditions' },
        { href: '#', label: 'Privacy Policy' },
        { href: '#', label: 'MCS Act Guidelines' },
        { href: '#', label: 'Audit Reports' },
        { href: '#', label: 'Cyber Security Tips' },
      ],
    },
  ];

  const socialLinks: Array<{ icon: React.ComponentType<SVGProps<SVGSVGElement>>; href: string }> = [
    { icon: FacebookIcon, href: '#' },
    { icon: InstagramIcon, href: '#' },
    { icon: LinkedinIcon, href: '#' },
    { icon: TwitterIcon, href: '#' },
  ];

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 py-16 md:grid-cols-4">
          {footerLinks.map((item) => (
            <div key={item.title}>
              <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white">{item.title}</h3>
              <ul className="space-y-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                {item.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="tracking-tight transition-colors hover:text-[#0a192f] dark:hover:text-white">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="h-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex flex-col items-center justify-center gap-6 py-8">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="mr-0 flex items-center gap-2 border-r-0 border-slate-200 pr-0 dark:border-slate-800 lg:mr-6 lg:border-r lg:pr-6">
              {socialLinks.map(({ icon: Icon, href }, i) => (
                <a
                  href={href}
                  className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                  key={i}
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
            <div className="flex gap-3">{false ? <PlayStoreBtn /> : null}</div>
          </div>
        </div>

        <div className="h-px bg-slate-200 dark:bg-slate-800" />

        <div className="flex flex-col items-center justify-between gap-4 py-6 text-center text-xs font-medium tracking-tight text-slate-500 dark:text-slate-400 md:flex-row">
          <p>© {new Date().getFullYear()} Babarwadi Snehbandh Nokardaranchi Patasanstha. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <Shield size={12} /> Secure Connection
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp size={12} /> Ver. 2.1.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('bsnp-theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      window.localStorage.setItem('bsnp-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      window.localStorage.setItem('bsnp-theme', 'light');
    }
  }, [isDark]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
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
        html {
          scroll-behavior: smooth;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          background-color: #f8fafc;
          color: #0f172a;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        html.dark body {
          background-color: #020617;
          color: #f8fafc;
        }
      `,
        }}
      />
      <div className="min-h-screen selection:bg-slate-200 selection:text-slate-900 dark:selection:bg-blue-900/50 dark:selection:text-white">
        <Navbar isDark={isDark} setIsDark={setIsDark} />
        <main>
          <HeroSection isDark={isDark} />
          <FeaturesCards />
          <CoreValuesSection />
          <TestimonialsSection />
          <NoticesSection />
          {false ? (
            <ContainerScroll
              titleComponent={
                <div>
                  <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Preview</h2>
                </div>
              }
            >
              <div className="flex h-full items-center justify-center">
                <AppleIcon className="h-16 w-16 text-slate-500" />
              </div>
            </ContainerScroll>
          ) : null}
        </main>
        <Footer />
      </div>
    </>
  );
}