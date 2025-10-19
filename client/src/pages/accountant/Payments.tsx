import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Trash2, X } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PaymentParticular {
  id: string;
  description: string;
  amount: number;
}

interface Employee {
  id: number;
  name: string;
  personalNumber: string;
}

interface Vote {
  id: number;
  voteId: string;
  votedItems: string;
}

export default function Payments() {
  const { toast } = useToast();
  const [balance] = useState(0);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    voteId: '',
    voteAccount: '',
    aieHolderId: '',
    merchandise: '',
    checkNo: '001',
    voucherNo: '001',
  });

  const [particulars, setParticulars] = useState<PaymentParticular[]>([
    { id: '1', description: '', amount: 0 }
  ]);

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: ['/api/accountant/payments'],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/accountant/employees'],
  });

  const { data: votes = [] } = useQuery<Vote[]>({
    queryKey: ['/api/accounting/votes'],
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return await apiRequest('POST', '/api/accounting/transactions/payment', paymentData);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Payment created successfully!',
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/accountant/payments'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/accounting/transactions/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Payment deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/accountant/payments'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete payment',
        variant: 'destructive',
      });
    },
  });

  const addParticular = () => {
    setParticulars([
      ...particulars,
      { id: Date.now().toString(), description: '', amount: 0 }
    ]);
  };

  const removeParticular = (id: string) => {
    if (particulars.length > 1) {
      setParticulars(particulars.filter(p => p.id !== id));
    }
  };

  const updateParticular = (id: string, field: 'description' | 'amount', value: string | number) => {
    setParticulars(particulars.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const getTotalAmount = () => {
    return particulars.reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalAmount = getTotalAmount();
    const employee = employees.find(e => e.id === parseInt(formData.merchandise));
    
    // Combine all particulars into a single description
    const particularsList = particulars.map(p => p.description).filter(d => d).join('; ');

    const paymentData = {
      fy: new Date().getFullYear().toString(),
      voteId: parseInt(formData.voteId),
      transactionType: 'payment',
      name: employee?.name || '',
      personalNo: employee?.personalNumber || '',
      particulars: particularsList,
      amounts: totalAmount,
      subsistence: 0,
      busFare: 0,
      taxiFare: 0,
      voucherNo: formData.voucherNo,
      dated: formData.date,
      state: 'pending',
    };

    createPaymentMutation.mutate(paymentData);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      voteId: '',
      voteAccount: '',
      aieHolderId: '',
      merchandise: '',
      checkNo: '001',
      voucherNo: '001',
    });
    setParticulars([{ id: '1', description: '', amount: 0 }]);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Payment Form */}
        <div>
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
            <h3 className="text-lg font-semibold">
              Available Balance: Ksh. <span className="font-bold">{balance.toLocaleString()}</span>
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-b-lg p-6 space-y-4">
            {/* Date and Selectors Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  data-testid="input-payment-date"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Vote</label>
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

              <div>
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

            {/* Merchandise and Document Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Merchandise/Payee</label>
                <select
                  required
                  value={formData.merchandise}
                  onChange={(e) => setFormData({ ...formData, merchandise: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  data-testid="select-merchandise"
                >
                  <option value="">Select Merchandise</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} - {emp.personalNumber}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Check #</label>
                <input
                  type="text"
                  value={formData.checkNo}
                  onChange={(e) => setFormData({ ...formData, checkNo: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="001"
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
                  placeholder="001"
                  data-testid="input-voucher-no"
                />
              </div>
            </div>

            {/* Particulars Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-700">Particulars</label>
                <button
                  type="button"
                  onClick={addParticular}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  data-testid="button-add-particular"
                >
                  <Plus size={14} /> Add Row
                </button>
              </div>

              <div className="border border-gray-300 rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 w-12">#</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Particulars</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 w-32">Amount (Ksh)</th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {particulars.map((particular, idx) => (
                      <tr key={particular.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 text-xs">{idx + 1}</td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            required
                            value={particular.description}
                            onChange={(e) => updateParticular(particular.id, 'description', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="Enter description of item being paid for..."
                            data-testid={`input-particular-desc-${idx}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            required
                            step="0.01"
                            value={particular.amount}
                            onChange={(e) => updateParticular(particular.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            placeholder="0.00"
                            data-testid={`input-particular-amount-${idx}`}
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeParticular(particular.id)}
                            disabled={particulars.length === 1}
                            className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                            data-testid={`button-remove-particular-${idx}`}
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 border-t">
                    <tr>
                      <td colSpan={2} className="px-2 py-2 text-xs font-semibold text-gray-700 text-right">
                        Total Amount:
                      </td>
                      <td className="px-2 py-2 text-xs font-bold text-blue-900" colSpan={2}>
                        Ksh. {getTotalAmount().toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={createPaymentMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
              data-testid="button-process-payment"
            >
              {createPaymentMutation.isPending ? 'Processing...' : 'Process Payment'}
            </button>
          </form>
        </div>

        {/* RIGHT: Payments List */}
        <div>
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-lg">
            <h3 className="text-lg font-semibold">Payments to the following</h3>
          </div>

          <div className="bg-white shadow-lg rounded-b-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-200px)]">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Payee</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Reference</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paymentsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          Loading payments...
                        </div>
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                        No payments found. Process your first payment!
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment: any, idx: number) => (
                      <tr key={payment.id} className="hover:bg-gray-50" data-testid={`row-payment-${payment.id}`}>
                        <td className="px-3 py-2 text-xs">{idx + 1}</td>
                        <td className="px-3 py-2 text-xs">{new Date(payment.dated || payment.createdAt).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-xs font-medium">{payment.name || 'N/A'}</td>
                        <td className="px-3 py-2 text-xs">{payment.voucherNo || '-'}</td>
                        <td className="px-3 py-2 text-xs font-semibold">Ksh. {parseFloat(payment.amounts || 0).toLocaleString()}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            payment.state === 'approved' ? 'bg-green-100 text-green-800' :
                            payment.state === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.state}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete payment"
                            data-testid={`button-delete-${payment.id}`}
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
