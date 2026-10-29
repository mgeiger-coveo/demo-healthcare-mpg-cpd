export const InternationalizationEnabled = false;

export const DefaultLanguage = "en";

export const LanguagesConfig = {
  en: "🇺🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
};

// #region HomeConfig

// -----------------------  HomeConfig  -----------------------
// Encompasses Header Text, Hero Text, Main Recommendation Text & Video Recommendation Text

// For the following you don't need to define the property if you don't want to translate it.
// The few that have "title": {} are there as a reference point to what the object should look like.
// Although there is default text for each field on the UI, you can overwrite it here or in the file directly.
export const HomeHeaderConfigTranslations = {
  "Service Support": {
    fr: "Service Assistance",
    de: "Support",
  },
  Ecommerce: {
    fr: "Boutique",
    de: "Webshop",
  },
  Workplace: {
    fr: "Intranet",
    de: "Intranat",
  },
  "Site Search": {
    fr: "Recherche",
    de: "Website-Suche",
  },
  "AI Labs": {
    fr: "Laboratoire IA",
    de: "AI Lab",
  },
  Docs: {
    fr: "Documentation",
    de: "Dokumentation",
  },
};

export const HomeProductsSearchBoxTranslations = {
  searchPlaceholder: {
    fr: "Rechercher des produits...",
    de: "Produkte suchen...",
  },
  suggestedSearches: {
    fr: "Recherches Suggérées",
    de: "Vorgeschlagene Suchen",
  },
  featuredResults: {
    fr: "Résultats Populaires",
    de: "beliebte Produkte",
  },
  moreResults: {
    fr: "Plus de Résultats",
    de: "weitere Ergebnisse",
  },
};

export const HeroConfigTranslations = {
  title: {
    fr: "La seule plateforme d'intelligence artificielle spécialement conçue pour rendre chaque expérience numérique agréable, pertinente et rentable",
    de: "Die einzige Plattform für künstliche Intelligenz, die speziell dafür entwickelt wurde, jedes digitale Erlebnis angenehm, relevant und profitabel zu machen",
  },
  description: {
    fr: "Recherche Avancée. Recommandations pertinentes. Personnalisation inégalée",
    de: "Erweiterte Suche. Relevante Empfehlungen. Beispiellose Individualisierung",
  },
  buttonText: {
    fr: "Explorer",
    de: "mehr erfahren",
  },
};

export const HomeTopRecommendationConfigTranslations = {
  title: {
    fr: "Recommandations",
    de: "Empfehlungen",
  },
  description: {
    fr: "Voici vos recommandations personnalisées",
    de: "personalisierte Empfehlungen",
  },
};

export const HomeBottomRecommendationConfigTranslations = {
  title: {
    fr: "Vidéos",
    de: "Video",
  },
  description: {
    fr: "Voici vos recommandations personnalisées",
    de: "personalisierte Video Empfehlungen",
  },
};

// #endregion

// #region SearchConfig

// -----------------------  SearchConfig  -----------------------
// Encompasses Default Text & Tab Text

// Only thing that changes here typically would be to add additional languages
export const SearchConfigTranslations = {
  searchBarTitle: {
    en: "What can we help you find?",
    fr: "Que pouvons-nous vous aider à trouver?",
    de: "Wie könnnen wir Ihnen helfen?",
  },
  popularResults: {
    fr: "Résultats Populaires",
    de: "beliebte Produkte",
  },
  noResults: {
    en: "No results found",
    fr: "Aucun résultat trouvé",
    de: "Keine Ergebnisse gefunden",
  },
  popularQueries: {
    en: "Popular Queries",
    fr: "Recherches Populaires",
    de: "beliebte Suchen",
  },
  featuredResults: {
    en: "Featured Results",
    fr: "Résultats Populaires",
    de: "beliebte Produkte",
  },
  moreResults: {
    en: "More Results",
    fr: "Plus de Résultats",
    de: "weitere Ergebnisse",
  },
  learnMore: {
    en: "Learn more",
    fr: "Apprendre plus",
    de: "mehr erfahren",
  },
  watchNow: {
    en: "Watch Now",
    fr: "Regardez",
    de: "anschauen",
  },
  recentQueries: {
    fr: "Recherches Récentes",
    de: "zuletzt gesucht",
  },
  recentResults: {
    en: "Recent Results",
    de: "zuletzt angeschaut",
  },
  smartSnippets: {
    fr: "Snippet Intelligent",
    de: "Smart Snippets",
  },
  generativeAnswering: {
    en: "Generative Answering",
    fr: "Réponse Générative",
    de: "Generative Antworten",
  },
  summaryResults: {
    en: "Results of for",
    fr: "Résultats de pour",
    de: "Ergebnisse von für",
  },
  sortBy: {
    en: "Sort by",
    fr: "Trier par",
    de: "Sortieren nach",
  },
  resultsPerPage: {
    en: "Results per page",
    fr: "Résultats par page",
    de: "Ergebnisse pro Seite",
  },
};

