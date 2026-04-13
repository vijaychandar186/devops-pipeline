export const termsContent = {
  title: 'Terms of Service',
  lastUpdated: new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  }),
  sections: [
    {
      heading: '1. Acceptance of Terms',
      body: 'By accessing and using DevOps Pipeline, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.'
    },
    {
      heading: '2. Description of Service',
      body: 'DevOps Pipeline is a showcase project demonstrating CI/CD automation, containerization, and cloud-native deployment practices. The service includes a live LLM analytics dashboard powered by HuggingFace data.'
    },
    {
      heading: '3. Use of Service',
      body: 'You agree to use the service only for lawful purposes and in accordance with these terms. You must not use the service in any way that could damage, disable, or impair the service or interfere with any other party\u2019s use of the service.'
    },
    {
      heading: '4. Intellectual Property',
      body: 'All content, features, and functionality of DevOps Pipeline are owned by the project maintainers and are protected by applicable intellectual property laws. The source code is available under the project\u2019s open-source license.'
    },
    {
      heading: '5. Data & Analytics',
      body: 'The dashboard displays publicly available data sourced from the HuggingFace API. We do not claim ownership of any third-party data displayed within the application.'
    },
    {
      heading: '6. Disclaimer of Warranties',
      body: 'The service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.'
    },
    {
      heading: '7. Limitation of Liability',
      body: 'In no event shall DevOps Pipeline or its maintainers be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the service.'
    },
    {
      heading: '8. Changes to Terms',
      body: 'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms.'
    }
  ]
};
