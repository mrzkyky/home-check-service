"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Videotape, Eye, ArrowLeft, VideoOff, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CCTVPage() {
  const [cctvList] = useState([
    { id: 1, brand: "Hikvision", location: "Server Room A - Front", ip: "192.168.10.51", resolution: "1080p", status: "ONLINE" },
    { id: 2, brand: "Dahua", location: "Server Room A - Back", ip: "192.168.10.52", resolution: "4K", status: "ONLINE" },
    { id: 3, brand: "Hikvision", location: "UPS Room", ip: "192.168.10.53", resolution: "1080p", status: "OFFLINE" },
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
            <Videotape className="h-8 w-8 text-blue-500" /> CCTV Surveillance
          </h2>
          <p className="text-muted-foreground mt-1">Manage IP Cameras and DVR/NVR status across facilities.</p>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button><Plus className="mr-2 h-4 w-4" /> Add Camera</Button>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="p-4 text-left font-medium text-muted-foreground">Camera Location</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Brand</th>
                <th className="p-4 text-left font-medium text-muted-foreground">IP Address</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Resolution</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="p-4 text-right font-medium text-muted-foreground">Stream</th>
              </tr>
            </thead>
            <tbody>
              {cctvList.map(c => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-4 font-medium">{c.location}</td>
                  <td className="p-4">{c.brand}</td>
                  <td className="p-4 font-mono text-xs">{c.ip}</td>
                  <td className="p-4"><Badge variant="outline">{c.resolution}</Badge></td>
                  <td className="p-4">
                    {c.status === "ONLINE" ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><PlayCircle className="mr-1 h-3 w-3"/> Recording</Badge>
                    ) : (
                      <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20"><VideoOff className="mr-1 h-3 w-3"/> Offline</Badge>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" disabled={c.status === "OFFLINE"}>
                      <Eye className="mr-2 h-4 w-4" /> View Live
                    </Button>
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
