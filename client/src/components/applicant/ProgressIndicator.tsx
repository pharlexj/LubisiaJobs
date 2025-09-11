import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Clock } from "lucide-react";

interface Step {
  id: number;
  name: string;
  required: boolean;
  completed: boolean;
  conditional?: boolean;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number; // total number of completed steps
}

export default function ProgressIndicator({
  steps,
  currentStep,
  completedSteps,
}: ProgressIndicatorProps) {
  const totalSteps = steps.length;
  const completionPercentage = (completedSteps / totalSteps) * 100;

  const getStepStatus = (step: Step) => {
    if (step.completed) return "completed";
    if (step.id === currentStep) return "current";
    return "pending";
  };

  const getStepIcon = (step: Step) => {
    const status = getStepStatus(step);

    switch (status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-white" />;
      case "current":
        return <Clock className="w-6 h-6 text-white" />;
      default:
        return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStepClass = (step: Step) => {
    const status = getStepStatus(step);
    const baseClass =
      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors";

    switch (status) {
      case "completed":
        return `${baseClass} bg-secondary border-secondary`;
      case "current":
        return `${baseClass} bg-primary border-primary`;
      default:
        return `${baseClass} bg-gray-100 border-gray-300`;
    }
  };

  const getTextClass = (step: Step) => {
    const status = getStepStatus(step);

    switch (status) {
      case "completed":
        return "text-secondary font-medium";
      case "current":
        return "text-primary font-semibold";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Profile Completion
          </h3>
          <span className="text-primary font-semibold">
            {Math.round(completionPercentage)}%
          </span>
        </div>
        <Progress value={completionPercentage} className="h-3" />
        <p className="text-sm text-gray-600 mt-2">
          {completedSteps} of {totalSteps} steps completed
        </p>
      </div>

      {/* Step Indicators */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Steps to Complete</h4>

        {/* Desktop View */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex flex-col items-center relative"
              >
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="absolute top-5 left-10 w-full h-0.5 bg-gray-300 -z-10">
                    <div
                      className="h-full bg-secondary transition-all duration-300"
                      style={{
                        width:
                          getStepStatus(step) === "completed" ? "100%" : "0%",
                      }}
                    />
                  </div>
                )}

                {/* Step Circle */}
                <div className={getStepClass(step)}>{getStepIcon(step)}</div>

                {/* Step Label */}
                <div className="mt-3 text-center max-w-24">
                  <p className={`text-sm ${getTextClass(step)}`}>
                    {step.name}
                  </p>
                  {step.required && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-center space-x-4 p-3 rounded-lg border"
            >
              <div className={getStepClass(step)}>{getStepIcon(step)}</div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`font-medium ${getTextClass(step)}`}>
                    {step.name}
                  </p>
                  {step.required && (
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-500 mt-1">
                  Step {step.id} of {totalSteps}
                  {getStepStatus(step) === "completed" && " - Completed"}
                  {getStepStatus(step) === "current" && " - In Progress"}
                  {getStepStatus(step) === "pending" && " - Pending"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">
              Profile Completion Tips
            </h4>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Complete all required steps to apply for jobs</li>
              <li>• Your progress is automatically saved</li>
              <li>• You can return to edit any step later</li>
              <li>• Upload clear, readable documents</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
