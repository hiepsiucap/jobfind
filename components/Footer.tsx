'use client';

import { usePathname } from 'next/navigation';

// Routes where footer should be hidden
const HIDDEN_FOOTER_ROUTES = ['/cv', '/recruiter'];

export default function Footer() {
  const pathname = usePathname();
  
  // Hide footer on specific routes
  if (HIDDEN_FOOTER_ROUTES.some(route => pathname?.startsWith(route))) {
    return null;
  }

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold font-display mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">JobFind</h3>
            <p className="text-gray-400 leading-relaxed">
              Your trusted platform for finding the perfect job and building amazing CVs with AI.
            </p>
          </div>
          <div>
            <h4 className="font-semibold font-display mb-4">For Job Seekers</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="hover:text-white transition-colors cursor-pointer">Browse Jobs</li>
              <li className="hover:text-white transition-colors cursor-pointer">Create CV</li>
              <li className="hover:text-white transition-colors cursor-pointer">Career Advice</li>
              <li className="hover:text-white transition-colors cursor-pointer">AI CV Builder</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold font-display mb-4">For Employers</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="hover:text-white transition-colors cursor-pointer">Post Jobs</li>
              <li className="hover:text-white transition-colors cursor-pointer">Find Candidates</li>
              <li className="hover:text-white transition-colors cursor-pointer">Company Profile</li>
              <li className="hover:text-white transition-colors cursor-pointer">Pricing</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold font-display mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="hover:text-white transition-colors cursor-pointer">About Us</li>
              <li className="hover:text-white transition-colors cursor-pointer">Contact</li>
              <li className="hover:text-white transition-colors cursor-pointer">Privacy Policy</li>
              <li className="hover:text-white transition-colors cursor-pointer">Terms of Service</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 JobFind. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}






