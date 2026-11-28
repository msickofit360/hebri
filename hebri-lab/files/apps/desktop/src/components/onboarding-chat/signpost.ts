import { translateNow } from '@/i18n/runtime'
import type { TourStep } from '@/lib/tour/engine'

/** Offer the existing localised handoff guidance through the same opt-in
 * controls and progress lifecycle as every other Help walkthrough. A hidden
 * rail in Simple mode gets a text-only explanation. */
export function handoffSteps(): TourStep[] {
  const landmark = (name: string) => '[data-tour="' + name + '"]'
  const rail = landmark('profile-rail')
  const copy = (key: string) => translateNow('handoffTour.' + key)

  return [
    { accent: true, selector: rail, side: 'right', text: copy('profileText'), title: copy('profileTitle') },
    { selector: landmark('sessions-sidebar'), side: 'right', text: copy('sessionsText'), title: copy('sessionsTitle') },
    { accent: true, selector: rail, side: 'right', text: copy('stayText'), title: copy('stayTitle') }
  ]
}
