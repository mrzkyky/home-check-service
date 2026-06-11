"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Zap, Battery, BatteryCharging, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UPSPage() {
  const [upsList] = useState([
    { id: 1, brand: "APC", model: "Smart-UPS 10kVA", capacity: "10 kVA", location: "Server Room A", status: "ONLINE", battery: 100, load: 45 },
    { id: 2, brand: "Liebert", model: "EXS 20kVA", capacity: "20 kVA", location: "Data Center B", status: "ON_BATTERY", battery: 85, load: 60 },
    { id: 3, brand: "Eaton", model: "9PX 5kVA", capacity: "5 kVA", location: "Network Room 1", status: "FAULT", battery: 0, load: 0 },
  ]);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/assets">
          <Button variant="outline" size="icon" className="rounded-full bg-background/50 backdrop-blur-sm border-border/50">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-8 w-8 text-amber-500" /> UPS Management
          </h2>
          <p className="text-muted-foreground mt-1">Manage Uninterruptible Power Supplies and monitor battery health.</p>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button><Plus className="mr-2 h-4 w-4" /> Add UPS</Button>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="p-4 text-left font-medium text-muted-foreground">Brand/Model</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Location</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Capacity</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Battery Level</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Current Load</th>
              </tr>
            </thead>
            <tbody>
              {upsList.map(u => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-4">
                    <p className="font-semibold">{u.brand}</p>
                    <p className="text-xs text-muted-foreground">{u.model}</p>
                  </td>
                  <td className="p-4">{u.location}</td>
                  <td className="p-4">{u.capacity}</td>
                  <td className="p-4">
                    {u.status === "ONLINE" && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><Zap className="mr-1 h-3 w-3"/> Online</Badge>}
                    {u.status === "ON_BATTERY" && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><BatteryCharging className="mr-1 h-3 w-3"/> On Battery</Badge>}
                    {u.status === "FAULT" && <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20"><AlertTriangle className="mr-1 h-3 w-3"/> Fault</Badge>}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${u.battery > 20 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${u.battery}%` }}></div>
                      </div>
                      <span className="font-medium text-xs">{u.battery}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium">{u.load}%</span>
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
