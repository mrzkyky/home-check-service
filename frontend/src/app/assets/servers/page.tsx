"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Server, CheckCircle2, XCircle, AlertTriangle, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, FormField, inputClassName, selectClassName } from "@/components/ui/dialog";
import { apiFetch, submitForm } from "@/lib/api";

interface ServerItem {
  id: number;
  srv_id: string;
  hostname: string;
  os: string;
  cpu: string;
  ram: string;
  storage: string;
  status: string;
  branch_unit: string | null;
}

export default function ServersPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const fetchServers = () => {
    apiFetch<ServerItem[]>("/servers_master")
      .then(setServers)
      .catch(() => setServers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchServers(); }, []);

  const filtered = servers.filter(s => {
    const q = search.toLowerCase();
    return !q || s.hostname.toLowerCase().includes(q) || s.srv_id.toLowerCase().includes(q) || s.os.toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    await submitForm("/servers_master", {
      hostname: fd.get("hostname"),
      os: fd.get("os"),
      cpu: fd.get("cpu"),
      ram: fd.get("ram"),
      storage: fd.get("storage"),
      branch_unit: fd.get("branch_unit") || "Main Data Center",
    }, {
      successMsg: "Server added successfully!",
      onSuccess: () => { setShowAdd(false); fetchServers(); },
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "RUNNING": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><CheckCircle2 className="mr-1 h-3 w-3"/> Running</Badge>;
      case "STOPPED": return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20"><XCircle className="mr-1 h-3 w-3"/> Stopped</Badge>;
      case "MAINTENANCE": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><AlertTriangle className="mr-1 h-3 w-3"/> Maintenance</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const runningCount = servers.filter(s => s.status === "RUNNING").length;
  const maintenanceCount = servers.filter(s => s.status === "MAINTENANCE").length;

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Server Infrastructure</h2>
          <p className="text-muted-foreground mt-1">Monitor servers, resource utilization, and uptime status.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" /> Add Server</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Running</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-500">{runningCount}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Maintenance</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-500">{maintenanceCount}</div></CardContent></Card>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Servers</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{servers.length}</div></CardContent></Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between"><CardTitle>Server Registry</CardTitle><div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><input type="search" placeholder="Search servers..." value={search} onChange={e => setSearch(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm pl-9" /></div></div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="p-4 text-left text-muted-foreground font-medium w-28">Server ID</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-1/4">Host / OS</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-1/4">CPU & RAM</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-28">Storage</th>
                  <th className="p-4 text-left text-muted-foreground font-medium w-28">Status</th>
                  <th className="p-4 text-right text-muted-foreground font-medium w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading servers...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No servers found.</td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-mono font-medium text-primary">{s.srv_id}</td>
                    <td className="p-4"><div className="font-medium flex items-center gap-2"><Server className="h-4 w-4 text-blue-500"/>{s.hostname}</div><div className="text-xs text-muted-foreground">{s.os} • {s.branch_unit}</div></td>
                    <td className="p-4"><div>{s.cpu}</div><div className="text-xs text-muted-foreground">{s.ram}</div></td>
                    <td className="p-4"><div className="flex items-center gap-1"><HardDrive className="h-3 w-3 text-muted-foreground"/>{s.storage}</div></td>
                    <td className="p-4">{getStatusBadge(s.status)}</td>
                    <td className="p-4 text-right"><Button variant="ghost" size="sm">Monitor</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader onClose={() => setShowAdd(false)}><DialogTitle>Tambah Server Baru</DialogTitle><DialogDescription>Daftarkan server ke dalam sistem monitoring infrastruktur.</DialogDescription></DialogHeader>
          <form ref={formRef} onSubmit={e => e.preventDefault()}>
            <DialogBody>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Hostname" required><input name="hostname" className={inputClassName} placeholder="Contoh: prod-web-01" required /></FormField>
                <FormField label="Sistem Operasi" required>
                  <input name="os" list="os-options" className={inputClassName} placeholder="Pilih atau Ketik OS" required />
                  <datalist id="os-options">
                    <option value="Ubuntu 22.04" />
                    <option value="CentOS 8" />
                    <option value="Windows Server 2022" />
                    <option value="Debian 12" />
                  </datalist>
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="CPU" required><input name="cpu" className={inputClassName} placeholder="Contoh: Intel Xeon E5" required /></FormField>
                <FormField label="RAM" required>
                  <input name="ram" list="ram-options" className={inputClassName} placeholder="Pilih atau Ketik RAM" required />
                  <datalist id="ram-options">
                    <option value="16 GB" />
                    <option value="32 GB" />
                    <option value="64 GB" />
                    <option value="128 GB" />
                    <option value="256 GB" />
                  </datalist>
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Storage" required><input name="storage" className={inputClassName} placeholder="Contoh: 2 TB SSD" required /></FormField>
                <FormField label="Branch / Unit" required>
                  <input name="branch_unit" list="branch-options" className={inputClassName} placeholder="Contoh: Main Data Center" required />
                  <datalist id="branch-options">
                    <option value="Main Data Center" />
                    <option value="Jatinegara" />
                    <option value="Sudirman" />
                    <option value="Kuningan" />
                  </datalist>
                </FormField>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button onClick={handleSubmit}><Plus className="mr-2 h-4 w-4" /> Simpan Server</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
