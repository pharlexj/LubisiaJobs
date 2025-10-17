import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calculator, Search, Plus } from 'lucide-react';

export default function Vote() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: votes, isLoading } = useQuery({
    queryKey: ['/api/accountant/votes'],
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vote Management</h1>
          <p className="text-gray-600 mt-2">Manage budget vote accounts and allocations</p>
        </div>
        <Button data-testid="button-new-vote">
          <Plus className="w-4 h-4 mr-2" />
          New Vote Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 0</div>
            <p className="text-xs text-gray-500">Fiscal year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 0</div>
            <p className="text-xs text-gray-500">To vote accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Utilized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 0</div>
            <p className="text-xs text-gray-500">Spent amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 0</div>
            <p className="text-xs text-gray-500">Remaining</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vote Accounts</CardTitle>
          <CardDescription>All budget vote accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search vote accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-votes"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vote Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Utilized</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Utilization %</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Loading vote accounts...
                    </TableCell>
                  </TableRow>
                ) : !votes || votes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No vote accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  votes.map((vote: any) => (
                    <TableRow key={vote.id} data-testid={`row-vote-${vote.id}`}>
                      <TableCell className="font-medium">{vote.code}</TableCell>
                      <TableCell>{vote.description}</TableCell>
                      <TableCell>KES {vote.allocated.toLocaleString()}</TableCell>
                      <TableCell>KES {vote.utilized.toLocaleString()}</TableCell>
                      <TableCell>KES {vote.balance.toLocaleString()}</TableCell>
                      <TableCell>{vote.utilizationPercent}%</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" data-testid={`button-view-${vote.id}`}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
