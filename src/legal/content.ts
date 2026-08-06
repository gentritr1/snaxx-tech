// Legal + support content for Snaxx Tech apps.
// Each app is published at:
//   /<slug>/privacy   /<slug>/terms   /<slug>/support   (canonical)
//   /privacy/<slug>   /terms/<slug>                     (kept working)
//
// IMPORTANT: Review these documents before publishing. They describe the
// data practices configured below — update them if an app adds analytics,
// accounts, or any other data collection. Each app declares its own ad
// provider in its LegalProfile (Arrows: Unity Ads / Unity LevelPlay
// mediation; Block Destroy and Geo Guesser World 3D!: Google AdMob only);
// the advertising disclosures below must stay consistent with the Play
// Console Data Safety form for that app's release build.

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
//   "admob"           — Google AdMob as the sole advertising provider
type AdProvider = "unity-levelplay" | "admob";

// How an AdMob app arrives at the ad settings it uses. Ignored for
// "unity-levelplay".
//   "ump"               — Google's User Messaging Platform collects the user's
//                         consent before the first ad request, and the app
//                         exposes a way to reopen that form
//   "non-personalized"  — the app hard-codes requestNonPersonalizedAdsOnly, so
//                         there is no in-app consent form to show
type ConsentModel = "ump" | "non-personalized";

// A third party the app fetches content from at runtime (map tiles, imagery,
// a CDN). These necessarily see the device's IP address, so each one has to be
// named in the privacy policy alongside its own policy.
interface ContentService {
  /** Company or product name, as users would recognise it. */
  name: string;
  /** What the app asks it for, in plain language. */
  purpose: string;
  policyLabel: string;
  policyHref: string;
  policyDescription: string;
}

interface LegalProfile {
  /** What the app persists to device storage; null when it persists nothing. */
  localData: string | null;
  supportsPlayGames: boolean;
  isGame: boolean;
  adProvider: AdProvider;
  /** Required for "admob"; ignored otherwise. */
  consentModel?: ConsentModel;
  // Ads only ever start when the player taps a "Watch Ad" button to earn a
  // reward — nothing is interstitial or forced. Android-only.
  rewardedAdsOnly?: boolean;
  /** Prose naming where ads actually appear, for apps that do show them unprompted. */
  adPlacements?: string;
  /** Adds an acceptable-use clause about interfering with ads. */
  prohibitAdInterference?: boolean;
  // No account, no sign-in, no cloud save, and no Snaxx Tech backend that
  // receives gameplay data.
  noBackend?: boolean;
  /** The app never requests the device's location permission. */
  noDeviceLocation?: boolean;
  /** Runtime content dependencies; adds a "Maps & Imagery" privacy section. */
  contentServices?: ContentService[];
  /** Attribution line for the Terms, e.g. who owns the imagery and map data. */
  contentAttribution?: string;
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
  const usesUmp = isAdMob && profile.consentModel === "ump";
  const npaOnly = isAdMob && profile.consentModel === "non-personalized";
  const { localData, contentServices = [] } = profile;

  // The lead item of "Information We Collect": what, if anything, survives a
  // session on the device.
  const storedDataItem = localData
    ? `Local app data — ${localData} are saved locally on your device and are not sent to Snaxx Tech.`
    : "Session data — your score and the round you are on exist only in the App's memory while you play. They are discarded when the App closes, are never written to your device's storage, and are never sent to Snaxx Tech.";

  const contentRequestItem = `Map and imagery requests — the services the App loads panoramas, map tiles, and libraries from receive your device's IP address and standard request information each time it asks them for content. That is inherent to making any internet request; those requests carry no identifier of you and no gameplay data.`;

