"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Wifi, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, FormField, inputClassName, selectClassName } from "@/components/ui/dialog";
import { apiFetch, submitForm } from "@/lib/api";

interface NetworkItem {
  id: number;
  device_type: string;
  brand: string;
  model: string | null;
  location: string;
  ip_address: string;
  status: string;
}

export default function NetworkPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [devices, setDevices] = useState<NetworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const fetchNetwork = () => {
    apiFetch<NetworkItem[]>("/network")
      .then(setDevices)
      .catch(() => setDevices([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNetwork(); }, []);

  const filtered = devices.filter(d => {
    const q = search.toLowerCase();
    return !q || d.location.toLowerCase().includes(q) || d.ip_address.toLowerCase().includes(q) || d.brand.toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const branch = fd.get("branch") as string;
    const room = fd.get("location") as string;

    await submitForm("/network", {
      device_type: fd.get("device_type"),
      brand: fd.get("brand"),
      model: fd.get("brand"), // Simple fallback to brand if model not specified in UI mock
      location: `${branch} - ${room}`,
      ip_address: fd.get("ip_address"),
    }, {
      successMsg: "Network Device added successfully!",
      onSuccess: () => { setShowAdd(false); fetchNetwork(); },
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "ONLINE": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3"/> Online</Badge>;
      case "OFFLINE": return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20"><XCircle className="mr-1 h-3 w-3"/> Offline</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertTriangle className="mr-1 h-3 w-3"/> {status}</Badge>;
    }
  };

  const onlineCount = devices.filter(d => d.status === "ONLINE").length;
  const offlineCount = devices.filter(d => d.status !== "ONLINE").length;

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Network Devices</h2>
          <p className="text-muted-foreground mt-1">Monitor switches, routers, access points, and connectivity health.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" /> Add Device</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Online</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-500">{onlineCount}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Offline</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-rose-500">{offlineCount}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Devices</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{devices.length}</div></CardContent></Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between"><CardTitle>Device Registry</CardTitle><div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><input type="search" placeholder="Search devices..." value={search} onChange={e => setSearch(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm pl-9" /></div></div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="p-4 text-left text-muted-foreground font-medium w-28">Device ID</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-1/4">Location</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-1/4">Brand & IP</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-32">Type</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-28">Status</th>
                  <th className="p-4 text-right text-muted-foreground font-medium w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading Network devices...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No Network devices found.</td></tr>
                ) : filtered.map(d => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-mono font-medium text-primary">NET-{d.id.toString().padStart(3, '0')}</td>
                    <td className="p-4"><div className="font-medium flex items-center gap-2"><Wifi className="h-4 w-4 text-blue-500"/>{d.location.split(' - ')[1] || d.location}</div><div className="text-xs text-muted-foreground">{d.location.split(' - ')[0]}</div></td>
                    <td className="p-4"><div>{d.brand}</div><div className="text-xs text-muted-foreground font-mono">{d.ip_address}</div></td>
                    <td className="p-4">{d.device_type}</td>
                    <td className="p-4">{getStatusBadge(d.status)}</td>
                    <td className="p-4 text-right"><Button variant="ghost" size="sm">Ping</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader onClose={() => setShowAdd(false)}><DialogTitle>Tambah Perangkat Jaringan</DialogTitle><DialogDescription>Daftarkan switch, router, atau access point baru.</DialogDescription></DialogHeader>
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
                <FormField label="Lokasi Rack" required><input name="location" className={inputClassName} placeholder="Contoh: Rack Server Lt.1" required /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Brand" required>
                  <input name="brand" list="brand-options" className={inputClassName} placeholder="Pilih atau Ketik Brand" required />
                  <datalist id="brand-options">
                    <option value="Cisco" />
                    <option value="MikroTik" />
                    <option value="Aruba" />
                    <option value="Ubiquiti" />
                    <option value="HP/HPE" />
                  </datalist>
                </FormField>
                <FormField label="Tipe Perangkat" required>
                  <input name="device_type" list="device-type-options" className={inputClassName} placeholder="Pilih atau Ketik Tipe" required />
                  <datalist id="device-type-options">
                    <option value="Core Switch" />
                    <option value="Distribution Switch" />
                    <option value="Access Switch" />
                    <option value="Router" />
                    <option value="Access Point" />
                    <option value="Firewall" />
                  </datalist>
                </FormField>
              </div>
              <FormField label="IP Address" required><input name="ip_address" className={inputClassName} placeholder="10.0.x.x" required /></FormField>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button onClick={handleSubmit}><Plus className="mr-2 h-4 w-4" /> Simpan Perangkat</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