// #region MPGConfig
// -----------------------  MPGConfig  -----------------------
// Static strings of the /mpg "Find Care" page. Defaults live in src/config/MPGConfig.tsx
// and are returned as-is while InternationalizationEnabled is false.
export const MPGConfigTranslations = {
  pageTitle: {
    fr: "Trouver des soins chez Barca Health",
    de: "Versorgung bei Barca Health finden",
  },
  pageSubtitle: {
    fr: "Trouvez un médecin, explorez les spécialités et découvrez les soins adaptés à vos besoins.",
    de: "Finden Sie eine Ärztin oder einen Arzt, entdecken Sie Fachgebiete und passende Versorgungsangebote.",
  },
  searchPlaceholder: {
    fr: "Rechercher des médecins, spécialités ou services...",
    de: "Ärzte, Fachgebiete oder Leistungen suchen...",
  },
  searchInputLabel: {
    fr: "Rechercher des médecins, spécialités ou services",
    de: "Ärzte, Fachgebiete oder Leistungen suchen",
  },
  refinementsTitle: {
    fr: "Affinez votre recherche",
    de: "Suche verfeinern",
  },
  providersTitleSuffix: {
    fr: "praticiens",
    de: "Behandelnde",
  },
  allProvidersLabel: {
    fr: "Tous les praticiens",
    de: "Alle Behandelnden",
  },
  noProvidersMessage: {
    fr: "Aucun praticien ne correspond à votre recherche.",
    de: "Keine Behandelnden entsprechen Ihrer Suche.",
  },
  facet_hc_specialties: {
    fr: "Spécialité",
    de: "Fachgebiet",
  },
  facet_hc_locations: {
    fr: "Emplacement",
    de: "Standort",
  },
  facet_hc_languages: {
    fr: "Langues",
    de: "Sprachen",
  },
  facet_hc_accepting_patients: {
    fr: "Accepte de nouveaux patients",
    de: "Nimmt neue Patienten auf",
  },
  facet_hc_telehealth: {
    en: "Telehealth Available",
    fr: "Télésanté",
    de: "Telemedizin",
  },
  facet_hc_medical_group: {
    en: "Medical Group",
    fr: "Équipe médicale",
    de: "Gemeinschaftspraxis",
  },

  // Provider detail page (/providers/:providerId). The two templates keep their
  // `{lastName}` / `{name}` placeholder so each locale controls its own word order;
  // substitution happens after this lookup.
  providerAboutHeadingTemplate: {
    fr: "À propos du Dr {lastName}",
    de: "Über Dr. {lastName}",
  },
  providerPhotoAltTemplate: {
    fr: "Photo de {name}",
    de: "Foto von {name}",
  },
  providerBackLabel: {
    fr: "Retour à la recherche de soins",
    de: "Zurück zur Versorgungssuche",
  },
  providerLoadingLabel: {
    fr: "Chargement du praticien...",
    de: "Behandelnde werden geladen...",
  },
  providerNotFoundTitle: {
    fr: "Praticien introuvable",
    de: "Behandelnde nicht gefunden",
  },
  providerNotFoundBody: {
    fr: "Nous n'avons trouvé aucun praticien avec cet identifiant. Il a peut-être été retiré de l'annuaire.",
    de: "Wir konnten keine Behandelnden mit dieser Kennung finden. Möglicherweise wurden sie aus dem Verzeichnis entfernt.",
  },
  providerCtaTitle: {
    fr: "Prêt à prendre rendez-vous ?",
    de: "Bereit, einen Termin zu vereinbaren?",
  },
  providerCtaSubtext: {
    fr: "Choisissez un lieu et demandez un rendez-vous avec ce praticien.",
    de: "Wählen Sie einen Standort und fragen Sie einen Termin bei dieser Person an.",
  },
  providerCtaButton: {
    fr: "Demander un rendez-vous →",
    de: "Termin anfragen →",
  },
  providerCtaConfirmationTitle: {
    fr: "Demande de rendez-vous reçue",
    de: "Terminanfrage erhalten",
  },
  providerCtaConfirmationBody: {
    fr: "Ceci est une démonstration. Aucun rendez-vous n'a été pris et aucune information n'a été envoyée.",
    de: "Dies ist eine Demo. Es wurde kein Termin vereinbart und es wurden keine Daten gesendet.",
  },
  providerCtaConfirmationClose: {
    fr: "Fermer",
    de: "Schließen",
  },
  appointmentDialogTitle: {
    fr: "Demander un rendez-vous (démonstration)",
    de: "Termin anfragen (Demo)",
  },
  appointmentDialogCloseLabel: {
    fr: "Fermer la demande de rendez-vous",
    de: "Terminanfrage schließen",
  },
  appointmentStepProgressTemplate: {
    fr: "Étape {current} sur {total} : {label}",
    de: "Schritt {current} von {total}: {label}",
  },
  appointmentStepLocationLabel: {
    fr: "Lieu",
    de: "Standort",
  },
  appointmentStepVisitTypeLabel: {
    fr: "Type de consultation",
    de: "Terminart",
  },
  appointmentStepReviewLabel: {
    fr: "Vérification",
    de: "Prüfung",
  },
  appointmentStepConfirmationLabel: {
    fr: "Envoyée",
    de: "Gesendet",
  },
  appointmentLocationHeading: {
    fr: "Sélectionnez un lieu",
    de: "Wählen Sie einen Standort",
  },
  appointmentLocationGroupLabel: {
    fr: "Lieux indiqués pour ce praticien",
    de: "Für diese Behandelnde eingetragene Standorte",
  },
  appointmentLocationHint: {
    fr: "Sélectionnez un lieu pour continuer.",
    de: "Wählen Sie einen Standort, um fortzufahren.",
  },
  appointmentLocationUnavailableTitle: {
    fr: "Aucun lieu n'est indiqué pour ce praticien",
    de: "Für diese Behandelnde sind keine Standorte eingetragen",
  },
  appointmentLocationUnavailableBody: {
    fr: "Ce praticien n'a aucun lieu dans l'annuaire ; aucun lieu ne peut donc être sélectionné. Aucun lieu n'est suggéré ni supposé en son nom.",
    de: "Diese Behandelnde hat keine Standorte im Verzeichnis, daher kann kein Standort ausgewählt werden. Es wird kein Standort in ihrem Namen vorgeschlagen oder angenommen.",
  },
  appointmentVisitTypeHeading: {
    fr: "Sélectionnez un type de consultation",
    de: "Wählen Sie eine Terminart",
  },
  appointmentVisitTypeGroupLabel: {
    fr: "Types de consultation de démonstration",
    de: "Terminarten zur Demonstration",
  },
  appointmentVisitTypeHint: {
    fr: "Sélectionnez un type de consultation pour continuer.",
    de: "Wählen Sie eine Terminart, um fortzufahren.",
  },
  appointmentVisitTypeNewPatient: {
    fr: "Consultation de nouveau patient",
    de: "Erstberatung für neue Patienten",
  },
  appointmentVisitTypeFollowUp: {
    fr: "Consultation de suivi",
    de: "Folgetermin",
  },
  appointmentVisitTypeTelehealth: {
    fr: "Téléconsultation",
    de: "Videotermin",
  },
  appointmentVisitTypeDemoNote: {
    fr: "Ce sont uniquement des options de démonstration. Elles ne représentent ni une disponibilité vérifiée ni des créneaux réservables.",
    de: "Dies sind nur Demonstrationsoptionen. Sie stellen keine geprüfte Verfügbarkeit und keine buchbaren Terminkontingente dar.",
  },
  appointmentReviewHeading: {
    fr: "Vérifiez cette demande simulée",
    de: "Prüfen Sie diese simulierte Anfrage",
  },
  appointmentReviewProviderLabel: {
    fr: "Praticien",
    de: "Behandelnde",
  },
  appointmentReviewSpecialtyLabel: {
    fr: "Spécialité",
    de: "Fachgebiet",
  },
  appointmentReviewLocationLabel: {
    fr: "Lieu",
    de: "Standort",
  },
  appointmentReviewVisitTypeLabel: {
    fr: "Type de consultation",
    de: "Terminart",
  },
  appointmentReviewSimulatedNotice: {
    fr: "Demande simulée. L'envoi de ce formulaire ne prend aucun rendez-vous, et aucune information n'est collectée, conservée ni transmise à un professionnel de santé.",
    de: "Simulierte Anfrage. Das Absenden dieses Formulars vereinbart keinen Termin, und es werden keine Informationen erfasst, gespeichert oder an medizinisches Fachpersonal gesendet.",
  },
  appointmentBackLabel: {
    fr: "Retour",
    de: "Zurück",
  },
  appointmentContinueLabel: {
    fr: "Continuer",
    de: "Weiter",
  },
  appointmentCancelLabel: {
    fr: "Annuler",
    de: "Abbrechen",
  },
  appointmentSubmitLabel: {
    fr: "Envoyer la demande simulée",
    de: "Simulierte Anfrage senden",
  },
  appointmentConfirmationTitle: {
    fr: "Demande de rendez-vous envoyée (démonstration)",
    de: "Terminanfrage gesendet (Demo)",
  },
  appointmentConfirmationBody: {
    fr: "Ceci est une démonstration. Aucun rendez-vous n'a été pris et aucune information n'a été transmise à un professionnel de santé.",
    de: "Dies ist eine Demonstration. Es wurde kein Termin vereinbart und es wurden keine Informationen an medizinisches Fachpersonal gesendet.",
  },
  appointmentConfirmationCloseLabel: {
    fr: "Fermer",
    de: "Schließen",
  },
  appointmentConfirmationDiscoveryLabel: {
    fr: "Revenir à la recherche de praticiens",
    de: "Zurück zur Behandelndensuche",
  },
  sectionSpecialties: {
    fr: "Spécialités",
    de: "Fachgebiete",
  },
  sectionLanguages: {
    fr: "Langues",
    de: "Sprachen",
  },
  sectionLocations: {
    fr: "Emplacements",
    de: "Standorte",
  },
  sectionServices: {
    fr: "Services",
    de: "Leistungen",
  },
  sectionBoardCertifications: {
    fr: "Certifications",
    de: "Zertifizierungen",
  },
  // Replaces the former `chipAcceptingPatients` key: hc_accepting_patients no longer
  // renders as a grey attribute chip, it renders as the green NewPatientBadge on provider
  // cards and in the detail header. Same label string, one key for all three variants.
  newPatientBadgeLabel: {
    fr: "Accepte de nouveaux patients",
    de: "Nimmt neue Patienten auf",
  },
  chipTelehealth: {
    fr: "Télésanté",
    de: "Telemedizin",
  },
  querySuggestionsGroupLabel: {
    fr: "Recherches suggérées",
    de: "Suchvorschläge",
  },
  productSuggestionsGroupLabel: {
    fr: "Praticiens",
    de: "Behandelnde",
  },
  // Each locale keeps the {count} token so formatTemplate can substitute it.
  suggestionCountTemplate: {
    fr: "{count} suggestions disponibles",
    de: "{count} Vorschläge verfügbar",
  },
  searchClearLabel: {
    fr: "Effacer la recherche",
    de: "Suche löschen",
  },
  searchSubmitLabel: {
    fr: "Rechercher",
    de: "Suchen",
  },
  viewModeGroupLabel: {
    fr: "Disposition des résultats",
    de: "Ergebnis-Layout",
  },
  viewModeListLabel: {
    fr: "Liste",
    de: "Liste",
  },
  viewModeGridLabel: {
    fr: "Grille",
    de: "Raster",
  },
  locationOverflowTemplate: {
    fr: "+{count} autres",
    de: "+{count} weitere",
  },
  locationOverflowTitleTemplate: {
    fr: "Également à {locations}",
    de: "Auch an {locations}",
  },
  // Specialty listing pages (/specialty/:specialtySlug). The title and description keys
  // are per slug so each page is translatable without a new mechanism; a page whose key
  // is absent falls back to the config default, which is getText's existing behaviour.
  specialtyListingTitle_cardiology: {
    fr: "Cardiologues",
    de: "Kardiologie-Fachkräfte",
  },
  specialtyListingDescription_cardiology: {
    fr: "Trouvez des cardiologues et des spécialistes cardiovasculaires.",
    de: "Finden Sie Kardiologen und Spezialisten für Herz-Kreislauf-Erkrankungen.",
  },
  specialtyListingTitle_orthopedics: {
    fr: "Orthopédistes",
    de: "Orthopädie-Fachkräfte",
  },
  specialtyListingDescription_orthopedics: {
    fr: "Trouvez des spécialistes en orthopédie et en soins musculosquelettiques.",
    de: "Finden Sie Fachkräfte für Orthopädie und muskuloskelettale Versorgung.",
  },
  listingErrorMessage: {
    fr: "Nous n'avons pas pu charger cette liste de spécialité.",
    de: "Diese Fachgebietsliste konnte nicht geladen werden.",
  },
  listingUnknownSpecialtyMessage: {
    fr: "Nous n'avons pas de page de liste pour cette spécialité.",
    de: "Für dieses Fachgebiet gibt es keine Listenseite.",
  },
  listingEmptyMessage: {
    fr: "Cette liste de spécialité ne contient aucun praticien pour le moment.",
    de: "Diese Fachgebietsliste enthält derzeit keine Behandelnden.",
  },
  listingUnresolvedMessage: {
    fr: "Cette liste n'a pas été résolue dans le Merchandising Hub.",
    de: "Diese Liste wurde im Merchandising Hub nicht aufgelöst.",
  },
  // `{viewUrl}` is preserved in every locale and substituted by formatTemplate.
  listingUnresolvedDetailTemplate: {
    fr: "Aucun produit et aucune facette n'ont été renvoyés pour l'url de liste {viewUrl}. Vérifiez l'url de la liste et la configuration des facettes dans le Merchandising Hub.",
    de: "Für die Listen-URL {viewUrl} wurden keine Produkte und keine Facetten zurückgegeben. Prüfen Sie die Listen-URL und die Facetten-Konfiguration im Merchandising Hub.",
  },
  listingClearFiltersLabel: {
    fr: "Effacer tous les filtres",
    de: "Alle Filter löschen",
  },
};

