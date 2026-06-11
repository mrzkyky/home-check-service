"use client";

import { useState } from "react";
import { Building2, Plus, ClipboardCheck, Flame, Server, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function InspectionPage() {
  const [inspections] = useState([
    { id: "INS-001", type: "APAR", area: "Server Room A", inspector: "Security Team", date: "2026-06-01", findings: "Pressure Normal. Hose intact.", status: "PASSED" },
    { id: "INS-002", type: "ROOM", area: "Data Center B", inspector: "Tech Budi", date: "2026-06-05", findings: "Dust found on exhaust vents. Cleaned immediately.", status: "WARNING" },
    { id: "INS-003", type: "APAR", area: "Lobby Utama", inspector: "Security Team", date: "2026-06-10", findings: "Pin missing. Scheduled for replacement.", status: "FAILED" },
  ]);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-teal-500" /> Facility Inspection
          </h2>
          <p className="text-muted-foreground mt-1">Daily rounds, room cleanliness, and fire safety (APAR) inspection logs.</p>
        </div>
        <Button><Plus className="mr-2 h-4 w-4" /> Log Inspection</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Server Room Patrols (This Month)</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">14 / 15</div>
            <p className="text-xs text-muted-foreground mt-1">93% completion rate</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">APAR Inspections (This Month)</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">45 / 50</div>
            <p className="text-xs text-muted-foreground mt-1">5 assets need immediate inspection</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Recent Inspection Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="p-4 text-left font-medium text-muted-foreground">ID</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Type & Area</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Inspector & Date</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Findings</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map(ins => (
                <tr key={ins.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-4 font-mono font-medium">{ins.id}</td>
                  <td className="p-4">
                    <Badge variant="outline" className="mb-1">{ins.type}</Badge>
                    <p className="font-semibold">{ins.area}</p>
                  </td>
                  <td className="p-4">
                    <p>{ins.inspector}</p>
                    <p className="text-xs text-muted-foreground">{ins.date}</p>
                  </td>
                  <td className="p-4 max-w-xs truncate text-muted-foreground">{ins.findings}</td>
                  <td className="p-4">
                    {ins.status === "PASSED" && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Passed</Badge>}
                    {ins.status === "WARNING" && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertTriangle className="mr-1 h-3 w-3"/> Warning</Badge>}
                    {ins.status === "FAILED" && <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">Failed</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
