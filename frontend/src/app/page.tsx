import { StatCard } from "@/components/dashboard/StatCard";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { 
  Activity, 
  CheckCircle2, 
  ServerCrash, 
  Ticket, 
  ShieldAlert 
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <div className="flex items-center space-x-2">
          {/* We can add date pickers or export buttons here */}
        </div>
      </div>
      
      {/* Top Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="SLA Compliance"
          value="99.8%"
          icon={Activity}
          trend={{ value: 0.2, isPositive: true }}
          description="Target > 99.5%"
        />
        <StatCard
          title="PM Completion"
          value="85%"
          icon={CheckCircle2}
          trend={{ value: 5, isPositive: true }}
          description="15 pending schedules"
        />
        <StatCard
          title="Asset Health Alerts"
          value="12"
          icon={ServerCrash}
          trend={{ value: 2, isPositive: false }}
          description="Assets require attention"
        />
        <StatCard
          title="Open Tickets"
          value="24"
          icon={Ticket}
          trend={{ value: 4, isPositive: true }}
          description="10 Incident, 14 CM"
        />
        <StatCard
          title="Pending Approvals"
          value="5"
          icon={ShieldAlert}
          description="Access request to NOC"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <div className="col-span-4">
          <OverviewChart />
        </div>
        
        {/* Recent Activity / Secondary Card */}
        <div className="col-span-3">
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="font-semibold leading-none tracking-tight">Recent Incident Tickets</h3>
            </div>
            <div className="p-6 pt-0">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="size-9 rounded-full bg-red-100 flex items-center justify-center">
                      <Ticket className="size-4 text-red-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        AC Server Room Down
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pop Jatinegara • 2 hours ago
                      </p>
                    </div>
                    <div className="font-medium text-sm text-amber-600">
                      Open
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
