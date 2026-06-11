"use client";

import { useState } from "react";
import { Zap, Plus, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

export default function KWHPage() {
  const [readings] = useState([
    { id: 1, branch: "Jatinegara", location: "Main Panel", meter: "MTR-001", prev: 10500, curr: 10850, consumption: 350, isHigh: false, date: "2026-06-11" },
    { id: 2, branch: "Sudirman", location: "Sub Panel A", meter: "MTR-002", prev: 22000, curr: 22800, consumption: 800, isHigh: true, date: "2026-06-11" }
  ]);

  const chartData = [
    { name: "Mon", kwh: 300 },
    { name: "Tue", kwh: 320 },
    { name: "Wed", kwh: 350 },
    { name: "Thu", kwh: 800 },
    { name: "Fri", kwh: 310 },
  ];

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">KWH Metering</h2>
          <p className="text-muted-foreground mt-1">Daily electricity readings and consumption tracking.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => alert("Fitur tambah data segera hadir!")}><Plus className="mr-2 h-4 w-4" /> Input Daily Reading</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Consumption Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Bar dataKey="kwh" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {readings.filter(r => r.isHigh).map(r => (
                 <div key={r.id} className="flex items-start gap-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
                   <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5" />
                   <div>
                     <p className="font-medium text-rose-500">High Consumption Detected</p>
                     <p className="text-sm text-muted-foreground mt-1">Meter {r.meter} at {r.branch} ({r.location}) recorded {r.consumption} kWh, exceeding normal threshold.</p>
                     <p className="text-xs text-muted-foreground mt-2">{r.date}</p>
                   </div>
                 </div>
               ))}
               {readings.filter(r => r.isHigh).length === 0 && (
                 <p className="text-muted-foreground text-center py-8">No high consumption anomalies detected.</p>
               )}
             </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle>Daily Reading Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
          <table className="w-full text-sm ">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="p-4 text-left text-muted-foreground font-medium">Meter & Location</th>
                <th className="p-4 text-right text-muted-foreground font-medium">Previous</th>
                <th className="p-4 text-right text-muted-foreground font-medium">Current</th>
                <th className="p-4 text-right text-muted-foreground font-medium">Consumption (kWh)</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {readings.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-4">
                    <div className="font-medium flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500"/> {r.meter}</div>
                    <div className="text-xs text-muted-foreground">{r.branch} - {r.location}</div>
                  </td>
                  <td className="p-4 text-right">{r.prev.toLocaleString()}</td>
                  <td className="p-4 text-right font-medium">{r.curr.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <span className={r.isHigh ? "text-rose-500 font-bold" : "text-emerald-500 font-bold"}>
                      {r.consumption.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
