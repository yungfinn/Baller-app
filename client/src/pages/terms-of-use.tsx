import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfUse() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <button onClick={() => setLocation("/")} className="text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-baller text-gray-900">Terms of Use</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10 text-sm text-gray-800">
        <h1 className="text-3xl font-bold text-red-600 mb-6">Terms of Use & Legal Disclaimer</h1>

        <p className="mb-4">
          Welcome to <strong>Baller</strong> — a platform connecting people through local pickup sports events. By accessing, registering, or using the Baller app, you agree to the following terms and legal conditions:
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">1. Assumption of Risk</h2>
        <p className="mb-4">
          Participation in any physical activity comes with inherent risks. By joining or hosting an event through Baller, you acknowledge that Baller is not liable for any injuries, accidents, illness, damages, or losses that occur during, en route to, or following any user-organized event.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">2. Event Venue Disclaimer</h2>
        <p className="mb-4">
          Baller provides a digital platform for event coordination and does not own, operate, or maintain the event locations listed. The availability, legality, and accessibility of any location (e.g. public parks, gyms, school fields) is the sole responsibility of the event host. Users are responsible for obtaining appropriate permits or permissions when necessary.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">3. Age Requirement</h2>
        <p className="mb-4">
          All users must be 18 years of age or older to create an account. Baller does not facilitate participation by minors. Any underage participant's involvement is not approved or consented to by Baller and becomes the sole responsibility of the hosting user.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">4. User Conduct</h2>
        <p className="mb-4">
          You agree to behave respectfully and lawfully during any Baller-associated events. Harassment, violence, hate speech, or any illegal behavior may result in account suspension, legal reporting, and removal from the platform.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">5. Data Privacy</h2>
        <p className="mb-4">
          Baller uses secure storage protocols for sensitive user data, including photo ID and selfie verification. Your information will never be sold or used outside of account and identity verification. We comply with applicable data privacy regulations.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">6. Hosting Responsibility</h2>
        <p className="mb-4">
          Hosts must ensure events follow local laws, are held in appropriate public or private spaces, and do not infringe on the rights of others. Baller is not responsible for unauthorized or illegal event activity initiated by users.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">7. No Guarantees or Warranties</h2>
        <p className="mb-4">
          Baller does not guarantee that any listed event or location will be available, valid, or safe. Users assume all risk. Events may be canceled or changed at any time by hosts without notice.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">8. Acceptance of Terms</h2>
        <p className="mb-4">
          By using Baller, you agree to these terms. Continued use of the platform implies acceptance of any updated versions of this disclaimer.
        </p>

        <div className="mt-12 p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-3">⚠️ Important Reminder</h3>
          <p className="text-red-700 mb-4">
            Please note: Baller is a platform for connecting athletes. We do not control the venues or the events, and participation is at your own risk. You must be 18+, or legally responsible for any underage individuals you involve. Always respect local laws and play safe.
          </p>
        </div>

        <p className="text-gray-500 text-xs mt-8">
          Last updated: May 2025 • © ScanDe LLC - Baller Platform
        </p>

        <div className="mt-8 flex justify-center">
          <Button 
            onClick={() => setLocation("/")}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-2"
          >
            I Understand & Accept
          </Button>
        </div>
      </div>
    </div>
  );
}