export interface LandingImage {
  id: string;
  url: string;
}

export interface LandingSection {
  id: string;
  tab_label: string;
  title: string;
  description: string;
  position: number;
  images: LandingImage[];
}

export interface LandingSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  google_play_url: string;
  bazaar_url: string;
  cta_title: string;
  cta_subtitle: string;
}

export interface LandingHighlight {
  id: string;
  icon: string;
  title: string;
  description: string;
  position: number;
}

export interface LandingFAQ {
  id: string;
  question: string;
  answer: string;
  position: number;
}

export interface LandingContent {
  sections: LandingSection[];
  settings: LandingSettings;
  highlights: { features: LandingHighlight[]; steps: LandingHighlight[] };
  faqs: LandingFAQ[];
}
