// Legal content for Snaxx Tech apps.
// Each app gets its own Privacy Policy and Terms of Service at:
//   /privacy/<slug>  and  /terms/<slug>
//
// IMPORTANT: Review these documents before publishing. They describe the
// data practices configured below — update them if an app adds analytics,
// accounts, or any other data collection. These apps are ad-supported via
// Unity Ads / Unity LevelPlay (ironSource) mediation; the advertising
// disclosures below must stay consistent with the Play Console Data Safety
// form.

export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  list?: string[];
  links?: {
    label: string;
    href: string;
    description: string;
  }[];
}

export interface AppLegal {
  slug: string;
  appName: string;
  appKind: string; // e.g. "arcade game" / "mobile app"
  accent: string; // hex accent color for chips & highlights
  effectiveDate: string;
  contactEmail: string;
  privacy: LegalSection[];
  terms: LegalSection[];
}

const EFFECTIVE_DATE = "July 18, 2026";
const CONTACT_EMAIL = "techsnaxx@gmail.com";

interface LegalProfile {
  localData: string;
  supportsPlayGames: boolean;
  isGame: boolean;
}

function buildPrivacy(
  appName: string,
  appKind: string,
  profile: LegalProfile,
): LegalSection[] {
  const informationList = [
    `Local app data — ${profile.localData} are saved locally on your device and are not sent to Snaxx Tech.`,
    "Advertising data — Unity LevelPlay and the ad networks enabled for the App may collect an Android advertising identifier or another device identifier, IP address and approximate location, device and operating-system information, and app activity such as ad views and clicks. They use this data for advertising, analytics, frequency capping, and fraud prevention, security, and compliance.",
    "Diagnostics — Unity LevelPlay may collect diagnostics about the ad SDK and ad delivery. Google Play may also make crash or performance reports available to us according to your device and Google Play settings. We use reports available to us to diagnose problems and improve the App.",
  ];

  if (profile.supportsPlayGames) {
    informationList.splice(
      1,
      0,
      "Google Play Games — if you choose to use features such as leaderboards or achievements, Google processes the information needed to provide those features under Google's Privacy Policy.",
    );
  }

  return [
    {
      id: "introduction",
      title: "1. Introduction",
      paragraphs: [
        `This Privacy Policy explains how Snaxx Tech ("we", "us", or "our") handles information when you use ${appName}, our ${appKind} for Android (the "App").`,
        `We built ${appName} to be simple: there is no Snaxx Tech account to create, and we do not ask you for your name, email address, or phone number inside the App. ${profile.localData} are stored locally on your device.`,
        `${appName} is supported by advertising. The App uses Unity LevelPlay to manage ads, including Unity Ads. Those services process certain device and ad-interaction information as described below; Snaxx Tech does not receive your advertising identifier or build a user profile from that data.`,
      ],
    },
    {
      id: "information-we-collect",
      title: "2. Information We Collect",
      paragraphs: [
        `${appName} does not require you to create an account and does not ask for your name, email address, phone number, or any other personal information.`,
        "The information involved while you use the App falls into the categories below:",
      ],
      list: informationList,
    },
    {
      id: "advertising",
      title: "3. Advertising",
      paragraphs: [
        `${appName} is supported by ads managed through Unity LevelPlay. Unity's published Google Play Data Safety guidance states that its SDK collects and may share approximate location, ad interactions, and device or other identifiers, and collects diagnostics. These disclosures can vary when additional ad-network adapters are enabled.`,
        "Depending on your region, consent choices, and device settings, ads may be personalized or contextual. You can manage advertising privacy in Android Settings; the exact path varies by Android version and device manufacturer.",
        "The App's Google Play Data safety answers must describe the combined behavior of the App, Unity LevelPlay, and every ad-network adapter included in the release build. If that configuration changes, we will update this policy and the Play Console declaration.",
      ],
    },
    {
      id: "data-we-do-not-collect",
      title: "4. What We Do Not Collect",
      paragraphs: [
        `Snaxx Tech itself does not ask for or receive the following through the App. Advertising and Google Play services process the limited categories described elsewhere in this policy.`,
      ],
      list: [
        "Your name, email address, or contact details",
        "Your precise location",
        "Your contacts, photos, or files",
        "Payment-card information (Google Play processes purchases, if the App offers them)",
      ],
    },
    {
      id: "local-storage",
      title: "5. Data Stored on Your Device",
      paragraphs: [
        `${profile.localData} are stored on your device using the operating system's standard app storage. This local data is not transmitted to Snaxx Tech.`,
        "You can erase this data at any time by clearing the app's storage in your device settings or by uninstalling the App. (Uninstalling does not delete data already processed by our ad partner; see their policy for how to manage that.)",
      ],
    },
    {
      id: "third-party-services",
      title: "6. Third-Party Services",
      paragraphs: [
        `${appName} works with the third parties below, whose own policies apply when their services are used:`,
      ],
      list: [
        "Unity Technologies (Unity LevelPlay and Unity Ads) — manages and supplies advertising and processes the categories described in the Advertising section.",
        "Enabled mediated ad networks — if an additional network is included in the release build, it may supply an ad and process the same advertising categories under its own policy. Unity publishes the networks supported by LevelPlay.",
        "Google Play and Google Play Games — distributes the App, processes purchases where offered, and provides optional platform features under Google's Privacy Policy.",
      ],
      links: [
        {
          label: "Unity game player and app user privacy policy",
          href: "https://unity.com/legal/game-player-and-app-user-privacy-policy",
          description: "How Unity handles information from apps that use Unity services.",
        },
        {
          label: "Unity LevelPlay mediation networks",
          href: "https://docs.unity.com/en-us/grow/levelplay/sdk/android/mediation-network-guides",
          description: "Unity's current directory of ad networks supported by LevelPlay on Android.",
        },
        {
          label: "Google privacy policy",
          href: "https://policies.google.com/privacy",
          description: "How Google handles information across Google Play and Play Games.",
        },
      ],
    },
    {
      id: "children",
      title: "7. Children's Privacy",
      paragraphs: [
        `${appName} is not directed at children under the age of 13 (or the equivalent minimum age in your jurisdiction), and we do not knowingly collect personal information from children.`,
        "If the App's declared target audience ever includes children, we will configure the App and its advertising services to comply with Google Play's Families requirements before making that version available.",
        "If you believe a child has provided us with personal information, contact us and we will delete it promptly.",
      ],
    },
    {
      id: "security",
      title: "8. Data Security",
      paragraphs: [
        "Your local app data is stored on your device, where it is protected by your device's own security (passcode, biometric lock, and OS-level protections). We recommend keeping your device up to date to benefit from the latest protections.",
        "Unity states that information collected by the LevelPlay SDK is encrypted in transit. Unity and any other enabled ad provider protect information under their own security practices and policies.",
      ],
    },
    {
      id: "retention",
      title: "9. Data Retention & Deletion",
      paragraphs: [
        "We do not keep your local app data on our servers — it stays on your device until you delete it or uninstall the App.",
        "Information processed by Unity or another enabled ad provider is retained under that provider's policy, not ours. Unity's app-user privacy policy explains how to submit an access, deletion, or opt-out request where those rights apply.",
        "If you contact us by email for support, we keep that correspondence only as long as needed to help you, and you may ask us to delete it at any time.",
      ],
    },
    {
      id: "international",
      title: "10. International Users",
      paragraphs: [
        `${appName} may be made available in multiple countries. App settings and progress stored only on your device are not transferred across borders by Snaxx Tech.`,
        "Unity, enabled ad providers, and optional Google Play services may process information on servers in other countries under their own policies and transfer safeguards.",
      ],
    },
    {
      id: "changes",
      title: "11. Changes to This Policy",
      paragraphs: [
        "We may update this Privacy Policy if the App gains features, changes its advertising configuration, or changes how it handles information. When we do, we will revise the last-updated date at the top of this page and provide any additional notice required by law.",
      ],
    },
    {
      id: "contact",
      title: "12. Contact Us",
      paragraphs: [
        `If you have any questions about this Privacy Policy or about how ${appName} handles information, you can reach us at ${CONTACT_EMAIL}. We aim to respond within a few business days.`,
      ],
    },
  ];
}

