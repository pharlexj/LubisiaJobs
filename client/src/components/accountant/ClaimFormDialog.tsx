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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Receipt, Download } from 'lucide-react';

const claimSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  personalNo: z.string().min(1, 'Personal number is required'),
  designation: z.string().optional(),
  jobGroup: z.string().optional(),
  travelDate: z.string().optional(),
  returnDate: z.string().optional(),
  destination: z.string().optional(),
  numberOfDays: z.string().optional(),
  voteId: z.string().min(1, 'Vote ID is required'),
  voucherNo: z.string().min(1, 'Voucher number is required'),
  particulars: z.string().min(1, 'Particulars are required'),
  amounts: z.coerce.number().min(0, 'Amount must be positive'),
  subsistence: z.coerce.number().min(0).optional(),
  busFare: z.coerce.number().min(0).optional(),
  taxiFare: z.coerce.number().min(0).optional(),
  perDiem: z.coerce.number().min(0).optional(),
  fy: z.string().min(1, 'Financial year is required'),
  departmentId: z.coerce.number().optional(),
});

type ClaimFormData = z.infer<typeof claimSchema>;

interface ClaimFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ClaimFormDialog({ open, onOpenChange }: ClaimFormDialogProps) {
  const { toast } = useToast();
  const [createdClaimId, setCreatedClaimId] = useState<number | null>(null);

  const { data: votes } = useQuery<any[]>({
    queryKey: ['/api/accounting/vote-accounts'],
  });

  const { data: departments } = useQuery<any[]>({
    queryKey: ['/api/departments'],
  });

  const form = useForm<ClaimFormData>({
    resolver: zodResolver(claimSchema),
    defaultValues: {
      name: '',
      personalNo: '',
      designation: '',
      jobGroup: '',
      travelDate: '',
      returnDate: '',
      destination: '',
      numberOfDays: '',
      voteId: '',
      voucherNo: '',
      particulars: '',
      amounts: 0,
      subsistence: 0,
      busFare: 0,
      taxiFare: 0,
      perDiem: 0,
      fy: new Date().getFullYear().toString() + '/' + (new Date().getFullYear() + 1).toString(),
    },
  });

  const createClaimMutation = useMutation({
    mutationFn: async (data: ClaimFormData) => {
      const response = await apiRequest('POST', '/api/accounting/transactions/claim', data);
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Success',
        description: 'Claim created successfully',
      });
      setCreatedClaimId(data.transaction.id);
      queryClient.invalidateQueries({ queryKey: ['/api/accountant/claims'] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create claim',
        variant: 'destructive',
      });
    },
  });

  const exportClaimMutation = useMutation({
    mutationFn: async (claimId: number) => {
      const response = await apiRequest('POST', `/api/accounting/export/claim/${claimId}`);
      return response;
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Success',
        description: 'Claim document generated successfully',
      });
      // Trigger download
      window.open(data.downloadUrl, '_blank');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate claim document',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ClaimFormData) => {
    createClaimMutation.mutate(data);
  };

  const handleExport = () => {
    if (createdClaimId) {
      exportClaimMutation.mutate(createdClaimId);
    }
  };

  const handleClose = () => {
    setCreatedClaimId(null);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Create New Claim
          </DialogTitle>
          <DialogDescription>
            Fill in the claim details to generate a travel claim form
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
                    <FormLabel>Employee Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} data-testid="input-claim-name" />
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
                      <Input placeholder="Employee number" {...field} data-testid="input-claim-personal-no" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <FormControl>
                      <Input placeholder="Job title" {...field} data-testid="input-claim-designation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Group</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., K, L, M" {...field} data-testid="input-claim-job-group" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="travelDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Travel Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-claim-travel-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="returnDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Return Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-claim-return-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination</FormLabel>
                    <FormControl>
                      <Input placeholder="Travel destination" {...field} data-testid="input-claim-destination" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numberOfDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Days</FormLabel>
                    <FormControl>
                      <Input placeholder="Number of days" {...field} data-testid="input-claim-days" />
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
                      <Input placeholder="Vote ID" {...field} data-testid="input-claim-vote" />
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
                      <Input placeholder="Voucher number" {...field} data-testid="input-claim-voucher" />
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
                      <Input placeholder="2024/2025" {...field} data-testid="input-claim-fy" />
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
                      placeholder="Description of the claim..."
                      {...field}
                      data-testid="input-claim-particulars"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amounts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount (KSh) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} data-testid="input-claim-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subsistence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subsistence (KSh)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} data-testid="input-claim-subsistence" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="busFare"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bus Fare (KSh)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} data-testid="input-claim-bus-fare" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxiFare"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxi Fare (KSh)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} data-testid="input-claim-taxi-fare" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="perDiem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Per Diem (KSh)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} data-testid="input-claim-per-diem" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              {createdClaimId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExport}
                  disabled={exportClaimMutation.isPending}
                  data-testid="button-export-claim"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportClaimMutation.isPending ? 'Generating...' : 'Export Document'}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel-claim"
              >
                {createdClaimId ? 'Close' : 'Cancel'}
              </Button>
              {!createdClaimId && (
                <Button
                  type="submit"
                  disabled={createClaimMutation.isPending}
                  data-testid="button-submit-claim"
                >
                  {createClaimMutation.isPending ? 'Creating...' : 'Create Claim'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
