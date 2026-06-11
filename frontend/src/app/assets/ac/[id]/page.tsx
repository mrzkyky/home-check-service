"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Thermometer, Droplets, Camera, CheckSquare, Settings2, Activity, ShieldCheck, History } from "lucide-react";
import { useState } from "react";
import { FileUpload } from "@/components/ui/FileUpload";

export default function ACDetailPage() {
  const params = useParams();
  const id = params.id;

  const [activeTab, setActiveTab] = useState("monitoring");

  return (
    <div className="flex-1 space-y-6">
      {/* Header Info */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">DKN-2023-X9821</h2>
            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Active</Badge>
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Jatinegara • Server Room A • Daikin 3 PK Cassette
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setActiveTab("history")}><History className="mr-2 h-4 w-4" /> Audit History</Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-border/50 pb-px">
        <Button 
          variant="ghost" 
          className={`rounded-none border-b-2 ${activeTab === 'monitoring' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('monitoring')}
        >
          <Activity className="mr-2 h-4 w-4" /> Daily Monitoring
        </Button>
        <Button 
          variant="ghost" 
          className={`rounded-none border-b-2 ${activeTab === 'pm' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('pm')}
        >
          <Settings2 className="mr-2 h-4 w-4" /> Preventive Maintenance
        </Button>
        <Button 
          variant="ghost" 
          className={`rounded-none border-b-2 ${activeTab === 'approval' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('approval')}
        >
          <ShieldCheck className="mr-2 h-4 w-4" /> Approvals
        </Button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'monitoring' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Submit Daily Monitoring</CardTitle>
              <CardDescription>Record temperature, humidity, and unit status today.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Temperature (°C)</label>
                  <div className="relative">
                    <Thermometer className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input type="number" className="flex h-10 w-full rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm pl-9" placeholder="18.0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Humidity (%)</label>
                  <div className="relative">
                    <Droplets className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input type="number" className="flex h-10 w-full rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm pl-9" placeholder="45.0" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Status</label>
                <select className="flex h-10 w-full rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm">
                  <option>Normal</option>
                  <option>Alarm</option>
                  <option>Down</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Technician Notes</label>
                <textarea className="flex min-h-[80px] w-full rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm" placeholder="Any abnormal sounds or issues?"></textarea>
              </div>
              <Button className="w-full">Submit Monitoring</Button>
            </CardContent>
          </Card>

          {/* Monitoring History Chart could go here */}
          <div className="border border-dashed border-border/50 rounded-xl flex items-center justify-center p-8 text-muted-foreground">
            Monitoring history charts will be rendered here
          </div>
        </div>
      )}

      {activeTab === 'pm' && (
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Submit Preventive Maintenance (PM)</CardTitle>
            <CardDescription>Fill in the comprehensive checklist and upload evidence photos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2"><CheckSquare className="h-5 w-5 text-primary" /> Comprehensive Checklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-border/50">
                {['Filter', 'Evaporator', 'Condenser', 'Drainage', 'Fan Motor', 'Refrigerant', 'Electrical Terminal'].map((item) => (
                  <div key={item} className="flex items-center justify-between p-2 rounded hover:bg-muted/40 transition-colors">
                    <span className="text-sm">{item} Condition</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="cursor-pointer hover:bg-emerald-500/20 hover:text-emerald-500 hover:border-emerald-500">OK</Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-rose-500/20 hover:text-rose-500 hover:border-rose-500">Needs Repair</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photos Dropzone (MinIO Integration) */}
            <div className="pt-4 border-t border-border/50">
              <h4 className="font-medium text-sm mb-4">Documentation (MinIO Storage)</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <FileUpload 
                  label="Before Maintenance Photo" 
                  onUploadSuccess={(url) => console.log("Before URL:", url)} 
                />
                <FileUpload 
                  label="After Maintenance Photo" 
                  onUploadSuccess={(url) => console.log("After URL:", url)} 
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-border/50">
              <Button className="w-full md:w-auto">Submit PM to Supervisor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'approval' && (
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl max-w-2xl">
          <CardHeader>
            <CardTitle>Supervisor Approval</CardTitle>
            <CardDescription>Review the latest PM submission.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/20 rounded-lg border border-border/50 space-y-2">
              <p className="text-sm text-muted-foreground">Status: <Badge className="bg-amber-500/10 text-amber-500">Pending Review</Badge></p>
              <p className="text-sm text-muted-foreground">Submitted by: Technician Budi (2 hours ago)</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Supervisor Notes</label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm" placeholder="Reason for approval or rejection..."></textarea>
            </div>
            <div className="flex gap-4">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Approve PM</Button>
              <Button variant="destructive">Reject</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
