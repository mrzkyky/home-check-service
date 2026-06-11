"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Cpu, Settings2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface AC {
  id: number;
  branch_unit: string;
  room: string;
  function: string;
  brand: string;
  type: string;
  capacity: string;
  serial_number: string;
}

export default function ACAssetsPage() {
  const [acs, setAcs] = useState<AC[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In real app, fetch from Next.js API route or backend directly
    // fetch("http://localhost:8000/api/v1/ac").then(...)
    setTimeout(() => {
      setAcs([
        {
          id: 1,
          branch_unit: "Jatinegara",
          room: "Server Room A",
          function: "Main",
          brand: "Daikin",
          type: "Cassette",
          capacity: "3 PK",
          serial_number: "DKN-2023-X9821",
        },
        {
          id: 2,
          branch_unit: "Jatinegara",
          room: "Server Room A",
          function: "Backup",
          brand: "Panasonic",
          type: "Split Wall",
          capacity: "2 PK",
          serial_number: "PNS-2021-B7123",
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Air Conditioners</h2>
          <p className="text-muted-foreground mt-1">Manage AC assets, daily monitoring, and preventive maintenance.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
          <Button><Plus className="mr-2 h-4 w-4" /> Add AC Asset</Button>
        </div>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>AC Master Data</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search by serial or room..."
                className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b border-border/50 bg-muted/30">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Serial Number</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Location</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Brand & Type</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Function</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading AC Data...</td></tr>
                ) : acs.map((ac) => (
                  <tr key={ac.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="p-4 align-middle font-medium">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-primary" />
                        {ac.serial_number}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-medium">{ac.branch_unit}</span>
                        <span className="text-xs text-muted-foreground">{ac.room}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span>{ac.brand}</span>
                        <span className="text-xs text-muted-foreground">{ac.type} • {ac.capacity}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={ac.function === "Main" ? "default" : "secondary"} className={ac.function === "Main" ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}>
                        {ac.function}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Link href={`/assets/ac/${ac.id}`}>
                        <Button variant="ghost" size="sm" className="hover:text-primary">
                          <Settings2 className="mr-2 h-4 w-4" /> Manage
                        </Button>
                      </Link>
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
