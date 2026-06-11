"use client";

import { useState } from "react";
import { KeyRound, Plus, CheckCircle, XCircle, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AccessPage() {
  const [logs] = useState([
    { id: "AP-20260601", visitor: "John Doe", company: "VendorIT Solutions", room: "Server Room A", purpose: "Network Switch Installation", date: "2026-06-11", time: "10:00 - 14:00", status: "APPROVED" },
    { id: "AP-20260602", visitor: "Jane Smith", company: "Cooling Experts Inc.", room: "UPS Room", purpose: "AC Preventive Maintenance", date: "2026-06-11", time: "13:00 - 15:00", status: "PENDING" },
    { id: "AP-20260603", visitor: "Mike Ross", company: "PowerGrid", room: "Data Center B", purpose: "Battery Check", date: "2026-06-12", time: "09:00 - 11:00", status: "REJECTED" },
  ]);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <KeyRound className="h-8 w-8 text-primary" /> Access Management
          </h2>
          <p className="text-muted-foreground mt-1">Control and audit visitor access permits to critical facilities.</p>
        </div>
        <Button onClick={() => toast("Portal permohonan sedang disiapkan!")}><Plus className="mr-2 h-4 w-4" /> Request Permit</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Permits Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">2</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">5</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Visitors (This Week)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">24</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Access Permit Logs</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input type="search" placeholder="Search visitors or ID..." className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="p-4 text-left font-medium text-muted-foreground">Permit ID</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Visitor Info</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Target Room</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Date & Time</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-4 font-mono font-medium">{log.id}</td>
                  <td className="p-4">
                    <p className="font-semibold">{log.visitor}</p>
                    <p className="text-xs text-muted-foreground">{log.company}</p>
                  </td>
                  <td className="p-4">{log.room}</td>
                  <td className="p-4">
                    <p>{log.date}</p>
                    <p className="text-xs text-muted-foreground">{log.time}</p>
                  </td>
                  <td className="p-4">
                    {log.status === "APPROVED" && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle className="mr-1 h-3 w-3"/> Approved</Badge>}
                    {log.status === "PENDING" && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="mr-1 h-3 w-3"/> Pending</Badge>}
                    {log.status === "REJECTED" && <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20"><XCircle className="mr-1 h-3 w-3"/> Rejected</Badge>}
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
