import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navigation from '@/components/layout/Navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash } from 'lucide-react';

export default function Vote() {
  const [bulkResult, setBulkResult] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data: votes, isLoading } = useQuery<any[]>({ queryKey: ['/api/accountant/votes'] });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/accounting/vote-accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/accountant/votes'] }),
  });

  const bulkMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/accounting/vote-accounts/bulk', { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Bulk import failed');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/accountant/votes'] });
      setBulkResult(data);
      alert('Bulk import completed');
    },
    onError: (err: any) => alert(err?.message || 'Bulk import failed'),
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <div className="flex">
        <Sidebar userRole="accountant" />
        <main className="flex-1">
          <div className="container mx-auto p-6">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8">
                <div className="rounded-lg overflow-hidden shadow-sm">
                  <div className="px-6 py-4 bg-amber-700 text-white">
                    <h2 className="text-lg font-semibold">Votes</h2>
                  </div>
                  <div className="bg-white p-6">
                    <div className="min-h-[200px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Vote Type</TableHead>
                            <TableHead>Vote ID</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading votes...</TableCell>
                            </TableRow>
                          ) : !votes || votes.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">No votes found. Add your first vote!</TableCell>
                            </TableRow>
                          ) : (
                            votes.map((vote: any, idx: number) => (
                              <TableRow key={vote.id}>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell>{vote.description || vote.code}</TableCell>
                                <TableCell>{vote.fiscalYear || '-'}</TableCell>
                                <TableCell>{vote.code}</TableCell>
                                <TableCell className="flex gap-2">
                                  <Button size="sm" variant="outline">View</Button>
                                  <Button size="sm" variant="destructive" onClick={() => { if (!confirm('Delete this vote account?')) return; deleteMutation.mutate(vote.id); }}>
                                    <Trash className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4">
                <div className="rounded-lg overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 bg-red-600 text-white">
                    <div className="font-semibold">Upload Excel File</div>
                    <a href="/api/accounting/vote-accounts/template" className="inline-flex items-center gap-2 bg-white text-red-600 px-3 py-1 rounded-md text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
                      Template
                    </a>
                  </div>
                  <div className="bg-white p-4">
                    <p className="text-sm text-gray-600">Download the template, fill it with vote data, then upload here.</p>
                    <div className="mt-4">
                      <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400">
                        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; bulkMutation.mutate(f); }} data-testid="input-bulk-upload" />
                        <div className="flex flex-col items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0l-4-4m4 4l4-4M21 12v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6" /></svg>
                          <div className="text-sm text-gray-500">Click to upload Excel file</div>
                          <div className="text-xs text-gray-400">.xlsx, .xls, .xlsm</div>
                        </div>
                      </label>
                    </div>
                    {bulkResult && (
                      <div className="mt-4 bg-gray-50 p-3 rounded">
                        <div className="text-sm">Imported: {bulkResult.created || bulkResult.createdCount || 0} / {bulkResult.total || 0}</div>
                        {bulkResult.errors && <div className="text-xs text-red-600 mt-2">Errors: {JSON.stringify(bulkResult.errors)}</div>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
