"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, Ticket, ShieldAlert, History, MessageSquare, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/FileUpload";
import Link from "next/link";

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState("IN PROGRESS");
  
  return (
    <div className="flex-1 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/ticketing">
          <Button variant="outline" size="icon" className="rounded-full bg-background/50 backdrop-blur-xl border-border/50">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">TKT-{params.id.padStart(4, '0')}</h2>
            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">{status}</Badge>
            <Badge variant="outline" className="text-rose-500 border-rose-500/50">CRITICAL</Badge>
          </div>
          <p className="text-muted-foreground mt-1">AC Compressor Failure • Created at 2026-06-11 10:00</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-2"><Ticket className="h-5 w-5 text-primary" /> Issue Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm leading-relaxed text-foreground/90">
                The main AC compressor in Server Room A has completely shut down. Temperature is rising rapidly. 
                Immediate action is required to prevent server overheating. Auto-assigned to Tech Budi.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Resolution Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Technician Notes</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-md bg-muted/50 border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                  placeholder="Enter resolution steps taken..."
                ></textarea>
              </div>
              
              <div className="pt-4 border-t border-border/50">
                <FileUpload 
                  label="Upload Resolution Evidence (MinIO)"
                  onUploadSuccess={(url) => console.log(url)}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button className="flex-1" variant="outline" onClick={() => setStatus("IN PROGRESS")}>Mark In Progress</Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setStatus("RESOLVED")}><CheckCircle2 className="mr-2 h-4 w-4"/> Resolve Ticket</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
            <CardHeader className="border-b border-border/50">
              <CardTitle>Ticket Info</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Category</p>
                <p className="font-medium">AC</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Location</p>
                <p className="font-medium">Server Room A (Jatinegara)</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Assigned Technician</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">B</div>
                  <span className="font-medium">Tech Budi</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/50 before:to-transparent">
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-primary bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-border/50 bg-muted/20 shadow-sm">
                    <p className="text-xs text-primary font-semibold mb-1">10:05</p>
                    <p className="text-sm">Auto-assigned to Tech Budi.</p>
                  </div>
                </div>
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-border/50 bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-border/50 bg-muted/20 shadow-sm">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">10:00</p>
                    <p className="text-sm">Ticket created.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
