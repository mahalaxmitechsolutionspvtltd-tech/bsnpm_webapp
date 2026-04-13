"use client"
import React, { useState, useEffect } from 'react';

import {
  Shield, Users, FileText, PieChart, HelpCircle,
  ArrowRight, Mail, Clock, Menu, CreditCard, Bell,
  CheckCircle2, Landmark,
  LockIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Services', href: '#services' },
    { name: 'Notices', href: '#notices' },
    { name: 'Help', href: '#help' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-white/20 py-3 shadow-sm' : 'bg-white/60 backdrop-blur-md py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* Logo Section */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-12 h-12 bg-blue-800 rounded-xl flex items-center justify-center text-white shadow-md">
              <Landmark size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl text-slate-900 leading-tight tracking-tight">BSNP Portal</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-800">Official Patasanstha</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-800 hover:text-blue-800 hover:bg-white/50 transition-all"
              >
                {link.name}
              </a>
            ))}
            <div className="w-px h-6 bg-slate-300 mx-2"></div>
            <Link href="/login">
              <Button className="rounded-xl bg-blue-800 hover:bg-blue-900 text-white shadow-md px-6">
                Secure Login
              </Button>
            </Link>
          </div>

          {/* Mobile Nav (Shadcn Sheet) */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl bg-white/50">
                  <Menu size={24} className="text-slate-900" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-75 sm:w-100 bg-white/95 backdrop-blur-xl">
                <SheetTitle className="text-left mb-6 font-extrabold text-blue-800">Menu</SheetTitle>
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-700 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                    >
                      {link.name}
                    </a>
                  ))}
                  <div className="pt-4 mt-4 border-t border-slate-200">
                    <Button className="w-full rounded-xl bg-blue-800 hover:bg-blue-900 shadow-md h-12 text-base">
                      Login to Portal
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Reusable Shadcn Feature Card
const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <Card className="rounded-xl shadow-sm hover:shadow-lg transition-all border-white/40 bg-white/80 backdrop-blur-sm group hover:-translate-y-1 duration-300">
    <CardHeader>
      <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-xl flex items-center justify-center mb-2 border border-blue-200 group-hover:bg-blue-800 group-hover:text-white transition-colors duration-300 shadow-sm">
        {/* <Icon size={24} /> */}
      </div>
      <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription className="text-slate-700 text-sm leading-relaxed font-medium">{description}</CardDescription>
    </CardContent>
  </Card>
);

