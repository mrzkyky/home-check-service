"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Plus, Ticket, AlertCircle, Clock, CheckCircle2, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, FormField, inputClassName, selectClassName, textareaClassName } from "@/components/ui/dialog";
import { apiFetch, submitForm } from "@/lib/api";

interface TicketItem {
  id: number;
  title: string;
  category: string;
  location: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
}

export default function TicketingPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const fetchTickets = () => {
    apiFetch<TicketItem[]>("/tickets")
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, []);

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    return !q || t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.location.toLowerCase().includes(q);
  });

  const counts = {
    open: tickets.filter(t => t.status === "OPEN").length,
    inProgress: tickets.filter(t => t.status === "IN PROGRESS").length,
    resolved: tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length,
  };

  const handleSubmit = async () => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    await submitForm("/tickets", {
      title: fd.get("title"),
      category: fd.get("category"),
      priority: fd.get("priority"),
      location: fd.get("location"),
      description: fd.get("description"),
    }, {
      successMsg: "Tiket berhasil dibuat!",
      onSuccess: () => { setShowAdd(false); fetchTickets(); },
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "OPEN": return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20"><AlertCircle className="mr-1 h-3 w-3"/> Open</Badge>;
      case "IN PROGRESS": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="mr-1 h-3 w-3"/> In Progress</Badge>;
      case "RESOLVED": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3"/> Resolved</Badge>;
      case "CLOSED": return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20"><CheckCircle2 className="mr-1 h-3 w-3"/> Closed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "CRITICAL": return "text-rose-500";
      case "HIGH": return "text-orange-500";
      case "MEDIUM": return "text-amber-500";
      case "LOW": return "text-emerald-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Incident Ticketing</h2>
          <p className="text-muted-foreground mt-1">Manage, assign, and resolve facility incident tickets.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" /> Create Ticket</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-rose-500">{counts.open}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-500">{counts.inProgress}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-500">{counts.resolved}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Auto-Assignment</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">Active</div></CardContent></Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between"><CardTitle>Ticket Queue</CardTitle><div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><input type="search" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm pl-9" /></div></div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="p-4 text-left text-muted-foreground font-medium w-28">Ticket ID</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-1/3">Issue Detail</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-24">Priority</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-32">Status</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-36">Assigned To</th>
                  <th className="p-4 text-right text-muted-foreground font-medium w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading tickets...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No tickets found.</td></tr>
                ) : filtered.map(t => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-mono font-medium text-primary">TKT-{t.id.toString().padStart(4, '0')}</td>
                    <td className="p-4"><div className="font-medium">{t.title}</div><div className="text-xs text-muted-foreground">{t.category} • {t.location}</div></td>
                    <td className={`p-4 font-semibold ${getPriorityColor(t.priority)}`}>{t.priority}</td>
                    <td className="p-4">{getStatusBadge(t.status)}</td>
                    <td className="p-4"><div className="flex items-center gap-2">{t.assigned_to && <><div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{t.assigned_to.charAt(5)}</div><span>{t.assigned_to}</span></>}</div></td>
                    <td className="p-4 text-right"><Link href={`/ticketing/${t.id}`}><Button variant="ghost" size="sm" className="text-primary hover:text-primary">Manage <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader onClose={() => setShowAdd(false)}><DialogTitle>Buat Tiket Insiden Baru</DialogTitle><DialogDescription>Laporkan gangguan atau masalah pada fasilitas gedung.</DialogDescription></DialogHeader>
          <form ref={formRef} onSubmit={e => e.preventDefault()}>
            <DialogBody>
              <FormField label="Judul Insiden" required><input name="title" className={inputClassName} placeholder="Contoh: AC Compressor Failure" required /></FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Kategori" required>
                  <select name="category" className={selectClassName} required><option value="">Pilih Kategori</option><option>AC</option><option>UPS</option><option>Network</option><option>Server</option><option>CCTV</option><option>APAR</option><option>Electrical</option><option>Plumbing</option><option>Other</option></select>
                </FormField>
                <FormField label="Prioritas" required>
                  <select name="priority" className={selectClassName} required><option value="">Pilih Prioritas</option><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select>
                </FormField>
              </div>
              <FormField label="Lokasi" required><input name="location" className={inputClassName} placeholder="Contoh: Server Room A, Lantai 2" required /></FormField>
              <FormField label="Deskripsi Masalah" required><textarea name="description" className={textareaClassName} placeholder="Jelaskan detail masalah yang terjadi..." required /></FormField>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button onClick={handleSubmit}><Plus className="mr-2 h-4 w-4" /> Buat Tiket</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
