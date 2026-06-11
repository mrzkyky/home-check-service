import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Cpu, Zap, Server, ShieldCheck, Videotape, Network, Flame, Activity } from "lucide-react";

export default function AssetsPage() {
  const assetTypes = [
    { name: "Air Conditioners", icon: Cpu, href: "/assets/ac", desc: "Manage AC units, monitoring, and PMs" },
    { name: "Servers", icon: Server, href: "/assets/servers", desc: "Physical and virtual servers" },
    { name: "Fire Extinguisher (APAR)", icon: Flame, href: "/assets/apar", desc: "Fire safety equipment & inspection" },
    { name: "KWH Meters", icon: Activity, href: "/assets/kwh", desc: "Electricity consumption monitoring" },
    { name: "UPS", icon: Zap, href: "/assets/ups", desc: "Uninterruptible Power Supplies" },
    { name: "CCTV", icon: Videotape, href: "/assets/cctv", desc: "Surveillance cameras" },
    { name: "Routers/Switches", icon: Network, href: "/assets/network", desc: "Network equipments" },
  ];

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Asset Management</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assetTypes.map((asset) => {
          const Icon = asset.icon;
          return (
            <Link key={asset.name} href={asset.href}>
              <Card className="hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer border-border/50 bg-background/50 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{asset.name}</CardTitle>
                    <CardDescription className="mt-1">{asset.desc}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
