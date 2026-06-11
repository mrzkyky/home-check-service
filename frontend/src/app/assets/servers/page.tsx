"use client";

import { useState } from "react";
import { Server, ShieldCheck, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ServerRoomsPage() {
  const [activeTab, setActiveTab] = useState("rooms");

  const rooms = [
    { id: 1, branch: "Jatinegara", name: "Data Center A", temp: "20.5", humidity: "45", status: "Normal" },
    { id: 2, branch: "Sudirman", name: "Network Room B", temp: "22.0", humidity: "50", status: "Normal" }
  ];

  const permits = [
    { id: 101, visitor: "John Doe", company: "VendorX IT", room: "Data Center A", date: "2026-06-12", status: "PENDING" },
    { id: 102, visitor: "Jane Smith", company: "FiberCore Tech", room: "Network Room B", date: "2026-06-11", status: "APPROVED" }
  ];

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Server Rooms & Access</h2>
          <p className="text-muted-foreground mt-1">Manage server rooms, inspections, and visitor access permits.</p>
        </div>
        <div className="flex items-center space-x-2">
          {activeTab === "permits" && <Button><Plus className="mr-2 h-4 w-4" /> Request Permit</Button>}
          {activeTab === "rooms" && <Button><Plus className="mr-2 h-4 w-4" /> Add Room</Button>}
        </div>
      </div>

      <div className="flex space-x-2 border-b border-border/50 pb-px">
        <Button 
          variant="ghost" 
          className={`rounded-none border-b-2 ${activeTab === 'rooms' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('rooms')}
        >
          <Server className="mr-2 h-4 w-4" /> Server Rooms
        </Button>
        <Button 
          variant="ghost" 
          className={`rounded-none border-b-2 ${activeTab === 'permits' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setActiveTab('permits')}
        >
          <ShieldCheck className="mr-2 h-4 w-4" /> Access Permits
        </Button>
      </div>

      {activeTab === "rooms" && (
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Registered Rooms</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="p-4 text-left text-muted-foreground font-medium">Room Name</th>
                  <th className="p-4 text-left text-muted-foreground font-medium">Branch</th>
                  <th className="p-4 text-left text-muted-foreground font-medium">Last Temp/Hum</th>
                  <th className="p-4 text-left text-muted-foreground font-medium">Status</th>
                  <th className="p-4 text-right text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4 font-medium flex items-center gap-2"><Server className="h-4 w-4 text-primary"/> {room.name}</td>
                    <td className="p-4">{room.branch}</td>
                    <td className="p-4">{room.temp}°C / {room.humidity}%</td>
                    <td className="p-4">
                      <Badge className="bg-emerald-500/10 text-emerald-500">{room.status}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm">Inspect</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeTab === "permits" && (
        <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Permit Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="p-4 text-left text-muted-foreground font-medium">Visitor</th>
                  <th className="p-4 text-left text-muted-foreground font-medium">Target Room</th>
                  <th className="p-4 text-left text-muted-foreground font-medium">Date</th>
                  <th className="p-4 text-left text-muted-foreground font-medium">Status</th>
                  <th className="p-4 text-right text-muted-foreground font-medium">Workflow</th>
                </tr>
              </thead>
              <tbody>
                {permits.map(permit => (
                  <tr key={permit.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-4">
                      <div className="font-medium">{permit.visitor}</div>
                      <div className="text-xs text-muted-foreground">{permit.company}</div>
                    </td>
                    <td className="p-4">{permit.room}</td>
                    <td className="p-4">{permit.date}</td>
                    <td className="p-4">
                      <Badge variant="outline" className={
                        permit.status === 'APPROVED' ? 'border-emerald-500 text-emerald-500' : 'border-amber-500 text-amber-500'
                      }>
                        {permit.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      {permit.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"><CheckCircle className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"><XCircle className="h-4 w-4" /></Button>
                        </div>
                      )}
                      {permit.status !== "PENDING" && (
                        <Button variant="ghost" size="sm" className="text-muted-foreground"><Clock className="mr-2 h-4 w-4"/> Audit Trail</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
