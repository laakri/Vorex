import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Form } from "@/components/ui/form"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { FORM_STEPS } from "./steps"
import { driverSchema } from "./schema"
import type { DriverFormData } from "@/types/driver"

import {
  WelcomeStep,
  PersonalInfoStep,
  ContactDetailsStep,
  IdentityStep,
  LicenseStep,
  VehicleDetailsStep,
  VehicleDocsStep,
  DeliveryZonesStep,
  ReviewStep
} from "./steps"

export function DriverApplication() {
  const [step, setStep] = useState(1)
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    mode: "onChange",
    defaultValues: {
      // Your default values here
    }
  })

  const currentStep = FORM_STEPS[step - 1]

  const renderStep = () => {
    const steps = {
      1: <WelcomeStep />,
      2: <PersonalInfoStep form={form} />,
      3: <ContactDetailsStep form={form} />,
      4: <IdentityStep form={form} />,
      5: <LicenseStep form={form} />,
      6: <VehicleDetailsStep form={form} />,
      7: <VehicleDocsStep form={form} />,
      8: <DeliveryZonesStep form={form} />,
      9: <ReviewStep form={form} />
    }

    return steps[step as keyof typeof steps]
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="fixed inset-x-0 top-0 h-2 bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${(step / FORM_STEPS.length) * 100}%` }}
        />
      </div>

      <main className="container max-w-3xl py-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-6">
              <div className="mb-8">
                <h1 className="text-2xl font-semibold">{currentStep.title}</h1>
                <p className="text-muted-foreground">{currentStep.description}</p>
              </div>

              <Form {...form}>
                <form className="space-y-8">
                  {renderStep()}
                </form>
              </Form>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

