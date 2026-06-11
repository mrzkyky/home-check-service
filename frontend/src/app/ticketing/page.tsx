"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Ticket, AlertCircle, Clock, CheckCircle2, MoreVertical, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TicketingPage() {
  const [tickets] = useState([
    { id: 1, title: "AC Compressor Failure", category: "AC", location: "Server Room A", priority: "CRITICAL", status: "OPEN", assigned_to: "Tech Budi", date: "2026-06-11 10:00" },
    { id: 2, title: "Network Switch Offline", category: "NETWORK", location: "Lantai 2", priority: "HIGH", status: "IN PROGRESS", assigned_to: "Tech Andi", date: "2026-06-11 09:30" },
    { id: 3, title: "Routine Checkup Delay", category: "UPS", location: "Basement", priority: "LOW", status: "RESOLVED", assigned_to: "Tech Citra", date: "2026-06-10 15:00" }
  ]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "OPEN": return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20"><AlertCircle className="mr-1 h-3 w-3"/> Open</Badge>;
      case "IN PROGRESS": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="mr-1 h-3 w-3"/> In Progress</Badge>;
      case "RESOLVED": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3"/> Resolved</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "CRITICAL": return "text-rose-500";
      case "HIGH": return "text-orange-500";
      case "MEDIUM": return "text-amber-500";
      case "LOW": return "text-emerald-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Incident Ticketing</h2>
          <p className="text-muted-foreground mt-1">Manage, assign, and resolve facility incident tickets.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button><Plus className="mr-2 h-4 w-4" /> Create Ticket</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">1</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">1</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved (Today)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">1</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Auto-Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Active</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Ticket Queue</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search tickets..."
                className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="p-4 text-left text-muted-foreground font-medium">Ticket ID</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Issue Detail</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Priority</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Status</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Assigned To</th>
                <th className="p-4 text-right text-muted-foreground font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-4 font-mono font-medium text-primary">TKT-{t.id.toString().padStart(4, '0')}</td>
                  <td className="p-4">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{t.category} • {t.location}</div>
                  </td>
                  <td className={`p-4 font-semibold ${getPriorityColor(t.priority)}`}>{t.priority}</td>
                  <td className="p-4">{getStatusBadge(t.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {t.assigned_to.charAt(5)}
                      </div>
                      <span>{t.assigned_to}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/ticketing/${t.id}`}>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                        Manage <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
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
