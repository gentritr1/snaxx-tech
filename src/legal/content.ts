// Legal + support content for Snaxx Tech apps.
// Each app is published at:
//   /<slug>/privacy   /<slug>/terms   /<slug>/support   (canonical)
//   /privacy/<slug>   /terms/<slug>                     (kept working)
//
// IMPORTANT: Review these documents before publishing. They describe the
// data practices configured below — update them if an app adds analytics,
// accounts, or any other data collection. Each app declares its own ad
// provider in its LegalProfile (Arrows: Unity Ads / Unity LevelPlay
// mediation; Block Destroy: Google AdMob only); the advertising disclosures
// below must stay consistent with the Play Console Data Safety form for
// that app's release build.

// The document kinds an app can publish. Lives here rather than in the layout
// component so Fast Refresh keeps working (components-only exports there).
export type LegalKind = "privacy" | "terms" | "support";

export const KIND_TITLES: Record<LegalKind, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  support: "Support",
};

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
  lastUpdated?: string; // shown as "Last updated"; falls back to effectiveDate
  contactEmail: string; // general studio contact
  privacyEmail?: string; // privacy-specific contact; falls back to contactEmail
  supportEmail?: string; // support-specific contact; falls back to contactEmail
  supportResponseTime?: string; // e.g. "within 2–3 business days"
  privacy: LegalSection[];
  terms: LegalSection[];
  support?: LegalSection[];
}

const EFFECTIVE_DATE = "July 18, 2026";
const CONTACT_EMAIL = "techsnaxx@gmail.com";
const PRIVACY_EMAIL = "privacy@snaxxtech.com";
const SUPPORT_RESPONSE_TIME = "within 2–3 business days";

// Advertising provider for a given app's release build.
//   "unity-levelplay" — Unity Ads served through Unity LevelPlay (ironSource) mediation
//   "admob"           — Google AdMob as the sole advertising provider, with consent
//                       collected through Google's User Messaging Platform (UMP)
type AdProvider = "unity-levelplay" | "admob";

interface LegalProfile {
  localData: string;
  supportsPlayGames: boolean;
  isGame: boolean;
  adProvider: AdProvider;
  // Ads only ever start when the player taps a "Watch Ad" button to earn a
  // reward — nothing is interstitial or forced. Android-only.
  rewardedAdsOnly?: boolean;
  // No account, no sign-in, no cloud save, and no Snaxx Tech backend that
  // receives gameplay data.
  noBackend?: boolean;
  // Declared to Play as a general-audience title.
  generalAudience?: boolean;
  // Contact address used in the privacy document's contact section.
  privacyEmail?: string;
}

// Sections are authored unnumbered so a profile can insert one (e.g. the
// AdMob-only "Your Privacy Choices") without hand-renumbering the rest.
function numberSections(sections: LegalSection[]): LegalSection[] {
  return sections.map((section, i) => ({ ...section, title: `${i + 1}. ${section.title}` }));
}

