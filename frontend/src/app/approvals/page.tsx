"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, History, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch, apiPut } from "@/lib/api";
import { toast } from "sonner";

interface PermitApproval {
  id: number;
  type: string;
  visitor_name: string;
  room: string;
  permit_date: string;
  status: string;
}

export default function ApprovalCenterPage() {
  const [activeTab, setActiveTab] = useState("PENDING");
  const [approvals, setApprovals] = useState<PermitApproval[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = () => {
    apiFetch<any[]>("/servers/permits")
      .then(data => {
        const mapped = data.map(p => ({
          id: p.id,
          type: "Server Access Permit",
          visitor_name: p.visitor_name,
          room: p.room,
          permit_date: new Date(p.permit_date).toLocaleDateString(),
          status: p.status
        }));
        setApprovals(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleApprove = async (id: number, newStatus: string) => {
    try {
      await apiPut(`/servers/permits/${id}/approve`, { status: newStatus });
      toast.success(`Permit ${newStatus.toLowerCase()} successfully`);
      fetchApprovals();
    } catch (err: any) {
      toast.error(err.message || "Approval failed");
    }
  };

  const filteredApprovals = approvals.filter(a => a.status === activeTab);
  const pendingCount = approvals.filter(a => a.status === "PENDING").length;

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Approval Center</h2>
          <p className="text-muted-foreground mt-1">Centralized hub for all supervisor approvals.</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-border/50 pb-px">
        <Button 
          variant="ghost" 
          className={`rounded-none border-b-2 ${activeTab === 'PENDING' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('PENDING')}
        >
          <ShieldCheck className="mr-2 h-4 w-4" /> Pending
          <Badge className="ml-2 bg-amber-500/20 text-amber-500">{pendingCount}</Badge>
        </Button>
        <Button 
          variant="ghost" 
          className={`rounded-none border-b-2 ${activeTab === 'APPROVED' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('APPROVED')}
        >
          <Check className="mr-2 h-4 w-4" /> Approved
        </Button>
        <Button 
          variant="ghost" 
          className={`rounded-none border-b-2 ${activeTab === 'REJECTED' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('REJECTED')}
        >
          <X className="mr-2 h-4 w-4" /> Rejected
        </Button>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="p-4 text-left text-muted-foreground font-medium w-48">Type</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Request Details</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Requester</th>
                <th className="p-4 text-left text-muted-foreground font-medium w-32">Date</th>
                <th className="p-4 text-right text-muted-foreground font-medium w-48">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading approvals...</td></tr>
              ) : filteredApprovals.map(app => (
                <tr key={app.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-4">
                    <Badge variant="outline" className="border-primary/50 text-primary">{app.type}</Badge>
                  </td>
                  <td className="p-4 font-medium">{app.room}</td>
                  <td className="p-4">{app.visitor_name}</td>
                  <td className="p-4">{app.permit_date}</td>
                  <td className="p-4 text-right">
                    {app.status === "PENDING" ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(app.id, 'APPROVED')}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleApprove(app.id, 'REJECTED')}>Reject</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-muted-foreground" disabled><History className="mr-2 h-4 w-4"/> View Logs</Button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filteredApprovals.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No {activeTab.toLowerCase()} approvals found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
