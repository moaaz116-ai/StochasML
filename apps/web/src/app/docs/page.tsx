'use client';

import Link from 'next/link';
import { Cpu, ArrowLeft, BookOpen, Database, BrainCircuit, ShieldAlert, Cpu as CpuIcon, Play, Phone, Mail } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500/30 font-sans">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/Logo1.png" alt="Stochas ML Logo" className="h-8 w-8 rounded object-contain" />
            <span className="text-xl font-bold text-slate-900 tracking-tight font-serif">Stochas ML</span>
          </Link>
          <Link href="/projects">
            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-500 shadow-md">
              Open Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 font-serif">Documentation</h1>
          </div>
          <p className="text-lg text-slate-500">Learn how Stochas ML processes data, trains neural networks, and generates C++ firmware for the edge.</p>
        </div>

        <div className="space-y-12">
          {/* Section 1: Overview */}
          <section id="overview" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-950 mb-4 border-b border-slate-200 pb-2">1. Platform Overview</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Stochas ML is an open-source TinyML platform designed to enable developers to collect data, train classification models, and deploy them to low-power microcontrollers such as the <strong>ESP32-S3</strong>. It provides two execution flows: a fast <strong>Demo Mode</strong> for UI simulation and a <strong>Production Mode</strong> powered by TensorFlow and TensorFlow Lite Micro.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="p-5 border border-slate-200 bg-white shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Play className="w-4 h-4 text-amber-500" /> Demo Mode
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Allows instant testing of the entire user flow. No heavy machine learning installations are required. Data streaming and model evaluations are simulated dynamically.
                </p>
              </Card>
              <Card className="p-5 border border-slate-200 bg-white shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <CpuIcon className="w-4 h-4 text-emerald-500" /> Production Mode
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Executes actual TensorFlow compilation and training runs, performs representative calibration datasets, and converts models to INT8 Flatbuffers for deployment.
                </p>
              </Card>
            </div>
          </section>

          {/* Section 2: Data Collection */}
          <section id="data-collection" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-950 mb-4 border-b border-slate-200 pb-2">2. Data Collection & Web Serial</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Stochas ML integrates directly with microcontroller serial outputs using the browser-native <strong>Web Serial API</strong>. You can plug in your device, specify your target label (e.g. <code>idle</code> or <code>active</code>), and stream sensor data.
            </p>
            <div className="bg-slate-100 rounded-lg p-5 border border-slate-200 font-mono text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-slate-900">// Expected Serial stream output format (CSV or JSON lines):</p>
              <p>1.24,-0.45,9.81</p>
              <p>1.31,-0.42,9.79</p>
              <p>{"{\"ax\": 1.15, \"ay\": -0.52, \"az\": 9.85}"}</p>
            </div>
            <p className="text-sm text-slate-500 mt-3">
              If physical hardware is unavailable, the <strong>Simulate Device</strong> option streams simulated multi-axis sine waves directly to verify the pipeline.
            </p>
          </section>

          {/* Section 3: Training & Quantization */}
          <section id="training" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-950 mb-4 border-b border-slate-200 pb-2">3. Training & Quantization</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              When training starts, Stochas ML leverages standard model architectures (such as Dense Neural Networks or 1D-CNNs) configured in the UI. 
            </p>
            <h3 className="font-semibold text-slate-900 mb-2">Post-Training Quantization (PTQ)</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Microcontrollers lack hardware floating-point units (FPUs) or have extremely limited storage. To address this, Stochas ML applies <strong>INT8 Post-Training Quantization</strong>. It converts the 32-bit floating-point weights to 8-bit integers, yielding a <strong>~4x reduction in size</strong> with negligible accuracy degradation.
            </p>
          </section>

          {/* Section 4: Codegen & PlatformIO */}
          <section id="deployment" className="scroll-mt-20">
            <h2 className="text-2xl font-bold text-slate-950 mb-4 border-b border-slate-200 pb-2">4. Code Generation & Deployment</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Upon successful compilation, clicking <strong>Deploy</strong> packages the model into a downloadable zip file ready for compilation in C++ workspaces.
            </p>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
                  <span className="text-xs font-bold text-blue-600">H</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-0.5">model.h</h4>
                  <p className="text-xs text-slate-600">Contains the quantized model flatbuffer represented as a C-style static byte array ready for inclusion in main code.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
                  <span className="text-xs font-bold text-blue-600">CPP</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-0.5">main.cpp</h4>
                  <p className="text-xs text-slate-600">A pre-configured template using TensorFlow Lite Micro APIs to load the tensor arena, configure inputs/outputs, and run continuous inference.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Documentation Contact & Support Bar */}
        <footer className="mt-16 border-t border-slate-200 pt-8 pb-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Stochas ML</span>
            <span>&bull;</span>
            <span>Lead Developer: Moaz Abdellatif</span>
          </div>
          <div className="flex items-center gap-5 font-mono">
            <a href="tel:+201096264652" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              +201096264652
            </a>
            <a href="mailto:moaz.abdellatif2009@gmail.com" className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              moaz.abdellatif2009@gmail.com
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
