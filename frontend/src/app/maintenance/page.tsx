"use client";

import { useState } from "react";
import { Wrench, Plus, Calendar, Settings2, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function MaintenancePage() {
  const [schedules] = useState([
    { id: 1, type: "AC", asset: "Server Room A - AC Unit 1", task: "Quarterly Cleaning & Filter Replace", date: "2026-06-15", status: "UPCOMING" },
    { id: 2, type: "UPS", asset: "Data Center B - Main UPS", task: "Battery Impedance Test", date: "2026-06-10", status: "OVERDUE" },
    { id: 3, type: "NETWORK", asset: "Core Switch Lantai 2", task: "Firmware Patching", date: "2026-06-08", status: "COMPLETED" },
  ]);

  const getAssetIcon = (type: string) => {
    switch(type) {
      case "AC": return <Settings2 className="h-4 w-4 text-blue-500" />;
      case "UPS": return <Zap className="h-4 w-4 text-amber-500" />;
      default: return <Wrench className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-8 w-8 text-indigo-500" /> Preventive Maintenance
          </h2>
          <p className="text-muted-foreground mt-1">Aggregate view of all upcoming and overdue asset maintenance tasks.</p>
        </div>
        <Button onClick={() => toast("Fitur tambah jadwal PM segera hadir!")}><Plus className="mr-2 h-4 w-4" /> Schedule PM</Button>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Maintenance Calendar</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="p-4 text-left font-medium text-muted-foreground">Date</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Asset / Target</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Maintenance Task</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-4 text-right font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map(sch => (
                <tr key={sch.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-4 font-mono">{sch.date}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-semibold">
                      {getAssetIcon(sch.type)} {sch.asset}
                    </div>
                  </td>
                  <td className="p-4">{sch.task}</td>
                  <td className="p-4">
                    {sch.status === "UPCOMING" && <Badge variant="outline" className="border-primary text-primary">Upcoming</Badge>}
                    {sch.status === "OVERDUE" && <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">Overdue</Badge>}
                    {sch.status === "COMPLETED" && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Completed</Badge>}
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm">Review</Button>
                  </td>
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
