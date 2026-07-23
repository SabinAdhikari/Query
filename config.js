/* ==================================================================
   config.js — YOUR EMAILJS SETTINGS GO HERE
   ------------------------------------------------------------------
   This file is kept separate from script.js on purpose: it's the
   ONLY file you need to edit to make emailing work. Never commit
   your real keys to a public GitHub repo — treat this file like a
   password file.

   HOW TO GET YOUR THREE VALUES (all free, takes ~5 minutes):

   1. Go to https://www.emailjs.com/ and create a free account.

   2. Add an Email Service:
        Dashboard → "Email Services" → "Add New Service"
        (e.g. connect your Gmail account)
        → After creating it, copy the "Service ID"
        → Paste it below as SERVICE_ID.

   3. Create an Email Template:
        Dashboard → "Email Templates" → "Create New Template"
        Set the "To email" field to: binsone001@gmail.com
        In the template body, use these variable names so the data
        from this site fills in correctly:
              {{selected_date}}   -> the date they picked
              {{selected_time}}   -> the time they picked
              {{food_choice}}     -> the food/vibe they typed
        → After saving, copy the "Template ID"
        → Paste it below as TEMPLATE_ID.

   4. Get your Public Key:
        Dashboard → click your account name (top right) → "General"
        → copy the "Public Key"
        → Paste it below as PUBLIC_KEY.

   Once all three placeholders below are replaced with your real
   values, the "Continue ❤️" button on the food screen will actually
   send you an email. Until then, the site still works perfectly —
   it will just show a friendly error instead of sending.
================================================================== */

const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'LJlVPZ-8ctnsPw83y',     // <-- paste your Public Key here
  SERVICE_ID: "service_skqzv95",     // <-- paste your Service ID here
  TEMPLATE_ID: "template_zr38ln8",   // <-- paste your Template ID here
};
