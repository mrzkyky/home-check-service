"use client";

import { useState, useEffect, useRef } from "react";
import { Wrench, Plus, Calendar, Settings2, Zap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, FormField, inputClassName, selectClassName, textareaClassName } from "@/components/ui/dialog";
import { apiFetch, submitForm, apiPut } from "@/lib/api";
import { toast } from "sonner";

interface MaintenanceItem {
  id: number;
  asset_type: string;
  asset_name: string;
  task_description: string;
  scheduled_date: string;
  frequency: string;
  status: string;
  completed_at: string | null;
}

export default function MaintenancePage() {
  const [showAdd, setShowAdd] = useState(false);
  const [schedules, setSchedules] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const fetchSchedules = () => {
    apiFetch<MaintenanceItem[]>("/maintenance")
      .then(setSchedules)
      .catch(() => setSchedules([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSchedules(); }, []);

  const filtered = schedules.filter(s => {
    const q = search.toLowerCase();
    return !q || s.asset_name.toLowerCase().includes(q) || s.task_description.toLowerCase().includes(q) || s.asset_type.toLowerCase().includes(q);
  });

  const getAssetIcon = (type: string) => {
    switch(type.toUpperCase()) {
      case "AC": return <Settings2 className="h-4 w-4 text-blue-500" />;
      case "UPS": return <Zap className="h-4 w-4 text-amber-500" />;
      default: return <Wrench className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleSubmit = async () => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    await submitForm("/maintenance", {
      asset_type: fd.get("asset_type"),
      asset_name: fd.get("asset_name"),
      scheduled_date: fd.get("scheduled_date") ? new Date(fd.get("scheduled_date") as string).toISOString() : new Date().toISOString(),
      task_description: fd.get("task_description"),
      frequency: fd.get("frequency"),
    }, {
      successMsg: "Jadwal maintenance berhasil dibuat!",
      onSuccess: () => { setShowAdd(false); fetchSchedules(); },
    });
  };

  const markCompleted = async (id: number) => {
    try {
      await apiPut(`/maintenance/${id}`, { status: "COMPLETED" });
      toast.success("Maintenance ditandai selesai.");
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah status");
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-8 w-8 text-indigo-500" /> Preventive Maintenance
          </h2>
          <p className="text-muted-foreground mt-1">Aggregate view of all upcoming and overdue asset maintenance tasks.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" /> Schedule PM</Button>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Maintenance Calendar</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input type="search" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="p-4 text-left font-medium text-muted-foreground w-32">Date</th>
                  <th className="p-4 text-left font-medium text-muted-foreground w-1/3">Asset / Target</th>
                  <th className="p-4 text-left font-medium text-muted-foreground w-1/3">Maintenance Task</th>
                  <th className="p-4 text-left font-medium text-muted-foreground w-32">Status</th>
                  <th className="p-4 text-right font-medium text-muted-foreground w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading schedules...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No schedules found.</td></tr>
                ) : filtered.map(sch => (
                  <tr key={sch.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-mono">{new Date(sch.scheduled_date).toLocaleDateString()}</td>
                    <td className="p-4"><div className="flex items-center gap-2 font-semibold">{getAssetIcon(sch.asset_type)} {sch.asset_name}</div></td>
                    <td className="p-4">{sch.task_description}</td>
                    <td className="p-4">
                      {sch.status === "UPCOMING" && <Badge variant="outline" className="border-primary text-primary">Upcoming</Badge>}
                      {sch.status === "OVERDUE" && <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">Overdue</Badge>}
                      {sch.status === "COMPLETED" && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Completed</Badge>}
                    </td>
                    <td className="p-4 text-right">
                      {sch.status !== "COMPLETED" ? (
                        <Button variant="ghost" size="sm" onClick={() => markCompleted(sch.id)}>Complete</Button>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>Done</Button>
                      )}
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
          <DialogHeader onClose={() => setShowAdd(false)}><DialogTitle>Jadwalkan Preventive Maintenance</DialogTitle><DialogDescription>Buat jadwal pemeliharaan rutin untuk aset fasilitas.</DialogDescription></DialogHeader>
          <form ref={formRef} onSubmit={e => e.preventDefault()}>
            <DialogBody>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Kategori Aset" required>
                  <select name="asset_type" className={selectClassName} required><option value="">Pilih Kategori</option><option>AC</option><option>UPS</option><option>Network</option><option>Server</option><option>CCTV</option><option>APAR</option><option>KWH</option></select>
                </FormField>
                <FormField label="Tanggal Jadwal" required>
                  <input name="scheduled_date" type="date" className={inputClassName} required />
                </FormField>
              </div>
              <FormField label="Aset Target" required><input name="asset_name" className={inputClassName} placeholder="Contoh: Server Room A - AC Unit 1" required /></FormField>
              <FormField label="Deskripsi Tugas" required><textarea name="task_description" className={textareaClassName} placeholder="Jelaskan tugas maintenance yang akan dilakukan..." required /></FormField>
              <FormField label="Frekuensi" required>
                <select name="frequency" className={selectClassName} required><option value="">Pilih Frekuensi</option><option>Harian</option><option>Mingguan</option><option>Bulanan</option><option>Kuartalan</option><option>Tahunan</option></select>
              </FormField>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button onClick={handleSubmit}><Plus className="mr-2 h-4 w-4" /> Simpan Jadwal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