// Reusable Shadcn Role Card
const RoleCard = ({ role, description, icon: Icon, isPrimary = false }: { role: string, description: string, icon: any, isPrimary?: boolean }) => (
  <Card className={`rounded-xl shadow-lg hover:shadow-2xl transition-all cursor-pointer border ${isPrimary ? 'bg-blue-800/95 backdrop-blur-md text-white border-blue-700' : 'bg-white/90 backdrop-blur-md text-slate-900 border-white/50'}`}>
    <CardHeader className="flex flex-row items-center gap-4 pb-2">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ${isPrimary ? 'bg-white/20' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
        <Icon size={28} />
      </div>
      <div>
        <CardTitle className="text-xl font-extrabold">{role}</CardTitle>
        <CardDescription className={`text-sm font-medium ${isPrimary ? 'text-blue-100' : 'text-slate-600'}`}>
          {description}
        </CardDescription>
      </div>
    </CardHeader>
    <CardFooter className="pt-4">
      <Button
        variant={isPrimary ? "secondary" : "outline"}
        className={`w-full rounded-xl gap-2 font-bold ${isPrimary ? 'bg-white text-blue-800 hover:bg-slate-100' : 'bg-white/50 hover:bg-blue-50 hover:text-blue-800 border-blue-200/50'}`}
      >
        Proceed <ArrowRight size={16} />
      </Button>
    </CardFooter>
  </Card>
);

export default function App() {
  return (
    // Added Rimuru Background Image Here (Ensure rimuru.jpg is in your /public folder)
    <div className="min-h-screen font-sans selection:bg-blue-200 selection:text-blue-900 relative">

      {/* Fixed Background Image Layer */}
      <div className="fixed inset-0 z-[-1] bg-[url('/rimuru.jpg')] bg-cover bg-center bg-no-repeat"></div>

      {/* Light Overlay to ensure text readability over the anime background */}
      <div className="fixed inset-0 z-[-1] bg-slate-50/40 backdrop-blur-[2px]"></div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-white/60 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left Content */}
            <div className="text-left relative z-10">
              <Badge variant="secondary" className="rounded-xl px-4 py-1.5 bg-blue-100/80 backdrop-blur-sm text-blue-800 border border-blue-200 text-xs font-bold mb-6 hover:bg-blue-200">
                <Shield size={14} className="mr-2 text-blue-700" />
                100% Secure & MCS Act Compliant
              </Badge>

              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-[1.15]">
                Babarwadi Snehbandh <br />
                <span className="text-blue-800 drop-shadow-sm">Nokardaranchi</span> <br />
                Patasanstha
              </h1>

              <p className="text-base md:text-xl text-slate-800 mb-8 leading-relaxed max-w-lg font-bold drop-shadow-sm">
                Official digital gateway for management. Manage deposits, track loans, and stay updated securely.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href={'/admin/login'} className="w-full my-auto sm:w-auto rounded-xl bg-blue-800 hover:bg-blue-900 text-white shadow-lg py-3 px-10 text-base">
                  Admin Login
                </Link>
                <Link href={"/sanchalak/login"} className="w-full sm:w-auto rounded-xl border-2 border-white bg-white/50 backdrop-blur-sm hover:border-blue-800 hover:text-blue-800 hover:bg-white/80 px-10 py-3 text-base font-bold shadow-sm">
                  Sanchalak Login
                </Link>
              </div>
            </div>

            {/* Right Side Financial Dashboard Card */}
            <div className="hidden lg:block relative">
              <Card className="rounded-xl border-white/50 bg-white/80 backdrop-blur-md shadow-2xl relative z-10 overflow-hidden">
                <div className="h-2 bg-blue-800 w-full"></div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-800 border border-blue-200 shadow-sm">
                      <PieChart size={28} />
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-600 font-bold uppercase tracking-wider mb-1">Total Society Assets</p>
                      <p className="text-3xl font-black text-slate-900">₹78.2 Cr</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-bold text-slate-800">
                      <span>Deposit Growth (YTD)</span>
                      <Badge className="rounded-md bg-emerald-100 text-emerald-800 border-emerald-200">+12.5%</Badge>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '75%' }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                        className="h-full bg-blue-800 rounded-full"
                      ></motion.div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200/50">
                    <div className="bg-white/60 p-4 rounded-xl border border-white shadow-sm">
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-1">Audited Status</p>
                      <p className="text-base font-bold text-slate-900">Class 'A'</p>
                    </div>
                    <div className="bg-white/60 p-4 rounded-xl border border-white shadow-sm">
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mb-1">Members</p>
                      <p className="text-base font-bold text-slate-900">1,250+</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Access Section (Member Login Removed, Cards Centered) */}
      <section className="py-20 bg-slate-100/50 backdrop-blur-md relative" id="services">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="text-blue-800 font-extrabold uppercase tracking-widest text-xs mb-3 block">Secure Access Portal</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">System Logins</h2>
            <p className="text-slate-700 text-base max-w-lg mx-auto font-medium">Select your administrative role to securely access your personalized dashboard.</p>
          </div>

          {/* Changed to grid-cols-2 and centered the container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <RoleCard role="Sanchalak Login" description="Board & Operations" icon={Landmark} isPrimary />
            <RoleCard role="Admin Login" description="System Management" icon={Shield} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/70 backdrop-blur-lg border-t border-white/20" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Digital Banking Capabilities</h2>
              <p className="text-slate-800 text-lg font-medium">Fast, organized, and transparent digital services for all society members.</p>
            </div>
            <Button variant="outline" className="rounded-xl gap-2 font-bold shadow-sm h-12 px-6 bg-white/80">
              View All Modules <ArrowRight size={16} />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={CreditCard} title="Manage Deposits" description="Open or renew RD, FD, and Term Deposits. Download statements and check balances instantly." />
            <FeatureCard icon={ArrowRight} title="Loan Services" description="Check loan eligibility, apply online, track your application status, and view EMI schedules." />
            <FeatureCard icon={Bell} title="Official Notices" description="Access AGM/EGM notices, board circulars, meeting minutes, and policy updates centrally." />
            <FeatureCard icon={FileText} title="Statements & Reports" description="Download digital passbook copies, deposit receipts, and your annual dividend statements." />
            <FeatureCard icon={LockIcon} title="Bank-Grade Security" description="Your financial data is protected and accessible only via strict role-based verified permissions." />
            <FeatureCard icon={HelpCircle} title="Helpdesk & Support" description="Submit complaints, suggestions, or queries and track their resolution status in real-time." />
          </div>
        </div>
      </section>

      {/* Trust & Security Section (Kept Dark for Contrast) */}
      <section className="py-20 bg-slate-900/90 backdrop-blur-xl text-white shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight leading-tight">Institutional Grade <br /><span className="text-blue-400">Trust & Security</span></h2>
              <p className="text-lg mb-8 text-slate-300 leading-relaxed">
                As a registered Patasanstha, we combine years of cooperative trust with modern digital security standards to protect your hard-earned money.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {["End-to-End Encryption", "Strict Role-Based Access", "Regular Audit Logging", "MCS Act Compliant"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-blue-500" />
                    <span className="font-semibold text-base text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="rounded-xl bg-slate-800/80 backdrop-blur-md border-slate-700 text-white shadow-2xl">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30">
                    <Shield size={28} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-white">Data Protection</CardTitle>
                    <CardDescription className="text-slate-400 text-sm mt-1">256-bit SSL Encrypted System</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-base leading-relaxed">
                  Our core banking platform strictly controls access, ensuring that only authorized board members (Sanchalak), admins, and verified members can view sensitive financial records.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full rounded-xl bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 h-12 text-base font-bold shadow-sm">
                  Review Security Policy
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-xl pt-16 pb-8 border-t border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-800 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <Landmark size={20} />
                </div>
                <span className="font-black text-xl text-slate-900 tracking-tight">BSNP</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed mb-6 font-bold">
                A secure digital gateway for society services. Registered under Maharashtra Cooperative Societies Act.
              </p>
            </div>

            <div>
              <h4 className="text-slate-900 font-bold text-sm mb-6 uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-3 text-sm font-bold text-slate-700">
                <li><a href="#" className="hover:text-blue-800 transition-colors">Portal Modules</a></li>
                <li><a href="#" className="hover:text-blue-800 transition-colors">Admin Access</a></li>
                <li><a href="#" className="hover:text-blue-800 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-900 font-bold text-sm mb-6 uppercase tracking-wider">Contact</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-700">
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-blue-800" /> support@bsnp.org
                </li>
                <li className="flex items-center gap-3">
                  <Clock size={18} className="text-blue-800" /> Mon–Sat, 10:00 AM – 5:00 PM
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-slate-900 font-bold text-sm mb-6 uppercase tracking-wider">System Info</h4>
              <div className="flex flex-col gap-3">
                <Badge variant="outline" className="rounded-xl px-3 py-2 justify-center text-[11px] font-bold uppercase tracking-widest text-slate-700 bg-white/50 border-white">
                  Version 2.1.0
                </Badge>
                <Badge variant="outline" className="rounded-xl px-3 py-2 justify-center text-[11px] font-bold uppercase tracking-widest text-emerald-700 border-emerald-300 bg-emerald-100/80">
                  Secured Connection
                </Badge>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-300 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-bold text-slate-600">
            <p>© 2026 Babarwadi Snehbandh Nokardaranchi Patasanstha. All rights reserved.</p>
            <p>Official Society System</p>
          </div>
        </div>
      </footer>
    </div>
  );
}