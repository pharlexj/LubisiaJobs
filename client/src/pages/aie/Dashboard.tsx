import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, BookOpen, DollarSign, Calculator, TrendingUp } from 'lucide-react';

export default function AIEDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['/api/aie/stats'],
  });

  const statCards = [
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      icon: Clock,
      description: 'Awaiting your approval',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Approved Today',
      value: stats?.approvedToday || 0,
      icon: CheckCircle,
      description: 'Transactions approved',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active MIRs',
      value: stats?.activeMirs || 0,
      icon: BookOpen,
      description: 'Imprest outstanding',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Monthly Spend',
      value: `KES ${(stats?.monthlySpend || 0).toLocaleString()}`,
      icon: DollarSign,
      description: 'This month',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Budget Balance',
      value: `KES ${(stats?.budgetBalance || 0).toLocaleString()}`,
      icon: Calculator,
      description: 'Remaining budget',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Utilization Rate',
      value: `${stats?.utilizationRate || 0}%`,
      icon: TrendingUp,
      description: 'Budget utilization',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">A.I.E Holder Dashboard</h1>
        <p className="text-gray-600 mt-2">Approve financial transactions and monitor budget</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title} data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Transactions requiring your approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center py-8">
                No pending approvals
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent approval activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center py-8">
                No recent activity
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