function buildTerms(appName: string, appKind: string, profile: LegalProfile): LegalSection[] {
  const acceptableUse = [
    "Copy, modify, distribute, sell, or lease any part of the App",
    "Reverse engineer or attempt to extract the source code of the App, except where such restriction is prohibited by law",
    "Use the App in any way that violates applicable laws or regulations",
    "Interfere with or disrupt the App or its normal operation",
  ];

  if (profile.isGame) {
    acceptableUse.push(
      "Use cheats, exploits, or automation tools that give an unfair advantage in competitive or leaderboard features",
    );
  }

  return [
    {
      id: "agreement",
      title: "1. Agreement to Terms",
      paragraphs: [
        `These Terms of Service ("Terms") form a legal agreement between you and Snaxx Tech ("we", "us", or "our") governing your use of ${appName}, our ${appKind} for Android (the "App").`,
        `By downloading, installing, or using ${appName}, you agree to these Terms. If you do not agree, please do not use the App.`,
      ],
    },
    {
      id: "license",
      title: "2. License to Use the App",
      paragraphs: [
        "We grant you a personal, non-exclusive, non-transferable, revocable license to install and use the App on devices you own or control, solely for your own non-commercial use and in accordance with these Terms and the rules of the store you downloaded it from.",
        "This license does not give you any ownership of the App — it only allows you to use it.",
      ],
    },
    {
      id: "acceptable-use",
      title: "3. Acceptable Use",
      paragraphs: ["You agree that you will not:"],
      list: acceptableUse,
    },
    {
      id: "advertising",
      title: "4. Advertising",
      paragraphs: [
        `${appName} is supported by advertisements managed through Unity LevelPlay, including Unity Ads. Ads are part of the App experience.`,
        "Advertisements and any linked content, offers, or websites are the responsibility of the advertiser or advertising network, not Snaxx Tech. We do not endorse and are not responsible for third-party ad content or for anything you do in reliance on it. How advertising data is handled is described in our Privacy Policy.",
      ],
    },
    {
      id: "intellectual-property",
      title: "5. Intellectual Property",
      paragraphs: [
        `The App, including its name, logo, artwork, design, code, and all content within it, is owned by Snaxx Tech and protected by copyright, trademark, and other intellectual property laws.`,
        "These Terms do not grant you any rights to use our name, logo, or trademarks without our prior written permission.",
      ],
    },
    {
      id: "purchases",
      title: "6. Purchases & Billing",
      paragraphs: [
        `The App may offer optional in-app purchases, such as removing ads or unlocking features. Purchases are processed by Google Play, and Google Play's terms, pricing, and refund policies apply.`,
        "We do not collect or store your payment information.",
      ],
    },
    {
      id: "updates",
      title: "7. Updates & Availability",
      paragraphs: [
        "We may release updates that add, change, or remove features, and the App may require updates to keep working as intended. We aim to keep the App available at all times but do not guarantee uninterrupted availability.",
        "We may discontinue the App or any feature at any time. If we discontinue a paid App, we will announce it on our website with reasonable advance notice where practical.",
      ],
    },
    {
      id: "disclaimers",
      title: "8. Disclaimers",
      paragraphs: [
        `The App is provided "as is" and "as available", without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.`,
        "We do not warrant that the App will be error-free, secure, or uninterrupted, or that any defects will be corrected.",
      ],
    },
    {
      id: "liability",
      title: "9. Limitation of Liability",
      paragraphs: [
        "To the maximum extent permitted by law, Snaxx Tech shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, profits, or goodwill, arising out of or related to your use of the App.",
        "In any case, our total liability to you for any claim arising from these Terms or the App shall not exceed the amount you paid for the App, if any.",
      ],
    },
    {
      id: "changes",
      title: "10. Changes to These Terms",
      paragraphs: [
        "We may update these Terms from time to time. When we do, we will revise the date at the top of this page. Continued use of the App after updated Terms take effect constitutes acceptance of the changes.",
      ],
    },
    {
      id: "governing-law",
      title: "11. Governing Law",
      paragraphs: [
        "These Terms do not limit consumer rights or remedies that cannot be waived under the law where you live. Any governing-law or court provision that we publish for a specific release will remain subject to those mandatory rights.",
      ],
    },
    {
      id: "contact",
      title: "12. Contact Us",
      paragraphs: [
        `Questions about these Terms? Reach us at ${CONTACT_EMAIL} — we're happy to help.`,
      ],
    },
  ];
}

