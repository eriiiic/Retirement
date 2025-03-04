import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="policy-content">
      <h2 className="text-2xl font-bold mb-6">Privacy Policy</h2>
      
      <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Introduction</h3>
        <p className="mb-3">
          Welcome to the Financial Freedom Calculator ("we", "our", or "us"). We respect your privacy and are committed to protecting your personal data. 
          This privacy policy explains how we handle your data when you visit our retirement planning calculator.
        </p>
        <p>
          Our calculator is designed to provide financial projections based on the parameters you input, without requiring account creation or storing your personal financial data.
        </p>
      </section>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Information We Collect</h3>
        <p className="mb-3">
          <strong>Local Data:</strong> All calculations are performed locally in your browser. The parameters you enter (such as initial capital, monthly investments, and retirement age) 
          are stored temporarily in your browser's local storage to improve your user experience but are not transmitted to our servers.
        </p>
        <p className="mb-3">
          <strong>Usage Data:</strong> We collect anonymous usage data through Google Analytics to understand how visitors use our calculator. 
          This includes information such as the pages you visit, time spent on the site, browser type, and referring site. This data cannot be linked to you personally.
        </p>
      </section>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">How We Use Your Information</h3>
        <ul className="list-disc pl-6 mb-3 space-y-2">
          <li>To provide and improve our retirement calculator</li>
          <li>To analyze usage patterns and optimize user experience</li>
          <li>To fix bugs and troubleshoot technical issues</li>
          <li>To develop new features based on user behavior</li>
        </ul>
        <p className="mb-3">
          We do not use your data for marketing purposes, and we do not sell or share your data with third parties.
        </p>
      </section>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Cookies</h3>
        <p className="mb-3">
          We use only essential cookies that are necessary for the calculator to function properly. We also use Google Analytics cookies to collect anonymous usage data. 
          You can control cookies through your browser settings, but disabling cookies may affect the functionality of our calculator.
        </p>
        <p>
          For more information about how we use cookies, please refer to our Cookie Policy.
        </p>
      </section>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Data Security</h3>
        <p className="mb-3">
          We implement appropriate security measures to protect your data. Since we do not store your financial inputs on our servers, the risk of data breaches affecting your 
          personal financial information is minimized.
        </p>
      </section>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Your Rights</h3>
        <p className="mb-3">
          Depending on your location, you may have certain rights regarding your personal data. These might include:
        </p>
        <ul className="list-disc pl-6 mb-3 space-y-2">
          <li>The right to access information we have about you</li>
          <li>The right to request we delete any personal information we have about you</li>
          <li>The right to opt out of analytics tracking</li>
        </ul>
        <p>
          Since we collect minimal data that cannot be linked to individuals, most of these rights are automatically respected. However, if you have any concerns, please contact us.
        </p>
      </section>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Changes to This Privacy Policy</h3>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          You are advised to review this Privacy Policy periodically for any changes.
        </p>
      </section>
      
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Contact Us</h3>
        <p>
          If you have any questions about this Privacy Policy, please contact us at: contact@FIRECalculator.ai
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy; 