"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Zap, Flame, CheckCircle, AlertTriangle, ShieldCheck, Ticket } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function Dashboard() {
  const kpiData = [
    { title: "Open Tickets", value: "3", icon: Ticket, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Active Permits", value: "12", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Pending Approvals", value: "5", icon: CheckCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "APAR Expired", value: "1", icon: Flame, color: "text-rose-500", bg: "bg-rose-500/10" },
    { title: "High Consumption", value: "3", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" }
  ];

  const consumptionData = [
    { name: "Jan", kwh: 4000 },
    { name: "Feb", kwh: 4200 },
    { name: "Mar", kwh: 3800 },
    { name: "Apr", kwh: 4600 },
    { name: "May", kwh: 5100 }
  ];

  return (
    <div className="flex-1 space-y-6 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10 pointer-events-none" />
      
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Executive Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {kpiData.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-3xl font-bold mt-2">{kpi.value}</p>
                </div>
                <div className={`size-12 rounded-full ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`size-6 ${kpi.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Energy Consumption Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={consumptionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Line type="monotone" dataKey="kwh" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>System Health Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-medium">Data Center A</p>
                  <p className="text-sm text-muted-foreground">Temp: 20.5°C | Hum: 45%</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500">Normal</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-rose-500/10 rounded-lg border border-rose-500/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                <div>
                  <p className="font-medium text-rose-500">Network Room B</p>
                  <p className="text-sm text-rose-500/80">Temp: 28.0°C | Hum: 60%</p>
                </div>
              </div>
              <Badge className="bg-rose-500 text-white">High Temp</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
