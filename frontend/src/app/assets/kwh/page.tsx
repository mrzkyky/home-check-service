"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Gauge, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, FormField, inputClassName, selectClassName } from "@/components/ui/dialog";
import { apiFetch, submitForm } from "@/lib/api";

interface KWHItem {
  id: number;
  meter_id: string;
  branch: string;
  panel_name: string;
  current_reading: number;
  usage_rate: number;
  status: string;
}

export default function KWHPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [meters, setMeters] = useState<KWHItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const fetchMeters = () => {
    apiFetch<KWHItem[]>("/kwh")
      .then(setMeters)
      .catch(() => setMeters([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMeters(); }, []);

  const filtered = meters.filter(m => {
    const q = search.toLowerCase();
    return !q || m.panel_name.toLowerCase().includes(q) || m.meter_id.toLowerCase().includes(q) || m.branch.toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    await submitForm("/kwh", {
      branch: fd.get("branch"),
      panel_name: fd.get("panel_name"),
      current_reading: parseFloat(fd.get("current_reading") as string) || 0,
    }, {
      successMsg: "KWH Meter added successfully!",
      onSuccess: () => { setShowAdd(false); fetchMeters(); },
    });
  };

  const normalCount = meters.filter(m => m.status === "NORMAL").length;
  const alertCount = meters.filter(m => m.status === "HIGH_USAGE").length;

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">KWH Meter Monitoring</h2>
          <p className="text-muted-foreground mt-1">Track electrical consumption, panel readings, and usage analytics.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" /> Add Meter</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Meters</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{meters.length}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Normal Usage</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-500">{normalCount}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">High Usage Alert</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-500">{alertCount}</div></CardContent></Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between"><CardTitle>Meter Registry</CardTitle><div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><input type="search" placeholder="Search meters..." value={search} onChange={e => setSearch(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm pl-9" /></div></div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="p-4 text-left text-muted-foreground font-medium w-28">Meter ID</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-1/4">Panel Location</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-32">Reading</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-32">Usage Rate</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-32">Status</th>
                  <th className="p-4 text-right text-muted-foreground font-medium w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading KWH Meters...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No KWH Meters found.</td></tr>
                ) : filtered.map(m => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-mono font-medium text-primary">{m.meter_id}</td>
                    <td className="p-4"><div className="font-medium flex items-center gap-2"><Gauge className="h-4 w-4 text-blue-500"/>{m.panel_name}</div><div className="text-xs text-muted-foreground">{m.branch}</div></td>
                    <td className="p-4 font-mono">{m.current_reading.toLocaleString()} kWh</td>
                    <td className="p-4"><div className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-muted-foreground"/>{m.usage_rate} kWh/day</div></td>
                    <td className="p-4">{m.status === "NORMAL" ? <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3"/>Normal</Badge> : <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertTriangle className="mr-1 h-3 w-3"/>High Usage</Badge>}</td>
                    <td className="p-4 text-right"><Button variant="ghost" size="sm">Detail</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader onClose={() => setShowAdd(false)}><DialogTitle>Tambah Meter KWH</DialogTitle><DialogDescription>Daftarkan meter listrik baru ke sistem monitoring.</DialogDescription></DialogHeader>
          <form ref={formRef} onSubmit={e => e.preventDefault()}>
            <DialogBody>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Cabang" required><select name="branch" className={selectClassName} required><option value="">Pilih Cabang</option><option>Jatinegara</option><option>Sudirman</option><option>Kuningan</option></select></FormField>
                <FormField label="Lokasi Panel" required><input name="panel_name" className={inputClassName} placeholder="Contoh: Panel Utama Lt.1" required /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Pembacaan Awal (kWh)" required><input name="current_reading" type="number" step="0.01" className={inputClassName} placeholder="0" required /></FormField>
                <FormField label="Tipe Meter"><select name="meter_type" className={selectClassName}><option value="">Pilih Tipe</option><option>Analog</option><option>Digital</option><option>Smart Meter</option></select></FormField>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button onClick={handleSubmit}><Plus className="mr-2 h-4 w-4" /> Simpan Meter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
