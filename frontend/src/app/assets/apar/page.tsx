"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Flame, Search, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, FormField, inputClassName, selectClassName } from "@/components/ui/dialog";
import { apiFetch, submitForm } from "@/lib/api";

interface APARItem {
  id: number;
  branch: string;
  location: string;
  type: string;
  capacity: string;
  expiry_date: string;
  current_status: string;
}

export default function APARPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [apars, setApars] = useState<APARItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const fetchApars = () => {
    apiFetch<APARItem[]>("/apar")
      .then(setApars)
      .catch(() => setApars([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApars(); }, []);

  const filtered = apars.filter(a => {
    const q = search.toLowerCase();
    return !q || a.location.toLowerCase().includes(q) || a.branch.toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    await submitForm("/apar", {
      branch: fd.get("branch"),
      location: fd.get("location"),
      type: fd.get("type"),
      capacity: fd.get("capacity"),
      expiry_date: fd.get("expiry_date") ? new Date(fd.get("expiry_date") as string).toISOString() : new Date().toISOString(),
    }, {
      successMsg: "APAR added successfully!",
      onSuccess: () => { setShowAdd(false); fetchApars(); },
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "ACTIVE": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3"/> Active</Badge>;
      case "EXPIRING_SOON": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertTriangle className="mr-1 h-3 w-3"/> Expiring Soon</Badge>;
      case "EXPIRED": return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20"><XCircle className="mr-1 h-3 w-3"/> Expired</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const activeCount = apars.filter(a => a.current_status === "ACTIVE").length;
  const expiringCount = apars.filter(a => a.current_status === "EXPIRING_SOON").length;
  const expiredCount = apars.filter(a => a.current_status === "EXPIRED").length;

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">APAR Inventory</h2>
          <p className="text-muted-foreground mt-1">Manage Fire Extinguishers, monthly inspections, and expiry tracking.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" /> Add APAR</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Units</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-500">{activeCount}</div></CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon (30 Days)</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-500">{expiringCount}</div></CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Expired Units</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-rose-500">{expiredCount}</div></CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>APAR Master Data</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input type="search" placeholder="Search by location..." value={search} onChange={e => setSearch(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="p-4 text-left text-muted-foreground font-medium w-1/4">Location</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-1/4">Type & Capacity</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-1/5">Expiry Date</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-1/5">Status</th>
                  <th className="p-4 text-right text-muted-foreground font-medium w-32">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading APARs...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No APARs found.</td></tr>
                ) : filtered.map(apar => (
                  <tr key={apar.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4">
                      <div className="font-medium flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500"/> {apar.location}</div>
                      <div className="text-xs text-muted-foreground">{apar.branch}</div>
                    </td>
                    <td className="p-4">
                      <div>{apar.type}</div>
                      <div className="text-xs text-muted-foreground">{apar.capacity}</div>
                    </td>
                    <td className="p-4">{new Date(apar.expiry_date).toLocaleDateString()}</td>
                    <td className="p-4">{getStatusBadge(apar.current_status)}</td>
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

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader onClose={() => setShowAdd(false)}>
            <DialogTitle>Tambah Unit APAR Baru</DialogTitle>
            <DialogDescription>Isi data pemadam api ringan untuk didaftarkan ke sistem.</DialogDescription>
          </DialogHeader>
          <form ref={formRef} onSubmit={e => e.preventDefault()}>
            <DialogBody>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Cabang" required>
                  <select name="branch" className={selectClassName} required>
                    <option value="">Pilih Cabang</option>
                    <option>Jatinegara</option>
                    <option>Sudirman</option>
                    <option>Kuningan</option>
                  </select>
                </FormField>
                <FormField label="Lokasi Penempatan" required>
                  <input name="location" className={inputClassName} placeholder="Contoh: Lobby Utama" required />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Jenis APAR" required>
                  <select name="type" className={selectClassName} required>
                    <option value="">Pilih Jenis</option>
                    <option>Dry Chemical</option>
                    <option>CO2</option>
                    <option>Foam</option>
                    <option>Halon Free</option>
                  </select>
                </FormField>
                <FormField label="Kapasitas" required>
                  <select name="capacity" className={selectClassName} required>
                    <option value="">Pilih Kapasitas</option>
                    <option>3 kg</option>
                    <option>6 kg</option>
                    <option>9 kg</option>
                    <option>12 kg</option>
                  </select>
                </FormField>
              </div>
              <FormField label="Tanggal Kadaluarsa" required>
                <input name="expiry_date" type="date" className={inputClassName} required />
              </FormField>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button onClick={handleSubmit}>
                <Plus className="mr-2 h-4 w-4" /> Simpan APAR
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
