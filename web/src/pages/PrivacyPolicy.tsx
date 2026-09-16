import { Link } from 'react-router-dom'
import { Shield, ArrowLeft } from 'lucide-react'

const LAST_UPDATED = 'September 9, 2026'

type Section = { id: string; title: string; body: React.ReactNode }

const SECTIONS: Section[] = [
  {
    id: 'overview',
    title: '1. Overview',
    body: (
      <p>
        Nivaso ("Nivaso", "we", "us", or "our") provides an AI-powered customer
        support and business operations platform. This Privacy Policy explains
        what information we collect, how we use it, and the choices you have. It
        applies to the businesses that use our platform ("Customers") and to the
        end users who interact with those businesses through Nivaso ("End Users").
      </p>
    ),
  },
  {
    id: 'information-we-collect',
    title: '2. Information We Collect',
    body: (
      <>
        <p>We collect the following categories of information:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-gray-900">Account information</span> —
            names, email addresses, business details, and credentials used to
            create and secure accounts.
          </li>
          <li>
            <span className="font-medium text-gray-900">Customer &amp; order data</span> —
            information our Customers upload or generate, such as customer records,
            products, orders, and knowledge-base articles.
          </li>
          <li>
            <span className="font-medium text-gray-900">Conversations</span> —
            chat messages and support tickets exchanged between End Users and a
            business, including any content processed by our AI agents.
          </li>
          <li>
            <span className="font-medium text-gray-900">Usage &amp; device data</span> —
            log data, IP addresses, browser type, and analytics about how the
            platform is used.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Information',
    body: (
      <>
        <p>We use the information we collect to:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Provide, operate, and maintain the platform.</li>
          <li>Power AI agents that answer questions and assist with support.</li>
          <li>Authenticate users and secure accounts against unauthorized access.</li>
          <li>Analyze usage to improve reliability, features, and performance.</li>
          <li>Communicate service updates, security notices, and support responses.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'ai-processing',
    title: '4. AI Processing',
    body: (
      <p>
        Nivaso uses third-party large language model providers to generate agent
        responses. Conversation content may be transmitted to these providers
        solely to produce a response. We do not permit these providers to use
        Customer or End User content to train their models, and we take steps to
        limit the data shared to what is necessary to fulfill each request.
      </p>
    ),
  },
  {
    id: 'sharing',
    title: '5. How We Share Information',
    body: (
      <>
        <p>We do not sell personal information. We share information only:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>With service providers who process data on our behalf under contract.</li>
          <li>With the Customer whose business an End User is interacting with.</li>
          <li>When required by law, legal process, or to protect rights and safety.</li>
          <li>In connection with a merger, acquisition, or sale of assets.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'retention',
    title: '6. Data Retention',
    body: (
      <p>
        We retain information for as long as an account is active or as needed to
        provide the platform, comply with legal obligations, resolve disputes, and
        enforce our agreements. Customers may request deletion of their data,
        subject to applicable legal retention requirements.
      </p>
    ),
  },
  {
    id: 'security',
    title: '7. Security',
    body: (
      <p>
        We use administrative, technical, and organizational safeguards designed
        to protect information, including encryption in transit and access
        controls. No method of transmission or storage is completely secure, so we
        cannot guarantee absolute security.
      </p>
    ),
  },
  {
    id: 'your-rights',
    title: '8. Your Rights',
    body: (
      <p>
        Depending on your location, you may have rights to access, correct, delete,
        or export your personal information, and to object to or restrict certain
        processing. End Users should direct these requests to the business they
        interacted with; that business is the controller of its own customer data.
        Customers may contact us using the details below.
      </p>
    ),
  },
  {
    id: 'changes',
    title: '9. Changes to This Policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time. When we make material
        changes, we will update the "Last updated" date above and, where
        appropriate, provide additional notice.
      </p>
    ),
  },
  {
    id: 'contact',
    title: '10. Contact Us',
    body: (
      <p>
        If you have questions about this Privacy Policy or our data practices,
        contact us at{' '}
        <a
          href="mailto:privacy@nivaso.com"
          className="font-medium text-blue-600 hover:text-blue-700"
        >
          privacy@nivaso.com
        </a>
        .
      </p>
    ),
  },
]

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-md">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="mt-0.5 text-sm text-gray-500">Last updated {LAST_UPDATED}</p>
          </div>
        </div>

        {/* Content card */}
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-8">
            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-6">
                <h2 className="text-base font-semibold text-gray-900">
                  {section.title}
                </h2>
                <div className="mt-2 text-sm leading-relaxed text-gray-600">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        </article>

        {/* Footer nav */}
        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
