// Every outbound link on the landing page lives here.
// index.html references them as %link:<key>%; replace the '#' placeholders and rebuild.
export default {
  links: {
    // Navigation
    valsewa: '#',
    valjubel: '#',
    search: '#',
    topup: '#',
    loginSubmit: '#', // form action for the login form
    signup: '#',
    forgotPassword: '#',

    // Section CTAs
    sewaAccounts: '#',
    jualAccount: '#',
    beliAccounts: '#',
    topupValorant: '#',
    topupMobileLegends: '#',

    // Community
    instagramValforum: '#',
    instagramValsewa: '#',
    whatsappCommunity: '#',
    faq: '#',

    // Floating livechat: where the button goes in each mode
    chatAdmin: '#', // admin online
    chatLeaveMessage: '#', // admin offline
    chatWhatsapp: '#', // WhatsApp mode
  },

  // Floating livechat, bottom right.
  livechat: {
    // 'auto' follows the hours below; 'online', 'offline' or 'whatsapp' forces a mode.
    // WhatsApp mode shows the WhatsApp badge and no online/offline status.
    mode: 'auto',
    timeZone: 'Asia/Jakarta',
    // Admin online hours per day, 24-hour 'HH:MM'. null = offline all day.
    // A close time earlier than the open time runs past midnight.
    hours: {
      mon: ['09:00', '22:00'],
      tue: ['09:00', '22:00'],
      wed: ['09:00', '22:00'],
      thu: ['09:00', '22:00'],
      fri: ['09:00', '22:00'],
      sat: ['09:00', '22:00'],
      sun: ['09:00', '22:00'],
    },
  },
};
