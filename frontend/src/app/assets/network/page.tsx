"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Network, ArrowLeft, Activity, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function NetworkPage() {
  const [networkList] = useState([
    { id: 1, device_type: "ROUTER", brand: "Cisco", model: "ASR 1001-X", location: "Server Room A", ip: "10.0.0.1", status: "ONLINE", firmware: "IOS XE 16.9.4" },
    { id: 2, device_type: "SWITCH", brand: "Aruba", model: "2930F 48G", location: "Network Closet L2", ip: "10.0.1.5", status: "ONLINE", firmware: "WC.16.10.0002" },
    { id: 3, device_type: "FIREWALL", brand: "Fortinet", model: "FortiGate 100F", location: "Data Center B", ip: "10.0.0.254", status: "OFFLINE", firmware: "v6.4.5" },
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
            <Network className="h-8 w-8 text-indigo-500" /> Network Equipment
          </h2>
          <p className="text-muted-foreground mt-1">Manage Routers, Switches, and Firewalls infrastructure.</p>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button onClick={() => alert("Fitur tambah data segera hadir!")}><Plus className="mr-2 h-4 w-4" /> Add Device</Button>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
          <table className="w-full text-sm ">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="p-4 text-left font-medium text-muted-foreground">Type</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Brand/Model</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Location</th>
                <th className="p-4 text-left font-medium text-muted-foreground">IP Address</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Firmware</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {networkList.map(n => (
                <tr key={n.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-4">
                    <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500">{n.device_type}</Badge>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold">{n.brand}</p>
                    <p className="text-xs text-muted-foreground">{n.model}</p>
                  </td>
                  <td className="p-4">{n.location}</td>
                  <td className="p-4 font-mono text-xs">{n.ip}</td>
                  <td className="p-4 text-xs text-muted-foreground">{n.firmware}</td>
                  <td className="p-4">
                    {n.status === "ONLINE" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><Activity className="mr-1 h-3 w-3"/> Up</Badge>
                    ) : (
                      <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20"><XCircle className="mr-1 h-3 w-3"/> Down</Badge>
                    )}
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
