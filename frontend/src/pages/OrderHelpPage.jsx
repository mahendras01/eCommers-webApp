import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function OrderHelpPage() {
  const { orderId } = useParams();
  const [expandedOption, setExpandedOption] = useState(null);

  const helpOptions = [
    {
      id: 'where_is_order',
      title: 'Where is my order?',
      description: 'Track your order status and get updates on delivery.',
      details: 'You can check your order status in the Order Tracking section. If your order is delayed, please contact our support team with your order number.',
    },
    {
      id: 'cancel_order',
      title: 'Cancel order',
      description: 'Learn how to cancel your order before it ships.',
      details: 'Orders can be cancelled within 1 hour of placement if not yet processed. Go to Order Details and click "Cancel Order". Refunds will be processed within 5-7 business days.',
    },
    {
      id: 'return_replace',
      title: 'Return/Replace product',
      description: 'Information about returning or replacing items.',
      details: 'Returns are accepted within 30 days of delivery. Items must be unused and in original packaging. Start a return request from Order Details or contact support.',
    },
    {
      id: 'payment_issue',
      title: 'Payment issue',
      description: 'Resolve problems with payment or refunds.',
      details: 'For payment failures, try again or contact your bank. For refunds, they are processed within 5-7 days after approval. Check your account or contact support.',
    },
    {
      id: 'damaged_product',
      title: 'Received damaged/wrong product',
      description: 'Report issues with damaged or incorrect items.',
      details: 'Take photos of the damaged/incorrect item and packaging. Contact support within 48 hours of delivery for immediate assistance and replacement.',
    },
    {
      id: 'other_issue',
      title: 'Other issue',
      description: 'For any other questions or concerns.',
      details: 'Please describe your issue in detail when contacting support. Include your order number and any relevant screenshots. We\'re here to help!',
    },
  ];

  const toggleOption = (id) => {
    setExpandedOption(expandedOption === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] bg-white p-8 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Get Help</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Order Support</h1>
          <p className="mt-3 text-slate-600">Find answers to common questions about your order</p>
        </div>
        <Link
          to="/orders"
          className="mt-4 inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
        >
          ← Back to Orders
        </Link>
      </div>

      {/* Help Options */}
      <div className="space-y-4">
        {helpOptions.map((option) => (
          <div key={option.id} className="rounded-[20px] bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => toggleOption(option.id)}
              className="w-full px-6 py-5 text-left hover:bg-slate-50 transition flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{option.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{option.description}</p>
              </div>
              <svg
                className={`h-5 w-5 text-slate-500 transition-transform ${expandedOption === option.id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedOption === option.id && (
              <div className="px-6 pb-5 border-t border-slate-200 bg-slate-50">
                <p className="text-sm text-slate-700 pt-4">{option.details}</p>
                <button className="mt-4 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition">
                  Contact Support
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Info */}
      <div className="rounded-[20px] bg-slate-900 text-white p-6 text-center">
        <h3 className="text-xl font-bold mb-2">Still need help?</h3>
        <p className="mb-4 text-slate-200">Our support team is here to assist you</p>
        <div className="space-y-2">
          <p className="text-sm">Email: support@ecommerce.com</p>
          <p className="text-sm">Phone: 1-800-123-4567</p>
          <p className="text-sm">Hours: Mon-Fri 9AM-6PM</p>
        </div>
      </div>
    </div>
  );
}