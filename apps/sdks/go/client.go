// AUTO-GENERATED — public merchant allowlist
package lomi

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
)

type Client struct {
	APIKey     string
	BaseURL    string
	HTTPClient *http.Client
	Accounts *AccountsService
	Charges *ChargesService
	CheckoutSessions *CheckoutSessionsService
	Customers *CustomersService
	DiscountCoupons *DiscountCouponsService
	Disputes *DisputesService
	Logs *LogsService
	Merchants *MerchantsService
	Meters *MetersService
	Organization *OrganizationService
	Organizations *OrganizationsService
	PaymentLinks *PaymentLinksService
	PaymentRequests *PaymentRequestsService
	Payouts *PayoutsService
	Products *ProductsService
	Providers *ProvidersService
	Refunds *RefundsService
	RiskAssessments *RiskAssessmentsService
	Settlements *SettlementsService
	Subscriptions *SubscriptionsService
	Transactions *TransactionsService
	UsageBilling *UsageBillingService
	UsageEvents *UsageEventsService
	UsageSubscriptions *UsageSubscriptionsService
	WebhookDeliveryLogs *WebhookDeliveryLogsService
	Webhooks *WebhooksService
}

func NewClient(apiKey string, opts ...ClientOption) *Client {
	c := &Client{
		APIKey:     apiKey,
		BaseURL:    DefaultBaseURL,
		HTTPClient: http.DefaultClient,
	}
	for _, opt := range opts {
		opt(c)
	}
	c.Accounts = &AccountsService{client: c}
	c.Charges = &ChargesService{client: c}
	c.CheckoutSessions = &CheckoutSessionsService{client: c}
	c.Customers = &CustomersService{client: c}
	c.DiscountCoupons = &DiscountCouponsService{client: c}
	c.Disputes = &DisputesService{client: c}
	c.Logs = &LogsService{client: c}
	c.Merchants = &MerchantsService{client: c}
	c.Meters = &MetersService{client: c}
	c.Organization = &OrganizationService{client: c}
	c.Organizations = &OrganizationsService{client: c}
	c.PaymentLinks = &PaymentLinksService{client: c}
	c.PaymentRequests = &PaymentRequestsService{client: c}
	c.Payouts = &PayoutsService{client: c}
	c.Products = &ProductsService{client: c}
	c.Providers = &ProvidersService{client: c}
	c.Refunds = &RefundsService{client: c}
	c.RiskAssessments = &RiskAssessmentsService{client: c}
	c.Settlements = &SettlementsService{client: c}
	c.Subscriptions = &SubscriptionsService{client: c}
	c.Transactions = &TransactionsService{client: c}
	c.UsageBilling = &UsageBillingService{client: c}
	c.UsageEvents = &UsageEventsService{client: c}
	c.UsageSubscriptions = &UsageSubscriptionsService{client: c}
	c.WebhookDeliveryLogs = &WebhookDeliveryLogsService{client: c}
	c.Webhooks = &WebhooksService{client: c}
	return c
}

func (c *Client) doRequest(method, path string, query url.Values, body interface{}) ([]byte, error) {
	baseURL, err := url.Parse(c.BaseURL)
	if err != nil {
		return nil, err
	}
	ref, err := url.Parse(path)
	if err != nil {
		return nil, err
	}
	u := baseURL.ResolveReference(ref).String()
	if query != nil {
		u += "?" + query.Encode()
	}
	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewReader(jsonBody)
	}
	req, err := http.NewRequest(method, u, reqBody)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-API-KEY", c.APIKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		return nil, &Error{StatusCode: resp.StatusCode, Message: string(respBody)}
	}
	return respBody, nil
}
