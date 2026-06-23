/* @proprietary license */

/**
 * French guidance blocks for REST `.fr.mdx` pages (whenToUse, caveats, related).
 * Keeps EN/FR heading structure aligned for doctool `sync-i18n --check`.
 */
export type FrOperationGuidance = {
  whenToUse?: string;
  caveats?: string;
  related?: string;
};

export const FR_OPERATION_COPY: Partial<Record<string, FrOperationGuidance>> = {
  AccountsController_checkAvailableBalance: {
    whenToUse:
      'Appelez avant un retrait, un paiement bénéficiaire ou tout flux nécessitant un solde disponible garanti.',
    related:
      '[Soldes de compte](/api/balances/AccountsController_getBalance) · [Retraits](/api/payouts/PayoutsUnifiedController_create)',
  },
  ChargesController_cancelCardCharge: {
    whenToUse: "Utilisez lorsque l'acheteur abandonne le paiement.",
    related:
      '[Créer un encaissement carte](/api/charge/ChargesController_createCardCharge)',
  },
  ChargesController_createCardCharge: {
    whenToUse:
      'Utilisez pour la saisie carte dans votre application lorsque vous gérez l’UI produit et la tokenisation.',
    caveats:
      'Ne journalisez ni n’exposez `client_secret` publiquement ; traitez-le comme une capacité courte durée pour le SDK client.',
    related:
      '[Créer une session checkout](/api/checkout-sessions/CheckoutSessionsController_create) si vous préférez l’encaissement hébergé.',
  },
  ChargesController_createWaveCharge: {
    whenToUse:
      'Utilisez pour un encaissement mobile money initié serveur lorsque vous n’utilisez **pas** une session checkout hébergée.',
    caveats:
      'Suivez les instructions du fournisseur dans la réponse ; l’UX dépend du rail (USSD, redirection app, etc.).',
    related:
      '[Mobile money](/build/mobile-money) · [Encaissements directs](/build/direct-charges) · [Créer une session checkout](/api/checkout-sessions/CheckoutSessionsController_create) · [Transactions](/api/transactions/TransactionsController_findAll)',
  },
  ChargesController_getCardCharge: {
    whenToUse: 'Utilisez après confirmation client pour interroger le statut.',
    related:
      '[Créer un encaissement carte](/api/charge/ChargesController_createCardCharge)',
  },
  CheckoutSessionsController_create: {
    whenToUse:
      'Utilisez pour l’e-commerce, les factures ou tout flux où lomi. héberge l’encaissement et renvoie l’acheteur sur votre site.',
    caveats:
      'Préférez les sessions checkout aux encaissements ad hoc pour une expérience acheteur cohérente. Pour les produits pay_what_you_want, le montant doit respecter minimum_amount et maximum_amount du prix lié (unité × quantité).',
    related:
      '[Liens de paiement](/api/payment-links/PaymentLinksController_create) · [Récupérer une session checkout](/api/checkout-sessions/CheckoutSessionsController_findOne)',
  },
  CheckoutSessionsController_findAll: {
    whenToUse:
      'Utilisez pour la réconciliation, le support ou l’export des tentatives checkout récentes.',
    related:
      '[Récupérer une session checkout](/api/checkout-sessions/CheckoutSessionsController_findOne)',
  },
  CheckoutSessionsController_findOne: {
    whenToUse:
      'Interrogez ou affichez après redirection checkout, ou lors de notifications asynchrones indexées par ID de session.',
    related:
      '[Lister les transactions](/api/transactions/TransactionsController_findAll)',
  },
  CustomersController_create: {
    whenToUse:
      'Utilisez lorsque vous avez une identité client stable et souhaitez carte enregistrée, abonnements ou un historique de transactions propre.',
    related:
      '[Lister les clients](/api/customers/CustomersController_findAll) · [Mettre à jour un client](/api/customers/CustomersController_update)',
  },
  CustomersController_findOne: {
    whenToUse:
      'Utilisez pour afficher un profil client ou valider un ID avant checkout ou abonnement.',
    related:
      '[Lister les clients](/api/customers/CustomersController_findAll) · [Transactions client](/api/customers/CustomersController_getTransactions)',
  },
  CustomersController_getTransactions: {
    whenToUse:
      'Utilisez pour l’historique d’achats d’un client dans le support ou le portail marchand.',
    related:
      '[Récupérer un client](/api/customers/CustomersController_findOne) · [Lister les transactions](/api/transactions/TransactionsController_findAll)',
  },
  CustomersController_remove: {
    whenToUse:
      'Utilisez pour retirer un client du répertoire lorsque la conformité ou le support l’exige.',
    caveats:
      'La suppression peut être soumise à des contraintes de données liées ; vérifiez les réponses d’erreur métier.',
    related:
      '[Récupérer un client](/api/customers/CustomersController_findOne) · [Lister les clients](/api/customers/CustomersController_findAll)',
  },
  DiscountCouponsController_create: {
    whenToUse:
      'Utilisez pour lancer des promotions ou des remises ciblées par segment.',
    related:
      '[Récupérer un coupon](/api/discount-coupons/DiscountCouponsController_findOne)',
  },
  DiscountCouponsController_getPerformance: {
    whenToUse:
      'Utilisez dans les tableaux de bord marketing pour mesurer l’efficacité d’une campagne.',
    related:
      '[Récupérer un coupon](/api/discount-coupons/DiscountCouponsController_findOne)',
  },
  PaymentLinksController_create: {
    whenToUse:
      'Utilisez pour factures, vente sociale ou pages de paiement légères sans checkout complet.',
    related:
      '[Lister les liens de paiement](/api/payment-links/PaymentLinksController_findAll) · [Sessions checkout](/api/checkout-sessions/CheckoutSessionsController_create)',
  },
  PaymentRequestsController_create: {
    whenToUse:
      'Utilisez pour des demandes « payez cette facture » ou POS où le payeur confirme sur son appareil.',
    related:
      '[Récupérer une demande de paiement](/api/payment-requests/PaymentRequestsController_findOne) · [Transactions](/api/transactions/TransactionsController_findAll)',
  },
  PayoutsUnifiedController_create: {
    whenToUse:
      'Utilisez pour les mouvements de trésorerie depuis votre solde lomi.',
    caveats:
      'Les retraits self exigent payout_method_id ; les bénéficiaires Wave exigent recipient.name et recipient.phone (pas payout_method_id). Les rails Wave renvoient 400 avec une clé test — clés live uniquement. MTN renvoie 400 tant que non pris en charge.',
    related:
      '[Lister les retraits](/api/payouts/PayoutsUnifiedController_findAll) · [Vérifier le solde disponible](/api/balances/AccountsController_checkAvailableBalance)',
  },
  PayoutsUnifiedController_findAll: {
    whenToUse: 'Utilisez pour la réconciliation et le support.',
    related:
      '[Récupérer un retrait](/api/payouts/PayoutsUnifiedController_findOne)',
  },
  PayoutsUnifiedController_findOne: {
    whenToUse: 'Utilisez après création ou depuis les webhooks.',
    related: '[Créer un retrait](/api/payouts/PayoutsUnifiedController_create)',
  },
  ProductsController_addPrice: {
    whenToUse:
      'Utilisez pour un nouveau marché ou une deuxième option de facturation sur le même produit.',
    related: '[Récupérer un produit](/api/products/ProductsController_findOne)',
  },
  ProductsController_create: {
    whenToUse:
      'Utilisez lors de l’onboarding catalogue pour checkout, abonnements ou liens de paiement liés à des SKU.',
    related:
      '[Lister les produits](/api/products/ProductsController_findAll) · [Liens de paiement](/api/payment-links/PaymentLinksController_create)',
  },
  ProductsController_setDefaultPrice: {
    whenToUse:
      'Utilisez après avoir ajouté plusieurs prix pour définir le repli checkout et liens.',
    related:
      '[Ajouter un prix produit](/api/products/ProductsController_addPrice)',
  },
  RefundsController_findAll: {
    whenToUse: 'Utilisez pour réconciliation, support et tableaux de bord.',
    related:
      '[Récupérer un remboursement](/api/refunds/RefundsController_findOne)',
  },
  RefundsController_findOne: {
    whenToUse:
      'Utilisez après création ou depuis des flux webhook pour confirmer les détails.',
    related: '[Créer un remboursement](/api/refunds/RefundsController_create)',
  },
  SubscriptionsController_cancel: {
    whenToUse:
      'Utilisez pour arrêter la facturation récurrente à la fin de période ou immédiatement selon votre flux.',
    related:
      '[Récupérer un abonnement](/api/subscriptions/SubscriptionsController_findOne) · [Abonnements](/build/subscriptions)',
  },
  SubscriptionsController_findByCustomer: {
    whenToUse:
      'Utilisez pour afficher les abonnements actifs d’un client dans le support ou le portail.',
    related:
      '[Récupérer un client](/api/customers/CustomersController_findOne) · [Abonnements](/build/subscriptions)',
  },
  TransactionsController_findAll: {
    whenToUse:
      'Utilisez pour réconciliation, exports et corrélation avec les webhooks de paiement.',
    related:
      '[Récupérer une transaction](/api/transactions/TransactionsController_findOne) · [Transactions](/build/transactions)',
  },
  WebhookDeliveryLogsController_findAll: {
    whenToUse:
      'Utilisez pour diagnostiquer les échecs de livraison webhook et les retries.',
    related:
      '[Lister les webhooks](/api/webhooks/WebhooksController_findAll) · [Webhooks](/build/webhooks)',
  },
  WebhooksController_update: {
    whenToUse:
      'Utilisez pour changer l’URL de destination, les événements écoutés ou la rotation de secret.',
    caveats:
      'Après rotation du secret, mettez à jour la vérification de signature côté serveur avant de désactiver l’ancien secret.',
    related:
      '[Créer un webhook](/api/webhooks/WebhooksController_create) · [Webhooks](/build/webhooks)',
  },
};
