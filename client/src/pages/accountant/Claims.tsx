import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: number;
  name: string;
  personalNumber: string;
  designation: string;
}

interface Vote {
  id: number;
  voteId: string;
  votedItems: string;
}

export default function Claims() {
  const { toast } = useToast();
  const [balance] = useState(0);

  const [formData, setFormData] = useState({
    voteId: '',
    voteAccount: '',
    aieHolderId: '',
    employeeIds: [] as string[],
    busFare: 0,
    taxiFare: 0,
    travelDate: new Date().toISOString().split('T')[0],
    returnDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reasonForPayment: '',
    station: '',
    venue: '',
    country: 'Kenya',
    checkNo: '',
    voucherNo: '',
  });

  const { data: claims = [], isLoading: claimsLoading } = useQuery<any[]>({
    queryKey: ['/api/accountant/claims'],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/accountant/employees'],
  });

  const { data: votes = [] } = useQuery<Vote[]>({
    queryKey: ['/api/accounting/votes'],
  });

  const createClaimMutation = useMutation({
    mutationFn: async (claimData: any) => {
      return await apiRequest('POST', '/api/accounting/transactions/claim', claimData);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Claim(s) created successfully!',
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/accountant/claims'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create claim',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/accounting/transactions/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Claim deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/accountant/claims'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete claim',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.employeeIds.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one payee',
        variant: 'destructive',
      });
      return;
    }

    const totalAmount = formData.busFare + formData.taxiFare;

    for (const employeeId of formData.employeeIds) {
      const employee = employees.find(e => e.id === parseInt(employeeId));
      await createClaimMutation.mutateAsync({
        fy: new Date().getFullYear().toString(),
        voteId: parseInt(formData.voteId),
        transactionType: 'claim',
        name: employee?.name || '',
        personalNo: employee?.personalNumber || '',
        particulars: formData.reasonForPayment,
        amounts: totalAmount,
        subsistence: 0,
        busFare: formData.busFare,
        taxiFare: formData.taxiFare,
        voucherNo: formData.voucherNo,
        dated: formData.travelDate,
        state: 'pending',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      voteId: '',
      voteAccount: '',
      aieHolderId: '',
      employeeIds: [],
      busFare: 0,
      taxiFare: 0,
      travelDate: new Date().toISOString().split('T')[0],
      returnDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reasonForPayment: '',
      station: '',
      venue: '',
      country: 'Kenya',
      checkNo: '',
      voucherNo: '',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this claim?')) return;
    deleteMutation.mutate(id);
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(employeeId)
        ? prev.employeeIds.filter(id => id !== employeeId)
        : [...prev.employeeIds, employeeId]
    }));
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Claim Form */}
        <div>
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
            <h3 className="text-lg font-semibold">
              Available Balance: Ksh. <span className="font-bold">{balance.toLocaleString()}</span>
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-b-lg p-6 space-y-4">
            {/* Vote Selection Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Voted</label>
                <select
                  required
                  value={formData.voteId}
                  onChange={(e) => setFormData({ ...formData, voteId: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  data-testid="select-vote"
                >
                  <option value="">Select Vote</option>
                  {votes.map(vote => (
                    <option key={vote.id} value={vote.id}>{vote.voteId} - {vote.votedItems}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Vote Account</label>
                <select
                  value={formData.voteAccount}
                  onChange={(e) => setFormData({ ...formData, voteAccount: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  data-testid="select-vote-account"
                >
                  <option value="">Select Account</option>
                  <option value="221001">221001</option>
                  <option value="221002">221002</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">AIE Holder</label>
                <select
                  value={formData.aieHolderId}
                  onChange={(e) => setFormData({ ...formData, aieHolderId: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  data-testid="select-aie-holder"
                >
                  <option value="">Select AIE Holder</option>
                  {employees.filter(e => e.designation && e.designation.toLowerCase().includes('holder')).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payee Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Payee (Select Multiple)</label>
              <div className="border border-gray-300 rounded p-3 max-h-40 overflow-y-auto bg-gray-50">
                {employees.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2 py-1 hover:bg-gray-100 px-2 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.employeeIds.includes(emp.id.toString())}
                      onChange={() => toggleEmployeeSelection(emp.id.toString())}
                      className="rounded border-gray-300"
                      data-testid={`checkbox-employee-${emp.id}`}
                    />
                    <span className="text-sm">{emp.name} - {emp.personalNumber}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Selected: {formData.employeeIds.length} payee(s)</p>
            </div>

            {/* Travel Costs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bus Fare (Ksh)</label>
                <input
                  type="number"
                  value={formData.busFare}
                  onChange={(e) => setFormData({ ...formData, busFare: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  data-testid="input-bus-fare"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Taxi (Ksh)</label>
                <input
                  type="number"
                  value={formData.taxiFare}
                  onChange={(e) => setFormData({ ...formData, taxiFare: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  data-testid="input-taxi-fare"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Travel</label>
                <input
                  type="date"
                  required
                  value={formData.travelDate}
                  onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  data-testid="input-travel-date"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Return Date</label>
                <input
                  type="date"
                  required
                  value={formData.returnDate}
                  onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  data-testid="input-return-date"
                />
              </div>
            </div>

            {/* Travel Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Payment</label>
                <input
                  type="text"
                  required
                  value={formData.reasonForPayment}
                  onChange={(e) => setFormData({ ...formData, reasonForPayment: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Training or Conference or Official Meeting"
                  data-testid="input-reason"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Station (Town/City)</label>
                <input
                  type="text"
                  required
                  value={formData.station}
                  onChange={(e) => setFormData({ ...formData, station: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Name of Town or City"
                  data-testid="input-station"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Venue (Hotel/Club/Restaurant)</label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Name of Venue"
                  data-testid="input-venue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  data-testid="select-country"
                >
                  <option value="Kenya">Kenya</option>
                  <option value="Uganda">Uganda</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Rwanda">Rwanda</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Check #</label>
                <input
                  type="text"
                  value={formData.checkNo}
                  onChange={(e) => setFormData({ ...formData, checkNo: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Cheque No"
                  data-testid="input-check-no"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Voucher #</label>
                <input
                  type="text"
                  value={formData.voucherNo}
                  onChange={(e) => setFormData({ ...formData, voucherNo: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Voucher No"
                  data-testid="input-voucher-no"
                />
              </div>
            </div>

            {/* Total Amount Display */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded">
              <p className="text-sm font-semibold text-blue-900">
                Total Amount: Ksh. {(formData.busFare + formData.taxiFare).toLocaleString()}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formData.employeeIds.length === 0 || createClaimMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
              data-testid="button-process-claim"
            >
              {createClaimMutation.isPending ? 'Processing...' : 'Process Claim'}
            </button>
          </form>
        </div>

        {/* RIGHT: Claims List */}
        <div>
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-lg">
            <h3 className="text-lg font-semibold">Claims by the following</h3>
          </div>

          <div className="bg-white shadow-lg rounded-b-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Payee</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {claimsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          Loading claims...
                        </div>
                      </td>
                    </tr>
                  ) : claims.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                        No claims found. Create your first claim!
                      </td>
                    </tr>
                  ) : (
                    claims.map((claim: any, idx: number) => (
                      <tr key={claim.id} className="hover:bg-gray-50" data-testid={`row-claim-${claim.id}`}>
                        <td className="px-3 py-2 text-xs">{idx + 1}</td>
                        <td className="px-3 py-2 text-xs">{new Date(claim.dated || claim.createdAt).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-xs font-medium">{claim.name || 'N/A'}</td>
                        <td className="px-3 py-2 text-xs">{claim.particulars || '-'}</td>
                        <td className="px-3 py-2 text-xs font-semibold">Ksh. {parseFloat(claim.amounts || 0).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            claim.state === 'approved' ? 'bg-green-100 text-green-800' :
                            claim.state === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {claim.state}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleDelete(claim.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete claim"
                            data-testid={`button-delete-${claim.id}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
