"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Filter, Cpu, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, FormField, inputClassName, selectClassName } from "@/components/ui/dialog";
import Link from "next/link";
import { apiFetch, submitForm } from "@/lib/api";

interface AC {
  id: number;
  branch_unit: string;
  room: string;
  function: string;
  brand: string;
  type: string;
  capacity: string;
  serial_number: string | null;
}

export default function ACAssetsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [acs, setAcs] = useState<AC[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const fetchAcs = () => {
    apiFetch<AC[]>("/ac")
      .then(setAcs)
      .catch(() => setAcs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAcs(); }, []);

  const filtered = acs.filter(ac => {
    const q = search.toLowerCase();
    const sn = ac.serial_number || "";
    return !q || sn.toLowerCase().includes(q) || ac.room.toLowerCase().includes(q) || ac.branch_unit.toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    await submitForm("/ac", {
      branch_unit: fd.get("branch_unit"),
      room: fd.get("room"),
      brand: fd.get("brand"),
      type: fd.get("type"),
      capacity: fd.get("capacity"),
      function: fd.get("function"),
      serial_number: fd.get("serial_number"),
    }, {
      successMsg: "AC asset added successfully!",
      onSuccess: () => { setShowAdd(false); fetchAcs(); },
    });
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Air Conditioners</h2>
          <p className="text-muted-foreground mt-1">Manage AC assets, daily monitoring, and preventive maintenance.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
          <Button onClick={() => setShowAdd(true)}><Plus className="mr-2 h-4 w-4" /> Add AC Asset</Button>
        </div>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>AC Master Data</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input type="search" placeholder="Search by serial or room..." value={search} onChange={e => setSearch(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="p-4 text-left font-medium text-muted-foreground w-1/4">Serial Number</th>
                  <th className="p-4 text-left font-medium text-muted-foreground w-1/4">Location</th>
                  <th className="p-4 text-left font-medium text-muted-foreground w-1/4">Brand & Type</th>
                  <th className="p-4 text-left font-medium text-muted-foreground w-28">Function</th>
                  <th className="p-4 text-right font-medium text-muted-foreground w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading AC Data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No AC assets found.</td></tr>
                ) : filtered.map((ac) => (
                  <tr key={ac.id} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" />{ac.serial_number || "-"}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col"><span className="font-medium">{ac.branch_unit}</span><span className="text-xs text-muted-foreground">{ac.room}</span></div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col"><span>{ac.brand}</span><span className="text-xs text-muted-foreground">{ac.type} • {ac.capacity}</span></div>
                    </td>
                    <td className="p-4">
                      <Badge variant={ac.function === "Main" ? "default" : "secondary"} className={ac.function === "Main" ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}>{ac.function}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/assets/ac/${ac.id}`}>
                        <Button variant="ghost" size="sm" className="hover:text-primary"><Settings2 className="mr-2 h-4 w-4" /> Manage</Button>
                      </Link>
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
            <DialogTitle>Tambah Unit AC Baru</DialogTitle>
            <DialogDescription>Daftarkan unit AC baru ke dalam sistem monitoring.</DialogDescription>
          </DialogHeader>
          <form ref={formRef} onSubmit={e => e.preventDefault()}>
            <DialogBody>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Cabang" required>
                  <input name="branch_unit" list="branch-options" className={inputClassName} placeholder="Pilih atau Ketik Cabang" required />
                  <datalist id="branch-options">
                    <option value="Jatinegara" />
                    <option value="Sudirman" />
                    <option value="Kuningan" />
                  </datalist>
                </FormField>
                <FormField label="Ruangan" required>
                  <input name="room" className={inputClassName} placeholder="Contoh: Server Room A" required />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Brand" required>
                  <input name="brand" list="brand-options" className={inputClassName} placeholder="Pilih atau Ketik Brand" required />
                  <datalist id="brand-options">
                    <option value="Daikin" />
                    <option value="Panasonic" />
                    <option value="Gree" />
                    <option value="Samsung" />
                  </datalist>
                </FormField>
                <FormField label="Tipe" required>
                  <input name="type" list="type-options" className={inputClassName} placeholder="Pilih atau Ketik Tipe" required />
                  <datalist id="type-options">
                    <option value="Cassette" />
                    <option value="Split Wall" />
                    <option value="Standing Floor" />
                    <option value="Ducting" />
                  </datalist>
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Kapasitas" required>
                  <input name="capacity" list="capacity-options" className={inputClassName} placeholder="Pilih atau Ketik PK" required />
                  <datalist id="capacity-options">
                    <option value="1 PK" />
                    <option value="1.5 PK" />
                    <option value="2 PK" />
                    <option value="3 PK" />
                    <option value="5 PK" />
                  </datalist>
                </FormField>
                <FormField label="Fungsi" required>
                  <input name="function" list="function-options" className={inputClassName} placeholder="Pilih atau Ketik Fungsi" required />
                  <datalist id="function-options">
                    <option value="Main" />
                    <option value="Backup" />
                  </datalist>
                </FormField>
              </div>
              <FormField label="Serial Number (Opsional)">
                <input name="serial_number" className={inputClassName} placeholder="Contoh: DKN-2023-X9821" />
              </FormField>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button onClick={handleSubmit}><Plus className="mr-2 h-4 w-4" /> Simpan AC</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
