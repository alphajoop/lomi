/* @proprietary license */

import type { Language } from './config';

type LocaleStringTable = { [key: string]: string };
type TranslationsByLanguage = { [L in Language]: LocaleStringTable };

const STRINGS: TranslationsByLanguage = {
  en: {
    'search.all': 'All',
    'search.core': 'Core',
    'search.fundamentalsDescription': 'Introduction and fundamentals',
    'search.apiReference': 'API reference',
    'search.apiReferenceDescription': 'REST guides and resources',
    'search.filter': 'Filter',
    'search.search': 'Search',
    'ui.searchNoResult': 'No results found',
    'ui.toc': 'On this page',
    'ui.tocNoHeadings': 'No headings',
    'ui.lastUpdate': 'Last updated on',
    'ui.chooseLanguage': 'Choose a language',
    'ui.nextPage': 'Next page',
    'ui.previousPage': 'Previous page',
    'ui.chooseTheme': 'Theme',
    'ui.editOnGithub': 'Edit on GitHub',
    'ui.notFound': 'NOT FOUND',
    'section.start': 'Start',
    'section.build': 'Build',
    'section.resources': 'Resources',
    'section.firstSteps': 'First steps',
    'section.apiReference': 'API reference',
    'section.restApi': 'REST API',
    'section.basics': 'Basics',
    'section.implementation': 'Implementation',
    'section.community': 'Community',
    'section.management': 'Management',
    'sectionDescription.start':
      'Understand lomi., create your account, get API keys, make a test payment, and go live.',
    'sectionDescription.build':
      'Choose an integration path and build checkout, payment links, subscriptions, webhooks, and tools.',
    'sectionDescription.resources':
      'Support, changelog, merchant policies, open-source material, and contributor documentation.',
    'sectionDescription.firstSteps':
      'Developers use lomi. to reliably accept payments in West Africa.',
    'sectionDescription.apiReference':
      'Complete reference to building with lomi. API.',
    'sectionDescription.restApi': 'Payment and commerce endpoints.',
    'footer.company_disclaimer':
      '<p>This documentation describes the lomi. merchant API and related products.</p>\n\n<p>Integration behavior can change; use the generated OpenAPI reference and your dashboard for authoritative details.</p>',
    'components.business_outreach.message':
      'Building payments for West Africa? Book a short call with the team.',
    'components.business_outreach.reach_out': 'Schedule a call',
    'components.business_outreach.dismiss': 'Dismiss',
  },
  fr: {
    'search.all': 'Tout',
    'search.core': 'Socle',
    'search.fundamentalsDescription': 'Introduction et fondamentaux',
    'search.apiReference': 'Référence API',
    'search.apiReferenceDescription': 'Guides et ressources REST',
    'search.filter': 'Filtrer',
    'search.search': 'Rechercher',
    'ui.searchNoResult': 'Aucun résultat',
    'ui.toc': 'Sur cette page',
    'ui.tocNoHeadings': 'Aucun titre',
    'ui.lastUpdate': 'Dernière mise à jour le',
    'ui.chooseLanguage': 'Choisir la langue',
    'ui.nextPage': 'Page suivante',
    'ui.previousPage': 'Page précédente',
    'ui.chooseTheme': 'Thème',
    'ui.editOnGithub': 'Modifier sur GitHub',
    'ui.notFound': 'PAGE INTROUVABLE',
    'section.start': 'Démarrer',
    'section.build': 'Construire',
    'section.resources': 'Ressources',
    'section.firstSteps': 'Premiers pas',
    'section.apiReference': 'Référence API',
    'section.restApi': 'API REST',
    'section.basics': 'Bases',
    'section.implementation': 'Mise en œuvre',
    'section.community': 'Communauté',
    'section.management': 'Gestion',
    'sectionDescription.start':
      'Comprendre lomi., créer un compte, obtenir des clés API, faire un paiement de test et passer en production.',
    'sectionDescription.build':
      'Choisir une intégration et construire checkout, liens de paiement, abonnements, webhooks et outils.',
    'sectionDescription.resources':
      'Support, changelog, règles marchandes, open source et documentation contributeur.',
    'sectionDescription.firstSteps':
      "Les développeurs utilisent lomi. pour encaisser des paiements en toute fiabilité en Afrique de l'Ouest.",
    'sectionDescription.apiReference':
      "Référence complète pour intégrer l'API lomi.",
    'sectionDescription.restApi':
      'Points de terminaison pour paiements et commerce.',
    'footer.company_disclaimer':
      "<p>Cette documentation décrit l'API marchande lomi. et les produits associés.</p>\n\n<p>Le comportement d'intégration peut évoluer ; consultez l'OpenAPI générée et votre tableau de bord pour les détails de référence.</p>",
    'components.business_outreach.message':
      'Vous construisez des paiements en Afrique de l’Ouest ? Prenez un court rendez-vous avec l’équipe.',
    'components.business_outreach.reach_out': 'Planifier un appel',
    'components.business_outreach.dismiss': 'Fermer',
  },
};

function interpolate(
  template: string,
  values?: Record<string, string | number | undefined>,
): string {
  if (!values) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    values[key] !== undefined && values[key] !== null
      ? String(values[key])
      : '',
  );
}

export function translate(
  key: string,
  lang: Language,
  values?: Record<string, string | number | undefined>,
): string {
  const primary = STRINGS[lang]?.[key];
  const fallback = STRINGS.en[key];
  const raw = primary ?? fallback ?? key;
  return interpolate(raw, values);
}

/** @deprecated Prefer `translate`; kept for call sites that pass `(key, lang)`. */
export function t(
  key: string,
  lang: Language,
  values?: Record<string, string | number | undefined>,
): string {
  return translate(key, lang, values);
}
