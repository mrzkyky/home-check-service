"use client";

import { useState } from "react";
import { Plus, Flame, Search, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function APARPage() {
  const [apars] = useState([
    { id: 1, branch: "Jatinegara", location: "Lobby Utama", type: "Dry Chemical", capacity: "6 kg", expiry: "2026-12-01", status: "ACTIVE" },
    { id: 2, branch: "Sudirman", location: "Server Room B", type: "CO2", capacity: "3 kg", expiry: "2026-07-01", status: "EXPIRING SOON" },
    { id: 3, branch: "Kuningan", location: "Gudang", type: "Foam", capacity: "9 kg", expiry: "2026-05-15", status: "EXPIRED" }
  ]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "ACTIVE": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3"/> Active</Badge>;
      case "EXPIRING SOON": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertTriangle className="mr-1 h-3 w-3"/> Expiring Soon</Badge>;
      case "EXPIRED": return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20"><XCircle className="mr-1 h-3 w-3"/> Expired</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">APAR Inventory</h2>
          <p className="text-muted-foreground mt-1">Manage Fire Extinguishers, monthly inspections, and expiry tracking.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => alert("Fitur tambah data segera hadir!")}><Plus className="mr-2 h-4 w-4" /> Add APAR</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">142</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">1</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">1</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>APAR Master Data</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search by location..."
                className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
          <table className="w-full text-sm ">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="p-4 text-left text-muted-foreground font-medium">Location</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Type & Capacity</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Expiry Date</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Status</th>
                <th className="p-4 text-right text-muted-foreground font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {apars.map(apar => (
                <tr key={apar.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-4">
                    <div className="font-medium flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500"/> {apar.location}</div>
                    <div className="text-xs text-muted-foreground">{apar.branch}</div>
                  </td>
                  <td className="p-4">
                    <div>{apar.type}</div>
                    <div className="text-xs text-muted-foreground">{apar.capacity}</div>
                  </td>
                  <td className="p-4">{apar.expiry}</td>
                  <td className="p-4">{getStatusBadge(apar.status)}</td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm">Inspect</Button>
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