  const informationList = isAdMob
    ? [
        storedDataItem,
        npaOnly
          ? "Advertising data — Google AdMob and the ad technology providers Google works with may collect an Android advertising identifier or another device identifier, IP address and approximate location, device and operating-system information, and app activity such as ad views and clicks. They use this data for advertising, analytics, frequency capping, and fraud prevention, security, and compliance. This happens even though the App requests non-personalized ads: non-personalized limits how an ad is chosen, not the technical data Google needs to deliver, cap, measure, and protect it."
          : "Advertising data — Google AdMob and the ad technology providers Google works with may collect an Android advertising identifier or another device identifier, IP address and approximate location, device and operating-system information, and app activity such as ad views and clicks. They use this data for advertising, analytics, frequency capping, and fraud prevention, security, and compliance.",
        ...(usesUmp
          ? [
              "Advertising choice — where consent is required, the choice you make in the consent form is recorded on your device by Google's User Messaging Platform so the App can apply it to later ad requests.",
            ]
          : []),
        ...(contentServices.length > 0 ? [contentRequestItem] : []),
        "Diagnostics — the Google Mobile Ads SDK may collect diagnostics about the ad SDK and ad delivery. Google Play may also make crash or performance reports available to us according to your device and Google Play settings. We use reports available to us to diagnose problems and improve the App.",
      ]
    : [
        storedDataItem,
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

  const introAdParagraph = !isAdMob
    ? `${appName} is supported by advertising. The App uses Unity LevelPlay to manage ads, including Unity Ads. Those services process certain device and ad-interaction information as described below; Snaxx Tech does not receive your advertising identifier or build a user profile from that data.`
    : npaOnly
      ? `${appName} is supported by advertising. The App uses Google AdMob, which is its only advertising provider, and it requests non-personalized ads only — ads are not chosen using an interest profile built from your activity. Google still processes certain device and ad-interaction information to deliver, cap, measure, and protect those ads, as described below. Snaxx Tech does not receive your advertising identifier, does not build its own advertising profile of you, and does not sell your personal information.`
      : `${appName} is supported by advertising. The App uses Google AdMob, which is its only advertising provider. Google processes certain device and ad-interaction information as described below; Snaxx Tech does not receive your advertising identifier, does not build its own advertising profile of you, and does not sell your personal information. Where applicable law requires it, the App asks for your advertising choice before requesting any ad and honors that choice.`;

  // Stated up front because it is the single most load-bearing fact about how
  // this app shows ads: nothing is interstitial, nothing is forced.
  const rewardedAdsParagraph = `Ads in ${appName} are optional and are never forced on you. An ad only ever starts after you tap "Watch Ad" to earn one extra helper use; if you never tap it, no ad is requested. Rewarded ads are available on Android only.`;

  const noBackendParagraph = localData
    ? `${appName} has no account and no sign-in, no cloud save, and no Snaxx Tech server that receives your gameplay data. Everything the game saves stays on your device.`
    : `${appName} has no account and no sign-in, no cloud save, and no Snaxx Tech server that receives your gameplay data. There is no save file at all — a session ends and takes your score with it.`;

  const advertisingSection: LegalSection = isAdMob
    ? {
        id: "advertising",
        title: "Advertising",
        paragraphs: [
          `${appName} is supported by ads served by Google AdMob. AdMob is the only advertising provider used by the App. Google's published Google Play Data Safety guidance for the Google Mobile Ads SDK states that it collects and may share device or other identifiers, approximate location, and app activity such as ad interactions, and collects diagnostics.`,
          ...(profile.rewardedAdsOnly ? [rewardedAdsParagraph] : []),
          ...(profile.adPlacements ? [profile.adPlacements] : []),
          ...(npaOnly
            ? [
                "The App requests non-personalized ads only. That limits ad selection to contextual signals instead of an interest profile built from your activity, but it does not remove the technical data collection above: a non-personalized ad still involves your advertising identifier, device and app information, and approximate, IP-derived location, used for ad delivery, frequency capping, measurement, and fraud prevention.",
                "You can reset or delete your Android advertising ID, or opt out of ad personalization entirely, in Android Settings — on most devices under Privacy › Ads. The exact path varies by Android version and device manufacturer.",
              ]
            : [
                "Where applicable law requires it, the App asks for your advertising choice before requesting any ad and honors that choice. That request is made through Google's User Messaging Platform (UMP): in the regions where consent is required, the UMP consent form is shown and your choice is collected before any ad is requested.",
                "Which ads you then see depends on the choice you made, your region, and your device settings. You can manage advertising privacy in Android Settings as well; the exact path varies by Android version and device manufacturer.",
              ]),
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

  const privacyChoicesSection: LegalSection = npaOnly
    ? {
        id: "privacy-choices",
        title: "Your Privacy Choices",
        paragraphs: [
          "The App requests non-personalized ads on every ad request, so there is no in-app setting for you to find or switch on — it already applies to every ad you see.",
          "You can reset or delete your Android advertising ID, or opt out of ad personalization across all your apps, in Android Settings; on most devices this sits under Privacy › Ads, though the exact path varies by Android version and device manufacturer.",
          localData
            ? "To remove everything the App has saved on your device, clear the app's storage or uninstall the App."
            : "The App saves nothing to your device, so there is no app data for you to clear. Uninstalling the App removes it completely.",
        ],
      }
    : {
        id: "privacy-choices",
        title: "Your Privacy Choices",
        paragraphs: [
          "Where consent is required, Google's User Messaging Platform consent form is shown before any ad is requested, and the App applies the choice you make to every ad request after that.",
          `You can review and change your consent at any time from "Ad Privacy Choices" in the App's Privacy & Support screen. Reopening it shows the same form, and any new choice takes effect from your next ad request.`,
          "You can also reset or delete your Android advertising ID, or opt out of ad personalization, in Android Settings; the exact path varies by Android version and device manufacturer. To remove everything the App has saved on your device, clear the app's storage or uninstall the App.",
        ],
      };

  // Runtime content dependencies get their own section: they are the main
  // reason a network request leaves the device other than an ad request.
  const contentServicesSection: LegalSection = {
    id: "maps-and-imagery",
    title: "Maps & Imagery",
    paragraphs: [
      `${appName} needs an internet connection. The panoramas you explore, the map you guess on, and the mapping libraries the App runs are fetched from the third-party services below as you play.`,
      "Like any internet request, each of those requests reveals your device's IP address and standard request information — such as the kind of device and browser engine making the request — to the service that answers it. That is unavoidable for any app that loads content over the internet. Snaxx Tech does not receive that information, and the requests carry no identifier of you and nothing about how you played.",
    ],
    list: contentServices.map((service) => `${service.name} — ${service.purpose}`),
  };

  const deviceLocationSection: LegalSection = {
    id: "device-location",
    title: "Your Device's Location",
    paragraphs: [
      `${appName} never asks for location permission and cannot see where you actually are. The App does not read GPS, Wi-Fi, or cell-tower location at any point.`,
      `The "location" in the game is the pin you drop on a map, not your real position, and the place you are dropped into at the start of a round is picked at random rather than from anything about you.`,
      "The only location-related data involved is the approximate, IP-derived location that Google's advertising services and the map and imagery services can infer from your IP address, described elsewhere in this policy. That is typically no more precise than a city or region, and we never receive it.",
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
          npaOnly
            ? "Google's ad technology providers — where Google allows a third-party ad technology provider to serve an ad, it may process the same advertising categories under Google's policies, subject to the App's non-personalized ad request."
            : "Google's ad technology providers — where Google allows a third-party ad technology provider to serve an ad, it may process the same advertising categories under Google's policies and, where required, subject to the advertising choice you made.",
          ...contentServices.map(
            (service) => `${service.name} — ${service.purpose} It receives your IP address and standard request information when the App asks it for content.`,
          ),
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
          ...contentServices.map((service) => ({
            label: service.policyLabel,
            href: service.policyHref,
            description: service.policyDescription,
          })),
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
        localData
          ? `We built ${appName} to be simple: there is no Snaxx Tech account to create, and we do not ask you for your name, email address, or phone number inside the App. ${localData} are stored locally on your device.`
          : `We built ${appName} to be simple: there is no Snaxx Tech account to create, and we do not ask you for your name, email address, or phone number inside the App. The App saves nothing about you or your game — not even to your own device.`,
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
    ...(contentServices.length > 0 ? [contentServicesSection] : []),
    ...(profile.noDeviceLocation ? [deviceLocationSection] : []),
    {
      id: "data-we-do-not-collect",
      title: "What We Do Not Collect",
      paragraphs: [
        `Snaxx Tech itself does not ask for or receive the following through the App. Advertising and Google Play services process the limited categories described elsewhere in this policy.`,
      ],
      list: [
        "Your name, email address, or contact details",
        profile.noDeviceLocation
          ? "Your location — the App does not request the location permission and never reads your device's location"
          : "Your precise location",
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
      paragraphs: localData
        ? [
            `${localData} are stored on your device using the operating system's standard app storage. This local data is not transmitted to Snaxx Tech.`,
            "You can erase this data at any time by clearing the app's storage in your device settings or by uninstalling the App. (Uninstalling does not delete data already processed by our ad partner; see their policy for how to manage that.)",
          ]
        : [
            `${appName} does not save your gameplay. Your score, your guesses, and the round you are on live in the App's memory while it is running and are gone the moment it closes. Nothing is written to your device's storage, so there is no save file, no history, and no leaderboard record to build up over time.`,
            "Because there is nothing saved, there is nothing for you to clear. Google's advertising services may still store an identifier on your device; you can reset or delete it in Android Settings, and uninstalling the App removes the App itself. (Uninstalling does not delete data already processed by our ad partner; see their policy for how to manage that.)",
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
        localData
          ? "Your local app data is stored on your device, where it is protected by your device's own security (passcode, biometric lock, and OS-level protections). We recommend keeping your device up to date to benefit from the latest protections."
          : "The App saves nothing to your device and sends nothing to us, so there is no stored app data to protect. Every request the App makes — for ads, imagery, map tiles, and libraries — is sent over an encrypted HTTPS connection. We recommend keeping your device up to date to benefit from the latest protections.",
        isAdMob
          ? "Google states that information collected by the Google Mobile Ads SDK is encrypted in transit. Google protects the information it processes for advertising under its own security practices and policies."
          : "Unity states that information collected by the LevelPlay SDK is encrypted in transit. Unity and any other enabled ad provider protect information under their own security practices and policies.",
      ],
    },
    {
      id: "retention",
      title: "Data Retention & Deletion",
      paragraphs: [
        localData
          ? "We do not keep your local app data on our servers — it stays on your device until you delete it or uninstall the App."
          : "We operate no servers and hold no data about you, so there is nothing for us to retain, and nothing for us to access, correct, or delete if you ask. Your in-progress game is discarded as soon as the App closes.",
        !isAdMob
          ? "Information processed by Unity or another enabled ad provider is retained under that provider's policy, not ours. Unity's app-user privacy policy explains how to submit an access, deletion, or opt-out request where those rights apply."
          : npaOnly
            ? "Information processed by Google for advertising is retained under Google's policies, not ours. Google's privacy policy explains how to submit an access, deletion, or opt-out request where those rights apply, and you can reset or delete your advertising ID at any time as described above."
            : "Information processed by Google for advertising is retained under Google's policies, not ours. Google's privacy policy explains how to submit an access, deletion, or opt-out request where those rights apply, and you can change your advertising choice at any time as described above.",
        "If you contact us by email for support, we keep that correspondence only as long as needed to help you, and you may ask us to delete it at any time.",
      ],
    },
    {
      id: "international",
      title: "International Users",
      paragraphs: [
        localData
          ? `${appName} may be made available in multiple countries. App settings and progress stored only on your device are not transferred across borders by Snaxx Tech.`
          : `${appName} may be made available in multiple countries. Snaxx Tech transfers none of your information across borders, because we do not receive any of it in the first place.`,
        isAdMob
          ? "Google, its ad technology providers, and Google Play services may process information on servers in other countries under their own policies and transfer safeguards."
          : "Unity, enabled ad providers, and optional Google Play services may process information on servers in other countries under their own policies and transfer safeguards.",
        ...(contentServices.length > 0
          ? [
              "The map and imagery services described above answer requests from their own infrastructure, which may sit outside your country, under their own policies and transfer safeguards.",
            ]
          : []),
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

  if (profile.prohibitAdInterference) {
    acceptableUse.push(
      "Remove, obscure, block, or automate interaction with the advertisements that keep the App free",
    );
  }

  return numberSections([
    {
      id: "agreement",
      title: "Agreement to Terms",
      paragraphs: [
        `These Terms of Service ("Terms") form a legal agreement between you and Snaxx Tech ("we", "us", or "our") governing your use of ${appName}, our ${appKind} for Android (the "App").`,
        `By downloading, installing, or using ${appName}, you agree to these Terms. If you do not agree, please do not use the App.`,
      ],
    },
    {
      id: "license",
      title: "License to Use the App",
      paragraphs: [
        "We grant you a personal, non-exclusive, non-transferable, revocable license to install and use the App on devices you own or control, solely for your own non-commercial use and in accordance with these Terms and the rules of the store you downloaded it from.",
        "This license does not give you any ownership of the App — it only allows you to use it.",
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use",
      paragraphs: ["You agree that you will not:"],
      list: acceptableUse,
    },
    {
      id: "advertising",
      title: "Advertising",
      paragraphs: [
        profile.adProvider === "admob"
          ? `${appName} is supported by advertisements served by Google AdMob, its only advertising provider. Ads are part of the App experience.`
          : `${appName} is supported by advertisements managed through Unity LevelPlay, including Unity Ads. Ads are part of the App experience.`,
        "Advertisements and any linked content, offers, or websites are the responsibility of the advertiser or advertising network, not Snaxx Tech. We do not endorse and are not responsible for third-party ad content or for anything you do in reliance on it. How advertising data is handled is described in our Privacy Policy.",
      ],
    },
    ...(profile.contentAttribution
      ? [
          {
            id: "third-party-content",
            title: "Third-Party Content",
            paragraphs: [
              `${appName} displays maps, imagery, and other content supplied by third parties over the internet. ${profile.contentAttribution} That content belongs to its respective owners and is provided under their own terms and licences, not ours.`,
              "We do not create, review, or control it. It may be out of date, incomplete, mislabelled, or missing for a given place, and we make no guarantee that it is accurate, current, or available anywhere in particular.",
              "Because the App depends on those services being reachable, parts of it may be slow, degraded, or unavailable for reasons outside our control. An internet connection is required to play.",
            ],
          },
        ]
      : []),
    {
      id: "intellectual-property",
      title: "Intellectual Property",
      paragraphs: [
        profile.contentAttribution
          ? `The App itself, including its name, logo, artwork, design, and code, is owned by Snaxx Tech and protected by copyright, trademark, and other intellectual property laws. This does not extend to the third-party content described above, which remains the property of its owners.`
          : `The App, including its name, logo, artwork, design, code, and all content within it, is owned by Snaxx Tech and protected by copyright, trademark, and other intellectual property laws.`,
        "These Terms do not grant you any rights to use our name, logo, or trademarks without our prior written permission.",
      ],
    },
    {
      id: "purchases",
      title: "Purchases & Billing",
      paragraphs: [
        `The App may offer optional in-app purchases, such as removing ads or unlocking features. Purchases are processed by Google Play, and Google Play's terms, pricing, and refund policies apply.`,
        "We do not collect or store your payment information.",
      ],
    },
    {
      id: "updates",
      title: "Updates & Availability",
      paragraphs: [
        "We may release updates that add, change, or remove features, and the App may require updates to keep working as intended. We aim to keep the App available at all times but do not guarantee uninterrupted availability.",
        "We may discontinue the App or any feature at any time. If we discontinue a paid App, we will announce it on our website with reasonable advance notice where practical.",
      ],
    },
    {
      id: "disclaimers",
      title: "Disclaimers",
      paragraphs: [
        `The App is provided "as is" and "as available", without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.`,
        "We do not warrant that the App will be error-free, secure, or uninterrupted, or that any defects will be corrected.",
      ],
    },
    {
      id: "liability",
      title: "Limitation of Liability",
      paragraphs: [
        "To the maximum extent permitted by law, Snaxx Tech shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, profits, or goodwill, arising out of or related to your use of the App.",
        "In any case, our total liability to you for any claim arising from these Terms or the App shall not exceed the amount you paid for the App, if any.",
      ],
    },
    {
      id: "changes",
      title: "Changes to These Terms",
      paragraphs: [
        "We may update these Terms from time to time. When we do, we will revise the date at the top of this page. Continued use of the App after updated Terms take effect constitutes acceptance of the changes.",
      ],
    },
    {
      id: "governing-law",
      title: "Governing Law",
      paragraphs: [
        "These Terms do not limit consumer rights or remedies that cannot be waived under the law where you live. Any governing-law or court provision that we publish for a specific release will remain subject to those mandatory rights.",
      ],
    },
    {
      id: "contact",
      title: "Contact Us",
      paragraphs: [
        `Questions about these Terms? Reach us at ${CONTACT_EMAIL} — we're happy to help.`,
      ],
    },
  ]);
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
  consentModel: "ump",
  rewardedAdsOnly: true,
  noBackend: true,
  generalAudience: true,
  privacyEmail: PRIVACY_EMAIL,
};

// Geo Guesser World 3D! (com.snaxxtech.geoguesser) — the outlier of the
// catalogue: it is online-only, persists nothing at all (scores live in memory
// for the length of a session), and requests non-personalized ads rather than
// showing a UMP consent form. It also streams panoramas, map tiles, and its
// mapping libraries from third parties, each of which sees the device IP.
const GEO_GUESSER_PROFILE: LegalProfile = {
  localData: null,
  supportsPlayGames: false,
  isGame: true,
  adProvider: "admob",
  consentModel: "non-personalized",
  adPlacements:
    "Ads appear in three places: a full-screen ad after the fifth and final round, shown before your score summary; a banner on that summary screen; and a banner inside the guess drawer. No ad interrupts you while you are exploring a panorama.",
  prohibitAdInterference: true,
  noBackend: true,
  noDeviceLocation: true,
  generalAudience: true,
  contentAttribution:
    "Street-level imagery comes from Mapillary, and map tiles come from CARTO, built from data by OpenStreetMap contributors.",
  contentServices: [
    {
      name: "Mapillary (Meta)",
      purpose: "Supplies the street-level panoramas you explore and the location search behind them.",
      policyLabel: "Mapillary privacy policy",
      policyHref: "https://www.mapillary.com/privacy",
      policyDescription: "How Mapillary handles information from apps and sites that request its imagery.",
    },
    {
      name: "CARTO",
      purpose: "Supplies the map tiles for the guessing map, built from OpenStreetMap data.",
      policyLabel: "CARTO privacy policy",
      policyHref: "https://carto.com/privacy/",
      policyDescription: "How CARTO handles information when its basemap tiles are requested.",
    },
    {
      name: "unpkg (Cloudflare)",
      purpose: "Delivers the Leaflet and mapillary-js mapping libraries the App loads at runtime.",
      policyLabel: "Cloudflare privacy policy",
      policyHref: "https://www.cloudflare.com/privacypolicy/",
      policyDescription: "How Cloudflare, which serves the unpkg CDN, handles information from requests it answers.",
    },
  ],
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
  "geo-guesser-world-3d": {
    slug: "geo-guesser-world-3d",
    appName: "Geo Guesser World 3D!",
    appKind: "geography guessing game",
    accent: "#14B8A6",
    effectiveDate: "July 25, 2026",
    contactEmail: CONTACT_EMAIL,
    privacy: buildPrivacy(
      "Geo Guesser World 3D!",
      "geography guessing game",
      GEO_GUESSER_PROFILE,
    ),
    terms: buildTerms(
      "Geo Guesser World 3D!",
      "geography guessing game",
      GEO_GUESSER_PROFILE,
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
