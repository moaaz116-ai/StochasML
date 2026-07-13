"use client";

import { useState } from "react";
import {
  Activity,
  Microscope,
  Cpu,
  ArrowRight,
  Globe,
  Leaf,
  Settings2,
  LineChart,
  Code2,
  Phone,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores/toast-store";

const methodology = [
  {
    icon: Activity,
    title: "Data Ingestion & DSP",
    description: "Direct sensor streaming via WebSerial with real-time Digital Signal Processing (DSP) pipelines for feature extraction.",
  },
  {
    icon: Microscope,
    title: "Neural Architecture Search",
    description: "Automated ML with pre-built topologies (Dense, 1D CNNs) specifically tailored for extreme embedded system constraints.",
  },
  {
    icon: Settings2,
    title: "Post-Training Quantization",
    description: "Near-lossless FP32 to INT8 weight conversion, achieving 4x memory reduction to fit on devices with < 500KB SRAM.",
  },
  {
    icon: Code2,
    title: "C++ Code Generation",
    description: "Instant cross-compilation of TensorFlow Lite Micro models into deployable C++ firmware binaries.",
  },
];

const impact = [
  { label: "Memory Footprint", value: "< 50 KB" },
  { label: "Inference Latency", value: "< 5 ms" },
  { label: "Power Draw", value: "~100 mW" },
  { label: "Model Modalities", value: "3+" },
];

const navLinks = [
  { label: "Methodology", href: "#methodology" },
  { label: "Documentation", href: "/docs" },
  { label: "Contact Us", href: "#contact" },
  { label: "GitHub Repository", href: "https://github.com/infera", external: true },
];

export default function LandingPage() {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText("+201096264652");
    setCopiedPhone(true);
    toast.success("Phone number copied to clipboard!");
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("moaz.abdellatif2009@gmail.com");
    setCopiedEmail(true);
    toast.success("Email address copied to clipboard!");
    setTimeout(() => setCopiedEmail(false), 2500);
  };
  return (
    <div className="relative min-h-screen liquid-canvas text-slate-100 overflow-hidden selection:bg-blue-500/30">
      {/* ── Ambient liquid lighting blobs ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl transform-gpu" />
        <div className="absolute -right-40 top-60 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-3xl transform-gpu" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl transform-gpu" />
      </div>

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0d1222]/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img 
              src="/Logo1.png" 
              alt="Stochas ML Logo" 
              className="h-9 w-9 rounded-lg object-contain drop-shadow-[0_0_12px_rgba(59,130,246,0.4)] transition-transform duration-300 group-hover:scale-105" 
            />
            <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
              Stochas ML
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <Link href="/dashboard">
            <Button
              variant="primary"
              size="sm"
              className="shadow-lg"
            >
              Access Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-44 pb-28 text-center">
        {/* Badge */}
        <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/15 px-4 py-1.5 text-sm text-blue-200 backdrop-blur-md shadow-sm">
          <Microscope className="h-4 w-4 text-blue-400" />
          <span className="font-semibold tracking-wide uppercase text-xs">Applied Edge AI & Research Platform</span>
        </div>

        {/* Title */}
        <h1 className="animate-fade-in-up mb-6 text-6xl font-extrabold tracking-tight text-white md:text-7xl font-serif">
          Stochas ML
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up mb-6 text-2xl font-light tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-cyan-100 to-slate-300 md:text-3xl font-serif">
          Applied TinyML for Extreme Embedded Edge Intelligence
        </p>

        {/* Tagline */}
        <p className="animate-fade-in-up mx-auto mb-12 max-w-3xl text-lg leading-relaxed text-slate-300">
          An end-to-end, open-source platform for training, quantizing, and deploying neural networks directly onto microcontrollers with ultra-low latency and minimal memory footprint.
        </p>

        {/* CTA buttons */}
        <div className="animate-fade-in-up flex flex-col items-center gap-4 sm:flex-row">
          <Link href="/dashboard">
            <Button
              variant="primary"
              size="lg"
              className="px-8 shadow-xl"
            >
              Explore the Platform
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="#methodology">
            <Button
              variant="secondary"
              size="lg"
              className="px-8"
            >
              Read Methodology
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Methodology Cards ── */}
      <section id="methodology" className="relative z-10 mx-auto max-w-7xl px-6 py-24 border-t border-white/10">
        <div className="mb-16 text-center">
          <h2 className="animate-fade-in-up mb-4 text-3xl font-extrabold text-white">
            Research Methodology
          </h2>
          <p className="animate-fade-in-up text-slate-300 max-w-2xl mx-auto">
            A systematic architecture for compressing deep learning models for execution on microcontrollers with less than 500KB of SRAM.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {methodology.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="animate-fade-in-up group rounded-2xl liquid-glass p-7 transition-all duration-300 hover:liquid-glass-interactive"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-blue-500/15 p-3.5 border border-blue-500/30">
                  <Icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="mb-3 font-bold text-white text-lg">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Real-world Impact ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-24 border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="mb-6 text-3xl font-extrabold text-white">Applied Real-World Impact</h2>
            <p className="text-slate-300 leading-relaxed mb-8">
              By moving intelligence to the sensor edge, Stochas ML eliminates the need for continuous cloud connectivity, reducing latency to milliseconds while ensuring total data privacy.
            </p>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                  <Leaf className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Sustainable Agriculture</h4>
                  <p className="text-sm text-slate-300">Low-power acoustic monitoring of crop health and pest detection running autonomously on solar microcontrollers.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30">
                  <Globe className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Assistive Wearables</h4>
                  <p className="text-sm text-slate-300">Privacy-first gesture recognition and real-time motion kinematics for wearable assistive medical devices.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30">
                  <LineChart className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Predictive Industrial Maintenance</h4>
                  <p className="text-sm text-slate-300">High-frequency vibration telemetry analysis on factory machinery to detect mechanical defects before failure.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* ── Stats Bar ── */}
          <div className="rounded-3xl liquid-glass p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-8 border-b border-white/10 pb-4">Target Performance Benchmarks</h3>
            <div className="grid grid-cols-2 gap-8">
              {impact.map((stat) => (
                <div key={stat.label} className="text-left">
                  <p className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-slate-300 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center border-t border-white/10">
        <div className="animate-fade-in-up">
          <h2 className="mb-6 text-4xl font-extrabold text-white md:text-5xl font-serif">
            Ready to Build Edge Intelligence?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-base text-slate-300">
            Access the dashboard to record telemetry datasets, train neural network architectures, and generate optimized C++ firmware binaries.
          </p>
          <Link href="/dashboard">
            <Button
              variant="primary"
              size="lg"
              className="px-10 shadow-xl"
            >
              <Activity className="mr-2 h-4 w-4" />
              Launch Dashboard
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer with Contact Us at the Very Bottom ── */}
      <footer id="contact" className="relative z-10 border-t border-white/10 bg-[#080c16]/95 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-2 space-y-3">
              <Link href="/" className="flex items-center gap-2.5">
                <img src="/Logo1.png" alt="Stochas ML Logo" className="h-8 w-8 rounded-lg object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.35)]" />
                <span className="text-xl font-extrabold tracking-tight font-serif bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
                  Stochas ML
                </span>
              </Link>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                End-to-end open-source platform for training, quantizing, and deploying neural networks directly onto extreme embedded edge microcontrollers.
              </p>
            </div>

            {/* Quick Links Column */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform Links</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Dashboard Overview
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#methodology" className="hover:text-white transition-colors">
                    Research Methodology
                  </Link>
                </li>
                <li>
                  <a href="https://github.com/infera" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Us at the Very Bottom Column */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Contact Us</h4>
              <p className="text-xs font-semibold text-slate-300">
                Moaz Abdellatif <span className="text-slate-500 font-normal">(&bull; Lead Developer)</span>
              </p>
              
              {/* Phone item with copy */}
              <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                <a href="tel:+201096264652" className="flex items-center gap-2 hover:text-blue-400 transition-colors font-mono text-xs text-white">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  +201096264652
                </a>
                <button
                  onClick={handleCopyPhone}
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Copy Phone Number"
                >
                  {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Email item with copy */}
              <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                <a href="mailto:moaz.abdellatif2009@gmail.com" className="flex items-center gap-2 hover:text-blue-400 transition-colors font-mono text-xs text-white truncate max-w-[190px]">
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  moaz.abdellatif2009@gmail.com
                </a>
                <button
                  onClick={handleCopyEmail}
                  className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
                  title="Copy Email Address"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>
              &copy; {new Date().getFullYear()} Stochas ML &bull; Engineered by Moaz Abdellatif &bull; All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span>Apache-2.0 License</span>
              <span>&bull;</span>
              <a href="mailto:moaz.abdellatif2009@gmail.com" className="hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
