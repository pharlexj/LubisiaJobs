import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Briefcase, Search, Download, Plus } from 'lucide-react';

export default function Budget() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: budgetData } = useQuery({
    queryKey: ['/api/accountant/budget'],
  });

  const departmentBudgets = [
    { name: 'Human Resources', allocated: 5000000, utilized: 3200000 },
    { name: 'Finance', allocated: 8000000, utilized: 5600000 },
    { name: 'Administration', allocated: 6000000, utilized: 4100000 },
    { name: 'ICT', allocated: 4500000, utilized: 2900000 },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget Planning</h1>
          <p className="text-gray-600 mt-2">Manage department budgets and allocations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-export-budget">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button data-testid="button-new-budget">
            <Plus className="w-4 h-4 mr-2" />
            New Budget
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {(budgetData?.totalBudget || 23500000).toLocaleString()}</div>
            <p className="text-xs text-gray-500">FY 2024/2025</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {(budgetData?.allocated || 23500000).toLocaleString()}</div>
            <p className="text-xs text-gray-500">100% of budget</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Utilized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {(budgetData?.utilized || 15800000).toLocaleString()}</div>
            <p className="text-xs text-gray-500">67% of budget</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {(budgetData?.remaining || 7700000).toLocaleString()}</div>
            <p className="text-xs text-gray-500">33% of budget</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Budgets</CardTitle>
          <CardDescription>Budget allocation and utilization by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-budget"
            />
          </div>

          <div className="space-y-6">
            {departmentBudgets.map((dept) => {
              const percentage = Math.round((dept.utilized / dept.allocated) * 100);
              return (
                <div key={dept.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{dept.name}</h3>
                      <p className="text-sm text-gray-500">
                        KES {dept.utilized.toLocaleString()} of KES {dept.allocated.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{percentage}%</div>
                      <div className="text-sm text-gray-500">utilized</div>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
