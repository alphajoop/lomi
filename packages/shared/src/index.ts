export {
  formatCurrency,
  formatCurrencyDisplay,
  formatCheckoutCurrency,
  getDisplayCurrencyCode,
  roundXofAmount,
} from "./format-currency.js";
export type { FormatCurrencyOptions } from "./format-currency.js";
export { formatCompactNumber } from "./format-number.js";
export { formatProvider } from "./format-provider.js";
export { stripHtml } from "./strip-html.js";
export {
  isValidPhoneNumber,
  formatPhoneNumber,
  stripLegacyCountryPhonePrefix,
  normalizePhoneForStripe,
  toCountryCode,
} from "./phone.js";
export type { CountryCode } from "./phone.js";
export {
  normalizeCountryName,
  isCoteDIvoire,
  countryCodeToName,
  getLocalizedCountryName,
  getCountryCodeByName,
  resolveStripeCountry,
  getBillingCountryOptions,
  getBillingCountriesWithDetectedFirst,
} from "./country.js";
export type { BillingCountryOption } from "./country.js";
export {
  formatDate,
  formatPercentage,
  formatProviderCode,
  formatPaymentMethod,
  formatNumber,
  parseNumber,
  getCurrencyPlaceholder,
  getStatusColor,
  getLocale,
  formatDateLocalized,
} from "./format-display.js";
export {
  handleRpcOperation,
  getErrorMessage,
  messageFromCatch,
  logError,
  handleSupabaseRpc,
  handleSupabaseRpcSoft,
} from "./error.js";
export type { SupabaseRpcResult, SupabaseRpcOptions } from "./error.js";
export type {
  Callable,
  ErrorInput,
  ErrorLike,
  JsonInput,
  JsonInputObject,
  JsonObject,
  JsonPrimitive,
  JsonValue,
} from "./json-value.js";
export {
  coerceCaughtError,
  errorMessage,
  isBoolean,
  isFunction,
  isJsonArray,
  isJsonObject,
  isNull,
  isNumber,
  isString,
  isUndefined,
  normalizeJsonObject,
  parseJson,
  parseJsonObject,
  readArray,
  readBoolean,
  readEnv,
  readEnvOptional,
  readNumber,
  readObject,
  readString,
  safeString,
  asJsonValue,
  validateJsonValue,
} from "./json-value.js";
export { resolveCustomerDisplayName } from "./customer-display-name.js";
export {
  mapCheckoutMethodToFeeKey,
  findProcessingFeeRate,
  calculateProcessingFeeSurcharge,
  getCheckoutHeadlineAmount,
} from "./processing-fee.js";
export type { ProcessingFeeRate } from "./processing-fee.js";
export {
  optimizeImage,
  extractStorageObjectPath,
  processStorageUrl,
} from "./image-helpers.js";
export type { OptimizeImageResize } from "./image-helpers.js";
export {
  readRequestHref,
  isSupabaseAuthTokenRequest,
  isSupabaseRefreshTokenRequest,
  isInvalidRefreshTokenResponseBody,
} from "./auth-recovery.js";
export {
  isPhoneRequiredForPayment,
  validateCheckoutContactFields,
  mergeCustomerSources,
  validateCheckoutCustomer,
  mergedToCustomerDetailsPatch,
} from "./validate-checkout-customer.js";
export type {
  CheckoutCustomFieldType,
  CheckoutCustomFieldDefinition,
  ResolvedCheckoutFormFlags,
  MergedCustomerData,
  ValidateCheckoutCustomerOptions,
  ValidateCheckoutCustomerResult,
  ValidateCheckoutContactFieldsOptions,
  CheckoutCustomerFormDetails,
  ExpressCheckoutConfirmLike,
} from "./validate-checkout-customer.js";
export type {
  WaveCheckoutSession,
  WavePaymentError,
  CreateWaveCheckoutSessionParams,
  WavePaymentStatus,
  WaveBusinessType,
  CreateWaveAggregatedMerchantParams,
  WaveAggregatedMerchant,
  WaveAggregatedMerchantResponse,
  WavePayoutStatus,
  WavePayout,
} from "./wave-types.js";

export {
  CHECKOUT_CURRENCY_CODES,
  isCheckoutCurrencyCode,
  parseCheckoutCurrencyCode,
} from "./currency-code.js";
export type { CheckoutCurrencyCode } from "./currency-code.js";
export {
  MONEY_MAX_MINOR,
  MONEY_MIN_CHARGEABLE_MINOR,
  assertAmountMinor,
  currencyExponent,
  isAmountMinor,
  majorToMinorUnits,
  minorToMajorUnits,
  toLedgerMajor,
  fromLedgerMajor,
} from "./money.js";
export type {
  AssertAmountMinorOptions,
  AssertAmountMinorResult,
} from "./money.js";
export {
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
} from "./local-storage.js";
export { Cookies, LocalStorageKeys } from "./browser-keys.js";
export { createBrowserSession } from "./browser-session.js";
export type {
  BrowserSessionAudience,
  BrowserSessionTokens,
} from "./browser-session.js";
export { getPayButtonForeground } from "./button-contrast.js";
