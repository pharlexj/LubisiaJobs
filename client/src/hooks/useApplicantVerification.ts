import { useState, useEffect } from 'react';

interface VerifiedEmployee {
  personalNumber?: string;
  designation?: string;
  dutyStation?: string;
  jg?: string;
}

export function useApplicantVerification(form: any) {
  const [isVerifiedEmployee, setIsVerifiedEmployee] = useState(false);
  const [showEmployeeVerification, setShowEmployeeVerification] = useState(false);
  const [verifiedEmployeeData, setVerifiedEmployeeData] = useState<VerifiedEmployee>({});

  // Watch for checkbox changes
  useEffect(() => {
    const isEmployee = form.watch('isEmployee');
    if (isEmployee && !isVerifiedEmployee) {
      setShowEmployeeVerification(true);
    }
  }, [form.watch('isEmployee')]);

  const verifyEmployee = (data: VerifiedEmployee) => {
    setVerifiedEmployeeData(data);
    setIsVerifiedEmployee(true);
    setShowEmployeeVerification(false);
  };

  const getNextStep = (currentStep: number): number => {
    if (currentStep === 1 && isVerifiedEmployee) return 1.5;
    return currentStep + 1;
  };

  return {
    isVerifiedEmployee,
    showEmployeeVerification,
    setShowEmployeeVerification,
    verifiedEmployeeData,
    verifyEmployee,
      getNextStep,
    setIsVerifiedEmployee,
  };
}
