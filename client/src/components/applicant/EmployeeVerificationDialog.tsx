import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

const verificationSchema = z.object({
  personalNumber: z.string().min(1, 'Personal number is required'),
});

interface EmployeeVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicantIdNumber: string;
  onVerificationSuccess: (employeeData: any) => void;
}

export default function EmployeeVerificationDialog({
  open,
  onOpenChange,
  applicantIdNumber,
  onVerificationSuccess,
}: EmployeeVerificationDialogProps) {
  const [verificationStep, setVerificationStep] = useState<'input' | 'verified' | 'error'>('input');
  const [verifiedEmployee, setVerifiedEmployee] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      personalNumber: '',
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof verificationSchema>) => {
      const res = await apiRequest('POST', '/api/employee/verify', {
        personalNumber: data.personalNumber,
        idNumber: applicantIdNumber,
      });
      return res.json();
    },
    onSuccess: (response) => {      
      setVerifiedEmployee(response.employee);
      setVerificationStep('verified');
      toast({
        title: 'Verification Successful',
        description: 'Your employee status has been verified successfully.',
      });
    },
    onError: (error: any) => {
      setVerificationStep('error');
      toast({
        title: 'Verification Failed',
        description: error.message || 'Unable to verify employee status. Please check your personal number.',
        variant: 'destructive',
      });
    },
  });

  const handleVerify = (data: z.infer<typeof verificationSchema>) => {
    verifyMutation.mutate(data);
  };

  const handleProceed = () => {
    if (verifiedEmployee) {
      onVerificationSuccess(verifiedEmployee);
      onOpenChange(false);
      setVerificationStep('input');
      setVerifiedEmployee(null);
      form.reset();
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setVerificationStep('input');
    setVerifiedEmployee(null);
    form.reset();
  };

  const handleRetry = () => {
    setVerificationStep('input');
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            County Employee Verification
          </DialogTitle>
          <DialogDescription>
            To proceed as a county employee, please verify your employment status by entering your personal number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {verificationStep === 'input' && (
            <>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>ID Number:</strong> {applicantIdNumber}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  We'll verify this matches your personal number in our employee records.
                </p>
              </div>

              <form onSubmit={form.handleSubmit(handleVerify)} className="space-y-4">
                <div>
                  <Label htmlFor="personalNumber">Personal Number</Label>
                  <Input
                    id="personalNumber"
                    data-testid="input-personalNumber"
                    placeholder="Enter your personal number"
                    {...form.register('personalNumber')}
                  />
                  {form.formState.errors.personalNumber && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.personalNumber.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={verifyMutation.isPending}
                    data-testid="button-verify"
                  >
                    {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </form>
            </>
          )}

          {verificationStep === 'verified' && verifiedEmployee && (
            <>
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Verification Successful!</span>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-2">
                <h4 className="font-medium text-green-800">Employee Details:</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Personal Number:</strong> {verifiedEmployee.personalNumber}</p>
                  <p><strong>Designation:</strong> {verifiedEmployee.designation}</p>
                  {verifiedEmployee.dutyStation && (
                    <p><strong>Duty Station:</strong> {verifiedEmployee.dutyStation}</p>
                  )}
                  {verifiedEmployee.jg && (
                    <p><strong>Job Group:</strong> {verifiedEmployee.jg}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleProceed}
                  data-testid="button-proceed"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Proceed with Employee Details
                </Button>
              </div>
            </>
          )}

          {verificationStep === 'error' && (
            <>
              <div className="flex items-center gap-2 text-red-600 mb-4">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Verification Failed</span>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  We couldn't verify your employee status. This could be because:
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                  <li>The personal number doesn't match our records</li>
                  <li>The ID number doesn't match your employee record</li>
                  <li>You may not be in our employee database</li>
                </ul>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleRetry}
                  data-testid="button-retry"
                >
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}