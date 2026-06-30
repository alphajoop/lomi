/**
 * OpenAPI schema types
 * AUTO-GENERATED — do not edit manually
 * Source: apps/docs/openapi.json
 */

export interface paths {
    "/accounts/balance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Solde du compte
         * @description Récupère le solde courant pour toutes les devises ou pour une devise précise
         */
        get: operations["AccountsController_getBalance"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/accounts/balance/breakdown": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Détail du solde
         * @description Récupère le détail des soldes (disponible, en attente, total). Conversion optionnelle vers une devise cible.
         */
        get: operations["AccountsController_getBalanceBreakdown"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/accounts/balance/check/{currency}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Vérifier le solde disponible
         * @description Vérifie si le marchand dispose d’un solde disponible suffisant dans la devise indiquée
         */
        get: operations["AccountsController_checkAvailableBalance"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Détails de l'organisation
         * @description Renvoie les informations de l'organisation du marchand authentifié
         */
        get: operations["OrganizationsController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizations/metrics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Indicateurs de l'organisation
         * @description Renvoie le MRR, l'ARR, la LTV, le chiffre d'affaires et le nombre de clients pour votre organisation.
         */
        get: operations["OrganizationsController_getMetrics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organizations/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Organisation par ID
         * @description Renvoie les détails d'une organisation par son identifiant (doit correspondre à l'organisation authentifiée)
         */
        get: operations["OrganizationsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/merchants/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get merchant details
         * @description Returns merchant profile and organization metrics (MRR, ARR, LTV). Metrics are refreshed daily and on subscription changes.
         */
        get: operations["MerchantsController_getDetails"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/merchants/{id}/mrr": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get merchant MRR */
        get: operations["MerchantsController_getMrr"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/merchants/{id}/arr": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get merchant ARR */
        get: operations["MerchantsController_getArr"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/merchants/{id}/balance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get merchant account balance for a currency */
        get: operations["MerchantsController_getBalance"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/providers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List payment providers
         * @description Returns connection status for payment providers configured for your organization.
         */
        get: operations["ProvidersController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customer-subscriptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List customer subscriptions */
        get: operations["CustomerSubscriptionsController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customer-subscriptions/{subscription_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get customer subscription */
        get: operations["CustomerSubscriptionsController_findOne"];
        put?: never;
        post?: never;
        /** Cancel customer subscription */
        delete: operations["CustomerSubscriptionsController_remove"];
        options?: never;
        head?: never;
        /** Update customer subscription */
        patch: operations["CustomerSubscriptionsController_update"];
        trace?: never;
    };
    "/subscriptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lister les abonnements
         * @description Renvoie tous les abonnements de l'organisation du marchand authentifié. Les abonnements sont créés automatiquement lorsque les clients effectuent des paiements récurrents.
         */
        get: operations["SubscriptionsController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/subscriptions/customer/{customerId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Abonnements d’un client
         * @description Renvoie les abonnements d'un client. Réponse 404 si le client n'existe pas ou n'est pas accessible avec cette clé API.
         */
        get: operations["SubscriptionsController_findByCustomer"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/subscriptions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtenir un abonnement par ID
         * @description Renvoie un abonnement. Réponse 404 s'il n'existe pas ou n'est pas accessible avec cette clé API.
         */
        get: operations["SubscriptionsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Mettre à jour un abonnement
         * @description Met à jour le statut ou les métadonnées (ex. pause). Les champs tarifaires restent gérés par le système.
         */
        patch: operations["SubscriptionsController_update"];
        trace?: never;
    };
    "/subscriptions/{id}/uncancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Annuler une résiliation planifiée
         * @description Retire une résiliation planifiée en fin de période (`cancel_at_period_end`).
         */
        post: operations["SubscriptionsController_uncancel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/subscriptions/{id}/change-plan": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Changer le plan tarifaire
         * @description Met à jour le price_id d’un abonnement actif.
         */
        post: operations["SubscriptionsController_changePlan"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/subscriptions/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Résilier un abonnement
         * @description Résilie un abonnement actif immédiatement ou en fin de période (`cancel_at_period_end`).
         */
        post: operations["SubscriptionsController_cancel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lister les transactions
         * @description Renvoie les transactions de l'organisation du marchand authentifié avec filtres avancés. Les transactions sont créées par le système lors du traitement des paiements.
         */
        get: operations["TransactionsController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/transactions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtenir une transaction par ID
         * @description Renvoie une transaction. Réponse 404 si elle n'existe pas ou n'est pas accessible avec cette clé API.
         */
        get: operations["TransactionsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lister les clients
         * @description Renvoie tous les clients de l'organisation du marchand authentifié. Filtres possibles : recherche, type de client et statut d'activité.
         */
        get: operations["CustomersController_findAll"];
        put?: never;
        /**
         * Créer un client
         * @description Crée un client dans votre organisation. Il est automatiquement rattaché à votre organisation.
         */
        post: operations["CustomersController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customers/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtenir un client par ID
         * @description Renvoie un client. Réponse 404 si le client n'existe pas ou n'est pas accessible avec cette clé API.
         */
        get: operations["CustomersController_findOne"];
        put?: never;
        post?: never;
        /**
         * Supprimer un client
         * @description Retire un client de l'usage actif : il n'apparaît plus dans les listes ni les réponses de détail. Réponse 404 si le client n'existe pas ou n'est pas accessible avec cette clé API.
         */
        delete: operations["CustomersController_remove"];
        options?: never;
        head?: never;
        /**
         * Mettre à jour un client
         * @description Met à jour un client. N'envoyez que les champs à modifier. Réponse 404 si le client n'existe pas ou n'est pas accessible avec cette clé API.
         */
        patch: operations["CustomersController_update"];
        trace?: never;
    };
    "/customers/{id}/portal-audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Hosted customer portal audit
         * @description Liste les évènements portal (sessions, OTP, souscriptions self-service) pour ce client.
         */
        get: operations["CustomersController_getPortalAudit"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customers/{id}/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Transactions du client
         * @description Renvoie les transactions d'un client. Réponse 404 si le client n'existe pas ou n'est pas accessible avec cette clé API.
         */
        get: operations["CustomersController_getTransactions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customers/{id}/portal-launch-session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Créer une session de lancement du portail client
         * @description Génère un lien hébergé à usage unique vers le portail client pour un client de votre organisation. Destiné aux applications marchandes (backend) via clé API.
         */
        post: operations["CustomersController_createPortalLaunchSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payment-requests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lister les demandes de paiement
         * @description Renvoie toutes les demandes de l'organisation avec pagination et filtres optionnels (statut, client).
         */
        get: operations["PaymentRequestsController_findAll"];
        put?: never;
        /**
         * Créer une demande de paiement
         * @description Crée une demande de paiement pour un client. Elle a une date d’expiration et peut être suivie jusqu’à réussite ou expiration.
         */
        post: operations["PaymentRequestsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payment-requests/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtenir une demande de paiement par ID
         * @description Renvoie le détail d’une demande (statut actuel, informations de paiement).
         */
        get: operations["PaymentRequestsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/refunds": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lister les remboursements */
        get: operations["RefundsController_findAll"];
        put?: never;
        /**
         * Créer un remboursement
         * @description Refunds a completed transaction (card, Wave, or MTN MoMo). Merchant balance updates immediately. Supports full and partial refunds. In test mode, MTN refunds are ledger-only (no MTN API call). In live mode, MTN MoMo requires a RequestToPay reference on the original transaction.
         */
        post: operations["RefundsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/refunds/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtenir un remboursement */
        get: operations["RefundsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lister les produits
         * @description Renvoie tous les produits de l'organisation du marchand authentifié, avec prix et frais intégrés. Utile pour afficher le catalogue ou intégrer des systèmes externes.
         */
        get: operations["ProductsController_findAll"];
        put?: never;
        /**
         * Créer un produit
         * @description Crée un produit avec un ou plusieurs tarifs en une seule requête. Au moins un prix est requis. Le premier prix, ou celui avec `is_default`, est utilisé lorsque aucun prix n'est précisé au paiement.
         */
        post: operations["ProductsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/products/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtenir un produit par ID
         * @description Renvoie un produit avec ses prix et frais. Réponse 404 s'il n'existe pas ou n'est pas accessible avec cette clé API.
         */
        get: operations["ProductsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/products/{id}/prices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Ajouter un prix à un produit
         * @description Ajoute une nouvelle option tarifaire à un produit (palier, devise ou période). Un produit ne peut avoir au plus 3 prix actifs. Les prix existants ne se modifient pas : créez-en un nouveau.
         */
        post: operations["ProductsController_addPrice"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/products/{id}/prices/{priceId}/set-default": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Définir le prix par défaut
         * @description Indique le prix utilisé par défaut pour ce produit (par exemple si le paiement ne fournit pas d'ID de prix). Un seul défaut à la fois ; un nouveau défaut remplace l'ancien.
         */
        post: operations["ProductsController_setDefaultPrice"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/discount-coupons": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lister les coupons
         * @description Renvoie tous les coupons de réduction de l'organisation du marchand authentifié.
         */
        get: operations["DiscountCouponsController_findAll"];
        put?: never;
        /**
         * Créer un coupon
         * @description Crée un coupon dans votre organisation. Le code sera automatiquement mis en majuscules.
         */
        post: operations["DiscountCouponsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/discount-coupons/{id}/performance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Indicateurs de performance du coupon
         * @description Renvoie les statistiques d'utilisation et l'impact sur le chiffre d'affaires pour un coupon donné.
         */
        get: operations["DiscountCouponsController_getPerformance"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/discount-coupons/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtenir un coupon par ID
         * @description Renvoie un coupon. Réponse 404 s'il n'existe pas ou n'est pas accessible avec cette clé API.
         */
        get: operations["DiscountCouponsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/checkout-sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lister les sessions de paiement
         * @description Renvoie les sessions de l'organisation avec pagination et filtre de statut optionnel.
         */
        get: operations["CheckoutSessionsController_findAll"];
        put?: never;
        /**
         * Créer une session de paiement
         * @description Crée une page de paiement hébergée pour que le client finalise son achat. La session expire après 60 minutes par défaut. Renvoie un identifiant de session et une URL de redirection.
         */
        post: operations["CheckoutSessionsController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/checkout-sessions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtenir une session de paiement par ID
         * @description Renvoie le détail d’une session (statut, client et produits associés).
         */
        get: operations["CheckoutSessionsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payment-links": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lister les liens de paiement
         * @description Renvoie tous les liens de l'organisation avec pagination et filtres optionnels (type, actif).
         */
        get: operations["PaymentLinksController_findAll"];
        put?: never;
        /**
         * Créer un lien de paiement
         * @description Crée un lien de paiement partageable : produit (lien produit) ou montant fixe (lien instantané). Les liens produit référencent un produit et un prix optionnel ; les liens instantanés ont un montant fixe.
         */
        post: operations["PaymentLinksController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payment-links/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtenir un lien de paiement par ID
         * @description Renvoie le détail d’un lien (URL, configuration et statut).
         */
        get: operations["PaymentLinksController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payouts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lister les virements */
        get: operations["PayoutsUnifiedController_findAll"];
        put?: never;
        /**
         * Créer un virement
         * @description Virement vers votre compte enregistré (self) ou vers un tiers sur mobile money / SPI (beneficiary).
         */
        post: operations["PayoutsUnifiedController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/payouts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtenir un virement */
        get: operations["PayoutsUnifiedController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/disputes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lister les litiges */
        get: operations["DisputesController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/disputes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtenir un litige */
        get: operations["DisputesController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/risk-assessments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List payment risk assessments */
        get: operations["RadarController_listAssessments"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/risk-assessments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a risk assessment */
        get: operations["RadarController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/organization/radar-settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Radar settings for the organization */
        get: operations["RadarController_getSettings"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Radar settings */
        patch: operations["RadarController_updateSettings"];
        trace?: never;
    };
    "/settlements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List settlement periods
         * @description Returns completed payment totals grouped by availability date and currency. Each settlement_id is {currency}:{YYYY-MM-DD} (UTC date of available_at).
         */
        get: operations["SettlementsController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/settlements/{id}/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List transactions in a settlement period
         * @description Returns completed transactions whose available_at falls on the settlement date for the given currency.
         */
        get: operations["SettlementsController_findTransactions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhook-delivery-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lister les journaux de livraison
         * @description Renvoie les journaux de livraison pour un webhook donné. Ils sont créés automatiquement lors des tentatives d'envoi. Filtrez avec le paramètre de requête webhookId.
         */
        get: operations["WebhookDeliveryLogsController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhook-delivery-logs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Obtenir un journal de livraison par ID
         * @description Renvoie un journal. Réponse 404 s'il n'existe pas ou n'est pas accessible avec cette clé API.
         */
        get: operations["WebhookDeliveryLogsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List logs
         * @description Returns paginated logs for the organization. The `type` query parameter selects which log stream to read: api_request, api_error, webhook_delivery, or activity.
         */
        get: operations["LogsController_findAll"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/logs/{type}/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a log entry
         * @description Returns a single log entry by type and ID. Responds with 404 when the entry does not exist or is outside the API key organization scope.
         */
        get: operations["LogsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhooks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lister les webhooks */
        get: operations["WebhooksController_findAll"];
        put?: never;
        /** Créer un webhook */
        post: operations["WebhooksController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhooks/{id}/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Envoyer un événement test au webhook */
        post: operations["WebhooksController_test"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhooks/{webhookId}/logs/{logId}/retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Relancer une livraison webhook */
        post: operations["WebhooksController_retryDelivery"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhooks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtenir un webhook par ID */
        get: operations["WebhooksController_findOne"];
        put?: never;
        post?: never;
        /** Supprimer un webhook */
        delete: operations["WebhooksController_remove"];
        options?: never;
        head?: never;
        /** Mettre à jour un webhook */
        patch: operations["WebhooksController_update"];
        trace?: never;
    };
    "/charge/wave": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create direct Wave charge
         * @description Starts a payer-facing Wave mobile-money charge. Redirect the customer to `wave_launch_url` or `checkout_url` in the response.
         */
        post: operations["ChargesController_createWaveCharge"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/charge/mtn": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create MTN MoMo charge
         * @description Initiates an MTN Mobile Money RequestToPay. With a test API key the transaction completes in the ledger without calling the MTN sandbox.
         */
        post: operations["ChargesController_createMtnCharge"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/charge/switch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create Switch charge (server-side card authorization)
         * @description Authorizes a card from server-supplied credentials and routes it across acquiring rails. May return a redirect URL for 3DS authentication or signal `retry_other_rail` to fall back to another rail. Requires a PCI-DSS-compliant integration.
         */
        post: operations["ChargesController_createSwitchCharge"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/charge/card": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create card charge (client_secret)
         * @description Creates an embedded card charge and returns the client_secret for your payment UI.
         */
        post: operations["ChargesController_createCardCharge"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/charge/card/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Retrieve card charge */
        get: operations["ChargesController_getCardCharge"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/charge/card/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Cancel card charge */
        post: operations["ChargesController_cancelCardCharge"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/meters": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List meters */
        get: operations["MetersController_findAll"];
        put?: never;
        /**
         * Create a meter
         * @description Defines a billable metric for usage-based products. Events with matching code update meter balances.
         */
        post: operations["MetersController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/meters/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a meter */
        get: operations["MetersController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update a meter */
        patch: operations["MetersController_update"];
        trace?: never;
    };
    "/meters/{id}/balances/{customerId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get meter balance for a customer
         * @description Returns aggregated consumed units for the meter and customer.
         */
        get: operations["MetersController_getBalance"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/usage-events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List usage events */
        get: operations["UsageEventsController_findAll"];
        put?: never;
        /**
         * Record a usage event
         * @description Idempotent usage ingest. Events are processed asynchronously and update meter balances.
         */
        post: operations["UsageEventsController_ingest"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/usage-events/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a usage event */
        get: operations["UsageEventsController_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/usage-subscriptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create a usage subscription
         * @description Enrolls a customer on a usage_based product without an upfront charge. Required before billing metered usage.
         */
        post: operations["UsageEventsController_createUsageSubscription"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/usage-billing/periods": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List usage billing periods */
        get: operations["UsageBillingController_listPeriods"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/usage-billing/subscriptions/{subscriptionId}/usage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get meter usage for a subscription */
        get: operations["UsageBillingController_getSubscriptionUsage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/usage-billing/revenue": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Combined MRR + usage + one-time revenue metrics */
        get: operations["UsageBillingController_getRevenue"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/usage-billing/credits": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Credit prepaid usage units to a customer meter wallet */
        post: operations["UsageBillingController_creditWallet"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/usage-billing/entitlements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create or update a plan entitlement feature */
        post: operations["UsageBillingController_createEntitlement"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/usage-billing/entitlements/check": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Check if a customer has an active entitlement */
        get: operations["UsageBillingController_checkEntitlement"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AccountBalanceResponseDto: {
            /**
             * @description Currency code
             * @example XOF
             */
            currency_code: string;
            /**
             * @description Account balance
             * @example 100000
             */
            balance: number;
            /**
             * @description Last updated timestamp
             * @example 2024-01-01T00:00:00Z
             */
            last_updated: string;
        };
        BalanceBreakdownResponseDto: {
            /**
             * @description Currency code
             * @example XOF
             */
            currency_code: string;
            /**
             * @description Available balance
             * @example 100000
             */
            available_balance: number;
            /**
             * @description Pending balance
             * @example 5000
             */
            pending_balance: number;
            /**
             * @description Total balance (available + pending)
             * @example 105000
             */
            total_balance: number;
            /**
             * @description Converted available balance
             * @example 165
             */
            converted_available_balance?: number;
            /**
             * @description Converted pending balance
             * @example 8.25
             */
            converted_pending_balance?: number;
            /**
             * @description Converted total balance
             * @example 173.25
             */
            converted_total_balance?: number;
            /**
             * @description Target currency for conversion
             * @example USD
             */
            target_currency: string;
        };
        OrganizationResponseDto: {
            /**
             * @description Unique organization identifier
             * @example 123e4567-e89b-12d3-a456-426614174000
             */
            organization_id: string;
            /**
             * @description Organization name
             * @example Acme Inc
             */
            name: string;
            /**
             * @description Organization email
             * @example contact@acme.com
             */
            email: string;
            /**
             * @description Organization phone number
             * @example +221771234567
             */
            phone_number: string;
            /**
             * @description KYC verification status
             * @example verified
             * @enum {string}
             */
            verification_status: "unverified" | "starter" | "verified";
            /**
             * @description Organization website
             * @example https://acme.com
             */
            website_url?: string;
            /**
             * @description Organization logo URL
             * @example https://cdn.lomi.africa/logos/acme.png
             */
            logo_url?: string;
            /**
             * @description Organization status
             * @example active
             * @enum {string}
             */
            status: "active" | "inactive" | "suspended";
            /**
             * @description Default currency
             * @example XOF
             * @enum {string}
             */
            default_currency: "XOF" | "USD" | "EUR";
            /**
             * @description URL-friendly slug
             * @example acme-inc
             */
            slug?: string;
            /**
             * @description Whether storefront is enabled
             * @example true
             */
            storefront_enabled: boolean;
            /**
             * @description Total revenue generated
             * @example 250000
             */
            total_revenue: number;
            /**
             * @description Total transaction count
             * @example 1234
             */
            total_transactions: number;
            /**
             * @description Total merchant count
             * @example 5
             */
            total_merchants: number;
            /**
             * @description Total customer count
             * @example 567
             */
            total_customers: number;
            /**
             * @description Monthly Recurring Revenue
             * @example 50000
             */
            mrr: number;
            /**
             * @description Annual Recurring Revenue
             * @example 600000
             */
            arr: number;
            /**
             * @description Average Customer Lifetime Value
             * @example 150000
             */
            merchant_lifetime_value: number;
            /**
             * @description Number of employees
             * @example 10-50
             */
            employee_number?: string;
            /**
             * @description Industry sector
             * @example Technology
             */
            industry?: string;
            /**
             * @description Whether a payout PIN is configured (not the PIN value)
             * @example true
             */
            has_payout_pin?: boolean;
            /**
             * @description Whether this is a starter business
             * @example false
             */
            is_starter_business: boolean;
            /**
             * @description Additional metadata
             * @example {
             *       "custom_field": "value"
             *     }
             */
            metadata?: Record<string, never>;
            /**
             * @description Organization creation timestamp
             * @example 2024-01-01T00:00:00Z
             */
            created_at: string;
            /**
             * @description Last update timestamp
             * @example 2024-01-01T00:00:00Z
             */
            updated_at: string;
            /**
             * @description Whether organization is soft-deleted
             * @example false
             */
            is_deleted: boolean;
            /**
             * @description Deletion timestamp if deleted
             * @example null
             */
            deleted_at?: string;
        };
        OrganizationMetricsResponseDto: {
            /**
             * @description Monthly Recurring Revenue in default currency
             * @example 50000
             */
            mrr: number;
            /**
             * @description Annual Recurring Revenue in default currency
             * @example 600000
             */
            arr: number;
            /**
             * @description Total revenue generated
             * @example 250000
             */
            total_revenue: number;
            /**
             * @description Total number of transactions
             * @example 1234
             */
            total_transactions: number;
            /**
             * @description Total number of customers
             * @example 567
             */
            total_customers: number;
            /**
             * @description Currency code for all monetary values
             * @example XOF
             */
            currency_code: string;
            /**
             * @description When these metrics were calculated
             * @example 2024-01-01T00:00:00Z
             */
            calculated_at: string;
        };
        MerchantResponseDto: {
            /** @example 904d003c-3736-41d4-90a5-9de74d404fd7 */
            merchant_id: string;
            /** @example Test Merchant */
            name: string;
            /** @example merchant@example.com */
            email: string;
            /** @example +123456789 */
            phone_number?: string;
            /** @example SN */
            country?: string;
            /** @example 50000 */
            mrr: number;
            /** @example 600000 */
            arr: number;
            /** @example 1200000 */
            merchant_lifetime_value: number;
            /** @example 3 */
            retry_payment_every?: number;
            /** @example 5 */
            total_retries?: number;
            metadata?: Record<string, never>;
            created_at: string;
            updated_at: string;
        };
        MerchantMrrResponseDto: {
            merchant_id: string;
            mrr: number;
            /** @example XOF */
            currency_code: string;
            as_of_date: string;
        };
        MerchantArrResponseDto: {
            merchant_id: string;
            arr: number;
            /** @example XOF */
            currency_code: string;
            as_of_date: string;
        };
        MerchantBalanceResponseDto: {
            merchant_id: string;
            /** @example XOF */
            currency_code: string;
            balance: number;
            as_of_date: string;
        };
        SubscriptionResponseDto: {
            /**
             * @description Unique subscription identifier
             * @example 123e4567-e89b-12d3-a456-426614174000
             */
            subscription_id: string;
            /**
             * @description Organization ID
             * @example 789e0123-e89b-12d3-a456-426614174000
             */
            organization_id: string;
            /**
             * @description Product ID (recurring product)
             * @example 456e7890-e89b-12d3-a456-426614174000
             */
            product_id: string;
            /**
             * @description Price ID used for this subscription
             * @example 321e4567-e89b-12d3-a456-426614174000
             */
            price_id: string | null;
            /**
             * @description Customer ID
             * @example 654e7890-e89b-12d3-a456-426614174000
             */
            customer_id: string;
            /**
             * @description Subscription status
             * @example active
             * @enum {string}
             */
            status: "pending" | "active" | "past_due" | "cancelled" | "trial" | "paused" | "expired";
            /**
             * @description Subscription start date
             * @example 2024-01-15
             */
            start_date: string;
            /**
             * @description Subscription end date (set when cancelled)
             * @example 2024-12-31
             */
            end_date: string | null;
            /**
             * @description Next billing date (system-managed)
             * @example 2024-02-15
             */
            next_billing_date: string | null;
            /**
             * @description Additional metadata as JSON
             * @example {
             *       "notes": "Premium plan"
             *     }
             */
            metadata: Record<string, never> | null;
            /**
             * @description Environment (test or live)
             * @example live
             * @enum {string}
             */
            environment: "test" | "live";
            /**
             * @description When the subscription was created
             * @example 2024-01-15T10:30:00Z
             */
            created_at: string;
            /**
             * @description When the subscription was last updated
             * @example 2024-01-15T10:30:00Z
             */
            updated_at: string;
        };
        TransactionResponseDto: {
            /**
             * @description Unique transaction identifier
             * @example 123e4567-e89b-12d3-a456-426614174000
             */
            transaction_id: string;
            /**
             * @description Organization ID
             * @example 789e0123-e89b-12d3-a456-426614174000
             */
            organization_id: string;
            /**
             * @description Customer ID
             * @example 456e7890-e89b-12d3-a456-426614174000
             */
            customer_id: string;
            /**
             * @description Product ID (if applicable)
             * @example 321e4567-e89b-12d3-a456-426614174000
             */
            product_id: string | null;
            /**
             * @description Subscription ID (if applicable)
             * @example 654e7890-e89b-12d3-a456-426614174000
             */
            subscription_id: string | null;
            /**
             * @description Price ID used for this transaction
             * @example 987e6543-e89b-12d3-a456-426614174000
             */
            price_id: string | null;
            /**
             * @description Transaction type
             * @example payment
             * @enum {string}
             */
            transaction_type: "payment" | "refund" | "payout";
            /**
             * @description Transaction status
             * @example completed
             * @enum {string}
             */
            status: "pending" | "completed" | "failed" | "refunded" | "expired" | "cancelled";
            /**
             * @description Transaction description
             * @example Payment for Premium Subscription
             */
            description: string | null;
            /**
             * @description Quantity of items
             * @example 1
             */
            quantity: number;
            /**
             * @description Additional metadata as JSON
             * @example {
             *       "order_number": "ORD-12345"
             *     }
             */
            metadata: Record<string, never> | null;
            /**
             * @description Gross amount (total including fees)
             * @example 10000
             */
            gross_amount: number;
            /**
             * @description Total discount amount applied
             * @example 500
             */
            discount_amount: number;
            /**
             * @description Fee amount charged
             * @example 200
             */
            fee_amount: number;
            /**
             * @description Net amount (received after fees)
             * @example 9300
             */
            net_amount: number;
            /**
             * @description Currency code
             * @example XOF
             */
            currency_code: string;
            /**
             * @description Payment provider code
             * @example WAVE
             */
            provider_code: string;
            /**
             * @description Payment method code
             * @example MOBILE_MONEY
             */
            payment_method_code: string;
            /**
             * @description SPI transaction ID (if applicable)
             * @example SPI-TX-123456
             */
            spi_tx_id: string | null;
            /**
             * @description SPI account number used (if applicable)
             * @example 221771234567
             */
            spi_account_number: string | null;
            /**
             * @description SPI payment category (if applicable)
             * @example 000
             */
            spi_payment_category: string | null;
            /**
             * @description SPI payment status (if applicable)
             * @example IRREVOCABLE
             */
            spi_payment_status: string | null;
            /**
             * @description Whether this is a Buy Now Pay Later transaction
             * @example false
             */
            is_bnpl: boolean;
            /**
             * @description Whether this is a POS (Point of Sale) transaction
             * @example false
             */
            is_pos: boolean;
            /**
             * @description SPI payment sent date (if applicable)
             * @example 2024-01-15T10:30:00Z
             */
            spi_date_envoi: string | null;
            /**
             * @description SPI payment irreversible date (if applicable)
             * @example 2024-01-15T10:35:00Z
             */
            spi_date_irrevocabilite: string | null;
            /**
             * @description Environment (test or live)
             * @example live
             * @enum {string}
             */
            environment: "test" | "live";
            /**
             * @description When the transaction was created
             * @example 2024-01-15T10:30:00Z
             */
            created_at: string;
            /**
             * @description When the transaction was last updated
             * @example 2024-01-15T10:30:00Z
             */
            updated_at: string;
        };
        CustomerResponseDto: {
            /**
             * @description Unique customer identifier
             * @example 123e4567-e89b-12d3-a456-426614174000
             */
            customer_id: string;
            /**
             * @description Organization ID the customer belongs to
             * @example 789e0123-e89b-12d3-a456-426614174000
             */
            organization_id: string;
            /**
             * @description Customer full name
             * @example John Doe
             */
            name: string;
            /**
             * @description Customer email address
             * @example john.doe@example.com
             */
            email: string | null;
            /**
             * @description Customer phone number
             * @example +221771234567
             */
            phone_number: string | null;
            /**
             * @description Customer WhatsApp number
             * @example +221771234567
             */
            whatsapp_number: string | null;
            /**
             * @description Customer country
             * @example Senegal
             */
            country: string | null;
            /**
             * @description Customer city
             * @example Dakar
             */
            city: string | null;
            /**
             * @description Customer street address
             * @example 123 Main Street
             */
            address: string | null;
            /**
             * @description Customer postal code
             * @example 12345
             */
            postal_code: string | null;
            /**
             * @description Whether the customer is a business
             * @example false
             */
            is_business: boolean;
            /**
             * @description Additional metadata as JSON
             * @example {
             *       "custom_field": "value"
             *     }
             */
            metadata: Record<string, never> | null;
            /**
             * @description Environment (test or live)
             * @example live
             * @enum {string}
             */
            environment: "test" | "live";
            /**
             * @description When the customer was created
             * @example 2024-01-15T10:30:00Z
             */
            created_at: string;
            /**
             * @description When the customer was last updated
             * @example 2024-01-15T10:30:00Z
             */
            updated_at: string;
        };
        PortalLaunchSessionResponseDto: {
            /**
             * @description Customer UUID
             * @example 2d8f4f8b-1ea8-4de9-9fd8-f52f743bb265
             */
            customer_id: string;
            /**
             * @description Organization UUID
             * @example f8b15d6f-901f-4e7c-a0ab-1ce9e8d2a1ba
             */
            organization_id: string;
            /**
             * @description One-time launch token (returned once)
             * @example 7d3d5f0f0f124d18b96d3f013dea5e408f86e7b0f66a7e09c7f29bcf9244cc4e
             */
            launch_token: string;
            /**
             * @description Hosted customer portal launch URL
             * @example https://customers.lomi.africa/launch?token=7d3d5f0f0f124d18b96d3f013dea5e408f86e7b0f66a7e09c7f29bcf9244cc4e
             */
            launch_url: string;
            /**
             * @description Launch session TTL in seconds
             * @example 900
             */
            expires_in_seconds: number;
            /**
             * @description Requested customer-portal flow type
             * @example portal_home
             * @enum {string}
             */
            flow_type: "portal_home" | "subscription_cancel" | "subscription_manage";
            /**
             * @description Target subscription ID when flow_type=subscription_cancel
             * @example null
             */
            flow_subscription_id: string | null;
            /**
             * @description Merchant return URL shown in the portal header/footer
             * @example https://merchant.example.com/account
             */
            return_url: string | null;
            /**
             * @description Redirect destination after successful completion of deep-link flow
             * @example https://merchant.example.com/account/subscription-cancelled
             */
            flow_after_completion_url: string | null;
        };
        PaymentRequestResponseDto: {
            /** @example 123 */
            amount: number;
            /** @example string */
            created_at: string;
            /** @example string */
            created_by: string;
            /** @example string */
            currency_code: string;
            /** @example string */
            customer_id: string;
            /** @example string */
            description: string;
            /** @example string */
            environment: string;
            /** @example string */
            expiry_date: string;
            /** @example string */
            organization_id: string;
            /** @example string */
            payment_link: string;
            /** @example string */
            payment_reference: string;
            /** @example string */
            request_id: string;
            /** @example string */
            spi_account_number: string;
            /** @example string */
            spi_bulk_instruction_id: string;
            /** @example true */
            spi_confirmation: boolean;
            /** @example string */
            spi_date_envoi: string;
            /** @example string */
            spi_date_irrevocabilite: string;
            /** @example string */
            spi_date_limite_paiement: string;
            /** @example string */
            spi_date_limite_reponse: string;
            /** @example string */
            spi_date_rejet: string;
            /** @example true */
            spi_debit_differe: boolean;
            /** @example string */
            spi_end2end_id: string;
            /** @example string */
            spi_payeur_alias: string;
            /** @example string */
            spi_payeur_nom: string;
            /** @example string */
            spi_payeur_pays: string;
            /** @example string */
            spi_ref_doc_numero: string;
            /** @example 123 */
            spi_remise_amount: number;
            /** @example 123 */
            spi_remise_rate: number;
            /** @example string */
            spi_tx_id: string;
            /** @example string */
            status: string;
            /** @example string */
            updated_at: string;
        };
        CreateRefundDto: {
            /**
             * Format: uuid
             * @description UUID of a completed transaction (card, Wave, or MTN MoMo)
             */
            transaction_id: string;
            /** @description Amount to refund (same currency as the transaction) */
            amount: number;
            /** @description Reason for the refund */
            reason?: string;
            /**
             * @description Full or partial refund. If omitted, full when amount equals transaction gross amount.
             * @enum {string}
             */
            refund_type?: "full" | "partial";
            /**
             * @description Subscription side-effect after a full refund: default (cancel initial payment, pause renewal), cancel, pause, or none.
             * @enum {string}
             */
            subscription_action?: "default" | "cancel" | "pause" | "none";
        };
        RefundSubscriptionActionDto: {
            applied?: boolean;
            action?: string;
            subscription_id?: string | null;
            previous_status?: string;
            reason?: string;
        };
        CreateRefundResponseDto: {
            /** @example true */
            success: boolean;
            /** @example refund-uuid */
            refund_id: string;
            /** @example transaction-uuid */
            transaction_id: string;
            /** @example 5000 */
            refunded_amount: number;
            /** @example completed */
            status: string;
            /** @example Refund recorded. Customer credit is processed by our team. */
            message?: string;
            /**
             * @description Subscription side-effect applied after refund (if transaction was linked to a subscription).
             * @example {
             *       "applied": true,
             *       "action": "cancel",
             *       "subscription_id": "sub-uuid"
             *     }
             */
            subscription_action?: components["schemas"]["RefundSubscriptionActionDto"];
        };
        RefundListItemDto: {
            /** @example refund-uuid */
            refund_id: string;
            /** @example transaction-uuid */
            transaction_id: string;
            /** @example 5000 */
            amount: number;
            /** @example 5000 */
            refunded_amount: number;
            /** @example 100 */
            fee_amount: number;
            reason?: string;
            /** @example completed */
            status: string;
            /** @example 2025-01-01T00:00:00.000Z */
            created_at: string;
            /** @example 2025-01-01T00:00:00.000Z */
            updated_at: string;
        };
        PriceResponseDto: {
            /**
             * @description Unique price identifier
             * @example 123e4567-e89b-12d3-a456-426614174000
             */
            price_id: string;
            /**
             * @description Price amount. For standard/tiered: fixed unit price. For pay_what_you_want: suggested unit price pre-filled at checkout.
             * @example 10000
             */
            amount: number;
            /**
             * @description Currency code
             * @example XOF
             * @enum {string}
             */
            currency_code: "XOF" | "USD" | "EUR";
            /**
             * @description Billing interval for recurring products
             * @example month
             * @enum {string|null}
             */
            billing_interval: "day" | "week" | "month" | "year" | null;
            /**
             * @description Pricing model
             * @example standard
             * @enum {string}
             */
            pricing_model: "standard" | "pay_what_you_want" | "tiered";
            /**
             * @description Lowest unit price the customer may pay (pay_what_you_want only).
             * @example 5000
             */
            minimum_amount: number | null;
            /**
             * @description Optional upper bound on unit price (pay_what_you_want only).
             * @example 50000
             */
            maximum_amount: number | null;
            /**
             * @description Whether this price is active
             * @example true
             */
            is_active: boolean;
            /**
             * @description Whether this is the default price
             * @example true
             */
            is_default: boolean;
            /**
             * @description Additional metadata
             * @example {
             *       "notes": "Early bird pricing"
             *     }
             */
            metadata: Record<string, never> | null;
            /**
             * @description When the price was created
             * @example 2024-01-15T10:30:00Z
             */
            created_at: string;
            /**
             * @description When the price was last updated
             * @example 2024-01-15T10:30:00Z
             */
            updated_at: string;
        };
        ProductResponseDto: {
            /**
             * @description Unique product identifier
             * @example 123e4567-e89b-12d3-a456-426614174000
             */
            product_id: string;
            /**
             * @description Organization ID
             * @example 789e0123-e89b-12d3-a456-426614174000
             */
            organization_id: string;
            /**
             * @description Product name
             * @example Premium Subscription
             */
            name: string;
            /**
             * @description Product description
             * @example Access to all premium features
             */
            description: string | null;
            /**
             * @description Product type
             * @example recurring
             * @enum {string}
             */
            product_type: "one_time" | "recurring" | "usage_based";
            /**
             * @description Product images URLs
             * @example [
             *       "https://example.com/image.png"
             *     ]
             */
            images: string[] | null;
            /**
             * @description Whether the product is active
             * @example true
             */
            is_active: boolean;
            /**
             * @description Whether to display on storefront
             * @example true
             */
            display_on_storefront: boolean;
            /**
             * @description Additional metadata
             * @example {
             *       "category": "subscription"
             *     }
             */
            metadata: Record<string, never> | null;
            /**
             * @description Action to take on failed payment
             * @example pause
             * @enum {string|null}
             */
            failed_payment_action: "pause" | "cancel" | "continue" | null;
            /**
             * @description Day of month to charge (1-31)
             * @example 1
             */
            charge_day: number | null;
            /**
             * @description When to charge first payment
             * @example initial
             * @enum {string|null}
             */
            first_payment_type: "initial" | "non_initial" | "prorated" | null;
            /**
             * @description Whether trial is enabled
             * @example false
             */
            trial_enabled: boolean;
            /**
             * @description Trial period in days
             * @example 14
             */
            trial_period_days: number | null;
            /**
             * @description Usage aggregation method
             * @example sum
             * @enum {string|null}
             */
            usage_aggregation: "sum" | "max" | "last_during_period" | "last_ever" | null;
            /**
             * @description Unit of usage measurement
             * @example api_calls
             */
            usage_unit: string | null;
            /**
             * @description Environment
             * @example live
             * @enum {string}
             */
            environment: "test" | "live";
            /** @description Product prices */
            prices: components["schemas"]["PriceResponseDto"][];
            /**
             * @description Associated fees
             * @example []
             */
            fees: Record<string, never>[];
            /**
             * @description When the product was created
             * @example 2024-01-15T10:30:00Z
             */
            created_at: string;
            /**
             * @description When the product was last updated
             * @example 2024-01-15T10:30:00Z
             */
            updated_at: string;
        };
        DiscountCouponResponseDto: {
            /**
             * @description Unique coupon identifier
             * @example 123e4567-e89b-12d3-a456-426614174000
             */
            coupon_id: string;
            /**
             * @description Organization ID the coupon belongs to
             * @example 789e0123-e89b-12d3-a456-426614174000
             */
            organization_id: string;
            /**
             * @description Unique coupon code
             * @example SAVE20
             */
            code: string;
            /**
             * @description Type of discount
             * @example percentage
             * @enum {string}
             */
            discount_type: "percentage" | "fixed";
            /**
             * @description Discount percentage (if discount_type is percentage)
             * @example 20
             */
            discount_percentage: number | null;
            /**
             * @description Fixed discount amount (if discount_type is fixed)
             * @example 1000
             */
            discount_fixed_amount: number | null;
            /**
             * @description Customer type this coupon applies to
             * @example all
             * @enum {string}
             */
            customer_type: "all" | "new" | "existing";
            /**
             * @description Whether the coupon is currently active
             * @example true
             */
            is_active: boolean;
            /**
             * @description Maximum number of times this coupon can be used
             * @example 100
             */
            max_uses: number | null;
            /**
             * @description Maximum quantity allowed per use
             * @example 5
             */
            max_quantity_per_use: number | null;
            /**
             * @description Current number of times this coupon has been used
             * @example 25
             */
            current_uses: number;
            /**
             * @description Usage frequency limit type
             * @example total
             * @enum {string}
             */
            usage_frequency_limit: "total" | "per_customer" | "per_customer_per_product";
            /**
             * @description Usage limit value (for per_customer limits)
             * @example 1
             */
            usage_limit_value: number | null;
            /**
             * @description When the coupon expires
             * @example 2024-12-31T23:59:59Z
             */
            expires_at: string | null;
            /**
             * @description When the coupon becomes valid
             * @example 2024-01-01T00:00:00Z
             */
            valid_from: string | null;
            /**
             * @description Coupon description
             * @example 20% off all products
             */
            description: string | null;
            /**
             * @description Scope of the coupon
             * @example organization_wide
             * @enum {string}
             */
            scope_type: "organization_wide" | "specific_products" | "specific_prices";
            /**
             * @description Product types this coupon applies to
             * @example [
             *       "one_time",
             *       "recurring"
             *     ]
             */
            applies_to_product_types: string[] | null;
            /**
             * @description Environment (test or live)
             * @example live
             * @enum {string}
             */
            environment: "test" | "live";
            /**
             * @description When the coupon was created
             * @example 2024-01-15T10:30:00Z
             */
            created_at: string;
            /**
             * @description When the coupon was last updated
             * @example 2024-01-15T10:30:00Z
             */
            updated_at: string;
        };
        CheckoutSessionResponseDto: {
            /** @example true */
            allow_coupon_code: boolean;
            /** @example true */
            allow_quantity: boolean;
            /** @example 123 */
            amount: number;
            /** @example string */
            cancel_url: string;
            /** @example string */
            checkout_session_id: string;
            /** @example https://checkout.lomi.africa/checkout/123e4567-e89b-12d3-a456-426614174000 */
            checkout_url: string;
            /** @example string */
            created_at: string;
            /** @example string */
            created_by: string;
            /** @example string */
            currency_code: string;
            /** @example string */
            customer_email: string;
            /** @example string */
            customer_id: string;
            /** @example string */
            customer_name: string;
            /** @example string */
            customer_phone: string;
            /** @example string */
            description: string;
            /** @example string */
            environment: string;
            /** @example string */
            expires_at: string;
            /** @example string */
            installment_plan_id: string;
            /** @example true */
            is_pos: boolean;
            /** @example true */
            is_spi: boolean;
            /** @example {} */
            metadata: Record<string, never>;
            /** @example string */
            organization_id: string;
            /** @example string */
            payment_link_id: string;
            /** @example string */
            payment_request_id: string;
            /** @example string */
            price_id: string;
            /** @example string */
            product_id: string;
            /** @example {} */
            qr_code_data: Record<string, never>;
            /** @example string */
            qr_code_type: string;
            /** @example 123 */
            quantity: number;
            /** @example true */
            require_billing_address: boolean;
            /** @example true */
            require_email: boolean;
            /** @example false */
            require_phone: boolean;
            /** @example string */
            spi_account_number: string;
            /** @example string */
            spi_qr_code_id: string;
            /** @example string */
            status: string;
            /** @example string */
            subscription_id: string;
            /** @example string */
            success_url: string;
            /** @example string */
            title: string;
            /** @example string */
            updated_at: string;
        };
        PaymentLinkResponseDto: {
            /** @example true */
            allow_coupon_code: boolean;
            /** @example true */
            allow_quantity: boolean;
            /** @example 123 */
            amount: number;
            /** @example string */
            cancel_url: string;
            /** @example string */
            created_at: string;
            /** @example string */
            created_by: string;
            /** @example string */
            currency_code: string;
            /** @example string */
            description: string;
            /** @example string */
            environment: string;
            /** @example string */
            expires_at: string;
            /** @example true */
            is_active: boolean;
            /** @example string */
            link_id: string;
            /** @example string */
            link_type: string;
            /** @example {} */
            metadata: Record<string, never>;
            /** @example string */
            organization_id: string;
            /** @example string */
            price_id: string;
            /** @example string */
            product_id: string;
            /** @example 123 */
            quantity: number;
            /** @example true */
            require_billing_address: boolean;
            /** @example true */
            require_email: boolean;
            /** @example false */
            require_phone: boolean;
            /** @example string */
            success_url: string;
            /** @example string */
            title: string;
            /** @example string */
            updated_at: string;
            /** @example string */
            url: string;
        };
        CreatePayoutResponseDto: {
            /** @example true */
            success: boolean;
            /** @example payout-uuid */
            payout_id?: string;
            /**
             * @example withdrawal
             * @enum {string}
             */
            kind?: "withdrawal" | "beneficiary";
            /** @example processing */
            status?: string;
            message?: string;
        };
        UpdateRadarSettingsDto: {
            enabled?: boolean;
            /** @enum {string} */
            mode?: "monitor" | "block";
            stripe_radar_passthrough?: boolean;
        };
        WebhookDeliveryLogResponseDto: {
            /**
             * @description Unique log identifier
             * @example 123e4567-e89b-12d3-a456-426614174000
             */
            log_id: string;
            /**
             * @description Webhook ID
             * @example 789e0123-e89b-12d3-a456-426614174000
             */
            webhook_id: string;
            /**
             * @description Organization ID
             * @example 456e7890-e89b-12d3-a456-426614174000
             */
            organization_id: string;
            /**
             * @description Event type that triggered the webhook
             * @example transaction.completed
             */
            event_type: string;
            /**
             * @description Webhook payload sent
             * @example {
             *       "transaction_id": "123e4567-e89b-12d3-a456-426614174000",
             *       "amount": 10000
             *     }
             */
            payload: Record<string, never>;
            /**
             * @description HTTP response status code
             * @example 200
             */
            response_status: number | null;
            /**
             * @description Response body from the webhook endpoint
             * @example {"status":"success"}
             */
            response_body: string | null;
            /**
             * @description Attempt number (for retries)
             * @example 1
             */
            attempt_number: number;
            /**
             * @description Whether the webhook delivery was successful
             * @example true
             */
            success: boolean;
            /**
             * @description IP address of the webhook endpoint
             * @example 192.168.1.1
             */
            ip_address: string | null;
            /**
             * @description User agent from the webhook response
             * @example Mozilla/5.0
             */
            user_agent: string | null;
            /**
             * @description Request headers sent with the webhook
             * @example {
             *       "content-type": "application/json"
             *     }
             */
            headers: Record<string, never> | null;
            /**
             * @description Request duration in milliseconds
             * @example 150
             */
            request_duration_ms: number | null;
            /**
             * @description SPI transaction ID (for SPI webhooks)
             * @example SPI-TX-123456
             */
            spi_tx_id: string | null;
            /**
             * @description Payer account number (for SPI webhooks)
             * @example 221771234567
             */
            compte_payeur: string | null;
            /**
             * @description Payee account number (for SPI webhooks)
             * @example 221779876543
             */
            compte_paye: string | null;
            /**
             * @description Transaction amount in centimes (for SPI webhooks)
             * @example 1000000
             */
            amount: number | null;
            /**
             * @description SPI webhook event code (for SPI webhooks)
             * @example PAIEMENT_RECU
             */
            spi_event_code: string | null;
            /**
             * @description When the webhook was delivered
             * @example 2024-01-15T10:30:00Z
             */
            created_at: string;
        };
        LogEntryResponseDto: {
            /** @example 123e4567-e89b-12d3-a456-426614174000 */
            id: string;
            /**
             * @example api_request
             * @enum {string}
             */
            type: "api_request" | "api_error" | "webhook_delivery" | "activity";
            /** @example 2024-01-15T10:30:00Z */
            timestamp: string;
            /**
             * @example info
             * @enum {string}
             */
            severity: "info" | "warning" | "error" | "critical";
            /** @example 200 */
            status_code: number | null;
            /** @example GET */
            method: string | null;
            /** @example /transactions */
            endpoint: string | null;
            /** @example Payment not found */
            message: string | null;
            /** @example true */
            success: boolean | null;
            /** @example req_abc123 */
            request_id: string | null;
            /** @description Type-specific payload */
            data: Record<string, never>;
        };
        LogListResponseDto: {
            /** @example list */
            object: string;
            /**
             * @example api_request
             * @enum {string}
             */
            type: "api_request" | "api_error" | "webhook_delivery" | "activity";
            data: components["schemas"]["LogEntryResponseDto"][];
            /** @example 42 */
            total_count: number;
            /** @example 25 */
            limit: number;
            /** @example 0 */
            offset: number;
            /** @example true */
            has_more: boolean;
        };
        WebhookResponseDto: {
            /** @example string */
            authorized_events: string;
            /** @example string */
            created_at: string;
            /** @example string */
            created_by: string;
            /** @example string */
            deleted_at: string;
            /** @example string */
            environment: string;
            /** @example true */
            is_active: boolean;
            /** @example {} */
            last_payload: Record<string, never>;
            /** @example string */
            last_response_body: string;
            /** @example 123 */
            last_response_status: number;
            /** @example string */
            last_triggered_at: string;
            /** @example {} */
            metadata: Record<string, never>;
            /** @example string */
            organization_id: string;
            /** @example 123 */
            retry_count: number;
            /** @example string */
            spi_event_types: string;
            /** @example true */
            supports_spi: boolean;
            /** @example string */
            updated_at: string;
            /** @example string */
            url: string;
            /** @example string */
            verification_token: string;
            /** @example string */
            webhook_id: string;
        };
        CustomerDto: {
            /** @example Jane Doe */
            name: string;
            /** @example jane@example.com */
            email?: string;
            /**
             * @description E.164 phone number required for mobile-money rails
             * @example +2250707070707
             */
            phoneNumber: string;
        };
        CreateWaveChargeDto: {
            /**
             * @description Amount in XOF (minimum 100)
             * @example 1000
             */
            amount: number;
            /**
             * @description Must be XOF for Wave
             * @example XOF
             */
            currency: string;
            /** Format: uuid */
            organizationId?: string;
            /** Format: uuid */
            merchantId?: string;
            customer: components["schemas"]["CustomerDto"];
            /** @example Payment for Service */
            description?: string;
            /** @example https://your-site.com/success */
            successUrl?: string;
            /** @example https://your-site.com/error */
            errorUrl?: string;
            /** @enum {string} */
            environment?: "live" | "test";
        };
        ChargeNextActionDto: {
            /**
             * @description How the client should proceed: open a URL, wait for webhook/status, or confirm with client_secret.
             * @enum {string}
             */
            type: "redirect" | "await_webhook" | "client_secret";
            /** @description Present when type is redirect. */
            url?: string;
            /** @description Present when type is await_webhook (e.g. PENDING, completed). */
            status?: string;
            /** @description Present when type is client_secret. */
            client_secret?: string;
        };
        WaveChargeResponseDto: {
            /** @example a1b2c3d4-e5f6-7890-abcd-ef1234567890 */
            transactionId?: string;
            /** @example a1b2c3d4-e5f6-7890-abcd-ef1234567890 */
            transaction_id?: string;
            /**
             * @description URL to open Wave so the customer can approve the payment.
             * @example https://pay.wave.com/c/abc123
             */
            wave_launch_url?: string;
            /** @example https://checkout.lomi.africa/checkout/wave/abc123 */
            checkout_url?: string;
            /** @example pending */
            status?: string;
            /** @description Nested session data when returned by the edge function. */
            data?: {
                [key: string]: unknown;
            };
            next_action?: components["schemas"]["ChargeNextActionDto"];
        };
        CreateMtnChargeDto: {
            /** @example 1000 */
            amount: number;
            /** @example XOF */
            currency: string;
            /** Format: uuid */
            organizationId?: string;
            /** Format: uuid */
            merchantId?: string;
            customer: components["schemas"]["CustomerDto"];
            /** @example Payment for Service */
            description?: string;
            /** @example CI */
            countryCode?: string;
            /** Format: uuid */
            productId?: string;
            /** Format: uuid */
            subscriptionId?: string;
            /**
             * @default 1
             * @example 1
             */
            quantity: number;
        };
        MtnChargeDataDto: {
            /** @example a1b2c3d4-e5f6-7890-abcd-ef1234567890 */
            transaction_id: string;
            /** @example ext_abc123 */
            external_id: string;
            /** @example 7c9e6679-7425-40de-944b-e07fc1f90ae7 */
            reference_id?: string | null;
            /**
             * @description Test keys return `completed` immediately; live returns `PENDING` until the customer approves.
             * @example PENDING
             */
            status: string;
        };
        MtnChargeResponseDto: {
            /** @example true */
            success: boolean;
            data: components["schemas"]["MtnChargeDataDto"];
            next_action?: components["schemas"]["ChargeNextActionDto"];
        };
        CreateSwitchChargeDto: {
            /**
             * @description Amount in XOF francs
             * @example 10000
             */
            amount: number;
            /**
             * @example XOF
             * @enum {string}
             */
            currency_code?: "XOF";
            /** @example 4221941234569109 */
            pan: string;
            /**
             * @description MM/YY or YYMM
             * @example 06/25
             */
            expiry: string;
            /** @example 123 */
            cvv: string;
            /** @example 550e8400-e29b-41d4-a716-446655440000 */
            customer_id?: string;
            /** @example john@example.com */
            customer_email?: string;
            /** @example John Doe */
            customer_name?: string;
            /** @example +221771234567 */
            customer_phone?: string;
            description?: string;
            payment_reference?: string;
            product_id?: string;
            subscription_id?: string;
            checkout_session_id?: string;
            /** @default 1 */
            quantity: number;
            metadata?: {
                [key: string]: unknown;
            };
            /** @description Customer IP for EComIp */
            ecom_ip?: string;
        };
        SwitchChargeResponseDto: {
            success: boolean;
            /** @enum {string} */
            status?: "approved" | "declined" | "redirect_3ds" | "retry_other_rail";
            system_reference?: number;
            merchant_reference?: string;
            action_code?: string;
            message?: string;
            auth_code?: string;
            transaction_id?: string;
            next_action?: components["schemas"]["ChargeNextActionDto"];
        };
        CreateCardChargeDto: {
            /**
             * @description Amount to charge in the original currency
             * @example 10000
             */
            amount: number;
            /**
             * @description Currency code
             * @example XOF
             * @enum {string}
             */
            currency_code?: "XOF" | "USD" | "EUR";
            /**
             * @description Backward-compatible alias for currency_code. Use currency_code in new integrations.
             * @example XOF
             * @enum {string}
             */
            currency?: "XOF" | "USD" | "EUR";
            /**
             * @description Internal customer UUID (v4). Alternative: send customer_email + customer_name to create/find a customer.
             * @example 550e8400-e29b-41d4-a716-446655440000
             */
            customer_id?: string;
            /**
             * @description Customer email — required together with customer_name when customer_id is omitted.
             * @example john@example.com
             */
            customer_email?: string;
            /**
             * @description Customer display name — required together with customer_email when customer_id is omitted.
             * @example John Doe
             */
            customer_name?: string;
            /**
             * @description Customer phone number
             * @example +221771234567
             */
            customer_phone?: string;
            /**
             * @description Description shown in payment providers and logs
             * @example Invoice #INV-2026-001
             */
            description?: string;
            /**
             * @description Reference included in metadata for reconciliation
             * @example INV-2026-001
             */
            payment_reference?: string;
            /**
             * @description Optional product UUID for metadata and reconciliation
             * @example 550e8400-e29b-41d4-a716-446655440002
             */
            product_id?: string;
            /**
             * @description Optional subscription UUID for metadata and reconciliation
             * @example 550e8400-e29b-41d4-a716-446655440003
             */
            subscription_id?: string;
            /**
             * @description Optional quantity for internal reconciliation
             * @default 1
             * @example 1
             */
            quantity: number;
            /**
             * @description Custom metadata merged into provider metadata
             * @example {
             *       "order_id": "ORD-12345"
             *     }
             */
            metadata?: {
                [key: string]: unknown;
            };
            /**
             * @description Optional Payment Element theme for client-side card UI: `light`, `dark`, or `flat`.
             * @example light
             * @enum {string}
             */
            appearance_theme?: "light" | "dark" | "flat";
            /**
             * @description Optional Payment Element border radius (px) returned for client-side rendering.
             * @example 6
             */
            appearance_border_radius?: number;
            /**
             * @description Optional Payment Element billing address collection mode. Use `never` to hide country/address selector in Payment Element UI.
             * @example never
             * @enum {string}
             */
            appearance_billing_address?: "auto" | "never";
        };
        CardChargeAppearanceDto: {
            /** @example light */
            theme?: string;
            /** @example 6 */
            border_radius?: number;
            /** @example never */
            billing_address?: string;
        };
        CardChargeDataDto: {
            /** @example pi_3QxYk6... */
            id: string;
            /** @example pi_3QxYk6..._secret_... */
            client_secret: string;
            /** @example 152 */
            amount: number;
            /** @example eur */
            currency: string;
            /** @example 10000 */
            original_amount: number;
            /** @example XOF */
            original_currency: string;
            /** @example requires_payment_method */
            status: string;
            appearance?: components["schemas"]["CardChargeAppearanceDto"];
        };
        CardChargeResponseDto: {
            /** @example true */
            success: boolean;
            data: components["schemas"]["CardChargeDataDto"];
            next_action?: components["schemas"]["ChargeNextActionDto"];
        };
        MeterResponseDto: {
            meter_id: string;
            organization_id: string;
            product_id?: string | null;
            name: string;
            filter: {
                [key: string]: unknown;
            };
            aggregation: {
                [key: string]: unknown;
            };
            is_active: boolean;
            created_at: string;
            updated_at: string;
        };
        MeterBalanceResponseDto: {
            balance_id: string;
            meter_id: string;
            customer_id: string;
            consumed_units: number;
            credited_units: number;
            balance: number;
            last_event_id?: string | null;
            updated_at: string;
        };
        UsageEventListItemDto: {
            event_id: string;
            transaction_id: string;
            code: string;
            customer_id: string;
            subscription_id?: string | null;
            meter_id?: string | null;
            quantity: number;
            /** @enum {string} */
            processing_status: "pending" | "processed" | "failed";
            error_message?: string | null;
            occurred_at: string;
            created_at: string;
            total_count?: number;
        };
        UsageEventResponseDto: {
            event_id: string;
            /** @enum {string} */
            status: "pending" | "processed" | "failed";
            meter_id?: string;
            subscription_id?: string;
            quantity_applied?: number;
        };
        UsageSubscriptionResponseDto: {
            subscription_id: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    AccountsController_getBalance: {
        parameters: {
            query?: {
                /** @description Filtrer par code devise (XOF, USD, EUR) */
                currency?: "XOF" | "USD" | "EUR";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Informations de solde */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountBalanceResponseDto"][];
                };
            };
        };
    };
    AccountsController_getBalanceBreakdown: {
        parameters: {
            query?: {
                /** @description Devise cible pour la conversion (XOF, USD, EUR) */
                target_currency?: "XOF" | "USD" | "EUR";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Détail des soldes avec conversion */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BalanceBreakdownResponseDto"][];
                };
            };
        };
    };
    AccountsController_checkAvailableBalance: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Résultat de la vérification de solde */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description Indique si des fonds sont disponibles */
                        has_sufficient_balance?: boolean;
                        /** @description Solde disponible actuel */
                        available_balance?: number;
                    };
                };
            };
        };
    };
    OrganizationsController_findAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Détails de l'organisation */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrganizationResponseDto"][];
                };
            };
        };
    };
    OrganizationsController_getMetrics: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Indicateurs de l'organisation */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrganizationMetricsResponseDto"];
                };
            };
        };
    };
    OrganizationsController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description L'organisation */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrganizationResponseDto"];
                };
            };
            /** @description Organisation introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MerchantsController_getDetails: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Merchant UUID */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MerchantResponseDto"];
                };
            };
            /** @description Merchant ID mismatch */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Merchant not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MerchantsController_getMrr: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Merchant UUID */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MerchantMrrResponseDto"];
                };
            };
        };
    };
    MerchantsController_getArr: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Merchant UUID */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MerchantArrResponseDto"];
                };
            };
        };
    };
    MerchantsController_getBalance: {
        parameters: {
            query: {
                currency_code: "XOF" | "USD" | "EUR";
            };
            header?: never;
            path: {
                /** @description Merchant UUID */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MerchantBalanceResponseDto"];
                };
            };
            /** @description Missing currency_code */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProvidersController_findAll: {
        parameters: {
            query?: {
                /** @description Filter by provider. Use CARD for card payments (Visa, Mastercard, Apple Pay, Google Pay). */
                provider_code?: "CARD" | "WAVE" | "MTN" | "SPI";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Provider settings */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomerSubscriptionsController_findAll: {
        parameters: {
            query?: {
                offset?: number;
                limit?: number;
                status?: unknown;
                customer_id?: unknown;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomerSubscriptionsController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Subscription UUID */
                subscription_id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomerSubscriptionsController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomerSubscriptionsController_update: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SubscriptionsController_findAll: {
        parameters: {
            query?: {
                /** @description Nombre d'éléments par page */
                pageSize?: number;
                /** @description Numéro de page */
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste des abonnements */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubscriptionResponseDto"][];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SubscriptionsController_findByCustomer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID du client */
                customerId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste des abonnements du client */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubscriptionResponseDto"][];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Client introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SubscriptionsController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID de l’abonnement */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Détails de l’abonnement */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubscriptionResponseDto"];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Abonnement introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SubscriptionsController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID de l’abonnement */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Abonnement mis à jour */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubscriptionResponseDto"];
                };
            };
        };
    };
    SubscriptionsController_uncancel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID de l’abonnement */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubscriptionResponseDto"];
                };
            };
        };
    };
    SubscriptionsController_changePlan: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID de l’abonnement */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    price_id: string;
                };
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubscriptionResponseDto"];
                };
            };
        };
    };
    SubscriptionsController_cancel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID de l’abonnement */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    cancel_at_period_end?: boolean;
                    cancellation_reason?: string;
                };
            };
        };
        responses: {
            /** @description Abonnement résilié avec succès */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubscriptionResponseDto"];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Abonnement introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TransactionsController_findAll: {
        parameters: {
            query?: {
                /** @description Uniquement les transactions points de vente (TPV) */
                isPos?: boolean;
                /** @description Jusqu'à cette date (format ISO 8601) */
                endDate?: string;
                /** @description À partir de cette date (format ISO 8601) */
                startDate?: string;
                /** @description Nombre d'éléments par page */
                pageSize?: number;
                /** @description Numéro de page */
                page?: number;
                /** @description Filtrer par code de moyen de paiement (séparés par des virgules pour plusieurs valeurs) */
                paymentMethod?: string;
                /** @description Filtrer par code devise (séparés par des virgules pour plusieurs valeurs) */
                currency?: string;
                /** @description Filtrer par type de transaction (séparés par des virgules pour plusieurs valeurs) */
                type?: string;
                /** @description Filtrer par statut de transaction (séparés par des virgules pour plusieurs valeurs) */
                status?: string;
                /** @description Filtrer par code de fournisseur de paiement */
                provider?: string;
            };
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste des transactions */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransactionResponseDto"][];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TransactionsController_findOne: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path: {
                /** @description UUID de la transaction */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Détails de la transaction */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransactionResponseDto"];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Transaction introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomersController_findAll: {
        parameters: {
            query?: {
                /** @description Nombre d'éléments par page */
                pageSize?: number;
                /** @description Numéro de page */
                page?: number;
                /** @description Filtrer par activité (active = au moins une transaction, inactive = aucune transaction) */
                status?: "active" | "inactive" | "all";
                /** @description Filtrer par type de client */
                type?: "business" | "individual" | "all";
                /** @description Recherche par nom ou e-mail */
                search?: string;
            };
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste paginée de clients */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        customers?: components["schemas"]["CustomerResponseDto"][];
                        pagination?: {
                            /** @example 1 */
                            page?: number;
                            /** @example 50 */
                            pageSize?: number;
                            /** @example 100 */
                            totalCount?: number;
                            /** @example 2 */
                            totalPages?: number;
                        };
                    };
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomersController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @example Jane Doe */
                    name: string;
                    /** Format: email */
                    email?: string;
                    phone_number?: string;
                    whatsapp_number?: string;
                    country?: string;
                    city?: string;
                    address?: string;
                    postal_code?: string;
                    is_business?: boolean;
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        responses: {
            /** @description Client créé avec succès */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomerResponseDto"];
                };
            };
            /** @description Données d'entrée invalides */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomersController_findOne: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path: {
                /** @description UUID du client */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Détails du client */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomerResponseDto"];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Client introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomersController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID du client */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Client supprimé avec succès */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example Client supprimé avec succès */
                        message?: string;
                    };
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Client introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomersController_update: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path: {
                /** @description UUID du client */
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name?: string;
                    /** Format: email */
                    email?: string;
                    phone_number?: string;
                    whatsapp_number?: string;
                    country?: string;
                    city?: string;
                    address?: string;
                    postal_code?: string;
                    is_business?: boolean;
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        responses: {
            /** @description Client mis à jour avec succès */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomerResponseDto"];
                };
            };
            /** @description Données d'entrée invalides */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Client introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomersController_getPortalAudit: {
        parameters: {
            query?: {
                /** @description Filtre sur customer_portal_audit_events.event_type */
                eventType?: string;
                pageSize?: number;
                page?: number;
            };
            header?: never;
            path: {
                /** @description UUID du client */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Chronologie paginée des évènements portal */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomersController_getTransactions: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path: {
                /** @description UUID du client */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste des transactions du client */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TransactionResponseDto"][];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Client introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomersController_createPortalLaunchSession: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID du client */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": {
                    /** Format: uri */
                    return_url?: string;
                    /** @enum {string} */
                    flow_type?: "portal_home" | "subscription_cancel" | "subscription_manage";
                    /** Format: uuid */
                    flow_subscription_id?: string;
                    /** Format: uri */
                    flow_after_completion_url?: string;
                };
            };
        };
        responses: {
            /** @description Session de lancement créée */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PortalLaunchSessionResponseDto"];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Client introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PaymentRequestsController_findAll: {
        parameters: {
            query?: {
                /** @description Décalage pour la pagination */
                offset?: number;
                /** @description Nombre maximal de résultats */
                limit?: number;
                /** @description Filtrer par ID client */
                customerId?: string;
                /** @description Filtrer par statut */
                status?: "pending" | "completed" | "failed" | "expired";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste paginée de demandes */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data?: components["schemas"]["PaymentRequestResponseDto"][];
                        total?: number;
                        limit?: number;
                        offset?: number;
                    };
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PaymentRequestsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    amount: number;
                    /** @enum {string} */
                    currency_code: "XOF" | "USD" | "EUR";
                    description?: string;
                    /** Format: uuid */
                    customer_id?: string;
                    /** Format: date-time */
                    expiry_date: string;
                    payment_reference?: string;
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        responses: {
            /** @description Demande de paiement créée avec succès */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentRequestResponseDto"];
                };
            };
            /** @description Entrée invalide ou erreur de validation */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PaymentRequestsController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID de la demande */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Détails de la demande */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentRequestResponseDto"];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Demande introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    RefundsController_findAll: {
        parameters: {
            query?: {
                offset?: number;
                limit?: number;
                endDate?: string;
                startDate?: string;
                status?: string;
            };
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste des remboursements */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    RefundsController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateRefundDto"];
            };
        };
        responses: {
            /** @description Remboursement enregistré */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreateRefundResponseDto"];
                };
            };
            /** @description Entrée invalide ou type non pris en charge */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    RefundsController_findOne: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path: {
                /** @description Refund ID */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Détail du remboursement */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RefundListItemDto"];
                };
            };
        };
    };
    ProductsController_findAll: {
        parameters: {
            query?: {
                /** @description Décalage pour la pagination */
                offset?: number;
                /** @description Nombre maximal de résultats */
                limit?: number;
                /** @description Filtrer par statut actif */
                isActive?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste des produits avec prix embarqués */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductResponseDto"][];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProductsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Produit créé avec succès */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductResponseDto"];
                };
            };
            /** @description Entrée invalide ou erreur de validation */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProductsController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID du produit */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Détails du produit avec prix embarqués */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductResponseDto"];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Produit introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProductsController_addPrice: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID du produit */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Prix ajouté avec succès */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PriceResponseDto"];
                };
            };
            /** @description Entrée invalide ou nombre maximal de prix dépassé */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Produit introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ProductsController_setDefaultPrice: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID du prix */
                priceId: string;
                /** @description UUID du produit */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Prix par défaut mis à jour */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductResponseDto"];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Produit ou prix introuvable */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DiscountCouponsController_findAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste des coupons */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DiscountCouponResponseDto"][];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DiscountCouponsController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Coupon créé avec succès */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DiscountCouponResponseDto"];
                };
            };
            /** @description Données invalides ou code déjà utilisé */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DiscountCouponsController_getPerformance: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID du coupon */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Indicateurs de performance */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @example 45 */
                        total_uses?: number;
                        /** @example 25000 */
                        total_discount_amount?: number;
                        /** @example 150000 */
                        total_revenue?: number;
                        /** @example 3333.33 */
                        average_order_value?: number;
                    };
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Coupon introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DiscountCouponsController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID du coupon */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Détails du coupon */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DiscountCouponResponseDto"];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Coupon introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CheckoutSessionsController_findAll: {
        parameters: {
            query?: {
                /** @description Décalage pour la pagination */
                offset?: number;
                /** @description Nombre maximal de résultats */
                limit?: number;
                /** @description Filtrer par statut de session (valeur checkout_session_status) */
                status?: "open" | "completed" | "expired";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste des sessions de paiement */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CheckoutSessionResponseDto"][];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CheckoutSessionsController_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path?: never;
            cookie?: never;
        };
        /** @description Charge utile de session : indiquez `amount` (et champs produit optionnels) ou `line_items` pour un panier multi-produits. */
        requestBody: {
            content: {
                "application/json": {
                    /** @example 10000 */
                    amount?: number;
                    /**
                     * @example XOF
                     * @enum {string}
                     */
                    currency_code: "XOF" | "USD" | "EUR";
                    title?: string;
                    description?: string;
                    /** Format: uuid */
                    customer_id?: string;
                    /** Format: email */
                    customer_email?: string;
                    customer_name?: string;
                    customer_phone?: string;
                    customer_city?: string;
                    customer_country?: string;
                    customer_address?: string;
                    customer_postal_code?: string;
                    /** Format: uuid */
                    product_id?: string;
                    /** Format: uuid */
                    price_id?: string;
                    /** Format: uuid */
                    subscription_id?: string;
                    allow_quantity?: boolean;
                    quantity?: number;
                    /** Format: uri */
                    success_url?: string;
                    /** Format: uri */
                    cancel_url?: string;
                    allow_coupon_code?: boolean;
                    /** @description When true, show and require billing address on checkout. */
                    require_billing_address?: boolean;
                    /**
                     * @description When true, show and require customer email. Default true when unset.
                     * @default true
                     */
                    require_email?: boolean;
                    /**
                     * @description When true, show and require customer phone. Default false when unset.
                     * @default false
                     */
                    require_phone?: boolean;
                    /** @description Optional ordered checkout field schema. When provided, overrides require_* booleans. */
                    fields?: {
                        [key: string]: unknown;
                    }[];
                    /** Format: uuid */
                    payment_link_id?: string;
                    metadata?: {
                        [key: string]: unknown;
                    };
                    line_items?: {
                        /** Format: uuid */
                        price_id: string;
                        quantity?: number;
                        metadata?: {
                            [key: string]: unknown;
                        };
                    }[];
                };
            };
        };
        responses: {
            /** @description Session de paiement créée avec succès */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CheckoutSessionResponseDto"];
                };
            };
            /** @description Entrée invalide ou erreur de validation */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CheckoutSessionsController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID de la session */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Détails de la session */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CheckoutSessionResponseDto"];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Session introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PaymentLinksController_findAll: {
        parameters: {
            query?: {
                /** @description Décalage pour la pagination */
                offset?: number;
                /** @description Nombre maximal de résultats */
                limit?: number;
                /** @description Filtrer par statut actif */
                isActive?: boolean;
                /** @description Filtrer par type de lien */
                linkType?: "product" | "instant";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste paginée de liens de paiement */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data?: components["schemas"]["PaymentLinkResponseDto"][];
                        total?: number;
                        limit?: number;
                        offset?: number;
                    };
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PaymentLinksController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @enum {string} */
                    link_type: "product" | "instant";
                    title: string;
                    /** @enum {string} */
                    currency_code: "XOF" | "USD" | "EUR";
                    description?: string;
                    amount?: number;
                    /** Format: uuid */
                    product_id?: string;
                    /** Format: uuid */
                    price_id?: string;
                    allow_coupon_code?: boolean;
                    allow_quantity?: boolean;
                    /** @description When true, show and require billing address on checkout. */
                    require_billing_address?: boolean;
                    /**
                     * @description When true, show and require customer email. Default true when unset.
                     * @default true
                     */
                    require_email?: boolean;
                    /**
                     * @description When true, show and require customer phone. Default false when unset.
                     * @default false
                     */
                    require_phone?: boolean;
                    /** @description Optional ordered checkout field schema. When provided, overrides require_* booleans. */
                    fields?: {
                        [key: string]: unknown;
                    }[];
                    /** Format: date-time */
                    expires_at?: string;
                    /** Format: uri */
                    success_url?: string;
                    /** Format: uri */
                    cancel_url?: string;
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        responses: {
            /** @description Lien de paiement créé avec succès */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentLinkResponseDto"];
                };
            };
            /** @description Entrée invalide ou erreur de validation */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PaymentLinksController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID du lien de paiement */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Détails du lien */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentLinkResponseDto"];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Lien introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayoutsUnifiedController_findAll: {
        parameters: {
            query?: {
                pageSize?: number;
                page?: number;
                endDate?: string;
                startDate?: string;
                status?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste des virements */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayoutsUnifiedController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Virement initié */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatePayoutResponseDto"];
                };
            };
            /** @description Entrée invalide ou rail non pris en charge */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PayoutsUnifiedController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Payout ID */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Détail du virement */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DisputesController_findAll: {
        parameters: {
            query?: {
                pageSize?: number;
                page?: number;
                endDate?: string;
                startDate?: string;
                status?: string;
            };
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste des litiges */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    DisputesController_findOne: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path: {
                /** @description Dispute ID */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Détail du litige */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    RadarController_listAssessments: {
        parameters: {
            query?: {
                pageSize?: number;
                page?: number;
                endDate?: string;
                startDate?: string;
                rail?: "card" | "mtn" | "wave";
                decision?: "allow" | "flag" | "block";
            };
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Risk assessments */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    RadarController_findOne: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path: {
                /** @description Risk assessment ID */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    RadarController_getSettings: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    RadarController_updateSettings: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateRadarSettingsDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SettlementsController_findAll: {
        parameters: {
            query?: {
                pageSize?: number;
                page?: number;
                currency?: string;
                end_date?: string;
                start_date?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Settlement periods */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    SettlementsController_findTransactions: {
        parameters: {
            query?: {
                pageSize?: number;
                page?: number;
            };
            header?: never;
            path: {
                /** @description Settlement id, format {currency}:{YYYY-MM-DD} */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Transactions in settlement */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebhookDeliveryLogsController_findAll: {
        parameters: {
            query: {
                /** @description Nombre de journaux à ignorer (pagination) */
                offset?: number;
                /** @description Nombre maximal de journaux */
                limit?: number;
                /** @description Uniquement les livraisons en échec */
                failedOnly?: boolean;
                /** @description Uniquement les livraisons réussies */
                successOnly?: boolean;
                /** @description Filtrer par identifiant de webhook */
                webhookId: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste des journaux de livraison */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WebhookDeliveryLogResponseDto"][];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebhookDeliveryLogsController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID du journal */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Détails du journal de livraison */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WebhookDeliveryLogResponseDto"];
                };
            };
            /** @description Clé API invalide ou manquante */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Journal introuvable ou accès refusé */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    LogsController_findAll: {
        parameters: {
            query: {
                /** @description Filter activity logs by event type */
                event?: string;
                /** @description Only failed webhook deliveries */
                failed?: boolean;
                /** @description Only successful webhook deliveries */
                success?: boolean;
                /** @description Filter webhook_delivery logs by webhook ID */
                webhook_id?: string;
                severity?: "info" | "warning" | "error" | "critical";
                /** @description Comma-separated HTTP status codes (api_request, api_error). Example: 400,500 */
                status?: string;
                /** @description ISO 8601 end timestamp (inclusive) */
                end_date?: string;
                /** @description ISO 8601 start timestamp (inclusive) */
                start_date?: string;
                offset?: number;
                limit?: number;
                /** @description Log stream to query */
                type: "api_request" | "api_error" | "webhook_delivery" | "activity";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Paginated log list */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LogListResponseDto"];
                };
            };
            /** @description Invalid query parameters */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Invalid or missing API key */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    LogsController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Log entry UUID */
                id: string;
                type: "api_request" | "api_error" | "webhook_delivery" | "activity";
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Log entry details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LogEntryResponseDto"];
                };
            };
            /** @description Invalid or missing API key */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Log not found or access denied */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebhooksController_findAll: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Liste des webhooks */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WebhookResponseDto"][];
                };
            };
        };
    };
    WebhooksController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Webhook créé */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebhooksController_test: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Webhook UUID */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebhooksController_retryDelivery: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Delivery log UUID */
                logId: unknown;
                /** @description Webhook UUID */
                webhookId: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebhooksController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Le webhook */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WebhookResponseDto"];
                };
            };
        };
    };
    WebhooksController_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Webhook UUID */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebhooksController_update: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: uri */
                    url?: string;
                    is_active?: boolean;
                    authorized_events?: string[];
                    metadata?: {
                        [key: string]: unknown;
                    };
                };
            };
        };
        responses: {
            /** @description Webhook mis à jour avec succès */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WebhookResponseDto"];
                };
            };
        };
    };
    ChargesController_createWaveCharge: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateWaveChargeDto"];
            };
        };
        responses: {
            /** @description Wave charge initiated */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WaveChargeResponseDto"];
                };
            };
            /** @description Invalid input or Wave API error */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ChargesController_createMtnCharge: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateMtnChargeDto"];
            };
        };
        responses: {
            /** @description MTN charge initiated */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MtnChargeResponseDto"];
                };
            };
        };
    };
    ChargesController_createSwitchCharge: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateSwitchChargeDto"];
            };
        };
        responses: {
            /** @description Switch charge created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SwitchChargeResponseDto"];
                };
            };
        };
    };
    ChargesController_createCardCharge: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCardChargeDto"];
            };
        };
        responses: {
            /** @description Card charge created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CardChargeResponseDto"];
                };
            };
        };
    };
    ChargesController_getCardCharge: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path: {
                /** @description Card payment id (pi_...) */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Card charge */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CardChargeResponseDto"];
                };
            };
        };
    };
    ChargesController_cancelCardCharge: {
        parameters: {
            query?: never;
            header?: {
                /** @description Optional lomi. Network account id (`acct_...`). When present, the API key acts as the Operator and the request targets the connected Member Account. */
                "Lomi-Account"?: string;
            };
            path: {
                /** @description Card payment id (pi_...) */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Card charge cancelled */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    MetersController_findAll: {
        parameters: {
            query?: {
                isActive?: boolean;
                productId?: unknown;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeterResponseDto"][];
                };
            };
        };
    };
    MetersController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeterResponseDto"];
                };
            };
        };
    };
    MetersController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Meter ID */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeterResponseDto"];
                };
            };
        };
    };
    MetersController_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Meter ID */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeterResponseDto"];
                };
            };
        };
    };
    MetersController_getBalance: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeterBalanceResponseDto"];
                };
            };
        };
    };
    UsageEventsController_findAll: {
        parameters: {
            query?: {
                status?: "pending" | "processed" | "failed";
                code?: unknown;
                customer_id?: unknown;
                page_size?: number;
                page?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UsageEventListItemDto"][];
                };
            };
        };
    };
    UsageEventsController_ingest: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UsageEventResponseDto"];
                };
            };
        };
    };
    UsageEventsController_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Event ID */
                id: unknown;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UsageEventListItemDto"];
                };
            };
        };
    };
    UsageEventsController_createUsageSubscription: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UsageSubscriptionResponseDto"];
                };
            };
        };
    };
    UsageBillingController_listPeriods: {
        parameters: {
            query?: {
                page_size?: number;
                page?: number;
                subscription_id?: unknown;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UsageBillingController_getSubscriptionUsage: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UsageBillingController_getRevenue: {
        parameters: {
            query: {
                end_date: unknown;
                start_date: unknown;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UsageBillingController_creditWallet: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UsageBillingController_createEntitlement: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UsageBillingController_checkEntitlement: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
