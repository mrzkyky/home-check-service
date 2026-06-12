"use client";

import { useState, useEffect, useRef } from "react";
import { KeyRound, Plus, CheckCircle, XCircle, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, FormField, inputClassName, selectClassName, textareaClassName } from "@/components/ui/dialog";
import { apiFetch, submitForm } from "@/lib/api";

interface AccessPermit {
  id: number;
  visitor_name: string;
  company: string;
  purpose: string;
  branch_unit: string;
  room: string;
  permit_date: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

export default function AccessPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [logs, setLogs] = useState<AccessPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const fetchPermits = () => {
    apiFetch<AccessPermit[]>("/servers/permits")
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPermits(); }, []);

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    return !q || log.visitor_name.toLowerCase().includes(q) || log.company.toLowerCase().includes(q) || log.id.toString().includes(q);
  });

  const handleSubmit = async () => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    await submitForm("/servers/permits", {
      visitor_name: fd.get("visitor_name"),
      company: fd.get("company"),
      purpose: fd.get("purpose"),
      branch_unit: fd.get("branch_unit"),
      room: fd.get("room"),
      permit_date: fd.get("permit_date") ? new Date(fd.get("permit_date") as string).toISOString() : new Date().toISOString(),
      start_time: fd.get("start_time"),
      end_time: fd.get("end_time"),
    }, {
      successMsg: "Permit request submitted successfully!",
      onSuccess: () => { setShowAdd(false); fetchPermits(); },
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const activeToday = logs.filter(l => l.status === "APPROVED" && l.permit_date.startsWith(todayStr)).length;
  const pendingRequests = logs.filter(l => l.status === "PENDING").length;

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <KeyRound className="h-8 w-8 text-primary" /> Access Management
          </h2>
          <p className="text-muted-foreground mt-1">Control and audit visitor access permits to critical facilities.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" /> Request Permit</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Permits Today</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-500">{activeToday}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-500">{pendingRequests}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Visitors</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{logs.length}</div></CardContent></Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between"><CardTitle>Access Permit Logs</CardTitle><div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><input type="search" placeholder="Search visitors or ID..." value={search} onChange={e => setSearch(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm pl-9" /></div></div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="p-4 text-left font-medium text-muted-foreground w-32">Permit ID</th>
                  <th className="p-4 text-left font-medium text-muted-foreground w-1/4">Visitor Info</th>
                  <th className="p-4 text-left font-medium text-muted-foreground w-1/5">Target Room</th>
                  <th className="p-4 text-left font-medium text-muted-foreground w-1/5">Date & Time</th>
                  <th className="p-4 text-left font-medium text-muted-foreground w-28">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading permits...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No permits found.</td></tr>
                ) : filtered.map(log => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-mono font-medium">AP-{log.id.toString().padStart(4, '0')}</td>
                    <td className="p-4"><p className="font-semibold">{log.visitor_name}</p><p className="text-xs text-muted-foreground">{log.company}</p></td>
                    <td className="p-4"><p>{log.room}</p><p className="text-xs text-muted-foreground">{log.branch_unit}</p></td>
                    <td className="p-4"><p>{new Date(log.permit_date).toLocaleDateString()}</p><p className="text-xs text-muted-foreground">{log.start_time} - {log.end_time}</p></td>
                    <td className="p-4">
                      {log.status === "APPROVED" && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle className="mr-1 h-3 w-3"/> Approved</Badge>}
                      {log.status === "PENDING" && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="mr-1 h-3 w-3"/> Pending</Badge>}
                      {log.status === "REJECTED" && <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20"><XCircle className="mr-1 h-3 w-3"/> Rejected</Badge>}
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
          <DialogHeader onClose={() => setShowAdd(false)}><DialogTitle>Ajukan Izin Akses</DialogTitle><DialogDescription>Buat permohonan izin akses ke ruangan fasilitas kritis.</DialogDescription></DialogHeader>
          <form ref={formRef} onSubmit={e => e.preventDefault()}>
            <DialogBody>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nama Pengunjung" required><input name="visitor_name" className={inputClassName} placeholder="Contoh: John Doe" required /></FormField>
                <FormField label="Perusahaan" required><input name="company" className={inputClassName} placeholder="Contoh: VendorIT Solutions" required /></FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Cabang" required>
                  <select name="branch_unit" className={selectClassName} required><option value="">Pilih Cabang</option><option>Jatinegara</option><option>Sudirman</option><option>Kuningan</option></select>
                </FormField>
                <FormField label="Ruangan Tujuan" required>
                  <select name="room" className={selectClassName} required><option value="">Pilih Ruangan</option><option>Server Room A</option><option>Server Room B</option><option>Data Center A</option><option>Data Center B</option><option>UPS Room</option><option>Network Room</option></select>
                </FormField>
              </div>
              <FormField label="Tujuan Kunjungan" required><textarea name="purpose" className={textareaClassName} placeholder="Jelaskan tujuan kunjungan..." required /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Tanggal" required><input name="permit_date" type="date" className={inputClassName} required /></FormField>
                <div className="flex gap-2">
                  <FormField label="Jam Masuk" required><input name="start_time" type="time" className={inputClassName} required /></FormField>
                  <FormField label="Jam Keluar" required><input name="end_time" type="time" className={inputClassName} required /></FormField>
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button onClick={handleSubmit}><Plus className="mr-2 h-4 w-4" /> Ajukan Izin</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
