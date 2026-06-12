"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Camera, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, FormField, inputClassName, selectClassName } from "@/components/ui/dialog";
import { apiFetch, submitForm } from "@/lib/api";

interface CCTVItem {
  id: number;
  brand: string;
  location: string;
  ip_address: string;
  rtsp_url: string | null;
  status: string;
  resolution: string;
}

export default function CCTVPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [cameras, setCameras] = useState<CCTVItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const fetchCCTV = () => {
    apiFetch<CCTVItem[]>("/cctv")
      .then(setCameras)
      .catch(() => setCameras([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCCTV(); }, []);

  const filtered = cameras.filter(c => {
    const q = search.toLowerCase();
    return !q || c.location.toLowerCase().includes(q) || c.ip_address.toLowerCase().includes(q) || c.brand.toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const branch = fd.get("branch") as string;
    const room = fd.get("location") as string;

    await submitForm("/cctv", {
      brand: fd.get("brand"),
      location: `${branch} - ${room}`,
      ip_address: fd.get("ip_address"),
      resolution: fd.get("resolution") || "1080p",
      status: "ONLINE",
    }, {
      successMsg: "CCTV Camera added successfully!",
      onSuccess: () => { setShowAdd(false); fetchCCTV(); },
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "ONLINE": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3"/> Online</Badge>;
      case "OFFLINE": return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20"><XCircle className="mr-1 h-3 w-3"/> Offline</Badge>;
      default: return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertTriangle className="mr-1 h-3 w-3"/> {status}</Badge>;
    }
  };

  const onlineCount = cameras.filter(c => c.status === "ONLINE").length;
  const offlineCount = cameras.filter(c => c.status === "OFFLINE").length;

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CCTV Monitoring</h2>
          <p className="text-muted-foreground mt-1">Manage surveillance cameras, storage, and connectivity status.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" /> Add Camera</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Online</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-500">{onlineCount}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Offline</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-rose-500">{offlineCount}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Cameras</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{cameras.length}</div></CardContent></Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Camera Registry</CardTitle>
            <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><input type="search" placeholder="Search cameras..." value={search} onChange={e => setSearch(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm pl-9" /></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="p-4 text-left text-muted-foreground font-medium w-28">Camera ID</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-1/4">Location</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-1/4">Brand & IP</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-28">Resolution</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-28">Status</th>
                  <th className="p-4 text-right text-muted-foreground font-medium w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading CCTV units...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No CCTV units found.</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-mono font-medium text-primary">CAM-{c.id.toString().padStart(3, '0')}</td>
                    <td className="p-4"><div className="font-medium flex items-center gap-2"><Camera className="h-4 w-4 text-blue-500"/>{c.location.split(' - ')[1] || c.location}</div><div className="text-xs text-muted-foreground">{c.location.split(' - ')[0]}</div></td>
                    <td className="p-4"><div>{c.brand}</div><div className="text-xs text-muted-foreground font-mono">{c.ip_address}</div></td>
                    <td className="p-4">{c.resolution}</td>
                    <td className="p-4">{getStatusBadge(c.status)}</td>
                    <td className="p-4 text-right"><Button variant="ghost" size="sm">View</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader onClose={() => setShowAdd(false)}><DialogTitle>Tambah Kamera CCTV</DialogTitle><DialogDescription>Daftarkan kamera baru ke sistem surveillance.</DialogDescription></DialogHeader>
          <form ref={formRef} onSubmit={e => e.preventDefault()}>
            <DialogBody>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Cabang" required><select name="branch" className={selectClassName} required><option value="">Pilih Cabang</option><option>Jatinegara</option><option>Sudirman</option><option>Kuningan</option></select></FormField>
                <FormField label="Lokasi" required><input name="location" className={inputClassName} placeholder="Contoh: Lobby Utama" required /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Brand" required><input name="brand" className={inputClassName} placeholder="Contoh: Hikvision, Dahua" required /></FormField>
                <FormField label="IP Address" required><input name="ip_address" className={inputClassName} placeholder="192.168.x.x" required /></FormField>
              </div>
              <FormField label="Resolusi" required><select name="resolution" className={selectClassName} required><option value="">Pilih Resolusi</option><option>720p</option><option>1080p</option><option>4K</option></select></FormField>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button onClick={handleSubmit}><Plus className="mr-2 h-4 w-4" /> Simpan Kamera</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
