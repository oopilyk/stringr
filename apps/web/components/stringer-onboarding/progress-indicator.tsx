'use client'

import { Check } from 'lucide-react'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div className="w-full">
      {/* Desktop view */}
      <div className="hidden md:flex justify-center items-center space-x-2">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors
                  ${
                    step < currentStep
                      ? 'bg-green-600 text-white'
                      : step === currentStep
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-gray-200 text-gray-600'
                  }
                `}
              >
                {step < currentStep ? <Check className="w-5 h-5" /> : step}
              </div>
              <div className={`text-xs mt-1 ${step === currentStep ? 'font-semibold text-primary' : 'text-gray-500'}`}>
                Step {step}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-1 mx-2 transition-colors ${step < currentStep ? 'bg-green-600' : 'bg-gray-200'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile view */}
      <div className="md:hidden">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
