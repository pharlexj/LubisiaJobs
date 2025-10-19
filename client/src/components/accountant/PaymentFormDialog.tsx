import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Download } from 'lucide-react';

const paymentSchema = z.object({
  name: z.string().min(1, 'Payee name is required'),
  personalNo: z.string().min(1, 'Personal number is required'),
  voteId: z.string().min(1, 'Vote ID is required'),
  voucherNo: z.string().min(1, 'Voucher number is required'),
  particulars: z.string().min(1, 'Particulars are required'),
  amounts: z.coerce.number().min(0, 'Amount must be positive'),
  dated: z.string().min(1, 'Date is required'),
  fy: z.string().min(1, 'Financial year is required'),
  amountsAllocated: z.coerce.number().min(0).optional(),
  balanceAfterCommitted: z.coerce.number().min(0).optional(),
  checkNo: z.string().optional(),
  departmentId: z.coerce.number().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PaymentFormDialog({ open, onOpenChange }: PaymentFormDialogProps) {
  const { toast } = useToast();
  const [createdPaymentId, setCreatedPaymentId] = useState<number | null>(null);

  const { data: departments } = useQuery<any[]>({
    queryKey: ['/api/departments'],
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      name: '',
      personalNo: '',
      voteId: '',
      voucherNo: '',
      particulars: '',
      amounts: 0,
      dated: new Date().toISOString().split('T')[0],
      fy: new Date().getFullYear().toString() + '/' + (new Date().getFullYear() + 1).toString(),
      amountsAllocated: 0,
      balanceAfterCommitted: 0,
      checkNo: '',
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest('POST', '/api/accounting/transactions/payment', data);
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Success',
        description: 'Payment created successfully',
      });
      setCreatedPaymentId(data.transaction.id);
      queryClient.invalidateQueries({ queryKey: ['/api/accountant/payments'] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment',
        variant: 'destructive',
      });
    },
  });

  const exportPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const response = await apiRequest('POST', `/api/accounting/export/payment/${paymentId}`);
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Success',
        description: 'Payment document generated successfully',
      });
      // Trigger download
      window.open(data.downloadUrl, '_blank');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate payment document',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  const handleExport = () => {
    if (createdPaymentId) {
      exportPaymentMutation.mutate(createdPaymentId);
    }
  };

  const handleClose = () => {
    setCreatedPaymentId(null);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Create New Payment
          </DialogTitle>
          <DialogDescription>
            Fill in the payment details to generate a payment voucher
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payee Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} data-testid="input-payment-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personalNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Employee/Vendor number" {...field} data-testid="input-payment-personal-no" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="voteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vote Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="Vote ID" {...field} data-testid="input-payment-vote" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="voucherNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voucher Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Voucher number" {...field} data-testid="input-payment-voucher" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dated"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-payment-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Financial Year *</FormLabel>
                    <FormControl>
                      <Input placeholder="2024/2025" {...field} data-testid="input-payment-fy" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="checkNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Check/Cheque number" {...field} data-testid="input-payment-check-no" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amounts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount (KSh) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} data-testid="input-payment-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amountsAllocated"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Allocated (KSh)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} data-testid="input-payment-allocated" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="balanceAfterCommitted"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remaining Balance (KSh)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} data-testid="input-payment-balance" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="particulars"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Particulars *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description of the payment..."
                      {...field}
                      data-testid="input-payment-particulars"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              {createdPaymentId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExport}
                  disabled={exportPaymentMutation.isPending}
                  data-testid="button-export-payment"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportPaymentMutation.isPending ? 'Generating...' : 'Export Document'}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel-payment"
              >
                {createdPaymentId ? 'Close' : 'Cancel'}
              </Button>
              {!createdPaymentId && (
                <Button
                  type="submit"
                  disabled={createPaymentMutation.isPending}
                  data-testid="button-submit-payment"
                >
                  {createPaymentMutation.isPending ? 'Creating...' : 'Create Payment'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
