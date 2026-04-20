/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface MapProps {
  density: number[];
}

export const StadiumMap: React.FC<MapProps> = ({ density }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;

    // Pitch
    svg.append("rect")
      .attr("x", centerX - 100)
      .attr("y", centerY - 150)
      .attr("width", 200)
      .attr("height", 300)
      .attr("fill", "transparent")
      .attr("stroke", "rgba(56, 189, 248, 0.3)")
      .attr("stroke-width", 2)
      .attr("rx", 4);

    // Seating sectors
    const sectors = 12;
    const innerRadius = 180;
    const outerRadius = 240;

    const arcGenerator = d3.arc<any, number>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .startAngle((_, i) => (i * 2 * Math.PI) / sectors)
      .endAngle((_, i) => ((i + 1) * 2 * Math.PI) / sectors)
      .padAngle(0.02);

    const colorScale = d3.scaleLinear<string>()
      .domain([0, 0.5, 1])
      .range(["rgba(255,255,255,0.05)", "#38bdf8", "#fb923c"]);

    svg.append("g")
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .selectAll("path")
      .data(density)
      .enter()
      .append("path")
      .attr("d", (d, i) => arcGenerator(i))
      .attr("fill", d => colorScale(d))
      .attr("stroke", "rgba(255,255,255,0.05)")
      .on("mouseover", function() {
        d3.select(this).attr("opacity", 0.8);
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 1);
      });

    // Add labels
    svg.append("text")
      .attr("x", centerX)
      .attr("y", centerY)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(56, 189, 248, 0.5)")
      .attr("font-size", "10px")
      .attr("font-family", "monospace")
      .attr("letter-spacing", "2px")
      .text("COORD: 37.42N 122.08W");

    // Exit Paths (Visual dynamic lines)
    const exits = [
      { x: centerX, y: centerY - 180, label: "GATE N" },
      { x: centerX, y: centerY + 180, label: "GATE S" },
      { x: centerX - 250, y: centerY, label: "GATE W" },
      { x: centerX + 250, y: centerY, label: "GATE E" }
    ];

    exits.forEach(exit => {
      // Line from centerish to exit
      svg.append("line")
        .attr("x1", centerX + (exit.x - centerX) * 0.4)
        .attr("y1", centerY + (exit.y - centerY) * 0.4)
        .attr("x2", exit.x)
        .attr("y2", exit.y)
        .attr("stroke", "rgba(56, 189, 248, 0.2)")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4")
        .attr("class", "animate-dash");

      svg.append("text")
        .attr("x", exit.x)
        .attr("y", exit.y + (exit.y > centerY ? 15 : -5))
        .attr("text-anchor", "middle")
        .attr("fill", "rgba(255,255,255,0.4)")
        .attr("font-size", "8px")
        .attr("font-family", "monospace")
        .text(exit.label);
    });

  }, [density]);

  return (
    <div className="relative w-full aspect-[3/2] flex items-center justify-center p-4">
      <svg
        ref={svgRef}
        viewBox="0 0 600 400"
        className="w-full h-full drop-shadow-[0_0_30px_rgba(56,189,248,0.05)]"
      />
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white/10 border border-white/10" />
          <span className="text-[10px] uppercase tracking-wider opacity-60">Stable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#38bdf8]" />
          <span className="text-[10px] uppercase tracking-wider opacity-60">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#fb923c]" />
          <span className="text-[10px] uppercase tracking-wider opacity-60">High Surge</span>
        </div>
      </div>
    </div>
  );
};
