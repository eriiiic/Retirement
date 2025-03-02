import React from 'react';

const CookiePolicy: React.FC = () => {
  return (
    <div className="policy-content">
      <h2 className="text-2xl font-bold mb-6">Cookie Policy</h2>
      
      <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Introduction</h3>
        <p className="mb-3">
          This Cookie Policy explains how the Financial Freedom Calculator ("we", "our", or "us") uses cookies and similar technologies to recognize you when you visit our calculator. 
          It explains what these technologies are and why we use them, as well as your rights to control our use of them.
        </p>
      </section>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">What Are Cookies?</h3>
        <p className="mb-3">
          Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work, 
          or to work more efficiently, as well as to provide reporting information.
        </p>
        <p>
          Cookies set by us are called "first-party cookies". Cookies set by parties other than us are called "third-party cookies". Third-party cookies enable third-party features or 
          functionality to be provided on or through the website (such as analytics).
        </p>
      </section>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Cookies We Use</h3>
        <div className="mb-4">
          <h4 className="font-semibold mb-2">Essential Cookies</h4>
          <p className="mb-2">
            These cookies are necessary for the calculator to function properly. They enable core functionality such as saving your preferences and inputs. The calculator cannot function properly without these cookies.
          </p>
          <table className="min-w-full border border-gray-200 mb-3">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Purpose</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 text-sm">preferences</td>
                <td className="px-4 py-2 text-sm">Stores your calculation preferences</td>
                <td className="px-4 py-2 text-sm">1 year</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm">calculation_inputs</td>
                <td className="px-4 py-2 text-sm">Saves your most recent inputs</td>
                <td className="px-4 py-2 text-sm">30 days</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Analytics Cookies</h4>
          <p className="mb-2">
            We use Google Analytics to help us understand how visitors use our calculator. These cookies collect information about your use of the calculator, such as which pages you visit and how you navigate through the site.
            The information is aggregated and anonymized.
          </p>
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Purpose</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 text-sm">_ga</td>
                <td className="px-4 py-2 text-sm">Used to distinguish users</td>
                <td className="px-4 py-2 text-sm">2 years</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm">_gid</td>
                <td className="px-4 py-2 text-sm">Used to distinguish users</td>
                <td className="px-4 py-2 text-sm">24 hours</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm">_gat</td>
                <td className="px-4 py-2 text-sm">Used to throttle request rate</td>
                <td className="px-4 py-2 text-sm">1 minute</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">How to Control Cookies</h3>
        <p className="mb-3">
          Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may impact your overall user 
          experience and certain functionalities of our calculator might not work properly.
        </p>
        <p className="mb-3">
          To opt-out of Google Analytics tracking, you can:
        </p>
        <ul className="list-disc pl-6 mb-3 space-y-2">
          <li>Use the <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a></li>
          <li>Use your browser's incognito or private browsing mode</li>
          <li>Clear your browser cookies regularly</li>
        </ul>
      </section>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Our Use of Google Analytics</h3>
        <p className="mb-3">
          We use Google Analytics to analyze the use of our calculator. Google Analytics gathers information about calculator use by means of cookies. The information gathered is used to 
          create reports about the use of our calculator.
        </p>
        <p>
          Google's privacy policy is available at: <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a>
        </p>
      </section>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Changes to This Cookie Policy</h3>
        <p>
          We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last Updated" date.
          You are advised to review this Cookie Policy periodically for any changes.
        </p>
      </section>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Contact Us</h3>
        <p>
          If you have any questions about our Cookie Policy, please contact us at: edelattre@gmail.com
        </p>
      </section>
    </div>
  );
};

export default CookiePolicy; 