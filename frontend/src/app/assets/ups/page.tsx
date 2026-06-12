"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Battery, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, FormField, inputClassName, selectClassName } from "@/components/ui/dialog";
import { apiFetch, submitForm } from "@/lib/api";

interface UPSItem {
  id: number;
  brand: string;
  model: string;
  capacity: string;
  location: string;
  ip_address: string | null;
  status: string;
  battery_level: number;
}

export default function UPSPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [units, setUnits] = useState<UPSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const fetchUPS = () => {
    apiFetch<UPSItem[]>("/ups")
      .then(setUnits)
      .catch(() => setUnits([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUPS(); }, []);

  const filtered = units.filter(u => {
    const q = search.toLowerCase();
    return !q || u.location.toLowerCase().includes(q) || u.brand.toLowerCase().includes(q) || u.model.toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const branch = fd.get("branch") as string;
    const room = fd.get("location") as string;
    
    await submitForm("/ups", {
      location: `${branch} - ${room}`,
      brand: fd.get("brand"),
      model: fd.get("model"),
      capacity: fd.get("capacity"),
    }, {
      successMsg: "UPS unit added successfully!",
      onSuccess: () => { setShowAdd(false); fetchUPS(); },
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "ONLINE": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3"/> Online</Badge>;
      case "OFFLINE": return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20"><XCircle className="mr-1 h-3 w-3"/> Offline</Badge>;
      case "ON_BATTERY": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertTriangle className="mr-1 h-3 w-3"/> On Battery</Badge>;
      case "FAULT": return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20"><AlertTriangle className="mr-1 h-3 w-3"/> Fault</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const onlineCount = units.filter(u => u.status === "ONLINE").length;
  const alertCount = units.filter(u => u.status !== "ONLINE").length;

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">UPS Management</h2>
          <p className="text-muted-foreground mt-1">Monitor uninterruptible power supplies and battery health.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" /> Add UPS</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Online</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-500">{onlineCount}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Battery/Fault Alert</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-500">{alertCount}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Units</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{units.length}</div></CardContent></Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between"><CardTitle>UPS Registry</CardTitle><div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><input type="search" placeholder="Search UPS..." value={search} onChange={e => setSearch(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm pl-9" /></div></div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="p-4 text-left text-muted-foreground font-medium w-28">UPS ID</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-1/4">Location</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-1/4">Brand & Model</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-28">Capacity</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-32">Status</th>
                  <th className="p-4 text-right text-muted-foreground font-medium w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading UPS units...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No UPS units found.</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-mono font-medium text-primary">UPS-{u.id.toString().padStart(3, '0')}</td>
                    <td className="p-4"><div className="font-medium flex items-center gap-2"><Battery className="h-4 w-4 text-green-500"/>{u.location}</div></td>
                    <td className="p-4"><div>{u.brand}</div><div className="text-xs text-muted-foreground">{u.model}</div></td>
                    <td className="p-4">{u.capacity}</td>
                    <td className="p-4">{getStatusBadge(u.status)}</td>
                    <td className="p-4 text-right"><Button variant="ghost" size="sm">Check</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader onClose={() => setShowAdd(false)}><DialogTitle>Tambah Unit UPS</DialogTitle><DialogDescription>Daftarkan UPS baru ke sistem monitoring power.</DialogDescription></DialogHeader>
          <form ref={formRef} onSubmit={e => e.preventDefault()}>
            <DialogBody>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Cabang" required>
                  <input name="branch" list="branch-options" className={inputClassName} placeholder="Pilih atau Ketik Cabang" required />
                  <datalist id="branch-options">
                    <option value="Jatinegara" />
                    <option value="Sudirman" />
                    <option value="Kuningan" />
                  </datalist>
                </FormField>
                <FormField label="Lokasi" required><input name="location" className={inputClassName} placeholder="Contoh: Server Room A" required /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Brand" required>
                  <input name="brand" list="brand-options" className={inputClassName} placeholder="Pilih atau Ketik Brand" required />
                  <datalist id="brand-options">
                    <option value="APC" />
                    <option value="Eaton" />
                    <option value="CyberPower" />
                    <option value="Vertiv" />
                  </datalist>
                </FormField>
                <FormField label="Model" required><input name="model" className={inputClassName} placeholder="Contoh: Smart-UPS 3000" required /></FormField>
              </div>
              <FormField label="Kapasitas" required>
                <input name="capacity" list="capacity-options" className={inputClassName} placeholder="Pilih atau Ketik Kapasitas" required />
                <datalist id="capacity-options">
                  <option value="1 kVA" />
                  <option value="1.5 kVA" />
                  <option value="3 kVA" />
                  <option value="6 kVA" />
                  <option value="10 kVA" />
                </datalist>
              </FormField>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button onClick={handleSubmit}><Plus className="mr-2 h-4 w-4" /> Simpan UPS</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
