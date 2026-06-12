"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, Plus, ClipboardCheck, Flame, Server, AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, FormField, inputClassName, selectClassName, textareaClassName } from "@/components/ui/dialog";
import { apiFetch, submitForm } from "@/lib/api";

interface InspectionItem {
  id: number;
  inspection_type: string;
  area: string;
  inspector: string;
  inspection_date: string;
  findings: string | null;
  status: string;
}

interface InspectionStats {
  total: number;
  passed: number;
  warning: number;
  failed: number;
}

export default function InspectionPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [stats, setStats] = useState<InspectionStats>({ total: 0, passed: 0, warning: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const fetchInspections = () => {
    apiFetch<InspectionItem[]>("/inspections")
      .then(setInspections)
      .catch(() => setInspections([]))
      .finally(() => setLoading(false));

    apiFetch<InspectionStats>("/inspections/stats")
      .then(setStats)
      .catch(console.error);
  };

  useEffect(() => { fetchInspections(); }, []);

  const filtered = inspections.filter(ins => {
    const q = search.toLowerCase();
    return !q || ins.area.toLowerCase().includes(q) || ins.inspector.toLowerCase().includes(q) || ins.inspection_type.toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    await submitForm("/inspections", {
      inspection_type: fd.get("inspection_type"),
      area: fd.get("area"),
      inspector: fd.get("inspector"),
      inspection_date: fd.get("inspection_date") ? new Date(fd.get("inspection_date") as string).toISOString() : new Date().toISOString(),
      findings: fd.get("findings"),
      status: fd.get("status"),
    }, {
      successMsg: "Inspection log created successfully!",
      onSuccess: () => { setShowAdd(false); fetchInspections(); },
    });
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-teal-500" /> Facility Inspection
          </h2>
          <p className="text-muted-foreground mt-1">Daily rounds, room cleanliness, and fire safety (APAR) inspection logs.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" /> Log Inspection</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Server Room Patrols</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.passed} / {stats.total} Passed</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}% pass rate
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inspection Issues</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">{stats.failed} Failed, {stats.warning} Warnings</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Recent Inspection Logs</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input type="search" placeholder="Search area or inspector..." value={search} onChange={e => setSearch(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="p-4 text-left font-medium text-muted-foreground w-24">ID</th>
                  <th className="p-4 text-left font-medium text-muted-foreground w-40">Type & Area</th>
                  <th className="p-4 text-left font-medium text-muted-foreground w-40">Inspector & Date</th>
                  <th className="p-4 text-left font-medium text-muted-foreground">Findings</th>
                  <th className="p-4 text-left font-medium text-muted-foreground w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading inspections...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No inspection logs found.</td></tr>
                ) : filtered.map(ins => (
                  <tr key={ins.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-mono font-medium">INS-{ins.id.toString().padStart(3, '0')}</td>
                    <td className="p-4"><Badge variant="outline" className="mb-1">{ins.inspection_type}</Badge><p className="font-semibold">{ins.area}</p></td>
                    <td className="p-4"><p>{ins.inspector}</p><p className="text-xs text-muted-foreground">{new Date(ins.inspection_date).toLocaleDateString()}</p></td>
                    <td className="p-4 text-muted-foreground">{ins.findings || "No findings"}</td>
                    <td className="p-4">
                      {ins.status === "PASSED" && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Passed</Badge>}
                      {ins.status === "WARNING" && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertTriangle className="mr-1 h-3 w-3"/> Warning</Badge>}
                      {ins.status === "FAILED" && <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">Failed</Badge>}
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
          <DialogHeader onClose={() => setShowAdd(false)}><DialogTitle>Catat Log Inspeksi</DialogTitle><DialogDescription>Buat laporan inspeksi fasilitas atau APAR.</DialogDescription></DialogHeader>
          <form ref={formRef} onSubmit={e => e.preventDefault()}>
            <DialogBody>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Tipe Inspeksi" required>
                  <select name="inspection_type" className={selectClassName} required><option value="">Pilih Tipe</option><option>APAR</option><option>Room Patrol</option><option>Server Room</option><option>Electrical</option></select>
                </FormField>
                <FormField label="Area / Lokasi" required><input name="area" className={inputClassName} placeholder="Contoh: Server Room A" required /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nama Inspektor" required><input name="inspector" className={inputClassName} placeholder="Contoh: Security Team" required /></FormField>
                <FormField label="Tanggal Inspeksi" required><input name="inspection_date" type="date" className={inputClassName} required /></FormField>
              </div>
              <FormField label="Temuan / Catatan"><textarea name="findings" className={textareaClassName} placeholder="Jelaskan hasil temuan inspeksi..." /></FormField>
              <FormField label="Hasil" required>
                <select name="status" className={selectClassName} required><option value="">Pilih Hasil</option><option>PASSED</option><option>WARNING</option><option>FAILED</option></select>
              </FormField>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button onClick={handleSubmit}><Plus className="mr-2 h-4 w-4" /> Simpan Inspeksi</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