const ARROWS_PROFILE: LegalProfile = {
  localData: "Settings, game progress, high scores, and achievements where supported",
  supportsPlayGames: true,
  isGame: true,
};

const ROWFLARE_PROFILE: LegalProfile = {
  localData: "Settings, preferences, and app progress",
  supportsPlayGames: false,
  isGame: false,
};

export const legalApps: Record<string, AppLegal> = {
  arrows: {
    slug: "arrows",
    appName: "Arrows",
    appKind: "arcade game",
    accent: "#0082F3",
    effectiveDate: EFFECTIVE_DATE,
    contactEmail: CONTACT_EMAIL,
    privacy: buildPrivacy("Arrows", "arcade game", ARROWS_PROFILE),
    terms: buildTerms("Arrows", "arcade game", ARROWS_PROFILE),
  },
  rowflare: {
    slug: "rowflare",
    appName: "Rowflare",
    appKind: "mobile app",
    accent: "#FF7A29",
    effectiveDate: EFFECTIVE_DATE,
    contactEmail: CONTACT_EMAIL,
    privacy: buildPrivacy("Rowflare", "mobile app", ROWFLARE_PROFILE),
    terms: buildTerms("Rowflare", "mobile app", ROWFLARE_PROFILE),
  },
};

export function getAppLegal(slug: string | undefined): AppLegal | undefined {
  if (!slug) return undefined;
  return legalApps[slug.toLowerCase()];
}