// #endregion

export const SearchPageTabConfigTranslations = {
  all: {
    caption: {
      fr: "Tout",
      de: "Alle",
    },
  },
  products: {
    caption: {
      en: "Products",
      de: "Produkte",
    },
  },
  eventsWebinars: {
    caption: {
      fr: "Événements & Webinaires",
    },
  },
  resources: {
    caption: {
      fr: "Ressources",
    },
  },
  sharepoint: {},
  blog: {},
  newsroom: {
    caption: {
      fr: "Nouvelles",
    },
  },
  supportTraining: {
    caption: {
      fr: "Assistance & Formation",
    },
  },
  youtube: {
    de: "Videos",
  },
};

export const FacetTranslations = {
  author: {
    label: {
      fr: "Auteur",
      de: "Autor",
    },
  },
  source: {
    values: {
      fr: {
        Products: "Produits",
      },
    },
  },
  category: {
    label: {
      fr: "Solutions de Plateforme",
      de: "Kategorie",
    },
  },
  // Since concepts translates to concepts in French, in theory we don't need this object to be here at all.
  // So as an example of not requiring all the fields it will be commented out.
  // "concepts": {
  //     "label": {
  //         "fr": "Concepts"
  //     }
  // }
  //...
};

export const CoveoStandardTranslations = {
  "load-more-results": {
    en: "Load More Content",
  },
  search: {},
  "no-title": {},
  "search-ellipsis": {},
  left: {},
  right: {},
  "search-box": {},
  "search-box-with-suggestions": {},
  "search-box-with-suggestions-macos": {},
  "search-box-with-suggestions-keyboardless": {},
  "search-suggestions-single-list": {},
  "search-suggestions-double-list": {},
  "search-suggestion-single-list": {},
  "search-suggestion-double-list": {},
  "search-suggestion-button": {},
  "search-disabled": {},
  "query-suggestion-label": {},
  "recent-query-suggestion-label": {},
  "instant-results-suggestion-label": {},
  "facet-search-input": {},
  "facet-search": {},
  "facet-value": {},
  "facet-value_plural": {},
  "facet-value_other": {},
  "facet-value-exclude": {},
  "facet-value-exclude_plural": {},
  "facet-value-exclude_other": {},
  "remove-filter-on": {},
  "remove-exclusion-filter-on": {},
  "query-suggestion-list": {},
  "tab-search": {},
  clear: {
    de: "Alle Filter löschen",
  },
  "all-categories": {},
  "show-all-results": {},
  "show-more": {},
  "show-less": {},
  "show-less-facet-values": {},
  "show-more-facet-values": {},
  "facet-values": {},
  "facet-search-results": {},
  "facet-search-results-count": {},
  "facet-search-results-count_plural": {},
  "facet-search-results-count_other": {},
  pagination: {},
  next: {},
  previous: {},
  "page-number": {},
  "no-values-found": {},
  "results-per-page": {},
  sort: {},
  filters: {},
  "sort-by": {},
  relevance: {},
  "most-recent": {},
  "clear-filters": {},
  "clear-filters_plural": {},
  "clear-filters_other": {},
  "clear-filters-for-facet": {},
  "clear-filters-for-facet_plural": {},
  "clear-filters-for-facet_other": {},
  "collapse-facet": {},
  "expand-facet": {},
  "showing-results-of": {},
  "showing-results-of_plural": {},
  "showing-results-of_other": {},
  "showing-results-of-with-query": {},
  "showing-results-of-with-query_plural": {},
  "showing-results-of-with-query_other": {},
  "showing-results-of-load-more": {},
  "load-all-results": {},
  "collapse-results": {},
  "no-documents-related": {},
  "in-seconds": {},
  "in-seconds_plural": {},
  "in-seconds_other": {},
  "no-results-for": {},
  "no-results-for-did-you-mean": {},
  "showing-results-for": {},
  "search-instead-for": {},
  "search-tips": {},
  "no-results": {},
  "more-matches-for": {},
  "no-matches-found-for": {},
  "recent-searches": {},
  "clear-recent-searches": {},
  "cancel-last-action": {},
  cancel: {},
  "check-spelling": {},
  "try-using-fewer-keywords": {},
  "select-fewer-filters": {},
  author: {},
  "file-type": {},
  language: {},
  source: {},
  "printable-uri": {},
  "collapsed-uri-parts": {},
  disconnected: {},
  "check-your-connection": {},
  "no-endpoints": {},
  "invalid-token": {},
  "add-sources": {},
  "coveo-online-help": {},
  "cannot-access": {},
  "something-went-wrong": {},
  "if-problem-persists": {},
  "more-info": {},
  "clear-all-filters": {},
  "n-more": {},
  "show-n-more-filters": {},
  "query-auto-corrected-to": {},
  "did-you-mean": {},
  close: {},
  "no-label": {},
  to: {},
  min: {},
  max: {},
  apply: {},
  yes: {},
  no: {},
  popover: {},
  "number-input-minimum": {},
  "number-input-maximum": {},
  "number-input-apply": {},
  start: {},
  "date-input-start": {},
  "date-input-end": {},
  "date-input-apply": {},
  "past-minute": {},
  "past-minute_plural": {},
  "past-minute_other": {},
  "past-hour": {},
  "past-hour_plural": {},
  "past-hour_other": {},
  "past-day": {},
  "past-day_plural": {},
  "past-day_other": {},
  "past-week": {},
  "past-week_plural": {},
  "past-week_other": {},
  "past-month": {},
  "past-month_plural": {},
  "past-month_other": {},
  "past-quarter": {},
  "past-quarter_plural": {},
  "past-quarter_other": {},
  "past-year": {},
  "past-year_plural": {},
  "past-year_other": {},
  "next-minute": {},
  "next-minute_plural": {},
  "next-minute_other": {},
  "next-hour": {},
  "next-hour_plural": {},
  "next-hour_other": {},
  "next-day": {},
  "next-day_plural": {},
  "next-day_other": {},
  "next-week": {},
  "next-week_plural": {},
  "next-week_other": {},
  "next-month": {},
  "next-month_plural": {},
  "next-month_other": {},
  "next-quarter": {},
  "next-quarter_plural": {},
  "next-quarter_other": {},
  "next-year": {},
  "next-year_plural": {},
  "next-year_other": {},
  in: {},
  under: {},
  "preview-result": {},
  "sort-and-filter": {},
  "view-results": {},
  "organization-is-paused": {},
  "organization-will-resume": {},
  rating: {},
  "and-up": {},
  only: {},
  "loading-results": {},
  "query-suggestions-available": {},
  "query-suggestions-available_plural": {},
  "query-suggestions-available_other": {},
  "query-suggestions-unavailable": {},
  stars: {},
  stars_plural: {},
  stars_other: {},
  "stars-only": {},
  "stars-range": {},
  "with-colon": {},
  "between-quotations": {},
  "between-parentheses": {},
  notifications: {},
  "notification-n": {},
  "smart-snippet": {},
  "smart-snippet-source": {},
  "smart-snippet-feedback-inquiry": {},
  "smart-snippet-feedback-thanks": {},
  "smart-snippet-feedback-explain-why": {},
  "smart-snippet-feedback-select-reason": {},
  details: {},
  "feedback-send": {},
  "smart-snippet-feedback-reason-does-not-answer": {},
  "smart-snippet-feedback-reason-partially-answers": {},
  "smart-snippet-feedback-reason-was-not-a-question": {},
  "smart-snippet-feedback-reason-other": {},
  "smart-snippet-people-also-ask": {},
  "edit-insight": {},
  "insight-history": {},
  "insight-related-cases": {},
  "full-search": {},
  "calendar-last-day": {},
  "calendar-same-day": {},
  "calendar-next-day": {},
  "calendar-next-week": {},
  "calendar-last-week": {},
  approx_year: {},
  approx_year_plural: {},
  approx_year_other: {},
  approx_month: {},
  approx_month_plural: {},
  approx_month_other: {},
  approx_day: {},
  day_plural: {},
  day_other: {},
  quickview: {},
  "keywords-highlight": {},
  minimize: {},
  "quickview-add-word": {},
  "quickview-remove-word": {},
  "quickview-next": {},
  "quickview-previous": {},
  "quickview-toggle-navigation": {},
  "quickview-navigate-keywords": {},
  "quickview-loading": {},
  "quickview-loaded": {},
  more: {},
  "tab-popover": {},
  "generating-answer": {},
  "answer-generated": {},
  "answer-could-not-be-generated": {},
  "generated-answer-hidden": {},
  "generated-answer-title": {},
  "generated-answer-toggle-on": {},
  "generated-answer-toggle-off": {},
  "this-answer-was-helpful": {},
  "this-answer-was-not-helpful": {},
  "generated-answer-loading": {},
  retry: {},
  "retry-stream-message": {},
  feedback: {},
  "generated-answer-feedback-instructions": {},
  irrelevant: {},
  "not-accurate": {},
  "out-of-date": {},
  harmful: {},
  other: {},
  "add-details": {},
  "generated-answer-feedback-success": {},
  "modal-done": {},
  steps: {},
  "steps-tooltip": {},
  bullets: {},
  "bullets-tooltip": {},
  summary: {},
  rephrase: {},
  citations: {},
  "copy-generated-answer": {},
  "generated-answer-copied": {},
  "failed-to-copy-generated-answer": {},
};

// #endregion
