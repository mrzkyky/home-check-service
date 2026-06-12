"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle2, Clock, Ticket, History, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/FileUpload";
import Link from "next/link";
import { apiFetch, submitForm } from "@/lib/api";

interface TicketLog {
  id: number;
  action: string;
  details: string | null;
  timestamp: string;
}

interface TicketDetail {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  resolution_notes: string | null;
  resolution_photo_url: string | null;
  created_at: string;
  logs: TicketLog[];
}

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const fetchTicket = () => {
    apiFetch<TicketDetail>(`/tickets/${params.id}`)
      .then(data => {
        setTicket(data);
        setResolutionNotes(data.resolution_notes || "");
        setPhotoUrl(data.resolution_photo_url || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTicket();
  }, [params.id]);

  const updateStatus = async (newStatus: string) => {
    await submitForm(`/tickets/${params.id}`, {
      status: newStatus,
      resolution_notes: resolutionNotes || undefined,
      resolution_photo_url: photoUrl || undefined,
    }, {
      successMsg: `Ticket status updated to ${newStatus}`,
      onSuccess: fetchTicket
    });
  };

  if (loading) return <div className="p-8 text-center">Loading ticket details...</div>;
  if (!ticket) return <div className="p-8 text-center text-rose-500">Ticket not found.</div>;

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "CRITICAL": return "text-rose-500 border-rose-500/50";
      case "HIGH": return "text-orange-500 border-orange-500/50";
      case "MEDIUM": return "text-amber-500 border-amber-500/50";
      case "LOW": return "text-emerald-500 border-emerald-500/50";
      default: return "text-muted-foreground border-border/50";
    }
  };

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
            <h2 className="text-3xl font-bold tracking-tight">TKT-{ticket.id.toString().padStart(4, '0')}</h2>
            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">{ticket.status}</Badge>
            <Badge variant="outline" className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">{ticket.title} • Created at {new Date(ticket.created_at).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-2"><Ticket className="h-5 w-5 text-primary" /> Issue Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {ticket.description}
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
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  disabled={ticket.status === "RESOLVED" || ticket.status === "CLOSED"}
                ></textarea>
              </div>
              
              {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
                <div className="pt-4 border-t border-border/50">
                  <FileUpload 
                    label="Upload Resolution Evidence (Optional)"
                    onUploadSuccess={(url) => setPhotoUrl(url)}
                  />
                  {photoUrl && <p className="text-xs text-emerald-500 mt-2">Photo uploaded successfully.</p>}
                </div>
              )}

              {ticket.resolution_photo_url && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm font-medium mb-2">Resolution Photo</p>
                  <img src={ticket.resolution_photo_url} alt="Resolution" className="rounded-md border border-border/50 max-h-64 object-contain" />
                </div>
              )}

              {(ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") && (
                <div className="flex gap-4 pt-4">
                  {ticket.status === "OPEN" && (
                    <Button className="flex-1" variant="outline" onClick={() => updateStatus("IN PROGRESS")}>Mark In Progress</Button>
                  )}
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateStatus("RESOLVED")}><CheckCircle2 className="mr-2 h-4 w-4"/> Resolve Ticket</Button>
                </div>
              )}
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
                <p className="font-medium">{ticket.category}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Location</p>
                <p className="font-medium">{ticket.location}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Assigned Technician</p>
                <div className="flex items-center gap-2 mt-1">
                  {ticket.assigned_to ? (
                    <>
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{ticket.assigned_to.charAt(5)}</div>
                      <span className="font-medium">{ticket.assigned_to}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">Unassigned</span>
                  )}
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
                {ticket.logs.slice().reverse().map((log) => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-primary bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-border/50 bg-muted/20 shadow-sm">
                      <p className="text-xs text-primary font-semibold mb-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      <p className="text-sm"><span className="font-medium">{log.action}:</span> {log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