function buildPrivacy(
  appName: string,
  appKind: string,
  profile: LegalProfile,
): LegalSection[] {
  const isAdMob = profile.adProvider === "admob";

  const informationList = isAdMob
    ? [
        `Local app data — ${profile.localData} are saved locally on your device and are not sent to Snaxx Tech.`,
        "Advertising data — Google AdMob and the ad technology providers Google works with may collect an Android advertising identifier or another device identifier, IP address and approximate location, device and operating-system information, and app activity such as ad views and clicks. They use this data for advertising, analytics, frequency capping, and fraud prevention, security, and compliance.",
        "Advertising choice — where consent is required, the choice you make in the consent form is recorded on your device by Google's User Messaging Platform so the App can apply it to later ad requests.",
        "Diagnostics — the Google Mobile Ads SDK may collect diagnostics about the ad SDK and ad delivery. Google Play may also make crash or performance reports available to us according to your device and Google Play settings. We use reports available to us to diagnose problems and improve the App.",
      ]
    : [
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

  const introAdParagraph = isAdMob
    ? `${appName} is supported by advertising. The App uses Google AdMob, which is its only advertising provider. Google processes certain device and ad-interaction information as described below; Snaxx Tech does not receive your advertising identifier, does not build its own advertising profile of you, and does not sell your personal information. Where applicable law requires it, the App asks for your advertising choice before requesting any ad and honors that choice.`
    : `${appName} is supported by advertising. The App uses Unity LevelPlay to manage ads, including Unity Ads. Those services process certain device and ad-interaction information as described below; Snaxx Tech does not receive your advertising identifier or build a user profile from that data.`;

  // Stated up front because it is the single most load-bearing fact about how
  // this app shows ads: nothing is interstitial, nothing is forced.
  const rewardedAdsParagraph = `Ads in ${appName} are optional and are never forced on you. An ad only ever starts after you tap "Watch Ad" to earn one extra helper use; if you never tap it, no ad is requested. Rewarded ads are available on Android only.`;

  const noBackendParagraph = `${appName} has no account and no sign-in, no cloud save, and no Snaxx Tech server that receives your gameplay data. Everything the game saves stays on your device.`;

  const advertisingSection: LegalSection = isAdMob
    ? {
        id: "advertising",
        title: "Advertising",
        paragraphs: [
          `${appName} is supported by ads served by Google AdMob. AdMob is the only advertising provider used by the App. Google's published Google Play Data Safety guidance for the Google Mobile Ads SDK states that it collects and may share device or other identifiers, approximate location, and app activity such as ad interactions, and collects diagnostics.`,
          ...(profile.rewardedAdsOnly ? [rewardedAdsParagraph] : []),
          "Where applicable law requires it, the App asks for your advertising choice before requesting any ad and honors that choice. That request is made through Google's User Messaging Platform (UMP): in the regions where consent is required, the UMP consent form is shown and your choice is collected before any ad is requested.",
          "Which ads you then see depends on the choice you made, your region, and your device settings. You can manage advertising privacy in Android Settings as well; the exact path varies by Android version and device manufacturer.",
          "Snaxx Tech does not sell your personal information and does not build its own advertising profile of you.",
          "The App's Google Play Data safety answers must describe the combined behavior of the App and Google AdMob, including any ad technology providers Google allows to serve ads. If that configuration changes, we will update this policy and the Play Console declaration.",
        ],
      }
    : {
        id: "advertising",
        title: "Advertising",
        paragraphs: [
          `${appName} is supported by ads managed through Unity LevelPlay. Unity's published Google Play Data Safety guidance states that its SDK collects and may share approximate location, ad interactions, and device or other identifiers, and collects diagnostics. These disclosures can vary when additional ad-network adapters are enabled.`,
          "Depending on your region, consent choices, and device settings, ads may be personalized or contextual. You can manage advertising privacy in Android Settings; the exact path varies by Android version and device manufacturer.",
          "The App's Google Play Data safety answers must describe the combined behavior of the App, Unity LevelPlay, and every ad-network adapter included in the release build. If that configuration changes, we will update this policy and the Play Console declaration.",
        ],
      };

  const privacyChoicesSection: LegalSection = {
    id: "privacy-choices",
    title: "Your Privacy Choices",
    paragraphs: [
      "Where consent is required, Google's User Messaging Platform consent form is shown before any ad is requested, and the App applies the choice you make to every ad request after that.",
      `You can review and change your consent at any time from "Ad Privacy Choices" in the App's Privacy & Support screen. Reopening it shows the same form, and any new choice takes effect from your next ad request.`,
      "You can also reset or delete your Android advertising ID, or opt out of ad personalization, in Android Settings; the exact path varies by Android version and device manufacturer. To remove everything the App has saved on your device, clear the app's storage or uninstall the App.",
    ],
  };

  const thirdPartySection: LegalSection = isAdMob
    ? {
        id: "third-party-services",
        title: "Third-Party Services",
        paragraphs: [
          `${appName} works with the third parties below, whose own policies apply when their services are used:`,
        ],
        list: [
          "Google AdMob (Google Mobile Ads SDK) — supplies all advertising in the App and processes the categories described in the Advertising section. AdMob is the only advertising provider used by the App.",
          "Google's ad technology providers — where Google allows a third-party ad technology provider to serve an ad, it may process the same advertising categories under Google's policies and, where required, subject to the advertising choice you made.",
          "Google Play — distributes the App, processes purchases where offered, and provides platform features under Google's Privacy Policy.",
        ],
        links: [
          {
            label: "Google privacy policy",
            href: "https://policies.google.com/privacy",
            description: "How Google handles information across its services, including AdMob and Google Play.",
          },
          {
            label: "How Google uses information from sites or apps that use our services",
            href: "https://policies.google.com/technologies/partner-sites",
            description: "What Google collects and how it is used when an app uses Google services such as AdMob.",
          },
          {
            label: "Google advertising technologies",
            href: "https://policies.google.com/technologies/ads",
            description: "How Google uses identifiers and cookies for advertising, and the controls available to you.",
          },
        ],
      }
    : {
        id: "third-party-services",
        title: "Third-Party Services",
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
      };

  return numberSections([
    {
      id: "introduction",
      title: "Introduction",
      paragraphs: [
        `This Privacy Policy explains how Snaxx Tech ("we", "us", or "our") handles information when you use ${appName}, our ${appKind} for Android (the "App").`,
        `We built ${appName} to be simple: there is no Snaxx Tech account to create, and we do not ask you for your name, email address, or phone number inside the App. ${profile.localData} are stored locally on your device.`,
        ...(profile.noBackend ? [noBackendParagraph] : []),
        introAdParagraph,
      ],
    },
    {
      id: "information-we-collect",
      title: "Information We Collect",
      paragraphs: [
        `${appName} does not require you to create an account and does not ask for your name, email address, phone number, or any other personal information.`,
        "The information involved while you use the App falls into the categories below:",
      ],
      list: informationList,
    },
    advertisingSection,
    ...(isAdMob ? [privacyChoicesSection] : []),
    {
      id: "data-we-do-not-collect",
      title: "What We Do Not Collect",
      paragraphs: [
        `Snaxx Tech itself does not ask for or receive the following through the App. Advertising and Google Play services process the limited categories described elsewhere in this policy.`,
      ],
      list: [
        "Your name, email address, or contact details",
        "Your precise location",
        "Your contacts, photos, or files",
        "Payment-card information (Google Play processes purchases, if the App offers them)",
        ...(profile.noBackend
          ? [
              "Gameplay data on a server — there is no account, no sign-in, no cloud save, and no Snaxx Tech backend that receives how you play",
            ]
          : []),
      ],
    },
    {
      id: "local-storage",
      title: "Data Stored on Your Device",
      paragraphs: [
        `${profile.localData} are stored on your device using the operating system's standard app storage. This local data is not transmitted to Snaxx Tech.`,
        "You can erase this data at any time by clearing the app's storage in your device settings or by uninstalling the App. (Uninstalling does not delete data already processed by our ad partner; see their policy for how to manage that.)",
      ],
    },
    thirdPartySection,
    {
      id: "children",
      title: "Children's Privacy",
      paragraphs: [
        profile.generalAudience
          ? `${appName} is a general-audience app. It is not directed at children under the age of 13 (or the equivalent minimum age in your jurisdiction), and we do not knowingly collect personal information from children.`
          : `${appName} is not directed at children under the age of 13 (or the equivalent minimum age in your jurisdiction), and we do not knowingly collect personal information from children.`,
        "If the App's declared target audience ever includes children, we will configure the App and its advertising services to comply with Google Play's Families requirements before making that version available.",
        "If you believe a child has provided us with personal information, contact us and we will delete it promptly.",
      ],
    },
    {
      id: "security",
      title: "Data Security",
      paragraphs: [
        "Your local app data is stored on your device, where it is protected by your device's own security (passcode, biometric lock, and OS-level protections). We recommend keeping your device up to date to benefit from the latest protections.",
        isAdMob
          ? "Google states that information collected by the Google Mobile Ads SDK is encrypted in transit. Google protects the information it processes for advertising under its own security practices and policies."
          : "Unity states that information collected by the LevelPlay SDK is encrypted in transit. Unity and any other enabled ad provider protect information under their own security practices and policies.",
      ],
    },
    {
      id: "retention",
      title: "Data Retention & Deletion",
      paragraphs: [
        "We do not keep your local app data on our servers — it stays on your device until you delete it or uninstall the App.",
        isAdMob
          ? "Information processed by Google for advertising is retained under Google's policies, not ours. Google's privacy policy explains how to submit an access, deletion, or opt-out request where those rights apply, and you can change your advertising choice at any time as described above."
          : "Information processed by Unity or another enabled ad provider is retained under that provider's policy, not ours. Unity's app-user privacy policy explains how to submit an access, deletion, or opt-out request where those rights apply.",
        "If you contact us by email for support, we keep that correspondence only as long as needed to help you, and you may ask us to delete it at any time.",
      ],
    },
    {
      id: "international",
      title: "International Users",
      paragraphs: [
        `${appName} may be made available in multiple countries. App settings and progress stored only on your device are not transferred across borders by Snaxx Tech.`,
        isAdMob
          ? "Google, its ad technology providers, and Google Play services may process information on servers in other countries under their own policies and transfer safeguards."
          : "Unity, enabled ad providers, and optional Google Play services may process information on servers in other countries under their own policies and transfer safeguards.",
      ],
    },
    {
      id: "changes",
      title: "Changes to This Policy",
      paragraphs: [
        "We may update this Privacy Policy if the App gains features, changes its advertising configuration, or changes how it handles information. When we do, we will revise the last-updated date at the top of this page and provide any additional notice required by law.",
      ],
    },
    {
      id: "contact",
      title: "Contact Us",
      paragraphs: profile.privacyEmail
        ? [
            `If you have any questions about this Privacy Policy or about how ${appName} handles information, you can reach Snaxx Tech at ${profile.privacyEmail}. We aim to respond within a few business days.`,
            `For anything that is not a privacy question — bugs, feedback, or general support — email us at ${CONTACT_EMAIL}.`,
          ]
        : [
            `If you have any questions about this Privacy Policy or about how ${appName} handles information, you can reach us at ${CONTACT_EMAIL}. We aim to respond within a few business days.`,
          ],
    },
  ]);
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
        profile.adProvider === "admob"
          ? `${appName} is supported by advertisements served by Google AdMob, its only advertising provider. Ads are part of the App experience.`
          : `${appName} is supported by advertisements managed through Unity LevelPlay, including Unity Ads. Ads are part of the App experience.`,
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

function buildSupport(
  appName: string,
  appKind: string,
  supportEmail: string,
  responseTime: string,
): LegalSection[] {
  return numberSections([
    {
      id: "about",
      title: `About ${appName}`,
      paragraphs: [
        `${appName} is an offline ${appKind} for Android.`,
        "This page covers the questions we get most often. If none of it helps, email us — a real person reads it.",
      ],
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      paragraphs: ["The most common things players run into, and what to do about them:"],
      list: [
        "A shape won't move — dimmed shapes are the ones that do not fit anywhere on the current board. Try a different shape, or use Shuffle, Break, or Hint.",
        "Prefer tapping to dragging — tap a shape in the tray, then tap a highlighted cell on the board to place it.",
        "An ad didn't grant a helper — the helper is granted only when the ad reports completion. An ad that is skipped, closed early, or interrupted grants nothing. No score or board progress is ever removed when this happens.",
        "Restore a run — go to the home screen and choose Resume. Starting a new run permanently replaces the current board, so use Resume if you want the old one back.",
        "No sound — check the in-game speaker control, then check your device's media volume.",
        "Reset local data — clear the app's storage in Android settings, or reinstall the app. This removes the active run and your local scores.",
      ],
    },
    {
      id: "contact",
      title: "Contact Us",
      paragraphs: [
        `Email ${supportEmail} and we will get back to you ${responseTime}.`,
        `It helps to include your device model, your Android version, and what you were doing when the problem happened.`,
        "Please never send passwords or payment details. We will never ask you for them, and you do not need an account to play.",
      ],
    },
  ]);
}

const ARROWS_PROFILE: LegalProfile = {
  localData: "Settings, game progress, high scores, and achievements where supported",
  supportsPlayGames: true,
  isGame: true,
  adProvider: "unity-levelplay",
};

// Block Destroy — package name is com.blockrow.game for historical reasons
// (the game shipped as Rowflare, then Blockrow, then Block Blaster). The
// package name is deliberately left alone; only the display name changed.
const BLOCK_DESTROY_PROFILE: LegalProfile = {
  localData:
    "Your active run, high score, best combo, sound preference, and tutorial status",
  supportsPlayGames: false,
  isGame: true,
  adProvider: "admob",
  rewardedAdsOnly: true,
  noBackend: true,
  generalAudience: true,
  privacyEmail: PRIVACY_EMAIL,
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
  "block-destroy": {
    slug: "block-destroy",
    appName: "Block Destroy",
    appKind: "block puzzle game",
    accent: "#FF7A29",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: "July 27, 2026",
    contactEmail: CONTACT_EMAIL,
    privacyEmail: PRIVACY_EMAIL,
    supportEmail: CONTACT_EMAIL,
    supportResponseTime: SUPPORT_RESPONSE_TIME,
    privacy: buildPrivacy("Block Destroy", "block puzzle game", BLOCK_DESTROY_PROFILE),
    terms: buildTerms("Block Destroy", "block puzzle game", BLOCK_DESTROY_PROFILE),
    support: buildSupport(
      "Block Destroy",
      "block puzzle game",
      CONTACT_EMAIL,
      SUPPORT_RESPONSE_TIME,
    ),
  },
};

// Slugs that used to be published and must keep resolving (renamed apps).
// Play Console, AdMob, and any store listing may still point at these.
const LEGACY_SLUGS: Record<string, string> = {
  rowflare: "block-destroy",
  blockrow: "block-destroy",
  "block-blaster": "block-destroy",
  blockblaster: "block-destroy",
};

export function getAppLegal(slug: string | undefined): AppLegal | undefined {
  if (!slug) return undefined;
  const key = slug.toLowerCase();
  return legalApps[key] ?? legalApps[LEGACY_SLUGS[key]];
}
