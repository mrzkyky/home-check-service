"use client";

import { useState } from "react";
import { ShieldCheck, Server, History, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ApprovalCenterPage() {
  const [activeTab, setActiveTab] = useState("pending");

  const approvals = [
    { id: 101, type: "Server Access Permit", title: "VendorX IT - Data Center A", requester: "John Doe", date: "2026-06-12", status: "PENDING" },
    { id: 102, type: "Server Access Permit", title: "FiberCore Tech - Network Room B", requester: "Jane Smith", date: "2026-06-11", status: "APPROVED" },
    { id: 103, type: "APAR Inspection", title: "APAR Lobby Utama", requester: "Tech Rudi", date: "2026-06-10", status: "REJECTED" }
  ];

  const filteredApprovals = approvals.filter(a => a.status.toLowerCase() === activeTab);

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
          className={`rounded-none border-b-2 ${activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('pending')}
        >
          <ShieldCheck className="mr-2 h-4 w-4" /> Pending
          <Badge className="ml-2 bg-amber-500/20 text-amber-500">1</Badge>
        </Button>
        <Button 
          variant="ghost" 
          className={`rounded-none border-b-2 ${activeTab === 'approved' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('approved')}
        >
          <Check className="mr-2 h-4 w-4" /> Approved
        </Button>
        <Button 
          variant="ghost" 
          className={`rounded-none border-b-2 ${activeTab === 'rejected' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('rejected')}
        >
          <X className="mr-2 h-4 w-4" /> Rejected
        </Button>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-muted/30 border-b border-border/50">
              <tr>
                <th className="p-4 text-left text-muted-foreground font-medium">Type</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Request Details</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Requester</th>
                <th className="p-4 text-left text-muted-foreground font-medium">Date</th>
                <th className="p-4 text-right text-muted-foreground font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApprovals.map(app => (
                <tr key={app.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-4">
                    <Badge variant="outline" className="border-primary/50 text-primary">{app.type}</Badge>
                  </td>
                  <td className="p-4 font-medium">{app.title}</td>
                  <td className="p-4">{app.requester}</td>
                  <td className="p-4">{app.date}</td>
                  <td className="p-4 text-right">
                    {app.status === "PENDING" ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
                        <Button size="sm" variant="destructive">Reject</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-muted-foreground"><History className="mr-2 h-4 w-4"/> View Logs</Button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredApprovals.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No {activeTab} approvals found.</td>
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
