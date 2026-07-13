'use client';

import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

interface LiveChartProps {
  data: Float32Array; // Format: [timestamp, x, y, z, timestamp, x, y, z...]
  channels: number;
}

export function LiveChart({ data, channels }: LiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<uPlot | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Series definitions
    const series = [
      {}, // x-axis
      { stroke: '#ef4444', label: 'Acc X' }, // Red
      { stroke: '#22c55e', label: 'Acc Y' }, // Green
      { stroke: '#3b82f6', label: 'Acc Z' }, // Blue
    ];

    const opts: uPlot.Options = {
      width: containerRef.current.clientWidth,
      height: 300,
      title: 'Real-time Sensor Data',
      series: series.slice(0, channels + 1),
      axes: [
        { grid: { stroke: 'rgba(0,0,0,0.1)' }, stroke: '#64748b' },
        { grid: { stroke: 'rgba(0,0,0,0.1)' }, stroke: '#64748b' }
      ],
    };

    // Initial empty data
    const initialData: number[][] = Array.from({ length: channels + 1 }, () => []);
    
    plotRef.current = new uPlot(opts, initialData as any, containerRef.current);

    return () => {
      plotRef.current?.destroy();
    };
  }, [channels]);

  // Update data when props change
  useEffect(() => {
    if (!plotRef.current || data.length === 0) return;

    // Format data for uPlot
    // data is flat array, we need array of arrays
    const pointCount = data.length / (channels + 1);
    const plotData: number[][] = Array.from({ length: channels + 1 }, () => new Array(pointCount));
    
    for (let i = 0; i < pointCount; i++) {
      const offset = i * (channels + 1);
      plotData[0]![i] = data[offset]!; // Timestamp
      
      for (let ch = 0; ch < channels; ch++) {
        plotData[ch + 1]![i] = data[offset + 1 + ch]!;
      }
    }

    plotRef.current.setData(plotData as any);
  }, [data, channels]);

  return <div ref={containerRef} className="w-full h-full" />;
}
