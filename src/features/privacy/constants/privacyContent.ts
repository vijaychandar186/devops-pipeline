export const privacyContent = {
  title: 'Privacy Policy',
  lastUpdated: new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  }),
  sections: [
    {
      heading: '1. Information We Collect',
      body: 'DevOps Pipeline is a demonstration project and does not collect personal information from visitors. The dashboard displays publicly available data sourced from the HuggingFace API.'
    },
    {
      heading: '2. Authentication Data',
      body: 'If you sign in to the application, basic authentication data (such as your email address) may be processed by our authentication provider. This data is used solely for the purpose of granting access to the dashboard.'
    },
    {
      heading: '3. Cookies & Local Storage',
      body: 'We may use cookies or local storage to persist your theme preference and session state. These are essential for the application to function and are not used for tracking or advertising purposes.'
    },
    {
      heading: '4. Third-Party Services',
      body: 'The application integrates with third-party services such as HuggingFace for data and Vercel for hosting. These services have their own privacy policies, and we encourage you to review them.'
    },
    {
      heading: '5. Data Security',
      body: 'We implement reasonable security measures to protect against unauthorized access, alteration, or destruction of data. However, no method of transmission over the internet is 100% secure.'
    },
    {
      heading: '6. Children\u2019s Privacy',
      body: 'The service is not directed at individuals under the age of 13. We do not knowingly collect personal information from children.'
    },
    {
      heading: '7. Changes to This Policy',
      body: 'We may update this privacy policy from time to time. Any changes will be reflected on this page with an updated revision date.'
    },
    {
      heading: '8. Contact',
      body: 'If you have any questions about this privacy policy, you can reach us via the contact links in the footer of the site.'
    }
  ]
};
